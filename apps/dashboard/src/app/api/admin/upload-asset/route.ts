import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

// Max 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

export async function POST(req: Request) {
    try {
        // 1. Auth & Admin Check
        const headersObj = await headers();
        const { session } = await getAuth(headersObj);

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userIsSuperAdmin = session.userId.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();

        if (!userIsSuperAdmin) {
            return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
        }

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 3. Validate File
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`
            }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
            }, { status: 400 });
        }

        // 4. Generate Unique Filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop() || 'png';
        const filename = `nft-pass-${timestamp}-${randomStr}.${extension}`;

        // 5. Save File (Attempt Public Directory first, fallback to Data URI)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let publicUrl = '';

        try {
            // Ensure directory exists
            const uploadDir = path.join(process.cwd(), "public", "assets", "nft-passes");
            await mkdir(uploadDir, { recursive: true });

            const filePath = path.join(uploadDir, filename);
            await writeFile(filePath, buffer);

            // Return Public URL if FS write succeeds
            publicUrl = `/assets/nft-passes/${filename}`;
            console.log(`✅ Asset saved to disk: ${publicUrl}`);

        } catch (fsError: any) {
            console.warn(`⚠️ Disk write failed (Read-only FS?): ${fsError.message}. Falling back to Data URI.`);

            // Fallback: Convert to Base64 Data URI
            const base64 = buffer.toString('base64');
            const mimeType = file.type || 'image/png';
            publicUrl = `data:${mimeType};base64,${base64}`;

            console.log(`✅ Asset converted to Data URI (${publicUrl.substring(0, 50)}...)`);
        }

        // 6. Return Public URL (or Data URI)
        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename
        });

    } catch (error) {
        console.error("Upload Asset Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}

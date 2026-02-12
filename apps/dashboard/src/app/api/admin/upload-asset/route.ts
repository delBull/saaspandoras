import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { client } from "@/lib/thirdweb-client";
import { upload } from "thirdweb/storage";

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

        // 5. Save File
        // Strategy:
        // - Local Dev: Try local filesystem (fast, free)
        // - Production/Fallback: Upload to IPFS via Thirdweb (persistent, decentralized)

        // Define upload directory and file path
        const uploadDir = path.join(process.cwd(), "public", "assets", "nft-passes");
        const filePath = path.join(uploadDir, filename);

        let publicUrl = '';

        // Try to save to disk (works in local dev, fails in some serverless envs)
        try {
            // Only attempt FS write if explicitly enabled or in dev
            if (process.env.NODE_ENV !== 'development') {
                throw new Error("Production environment: skipping local FS write");
            }

            const uploadDir = path.join(process.cwd(), "public", "assets", "nft-passes");
            const filePath = path.join(uploadDir, filename);

            await mkdir(uploadDir, { recursive: true });

            // We need to write the file buffer
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            await writeFile(filePath, buffer);

            publicUrl = `/assets/nft-passes/${filename}`;
            console.log(`✅ Asset saved to disk: ${publicUrl}`);

        } catch (fsError: any) {
            console.log(`ℹ️ Switching to IPFS upload (Reason: ${fsError.message})`);

            try {
                // Upload to IPFS
                // upload() from thirdweb/storage handles File objects directly
                const uri = await upload({
                    client,
                    files: [file],
                });

                // Return the ipfs:// URI directly. 
                // The frontend (if using MediaRenderer) handles this perfectly.
                publicUrl = uri;

                console.log(`✅ Asset uploaded to IPFS: ${publicUrl}`);
            } catch (uploadError: any) {
                console.error("❌ IPFS Upload failed:", uploadError);
                throw new Error("Failed to store asset (FS and IPFS both failed)");
            }
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

import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { client } from "@/lib/thirdweb-client";
import { upload } from "thirdweb/storage";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

export async function POST(req: Request) {
    try {
        const headersObj = await headers();
        const { session } = await getAuth(headersObj);

        // Any authenticated user can upload project assets for now
        // Sub-authorization is handled at the project-update level
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

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

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop() || 'png';
        const filename = `project-asset-${timestamp}-${randomStr}.${extension}`;

        let publicUrl = '';

        try {
            // Local dev attempt
            if (process.env.NODE_ENV !== 'development') {
                throw new Error("Production environment: skipping local FS write");
            }

            const uploadDir = path.join(process.cwd(), "public", "assets", "projects");
            const filePath = path.join(uploadDir, filename);

            await mkdir(uploadDir, { recursive: true });

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            await writeFile(filePath, buffer);

            publicUrl = `/assets/projects/${filename}`;
        } catch (fsError: any) {
            try {
                // IPFS Fallback
                const uri = await upload({
                    client,
                    files: [file],
                });
                publicUrl = uri;
            } catch (uploadError: any) {
                console.error("❌ IPFS Upload failed:", uploadError);
                throw new Error("Failed to store asset");
            }
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename
        });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}

import type { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file received' }, { status: 400 });
    }

    // Only allow PDF files
    if (!file.type.includes('pdf')) {
      return Response.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'File size too large (max 10MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public/uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `upload_${timestamp}_${file.name}`;
    const filePath = join(uploadDir, filename);

    // Save file
    await writeFile(filePath, buffer);

    // Generate URL
    const baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001';
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    return Response.json({
      url: fileUrl,
      filename: file.name,
      success: true
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}

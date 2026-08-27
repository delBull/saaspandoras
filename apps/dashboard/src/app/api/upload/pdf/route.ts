import { requireEnvUrl } from '@/lib/env-utils';
import type { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, extname } from 'path';
import crypto from 'crypto';
import { getAuth, isAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { session, isVerified } = await getAuth(req.headers);
    const walletAddress = session?.address;
    if (!isVerified || !walletAddress || !(await isAdmin(walletAddress))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Generate a random, unpredictable filename (no user-controlled file.name in the path).
    const safeExt = extname(file.name).toLowerCase() === '.pdf' ? '.pdf' : '.pdf';
    const filename = `${crypto.randomUUID()}${safeExt}`;
    const filePath = resolve(uploadDir, filename);

    // Path containment: ensure the resolved path stays inside the upload directory.
    const relative = filePath.startsWith(uploadDir + '/') || filePath === uploadDir;
    if (!relative) {
      return Response.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Save file
    await writeFile(filePath, buffer);

    // Generate URL
    const baseUrl = requireEnvUrl(process.env.NEXT_PUBLIC_DASHBOARD_URL, 'NEXT_PUBLIC_DASHBOARD_URL', 'http://localhost:3001');
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    return Response.json({
      url: fileUrl,
      filename,
      success: true
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}

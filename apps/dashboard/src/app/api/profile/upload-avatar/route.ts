import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    console.log('Avatar upload request received');

    // Verify wallet address from headers
    const walletAddress = request.headers.get('x-wallet-address') ??
                         request.headers.get('x-thirdweb-address') ??
                         request.headers.get('x-user-address');

    console.log('Wallet address:', walletAddress ? 'present' : 'missing');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    console.log('File received:', file ? `size: ${file.size}, type: ${file.type}` : 'no file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max size: 5MB' },
        { status: 400 }
      );
    }

    // Process image with Sharp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename with wallet address
    const walletShort = walletAddress.toLowerCase().slice(0, 8);
    const timestamp = Date.now();
    const filename = `avatar_${walletShort}_${timestamp}.webp`;

    // Process image: resize to 128x128, maintain aspect ratio, compress
    const processedBuffer = await sharp(buffer)
      .resize(128, 128, {
        fit: 'contain', // Maintain aspect ratio
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
        position: 'center' // Center the image
      })
      .webp({
        quality: 85, // Balanced quality and file size
        effort: 6 // More effort = smaller file
      })
      .toBuffer();

    // Store image using Vercel Blob Storage
    console.log('Using Vercel Blob Storage for avatar upload');

    // Upload to Vercel Blob
    const blob = await put(filename, processedBuffer, {
      access: 'public',
      contentType: 'image/webp'
    });

    const imageUrl = blob.url;
    const finalProcessedSize = processedBuffer.length;
    console.log('Blob storage upload successful:', imageUrl);

    // Update user profile in database
    const result = await db
      .update(users)
      .set({
        image: imageUrl
      })
      .where(
        and(
          eq(users.walletAddress, walletAddress.toLowerCase()),
        )
      )
      .returning({ id: users.id, image: users.image });

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result[0],
      message: 'Avatar uploaded successfully',
      optimization: {
        originalSize: `${(buffer.length / 1024).toFixed(1)}KB`,
        processedSize: `${(finalProcessedSize / 1024).toFixed(1)}KB`,
        compressionRatio: `${((buffer.length / finalProcessedSize) * 100).toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

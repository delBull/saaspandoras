import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { getAuth } from '@saasfly/auth-sdk';
import { db } from '@saasfly/db';
import { users, nexusCollaborators } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    console.log('Avatar upload request received');

    // Require verified JWT session for write operation (fallback to header for TMA or collaborator token)
    const auth = await getAuth();
    const sessionAddress = auth.isVerified && auth.session && 'address' in auth.session && typeof auth.session.address === 'string'
      ? auth.session.address
      : null;
    let walletAddress: string | null = sessionAddress;
    let collaboratorUserId: string | null = null;
    
    // TMA fallback: if no JWT, try header (Thirdweb sets x-wallet-address) or nexus token
    const requestHeaders = await headers();
    if (!walletAddress) {
      const headerWallet = requestHeaders.get('x-thirdweb-address') ??
        requestHeaders.get('x-wallet-address') ??
        requestHeaders.get('x-user-address');
      if (headerWallet) walletAddress = headerWallet.toLowerCase();
    }

    // Check if called from Nexus TMA via session or collaborator token
    const collaboratorIdHeader = requestHeaders.get('x-collaborator-id');
    const cookieHeader = requestHeaders.get('cookie') ?? '';
    const tmaMatch = cookieHeader.match(/nexus_tma_session=([^;]+)/);
    
    let resolvedCollaboratorId = collaboratorIdHeader ? parseInt(collaboratorIdHeader, 10) : null;
    if (!resolvedCollaboratorId && tmaMatch?.[1]) {
      try {
        const parsed = JSON.parse(decodeURIComponent(tmaMatch[1])) as { actorId?: string };
        if (parsed.actorId) resolvedCollaboratorId = parseInt(parsed.actorId, 10);
      } catch {
        // ignore
      }
    }

    if (resolvedCollaboratorId) {
      const [collab] = await db
        .select({ email: nexusCollaborators.email, telegramUserId: nexusCollaborators.telegramUserId })
        .from(nexusCollaborators)
        .where(eq(nexusCollaborators.id, resolvedCollaboratorId))
        .limit(1);

      if (collab?.email) {
        const [userByEmail] = await db
          .select({ id: users.id, walletAddress: users.walletAddress })
          .from(users)
          .where(eq(users.email, collab.email))
          .limit(1);
        if (userByEmail) {
          collaboratorUserId = userByEmail.id;
          if (!walletAddress && userByEmail.walletAddress) {
            walletAddress = userByEmail.walletAddress;
          }
        }
      }
    }
    
    if (!walletAddress && !collaboratorUserId) {
      return NextResponse.json({ error: 'Identidad de usuario requerida' }, { status: 401 });
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
    const safeWallet = typeof walletAddress === 'string' ? walletAddress : (collaboratorUserId ?? 'nexus');
    const walletShort = safeWallet.toLowerCase().slice(0, 8);
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
    console.log('BLOB_READ_WRITE_TOKEN present:', !!process.env.BLOB_READ_WRITE_TOKEN);
    console.log('Environment:', process.env.NODE_ENV);

    let imageUrl: string;
    let finalProcessedSize: number;

    try {
      // Upload to Vercel Blob with explicit token
      const blob = await put(filename, processedBuffer, {
        access: 'public',
        contentType: 'image/webp',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });

      imageUrl = blob.url;
      finalProcessedSize = processedBuffer.length;
      console.log('Blob storage upload successful:', imageUrl);
    } catch (blobError) {
      console.error('Blob storage error:', blobError);
      throw blobError;
    }

    // Update user profile in database
    const updateCondition = collaboratorUserId 
      ? eq(users.id, collaboratorUserId)
      : eq(users.walletAddress, walletAddress!.toLowerCase());

    const result = await db
      .update(users)
      .set({
        image: imageUrl
      })
      .where(updateCondition)
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

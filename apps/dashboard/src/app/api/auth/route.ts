import { z } from "zod";
import { createAuth } from 'thirdweb/auth';
import { NextRequest, NextResponse } from 'next/server';

const loginPayloadSchema = z.object({
  domain: z.string().min(1),
  address: z.string().min(1),
  nonce: z.string().min(1),
  type: z.string(),
  statement: z.string(),
  version: z.string(),
  issued_at: z.string(),
  expiration_time: z.string(),
  invalid_before: z.string(),
  uri: z.string().optional(),
  chain_id: z.string().optional(),
  resources: z.array(z.string()).optional(),
});

const auth = createAuth({
  domain: process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000',
});

const loginRequestSchema = z.object({
  address: z.string().min(1),
  chainId: z.number().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, chainId } = loginRequestSchema.parse(body);

    // ✅ Solo address y chainId
    const payload = await auth.generatePayload({ address, chainId });

    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const payloadParam = searchParams.get('payload');
  const signature = searchParams.get('signature');

  if (!payloadParam || !signature) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    const parsedPayload = JSON.parse(payloadParam);
    const safePayload = loginPayloadSchema.parse(parsedPayload);

    const verified = await auth.verifyPayload({
     payload: safePayload,
     signature,
});

    if (!verified.valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      address: verified.payload.address,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

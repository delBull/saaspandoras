import { z } from "zod";
import { createAuth } from "thirdweb/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const loginPayloadSchema = z.object({
  domain: z.string(),
  address: z.string(),
  nonce: z.string(),
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

const loginRequestSchema = z.object({
  address: z.string().min(1),
  chainId: z.number().min(1),
});

const auth = createAuth({
  domain: process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",
});

export async function POST(req: NextRequest) {
  try {
    // 👇 tipamos primero como unknown y luego validamos
    const body: unknown = await req.json();
    const { address, chainId } = loginRequestSchema.parse(body);

    const payload = await auth.generatePayload({ address, chainId });
    return NextResponse.json(payload);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const payloadParam = searchParams.get("payload");
  const signature = searchParams.get("signature");

  if (!payloadParam || !signature) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    // 👇 primero unknown, luego Zod
    const parsedUnknown: unknown = JSON.parse(payloadParam);
    const safePayload = loginPayloadSchema.parse(parsedUnknown);

    const verified = await auth.verifyPayload({
      payload: safePayload,
      signature,
    });

    if (!verified.valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      address: verified.payload.address,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
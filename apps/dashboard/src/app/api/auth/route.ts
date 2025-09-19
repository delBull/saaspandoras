import { type NextRequest, NextResponse } from "next/server";
import { createAuth } from "thirdweb/auth";
import { createThirdwebClient } from "thirdweb";

const client = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID!,
});

const auth = createAuth({
  domain: process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",
  client,
});

interface AuthRequest {
  address: string;
  chainId: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as unknown;
  const authRequest = body as AuthRequest;
  const { address, chainId } = authRequest;
  const payload = await auth.generatePayload({ address, chainId });
  return NextResponse.json(payload);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const payload = searchParams.get("payload");
  const signature = searchParams.get("signature");

  if (!payload || !signature) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const verified = await auth.verifyPayload({
    payload: JSON.parse(payload),
    signature,
  });

  if (!verified.valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ✅ La dirección está dentro de verified.payload.address
  return NextResponse.json({
    success: true,
    address: verified.payload.address,
  });
}

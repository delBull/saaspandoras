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

// POST: genera payload de autenticación
export async function POST(req: NextRequest) {
  // Tipar directamente el JSON
  const body: unknown = await req.json();

  // Validar que body tenga la forma correcta
  if (
    typeof body !== "object" ||
    body === null ||
    !("address" in body) ||
    !("chainId" in body)
  ) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { address, chainId } = body as AuthRequest;

  const payload = await auth.generatePayload({ address, chainId });
  return NextResponse.json(payload);
}

// GET: verifica firma
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const payloadParam = searchParams.get("payload");
  const signature = searchParams.get("signature");

  if (!payloadParam || !signature) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(payloadParam) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
  }

  const verified = await auth.verifyPayload({
    // thirdweb requiere tipo LoginPayload específico, usamos any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: parsedPayload as any,
    signature,
  });

  if (!verified.valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    address: verified.payload.address,
  });
}

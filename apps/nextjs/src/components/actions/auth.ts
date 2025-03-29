"use server";
import type { VerifyLoginPayloadParams } from "thirdweb/auth";
import { createAuth } from "thirdweb/auth";
import { client } from "../../lib/client";
import { cookies } from "next/headers";
 
const privateKey = process.env.THIRDWEB_SECRET_KEY;
if (!privateKey) {
  throw new Error("Missing THIRDWEB_SECRET_KEY in .env file.");
}

const thirdwebAuth = createAuth({
  domain: process.env.NEXT_PUBLIC_DOMAIN ?? "https://dapp.pandoras.foundation",
  client,
});

export const generatePayload = thirdwebAuth.generatePayload;


export async function login(payload: VerifyLoginPayloadParams): Promise<void> {
  const verifiedPayload = await thirdwebAuth.verifyPayload(payload);
  if (verifiedPayload.valid) {
    cookies().set('isAuthenticated', 'true');
  }
}

export async function isLoggedIn(): Promise<boolean> {
  await Promise.resolve(); // Dummy await para ESLint
  return cookies().has('isAuthenticated');
}

export async function logout(): Promise<void> {
  await Promise.resolve(); // Dummy await para ESLint
  cookies().delete('isAuthenticated');
}
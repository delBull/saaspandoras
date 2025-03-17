"use server";
import type { VerifyLoginPayloadParams } from "thirdweb/auth";
import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { client } from "../../lib/client";
import { cookies } from "next/headers";
 
const privateKey = process.env.THIRDWEB_SECRET_KEY;
if (!privateKey) {
  throw new Error("Missing THIRDWEB_SECRET_KEY in .env file.");
}

const thirdwebAuth = createAuth({
  domain: process.env.NEXT_PUBLIC_DOMAIN ?? "localhost:3000",
  adminAccount: privateKeyToAccount({ client, privateKey }),
  client
});

export const generatePayload = thirdwebAuth.generatePayload;

export async function login(payload: VerifyLoginPayloadParams) {
  const verifiedPayload = await thirdwebAuth.verifyPayload(payload);
  console.log(verifiedPayload);
  if (verifiedPayload.valid) {
    const jwt = await thirdwebAuth.generateJWT({
      payload: verifiedPayload.payload,
    });
    cookies().set("jwt", jwt);
  }
}

export async function isLoggedIn() {
  const jwt = cookies().get("jwt");
  console.log(jwt);
  if (!jwt?.value) {
    return false;
  }

  const authResult = await thirdwebAuth.verifyJWT({ jwt: jwt.value });
  if (!authResult.valid) {
    return false
  }
  return true;
}

export async function logout() {
  cookies().delete("jwt");
}
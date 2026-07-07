
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("__pbox_sid");
    cookieStore.delete("pbox_session_v3");
    cookieStore.delete("wallet-address");
    cookieStore.delete("thirdweb:wallet-address");
    return NextResponse.json({ success: true });
}


import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("__pbox_sid");
    cookieStore.delete("pbox_session_v3");
    cookieStore.delete("wallet-address");
    cookieStore.delete("thirdweb:wallet-address");
    
    // Clear tenant routing cookies so the user can switch contexts
    cookieStore.delete("pd_current_tenant");
    cookieStore.delete("portal_slug");
    cookieStore.delete("snarai_project_slug");
    cookieStore.delete("pandoras_portal_session");
    return NextResponse.json({ success: true });
}

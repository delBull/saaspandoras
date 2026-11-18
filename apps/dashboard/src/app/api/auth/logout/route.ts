
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeCollaboratorSessionToken } from "@saasfly/hermes-core";

export async function POST() {
    const cookieStore = await cookies();

    // 🔐 Revocación server-side del token de sesión de Nexus: quemarlo en la base
    // para que una copia robada de la cookie deje de ser válida. Antes sólo se
    // borraba del navegador y seguía funcionando hasta 24 h.
    const nexusToken = cookieStore.get("pandoras_nexus_token")?.value
        ?? cookieStore.get("nexus_token")?.value;

    if (nexusToken) {
        try {
            await revokeCollaboratorSessionToken(nexusToken);
        } catch (error: unknown) {
            // El cierre de sesión local no debe fallar por la base, pero la falta de
            // revocación es un evento de seguridad: se registra, no se silencia.
            console.error("[Logout] Nexus session token could NOT be revoked:", error);
        }
    }

    cookieStore.delete("auth_token");
    cookieStore.delete("__pbox_sid");
    cookieStore.delete("pbox_session_v3");
    cookieStore.delete("wallet-address");
    cookieStore.delete("thirdweb:wallet-address");
    cookieStore.delete("pandoras_nexus_token");
    cookieStore.delete("nexus_token");
    
    // Clear tenant routing cookies so the user can switch contexts
    cookieStore.delete("pd_current_tenant");
    cookieStore.delete("portal_slug");
    cookieStore.delete("snarai_project_slug");
    cookieStore.delete("pandoras_portal_session");
    return NextResponse.json({ success: true });
}

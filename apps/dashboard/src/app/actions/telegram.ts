'use server'
import { cookies } from "next/headers";

export async function getLoginToken(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        return token || null;
    } catch (e) {
        console.error("Failed to retrieve auth token for Telegram link", e);
        return null;
    }
}

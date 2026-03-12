'use server'
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function validateTelegramLinkAction(challenge: string): Promise<{ success: boolean; message?: string }> {
    try {
        const requestHeaders = await headers();
        const { session } = await getAuth(requestHeaders);

        let walletAddress: string | null = session?.userId ?? null;
        if (!walletAddress) {
            walletAddress = requestHeaders.get('x-thirdweb-address')
                ?? requestHeaders.get('x-wallet-address')
                ?? requestHeaders.get('x-user-address') ?? null;
        }

        if (!walletAddress) {
            return { success: false, message: 'Debes conectar tu wallet en la Web antes de vincular Telegram.' };
        }

        // Directly call the Edge API 
        const edgeUrl = process.env.NEXT_PUBLIC_PANDORAS_EDGE_URL || 'https://pandorasminiapp-staging.up.railway.app/api';
        const PANDORA_CORE_KEY = process.env.PANDORA_CORE_KEY || process.env.PANDORA_CORE_S2S_KEY;

        if (!PANDORA_CORE_KEY) {
            console.error('Missing PANDORA_CORE_KEY / PANDORA_CORE_S2S_KEY in env');
            return { success: false, message: 'Error de configuración del servidor Core' };
        }

        const res = await fetch(`${edgeUrl}/auth/validate-link-internal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-core-webhook-key': PANDORA_CORE_KEY
            },
            body: JSON.stringify({
                linkToken: challenge,
                coreUserId: walletAddress
            })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return { success: false, message: error.message || 'Código inválido o expirado' };
        }

        return { success: true, message: '¡Cuenta vinculada exitosamente!' };
    } catch (e: any) {
        console.error("Failed to validate Telegram link", e);
        return { success: false, message: e.message || 'Error interno al conectar con Edge' };
    }
}

export async function resolveTelegramUserAction(telegramId: string, initData: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const edgeUrl = process.env.NEXT_PUBLIC_PANDORAS_EDGE_URL || 'https://pandorasminiapp-staging.up.railway.app/api';
        const PANDORA_CORE_KEY = process.env.PANDORA_CORE_KEY || process.env.PANDORA_CORE_S2S_KEY;

        if (!PANDORA_CORE_KEY) {
            return { success: false, message: 'Configuración de servidor incompleta (Core Key)' };
        }

        const res = await fetch(`${edgeUrl}/internal/user/resolve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-core-webhook-key': PANDORA_CORE_KEY
            },
            body: JSON.stringify({
                telegramId,
                initData
            })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return { success: false, message: error.message || 'No se pudo resolver la identidad de Telegram' };
        }

        const userData = await res.json();
        return { success: true, data: userData };
    } catch (e: any) {
        console.error("Failed to resolve Telegram user", e);
        return { success: false, message: 'Error técnico al contactar con el Bridge de Telegram' };
    }
}


'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { resolveTelegramUserAction } from '@/app/actions/telegram';

interface TelegramDashboardAuthProps {
    onSuccess?: (userData: any) => void;
}

export function TelegramDashboardAuth({ onSuccess }: TelegramDashboardAuthProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTelegramAvailable, setIsTelegramAvailable] = useState(false);

    useEffect(() => {
        // Only show if we are likely inside Telegram or have access to Telegram WebApp
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
            setIsTelegramAvailable(true);
        }
    }, []);

    const handleTelegramLogin = async () => {
        const tg = (window as any).Telegram?.WebApp;
        if (!tg?.initData) {
            toast.error('No se detectó una sesión de Telegram válida.');
            return;
        }

        setIsLoading(true);
        try {
            const telegramId = tg.initDataUnsafe?.user?.id?.toString();
            if (!telegramId) throw new Error('ID de Telegram no encontrado');

            const result = await resolveTelegramUserAction(telegramId, tg.initData);

            if (result.success) {
                toast.success(`¡Bienvenido, ${result.data.username || result.data.firstName}!`);
                if (onSuccess) onSuccess(result.data);
            } else {
                toast.error(result.message || 'Error al validar identidad con Telegram');
            }
        } catch (error: any) {
            console.error('Telegram Login Error:', error);
            toast.error('Error conectando con el Bridge de Telegram');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isTelegramAvailable) return null;

    return (
        <Button
            onClick={handleTelegramLogin}
            disabled={isLoading}
            className="w-full bg-[#24A1DE] hover:bg-[#2087ba] text-white flex items-center justify-center gap-2 py-6 text-lg font-bold transition-all shadow-lg hover:shadow-[#24A1DE]/40"
        >
            {isLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
            ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12C0 18.627 5.373 24 12 24C18.627 24 24 18.627 24 12C24 5.373 18.627 0 12 0ZM17.414 7.683L15.356 20.37C15.174 21.216 14.67 21.42 13.98 21.036L10.842 18.726L9.324 20.184C9.156 20.352 9.018 20.496 8.682 20.496L8.904 17.34L14.658 12.138C14.91 11.91 14.6 11.784 14.268 12.006L7.152 16.488L4.104 15.534C3.438 15.324 3.426 14.868 4.242 14.544L16.158 9.948C16.71 9.744 17.19 10.074 17.016 10.842L17.414 7.683Z" fill="white" />
                </svg>
            )}
            Continuar con Telegram
        </Button>
    );
}

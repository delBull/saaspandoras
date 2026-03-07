'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import { DevicePhoneMobileIcon, CheckCircleIcon, LinkIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { validateTelegramLinkAction } from '@/app/actions/telegram';

export const TelegramLinkCard = () => {
    const [challenge, setChallenge] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

    const handleValidate = async () => {
        if (!challenge.trim()) {
            setStatus({ success: false, message: 'Por favor ingresa o pega el enlace generado en Telegram.' });
            return;
        }

        // Si pegaron la URL completa, extraer solo el UUID challenge
        let cleanedChallenge = challenge.trim();
        if (cleanedChallenge.includes('?challenge=')) {
            cleanedChallenge = cleanedChallenge.split('?challenge=')[1] || cleanedChallenge;
        }

        setIsLoading(true);
        setStatus(null);

        const result = await validateTelegramLinkAction(cleanedChallenge);
        setStatus({
            success: result.success,
            message: result.message ?? (result.success ? 'Proceso exitoso' : 'Error desconocido')
        });
        setIsLoading(false);

        if (result.success) {
            setChallenge(''); // Limpiar tras éxito
            // Optional: emit an event or force a router.refresh() 
            // if we wanted to update global states instantly.
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    };

    return (
        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />

            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                    <DevicePhoneMobileIcon className="w-5 h-5" />
                    Bóveda Telegram PBOX
                </CardTitle>
                <CardDescription>
                    Pega aquí el enlace seguro o código 'Challenge' generado por la MiniApp de Pandoras en Telegram para vincular tu identidad Core y sincronizar tus retornos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
                {status?.success ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex flex-col items-center justify-center space-y-2">
                        <CheckCircleIcon className="w-8 h-8 text-green-400" />
                        <span className="text-sm font-medium text-green-400 text-center">{status.message}</span>
                        <span className="text-xs text-green-400/70 text-center">Actualizando Perfil...</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Ej: 550e8400-e29b-41d4-a716-446655440000"
                            className="w-full bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 text-sm text-gray-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                            value={challenge}
                            onChange={(e) => setChallenge(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                        />

                        {status && !status.success && (
                            <div className="flex items-center gap-2 text-xs text-red-400 mt-1">
                                <XCircleIcon className="w-4 h-4" />
                                <span>{status.message}</span>
                            </div>
                        )}

                        <Button
                            onClick={handleValidate}
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Validando Identidad...</span>
                            ) : (
                                <>
                                    <LinkIcon className="w-4 h-4" />
                                    Confirmar Vinculación
                                </>
                            )}
                        </Button>
                        <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest mt-2">
                            Abre la MiniApp en tu teléfono, pulsa "Generar Enlace" y pega el resultado arriba.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

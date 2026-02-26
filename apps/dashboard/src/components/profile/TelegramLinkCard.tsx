'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import { DevicePhoneMobileIcon, KeyIcon, CheckCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { getLoginToken } from '@/app/actions/telegram';

export const TelegramLinkCard = () => {
    const [token, setToken] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRevealKey = async () => {
        setIsLoading(true);
        const fetchedToken = await getLoginToken();
        if (fetchedToken) {
            setToken(fetchedToken);
        } else {
            alert('No se pudo generar la clave de enlace. Asegúrate de estar validado en la red Core.');
        }
        setIsLoading(false);
    };

    const handleCopy = () => {
        if (token) {
            navigator.clipboard.writeText(token);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />

            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                    <DevicePhoneMobileIcon className="w-5 h-5" />
                    App de Telegram
                </CardTitle>
                <CardDescription>
                    Vincula tu cuenta actual de Pandoras Core con la MiniApp de Telegram para sincronizar tus Protocolos, Logros y PBOX Tokens en tiempo real.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
                {!token ? (
                    <Button
                        onClick={handleRevealKey}
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                        <KeyIcon className="w-4 h-4" />
                        {isLoading ? 'Generando...' : 'Generar Clave de Enlace'}
                    </Button>
                ) : (
                    <div className="space-y-3">
                        <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 break-all font-mono text-[10px] text-gray-400">
                            {token}
                        </div>
                        <Button
                            onClick={handleCopy}
                            variant="outline"
                            className="w-full border-blue-500/30 hover:bg-blue-500/10 text-blue-400 flex items-center justify-center gap-2"
                        >
                            {isCopied ? (
                                <>
                                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400">¡Copiado al portapapeles!</span>
                                </>
                            ) : (
                                <>
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                    Copiar Clave Segura
                                </>
                            )}
                        </Button>
                        <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest mt-2">
                            Abre la MiniApp en Telegram, ve a Ajustes y pega esta clave.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

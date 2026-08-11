'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface TelegramBotConfigCardProps {
    project: any;
}

export default function TelegramBotConfigCard({ project }: TelegramBotConfigCardProps) {
    const [botTokenInput, setBotTokenInput] = useState('');
    const [isRegisteringBot, setIsRegisteringBot] = useState(false);

    const handleRegisterBot = async () => {
        if (!project || !botTokenInput) return;
        setIsRegisteringBot(true);
        try {
            const response = await fetch(`/api/v1/projects/${project.id}/bot/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botToken: botTokenInput })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Bot vinculado exitosamente y Webhook registrado');
                setBotTokenInput('');
            } else {
                toast.error(data.message || data.error || 'Error al vincular el bot');
            }
        } catch (err) {
            toast.error('Error de conexión al registrar el bot');
        } finally {
            setIsRegisteringBot(false);
        }
    };

    return (
        <div className="bg-zinc-900 rounded-xl border border-purple-500/20 p-6">
            <h3 className="text-xl font-bold text-purple-400 mb-2">Asistente IA (Telegram)</h3>
            <p className="text-sm text-zinc-400 mb-4">
                Vincula el bot de soporte de tu protocolo con Hermes. El kernel manejará la inteligencia artificial y las respuestas automáticamente.
            </p>
            <div className="flex gap-2">
                <input
                    type="password"
                    value={botTokenInput}
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:outline-none rounded-lg px-4 py-2 flex-1 text-white text-sm"
                    placeholder="Ej: 8639272150:AAEVRsfHMP-9EzWRRvkZFR..."
                />
                <button
                    type="button"
                    onClick={handleRegisterBot}
                    disabled={isRegisteringBot || !botTokenInput}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                    {isRegisteringBot ? 'Vinculando...' : 'Vincular'}
                </button>
            </div>
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 mt-4 text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300 block mb-2">Instrucciones rápidas:</strong>
                <ol className="list-decimal pl-4 space-y-1">
                    <li>Abre Telegram y busca a <a href="https://t.me/botfather" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">@BotFather</a>.</li>
                    <li>Envía el comando <code className="text-lime-400">/newbot</code> y sigue los pasos para crear tu bot.</li>
                    <li>Copia el &quot;HTTP API Token&quot; que te dará al finalizar y pégalo aquí arriba.</li>
                </ol>
            </div>
        </div>
    );
}

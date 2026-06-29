import React, { useState } from 'react';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, ChatBubbleBottomCenterTextIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/solid';

export function FounderCopilot() {
    const [isOpen, setIsOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([
        { role: 'assistant', text: 'Soy tu Founder Copilot. Listo para optimizar tu día.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const handleAction = (action: string) => {
        setChatHistory(prev => [...prev, { role: 'user', text: action }]);
        setIsTyping(true);
        
        // Mocking AI response for MVP
        setTimeout(() => {
            let response = "";
            switch(action) {
                case "¿Qué hago hoy?":
                    response = "Hoy tienes 4 reuniones. Tu prioridad: Carlos a las 2 PM. Te sugiero enviar 2 seguimientos pendientes a leads en fase Due Diligence.";
                    break;
                case "Resume mi semana":
                    response = "Semana fuerte: 12 reuniones, 4 nuevos interesados. Momentum alto. Lograste tu North Star en un 80% respecto a la semana pasada.";
                    break;
                case "Crear seguimiento":
                    response = "Borrador generado: 'Hola [Nombre], qué buena charla ayer sobre la visión de S'Narai. Te dejo el whitepaper aquí. ¿Hablamos el jueves?'";
                    break;
                case "Preparar reunión":
                    response = "Para tu próxima reunión: Recuerda no vender tecnología. Vende 'acceso exclusivo'. El lead es pragmático, muéstrale liquidez.";
                    break;
                default:
                    response = "Procesando...";
            }
            setChatHistory(prev => [...prev, { role: 'assistant', text: response }]);
            setIsTyping(false);
        }, 1500);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-lg shadow-emerald-900/50 transition-all active:scale-95 flex items-center gap-2 group z-50"
            >
                <SparklesIcon className="w-6 h-6 text-black" />
                <span className="w-0 overflow-hidden group-hover:w-32 transition-all duration-300 text-sm font-bold text-black whitespace-nowrap">
                    Founder Copilot
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 bg-black border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-900/20 flex flex-col overflow-hidden z-50">
            {/* Header */}
            <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Founder Copilot</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="h-64 overflow-y-auto p-4 space-y-4 bg-black">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 max-w-[80%] text-sm rounded-2xl ${msg.role === 'user' ? 'bg-emerald-900/30 text-emerald-100 border border-emerald-500/20' : 'bg-zinc-900 text-zinc-300 border border-zinc-800'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="p-3 bg-zinc-900 text-zinc-500 text-sm rounded-2xl border border-zinc-800 animate-pulse">
                            Pensando...
                        </div>
                    </div>
                )}
            </div>

            {/* MVP Quick Actions */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Comandos de alto valor</p>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => handleAction("¿Qué hago hoy?")}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 flex items-center justify-center gap-1 transition-colors"
                    >
                        <ChatBubbleBottomCenterTextIcon className="w-3 h-3 text-emerald-400" />
                        ¿Qué hago hoy?
                    </button>
                    <button 
                        onClick={() => handleAction("Resume mi semana")}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 flex items-center justify-center gap-1 transition-colors"
                    >
                        <ChartBarIcon className="w-3 h-3 text-emerald-400" />
                        Resume mi semana
                    </button>
                    <button 
                        onClick={() => handleAction("Crear seguimiento")}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 flex items-center justify-center gap-1 transition-colors"
                    >
                        <PaperAirplaneIcon className="w-3 h-3 text-emerald-400" />
                        Crear seguimiento
                    </button>
                    <button 
                        onClick={() => handleAction("Preparar reunión")}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 flex items-center justify-center gap-1 transition-colors"
                    >
                        <UserGroupIcon className="w-3 h-3 text-emerald-400" />
                        Preparar reunión
                    </button>
                </div>
            </div>
        </div>
    );
}

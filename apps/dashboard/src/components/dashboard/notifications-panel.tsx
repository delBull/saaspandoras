import React from "react";
import {
    ShareIcon,
    AcademicCapIcon,
    KeyIcon,
    BellIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export function NotificationsPanel({ hasAccess }: { hasAccess: boolean }) {
    const router = useRouter();

    // Base list
    const [items, setItems] = React.useState([
        {
            id: 1,
            type: "action",
            title: "Únete y Gana",
            description: "Comparte tu perfil y gana recompensas por cada amigo que se una.",
            icon: <ShareIcon className="w-5 h-5 text-purple-400" />,
            actionText: "Compartir",
            bgClass: "bg-purple-900/20 border-purple-800/30",
            dismissible: true,
            onClick: () => router.push('/profile')
        },
        // Conditionally added
        ...(!hasAccess ? [{
            id: 2,
            type: "reminder",
            title: "Tu Primer Acceso",
            description: "Aún no tienes acceso a ningún proyecto. Explora el Hub.",
            icon: <KeyIcon className="w-5 h-5 text-emerald-400" />,
            actionText: "Explorar",
            bgClass: "bg-emerald-900/10 border-emerald-800/30",
            dismissible: true,
            onClick: () => {
                const section = document.getElementById('access-section');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
            }
        }] : []),
        {
            id: 3,
            type: "info",
            title: "Centro Educativo",
            description: "Aprende cómo funciona la tokenización en nuestra academia.",
            icon: <AcademicCapIcon className="w-5 h-5 text-blue-400" />,
            actionText: "Aprender",
            bgClass: "bg-blue-900/10 border-blue-800/30",
            dismissible: true,
            onClick: () => router.push('/education')
        }
    ]);

    const dismiss = (id: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        setItems(prev => prev.filter(i => i.id !== id));
    };

    return (
        <div className="h-full flex flex-col bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <BellIcon className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm text-gray-200 tracking-wide">Notificaciones</h3>
                </div>
                {items.length > 0 && (
                    <span className="text-[10px] bg-lime-500/20 text-lime-400 px-1.5 py-0.5 rounded border border-red-500/20">
                        {items.length} Nuevas
                    </span>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {items.length > 0 ? (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className={`relative rounded-xl border ${item.bgClass} transition-all duration-300 hover:bg-zinc-800/80 group hover:scale-[1.02] active:scale-[0.98]`}
                        >
                            {/* Dismiss Button - Outside the main click handler */}
                            <button
                                onClick={(e) => dismiss(item.id, e)}
                                className="absolute top-2 right-2 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-full z-20"
                                aria-label="Dismiss notification"
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>

                            {/* Main Clickable Content */}
                            <div
                                onClick={item.onClick}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        item.onClick();
                                    }
                                }}
                                className="p-3 flex flex-col gap-2 w-full h-full outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-zinc-900 focus:ring-white/20 rounded-xl"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-black/40 rounded-lg shrink-0">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-200 leading-tight mb-1 group-hover:text-white transition-colors pr-6">{item.title}</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{item.description}</p>
                                    </div>
                                </div>

                                {item.actionText && (
                                    <span className="self-end text-[10px] font-bold uppercase tracking-wider text-white/70 group-hover:text-white bg-white/5 group-hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors border border-white/5 group-hover:border-white/20">
                                        {item.actionText}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-50">
                        <BellIcon className="w-8 h-8 text-gray-600 mb-2" />
                        <p className="text-xs text-gray-500">Estás al día.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

import React from "react";
import {
    ShareIcon,
    AcademicCapIcon,
    KeyIcon,
    BellIcon,
    XMarkIcon,
    GiftIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTour } from "@/components/onboarding/TourEngine";

const ITEMS_PER_PAGE = 5;

export function NotificationsPanel({ hasAccess, notifications = [] }: { hasAccess: boolean, notifications?: any[] }) {
    const router = useRouter();

    // Map API notifications to component structure if they come from DB
    const apiItems = notifications.map((n: any) => ({
        id: typeof n.id === 'string' ? parseInt(n.id.replace(/\D/g, '').slice(0, 5)) || Math.random() : n.id, // Ensure ID is usable
        type: n.type || "info",
        title: n.title,
        description: n.description,
        icon: n.points > 0 ? <GiftIcon className="w-5 h-5 text-amber-400" /> : <BellIcon className="w-5 h-5 text-blue-400" />,
        actionText: null, // Basic events usually don't have action
        bgClass: n.points > 0 ? "bg-amber-900/10 border-amber-800/30" : "bg-blue-900/10 border-blue-800/30",
        dismissible: true,
        onClick: () => void 0 // No action for now
    }));

    // Base list
    const defaultItems = [
        {
            id: 101,
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
            id: 102,
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
            id: 103,
            type: "info",
            title: "Centro Educativo",
            description: "Aprende cómo funciona la tokenización en nuestra academia.",
            icon: <AcademicCapIcon className="w-5 h-5 text-blue-400" />,
            actionText: "Aprender",
            bgClass: "bg-blue-900/10 border-blue-800/30",
            dismissible: true,
            onClick: () => router.push('/education')
        }
    ];

    const [items, setItems] = React.useState<any[]>([]);
    const [page, setPage] = React.useState(0);
    const tour = useTour();

    // Initialize items and handle persistence
    React.useEffect(() => {
        const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        const tourCompleted = localStorage.getItem('pandoras_tour_completed');

        let combinedItems = [...apiItems, ...defaultItems];

        // Add Tour notification if not completed
        if (!tourCompleted && tour?.startTour) {
            combinedItems.unshift({
                id: 999,
                type: "action",
                title: "Iniciación Pendiente",
                description: "Completa el recorrido para obtener tu insignia de 'Iniciado'.",
                icon: <div className="text-xl">🚀</div>,
                actionText: "Iniciar",
                bgClass: "bg-purple-900/40 border-purple-500/50 animate-pulse-slow",
                dismissible: false,
                onClick: () => tour.startTour()
            });
        }

        // Filter out dismissed items
        const filteredItems = combinedItems.filter(item => !dismissedIds.includes(item.id));
        setItems(filteredItems);
    }, [hasAccess, notifications.length, tour]);

    const dismiss = (id: number | string, e: React.MouseEvent) => {
        e.stopPropagation();
        setItems(prev => prev.filter(i => i.id !== id));
        
        // Persist dismissal
        const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        if (!dismissedIds.includes(id)) {
            dismissedIds.push(id);
            localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedIds));
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const displayedItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    // Safety check if page is out of bounds after deletion
    React.useEffect(() => {
        if (page >= totalPages && totalPages > 0) {
            setPage(totalPages - 1);
        }
    }, [items.length, totalPages, page]);

    return (
        <div className="h-full flex flex-col bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm relative shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-gray-200 tracking-tight">Centro de Actividad</h3>
                </div>
                <div className="flex items-center gap-2">
                    {items.length > 0 && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-white/5 font-mono">
                            {items.length} EVENTOS
                        </span>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {displayedItems.length > 0 ? (
                    displayedItems.map((item) => (
                        <div
                            key={item.id}
                            className={`relative rounded-xl border border-white/5 ${item.bgClass} transition-all duration-500 hover:bg-zinc-800/80 group hover:border-white/10 active:scale-[0.98] shadow-lg`}
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
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-black/60 rounded-xl shrink-0 border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
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

            {/* Pagination Controls - Fixed at bottom if needed */}
            {totalPages > 1 && (
                <div className="p-2 border-t border-white/5 bg-zinc-900/50 flex justify-between items-center shrink-0">
                    <button
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                        className="p-1 px-3 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <ChevronLeftIcon className="w-3 h-3" /> Anterior
                    </button>
                    <span className="text-[10px] text-gray-500">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                        className="p-1 px-3 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        Siguiente <ChevronRightIcon className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

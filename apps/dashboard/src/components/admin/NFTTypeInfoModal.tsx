'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    TicketIcon,
    IdentificationIcon,
    GiftIcon,
    QrCodeIcon,
    ShieldCheckIcon,
    ArrowsRightLeftIcon,
    FireIcon
} from "@heroicons/react/24/outline";

interface NFTTypeInfoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NFTTypeInfoModal({ open, onOpenChange }: NFTTypeInfoModalProps) {
    const nftTypes = [
        {
            id: 'access',
            title: 'Access Pass (Pase de Acceso)',
            description: 'El estándar de oro para membresías y accesos restringidos.',
            icon: TicketIcon,
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/10',
            borderColor: 'border-indigo-500/20',
            features: [
                { text: 'Transferible por defecto', icon: ArrowsRightLeftIcon },
                { text: 'Protocolo ERC-721A (Gas-efficient)', icon: ShieldCheckIcon },
            ],
            details: 'Ideal para pases que los usuarios pueden vender o transferir en mercados secundarios una vez que ya no los necesiten.'
        },
        {
            id: 'identity',
            title: 'Digital Identity (SBT)',
            description: 'Identidad digital vinculada permanentemente a una wallet.',
            icon: IdentificationIcon,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/20',
            features: [
                { text: 'No Transferible (Soulbound)', icon: ShieldCheckIcon },
                { text: 'Certificado de Propiedad On-chain', icon: ShieldCheckIcon },
            ],
            details: 'Perfecto para diplomas, certificaciones, reputación o perfiles de usuario que no deben ser vendidos ni transferidos.'
        },
        {
            id: 'coupon',
            title: 'Coupon (Cupón de Canje)',
            description: 'Activos diseñados para ser utilizados una sola vez.',
            icon: GiftIcon,
            color: 'text-rose-400',
            bgColor: 'bg-rose-500/10',
            borderColor: 'border-rose-500/20',
            features: [
                { text: 'Quemable (Burnable)', icon: FireIcon },
                { text: 'Vencimiento Opcional', icon: ShieldCheckIcon },
            ],
            details: 'Úsalo para recompensas, boletos de eventos o descuentos. El contrato permite "quemar" el NFT al momento de reclamar el beneficio.'
        },
        {
            id: 'qr',
            title: 'Smart QR & Landing',
            description: 'Puente físico-digital con redirecciones inteligentes.',
            icon: QrCodeIcon,
            color: 'text-lime-400',
            bgColor: 'bg-lime-500/10',
            borderColor: 'border-lime-500/20',
            features: [
                { text: 'Destino Dinámico (Editable)', icon: ArrowsRightLeftIcon },
                { text: 'Landing Page Integrada', icon: ShieldCheckIcon },
            ],
            details: 'Crea QRs que apuntan a una landing page personalizada o directamente a una URL. Puedes cambiar el destino en cualquier momento sin cambiar el código impreso.'
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-zinc-800 text-white overflow-hidden p-0">
                <div className="absolute inset-0 bg-gradient-to-b from-lime-500/5 to-transparent pointer-events-none" />

                <div className="p-6 relative z-10">
                    <DialogHeader className="mb-6 relative">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-lime-500/20 flex items-center justify-center border border-lime-500/30">
                                <ShieldCheckIcon className="w-6 h-6 text-lime-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                                    Guía de Tipos de NFT
                                </DialogTitle>
                                <DialogDescription className="text-zinc-500">
                                    Entiende las capacidades técnicas de cada activo en Pandora's NFT Lab.
                                </DialogDescription>
                            </div>
                        </div>
                        <DialogClose className="absolute right-0 top-0 p-2 text-zinc-500 hover:text-white transition-colors">
                            <span className="text-xl">×</span>
                        </DialogClose>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nftTypes.map((type) => (
                            <div
                                key={type.id}
                                className={`flex flex-col p-4 rounded-xl border ${type.borderColor} ${type.bgColor} transition-all hover:scale-[1.02] duration-200`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg bg-black/40 ${type.color}`}>
                                        <type.icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-sm tracking-tight">{type.title}</h4>
                                </div>

                                <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                                    {type.description}
                                </p>

                                <div className="space-y-1.5 mb-4">
                                    {type.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                                            <feature.icon className={`w-3 h-3 ${type.color}`} />
                                            {feature.text}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto pt-3 border-t border-white/5">
                                    <p className="text-[11px] text-zinc-500 italic">
                                        {type.details}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-center">
                        <p className="text-xs text-zinc-400">
                            <span className="text-lime-500 font-bold">Nota técnica:</span> Todos los despliegues utilizan <span className="text-white font-mono">Custom Pandoras Stack</span> optimizado para costos mínimos de gas y seguridad on-chain.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

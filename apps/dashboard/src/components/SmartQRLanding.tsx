'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import {
    GlobeAltIcon,
    ShareIcon,
    ChatBubbleLeftIcon
} from "@heroicons/react/24/outline";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";

// Safe Social Icons
import {
    FaInstagram,
    FaTwitter,
    FaFacebook,
    FaLinkedin,
    FaYoutube,
    FaTiktok,
    FaWhatsapp,
    FaDiscord,
    FaTelegram
} from "react-icons/fa";

interface SmartQRLandingProps {
    config: any;
    slug: string;
}

// Helper to resolve IPFS URLs to a public gateway
const resolveIpfsUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
        return url.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    return url;
};

// Helper to ensure links are absolute (avoiding relative path issues in dynamic routes)
const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:") || url.startsWith("tel:")) {
        return url;
    }
    // Default to https if no protocol is present
    return `https://${url}`;
};

export function SmartQRLanding({ config, slug }: SmartQRLandingProps) {
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const {
        title,
        slogan,
        logoUrl,
        links = [],
        socials = {},
        whatsapp,
        footer
    } = config || {};

    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: any = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    const handleWhatsappClick = () => {
        if (!whatsapp) return;
        const cleanPhone = whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const resolvedLogoUrl = resolveIpfsUrl(logoUrl);

    const SocialIcon = ({ type, url }: { type: string, url: string }) => {
        if (!url) return null;

        let Icon = GlobeAltIcon as any;
        let colorClass = "hover:text-gray-400"; // default

        switch (type.toLowerCase()) {
            case 'instagram': Icon = FaInstagram; colorClass = "hover:text-pink-500"; break;
            case 'twitter': Icon = FaTwitter; colorClass = "hover:text-blue-400"; break;
            case 'facebook': Icon = FaFacebook; colorClass = "hover:text-blue-600"; break;
            case 'linkedin': Icon = FaLinkedin; colorClass = "hover:text-blue-700"; break;
            case 'youtube': Icon = FaYoutube; colorClass = "hover:text-red-600"; break;
            case 'tiktok': Icon = FaTiktok; colorClass = "hover:text-pink-600"; break;
            case 'discord': Icon = FaDiscord; colorClass = "hover:text-indigo-500"; break;
            case 'telegram': Icon = FaTelegram; colorClass = "hover:text-sky-500"; break;
        }

        return (
            <a
                href={ensureAbsoluteUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-gray-400 transition-colors transform hover:scale-110 ${colorClass}`}
            >
                <Icon className="w-8 h-8" />
            </a>
        );
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/30 via-zinc-950 to-zinc-950 z-0" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-cyan-500" />

            <motion.div
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 relative z-10 shadow-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header / Branding */}
                <motion.div className="flex flex-col items-center text-center mb-10" variants={itemVariants}>
                    {resolvedLogoUrl ? (
                        <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden mb-4 shadow-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={resolvedLogoUrl} alt={title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                            <ShareIcon className="w-10 h-10 text-black" />
                        </div>
                    )}

                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
                        {title || "Pandoras Link"}
                    </h1>
                    {slogan && (
                        <p className="text-sm text-gray-400 max-w-[250px] leading-relaxed">
                            {slogan}
                        </p>
                    )}
                </motion.div>

                {/* Primary Action: WhatsApp */}
                {whatsapp && (
                    <motion.div className="mb-8" variants={itemVariants}>
                        <button
                            onClick={handleWhatsappClick}
                            className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#1faa52] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                        >
                            <FaWhatsapp className="w-6 h-6" />
                            <span>Contactar por WhatsApp</span>
                        </button>
                    </motion.div>
                )}

                {/* Links List */}
                <motion.div className="space-y-4 mb-10" variants={itemVariants}>
                    {links?.map((link: any, index: number) => (
                        <a
                            key={index}
                            href={ensureAbsoluteUrl(link.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-3.5 px-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl text-center text-gray-200 font-medium transition-all hover:shadow-lg hover:shadow-black/20 flex items-center justify-between group"
                        >
                            <span className="w-5" /> {/* Spacer */}
                            <span>{link.label || link.url.replace(/^https?:\/\//, '')}</span>
                            <GlobeAltIcon className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                        </a>
                    ))}
                </motion.div>

                {/* Socials Grid */}
                {socials && Object.keys(socials).length > 0 && (
                    <motion.div className="flex justify-center flex-wrap gap-6 mb-8" variants={itemVariants}>
                        {Object.entries(socials).map(([key, url]) => (
                            <SocialIcon key={key} type={key} url={url as string} />
                        ))}
                    </motion.div>
                )}

                {/* Footer */}
                <motion.div className="text-center pt-8 border-t border-zinc-800/50" variants={itemVariants}>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-2">
                        POWERED BY PANDORAS
                    </p>
                    <div className="text-[10px] text-zinc-600 space-x-2">
                        <button onClick={() => setShowPrivacy(true)} className="hover:text-zinc-400 transition-colors">Privacy</button>
                        <span>•</span>
                        <button onClick={() => setShowTerms(true)} className="hover:text-zinc-400 transition-colors">Terms</button>
                    </div>
                </motion.div>

            </motion.div>

            {/* Privacy Modal */}
            <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
                <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Aviso de Privacidad</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Última actualización: Febrero 2026
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-sm text-zinc-300 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        <p>
                            Este servicio es provisto por Pandora's Finance para {title || "este proyecto"}. Al interactuar con este Smart QR y su Landing Page, procesamos datos básicos para fines de analítica y prestación del servicio.
                        </p>
                        <p>
                            <strong>Información que recolectamos:</strong> Dirección IP (anonimizada), tipo de dispositivo, navegador y procedencia geográfica general. No recolectamos datos de identificación personal sin su consentimiento explícito.
                        </p>
                        <p>
                            <strong>Finalidad:</strong> Mejorar la experiencia de usuario y proporcionar métricas de uso al creador del protocolo.
                        </p>
                        <p>
                            Para más información sobre nuestra infraestructura de privacidad, visite el Whitepaper técnico de Pandora's.
                        </p>
                    </div>
                    <div className="flex justify-end mt-4">
                        <DialogClose asChild>
                            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
                                Cerrar
                            </button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Terms Modal */}
            <Dialog open={showTerms} onOpenChange={setShowTerms}>
                <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Términos y Condiciones</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Condiciones de uso de Smart QR & Landing
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-sm text-zinc-300 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        <p>
                            Al utilizar este Smart QR, usted acepta los siguientes términos:
                        </p>
                        <ol className="list-decimal pl-4 space-y-2">
                            <li>El contenido mostrado en esta landing page es responsabilidad de {title || "el creador del proyecto"}.</li>
                            <li>Pandora's Finance actúa como proveedor de infraestructura tecnológica únicamente.</li>
                            <li>La redirección dinámica puede ser modificada por el administrador en cualquier momento.</li>
                            <li>El uso de este servicio implica la aceptación de nuestra política de analítica no invasiva.</li>
                        </ol>
                        <p>
                            Cualquier disputa legal relacionada con los activos ofrecidos (Tokens/NFTs) debe resolverse directamente con los emisores del protocolo.
                        </p>
                    </div>
                    <div className="flex justify-end mt-4">
                        <DialogClose asChild>
                            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
                                Cerrar
                            </button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

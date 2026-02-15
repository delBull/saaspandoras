'use client';

import { motion } from "framer-motion";
import {
    GlobeAltIcon,
    ShareIcon,
    ChatBubbleLeftIcon
} from "@heroicons/react/24/outline";

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

export function SmartQRLanding({ config, slug }: SmartQRLandingProps) {
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
                href={url}
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
                    {logoUrl ? (
                        <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden mb-4 shadow-xl">
                            <img src={logoUrl} alt={title} className="w-full h-full object-cover" />
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
                            href={link.url}
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
                        <span>Privacy</span>
                        <span>•</span>
                        <span>Terms</span>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}

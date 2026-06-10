'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Playfair_Display } from "next/font/google";
import { XMarkIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });

export function CinematicIntro({ videoSrc, projectName }: { videoSrc: string, projectName: string }) {
    const [showIntro, setShowIntro] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Solo mostrar la intro una vez por sesión para no interrumpir siempre
        const hasSeenIntro = sessionStorage.getItem(`seen_intro_${projectName}`);
        if (!hasSeenIntro) {
            setShowIntro(true);
            sessionStorage.setItem(`seen_intro_${projectName}`, 'true');
        }
    }, [projectName]);

    const handleSkip = () => {
        setShowIntro(false);
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    return (
        <AnimatePresence>
            {showIntro && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
                >
                    {/* VIDEO PLAYER */}
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        autoPlay
                        muted={isMuted}
                        playsInline
                        onEnded={handleSkip}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />

                    {/* OVERLAY GRADIENT */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60 pointer-events-none" />

                    {/* BRANDING */}
                    <div className="absolute top-10 left-0 w-full text-center z-10 pointer-events-none">
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 2 }}
                            className={`text-white/80 uppercase tracking-[5px] text-sm ${playfair.className}`}
                        >
                            {projectName}
                        </motion.h2>
                    </div>

                    {/* CONTROLS */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="absolute bottom-10 right-6 md:right-10 flex flex-col items-end gap-4 z-20"
                    >
                        {/* MUTE TOGGLE */}
                        <button
                            onClick={toggleMute}
                            className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors"
                        >
                            {isMuted ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                        </button>

                        {/* SKIP BUTTON */}
                        <button
                            onClick={handleSkip}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all text-xs tracking-widest uppercase"
                        >
                            <span className="mt-0.5">Saltar Teaser</span>
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

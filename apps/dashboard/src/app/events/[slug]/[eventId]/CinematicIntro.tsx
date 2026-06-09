'use client';

import { useState, useEffect, useRef } from 'react';
import { PlayIcon, SpeakerXMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

const VIDEO_URL = 'https://snarai.aztecaz.xyz/final_de_finales_mobile.mp4';

export function CinematicIntro({ eventId, children }: { eventId: number; children: React.ReactNode }) {
    const [showOverlay, setShowOverlay] = useState<boolean | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);
    const [showRewatch, setShowRewatch] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const seen = sessionStorage.getItem(`cinematic_intro_${eventId}`);
        setShowOverlay(!seen);
    }, [eventId]);

    const dismissIntro = () => {
        setFadeOut(true);
        setTimeout(() => {
            setShowOverlay(false);
            setShowRewatch(true);
        }, 600);
    };

    const handleSkip = () => {
        sessionStorage.setItem(`cinematic_intro_${eventId}`, 'true');
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = videoRef.current.duration;
        }
        dismissIntro();
    };

    const handleEnded = () => {
        sessionStorage.setItem(`cinematic_intro_${eventId}`, 'true');
        dismissIntro();
    };

    const handleRewatch = () => {
        setShowRewatch(false);
        setFadeOut(false);
        setShowOverlay(true);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(!isMuted);
        }
    };

    if (showOverlay === null) {
        return <>{children}</>;
    }

    if (!showOverlay) {
        return (
            <>
                {children}
                {showRewatch && (
                    <button
                        onClick={handleRewatch}
                        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white text-sm font-medium transition-all duration-300 hover:bg-white/20 hover:scale-105 shadow-2xl"
                    >
                        <PlayIcon className="w-4 h-4 text-[#D4A853]" />
                        Ver Introduccion
                    </button>
                )}
            </>
        );
    }

    return (
        <div
            className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center transition-opacity duration-600 ${
                fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onEnded={handleEnded}
                className="absolute inset-0 w-full h-full object-cover"
                src={VIDEO_URL}
            />

            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            {/* Watermark */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
                <div className="text-[0.6rem] uppercase tracking-[6px] text-[#D4A853]/60 font-light">
                    S&apos;NARAI
                </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-10 right-10 flex items-center gap-3">
                <button
                    onClick={toggleMute}
                    className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 hover:bg-white/20 hover:scale-105"
                    aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                    {isMuted ? (
                        <SpeakerXMarkIcon className="w-5 h-5" />
                    ) : (
                        <SpeakerWaveIcon className="w-5 h-5" />
                    )}
                </button>
                <button
                    onClick={handleSkip}
                    className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium transition-all duration-300 hover:bg-white/20 hover:scale-105"
                >
                    Saltar →
                </button>
            </div>
        </div>
    );
}

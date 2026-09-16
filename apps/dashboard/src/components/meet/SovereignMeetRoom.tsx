"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

interface SovereignMeetRoomProps {
    roomName: string; // The UUID meeting ID — appId prefix is added internally
    displayName: string;
    role: string;
    jwt: string;
    appId: string;
}

// Toolbar buttons for desktop (full feature set)
const DESKTOP_TOOLBAR: string[] = [
    'microphone',
    'camera',
    'desktop',
    'fullscreen',
    'hangup',
    'chat',
    'raisehand',
    'tileview',
    'select-background',
    'settings',
    'fodeviceselection',
    'filmstrip',
    'videoquality',
    'closedcaptions',
    'mute-everyone',
    'security',
];

// Minimal toolbar for mobile (fits in 375px without collapsing)
const MOBILE_TOOLBAR: string[] = [
    'microphone',
    'camera',
    'hangup',
    'chat',
    'raisehand',
    'tileview',
];

// Host-only extras (added on top of desktop set)
const HOST_EXTRAS: string[] = ['recording', 'mute-everyone', 'security'];

export function SovereignMeetRoom({
    roomName,
    displayName,
    role,
    jwt,
    appId,
}: SovereignMeetRoomProps) {
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isHost = role === "host" || role === "co_host";

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const toolbarButtons = isMobile
        ? MOBILE_TOOLBAR
        : isHost
        ? [...new Set([...DESKTOP_TOOLBAR, ...HOST_EXTRAS])]
        : DESKTOP_TOOLBAR;

    // JaaS (8x8.vc) room format: <appId>/<roomName>
    // The JWT `room` claim is set to `meetingId` (UUID) by /meet/token.
    // JaaS strips the appId prefix when matching against the JWT `room` claim.
    const fullRoomName = `${appId}/${roomName}`;

    return (
        <div
            className="w-full h-full min-h-[100dvh] bg-black overflow-hidden relative flex flex-col"
            ref={containerRef}
        >
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white z-10">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-lime-500/20 blur-xl rounded-full animate-pulse" />
                        <Loader2 className="w-10 h-10 animate-spin text-lime-500 relative z-10" />
                    </div>
                    <p className="text-lime-400 font-mono text-[10px] tracking-widest uppercase animate-pulse">
                        Estableciendo Conexión Soberana...
                    </p>
                </div>
            )}

            <div className="flex-1 w-full relative">
                <JitsiMeeting
                    domain="8x8.vc"
                    roomName={fullRoomName}
                    jwt={jwt}
                    configOverwrite={{
                        defaultLanguage: "es",
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        prejoinPageEnabled: true,
                        disableDeepLinking: true,

                        // --- Performance: optimized for 1:1 booking calls ---
                        resolution: 720,
                        maxFullResolutionParticipants: 2,
                        enableLayerSuspension: true,
                        p2p: {
                            enabled: true, // P2P for 2-person calls (host + lead) — less latency
                        },

                        // --- Noise / audio quality ---
                        enableNoAudioDetection: true,
                        enableNoisyMicDetection: true,

                        // --- Branding (configOverwrite path — supported in JaaS) ---
                        // Note: watermark/logo suppression is primarily configured in
                        // JaaS Console → Customization. These are belt-and-suspenders.
                        hideConferenceSubject: false, // Show the meeting title
                        disableThirdPartyRequests: false,

                        // --- Toolbar ---
                        toolbarButtons,
                    }}
                    interfaceConfigOverwrite={{
                        // Legacy flags — still honored by some JaaS deployments.
                        // Primary branding control is via JaaS Console → Customization.
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        TOOLBAR_ALWAYS_VISIBLE: !isMobile, // Auto-hide on mobile saves space
                        DEFAULT_REMOTE_DISPLAY_NAME: "Participante",
                        DISABLE_VIDEO_BACKGROUND: false, // Allow virtual backgrounds
                    }}
                    userInfo={{
                        displayName,
                        email: "",
                    }}
                    onApiReady={(externalApi) => {
                        setLoading(false);

                        externalApi.on("videoConferenceJoined", () => {
                            console.log("[Sovereign Meet] Joined room.");
                        });

                        externalApi.on("readyToClose", () => {
                            // When user hangs up, redirect back to dashboard
                            if (typeof window !== "undefined") {
                                window.location.href = "/";
                            }
                        });
                    }}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = "100%";
                        iframeRef.style.width = "100%";
                        iframeRef.style.border = "none";
                        iframeRef.style.background = "#000000";
                        // Mobile: ensure no rubber-banding / overscroll
                        iframeRef.style.overflow = "hidden";
                        iframeRef.style.position = "absolute";
                        iframeRef.style.inset = "0";
                    }}
                />
            </div>
        </div>
    );
}

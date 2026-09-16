"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

interface SovereignMeetRoomProps {
    roomName: string; // The opaque meeting ID
    displayName: string;
    role: string;
    jwt: string; 
    appId: string; 
}

export function SovereignMeetRoom({
    roomName,
    displayName,
    role,
    jwt,
    appId,
}: SovereignMeetRoomProps) {
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const isHost = role === "host" || role === "co_host";

    return (
        <div className="w-full h-full min-h-[100dvh] bg-black overflow-hidden relative flex flex-col" ref={containerRef}>
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
                    roomName={`${appId}/${roomName}`} // JaaS requires AppID prefix in room name usually, or it infers from JWT. Safe to prefix.
                    jwt={jwt}
                    configOverwrite={{
                        defaultLanguage: 'es',
                        startWithAudioMuted: false, 
                        startWithVideoMuted: false, 
                        prejoinPageEnabled: true, // Allow users to select camera/mic
                        toolbarButtons: [
                            'microphone',
                            'camera',
                            'closedcaptions',
                            'desktop',
                            'embedmeeting',
                            'fullscreen',
                            'fodeviceselection',
                            'hangup',
                            'profile',
                            'chat',
                            'recording',
                            'livestreaming',
                            'etherpad',
                            'sharedvideo',
                            'settings',
                            'raisehand',
                            'videoquality',
                            'filmstrip',
                            'invite',
                            'feedback',
                            'stats',
                            'shortcuts',
                            'tileview',
                            'select-background',
                            'download',
                            'help',
                            'mute-everyone',
                            'security'
                        ],
                        disableDeepLinking: true,
                        // Enable modern UI
                        enableNoAudioDetection: true,
                        enableNoisyMicDetection: true,
                    }}
                    interfaceConfigOverwrite={{
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        TOOLBAR_ALWAYS_VISIBLE: true,
                        DEFAULT_REMOTE_DISPLAY_NAME: 'Participante',
                        DISABLE_VIDEO_BACKGROUND: true,
                        // Make it match Pandora's dark theme
                        MAIN_TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup', 'profile', 'chat', 'settings', 'raisehand', 'videoquality', 'filmstrip', 'tileview', 'select-background'],
                    }}
                    userInfo={{
                        displayName: displayName,
                        email: "" // Optional
                    }}
                    onApiReady={(externalApi) => {
                        setLoading(false);
                        
                        // Enforce branding adjustments if needed
                        externalApi.on('videoConferenceJoined', () => {
                            console.log('[Sovereign Meet] Joined room.');
                        });
                    }}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                        iframeRef.style.border = 'none';
                        iframeRef.style.background = '#000000';
                    }}
                />
            </div>
        </div>
    );
}

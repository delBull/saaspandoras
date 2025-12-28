
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
    return <div className="relative inline-block">{children}</div>;
};

export const TooltipTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => {
    // Basic implementation: clone element to add handlers if asChild, or wrap
    // For simplicity with asChild=true, we assume the child accepts onMouseEnter/Leave
    // But to avoid complex clone logic for now without checks, we'll rely on Context if possible.
    // Actually, simple structure: Tooltip wraps Trigger and Content.
    return <>{children}</>;
};


// Simplified approach: Custom Tooltip Component using Portal to escape overflow
import { createPortal } from "react-dom";

export function SimpleTooltip({
    children,
    content
}: {
    children: React.ReactNode;
    content: React.ReactNode;
}) {
    const [isVisible, setIsVisible] = useState(false);
    // Use a ref to track the trigger element for positioning if needed, 
    // but for this simple version, fixed positioning near the mouse or simple offset might be tricky without a library like floating-ui.
    // However, the USER request is specifically "por fuera del wrap".
    // A simple portal with absolute positioning relative to the offsetParent might fail if offsetParent is the clipped one.
    // We will use fixed positioning calculated from the trigger's rect.

    const [coords, setCoords] = useState<{ top: number, left: number } | null>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Position above the element centered
        setCoords({
            top: rect.top - 10, // 10px spacing above
            left: rect.left + rect.width / 2
        });
        setIsVisible(true);
    };

    return (
        <>
            <div
                className="relative inline-flex items-center"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsVisible(false)}
            >
                {children}
            </div>
            {isVisible && coords && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'fixed',
                            top: coords.top,
                            left: coords.left,
                            transform: 'translate(-50%, -100%)', // Centered horizontally, moved up 100% to sit above
                            zIndex: 9999
                        }}
                        className="px-3 py-1.5 bg-black border border-zinc-800 text-white text-xs rounded-lg whitespace-nowrap shadow-xl pointer-events-none"
                    >
                        {content}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

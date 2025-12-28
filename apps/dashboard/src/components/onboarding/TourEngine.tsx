
"use client";

import { useEffect, useState, createContext, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { driver } from 'driver.js';
import "driver.js/dist/driver.css";
import "./tour.css";
import { usePersistedAccount } from '@/hooks/usePersistedAccount';
import { useRealGamification } from '@/hooks/useRealGamification';

// --- CONFIGURATION ---

export type StepType = 'INFO' | 'ACTION';

export interface TourStep {
    id: string;
    target?: string; // DOM selector. If undefined, it's a modal.
    title: string;
    content: string;
    type: StepType;
    isMandatory?: boolean;
    // If present, this condition must be true to auto-advance
    checkCondition?: (context: any) => boolean;
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome_modal',
        title: 'Bienvenido a Pandora\'s OS',
        content: 'Tu gateway a la infraestructura digital soberana. Te daremos un breve recorrido para que obtengas tu Llave Maestra.',
        type: 'INFO'
    },
    {
        id: 'connect_wallet',
        target: '#wallet-connect-btn',
        title: 'Misión 1: Tu Identidad',
        content: 'Para operar necesitas tu Llave (Wallet). <br/><strong>Conecta tu Wallet ahora</strong> para continuar.',
        type: 'ACTION',
        isMandatory: true,
        checkCondition: (ctx) => !!ctx.account?.address
    },
    {
        id: 'carousel_discovery',
        target: '#tour-carousel',
        title: 'Explora el Ecosistema',
        content: 'Aquí encontrarás los proyectos más destacados y nuevas oportunidades de inversión.',
        type: 'INFO'
    },
    {
        id: 'notifications_center',
        target: '#tour-notifications',
        title: 'Centro de Comando',
        content: 'Mantente alerta. Aquí recibirás notificaciones de gobernanza y estado de tus aplicaciones.',
        type: 'INFO'
    },
    {
        id: 'governance_participation',
        target: '#tour-governance',
        title: 'Gobernanza Activa',
        content: 'Tu voz cuenta. Participa en las decisiones del DAO y adquiere poder de voto.',
        type: 'INFO'
    },
    {
        id: 'assets_vault',
        target: '#tour-assets',
        title: 'Tu Bóveda',
        content: 'Tus activos digitales viven aquí. Alterna entre "Accesos" (Apps) y "Artefactos" (NFTs).',
        type: 'INFO'
    }
];

// --- CONTEXT ---

interface TourContextType {
    startTour: () => void;
    currentStepIndex: number;
    isOpen: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function useTour() {
    return useContext(TourContext);
}

// --- ENGINE COMPONENT ---

export function TourEngine({ children }: { children: ReactNode }) {
    const { account } = usePersistedAccount();
    const { trackNewEvent } = useRealGamification(account?.address);
    const [isOpen, setIsOpen] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    // Ref to track current index accurately inside closures (driver.js callbacks)
    const currentIndexRef = useRef(0);
    const driverRef = useRef<any>(null);

    // Initial Check
    useEffect(() => {
        const hasCompleted = localStorage.getItem('pandoras_tour_completed');
        if (!hasCompleted) {
            setTimeout(() => startTour(), 1500);
        }
    }, []);

    // Watch for conditions (Auto Advance)
    useEffect(() => {
        if (!isOpen) return;

        const currentStep = TOUR_STEPS[currentStepIndex];
        if (!currentStep) return;

        if (currentStep.type === 'ACTION' && currentStep.checkCondition) {
            const isMet = currentStep.checkCondition({ account });
            if (isMet) {
                setTimeout(() => {
                    handleNext();
                }, 1000);
            }
        }
        // Sync ref just in case
        currentIndexRef.current = currentStepIndex;
    }, [account, currentStepIndex, isOpen]);

    const startTour = () => {
        setIsOpen(true);
        setCurrentStepIndex(0);
        currentIndexRef.current = 0;
        showStep(0);
    };

    const finishTour = () => {
        setIsOpen(false);
        driverRef.current?.destroy();
        localStorage.setItem('pandoras_tour_completed', 'true');

        if (account?.address) {
            void trackNewEvent('onboarding_tour_completed', {
                source: 'onboarding_tour',
                timestamp: new Date().toISOString()
            });
        }
    };

    // Use Ref to avoid stale closures in driver.js callbacks
    const handleNext = () => {
        const nextIdx = currentIndexRef.current + 1;
        if (nextIdx >= TOUR_STEPS.length) {
            finishTour();
        } else {
            setCurrentStepIndex(nextIdx);
            currentIndexRef.current = nextIdx;
            showStep(nextIdx);
        }
    };

    const handlePrev = () => {
        const prevIdx = currentIndexRef.current - 1;
        if (prevIdx >= 0) {
            setCurrentStepIndex(prevIdx);
            currentIndexRef.current = prevIdx;
            showStep(prevIdx);
        }
    };

    const showStep = async (index: number) => {
        const step = TOUR_STEPS[index];
        if (!step) return;

        if (!driverRef.current) {
            driverRef.current = driver({
                animate: true,
                overlayOpacity: 0.85,
                allowClose: false,
                overlayColor: '#000000',
                showProgress: true,
                steps: [],
                onDestroy: () => setIsOpen(false),
                onPopoverRender: (popover: any) => {
                    if (!popover.wrapper) return;

                    popover.wrapper.style.fontFamily = 'inherit';
                    popover.wrapper.classList.add('driverjs-theme');

                    // Inject Skip Button ABSOLUTELY (Independent of footer)
                    // Check if exists
                    if (!popover.wrapper.querySelector('.driver-popover-skip-btn')) {
                        const skipBtn = document.createElement('button');
                        skipBtn.innerText = 'Omitir';
                        skipBtn.className = 'driver-popover-skip-btn';
                        // Force absolute positioning via inline style to guarantee it works even if CSS lags
                        skipBtn.style.position = 'absolute';
                        skipBtn.style.bottom = '16px';
                        skipBtn.style.left = '16px';
                        skipBtn.style.zIndex = '1000';

                        skipBtn.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            finishTour();
                        };
                        popover.wrapper.appendChild(skipBtn);
                    }
                }
            } as any);
        }

        const drive = driverRef.current;
        const isAction = step.type === 'ACTION' && step.isMandatory;

        drive.setConfig({
            allowClose: !isAction,
            showButtons: !isAction ? ['next', 'previous'] : [],
        });

        let targetElement = step.target;
        if (targetElement && targetElement !== 'body') {
            try {
                // Extended poll for element (5 seconds)
                let attempts = 0;
                while (!document.querySelector(targetElement) && attempts < 25) {
                    await new Promise(r => setTimeout(r, 200));
                    attempts++;
                }

                if (!document.querySelector(targetElement)) {
                    console.warn(`Tour target ${targetElement} not found after wait.`);
                    targetElement = undefined;
                }
            } catch (e) {
                targetElement = undefined;
            }
        }

        const popoverConfig = {
            title: step.title,
            description: step.content,
            side: "bottom",
            align: 'start',
            onNextClick: handleNext,
            onPrevClick: handlePrev,
            showButtons: !isAction ? ['next', 'previous'] : [],
            popoverClass: 'driverjs-theme'
        };

        if (targetElement) {
            drive.highlight({
                element: targetElement,
                popover: popoverConfig
            });
        } else {
            drive.highlight({
                element: 'body',
                popover: {
                    ...popoverConfig,
                    side: "center",
                    align: 'center'
                }
            });
        }
    };

    return (
        <TourContext.Provider value={{ startTour, currentStepIndex, isOpen }}>
            {children}
        </TourContext.Provider>
    );
}

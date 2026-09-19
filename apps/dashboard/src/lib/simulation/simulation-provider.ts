/**
 * SimulationDataProvider
 * 
 * Provides purely synthetic, ephemeral data for tenants in "Simulation Mode".
 * This ensures that the mock data logic is strictly separated from the real data
 * resolution logic. When a project is NOT in simulation mode, this provider MUST NOT be called.
 */

export class SimulationDataProvider {
    static getSimulatedState(project: any) {
        return {
            title: project.title,
            slug: project.slug,
            tagline: project.tagline || "Tu slogan aparecerá aquí",
            status: project.status || "active",
            currentSupply: 5000,
            userBalance: 2,
            userVotingPower: 15,
            userRewards: 1,
            userRewardsValue: 125.50,
            isWhitelisted: true,
            dbUserStatus: "verified",
            isGestor: false,
            gestorStatus: "none",
            canClaim: true,
            activities: [
                {
                    id: "mock_activity_1",
                    title: "Reunión Estratégica Trimestral",
                    description: "Participa en la junta de mesa directiva simulada.",
                    reward: "50 USDC",
                    type: "meeting",
                    category: "governance",
                    link: "#"
                }
            ],
            governance: {
                activeProposalsCount: 1,
                proposals: [
                    {
                        id: "mock_prop_1",
                        proposalId: "prop-01",
                        title: "Ejemplo: Votación de Presupuesto Q4",
                        status: "Active"
                    }
                ]
            },
            onboarding: {
                title: "¿Qué Sigue?",
                steps: [
                    {
                        title: "Verifica tu Posición",
                        description: "Tu certificado ya es inmutable en la red Blockchain. Puedes verlo en la sección de 'Mis Activos'."
                    },
                    {
                        title: "Participa en el DAO",
                        description: "Usa tu Poder de Voto para influir en las decisiones del proyecto."
                    },
                    {
                        title: "Reclama tus Utilidades",
                        description: "Cuando el proyecto genere rendimientos, aparecerán en tu balance."
                    }
                ]
            },
            certificates: [
                {
                    isVerifiable: true,
                    agreementId: "SIMULATED-CERT-01",
                    agreementHash: "PENDING-SIMULATION",
                    legalPortalUrl: "#",
                    status: "certified",
                    units: 2,
                    amount: 100,
                    date: new Date().toISOString()
                }
            ],
            globalCertificate: {
                isVerifiable: true,
                totalUnits: 2,
                totalAmount: 100,
                globalPortalUrl: "#",
                status: "certified"
            },
            holdersCount: 42,
            treasuryDisplay: "$ 50,000.00",
            isAmbassador: false,
            referralCode: null,
            ambassadorStats: null,
            userPortfolio: {
                totalTitles: 2,
                currentTotalValueUsd: 100,
                phaseBreakdown: [
                    {
                        id: "mock_phase_1",
                        name: "Fase 1 (Seed)",
                        price: 50,
                        titlesHeld: 2,
                        plusvalia: 15,
                        isActive: true
                    }
                ]
            },
            legal: project.legalConfig || {},
            knowledgeCenter: {
                isActive: true,
                url: "#",
                briefings: [
                    {
                        id: "mock_briefing_1",
                        slug: "welcome-guide",
                        title: "Guía de Bienvenida (Simulación)",
                        subtitle: "Aprende a usar tu portal",
                        blocks: [],
                        updatedAt: new Date().toISOString()
                    }
                ]
            },
            documents: [
                {
                    id: "mock_doc_1",
                    title: "Documento Institucional de Prueba",
                    category: "PROJECT_INTELLIGENCE",
                    intent: "PDF",
                    objective: "Muestra de cómo se verían tus documentos",
                    url: "#",
                    rawCategory: "project_overview",
                    rawStatus: "active",
                    rawVerification: "VERIFIED",
                    contentPreview: [{ section: 'Estado', text: 'Simulado' }]
                }
            ],
            events: [],
            resources: [],
            phases: [
                {
                    id: "mock_phase_1",
                    name: "Fase Inicial Simulada",
                    status: "active",
                    allocation: 10000,
                    sold: 5000,
                    remaining: 5000,
                    price: 50,
                    cryptoPrice: 0.05,
                    progress: 50,
                    isSoldOut: false
                }
            ],
            metadata: {
                agoraEnabled: project.w2eConfig?.agoraEnabled || false,
                estimatedApy: project.estimatedApy || "12.5%",
                targetAmount: "500000",
                tokenPriceUsd: "50",
                nextPhasePriceUsd: "75",
                tokenPriceCrypto: "0.05",
                deliveryDate: project.w2eConfig?.deliveryDate || "Q4 2027",
                totalUnits: 10000,
                soldUnits: 5000,
                availableUnits: 5000,
                progressPercentage: 50,
                phaseName: "Fase Principal",
                aiBotUrl: project.w2eConfig?.aiBotUrl || null,
                markdownDocs: null
            },
            metrics: {
                urgency: "medium"
            },
            timestamp: new Date().toISOString(),
            isSimulationMode: true
        };
    }
}

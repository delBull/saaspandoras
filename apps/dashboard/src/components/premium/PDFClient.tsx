'use client';

import { useState, useRef } from 'react';
import { ArrowLeftIcon, DocumentArrowDownIcon, ShareIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

type Design = 'cliente_final' | 'realtor' | 'inversor';

const DESIGNS: { id: Design; label: string; icon: string }[] = [
    { id: 'cliente_final', label: 'Cliente Final', icon: '👤' },
    { id: 'realtor', label: 'Realtor', icon: '🏠' },
    { id: 'inversor', label: 'Inversor', icon: '📈' },
];

const TAGLINE = 'No vendemos propiedades. Construimos acceso.';

export function PDFClient({ project }: { project: any }) {
    const router = useRouter();
    const [design, setDesign] = useState<Design>('cliente_final');
    const [copied, setCopied] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const projectUrl = `https://pandoras.finance/projects/${project.slug}`;
    const whatsappNumber = project.whatsappPhone || '523222741987';

    const handlePrint = () => { window.print(); };

    const handleWhatsApp = () => {
        const designLabel = DESIGNS.find(d => d.id === design)?.label || '';
        const text = encodeURIComponent(
            `🚀 *${project.title}* — Perfil Premium (${designLabel})\n\n` +
            `Descarga el PDF aquí: ${shareUrl}\n\n` +
            `📍 Proyecto: ${projectUrl}`
        );
        window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8 print:hidden">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span className="text-sm font-bold">Volver</span>
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-xl text-sm font-bold transition-all border border-[#25D366]/30">
                        <ShareIcon className="w-4 h-4" />
                        WhatsApp
                    </button>
                    <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-bold transition-all border border-zinc-800">
                        {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ShareIcon className="w-4 h-4" />}
                        {copied ? 'Copiado' : 'Copiar Link'}
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-black rounded-xl text-sm font-black transition-all">
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Descargar PDF
                    </button>
                </div>
            </div>

            {/* Design Selector */}
            <div className="flex items-center gap-2 mb-8 print:hidden">
                {DESIGNS.map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setDesign(d.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${design === d.id
                                ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-600/10'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                            }`}
                    >
                        <span>{d.icon}</span>
                        {d.label}
                    </button>
                ))}
            </div>

            {/* PDF Preview */}
            <div ref={printRef} className="bg-white text-black rounded-3xl overflow-hidden shadow-2xl border border-zinc-800">
                {design === 'cliente_final' && <ClienteFinalDesign project={project} />}
                {design === 'realtor' && <RealtorDesign project={project} />}
                {design === 'inversor' && <InversorDesign project={project} />}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0.4in; size: A4; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}

function QRCode({ url, label }: { url: string; label: string }) {
    return (
        <div className="flex flex-col items-center gap-3 py-6">
            <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(url)}`}
                alt={`QR: ${url}`}
                className="w-[130px] h-[130px]"
            />
            <div className="text-xs text-gray-400 text-center max-w-[200px] leading-tight">{label}</div>
        </div>
    );
}

/* ───── Cliente Final ───── */
function ClienteFinalDesign({ project }: { project: any }) {
    const metrics = [
        project.targetAmount && Number(project.targetAmount) > 0
            ? { label: 'Oportunidad de Participación', value: `$${Number(project.targetAmount).toLocaleString()}` }
            : null,
        project.totalValuationUsd && Number(project.totalValuationUsd) > 0
            ? { label: 'Valor del Proyecto', value: `$${Number(project.totalValuationUsd).toLocaleString()}` }
            : null,
        project.estimatedApy
            ? { label: 'Potencial de Crecimiento', value: project.estimatedApy }
            : null,
        { label: 'Etapa Actual', value: project.status === 'active' ? 'Acceso Temprano' : project.status === 'funded' ? 'En Crecimiento' : 'Pre-Lanzamiento' },
    ].filter(Boolean);

    const steps = [
        { title: 'Descubre', desc: 'Conoce la visión, el equipo y el propósito detrás del proyecto.' },
        { title: 'Conecta', desc: 'Agenda una conversación y resuelve todas tus dudas directamente.' },
        { title: 'Accede', desc: 'Únete a la red de participación temprana y recibe beneficios exclusivos.' },
        { title: 'Crece', desc: 'Sé parte de la comunidad que está construyendo el futuro del acceso.' },
    ];

    return (
        <div className="p-8 sm:p-12 md:p-16">
            {/* Header */}
            <div className="flex items-center gap-6 mb-10 pb-10 border-b-4 border-amber-500">
                {project.logoUrl && (
                    <img src={project.logoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                )}
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">{project.title}</h1>
                    <p className="text-lg text-amber-600 font-bold mt-1">{TAGLINE}</p>
                </div>
            </div>

            {/* Value Prop */}
            <div className="mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">La Oportunidad</h2>
                <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                <p className="text-gray-700 text-lg leading-relaxed">
                    {project.description || 'Un proyecto construido sobre la infraestructura de Pandora\'s, ofreciendo acceso temprano a una red de participación y crecimiento.'}
                </p>
                {project.tagline && (
                    <p className="text-amber-700 font-semibold mt-3 italic">"{project.tagline}"</p>
                )}
            </div>

            {/* Key Metrics */}
            <div className="mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Momentum</h2>
                <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metrics.map((m: any, i) => m && (
                        <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                            <div className="text-2xl font-black text-amber-600">{m.value}</div>
                            <div className="text-sm text-gray-500 font-medium mt-1">{m.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Steps */}
            <div className="mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Tu Camino</h2>
                <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {steps.map((s, i) => (
                        <div key={i} className="relative">
                            <div className="text-4xl font-black text-amber-500/30 mb-2">0{i + 1}</div>
                            <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* QR */}
            <div className="border-t border-gray-200">
                <QRCode
                    url="https://snarai.aztecaz.xyz/"
                    label="Escanea para conocer más sobre esta oportunidad"
                />
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-gray-200 flex items-center justify-between text-sm text-gray-400">
                <span>Generado por Pandora's Finance</span>
                <span>{TAGLINE}</span>
            </div>
        </div>
    );
}

/* ───── Realtor ───── */
function RealtorDesign({ project }: { project: any }) {
    const commissionTiers = [
        { tier: 'Bronce', volume: 'Hasta $10K USD referidos', commission: '5%', badge: '🥉' },
        { tier: 'Plata', volume: '$10K - $50K USD referidos', commission: '8%', badge: '🥈' },
        { tier: 'Oro', volume: '$50K - $100K USD referidos', commission: '12%', badge: '🥇' },
        { tier: 'Platino', volume: '$100K+ USD referidos', commission: '15% + Bonos', badge: '💎' },
    ];

    const steps = [
        { step: '1', title: 'Regístrate como Partner', desc: 'Completa tu registro y accede a la red de partners.' },
        { step: '2', title: 'Presenta la Oportunidad', desc: 'Comparte el proyecto con clientes que buscan acceso a oportunidades exclusivas.' },
        { step: '3', title: 'Acompaña el Proceso', desc: 'Guíalos en su camino de participación y conexión con el proyecto.' },
        { step: '4', title: 'Crece con Nosotros', desc: 'Recibe los beneficios del programa y escala tu red de contactos.' },
    ];

    return (
        <div className="p-8 sm:p-12 md:p-16">
            {/* Header */}
            <div className="flex items-center gap-6 mb-10 pb-10 border-b-4 border-amber-500">
                {project.logoUrl && (
                    <img src={project.logoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                )}
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">{project.title}</h1>
                    <p className="text-lg text-amber-600 font-bold mt-1">{TAGLINE}</p>
                </div>
            </div>

            {/* Partnership Description */}
            <div className="mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Red de Partners</h2>
                <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                <p className="text-gray-700 text-lg leading-relaxed">
                    Conviértete en Partner Oficial de {project.title} y forma parte de una red que está
                    redefiniendo el acceso a oportunidades. Como partner, tendrás acceso a materiales
                    exclusivos, soporte dedicado y las mejores condiciones del mercado para tus clientes.
                </p>
            </div>

            {/* Commission Tiers */}
            <div className="mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Programa de Partners</h2>
                <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {commissionTiers.map((t) => (
                        <div key={t.tier} className="bg-gray-50 rounded-2xl p-5 border border-gray-200 text-center">
                            <div className="text-3xl mb-2">{t.badge}</div>
                            <div className="text-lg font-black text-gray-900">{t.tier}</div>
                            <div className="text-2xl font-black text-amber-600 my-2">{t.commission}</div>
                            <div className="text-xs text-gray-500">{t.volume}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Process */}
            <div className="mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">¿Cómo Funciona?</h2>
                <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                <div className="space-y-6">
                    {steps.map((s) => (
                        <div key={s.step} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500 text-black font-black flex items-center justify-center flex-shrink-0 text-lg">
                                {s.step}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                                <p className="text-gray-500">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-black text-gray-900 mb-2">¿Listo para ser Partner?</h3>
                <p className="text-gray-500 text-sm mb-4">
                    Contáctanos por WhatsApp para recibir tu acceso y materiales exclusivos.
                </p>
                <div className="inline-block bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold text-sm">
                    WhatsApp: +{project.whatsappPhone || '52 322 274 1987'}
                </div>
            </div>

            {/* QR */}
            <div className="border-t border-gray-200">
                <QRCode
                    url="https://snarai.aztecaz.xyz/gestores"
                    label="Escanea para unirte a la red de partners"
                />
            </div>

            {/* Footer */}
            <div className="pt-8 mt-12 border-t border-gray-200 flex items-center justify-between text-sm text-gray-400">
                <span>Generado por Pandora's Finance</span>
                <span>{TAGLINE}</span>
            </div>
        </div>
    );
}

/* ───── Inversor ───── */
function InversorDesign({ project }: { project: any }) {
    const walletDisplay = (addr: string) =>
        addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—';

    const tokenDist = project.tokenDistribution && typeof project.tokenDistribution === 'object'
        ? Object.entries(project.tokenDistribution as Record<string, number>)
        : null;

    const financials = [
        project.targetAmount && Number(project.targetAmount) > 0
            ? { label: 'Oportunidad Total', value: `$${Number(project.targetAmount).toLocaleString()} USD` }
            : null,
        project.totalValuationUsd && Number(project.totalValuationUsd) > 0
            ? { label: 'Valor del Proyecto', value: `$${Number(project.totalValuationUsd).toLocaleString()} USD` }
            : null,
        project.tokenPriceUsd && Number(project.tokenPriceUsd) > 0
            ? { label: 'Precio de Referencia', value: `$${Number(project.tokenPriceUsd)} USD` }
            : null,
        project.estimatedApy
            ? { label: 'Proyección de Crecimiento', value: project.estimatedApy }
            : null,
        project.totalTokens
            ? { label: 'Oferta Total', value: Number(project.totalTokens).toLocaleString() }
            : null,
        project.tokensOffered
            ? { label: 'Disponible para Participación', value: Number(project.tokensOffered).toLocaleString() }
            : null,
    ].filter(Boolean);

    const teamMembers = project.teamMembers && Array.isArray(project.teamMembers)
        ? project.teamMembers.slice(0, 6)
        : null;

    const advisors = project.advisors && Array.isArray(project.advisors)
        ? project.advisors.slice(0, 4)
        : null;

    return (
        <div className="p-8 sm:p-12 md:p-16">
            {/* Header */}
            <div className="flex items-center gap-6 mb-10 pb-10 border-b-4 border-amber-500">
                {project.logoUrl && (
                    <img src={project.logoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                )}
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">{project.title}</h1>
                    <p className="text-lg text-amber-600 font-bold mt-1">{TAGLINE}</p>
                    <p className="text-sm text-gray-400 mt-1">Documento Informativo — Oportunidad de Participación Temprana</p>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Resumen Ejecutivo</h2>
                <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                <p className="text-gray-700 text-lg leading-relaxed">
                    {project.description || 'Oportunidad de participación temprana en el ecosistema Pandora\'s.'}
                </p>
                {project.tagline && (
                    <p className="text-amber-700 font-semibold mt-3 italic">"{project.tagline}"</p>
                )}
            </div>

            {/* Financial Highlights */}
            <div className="mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Panorama General</h2>
                <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {financials.map((f: any, i: number) => f && (
                        <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                            <div className="text-sm font-medium text-gray-400 mb-1">{f.label}</div>
                            <div className="text-xl font-black text-gray-900">{f.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tokenomics */}
            {tokenDist && tokenDist.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Distribución</h2>
                    <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                    <div className="space-y-3">
                        {tokenDist.map(([key, value]: [string, any], i: number) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-900 capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className="font-bold text-amber-600">{value}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(Number(value), 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Team */}
            {teamMembers && teamMembers.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Equipo</h2>
                    <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {teamMembers.map((m: any, i: number) => (
                            <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                                <div className="font-bold text-gray-900">{m.name || '—'}</div>
                                <div className="text-sm text-gray-500">{m.position || '—'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Advisors */}
            {advisors && advisors.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Consejeros</h2>
                    <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {advisors.map((a: any, i: number) => (
                            <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                                <div className="font-bold text-gray-900">{a.name || '—'}</div>
                                <div className="text-sm text-gray-500">{a.position || '—'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trust & Transparency */}
            <div className="mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Transparencia</h2>
                <div className="w-16 h-1 bg-amber-500 rounded-full mb-6" />
                <div className="grid sm:grid-cols-2 gap-4">
                    {project.chainId && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <div className="text-sm text-gray-400">Red</div>
                            <div className="font-bold text-gray-900">Chain ID: {project.chainId}</div>
                        </div>
                    )}
                    {project.contractAddress && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <div className="text-sm text-gray-400">Contrato</div>
                            <div className="font-bold text-gray-900 font-mono text-sm">{walletDisplay(project.contractAddress)}</div>
                        </div>
                    )}
                    {project.legalStatus && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <div className="text-sm text-gray-400">Estatus Legal</div>
                            <div className="font-bold text-gray-900 capitalize">{project.legalStatus}</div>
                        </div>
                    )}
                    {project.valuationDocumentUrl && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <div className="text-sm text-gray-400">Documento de Valoración</div>
                            <div className="font-bold text-amber-600">Disponible</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-black text-gray-900 mb-2">Conversemos</h3>
                <p className="text-gray-500 text-sm mb-4">
                    Para agendar una conversación con el equipo o acceder a información más detallada,
                    contáctanos por WhatsApp.
                </p>
                <div className="inline-block bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold text-sm">
                    WhatsApp: +{project.whatsappPhone || '52 322 274 1987'}
                </div>
            </div>

            {/* QR */}
            <div className="border-t border-gray-200">
                <QRCode
                    url="https://snarai.aztecaz.xyz/"
                    label="Escanea para conocer más sobre esta oportunidad"
                />
            </div>

            {/* Footer */}
            <div className="pt-8 mt-12 border-t border-gray-200 flex items-center justify-between text-sm text-gray-400">
                <span>Documento Informativo — Generado por Pandora's Finance</span>
                <span>{TAGLINE}</span>
            </div>
        </div>
    );
}

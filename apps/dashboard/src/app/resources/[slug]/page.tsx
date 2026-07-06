import { db } from "@/db";
import { projects, projectEvents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Playfair_Display, Inter } from "next/font/google";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowRightIcon, DocumentTextIcon, ChatBubbleOvalLeftEllipsisIcon, MegaphoneIcon } from "@heroicons/react/24/outline";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "600"] });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const slug = (await params).slug;
    const [project] = await db.select({ title: projects.title }).from(projects).where(eq(projects.slug, slug));
    
    if (!project) return { title: 'Resource Hub' };
    
    return {
        title: `${project.title} — Founder Session Resources`,
        description: `Recursos exclusivos y documentación para inversores de ${project.title}.`
    };
}

export default async function ResourceHubPage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;
    
    // ... inside the component
    const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
    
    if (!project) {
        notFound();
    }

    // Default configuration based on the provided HTML if not in DB
    const config = (project.extraConfig as any)?.resourceHub || {
        documents: [
            { title: 'Dossier Ejecutivo', url: '#', desc: 'Resumen estratégico del proyecto' },
            { title: 'Términos y Condiciones', url: '#', desc: 'Marco operativo y documentación legal' },
            { title: 'Whitepaper', url: '#', desc: 'Arquitectura, visión y funcionamiento' }
        ],
        community: [
            { label: 'Canal Oficial', url: '#', type: 'channel' },
            { label: 'Telegram', url: 'https://t.me/+SNaraiChannel', type: 'chat' }
        ]
    };

    // Dynamic Base URL extraction for ALL projects
    // Priority: 1) website -> 2) allowedDomains (Widget Hub) -> 3) fallback
    let dynamicDomain = project.website;
    if (!dynamicDomain && Array.isArray(project.allowedDomains) && project.allowedDomains.length > 0) {
        dynamicDomain = project.allowedDomains[0] as string;
    }
    if (!dynamicDomain) {
        dynamicDomain = 'https://snarai.aztecaz.xyz';
    }
    
    // Ensure the domain has an http scheme so it's treated as an absolute URL by the browser
    if (!dynamicDomain.startsWith('http://') && !dynamicDomain.startsWith('https://')) {
        dynamicDomain = `https://${dynamicDomain}`;
    }
    
    const baseUrl = dynamicDomain.replace(/\/$/, '');

    // Allow dynamic PDF links to be used as provided in the DB without forcing the markdown viewer
    if (config.documents) {
        // We leave config.documents untouched so it respects the user's uploaded PDFs
    }

    // Find if there is an active event for the project
    const activeEvents = await db.select()
        .from(projectEvents)
        .where(
            and(
                eq(projectEvents.projectId, project.id),
                eq(projectEvents.isActive, true)
            )
        )
        .orderBy(desc(projectEvents.createdAt))
        .limit(1);

    const activeEvent = activeEvents.length > 0 ? activeEvents[0] : null;

    let calendarConfig = null;
    if (activeEvent) {
        calendarConfig = {
            isActive: true,
            calendarUrl: `https://dash.pandoras.finance/events/${project.slug}/${activeEvent.id}`
        };
    } else if ((project.extraConfig as any)?.sovereignCalendar?.isActive) {
        calendarConfig = (project.extraConfig as any).sovereignCalendar;
    }

    // Portal link (Fallback to dynamic domain since portal is a modal on the main site)
    const portalUrl = baseUrl;

    return (
        <main className={`h-screen bg-[#050505] text-white flex flex-col overflow-hidden ${inter.className}`}>
            
            {/* Animated Gradient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,168,83,0.08)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(212,168,83,0.05)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(212,168,83,0.03)_0%,transparent_60%)] animate-[pulse_8s_ease-in-out_infinite]" />
            </div>

            <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 max-w-[1600px] mx-auto w-full h-full overflow-hidden">
                
                {/* LEFT ZONE: BRAND & PORTAL */}
                <div className="flex flex-col justify-center p-10 lg:p-[80px_60px] border-b lg:border-b-0 lg:border-r border-[#D4A853]/10 text-center lg:text-left items-center lg:items-start">
                    
                    <div className="mb-[40px] lg:mb-[60px] animate-[fadeInUp_0.6s_ease_backwards]">
                        <h1 className={`text-[2.5rem] lg:text-[3.5rem] font-bold tracking-[2px] mb-[15px] bg-gradient-to-br from-[#D4A853] via-[#E8C97A] to-[#D4A853] text-transparent bg-clip-text ${playfair.className} uppercase`}>
                            {project.title}
                        </h1>
                        <div className="text-[0.75rem] uppercase tracking-[4px] text-[#888888] mb-[20px]">
                            Founder Session Resources
                        </div>
                        <div className="text-[1rem] font-light text-[#888888] leading-[1.6] max-w-[400px]">
                            Gracias por acompañarnos.
                            <br /><br />
                            Lo que acabas de ver es el inicio de una visión más amplia.
                        </div>
                    </div>

                    <div className="mt-0 lg:mt-[40px] w-full max-w-[400px] animate-[fadeInUp_0.6s_ease_backwards] [animation-delay:0.1s]">
                        <div className="text-[0.7rem] uppercase tracking-[3px] text-[#D4A853] mb-[20px] flex items-center gap-[15px] after:content-[''] after:flex-1 after:h-[1px] after:bg-gradient-to-r after:from-[#D4A853] after:to-transparent">
                            Explorar
                        </div>
                        <div className="bg-gradient-to-br from-[#D4A853]/10 to-black/40 border border-[#D4A853]/20 p-[40px] transition-all duration-400 hover:border-[#D4A853] hover:-translate-y-[5px] hover:shadow-[0_30px_60px_rgba(212,168,83,0.1)] group">
                            <h2 className="text-[1.3rem] font-semibold mb-[10px]">Portal Operativo</h2>
                            <p className="text-[0.9rem] text-[#888888] mb-[25px]">Ver la infraestructura en funcionamiento.</p>
                            <a 
                                href={portalUrl} 
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-[10px] px-[30px] py-[15px] bg-[#D4A853] text-[#050505] font-semibold text-[0.85rem] uppercase tracking-[1px] transition-all duration-300 hover:bg-white hover:translate-x-[5px]"
                            >
                                Acceder al Portal <ArrowRightIcon className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* RIGHT ZONE: RESOURCES */}
                <div className="grid grid-rows-[auto_1fr_auto] gap-[30px] lg:gap-[40px] p-10 lg:p-[80px_60px] overflow-hidden">
                    
                    {/* DOCUMENTACIÓN */}
                    <div className="animate-[fadeInUp_0.6s_ease_backwards] [animation-delay:0.2s]">
                        <div className="text-[0.7rem] uppercase tracking-[3px] text-[#D4A853] mb-[20px] flex items-center gap-[15px] after:content-[''] after:flex-1 after:h-[1px] after:bg-gradient-to-r after:from-[#D4A853] after:to-transparent">
                            Documentación
                        </div>
                        <div className="flex flex-col gap-[20px]">
                            {config.documents.map((doc: any, i: number) => (
                                <div key={i} className="flex flex-col sm:flex-row items-center justify-between p-[25px_30px] bg-white/5 border border-white/5 transition-all duration-300 hover:bg-[#D4A853]/5 hover:border-[#D4A853]/30 hover:translate-x-[10px] gap-[20px] sm:gap-0 text-center sm:text-left">
                                    <div>
                                        <h3 className="text-[1.1rem] font-medium mb-[5px] flex items-center gap-2 justify-center sm:justify-start">
                                            <DocumentTextIcon className="w-5 h-5 text-[#D4A853]" />
                                            {doc.title || `Documento ${i+1}`}
                                        </h3>
                                        <p className="text-[0.8rem] text-[#888888]">{doc.desc || 'Documento oficial'}</p>
                                    </div>
                                    <a 
                                        href={doc.url} 
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-[20px] py-[10px] border border-[#444444] text-white text-[0.75rem] uppercase tracking-[1px] transition-all duration-300 hover:border-[#D4A853] hover:text-[#D4A853] whitespace-nowrap"
                                    >
                                        {doc.url.endsWith('.pdf') ? 'Descargar' : 'Ver Documento'}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COMUNIDAD */}
                    <div className="animate-[fadeInUp_0.6s_ease_backwards] [animation-delay:0.3s]">
                        <div className="text-[0.7rem] uppercase tracking-[3px] text-[#D4A853] mb-[20px] flex items-center gap-[15px] after:content-[''] after:flex-1 after:h-[1px] after:bg-gradient-to-r after:from-[#D4A853] after:to-transparent">
                            Comunidad
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px]">
                            {config.community.map((comm: any, i: number) => (
                                <div key={i} className="p-[30px] bg-white/5 border border-white/5 text-center transition-all duration-300 hover:border-[#D4A853] hover:bg-[#D4A853]/5">
                                    <div className="text-[2rem] mb-[15px] flex justify-center text-[#D4A853]">
                                        {comm.type === 'chat' ? <ChatBubbleOvalLeftEllipsisIcon className="w-8 h-8" /> : <MegaphoneIcon className="w-8 h-8" />}
                                    </div>
                                    <h3 className="text-[0.9rem] font-semibold mb-[10px]">{comm.label || `Link ${i+1}`}</h3>
                                    <a 
                                        href={comm.url} 
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block px-[20px] py-[10px] border border-[#D4A853] text-[#D4A853] text-[0.7rem] uppercase tracking-[1px] transition-all duration-300 hover:bg-[#D4A853] hover:text-[#050505]"
                                    >
                                        {comm.type === 'chat' ? 'Abrir' : 'Unirme'}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CONTACTO / CALENDARIO SOBERANO */}
                    {calendarConfig?.isActive && (
                        <div className="p-[30px] border border-[#D4A853]/20 bg-gradient-to-br from-[#D4A853]/5 to-transparent text-center animate-[fadeInUp_0.6s_ease_backwards] [animation-delay:0.4s]">
                            <div className="text-[0.8rem] uppercase tracking-[2px] text-[#888888] mb-[20px]">
                                Solicitar una conversación privada
                            </div>
                            <a 
                                href={calendarConfig.calendarUrl} 
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block px-[40px] py-[18px] bg-transparent border-2 border-[#D4A853] text-[#D4A853] font-semibold text-[0.85rem] uppercase tracking-[2px] transition-all duration-300 hover:bg-[#D4A853] hover:text-[#050505]"
                            >
                                Agendar Reunión
                            </a>
                        </div>
                    )}

                </div>
            </div>

            {/* FOOTER */}
            <div className="relative z-10 p-[30px] text-center border-t border-white/5 bg-[#050505]">
                <div className="text-[0.75rem] text-[#444444] uppercase tracking-[3px]">
                    {project.title} — Infraestructura para una nueva era de acceso
                </div>
            </div>

        </main>
    );
}

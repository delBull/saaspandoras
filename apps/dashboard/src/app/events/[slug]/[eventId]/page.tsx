import { db } from "@/db";
import { projectEvents, projects, eventRegistrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Playfair_Display, Inter } from "next/font/google";
import { EventRegistrationForm } from "./EventRegistrationForm";
import { CinematicIntro } from "./CinematicIntro";
import { Metadata } from "next";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["200", "300", "400", "600"] });

export async function generateMetadata({ params }: { params: Promise<{ slug: string, eventId: string }> }): Promise<Metadata> {
    const slug = (await params).slug;
    const [project] = await db.select({ title: projects.title }).from(projects).where(eq(projects.slug, slug));
    
    if (!project) return { title: 'Private Briefing' };
    
    return {
        title: `${project.title} — Private Briefing`,
        description: `Presentación privada sobre la infraestructura digital de ${project.title}.`
    };
}

export default async function EventLandingPage({ params }: { params: Promise<{ slug: string, eventId: string }> }) {
    const { slug, eventId: eventIdStr } = await params;
    
    const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
    if (!project) {
        notFound();
    }

    // Attempt to fetch event from DB. If not found or table doesn't exist, use fallback.
    let event = null;
    let registrationsCount = 0;
    try {
        const events = await db.select().from(projectEvents).where(
            and(
                eq(projectEvents.projectId, project.id),
                eq(projectEvents.id, Number(eventIdStr))
            )
        );
        if (events.length > 0) {
            event = events[0]!;
            const regs = await db.select().from(eventRegistrations).where(
                and(
                    eq(eventRegistrations.eventId, event.id),
                    eq(eventRegistrations.status, 'CONFIRMED')
                )
            );
            registrationsCount = regs.length;
        }
    } catch (e) {
        // Table probably doesn't exist yet, we use fallback data
    }

    // Default Fallback
    const eventData = event || {
        id: Number(eventIdStr),
        title: "Private Briefing",
        date: new Date("2026-06-13T17:00:00-06:00"),
        location: "626 Café · Bucerías, Nayarit",
        config: { maxCapacity: 20 }
    };

    const maxCapacity = (eventData.config as any)?.maxCapacity || 20;
    const availableSpots = Math.max(0, maxCapacity - registrationsCount);
    
    const formattedDate = new Intl.DateTimeFormat('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(eventData.date || new Date());
    
    const formattedTime = new Intl.DateTimeFormat('es-MX', {
        hour: 'numeric', minute: 'numeric', hour12: true
    }).format(eventData.date || new Date());

    return (
        <CinematicIntro eventId={eventData.id}>
        <main className={`min-h-screen w-full overflow-x-hidden bg-[#000000] text-white ${inter.className}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                
                {/* CONTENT COLUMN */}
                <div className="flex flex-col p-0">
                    
                    {/* HERO */}
                    <section className="min-h-screen flex flex-col justify-center items-center text-center p-[60px_20px] lg:p-[80px_60px] bg-[radial-gradient(circle_at_20%_30%,#1a1a1a_0%,#000000_100%)] border-b border-[#D4A853]/10">
                        {project.logoUrl && (
                            <img src={project.logoUrl} alt={project.title} className="max-w-[140px] mx-auto mb-[40px] block" />
                        )}
                        <h1 className={`text-[clamp(3rem,8vw,5rem)] font-bold tracking-tight leading-[0.9] mb-[30px] uppercase ${playfair.className}`}>
                            {project.title}
                        </h1>
                        <div className="text-[clamp(1.2rem,2vw,1.8rem)] font-light leading-[1.4] text-[#F5F5F5] max-w-[500px] mx-auto mb-[30px]">
                            <span className="block text-[#D4A853] font-semibold text-[1.2rem] uppercase tracking-[3px] mb-[10px]">
                                La próxima frontera
                            </span>
                            no es la información. <br/><strong>Es el acceso.</strong>
                        </div>
                        <p className="text-[#888888] font-light max-w-[450px] mx-auto mb-[40px]">
                            Presentación privada sobre cómo la infraestructura digital está redefiniendo quién puede participar temprano.
                        </p>
                        <a href="#reg-form" className="inline-block p-[20px_40px] bg-[#D4A853] text-[#050505] font-semibold text-[0.9rem] uppercase tracking-[2px] transition-all duration-300 hover:bg-white hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(212,168,83,0.3)]">
                            Solicitar Acceso
                        </a>

                        <div className="mt-[50px] p-[25px_40px] border border-[#D4A853]/30 text-center bg-[#D4A853]/5">
                            <div className="text-[0.7rem] uppercase tracking-[2px] text-[#D4A853] mb-[8px]">Asistencia Limitada</div>
                            <div className={`text-[3rem] font-bold text-[#D4A853] leading-none ${playfair.className}`}>{availableSpots}</div>
                            <div className="text-[0.8rem] text-[#888888] mt-[5px]">Lugares disponibles</div>
                        </div>
                    </section>

                    {/* DETAILS */}
                    <section className="min-h-screen flex flex-col justify-center p-[60px_20px] lg:p-[80px_60px] relative border-b border-[#D4A853]/10">
                        <div className="w-[60px] h-[2px] bg-[#D4A853] mb-[30px]" />
                        <h2 className={`text-[2rem] mb-[40px] ${playfair.className}`}>Private Briefing</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[40px] lg:mt-[40px] max-w-[400px] md:max-w-none mx-auto md:mx-0 text-left">
                            <div className="border-l border-[#D4A853] pl-[20px]">
                                <div className="text-[0.7rem] uppercase tracking-[2px] text-[#D4A853] mb-[8px]">Fecha</div>
                                <div className={`text-[1.4rem] capitalize ${playfair.className}`}>{formattedDate}</div>
                            </div>
                            <div className="border-l border-[#D4A853] pl-[20px]">
                                <div className="text-[0.7rem] uppercase tracking-[2px] text-[#D4A853] mb-[8px]">Horario</div>
                                <div className={`text-[1.4rem] ${playfair.className}`}>{formattedTime}</div>
                            </div>
                            <div className="border-l border-[#D4A853] pl-[20px]">
                                <div className="text-[0.7rem] uppercase tracking-[2px] text-[#D4A853] mb-[8px]">Ubicación</div>
                                <div className={`text-[1.4rem] ${playfair.className}`}>{eventData.location}</div>
                            </div>
                            <div className="border-l border-[#D4A853] pl-[20px]">
                                <div className="text-[0.7rem] uppercase tracking-[2px] text-[#D4A853] mb-[8px]">Dress Code</div>
                                <div className={`text-[1.4rem] ${playfair.className}`}>Smart Casual</div>
                            </div>
                        </div>
                    </section>

                    {/* STORY 1 */}
                    <section className="min-h-[50vh] flex flex-col justify-center p-[60px_20px] lg:p-[80px_60px] relative border-b border-[#D4A853]/10">
                        <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-light leading-[1.3] text-[#888888] max-w-[800px] text-center lg:text-left mx-auto lg:mx-0">
                            Durante décadas... <br/>
                            la <span className="text-white font-semibold">entrada temprana</span> estuvo reservada para unos cuantos. <br/><br/>
                            Instituciones. <br/>
                            Desarrolladores. <br/>
                            Capital privado. <br/><br/>
                            La mayoría simplemente llegaba después.
                        </div>
                    </section>

                    {/* STORY 2 */}
                    <section className="min-h-[30vh] flex flex-col justify-center p-[60px_20px] lg:p-[80px_60px] relative border-b border-[#D4A853]/10 bg-[#111111]">
                        <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-light leading-[1.3] text-[#888888] text-center mx-auto">
                            Hoy eso <span className="text-[#D4A853] font-semibold">comienza a cambiar.</span>
                        </div>
                    </section>

                    {/* WHY */}
                    <section className="min-h-screen flex flex-col justify-center p-[60px_20px] lg:p-[80px_60px] relative border-b border-[#D4A853]/10">
                        <h2 className={`text-[2.5rem] mb-[50px] text-center lg:text-left ${playfair.className}`}>¿Por qué ahora?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px] max-w-[400px] md:max-w-none mx-auto md:mx-0">
                            <div className="p-[30px] border border-white/5 bg-white/5 hover:border-[#D4A853] hover:bg-[#D4A853]/5 hover:-translate-y-2 transition-all duration-300">
                                <h3 className="text-[#D4A853] uppercase text-[0.8rem] tracking-[2px] mb-[15px]">Acceso</h3>
                                <p className="text-[1rem] text-[#F5F5F5] font-light leading-[1.6]">Las barreras tradicionales están evolucionando.</p>
                            </div>
                            <div className="p-[30px] border border-white/5 bg-white/5 hover:border-[#D4A853] hover:bg-[#D4A853]/5 hover:-translate-y-2 transition-all duration-300">
                                <h3 className="text-[#D4A853] uppercase text-[0.8rem] tracking-[2px] mb-[15px]">Infraestructura</h3>
                                <p className="text-[1rem] text-[#F5F5F5] font-light leading-[1.6]">La tecnología permite nuevas formas de participación.</p>
                            </div>
                            <div className="p-[30px] border border-white/5 bg-white/5 hover:border-[#D4A853] hover:bg-[#D4A853]/5 hover:-translate-y-2 transition-all duration-300">
                                <h3 className="text-[#D4A853] uppercase text-[0.8rem] tracking-[2px] mb-[15px]">Transparencia</h3>
                                <p className="text-[1rem] text-[#F5F5F5] font-light leading-[1.6]">Diseñado para ofrecer trazabilidad y visibilidad.</p>
                            </div>
                            <div className="p-[30px] border border-white/5 bg-white/5 hover:border-[#D4A853] hover:bg-[#D4A853]/5 hover:-translate-y-2 transition-all duration-300">
                                <h3 className="text-[#D4A853] uppercase text-[0.8rem] tracking-[2px] mb-[15px]">Experiencia</h3>
                                <p className="text-[1rem] text-[#F5F5F5] font-light leading-[1.6]">Una interfaz creada para simplificar lo complejo.</p>
                            </div>
                        </div>
                    </section>

                    {/* AGENDA */}
                    <section className="min-h-[70vh] flex flex-col justify-center p-[60px_20px] lg:p-[80px_60px] relative border-b border-[#D4A853]/10">
                        <div className="w-[60px] h-[2px] bg-[#D4A853] mb-[30px] mx-auto lg:mx-0" />
                        <h2 className={`text-[2rem] mb-[40px] text-center lg:text-left ${playfair.className}`}>La Agenda</h2>
                        
                        <div className="flex flex-col items-center lg:items-start max-w-[400px] lg:max-w-[600px] mx-auto lg:mx-0">
                            {[
                                "La tesis detrás del Protocolo",
                                "La infraestructura operativa",
                                "La experiencia digital",
                                "El modelo de acceso temprano",
                                "Sesión de Q&A"
                            ].map((item, i) => (
                                <div key={i} className="text-[1.1rem] lg:text-[1.5rem] mb-[20px] flex items-center gap-[20px] font-light transition-all duration-300 hover:text-[#D4A853] hover:pl-[20px] group cursor-default">
                                    <span className="text-[#D4A853] font-bold group-hover:scale-110">→</span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* EMOTIONAL QUOTE */}
                    <section id="reg-form" className="text-center p-[80px_40px] border-t border-b border-[#D4A853]/20">
                        <p className={`text-[1.3rem] lg:text-[1.8rem] italic text-[#F5F5F5] leading-[1.5] max-w-[700px] mx-auto mb-[30px] ${playfair.className}`}>
                            Algunas oportunidades se vuelven evidentes cuando todos las ven.
                            <br/><br/>
                            Otras requieren <span className="text-[#D4A853] not-italic font-semibold">llegar antes</span>.
                            <br/><br/>
                            {project.title} fue diseñado para quienes entienden la diferencia.
                        </p>
                    </section>

                    <section className="p-[60px] text-center text-[0.7rem] text-[#666666] uppercase tracking-[1px] lg:hidden">
                        Presentación privada. <br/>
                        Cupo limitado. <br/>
                        Sujeto a confirmación.
                    </section>
                </div>

                {/* RIGHT COLUMN - FORM FIXED ON DESKTOP */}
                <div className="relative lg:fixed lg:right-0 lg:top-0 w-full lg:w-[50vw] h-auto lg:h-screen bg-[#000000] flex justify-center items-center p-[60px_20px] lg:p-[60px] lg:border-l border-[#D4A853]/20 z-10">
                    <div className="w-full max-w-[480px] bg-[#111111] p-[40px_25px] lg:p-[50px] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                        <EventRegistrationForm 
                            eventId={eventData.id} 
                            projectId={project.id}
                            eventDate={formattedDate}
                            eventLocation={eventData.location || "Evento Presencial"} 
                        />

                        <div className="mt-[40px] text-center text-[0.7rem] text-[#666666] uppercase tracking-[1px]">
                            {project.title} © 2026 | Private Access
                        </div>
                    </div>
                </div>

            </div>
        </main>
        </CinematicIntro>
    );
}

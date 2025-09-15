import Image from "next/image";
import { notFound } from "next/navigation";
import { MetricCard } from "~/components/projects/MetricCard";
import { BanknotesIcon, ChartPieIcon, SparklesIcon, GlobeAltIcon, LinkIcon } from "@heroicons/react/24/outline";
import { Button } from "@saasfly/ui/button";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { projects } from "~/db/schema";

// Hacemos que esta página sea un Server Component para fetching de datos
async function getProjectData(slug: string) {
    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, slug),
    });
    return project;
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
    const project = await getProjectData(params.slug);

    if (!project) {
        notFound();
    }

    // Convertimos los valores de la DB (string) a números para los cálculos
    const raisedAmount = Number(project.raisedAmount ?? 0);
    const targetAmount = Number(project.targetAmount ?? 1); // Evitar división por cero
    const returnsPaid = Number(project.returnsPaid ?? 0);
    const socials = project.socials as { twitter?: string, email?: string };

    const raisedPercentage = (raisedAmount / targetAmount) * 100;

    return (
        <div className="max-w-4xl mx-auto py-8 md:py-12">
            {/* --- Header --- */}
            <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-[-4rem] md:mb-[-5rem]">
                <Image
                    src={project.imageUrl ?? "/images/sem.jpeg"} // Imagen por defecto
                    alt={project.title}
                    fill
                    className="object-cover object-center opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
            </div>

            <div className="relative px-4 md:px-8">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-gray-800 bg-zinc-900 overflow-hidden shrink-0">
                         <Image
                            src={project.imageUrl ?? "/images/sem.jpeg"}
                            alt={`${project.title} logo`}
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <div>
                        <p className="text-sm font-mono text-lime-400">{project.category ?? "Sin Categoría"}</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">{project.title}</h1>
                    </div>
                </div>
            </div>

            {/* --- Contenido Principal --- */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-8">
                {/* Columna Izquierda (Info) */}
                <div className="lg:col-span-2 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                    <h2 className="text-lg font-bold text-white mb-4">Sobre el Proyecto</h2>
                    <p className="text-gray-300 leading-relaxed">{project.description}</p>
                    
                    <div className="mt-6 flex items-center gap-4">
                        {project.website && (
                            <a href={project.website} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                                    <GlobeAltIcon className="w-4 h-4 mr-2" /> Sitio Web
                                </Button>
                            </a>
                        )}
                         {socials?.twitter && (
                            <a href={socials.twitter} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800"> <LinkIcon className="w-4 h-4 mr-2" /> Redes Sociales </Button>
                            </a>
                         )}
                    </div>
                </div>

                {/* Columna Derecha (Métricas) */}
                <div className="space-y-4">
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h3 className="text-base font-bold text-white mb-3">Progreso de Financiación</h3>
                        <div className="w-full bg-zinc-800 rounded-full h-2.5">
                            <div className="bg-lime-500 h-2.5 rounded-full" style={{ width: `${raisedPercentage}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs font-mono">
                            <span className="text-lime-400">${raisedAmount.toLocaleString()}</span>
                            <span className="text-gray-400">${targetAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <MetricCard label="Tipo de Tokenización" value={project.tokenizationType ?? 'N/A'} icon={<ChartPieIcon className="w-5 h-5 text-gray-400"/>} />
                    <MetricCard label="APY Estimado" value={project.apy ?? 'N/A'} icon={<SparklesIcon className="w-5 h-5 text-yellow-400"/>} />
                    <MetricCard label="Retornos Pagados" value={`$${returnsPaid.toLocaleString()}`} icon={<BanknotesIcon className="w-5 h-5 text-green-400"/>} />
                </div>
            </div>
        </div>
    );
}
import Image from "next/image";
import { notFound } from "next/navigation";
import { MetricCard } from "~/components/projects/MetricCard";
import {
  BanknotesIcon,
  ChartPieIcon,
  SparklesIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@saasfly/ui/button";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { projects } from "~/db/schema";

// --- Fetch de datos ---
async function getProjectData(slug: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });
  return project;
}

// Helper para parsear JSON de forma segura
function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return defaultValue;
  }
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const project = await getProjectData(slug);

  if (!project) {
    notFound();
  }

  // --- Conversión de datos segura ---
  const raisedAmount = Number(project.raisedAmount ?? 0);
  const targetAmount = Number(project.targetAmount ?? 1);
  const returnsPaid = Number(project.returnsPaid ?? 0);

  const teamMembers: { name: string; position: string; linkedin?: string }[] = safeJsonParse(project.teamMembers as string | null, []);
  const advisors: { name: string; profile: string; linkedin?: string }[] = safeJsonParse(project.advisors as string | null, []);
  const tokenDistribution: Record<string, number> = safeJsonParse(project.tokenDistribution as string | null, {});
  
  // El campo 'socials' no existe en el schema, se construye a partir de otros campos
  const socials = {
    twitter: project.twitterUrl,
    email: project.applicantEmail,
  };

  const allSocials = {
    website: project.website,
    twitter: project.twitterUrl || socials.twitter,
    discord: project.discordUrl,
    telegram: project.telegramUrl,
    linkedin: project.linkedinUrl,
  };

  const raisedPercentage = (raisedAmount / targetAmount) * 100;

    return (
        <div className="max-w-4xl mx-auto py-8 md:py-12">
            {/* --- Header --- */}
            <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-[-4rem] md:mb-[-5rem]">
                <Image
                    src={project.coverPhotoUrl || project.imageUrl || "/images/sem.jpeg"}
                    alt={project.title as string}
                    fill
                    className="object-cover object-center opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
            </div>

            <div className="relative px-4 md:px-8">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-gray-800 bg-zinc-900 overflow-hidden shrink-0">
                         <Image
                            src={project.logoUrl || project.imageUrl || "/images/sem.jpeg"}
                            alt={`${project.title as string} logo`}
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <div>
                        <p className="text-sm font-mono text-lime-400">{project.businessCategory ?? "Sin Categoría"}</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">{project.title as string}</h1>
                        {project.tagline && (
                            <p className="text-lime-400 italic mt-2 text-sm">"{project.tagline as string}"</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Contenido Principal --- */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-8">
                {/* Columna Izquierda (Info) */}
                <div className="lg:col-span-2 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                    <h2 className="text-lg font-bold text-white mb-4">Sobre el Proyecto</h2>
                    <p className="text-gray-300 leading-relaxed">{project.description as string}</p>
                    
                    {/* Video Pitch */}
                    {project.videoPitch && (
                      <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                          <SparklesIcon className="w-4 h-4" /> Video Pitch
                        </h3>
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <iframe
                            src={project.videoPitch.replace("watch?v=", "embed/")}
                            title={`${project.title} Video Pitch`}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Enlaces Sociales Expandidos */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {allSocials.website && (
                        <a href={allSocials.website} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center gap-2">
                          <GlobeAltIcon className="w-4 h-4 text-lime-400" /> Sitio Web
                        </a>
                      )}
                      {allSocials.twitter && (
                        <a href={allSocials.twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center gap-2">
                          <ChatBubbleLeftIcon className="w-4 h-4 text-blue-400" /> Twitter
                        </a>
                      )}
                      {allSocials.discord && (
                        <a href={allSocials.discord} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center gap-2">
                          <ChatBubbleLeftIcon className="w-4 h-4 text-indigo-400" /> Discord
                        </a>
                      )}
                      {allSocials.telegram && (
                        <a href={allSocials.telegram} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center gap-2">
                          <ChatBubbleLeftIcon className="w-4 h-4 text-blue-500" /> Telegram
                        </a>
                      )}
                      {allSocials.linkedin && (
                        <a href={allSocials.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center gap-2">
                          <UsersIcon className="w-4 h-4 text-blue-600" /> LinkedIn
                        </a>
                      )}
                    </div>
                </div>

                {/* Sección Equipo */}
                {(teamMembers.length > 0 || advisors.length > 0) && (
                  <div className="lg:col-span-3 mt-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <UsersIcon className="w-5 h-5" /> Equipo y Asesores
                    </h2>
                    <div className="space-y-6">
                      {teamMembers && teamMembers.length > 0 && (
                        <>
                          <h3 className="text-md font-semibold text-lime-400 mb-4">Equipo</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teamMembers.map((member: any, index: number) => (
                              <div key={index} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-lime-500 to-emerald-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">{member.name?.charAt(0)}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white text-sm">{member.name}</h4>
                                    <p className="text-gray-400 text-xs">{member.position}</p>
                                    {member.linkedin && (
                                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-lime-400 text-xs hover:underline mt-1 inline-block">
                                        LinkedIn →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {advisors && advisors.length > 0 && (
                        <>
                          <h3 className="text-md font-semibold text-emerald-400 mb-4 mt-6">Asesores</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {advisors.map((advisor: any, index: number) => (
                              <div key={index} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">{advisor.name?.charAt(0)}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white text-sm">{advisor.name}</h4>
                                    <p className="text-gray-400 text-xs">{advisor.profile || 'Asesor'}</p>
                                    {advisor.linkedin && (
                                      <a href={advisor.linkedin} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-xs hover:underline mt-1 inline-block">
                                        LinkedIn →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Sección Tokenomics */}
                {project.totalTokens && project.tokensOffered && (
                  <div className="lg:col-span-3 mt-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <ChartPieIcon className="w-5 h-5" /> Tokenomics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <MetricCard
                        label="Supply Total"
                        value={project.totalTokens.toLocaleString()}
                        icon={<ChartPieIcon className="w-5 h-5 text-purple-400"/>}
                      />
                      <MetricCard
                        label="Tokens Ofrecidos"
                        value={project.tokensOffered.toLocaleString()}
                        icon={<SparklesIcon className="w-5 h-5 text-pink-400"/>}
                      />
                      {project.tokenPriceUsd && (
                        <MetricCard
                          label="Precio por Token"
                          value={`$${Number(project.tokenPriceUsd).toFixed(6)}`}
                          icon={<CurrencyDollarIcon className="w-5 h-5 text-green-400"/>}
                        />
                      )}
                      <div className="lg:col-span-3 md:col-span-2">
                        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                          <h3 className="text-base font-bold text-white mb-3">Distribución de Tokens</h3>
                          <div className="space-y-2">
                            {Object.entries(tokenDistribution).map(([key, value]: [string, any]) => (
                              value && key !== 'total' && (
                                <div key={key} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-300 capitalize">{key.replace('_', ' ')}</span>
                                  <span className="text-lime-400 font-mono">{typeof value === 'number' ? `${value}%` : value}</span>
                                </div>
                              )
                            ))}
                          </div>
                          {project.fundUsage && (
                            <div className="mt-4 pt-4 border-t border-zinc-700">
                              <p className="text-xs text-gray-400">Destino de fondos: {project.fundUsage}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sección Seguridad */}
                {(project.isMintable !== undefined || project.contractAddress) && (
                  <div className="lg:col-span-3 mt-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5" /> Seguridad y Transparencia
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <MetricCard
                        label="Mintable"
                        value={project.isMintable ? 'Sí' : 'No'}
                        icon={<SparklesIcon className="w-5 h-5 text-yellow-400"/>}
                      />
                      <MetricCard
                        label="Mutable Info"
                        value={project.isMutable ? 'Sí' : 'No'}
                        icon={<DocumentTextIcon className="w-5 h-5 text-orange-400"/>}
                      />
                      {project.updateAuthorityAddress && (
                        <MetricCard
                          label="Update Authority"
                          value={`${project.updateAuthorityAddress.slice(0,6)}...${project.updateAuthorityAddress.slice(-4)}`}
                          icon={<ShieldCheckIcon className="w-5 h-5 text-blue-400"/>}
                        />
                      )}
                      {project.contractAddress && (
                        <div className="md:col-span-2">
                          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-white">Contrato</span>
                              <ShieldCheckIcon className="w-4 h-4 text-green-400" />
                            </div>
                            <code className="text-xs font-mono text-gray-300 break-all">
                              {project.contractAddress}
                            </code>
                          </div>
                        </div>
                      )}
                      {project.treasuryAddress && (
                        <div className="md:col-span-2">
                          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-white">Tesorería</span>
                              <CurrencyDollarIcon className="w-4 h-4 text-emerald-400" />
                            </div>
                            <code className="text-xs font-mono text-gray-300 break-all">
                              {project.treasuryAddress}
                            </code>
                          </div>
                        </div>
                      )}
                      {project.whitepaperUrl && (
                        <a href={project.whitepaperUrl} target="_blank" rel="noopener noreferrer" className="md:col-span-2 lg:col-span-1 p-4 bg-gradient-to-r from-lime-500/10 to-emerald-500/10 rounded-xl border border-lime-500/30 hover:border-lime-400 transition-colors">
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4 text-lime-400" />
                            <span className="font-semibold text-white">Whitepaper</span>
                            <ArrowRightIcon className="w-4 h-4 text-lime-400 ml-auto" />
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                )}

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

                    <MetricCard label="Tipo de Token" value={project.tokenType ? project.tokenType.toUpperCase() : 'N/A'} icon={<ChartPieIcon className="w-5 h-5 text-gray-400"/>} />
                    <MetricCard label="APY Estimado" value={project.estimatedApy ?? 'N/A'} icon={<SparklesIcon className="w-5 h-5 text-yellow-400"/>} />
                    <MetricCard label="Retornos Pagados" value={`$${returnsPaid.toLocaleString()}`} icon={<BanknotesIcon className="w-5 h-5 text-green-400"/>} />
                    {project.totalValuationUsd && (
                        <MetricCard label="Valuación Total" value={`$${Number(project.totalValuationUsd).toLocaleString()}`} icon={<CurrencyDollarIcon className="w-5 h-5 text-blue-400"/>} />
                    )}
                </div>
            </div>

            {/* CTAs Finales */}
            <div className="mt-12 px-4 md:px-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-black font-bold px-8">
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                Invertir Ahora
              </Button>
              <Button variant="outline" size="lg" className="border-lime-500 text-lime-400 hover:bg-lime-500/10 px-8">
                <EnvelopeIcon className="w-5 h-5 mr-2" />
                Contactar Equipo
              </Button>
            </div>
        </div>
    );
}
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

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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
    twitter: project.twitterUrl ?? socials.twitter,
    discord: project.discordUrl,
    telegram: project.telegramUrl,
    linkedin: project.linkedinUrl,
  };

  const raisedPercentage = (raisedAmount / targetAmount) * 100;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
            {/* --- Header Elegante --- */}
            <div className="relative w-full h-56 md:h-72 lg:h-80 xl:h-96 rounded-2xl lg:rounded-3xl overflow-hidden mb-[-3rem] md:mb-[-4rem] lg:mb-[-5rem] xl:mb-[-6rem]">
                <Image
                    src={project.coverPhotoUrl ?? project.imageUrl ?? "/images/sem.jpeg"}
                    alt={project.title}
                    fill
                    className="object-cover object-center opacity-35 lg:opacity-45"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

                {/* Overlay con gradiente más sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-zinc-900/30" />
            </div>

            <div className="relative">
                <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8 max-w-6xl mx-auto">
                    <div className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 xl:w-44 xl:h-44 rounded-2xl border-4 border-zinc-700 bg-zinc-900 overflow-hidden shrink-0 mx-auto lg:mx-0 shadow-2xl">
                         <Image
                            src={project.logoUrl ?? project.imageUrl ?? "/images/sem.jpeg"}
                            alt={`${project.title} logo`}
                            width={176}
                            height={176}
                            className="object-cover w-full h-full"
                            priority
                        />
                    </div>
                    <div className="flex-1 text-center lg:text-left">
                        <p className="text-sm lg:text-base font-mono text-lime-400 font-medium">{project.businessCategory ?? "Sin Categoría"}</p>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mt-2 lg:mt-3 leading-tight">
                            {project.title}
                        </h1>
                        {project.tagline && (
                            <p className="text-lime-400 italic mt-3 lg:mt-4 text-base lg:text-lg xl:text-xl max-w-3xl">
                                &quot;{project.tagline}&quot;
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Contenido Principal Mejorado --- */}
            <div className="mt-16 lg:mt-20 max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
                {/* Columna Izquierda - Info Principal */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Descripción Principal */}
                    <div className="bg-zinc-900/30 lg:bg-zinc-900/50 backdrop-blur-sm p-6 lg:p-8 rounded-2xl border border-zinc-800/50">
                        <h2 className="text-xl lg:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <SparklesIcon className="w-6 h-6 text-lime-400" />
                            Sobre el Proyecto
                        </h2>
                        <p className="text-gray-300 leading-relaxed text-base lg:text-lg max-w-none">
                            {project.description}
                        </p>
                    </div>

                    {/* Video Pitch mejorado */}
                    {project.videoPitch && (
                        <div className="bg-zinc-900/30 lg:bg-zinc-900/50 backdrop-blur-sm p-6 lg:p-8 rounded-2xl border border-zinc-800/50">
                            <h3 className="text-lg lg:text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-lime-400" /> Video Pitch
                            </h3>
                            <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                                <iframe
                                    src={project.videoPitch.replace("watch?v=", "embed/")}
                                    title={`${project.title} Video Pitch`}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    {/* Enlaces Sociales Mejorados */}
                    <div className="bg-zinc-900/30 lg:bg-zinc-900/50 backdrop-blur-sm p-6 lg:p-8 rounded-2xl border border-zinc-800/50">
                        <h3 className="text-lg lg:text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <GlobeAltIcon className="w-5 h-5 text-lime-400" /> Comunidades y Enlaces
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
                            {allSocials.website && (
                                <a href={allSocials.website} target="_blank" rel="noopener noreferrer"
                                   className="p-4 bg-gradient-to-r from-lime-500/10 to-lime-500/5 rounded-xl border border-lime-500/20 hover:border-lime-400 hover:bg-lime-500/15 transition-all duration-300 group">
                                    <div className="flex items-center gap-3">
                                        <GlobeAltIcon className="w-6 h-6 text-lime-400 group-hover:text-lime-300 transition-colors" />
                                        <span className="font-medium text-white group-hover:text-lime-100">Sitio Web</span>
                                        <ArrowRightIcon className="w-4 h-4 text-lime-400 group-hover:text-lime-300 ml-auto transition-colors" />
                                    </div>
                                </a>
                            )}
                            {allSocials.twitter && (
                                <a href={allSocials.twitter} target="_blank" rel="noopener noreferrer"
                                   className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 hover:border-blue-400 hover:bg-blue-500/15 transition-all duration-300 group">
                                    <div className="flex items-center gap-3">
                                        <ChatBubbleLeftIcon className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                        <span className="font-medium text-white group-hover:text-blue-100">Twitter</span>
                                        <ArrowRightIcon className="w-4 h-4 text-blue-400 group-hover:text-blue-300 ml-auto transition-colors" />
                                    </div>
                                </a>
                            )}
                            {allSocials.discord && (
                                <a href={allSocials.discord} target="_blank" rel="noopener noreferrer"
                                   className="p-4 bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 rounded-xl border border-indigo-500/20 hover:border-indigo-400 hover:bg-indigo-500/15 transition-all duration-300 group">
                                    <div className="flex items-center gap-3">
                                        <ChatBubbleLeftIcon className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                                        <span className="font-medium text-white group-hover:text-indigo-100">Discord</span>
                                        <ArrowRightIcon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 ml-auto transition-colors" />
                                    </div>
                                </a>
                            )}
                            {allSocials.telegram && (
                                <a href={allSocials.telegram} target="_blank" rel="noopener noreferrer"
                                   className="p-4 bg-gradient-to-r from-blue-600/10 to-blue-600/5 rounded-xl border border-blue-600/20 hover:border-blue-500 hover:bg-blue-600/15 transition-all duration-300 group">
                                    <div className="flex items-center gap-3">
                                        <ChatBubbleLeftIcon className="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" />
                                        <span className="font-medium text-white group-hover:text-blue-200">Telegram</span>
                                        <ArrowRightIcon className="w-4 h-4 text-blue-500 group-hover:text-blue-400 ml-auto transition-colors" />
                                    </div>
                                </a>
                            )}
                            {allSocials.linkedin && (
                                <a href={allSocials.linkedin} target="_blank" rel="noopener noreferrer"
                                   className="p-4 bg-gradient-to-r from-blue-700/10 to-blue-700/5 rounded-xl border border-blue-700/20 hover:border-blue-600 hover:bg-blue-700/15 transition-all duration-300 group">
                                    <div className="flex items-center gap-3">
                                        <UsersIcon className="w-6 h-6 text-blue-600 group-hover:text-blue-500 transition-colors" />
                                        <span className="font-medium text-white group-hover:text-blue-200">LinkedIn</span>
                                        <ArrowRightIcon className="w-4 h-4 text-blue-600 group-hover:text-blue-500 ml-auto transition-colors" />
                                    </div>
                                </a>
                            )}
                        </div>
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
                            {teamMembers.map((member, index: number) => (
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
                            {advisors.map((advisor, index: number) => (
                              <div key={index} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">{advisor.name?.charAt(0)}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white text-sm">{advisor.name}</h4>
                                    <p className="text-gray-400 text-xs">{advisor.profile ?? 'Asesor'}</p>
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
                            {Object.entries(tokenDistribution).map(([key, value]) => (
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

                {/* Columna Derecha (Métricas Mejoradas) */}
                <div className="xl:col-span-1">
                    {/* Progreso de Financiación */}
                    <div className="bg-zinc-900/30 lg:bg-zinc-900/50 backdrop-blur-sm p-6 lg:p-8 rounded-2xl border border-zinc-800/50 mb-6">
                        <h3 className="text-lg lg:text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <CurrencyDollarIcon className="w-6 h-6 text-lime-400" />
                            Financiación
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center text-sm text-gray-300 mb-2">
                                    <span>Progreso</span>
                                    <span className="text-lime-400 font-semibold">{raisedPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-zinc-800/50 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-lime-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${Math.min(raisedPercentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Recaudado</span>
                                    <span className="text-lime-400 font-mono font-semibold">${raisedAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Meta</span>
                                    <span className="text-white font-mono font-semibold">${targetAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Métricas Clave */}
                    <div className="space-y-4">
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-500/20 rounded-lg">
                                    <ChartPieIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Tipo de Token</p>
                                    <p className="text-sm font-semibold text-white">{project.tokenType ? project.tokenType.toUpperCase() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <SparklesIcon className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">APY Estimado</p>
                                    <p className="text-sm font-semibold text-white">{project.estimatedApy ?? 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <BanknotesIcon className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Retornos Pagados</p>
                                    <p className="text-sm font-semibold text-white">${returnsPaid.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {project.totalValuationUsd && (
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <CurrencyDollarIcon className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Valuación Total</p>
                                        <p className="text-sm font-semibold text-white">${Number(project.totalValuationUsd).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CTAs Finales Mejorados */}
            <div className="mt-20 lg:mt-24 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                        ¿Listo para invertir?
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Únete a la revolución financiera de {project.title} y sé parte de los primeros inversores en formar el futuro.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-stretch lg:items-center">
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-black font-bold px-8 lg:px-12 py-4 text-lg shadow-2xl hover:shadow-lime-500/25 transform hover:scale-105 transition-all duration-300"
                    >
                        <CurrencyDollarIcon className="w-6 h-6 mr-3" />
                        Invertir Ahora
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="border-2 border-lime-500 text-lime-400 hover:bg-lime-500 hover:text-black px-8 lg:px-12 py-4 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-lime-500/25 transform hover:scale-105"
                    >
                        <EnvelopeIcon className="w-6 h-6 mr-3" />
                        Contactar Equipo
                    </Button>
                </div>

                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>🔒 Tu inversión está segura · ⚡ Transacciones rápidas · 📊 Reportes transparentes</p>
                </div>
            </div>
        </div>
    );
}

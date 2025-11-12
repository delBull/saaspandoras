'use client';

import { ChatBubbleLeftIcon, UserGroupIcon, QuestionMarkCircleIcon, BellIcon } from '@heroicons/react/24/outline';
import { Globe, FileText, ExternalLink } from 'lucide-react';

// Interfaz actualizada con las nuevas claves optimizadas
interface ProjectData {
  id: number | string;
  title: string;
  slug: string;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  tagline?: string | null;
  description: string;
  business_category?: string | null;
  video_pitch?: string | null;
  website?: string | null;
  whitepaper_url?: string | null;
  twitter_url?: string | null;
  discord_url?: string | null;
  telegram_url?: string | null;
  linkedin_url?: string | null;

  // Nuevas claves optimizadas
  protoclMecanism?: string | null;
  artefactUtility?: string | null;
  worktoearnMecanism?: string | null;
  integrationPlan?: boolean | null;

  target_amount?: string | number | null;
  token_type?: string | null;
  total_tokens?: string | number | null;
  tokens_offered?: string | number | null;
  token_price_usd?: string | number | null;

  recurringRewards?: string | null;

  applicant_name?: string | null;
  applicant_position?: string | null;
  applicant_email?: string | null;
  applicant_phone?: string | null;
  applicant_wallet_address?: string | null;

  legal_status?: string | null;
  monetizationModel?: string | null;
  adquireStrategy?: string | null;
  mitigationPlan?: string | null;

  contract_address?: string | null;
  image_url?: string | null;
  socials?: string | null;
  raised_amount?: string | number | null;
  returns_paid?: string | number | null;
  status: string;
  featured?: boolean | null;
  featured_button_text?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

interface ProjectContentProps {
  activeTab: string;
  project?: ProjectData;
}

export function ProjectContent({ activeTab, project }: ProjectContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'campaign':
        return (
          <div className="space-y-8">
            {/* Project Story Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Acerca de esta creación</h2>
              {project?.description ? (
                <p className="text-gray-300 leading-relaxed text-lg mb-6">
                  {project.description}
                </p>
              ) : (
                <div className="bg-zinc-800/50 rounded-lg p-6 mb-6 border border-zinc-700">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">Descripción No Disponible</h3>
                    <p className="text-zinc-400 text-sm">
                      La descripción detallada de esta creación aún no ha sido proporcionada por el creador.
                      Esta información aparecerá aquí cuando esté disponible.
                    </p>
                  </div>
                </div>
              )}

              {/* Protocol Mechanism - Nueva información */}
              {project?.protoclMecanism && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-400" />
                    Mecánica del Protocolo
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {project.protoclMecanism}
                  </p>
                </div>
              )}

              {/* Artefact Utility - Nueva información */}
              {project?.artefactUtility && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    Utilidad a Largo Plazo de los Artefactos
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {project.artefactUtility}
                  </p>
                </div>
              )}

              {/* Work-to-Earn Mechanism - Nueva información */}
              {project?.worktoearnMecanism && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-orange-400" />
                    Sistema Work-to-Earn
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {project.worktoearnMecanism}
                  </p>
                </div>
              )}

              {/* Integration Plan - Nueva información */}
              {project?.integrationPlan && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-pink-400" />
                    Plan de Integraciones
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm font-medium">Planea integraciones con otras plataformas</span>
                  </div>
                </div>
              )}

              {/* Monetization Model - Nueva información */}
              {project?.monetizationModel && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-yellow-400" />
                    Modelo de Monetización
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {project.monetizationModel}
                  </p>
                </div>
              )}

              {/* Acquisition Strategy - Nueva información */}
              {project?.adquireStrategy && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    Estrategia de Adquisición Inicial
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {project.adquireStrategy}
                  </p>
                </div>
              )}

              {/* Mitigation Plan - Nueva información */}
              {project?.mitigationPlan && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-red-400" />
                    Plan de Mitigación de Riesgos
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {project.mitigationPlan}
                  </p>
                </div>
              )}

              {/* Social Links & Resources - Moved here immediately after About */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-lime-400" />
                  Comunidades y Recursos del Proyecto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project?.website && (
                    <a href={project.website} target="_blank" rel="noopener noreferrer"
                       className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-lime-400 hover:bg-zinc-700 transition-all duration-300 group flex items-center gap-3">
                      <Globe className="w-4 h-4 text-lime-400" />
                      <span className="text-white text-sm">Sitio Web</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-lime-400" />
                    </a>
                  )}
                  {project?.whitepaper_url && (
                    <a href={project.whitepaper_url} target="_blank" rel="noopener noreferrer"
                       className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-blue-400 hover:bg-zinc-700 transition-all duration-300 group flex items-center gap-3">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm">Whitepaper</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-blue-400" />
                    </a>
                  )}
                  {project?.twitter_url && (
                    <a href={project.twitter_url} target="_blank" rel="noopener noreferrer"
                       className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-blue-400 hover:bg-zinc-700 transition-all duration-300 group flex items-center gap-3">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm">Twitter</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-blue-400" />
                    </a>
                  )}
                  {project?.discord_url && (
                    <a href={project.discord_url} target="_blank" rel="noopener noreferrer"
                       className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-indigo-400 hover:bg-zinc-700 transition-all duration-300 group flex items-center gap-3">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span className="text-white text-sm">Discord</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-indigo-400" />
                    </a>
                  )}
                  {(!project?.website && !project?.whitepaper_url && !project?.twitter_url && !project?.discord_url) && (
                    <div className="col-span-full">
                      <div className="text-center py-4">
                        <Globe className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                        <p className="text-zinc-400 text-sm">
                          Los enlaces y recursos del proyecto estarán disponibles próximamente.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Learn More Section */}
              <div className="bg-zinc-900 rounded-xl p-8 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Aprende sobre responsabilidad en Pandoras</h3>
                <p className="text-gray-300 mb-4">
                    ¿Preguntas sobre esta creación? <a href="#faq" className="text-lime-400 hover:underline">Revisa las preguntas frecuentes</a>
                </p>
              </div>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Preguntas Frecuentes</h2>

            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-lime-400" />
                  ¿Cómo funciona el sistema de utilidad en esta creación?
                </h3>
                <p className="text-gray-300">
                  Esta creación utiliza tokens de utilidad que otorgan acceso a beneficios específicos como membresías,
                  descuentos, contenido exclusivo o participación en decisiones comunitarias. Los tokens no representan
                  propiedad financiera sino derechos de uso dentro del ecosistema.
                </p>
              </div>

              <div className="bg-zinc-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-lime-400" />
                  ¿Qué beneficios obtengo al participar?
                </h3>
                <p className="text-gray-300">
                  Dependiendo de la creación específica, puedes obtener acceso prioritario a productos/servicios,
                  participación en gobernanza comunitaria, recompensas por lealtad, o beneficios exclusivos
                  que solo los miembros pueden disfrutar.
                </p>
              </div>

              <div className="bg-zinc-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-lime-400" />
                  ¿Los tokens tienen algún valor especulativo?
                </h3>
                <p className="text-gray-300">
                  No, estos son tokens de utilidad pura diseñados exclusivamente para acceso y participación.
                  No representan inversiones financieras ni promesas de ganancias económicas.
                  Su valor radica en los beneficios que proporcionan dentro del ecosistema.
                </p>
              </div>

              <div className="bg-zinc-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-lime-400" />
                  ¿Cómo se distribuyen los tokens?
                </h3>
                <p className="text-gray-300">
                  La distribución es justa y transparente. Una porción va al equipo creador, otra a la comunidad inicial,
                  y el resto se distribuye a través de mecanismos de participación como airdrops por engagement,
                  recompensas por contribuciones, o ventas comunitarias.
                </p>
              </div>

              <div className="bg-zinc-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-lime-400" />
                  ¿Qué pasa si la creación no cumple sus objetivos?
                </h3>
                <p className="text-gray-300">
                  Los tokens de utilidad mantienen su valor dentro del ecosistema creado. Si una iniciativa específica
                  no prospera, los participantes pueden usar sus tokens en otras protocolos compatibles dentro
                  del ecosistema Pandoras, manteniendo así su valor de participación.
                </p>
              </div>
            </div>
          </div>
        );

      case 'updates':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Actualizaciones del Proyecto</h2>

            {project?.updated_at ? (
              <div className="space-y-4">
                <div className="bg-zinc-900 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <BellIcon className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Proyecto Actualizado</h3>
                      <p className="text-gray-300 mb-2">
                        Esta creación ha sido actualizada recientemente. Los cambios pueden incluir
                        nuevas funcionalidades, mejoras en la documentación, o actualizaciones en los términos de participación.
                      </p>
                      <span className="text-sm text-gray-400">
                        Última actualización: {new Date(project.updated_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <BellIcon className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Creación Publicada</h3>
                      <p className="text-gray-300 mb-2">
                        Esta creación fue publicada inicialmente y está disponible para participación comunitaria.
                        Todas las actualizaciones futuras serán registradas aquí automáticamente.
                      </p>
                      <span className="text-sm text-gray-400">
                        Fecha de creación: {new Date(project.created_at ?? Date.now()).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-800/50 rounded-lg p-8 border border-zinc-700">
                <div className="text-center">
                  <BellIcon className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Sin Actualizaciones Recientes</h3>
                  <p className="text-zinc-400 text-sm">
                    Las actualizaciones del proyecto aparecerán aquí cuando se realicen cambios
                    en la configuración, términos o funcionalidades de esta creación.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'comments':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Comentarios y Discusión</h2>

            <div className="bg-zinc-800/50 rounded-lg p-8 border border-zinc-700">
              <div className="text-center">
                <ChatBubbleLeftIcon className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Próximamente Disponible</h3>
                <p className="text-zinc-400 text-sm">
                  La sección de comentarios y discusión estará disponible próximamente.
                  Podrás interactuar con otros participantes, compartir opiniones y
                  contribuir al desarrollo de esta creación.
                </p>
              </div>
            </div>
          </div>
        );

      case 'community':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Comunidad</h2>

            <div className="bg-zinc-800/50 rounded-lg p-8 border border-zinc-700">
              <div className="text-center">
                <UserGroupIcon className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Próximamente Disponible</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  La sección de comunidad estará disponible próximamente con estadísticas,
                  actividad reciente y guías comunitarias.
                </p>
                {/* Dummy data para referencia futura */}
                <div className="text-xs text-zinc-500 mt-4 p-4 bg-zinc-900/50 rounded border">
                  <p className="mb-2"><strong>Dummy Data (para desarrollo futuro):</strong></p>
                  <p>• Total Members: 2,847</p>
                  <p>• Active This Week: 1,203</p>
                  <p>• Discussions: 156</p>
                  <p>• +12 new members joined</p>
                  <p>• +8 discussions started</p>
                  <p>• +45 comments posted</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Content for {activeTab} will be available soon.</p>
          </div>
        );
    }
  };

  return renderContent();
}

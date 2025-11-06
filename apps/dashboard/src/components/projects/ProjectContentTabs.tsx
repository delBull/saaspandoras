'use client';

import { useState } from "react";
import { 
  Puzzle,
  Shield,
  Code,
  Crown,
  Briefcase,
  Star,
  ExternalLink,
  Globe
} from "lucide-react";
import type { ProjectData } from "../../app/(dashboard)/projects/types";
import SectionCard from "./SectionCard";

// Helper para parsear JSON de forma segura
function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return defaultValue;
  }
}

// --- CONTENIDO DINÁMICO POR TABS (MECÁNICA, SOSTENIBILIDAD, TRANSPARENCIA) ---
interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface ProjectContentTabsProps {
  project: ProjectData;
}

export default function ProjectContentTabs({ project }: ProjectContentTabsProps) {
  // Parsear el estimated_apy JSON para mostrar la tabla de recompensas
  let rewardsStructure;
  try {
    rewardsStructure = safeJsonParse(project.estimated_apy as string | null, {});
  } catch {
    rewardsStructure = {};
  }

  const tabs: Tab[] = [
    // --- TAB 0: CAMPAÑA (LA PRESENTACIÓN) ---
    {
      id: 'campaign',
      label: 'Campaña',
      icon: Star,
      content: (
        <div className="space-y-8 mb-8">
          <SectionCard title="Descripción del Proyecto" icon={Star}>
            <p className="text-zinc-300 whitespace-pre-line text-lg leading-relaxed">
              {project.description ?? 'No hay descripción disponible para este proyecto.'}
            </p>
          </SectionCard>

          {(() => {
            // Acceso seguro a propiedades opcionales
            const projectObj = project as unknown as Record<string, unknown>;
            const hasLinks = projectObj.website_url || projectObj.whitepaper_url || projectObj.twitter_url || projectObj.discord_url || projectObj.telegram_url || projectObj.video_pitch;

            return hasLinks ? (
              <SectionCard title="Enlaces y Recursos" icon={ExternalLink}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Website */}
                  {typeof projectObj.website_url === 'string' && projectObj.website_url && (
                    <a
                      href={projectObj.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <Globe className="w-5 h-5 text-lime-400 group-hover:text-lime-300" />
                      <div>
                        <p className="text-white font-medium">Sitio Web</p>
                        <p className="text-zinc-400 text-sm">Visitar website oficial</p>
                      </div>
                    </a>
                  )}

                  {/* Whitepaper/Litepaper */}
                  {typeof projectObj.whitepaper_url === 'string' && projectObj.whitepaper_url && (
                    <a
                      href={projectObj.whitepaper_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <div>
                        <p className="text-white font-medium">Whitepaper</p>
                        <p className="text-zinc-400 text-sm">Documentación técnica</p>
                      </div>
                    </a>
                  )}

                  {/* Twitter */}
                  {typeof projectObj.twitter_url === 'string' && projectObj.twitter_url && (
                    <a
                      href={projectObj.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <div>
                        <p className="text-white font-medium">Twitter</p>
                        <p className="text-zinc-400 text-sm">Síguenos en Twitter</p>
                      </div>
                    </a>
                  )}

                  {/* Discord */}
                  {typeof projectObj.discord_url === 'string' && projectObj.discord_url && (
                    <a
                      href={projectObj.discord_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                      </svg>
                      <div>
                        <p className="text-white font-medium">Discord</p>
                        <p className="text-zinc-400 text-sm">Únete a la comunidad</p>
                      </div>
                    </a>
                  )}

                  {/* Telegram */}
                  {typeof projectObj.telegram_url === 'string' && projectObj.telegram_url && (
                    <a
                      href={projectObj.telegram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      <div>
                        <p className="text-white font-medium">Telegram</p>
                        <p className="text-zinc-400 text-sm">Canal oficial</p>
                      </div>
                    </a>
                  )}

                  {/* Video Pitch - si existe */}
                  {typeof projectObj.video_pitch === 'string' && projectObj.video_pitch && (
                    <button
                      onClick={() => {
                        // Scroll to video section
                        const videoSection = document.querySelector('[data-video-section]');
                        videoSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group text-left"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <div>
                        <p className="text-white font-medium">Video Pitch</p>
                        <p className="text-zinc-400 text-sm">Ver presentación del proyecto</p>
                      </div>
                    </button>
                  )}
                </div>
              </SectionCard>
            ) : null;
          })()}
        </div>
      ),
    },
    // --- TAB 1: MECÁNICA DE UTILIDAD ---
    {
      id: 'utility',
      label: 'Mecánica de Utilidad',
      icon: Puzzle,
      content: (
        <div className="space-y-8 mb-8">
          <SectionCard title="Estructura de Recompensa Recurrente" icon={Star}>
            {Object.keys(rewardsStructure).length > 0 ? (
              <ul className="space-y-3">
                {Object.entries(rewardsStructure).map(([type, value]) => (
                  <li key={type} className="p-3 bg-zinc-700/50 rounded-lg">
                    <p className="font-semibold text-white">{type.toUpperCase().replace(/_/g, ' ')}</p>
                    <p className="text-lime-400">{String(value)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-400">No hay recompensas recurrentes definidas en esta Creación.</p>
            )}
          </SectionCard>

          <SectionCard title="Mecanismo de Recompensa (Labor/Work-to-Earn)" icon={Briefcase}>
            <p className="text-zinc-300 whitespace-pre-line">{project.applicant_name ?? 'No especificado'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Esta información define qué acciones son validadas como contribución a la Creación.
            </p>
          </SectionCard>
        </div>
      ),
    },
    // --- TAB 2: ESTRATEGIA Y SOSTENIBILIDAD (EL PLAN DE NEGOCIO) ---
    {
      id: 'strategy',
      label: 'Estrategia y Sostenibilidad',
      icon: Shield,
      content: (
        <div className="space-y-8 mb-8">
          <SectionCard title="Sostenibilidad de la Utilidad a Largo Plazo" icon={Globe}>
            <p className="text-zinc-300 whitespace-pre-line">{project.lockup_period ?? 'No especificada'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Detalla el roadmap de utilidad para mantener el valor de acceso.
            </p>
          </SectionCard>

          <SectionCard title="Modelo de Monetización (Ingresos del Protocolo)" icon={ExternalLink}>
            <p className="text-zinc-300 whitespace-pre-line">{project.fiduciary_entity ?? 'No especificado'}</p>
            <p className="mt-4 text-sm text-lime-400">
              *Este modelo financia la utilidad recurrente.
            </p>
          </SectionCard>

          <SectionCard title="Estrategia de Adopción (Go-To-Market)" icon={Star}>
            <p className="text-zinc-300 whitespace-pre-line">{project.valuation_document_url ?? 'No especificada'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Detalla el plan inicial de distribución de Artefactos (Airdrop, Venta Fija, Mérito).
            </p>
          </SectionCard>

          <SectionCard title="Planes de Integración Tecnológica" icon={Code}>
            <p className="text-zinc-300 whitespace-pre-line">{project.is_mintable ? 'Sí, integraremos con Discord para verificar la tenencia del Artefacto y con Shopify para aplicar descuentos automáticos en mercancía.' : 'No especificados'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Integraciones con Discord, e-commerce, o servicios Web3 que amplían el uso.
            </p>
          </SectionCard>
        </div>
      ),
    },
    // --- TAB 3: TRANSPARENCIA Y LEGAL (LA CONFIANZA) ---
    {
      id: 'compliance',
      label: 'Transparencia y Legal',
      icon: Shield,
      content: (
        <div className="space-y-8 mb-8">
          <SectionCard title="Estatus Legal y Jurisdicción" icon={Briefcase}>
            <p className="text-zinc-300">Estatus: <span className="font-semibold text-white">{project.legal_status ?? 'No especificado'}</span></p>
          </SectionCard>

          <SectionCard title="Mitigación de Riesgo Operativo y Fraude" icon={Shield}>
            <p className="text-zinc-300 whitespace-pre-line">{project.due_diligence_report_url ?? 'No especificada'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Plan del Creador para manejar el fraude interno y el riesgo de uso de la comunidad.
            </p>
          </SectionCard>

          <SectionCard title="Parámetros de Contrato (Smart Contract)" icon={Code}>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li><span className="font-semibold text-white">Tipo de Artefacto:</span> {project.token_type ?? 'ERC-721'}</li>
              <li><span className="font-semibold text-white">Mutabilidad de Reglas:</span> {project.is_mutable ? 'Mutable (Las reglas pueden actualizarse)' : 'Inmutable (Reglas fijas)'}</li>
              <li><span className="font-semibold text-white">Dirección de Autoridad:</span> {project.update_authority_address ?? project.contract_address ?? 'No especificada'}</li>
            </ul>
          </SectionCard>

          <SectionCard title="Información del Creador" icon={Crown}>
            <p className="text-zinc-300"><span className="font-semibold text-white">Nombre del Solicitante:</span> {project.applicant_name ?? 'No especificado'}</p>
            <p className="text-zinc-300"><span className="font-semibold text-white">Posición:</span> {project.applicant_position ?? 'No especificada'}</p>
          </SectionCard>
        </div>
      ),
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id ?? 'utility');
  const activeTabData = tabs.find(t => t.id === activeTab);
  const activeContent = activeTabData?.content;

  return (
    <div className="mt-12">
      {/* Navigación de Tabs */}
      <div className="flex border-b border-zinc-700/50 mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-3 text-sm md:text-md font-semibold flex items-center gap-2 transition-colors duration-200
              ${activeTab === tab.id
                ? 'text-lime-400 border-b-2 border-lime-400'
                : 'text-zinc-400 hover:text-white hover:border-b-2 hover:border-zinc-500'
              }
            `}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido Activo */}
      <div>
        {activeContent}
      </div>
    </div>
  );
}
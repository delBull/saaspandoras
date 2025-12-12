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
import type { ProjectData } from "@/app/()/projects/types";
import SectionCard from "./SectionCard";

// Función removida ya que no se usa en las nuevas tabs

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
  // Función para mostrar el video (ya no utilizada)
  const _showVideo = () => {
    const videoRef = (window as any).projectVideoRef;
    if (videoRef?.showVideo) {
      videoRef.showVideo();
    }
  };

  // Variable removida ya que no se usa en las nuevas tabs

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
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
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
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                      <div>
                        <p className="text-white font-medium">Telegram</p>
                        <p className="text-zinc-400 text-sm">Canal oficial</p>
                      </div>
                    </a>
                  )}

                  {/* Video Pitch - si existe */}
                  {typeof projectObj.video_pitch === 'string' && projectObj.video_pitch && (
                    <a
                      href={projectObj.video_pitch}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <div>
                        <p className="text-white font-medium">Video Pitch</p>
                        <p className="text-zinc-400 text-sm">Ver presentación del proyecto</p>
                      </div>
                    </a>
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
          {/* Mecánica del Protocolo - Nueva clave */}
          {project.protoclMecanism && (
            <SectionCard title="Mecánica del Protocolo" icon={Puzzle}>
              <p className="text-zinc-300 whitespace-pre-line">{project.protoclMecanism}</p>
            </SectionCard>
          )}

          {/* Utilidad a Largo Plazo - Nueva clave */}
          {project.artefactUtility && (
            <SectionCard title="Utilidad a Largo Plazo de los Artefactos" icon={Star}>
              <p className="text-zinc-300 whitespace-pre-line">{project.artefactUtility}</p>
            </SectionCard>
          )}

          {/* Mecánica del Protocolo (desde ProjectDetails) */}
          {project.fund_usage && (
            <SectionCard title="Mecánica del Protocolo" icon={Puzzle}>
              <p className="text-zinc-300 whitespace-pre-line">{project.fund_usage}</p>
              <p className="mt-4 text-sm text-zinc-400">
                *Regla fundamental de valor para holders del Artefacto.
              </p>
            </SectionCard>
          )}

          {/* Utilidad Continua (desde ProjectDetails) */}
          {project.lockup_period && (
            <SectionCard title="Utilidad Continua" icon={Star}>
              <p className="text-zinc-300 whitespace-pre-line">{project.lockup_period}</p>
              <p className="mt-4 text-sm text-zinc-400">
                *Plan para mantener valor a largo plazo.
              </p>
            </SectionCard>
          )}

          {/* Sistema Work-to-Earn - Nueva clave */}
          {project.worktoearnMecanism && (
            <SectionCard title="Sistema Work-to-Earn" icon={Briefcase}>
              <p className="text-zinc-300 whitespace-pre-line">{project.worktoearnMecanism}</p>
            </SectionCard>
          )}

          {/* Plan de Integraciones - Nueva clave */}
          {project.integrationPlan && (
            <SectionCard title="Plan de Integraciones" icon={Code}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm font-medium">Planea integraciones con otras plataformas</span>
              </div>
            </SectionCard>
          )}

          {/* Fases de Venta (Deployment Config) */}
          {project.w2eConfig?.phases && project.w2eConfig.phases.length > 0 && (
            <SectionCard title="Fases de Venta Activas" icon={Crown}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.w2eConfig.phases.map((phase: any) => (
                  <div key={phase.id} className={`p-4 rounded-lg border ${phase.isActive ? 'bg-lime-500/10 border-lime-500/30' : 'bg-zinc-800/50 border-zinc-700/50 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{phase.name}</h4>
                      {phase.isActive && <span className="px-2 py-0.5 rounded text-xs bg-lime-500/20 text-lime-400 border border-lime-500/30">Activa</span>}
                    </div>
                    <div className="text-sm text-zinc-400 space-y-1">
                      <p>
                        <span className="text-zinc-500">Condición:</span> {phase.type === 'time' ? 'Tiempo Limitado' : 'Monto Objetivo'}
                      </p>
                      <p>
                        <span className="text-zinc-500">Límite:</span> {phase.limit} {phase.type === 'time' ? 'Días' : 'USD'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Estructura de Recompensa Recurrente */}
          <SectionCard title="Estructura de Recompensa Recurrente" icon={Star}>
            {(() => {
              // Intentar parsear como JSON primero (formato nuevo), luego como string simple
              let rewardsData;
              try {
                rewardsData = project.recurring_rewards ? JSON.parse(project.recurring_rewards) : null;
              } catch {
                rewardsData = null;
              }

              if (rewardsData) {
                // Formato JSON: mostrar estructura detallada
                const rewardsList = [];
                if (rewardsData.stakingRewardsEnabled) {
                  rewardsList.push({
                    type: 'Staking Rewards',
                    details: rewardsData.stakingRewardsDetails || 'Habilitado'
                  });
                }
                if (rewardsData.revenueSharingEnabled) {
                  rewardsList.push({
                    type: 'Revenue Sharing',
                    details: rewardsData.revenueSharingDetails || 'Habilitado'
                  });
                }
                if (rewardsData.workToEarnEnabled) {
                  rewardsList.push({
                    type: 'Work-to-Earn',
                    details: rewardsData.workToEarnDetails || 'Habilitado'
                  });
                }
                if (rewardsData.tieredAccessEnabled) {
                  rewardsList.push({
                    type: 'Tiered Access',
                    details: rewardsData.tieredAccessDetails || 'Habilitado'
                  });
                }
                if (rewardsData.discountedFeesEnabled) {
                  rewardsList.push({
                    type: 'Discounted Fees',
                    details: rewardsData.discountedFeesDetails || 'Habilitado'
                  });
                }

                return rewardsList.length > 0 ? (
                  <div className="space-y-3">
                    {rewardsList.map((reward, index) => (
                      <div key={index} className="p-3 bg-zinc-700/50 rounded-lg">
                        <p className="font-semibold text-white text-sm">{reward.type}</p>
                        <p className="text-zinc-300 text-sm mt-1">{reward.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400">No hay recompensas recurrentes activas definidas.</p>
                );
              } else if (project.recurring_rewards) {
                // Formato string simple (legacy)
                return <p className="text-zinc-300 whitespace-pre-line">{project.recurring_rewards}</p>;
              } else {
                // No hay datos
                return <p className="text-zinc-400">No hay recompensas recurrentes definidas en esta Creación.</p>;
              }
            })()}
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
          {/* Meta de Adopción - Nueva clave */}
          {project.target_amount && (
            <SectionCard title="Meta de Adopción" icon={Globe}>
              <p className="text-zinc-300">
                <span className="font-semibold text-lime-400 text-lg">${project.target_amount.toLocaleString()}</span>
                <span className="text-zinc-400 ml-2">USD objetivo</span>
              </p>
              <p className="mt-4 text-sm text-zinc-400">
                *Monto necesario para lanzar esta Creación de utilidad.
              </p>
            </SectionCard>
          )}

          {/* Modelo de Monetización - Nueva clave */}
          {project.monetizationModel && (
            <SectionCard title="Modelo de Monetización (Ingresos del Protocolo)" icon={ExternalLink}>
              <p className="text-zinc-300 whitespace-pre-line">{project.monetizationModel}</p>
              <p className="mt-4 text-sm text-lime-400">
                *Este modelo financia la utilidad recurrente.
              </p>
            </SectionCard>
          )}

          {/* Estrategia de Adquisición - Nueva clave */}
          {project.adquireStrategy && (
            <SectionCard title="Estrategia de Adopción (Go-To-Market)" icon={Star}>
              <p className="text-zinc-300 whitespace-pre-line">{project.adquireStrategy}</p>
              <p className="mt-4 text-sm text-zinc-400">
                *Detalla el plan inicial de distribución de Artefactos (Airdrop, Venta Fija, Mérito).
              </p>
            </SectionCard>
          )}

          {/* Parámetros del Artefacto */}
          <SectionCard title="Parámetros del Artefacto" icon={Code}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-300"><span className="font-semibold text-white">Tipo:</span> {project.token_type ?? 'ERC-721'}</p>
              </div>
              <div>
                <p className="text-zinc-300"><span className="font-semibold text-white">Supply Total:</span> {project.total_tokens ? project.total_tokens.toLocaleString() : 'No especificado'}</p>
              </div>
              <div>
                <p className="text-zinc-300"><span className="font-semibold text-white">Para Venta:</span> {project.tokens_offered ? project.tokens_offered.toLocaleString() : 'No especificado'}</p>
              </div>
              <div>
                <p className="text-zinc-300"><span className="font-semibold text-white">Precio:</span> {project.token_price_usd ? `$${Number(project.token_price_usd) % 1 === 0 ? Number(project.token_price_usd).toFixed(0) : Number(project.token_price_usd).toFixed(2)}` : 'No especificado'}</p>
              </div>
            </div>
          </SectionCard>

          {/* Estructura de Recompensa Recurrente */}
          <SectionCard title="Estructura de Recompensa Recurrente" icon={Star}>
            {project.recurring_rewards ? (
              <p className="text-zinc-300 whitespace-pre-line">{project.recurring_rewards}</p>
            ) : (
              <p className="text-zinc-400">No especificada</p>
            )}
            <p className="mt-4 text-sm text-zinc-400">
              *Sistema de recompensas continuas para mantener la utilidad.
            </p>
          </SectionCard>

          {/* Governance Tokenomics (Deployment Config) */}
          {project.w2eConfig?.tokenomics && (
            <SectionCard title="Tokenomics y Gobernanza (On-Chain)" icon={Briefcase}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Precio Inicial</p>
                  <p className="text-xl font-mono text-white">${project.w2eConfig.tokenomics.price}</p>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Suministro Inicial</p>
                  <p className="text-xl font-mono text-white">{Number(project.w2eConfig.tokenomics.initialSupply).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Poder de Voto</p>
                  <p className="text-xl font-mono text-white">{project.w2eConfig.tokenomics.votingPowerMultiplier}x</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                *Estos valores están configurados en los contratos inteligentes desplegados.
              </p>
            </SectionCard>
          )}
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
          {/* Contratos Inteligentes (SCaaS) - Nueva sección destacada */}
          {(project.licenseContractAddress || project.governorContractAddress || project.treasuryContractAddress) && (
            <SectionCard title="Contratos Inteligentes del Protocolo" icon={Code}>
              <div className="space-y-3">
                {project.licenseContractAddress && (
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">Licencia de Acceso (NFT)</p>
                      <p className="text-zinc-500 text-xs font-mono break-all">{project.licenseContractAddress}</p>
                    </div>
                    <a href={`https://sepolia.etherscan.io/address/${project.licenseContractAddress}`} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {project.governorContractAddress && (
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">Gobernador (DAO)</p>
                      <p className="text-zinc-500 text-xs font-mono break-all">{project.governorContractAddress}</p>
                    </div>
                    <a href={`https://sepolia.etherscan.io/address/${project.governorContractAddress}`} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {project.treasuryContractAddress && (
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">Tesorería Comunitaria</p>
                      <p className="text-zinc-500 text-xs font-mono break-all">{project.treasuryContractAddress}</p>
                    </div>
                    <a href={`https://sepolia.etherscan.io/address/${project.treasuryContractAddress}`} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {project.contract_address && !project.licenseContractAddress && (
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">Contrato Principal</p>
                      <p className="text-zinc-500 text-xs font-mono break-all">{project.contract_address}</p>
                    </div>
                    <a href={`https://sepolia.etherscan.io/address/${project.contract_address}`} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-2">
                  *Estos contratos garantizan la transparencia y la gobernanza autónoma del protocolo en la red {project.chainId === 11155111 ? 'Sepolia' : project.chainId || 'Ethereum'}.
                </p>
              </div>
            </SectionCard>
          )}

          {/* Estatus Legal - Nueva clave */}
          <SectionCard title="Estatus Legal y Jurisdicción" icon={Briefcase}>
            <p className="text-zinc-300 whitespace-pre-line">{project.legal_status ?? 'No especificado'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Información legal para demostrar la legitimidad de la entidad.
            </p>
          </SectionCard>

          {/* Entidad Fiduciaria (desde ProjectDetails) */}
          {project.fiduciary_entity && (
            <SectionCard title="Entidad Fiduciaria" icon={Shield}>
              <p className="text-zinc-300 whitespace-pre-line">{project.fiduciary_entity}</p>
              <p className="mt-4 text-sm text-zinc-400">
                *Custodia de activos del mundo real.
              </p>
            </SectionCard>
          )}

          {/* Documento de Valuación (desde ProjectDetails) */}
          {project.valuation_document_url && (
            <SectionCard title="Documento de Valuación" icon={Code}>
              <a href={project.valuation_document_url} target="_blank" rel="noopener noreferrer"
                className="text-lime-400 hover:text-lime-300 underline text-sm">
                Ver documento →
              </a>
              <p className="mt-2 text-sm text-zinc-400">
                *Análisis de valuación del proyecto.
              </p>
            </SectionCard>
          )}

          {/* Reporte de Due Diligence (desde ProjectDetails) */}
          {project.due_diligence_report_url && (
            <SectionCard title="Reporte de Due Diligence" icon={Shield}>
              <a href={project.due_diligence_report_url} target="_blank" rel="noopener noreferrer"
                className="text-lime-400 hover:text-lime-300 underline text-sm">
                Ver reporte →
              </a>
              <p className="mt-2 text-sm text-zinc-400">
                *Análisis de riesgos y validación.
              </p>
            </SectionCard>
          )}

          {/* Mitigación de Riesgos - Nueva clave */}
          {project.mitigationPlan && (
            <SectionCard title="Mitigación de Riesgo Operativo y Fraude" icon={Shield}>
              <p className="text-zinc-300 whitespace-pre-line">{project.mitigationPlan}</p>
              <p className="mt-4 text-sm text-zinc-400">
                *Plan del Creador para manejar el fraude interno y el riesgo de uso de la comunidad.
              </p>
            </SectionCard>
          )}

          <SectionCard title="Información del Creador" icon={Crown}>
            <p className="text-zinc-300"><span className="font-semibold text-white">Nombre del Solicitante:</span> {project.applicant_name ?? 'No especificado'}</p>
            <p className="text-zinc-300"><span className="font-semibold text-white">Posición:</span> {project.applicant_position ?? 'No especificada'}</p>
            {project.applicant_email && (
              <p className="text-zinc-300"><span className="font-semibold text-white">Email:</span> {project.applicant_email}</p>
            )}
            {project.applicant_phone && (
              <p className="text-zinc-300"><span className="font-semibold text-white">Teléfono:</span> {project.applicant_phone}</p>
            )}
            {project.applicant_wallet_address && (
              <p className="text-zinc-300"><span className="font-semibold text-white">Wallet:</span> {project.applicant_wallet_address.slice(0, 6)}...{project.applicant_wallet_address.slice(-4)}</p>
            )}
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

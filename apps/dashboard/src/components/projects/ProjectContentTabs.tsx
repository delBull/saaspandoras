'use client';

import { useState } from "react";
import ArtifactPurchaseModal from "@/components/modals/ArtifactPurchaseModal";
import Link from "next/link";
import {
  Puzzle,
  Shield,
  Code,
  Crown,
  Briefcase,
  Star,
  ExternalLink,
  Globe,
  LayoutGrid,
  ArrowRight
} from "lucide-react";
import type { ProjectData } from "@/app/()/projects/types";
import SectionCard from "./SectionCard";

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
  const [activeTab, setActiveTab] = useState("strategy");
  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);

  // Función para mostrar el video (ya no utilizada)
  const _showVideo = () => {
    const videoRef = (window as any).projectVideoRef;
    if (videoRef?.showVideo) {
      videoRef.showVideo();
    }
  };

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
                      <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/file-text.svg" className="w-5 h-5 text-lime-400 group-hover:text-lime-300" alt="Whitepaper" />
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
                      <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/twitter.svg" className="w-5 h-5 text-lime-400 group-hover:text-lime-300" alt="Twitter" />
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
                      <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/message-circle.svg" className="w-5 h-5 text-lime-400 group-hover:text-lime-300" alt="Discord" />
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
                      <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/send.svg" className="w-5 h-5 text-lime-400 group-hover:text-lime-300" alt="Telegram" />
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
                      <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/play-circle.svg" className="w-5 h-5 text-lime-400 group-hover:text-lime-300" alt="Video" />
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
            </SectionCard>
          )}

          {/* Utilidad Continua (desde ProjectDetails) */}
          {project.lockup_period && (
            <SectionCard title="Utilidad Continua" icon={Star}>
              <p className="text-zinc-300 whitespace-pre-line">{project.lockup_period}</p>
            </SectionCard>
          )}

          {/* Sistema Work-to-Earn - Nueva clave */}
          {project.worktoearnMecanism && (
            <SectionCard title="Sistema Work-to-Earn" icon={Briefcase}>
              <p className="text-zinc-300 whitespace-pre-line">{project.worktoearnMecanism}</p>
            </SectionCard>
          )}

          {/* Active Phases (Formerly Ofertas) */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="w-5 h-5 text-lime-400" />
              <h3 className="text-lg font-bold text-white">Artefactos (Fases)</h3>
            </div>
            {project.w2eConfig?.phases && project.w2eConfig.phases.length > 0 ? (
              <div className="space-y-4">
                {project.w2eConfig.phases.map((phase: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedPhase(phase);
                      setIsArtifactModalOpen(true);
                    }}
                    className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 hover:border-lime-500/50 cursor-pointer transition-all hover:bg-zinc-800 group"
                  >
                    <h4 className="font-bold text-white mb-2 flex items-center justify-between group-hover:text-lime-400 transition-colors">
                      <div className="flex items-center gap-2">
                        <span>{phase.name}</span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-lime-400" />
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded text-gray-300 uppercase">{phase.type === 'time' ? 'Tiempo' : 'Monto'}</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {/* Token Price (Property: tokenPrice) */}
                      <div>
                        <span className="text-zinc-500 block text-xs">Precio Token</span>
                        <span className="text-lime-400 font-mono">${phase.tokenPrice ?? '0.00'}</span>
                      </div>
                      {/* Limit (Context sensitive) */}
                      <div>
                        <span className="text-zinc-500 block text-xs">Límite ({phase.type === 'time' ? 'Días' : 'USD'})</span>
                        <span className="text-white font-mono">{Number(phase.limit).toLocaleString()} {phase.type === 'time' ? 'd' : '$'}</span>
                      </div>
                      {/* Allocation (Property: tokenAllocation) */}
                      <div>
                        <span className="text-zinc-500 block text-xs">Asignación</span>
                        <span className="text-white font-mono">{phase.tokenAllocation ? Number(phase.tokenAllocation).toLocaleString() : '∞'}</span>
                      </div>
                      {/* Status */}
                      <div>
                        <span className="text-zinc-500 block text-xs">Estado</span>
                        <span className={phase.isActive ? "text-lime-400" : "text-zinc-500"}>{phase.isActive ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">No hay fases de artefactos definidas.</p>
            )}
          </div>

          <ArtifactPurchaseModal
            isOpen={isArtifactModalOpen}
            onClose={() => setIsArtifactModalOpen(false)}
            project={project}
            utilityContract={{ address: project.utilityContractAddress }}
            phase={selectedPhase}
          />

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
                return (
                  <div className="space-y-3">
                    {/* ... (Implement specific reward type rendering if needed, for now just basic check) ... */}
                    {Object.entries(rewardsData).map(([key, value]) => {
                      if (key.includes('Enabled') && value === true) {
                        const detailKey = key.replace('Enabled', 'Details');
                        // @ts-ignore
                        const detailValue = rewardsData[detailKey];
                        return (
                          <div key={key} className="p-3 bg-zinc-700/50 rounded-lg">
                            <p className="font-semibold text-white text-sm">{key.replace('Enabled', '')}</p>
                            <p className="text-zinc-300 text-sm mt-1">{detailValue}</p>
                          </div>
                        )
                      }
                      return null;
                    })}
                  </div>
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
          {/* Meta de Adopción - Dynamic from Config or Target */}
          {(() => {
            const tokenomics = project.w2eConfig?.tokenomics;
            const target = tokenomics?.initialSupply ?
              (Number(tokenomics.initialSupply) * Number(tokenomics.price || 0)) :
              Number(project.target_amount || 0);

            return target > 0 && (
              <SectionCard title="Meta de Adopción" icon={Globe}>
                <p className="text-zinc-300">
                  <span className="font-semibold text-lime-400 text-lg">${target.toLocaleString()}</span>
                  <span className="text-zinc-400 ml-2">USD objetivo</span>
                </p>
              </SectionCard>
            );
          })()}

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

          {/* Parámetros del Artefacto (Fases) - READ ONLY duplicate view if desired or separate */}
          {/* Skipping full phase list here to avoid redundancy with Utility tab, or keeping concise */}


          {/* Estructura de Recompensa Recurrente */}
          <SectionCard title="Estructura de Recompensa Recurrente" icon={Star}>
            {project.recurring_rewards ? (
              <p className="text-zinc-300 whitespace-pre-line">{project.recurring_rewards}</p>
            ) : (
              <p className="text-zinc-400">No especificada</p>
            )}
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
          {/* Contratos Inteligentes (SCaaS) */}
          {(project.licenseContractAddress || project.utilityContractAddress || project.loomContractAddress) && (
            <SectionCard title="Contratos Inteligentes del Protocolo" icon={Code}>
              <div className="space-y-3">
                {/* 1. Licencia (Acceso) */}
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

                {/* 2. Utility Token */}
                {project.utilityContractAddress && (
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">Token de Utilidad (ERC-20)</p>
                      <p className="text-zinc-500 text-xs font-mono break-all">{project.utilityContractAddress}</p>
                    </div>
                    <a href={`https://sepolia.etherscan.io/address/${project.utilityContractAddress}`} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* 3. Loom (Lógica Central) */}
                {project.loomContractAddress && (
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">W2E Loom (Lógica Central)</p>
                      <p className="text-zinc-500 text-xs font-mono break-all">{project.loomContractAddress}</p>
                    </div>
                    <a href={`https://sepolia.etherscan.io/address/${project.loomContractAddress}`} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {/* 4. Gobernador (DAO) */}
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

                {/* 5. Tesorería */}
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
                {/* 6. Timelock */}
                {project.w2eConfig?.timelockAddress && project.w2eConfig.timelockAddress !== "0x0000000000000000000000000000000000000000" && (
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">Timelock (Seguridad)</p>
                      <p className="text-zinc-500 text-xs font-mono break-all">{project.w2eConfig.timelockAddress}</p>
                    </div>
                    <a href={`https://sepolia.etherscan.io/address/${project.w2eConfig.timelockAddress}`} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Estatus Legal - Nueva clave */}
          <SectionCard title="Estatus Legal y Jurisdicción" icon={Briefcase}>
            <p className="text-zinc-300 whitespace-pre-line">{project.legal_status ?? 'No especificado'}</p>
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

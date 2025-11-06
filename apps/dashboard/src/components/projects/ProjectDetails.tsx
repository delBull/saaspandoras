'use client';

import { Puzzle, Ticket, Code, Shield, Crown, PieChart } from "lucide-react";
import type { ProjectData } from "../../app/(dashboard)/projects/types";

interface ProjectDetailsProps {
  project: ProjectData;
}

// Helper para parsear JSON de forma segura
function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

export default function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <div className="space-y-8">
      {/* Utility Protocol Details */}
      {(project.total_tokens ?? project.estimated_apy ?? project.yield_source ?? project.fund_usage ?? project.lockup_period) && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-lime-400" /> Detalles del Protocolo de Utilidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.total_tokens && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Supply Total</h4>
                <p className="text-lime-400 text-xl font-mono">{Number(project.total_tokens).toLocaleString()}</p>
                <p className="text-zinc-400 text-sm">Tokens disponibles en total</p>
              </div>
            )}
            {project.estimated_apy && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Recompensa Estimada</h4>
                <p className="text-lime-400 text-xl font-mono">{project.estimated_apy}%</p>
                <p className="text-zinc-400 text-sm">Rendimiento anual estimado</p>
              </div>
            )}
            {project.yield_source && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Fuente de Recompensas</h4>
                <p className="text-white">{project.yield_source}</p>
                <p className="text-zinc-400 text-sm">Cómo se generan las recompensas</p>
              </div>
            )}
            {project.fund_usage && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Mecánica del Protocolo</h4>
                <p className="text-white text-sm">{project.fund_usage}</p>
                <p className="text-zinc-400 text-sm">Regla fundamental de valor para holders</p>
              </div>
            )}
            {project.lockup_period && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Utilidad Continua</h4>
                <p className="text-white text-sm">{project.lockup_period}</p>
                <p className="text-zinc-400 text-sm">Plan para mantener valor a largo plazo</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recurring Rewards Structure */}
      {(project.recurring_rewards ??
        project.staking_rewards_enabled ??
        project.revenue_sharing_enabled ??
        project.work_to_earn_enabled ??
        project.tiered_access_enabled ??
        project.discounted_fees_enabled) && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-lime-400" /> Estructura de Recompensa Recurrente
          </h3>
          <div className="space-y-4">
            {project.recurring_rewards && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Descripción General</h4>
                <p className="text-white text-sm">{project.recurring_rewards}</p>
                <p className="text-zinc-400 text-sm">Cómo se traducirá la utilidad en valor recurrente</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.staking_rewards_enabled && (
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-lime-400 mb-2">🏦 Staking Rewards</h4>
                  {project.staking_rewards_details && (
                    <p className="text-white text-sm">{project.staking_rewards_details}</p>
                  )}
                </div>
              )}
              {project.revenue_sharing_enabled && (
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-lime-400 mb-2">💰 Revenue Sharing</h4>
                  {project.revenue_sharing_details && (
                    <p className="text-white text-sm">{project.revenue_sharing_details}</p>
                  )}
                </div>
              )}
              {project.work_to_earn_enabled && (
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-lime-400 mb-2">⚡ Work-to-Earn</h4>
                  {project.work_to_earn_details && (
                    <p className="text-white text-sm">{project.work_to_earn_details}</p>
                  )}
                </div>
              )}
              {project.tiered_access_enabled && (
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-lime-400 mb-2">🏆 Tiered Access</h4>
                  {project.tiered_access_details && (
                    <p className="text-white text-sm">{project.tiered_access_details}</p>
                  )}
                </div>
              )}
              {project.discounted_fees_enabled && (
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-lime-400 mb-2">💎 Discounted Fees</h4>
                  {project.discounted_fees_details && (
                    <p className="text-white text-sm">{project.discounted_fees_details}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {project.integration_details && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Code className="w-5 h-5 text-lime-400" /> Integraciones y Expansión
          </h3>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Planes de Integración</h4>
            <p className="text-white text-sm">{project.integration_details}</p>
            <p className="text-zinc-400 text-sm">Cómo se conectará con otras plataformas y herramientas</p>
          </div>
        </div>
      )}

      {/* Technical Parameters */}
      {(project.is_mintable !== null || project.is_mutable !== null || project.contract_address) && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Code className="w-5 h-5 text-lime-400" /> Parámetros Técnicos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.contract_address && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Dirección del Contrato</h4>
                <p className="text-lime-400 text-sm font-mono break-all">{project.contract_address}</p>
                <p className="text-zinc-400 text-sm">Contrato inteligente desplegado</p>
              </div>
            )}
            {project.treasury_address && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Tesorería</h4>
                <p className="text-lime-400 text-sm font-mono break-all">{project.treasury_address}</p>
                <p className="text-zinc-400 text-sm">Dirección donde se reciben los fondos</p>
              </div>
            )}
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Contrato Acuñable</h4>
              <p className="text-white">{project.is_mintable ? 'Sí' : 'No'}</p>
              <p className="text-zinc-400 text-sm">Puede crear más tokens después del lanzamiento</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Metadatos Mutables</h4>
              <p className="text-white">{project.is_mutable ? 'Sí' : 'No'}</p>
              <p className="text-zinc-400 text-sm">Los metadatos pueden modificarse</p>
            </div>
          </div>
        </div>
      )}

      {/* Transparency & Legal */}
      {(project.legal_status ?? project.fiduciary_entity ?? project.valuation_document_url ?? project.due_diligence_report_url) && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-lime-400" /> Transparencia y Legal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.legal_status && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Estatus Legal</h4>
                <p className="text-white">{project.legal_status}</p>
                <p className="text-zinc-400 text-sm">Jurisdicción y estructura legal</p>
              </div>
            )}
            {project.fiduciary_entity && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Entidad Fiduciaria</h4>
                <p className="text-white">{project.fiduciary_entity}</p>
                <p className="text-zinc-400 text-sm">Custodia de activos del mundo real</p>
              </div>
            )}
            {project.valuation_document_url && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Documento de Valuación</h4>
                <a href={project.valuation_document_url} target="_blank" rel="noopener noreferrer"
                   className="text-lime-400 hover:text-lime-300 underline text-sm">
                  Ver documento →
                </a>
                <p className="text-zinc-400 text-sm">Análisis de valuación del proyecto</p>
              </div>
            )}
            {project.due_diligence_report_url && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Reporte de Due Diligence</h4>
                <a href={project.due_diligence_report_url} target="_blank" rel="noopener noreferrer"
                   className="text-lime-400 hover:text-lime-300 underline text-sm">
                  Ver reporte →
                </a>
                <p className="text-zinc-400 text-sm">Análisis de riesgos y validación</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Creator Information */}
      {(project.applicant_name ?? project.applicant_position ?? project.applicant_email) && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Crown className="w-5 h-5 text-lime-400" /> Información del Creador
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.applicant_name && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Nombre</h4>
                <p className="text-white">{project.applicant_name}</p>
                <p className="text-zinc-400 text-sm">Persona responsable del proyecto</p>
              </div>
            )}
            {project.applicant_position && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Rol</h4>
                <p className="text-white">{project.applicant_position}</p>
                <p className="text-zinc-400 text-sm">Posición en el proyecto</p>
              </div>
            )}
            {project.applicant_email && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Contacto</h4>
                <a href={`mailto:${project.applicant_email}`}
                   className="text-lime-400 hover:text-lime-300 underline">
                  {project.applicant_email}
                </a>
                <p className="text-zinc-400 text-sm">Email para contacto directo</p>
              </div>
            )}
            {project.applicant_phone && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Teléfono</h4>
                <p className="text-white">{project.applicant_phone}</p>
                <p className="text-zinc-400 text-sm">Contacto urgente</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Token Distribution */}
      {(() => {
        const tokenDist = safeJsonParse(project.token_distribution as string | null, {});
        const hasDistribution = Object.values(tokenDist).some((value: unknown) => {
          const numValue = Number(value);
          return numValue && numValue > 0;
        });
        return hasDistribution ? (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-lime-400" /> Distribución de Tokens
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(tokenDist).map(([key, value]: [string, unknown]) => {
                const numValue = Number(value);
                if (!numValue || numValue <= 0) return null;
                const percentage = numValue;
                const labels: Record<string, string> = {
                  communitySale: 'Venta Comunidad',
                  teamFounders: 'Equipo/Fundadores',
                  treasury: 'Tesorería',
                  marketing: 'Marketing'
                };
                return (
                  <div key={key} className="bg-zinc-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-lime-400 mb-1">{percentage}%</div>
                    <div className="text-white text-sm">{labels[key] ?? key}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null;
      })()}

      {/* Empty State for Missing Information */}
      {!project.total_tokens && !project.estimated_apy && !project.yield_source &&
       !project.contract_address && !project.treasury_address &&
       !project.legal_status && !project.fiduciary_entity &&
       !project.applicant_name && !project.applicant_position && !project.applicant_email && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <div className="text-center py-8">
            <Puzzle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Información Adicional No Disponible</h3>
            <p className="text-zinc-400">
              Esta creación aún no ha completado toda su información detallada.
              Los detalles técnicos y de transparencia se mostrarán aquí cuando estén disponibles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { Puzzle, Ticket, Code, Crown, PieChart } from "lucide-react";
import type { ProjectData } from "@/app/()/projects/types";

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

      {/* Recurring Rewards Structure - Simplified */}
      {project.recurring_rewards && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-lime-400" /> Estructura de Recompensa Recurrente
          </h3>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Sistema de Recompensas</h4>
            <p className="text-white text-sm whitespace-pre-line">{project.recurring_rewards}</p>
            <p className="text-zinc-400 text-sm mt-2">Cómo se traducirá la utilidad en valor recurrente para los holders</p>
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

      {/* Technical Parameters 
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
        */}







      {/* Empty State for Missing Information */}
      {!project.total_tokens && !project.estimated_apy && !project.yield_source &&
        !project.tokens_offered && !project.token_price_usd &&
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

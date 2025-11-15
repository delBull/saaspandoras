'use client';

import { Puzzle, Ticket } from "lucide-react";
import type { ProjectData } from "../../app/dashboard/projects/types";

interface ProjectSidebarProps {
  project: ProjectData;
  targetAmount: number;
}

export default function ProjectSidebar({ project, targetAmount }: ProjectSidebarProps) {
  const raisedAmount = Number(project.raised_amount ?? 0);
  const raisedPercentage = (raisedAmount / targetAmount) * 100;

  return (
    <div className="hidden lg:block absolute right-0 top-0 w-72 h-full">
      {/* Non-sticky section - Investment & Creator cards */}
      <div className="space-y-6 mb-6">
        {/* Investment Card */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-white mb-2">
              ${raisedAmount.toLocaleString()}
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
              <div
                className="bg-lime-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(raisedPercentage, 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-sm mb-6">
              <span className="text-gray-400">Meta: {targetAmount.toLocaleString()} tokens</span>
              <span className="text-gray-400">30 días restantes</span>
            </div>

            <button className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-6 rounded-lg transition-colors mb-4">
              ACCESO
            </button>

            <div className="flex justify-center gap-3 mb-4">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18.303 4.742a1 1 0 011.414 0l.707.707a1 1 0 010 1.414l-6.01 6.01a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 010-1.414l.707-.707a1 1 0 011.414 0L14.95 10.05l5.353-5.308z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="text-xs text-gray-400">
              Todo o nada. Esta creación solo será activada si alcanza su meta antes de la fecha límite.
            </div>
          </div>
        </div>

        {/* Project Creator Card */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Creación Por</h3>
          <div className="text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white font-bold text-lg">IMG</span>
            </div>
            <div className="text-white font-medium mb-1">{project.applicant_name ?? "Nombre del Creador"}</div>
            <div className="text-gray-400 text-sm mb-3">
              {(() => {
                const createdDate = project.created_at ? new Date(project.created_at as string) : new Date();
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                const projectMonth = createdDate.getMonth();
                const projectYear = createdDate.getFullYear();

                if (projectMonth === currentMonth && projectYear === currentYear) {
                  return "Creado recientemente";
                } else {
                  const monthNames = [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                  ];
                  return `${monthNames[projectMonth]} ${projectYear}`;
                }
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky section - Tokenomics & Offers (from here down) */}
      <div className="sticky top-6 space-y-6">
        {/* Utility Protocol */}
        {project.total_tokens && project.tokens_offered && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-lime-400" /> {(() => {
                const category = project.business_category;
                if (!category) return "Protocolo de Utilidad";

                // Convertir snake_case a Title Case
                return category
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
              })()}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Supply Total</span>
                <span className="text-white font-mono">{Number(project.total_tokens).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tokens Ofrecidos</span>
                <span className="text-white font-mono">{Number(project.tokens_offered).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Meta de Tokens</span>
                <span className="text-lime-400 font-mono">{targetAmount.toLocaleString()}</span>
              </div>
              {project.token_price_usd && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Costo de Acceso</span>
                  <span className="text-lime-400 font-mono">${Number(project.token_price_usd) % 1 === 0 ? Number(project.token_price_usd).toFixed(0) : Number(project.token_price_usd).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Utility Offers Panel */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-400" /> Ofertas de Utilidad
          </h3>
          <div className="space-y-4">
            {/* Token Offer 1 */}
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-medium">Fase de Comunidad Inicial</h4>
                  <p className="text-gray-400 text-sm">Mínimo 10,000 tokens</p>
                </div>
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Activa</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Valor:</span>
                <span className="text-lime-400 font-mono">$0.0003</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Disponibles:</span>
                <span className="text-white font-mono">500,000</span>
              </div>
              <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
                Participar
              </button>
            </div>

            {/* Token Offer 2 */}
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-medium">Fase de Expansión</h4>
                  <p className="text-gray-400 text-sm">Mínimo 1,000 tokens</p>
                </div>
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Próxima</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Valor:</span>
                <span className="text-lime-400 font-mono">$0.0005</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Disponibles:</span>
                <span className="text-white font-mono">1,000,000</span>
              </div>
              <button className="w-full mt-3 bg-zinc-700 text-gray-400 py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
                Próximamente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

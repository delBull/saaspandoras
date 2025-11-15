'use client';

import type { ProjectData } from "@/app/()/projects/types";

interface MobileInvestmentCardProps {
  project: ProjectData;
  targetAmount: number;
}

export default function MobileInvestmentCard({ project, targetAmount }: MobileInvestmentCardProps) {
  const raisedAmount = Number(project.raised_amount ?? 0);
  const raisedPercentage = (raisedAmount / targetAmount) * 100;

  return (
    <div className="lg:hidden mb-8">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-white mb-2">
            ${raisedAmount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400 mb-4">
            participantes de {targetAmount.toLocaleString()} meta
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
            <div
              className="bg-lime-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(raisedPercentage, 100)}%` }}
            ></div>
          </div> 

          <div className="flex justify-between text-sm mb-6">
            <span className="text-gray-400">1,000 participantes</span>
            <span className="text-gray-400">30 días restantes</span>
          </div>

          <button className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-6 rounded-lg transition-colors mb-4">
            GET THE NFT
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
            All or nothing. This project will only be funded if it reaches its goal by Sat, October 31 2020 11:59 PM UTC +00:00.
          </div>
        </div>
      </div>
    </div>
  );
}
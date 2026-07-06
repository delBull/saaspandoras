'use client';

import React from 'react';
import { DeckHero, DeckPhases, DeckFinancials, DeckInfo, DeckInvestmentExample } from './MarketingDeckBlocks';

interface MarketingDeckRendererProps {
  blocks: any[];
  projectSlug: string;
}

export function MarketingDeckRenderer({ blocks, projectSlug }: MarketingDeckRendererProps) {
  return (
    <div className="w-full flex flex-col bg-white font-sans selection:bg-amber-500 selection:text-white">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'hero':
            return <DeckHero key={index} data={block.data} />;
          case 'phases':
            return <DeckPhases key={index} data={block.data} />;
          case 'financials':
            return <DeckFinancials key={index} data={block.data} />;
          case 'info':
            return <DeckInfo key={index} data={block.data} />;
          case 'investment_example':
            return <DeckInvestmentExample key={index} data={block.data} />;
          default:
            console.warn(`Unknown deck block type: ${block.type}`);
            return null;
        }
      })}
    </div>
  );
}

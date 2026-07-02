'use client';

import React from 'react';
import { BlockHero, BlockJourney, BlockSixtySeconds, BlockPrinciples, BlockNextSteps } from './BriefingBlocks';

interface BriefingRendererProps {
  blocks: any[];
  projectSlug: string;
}

export function BriefingRenderer({ blocks, projectSlug }: BriefingRendererProps) {
  return (
    <div className="w-full flex flex-col bg-[#F9F9F9] font-sans selection:bg-black selection:text-white">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'hero':
            return <BlockHero key={index} data={block.data} />;
          case 'journey':
            return <BlockJourney key={index} data={block.data} />;
          case 'sixty_seconds':
            return <BlockSixtySeconds key={index} data={block.data} />;
          case 'principles':
            return <BlockPrinciples key={index} data={block.data} />;
          case 'next_steps':
            return <BlockNextSteps key={index} data={block.data} projectSlug={projectSlug} />;
          default:
            console.warn(`Unknown block type: ${block.type}`);
            return null;
        }
      })}
    </div>
  );
}

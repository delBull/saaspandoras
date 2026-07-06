import React from 'react';
import { MaterialViewer } from './MaterialViewer';
import { mockSNaraiDeck } from '@/lib/marketing/mock-snarai-deck';

export default function MaterialPage({ params }: { params: { slug: string, materialSlug: string } }) {
    // In the future, this will fetch from the DB: 
    // const material = await db.query.projectMarketingDecks.findFirst(...)
    
    // For now, inject S'Narai info as requested. 
    // We dynamically change the title so you can tell which document you opened.
    const firstBlock = mockSNaraiDeck.blocks?.[0];
    const deck = {
        ...mockSNaraiDeck,
        title: params.materialSlug.replace(/-/g, ' ').toUpperCase(),
        blocks: firstBlock ? [
            {
                ...firstBlock,
                data: {
                    ...(firstBlock.data || {}),
                    title: params.materialSlug.replace(/-/g, ' ').toUpperCase(),
                }
            },
            ...mockSNaraiDeck.blocks.slice(1)
        ] : []
    };

    return (
        <main className="w-full min-h-screen bg-black">
            <MaterialViewer deck={deck} projectSlug={params.slug} />
        </main>
    );
}

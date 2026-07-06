import React from 'react';
import { MaterialViewer } from './MaterialViewer';
import { mockSNaraiDeck } from '@/lib/marketing/mock-snarai-deck';

export default function MaterialPage({ params }: { params: { slug: string, materialSlug: string } }) {
    // In the future, this will fetch from the DB: 
    // const material = await db.query.projectMarketingDecks.findFirst(...)
    
    // For now, inject S'Narai info as requested
    const deck = mockSNaraiDeck;

    return (
        <main className="w-full min-h-screen bg-black">
            <MaterialViewer deck={deck} projectSlug={params.slug} />
        </main>
    );
}

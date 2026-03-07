'use client';

import { useState, useEffect } from 'react';
import { DocsNavbar } from './DocsNavbar';
import { DocsSidebar } from './DocsSidebar';
import { DocsContent } from './DocsContent';
import { DocsSearch } from './DocsSearch';
import { docsData } from '@/lib/docs-data';
import { ChevronRight, List } from 'lucide-react';

export function DocsLayout() {
    const [activeCategoryId, setActiveCategoryId] = useState('getting-started');
    const [activeSectionId, setActiveSectionId] = useState('introduction');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Handle hash on load if any
        if (window.location.hash) {
            const hash = window.location.hash.replace('#', '');
            // Try to find section with this id
            docsData.forEach(cat => {
                cat.sections.forEach(sec => {
                    if (sec.id === hash) {
                        setActiveCategoryId(cat.id);
                        setActiveSectionId(sec.id);
                    }
                });
            });
        }
    }, []);

    const handleSectionChange = (catId: string, secId: string) => {
        setActiveCategoryId(catId);
        setActiveSectionId(secId);
        // Update hash for deep linking
        window.location.hash = secId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const currentCategory = docsData.find(c => c.id === activeCategoryId);
    const currentSection = currentCategory?.sections.find(s => s.id === activeSectionId);

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            <DocsNavbar />

            <div className="max-w-screen-2xl mx-auto w-full flex-grow flex">
                {/* Left Panel: Navigation */}
                <DocsSidebar
                    activeSection={`${activeCategoryId}-${activeSectionId}`}
                    onSectionChange={handleSectionChange}
                />

                {/* Center Panel: Content */}
                <main className="flex-grow min-w-0 bg-zinc-950">
                    <div className="max-w-4xl mx-auto">
                        {/* Breadcrumbs */}
                        <div className="px-6 lg:px-10 pt-8 flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                            <span>{currentCategory?.title}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-gray-300">{currentSection?.title}</span>
                        </div>

                        {currentSection ? (
                            <DocsContent title={currentSection.title} content={currentSection.content} />
                        ) : (
                            <div className="p-20 text-center text-gray-500">
                                Document not found.
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Panel: Search & In-Page Navigation (Desktop) */}
                <aside className="hidden xl:block w-72 bg-zinc-950 border-l border-zinc-900 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                    <div className="p-8 space-y-8">
                        <DocsSearch onSelect={handleSectionChange} />

                        {/* Table of Contents (Simplified) */}
                        <div>
                            <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <List className="w-3 h-3" />
                                On this page
                            </h5>
                            <nav className="space-y-3">
                                {currentSection?.content.match(/^## (.*$)/gm)?.map((header, i) => {
                                    const title = header.replace('## ', '');
                                    return (
                                        <a
                                            key={i}
                                            href={`#${title.toLowerCase().replace(/[^\w]/g, '-')}`}
                                            className="block text-xs text-gray-400 hover:text-white transition-colors border-l border-zinc-800 pl-4 py-0.5 hover:border-lime-400"
                                        >
                                            {title}
                                        </a>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Support Box */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <h6 className="text-white font-bold text-xs mb-2">Need Help?</h6>
                            <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                                Can't find what you're looking for? Reach out to our community.
                            </p>
                            <a
                                href="https://pandoras.finance"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-lime-400 font-bold hover:underline flex items-center gap-1"
                            >
                                Go to official site
                                <ChevronRight className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

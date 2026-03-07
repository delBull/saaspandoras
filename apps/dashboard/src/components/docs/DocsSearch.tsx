'use client';

import { useState, useMemo } from 'react';
import { Search, X, ChevronRight, FileText } from 'lucide-react';
import Fuse from 'fuse.js';
import { docsData, type DocCategory, type DocSection } from '@/lib/docs-data';

interface SearchResult {
    categoryTitle: string;
    categoryId: string;
    sectionId: string;
    sectionTitle: string;
    snippet: string;
}

interface DocsSearchProps {
    onSelect: (categoryId: string, sectionId: string) => void;
}

export function DocsSearch({ onSelect }: DocsSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Flatten data for Fuse
    const searchEntries = useMemo(() => {
        const entries: { categoryId: string; categoryTitle: string; sectionId: string; sectionTitle: string; content: string }[] = [];
        docsData.forEach(category => {
            category.sections.forEach(section => {
                entries.push({
                    categoryId: category.id,
                    categoryTitle: category.title,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    content: section.content
                });
            });
        });
        return entries;
    }, []);

    const fuse = useMemo(() => new Fuse(searchEntries, {
        keys: ['sectionTitle', 'content', 'categoryTitle'],
        threshold: 0.3,
        includeMatches: true,
        minMatchCharLength: 2
    }), [searchEntries]);

    const results = useMemo(() => {
        if (!query) return [];
        return fuse.search(query).slice(0, 8).map(result => ({
            categoryTitle: result.item.categoryTitle,
            categoryId: result.item.categoryId,
            sectionId: result.item.sectionId,
            sectionTitle: result.item.sectionTitle,
            snippet: result.item.content.substring(0, 100) + '...'
        }));
    }, [query, fuse]);

    return (
        <div className="relative">
            {/* Search Input */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-lime-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Search documentation..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all shadow-lg"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                        <X className="w-4 h-4 text-gray-500 hover:text-white" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && query && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                        onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setIsOpen(false); }}
                        role="button"
                        tabIndex={0}
                        aria-label="Close search"
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-20 overflow-hidden max-h-[400px] overflow-y-auto">
                        {results.length > 0 ? (
                            <div className="py-2">
                                <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-zinc-800 mb-2">
                                    Search Results
                                </div>
                                {results.map((result, idx) => (
                                    <button
                                        key={`${result.categoryId}-${result.sectionId}-${idx}`}
                                        onClick={() => {
                                            onSelect(result.categoryId, result.sectionId);
                                            setIsOpen(false);
                                            setQuery('');
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors group flex items-start gap-3"
                                    >
                                        <div className="bg-zinc-800 group-hover:bg-zinc-700 p-2 rounded-lg border border-zinc-700 mt-0.5">
                                            <FileText className="w-4 h-4 text-lime-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                <span>{result.categoryTitle}</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </div>
                                            <div className="text-sm font-semibold text-white group-hover:text-lime-400 transition-colors">
                                                {result.sectionTitle}
                                            </div>
                                            <div className="text-xs text-gray-400 line-clamp-1 mt-1 font-mono">
                                                {result.snippet}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-10 text-center">
                                <div className="flex justify-center mb-3">
                                    <Search className="w-10 h-10 text-zinc-700" />
                                </div>
                                <div className="text-gray-400 text-sm font-medium">No results for "{query}"</div>
                                <div className="text-gray-500 text-xs mt-1">Try another keyword or phrase.</div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

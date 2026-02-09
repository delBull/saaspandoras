'use client';

import { useState } from 'react';
import { docsData } from '@/lib/docs-data';
import { BookOpen, Search, ChevronRight, Menu, X } from 'lucide-react';

interface DocsSidebarProps {
    activeSection: string;
    onSectionChange: (categoryId: string, sectionId: string) => void;
}

// Icon mapping
const iconMap: Record<string, any> = {
    'Rocket': () => <span className="text-xl">🚀</span>,
    'Zap': () => <span className="text-xl">⚡</span>,
    'Shield': () => <span className="text-xl">🛡️</span>,
    'FileText': () => <span className="text-xl">📄</span>,
    'Eye': () => <span className="text-xl">👁️</span>,
    'Code': () => <span className="text-xl">💻</span>,
};

export function DocsSidebar({ activeSection, onSectionChange }: DocsSidebarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(docsData.map(cat => cat.id))
    );

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const sidebarContent = (
        <nav className="space-y-1">
            {docsData.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                const Icon = iconMap[category.icon] || BookOpen;

                return (
                    <div key={category.id} className="mb-3">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <span>{category.title}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Category Sections */}
                        {isExpanded && (
                            <div className="ml-6 mt-1 space-y-1">
                                {category.sections.map((section) => {
                                    const isActive = activeSection === `${category.id}-${section.id}`;

                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => {
                                                onSectionChange(category.id, section.id);
                                                setMobileMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${isActive
                                                    ? 'text-lime-400 bg-lime-400/10 font-medium border-l-2 border-lime-400'
                                                    : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                                                }`}
                                        >
                                            {section.title}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 rounded-lg text-white"
            >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 overflow-y-auto z-40 transition-transform lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6">
                    {/* Logo/Title */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 text-white font-bold text-lg">
                            <BookOpen className="w-6 h-6 text-lime-400" />
                            Documentation
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Pandora's Platform</p>
                    </div>

                    {sidebarContent}
                </div>
            </aside>
        </>
    );
}

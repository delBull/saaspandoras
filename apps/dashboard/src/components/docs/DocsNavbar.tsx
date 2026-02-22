'use client';

import Link from 'next/link';
import { Home, ExternalLink, BookOpen } from 'lucide-react';

export function DocsNavbar() {
    return (
        <nav className="sticky top-0 z-30 w-full bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
            <div className="max-w-screen-2xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>

                        <div className="h-4 w-px bg-zinc-700" />

                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-lime-400" />
                            <span className="text-white font-semibold">Whitepaper</span>
                        </div>
                    </div>

                    {/* Right: External Link */}
                    <Link
                        href="https://pandoras.finance"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-lime-400 hover:bg-lime-500 text-black rounded-lg transition-colors text-sm font-medium"
                    >
                        <span>Official Website</span>
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </nav>
    );
}

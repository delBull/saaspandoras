'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface DocsContentProps {
    title: string;
    content: string;
}

export function DocsContent({ title, content }: DocsContentProps) {
    return (
        <div className="max-w-4xl mx-auto py-10 px-6 lg:px-10">
            <article className="prose prose-invert prose-zinc max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-2 prose-a:text-lime-400 prose-code:text-lime-300 prose-pre:bg-zinc-800/50 prose-pre:border prose-pre:border-zinc-700 prose-img:rounded-xl">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                        h1: ({ node, ...props }) => <h1 className="text-4xl font-bold mb-8 scroll-mt-24" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-12 mb-4 border-b border-zinc-800 pb-2 scroll-mt-24" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-8 mb-4 scroll-mt-24" {...props} />,
                        p: ({ node, ...props }) => <p className="text-gray-300 leading-relaxed mb-4" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4 text-gray-300" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-300" {...props} />,
                        li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                        code: ({ node, inline, className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <div className="relative group">
                                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(String(children))}
                                            className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded border border-zinc-600"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <pre className={className} {...props}>
                                        <code className={className}>{children}</code>
                                    </pre>
                                </div>
                            ) : (
                                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-lime-300 text-sm font-mono" {...props}>
                                    {children}
                                </code>
                            );
                        },
                        table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-8 border border-zinc-800 rounded-xl">
                                <table className="w-full text-sm text-left text-gray-300" {...props} />
                            </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="text-xs uppercase bg-zinc-800 text-gray-400" {...props} />,
                        th: ({ node, ...props }) => <th className="px-6 py-3 font-bold" {...props} />,
                        td: ({ node, ...props }) => <td className="px-6 py-4 border-t border-zinc-800" {...props} />,
                        blockquote: ({ node, ...props }: any) => (
                            <div className="border-l-4 border-lime-400 bg-lime-400/5 p-4 my-6 rounded-r-lg italic text-gray-300">
                                {props.children}
                            </div>
                        ),
                    }}
                >
                    {content}
                </ReactMarkdown>
            </article>

            {/* Footer Navigation (Optional) */}
            <div className="mt-20 pt-10 border-t border-zinc-800 flex justify-between items-center text-sm">
                <span className="text-gray-500">© 2026 Pandora's Platform Documentation</span>
                <div className="flex gap-4">
                    <a href="https://pandoras.finance" className="text-gray-400 hover:text-white transition-colors">Official Site</a>
                    <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a>
                </div>
            </div>
        </div>
    );
}

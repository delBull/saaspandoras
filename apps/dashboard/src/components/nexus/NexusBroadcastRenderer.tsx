'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface NexusBroadcastRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses and formats broadcast text with:
 * - Line breaks and paragraph spacing (\n\n)
 * - Markdown links [title](url)
 * - Raw URLs (https://...)
 * - Native emojis
 */
export function NexusBroadcastRenderer({ content, className = '' }: NexusBroadcastRendererProps) {
  if (!content) return null;

  // Split into paragraphs by double newlines
  const paragraphs = content.split(/\n\s*\n/);

  // Helper to render text with clickable links
  const renderFormattedText = (text: string) => {
    // Regex matching markdown links [text](url) OR raw URLs https?://...
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add preceding plain text
      if (match.index > lastIndex) {
        const plainText = text.substring(lastIndex, match.index);
        parts.push(renderLineBreaks(plainText, `text-${lastIndex}`));
      }

      if (match[1] && match[2]) {
        // Markdown link: [match[1]](match[2])
        const linkText = match[1];
        const linkUrl = match[2];
        parts.push(
          <a
            key={`md-link-${match.index}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/40 hover:decoration-purple-300 font-medium inline-flex items-center gap-0.5 transition-colors"
          >
            <span>{linkText}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-70 inline" />
          </a>
        );
      } else if (match[3]) {
        // Raw URL: match[3]
        const rawUrl = match[3];
        parts.push(
          <a
            key={`raw-link-${match.index}`}
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/40 hover:decoration-purple-300 font-medium inline-flex items-center gap-0.5 break-all transition-colors"
          >
            <span>{rawUrl}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-70 inline" />
          </a>
        );
      }

      lastIndex = linkRegex.lastIndex;
    }

    // Add remaining plain text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      parts.push(renderLineBreaks(remainingText, `text-end-${lastIndex}`));
    }

    return parts;
  };

  // Helper to split single newlines into <br />
  const renderLineBreaks = (text: string, keyPrefix: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => (
      <React.Fragment key={`${keyPrefix}-line-${idx}`}>
        {line}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className={`space-y-3 text-sm leading-relaxed text-zinc-300 ${className}`}>
      {paragraphs.map((p, idx) => (
        <p key={`p-${idx}`} className="leading-relaxed">
          {renderFormattedText(p)}
        </p>
      ))}
    </div>
  );
}

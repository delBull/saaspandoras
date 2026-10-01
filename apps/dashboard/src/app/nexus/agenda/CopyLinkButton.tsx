"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";

export function CopyLinkButton({ meetingId }: { meetingId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const link = `https://dash.pandoras.finance/meet/${meetingId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg text-xs font-mono uppercase tracking-widest transition-colors"
      title="Copiar enlace para invitados"
    >
      {copied ? <Check size={14} className="text-lime-500" /> : <LinkIcon size={14} />}
      {copied ? "Copiado" : "Link Invitados"}
    </button>
  );
}

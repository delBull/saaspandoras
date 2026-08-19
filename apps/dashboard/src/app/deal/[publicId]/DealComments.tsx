"use client";

import { useState, useEffect } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export function DealComments({
  publicId,
  sectionCode,
  rawToken,
}: {
  publicId: string;
  sectionCode: string;
  rawToken: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const fetchComments = async () => {
    try {
      const headers: any = {};
      if (rawToken) headers["Authorization"] = `Bearer ${rawToken}`;
      const res = await fetch(`/api/public/deals/${publicId}/comments?sectionCode=${sectionCode}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error("Failed to load comments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, publicId, sectionCode, rawToken]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (rawToken) headers["Authorization"] = `Bearer ${rawToken}`;
      
      const res = await fetch(`/api/public/deals/${publicId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sectionCode, content }),
      });

      if (res.ok) {
        setContent("");
        await fetchComments();
      }
    } catch (e) {
      console.error("Failed to send comment:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-2 border-t border-white/5 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-amber-300 transition-colors uppercase tracking-wider font-mono"
      >
        <MessageSquare className="w-3 h-3" />
        {comments.length > 0 ? `${comments.length} Comentarios` : "Agregar Comentario"}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 rounded-xl border border-white/10 bg-black/30 space-y-3">
              {loading ? (
                <div className="flex justify-center py-2"><Loader2 className="w-3 h-3 animate-spin text-zinc-500" /></div>
              ) : comments.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {comments.map(c => (
                    <div key={c.id} className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-[10px] font-semibold text-amber-200/80 truncate">{c.author}</span>
                        <span className="text-[9px] text-zinc-600 shrink-0">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-500 italic">No hay comentarios aún.</p>
              )}

              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un comentario..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="flex-1 bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                />
                <button
                  type="submit"
                  disabled={sending || !content.trim()}
                  className="px-2.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-50 disabled:pointer-events-none transition-colors border border-amber-500/20"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

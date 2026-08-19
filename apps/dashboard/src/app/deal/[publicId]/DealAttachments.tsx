"use client";

import { useState, useEffect } from "react";
import { Loader2, Paperclip, Upload, File as FileIcon } from "lucide-react";

interface Attachment {
  id: string;
  filename: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

export function DealAttachments({ publicId, rawToken }: { publicId: string, rawToken: string | null }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchAttachments = async () => {
    try {
      const headers: any = {};
      if (rawToken) headers["Authorization"] = `Bearer ${rawToken}`;
      const res = await fetch(`/api/public/deals/${publicId}/attachments`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments || []);
      }
    } catch (e) {
      console.error("Failed to load attachments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [publicId, rawToken]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const headers: any = {};
      if (rawToken) headers["Authorization"] = `Bearer ${rawToken}`;
      const res = await fetch(`/api/public/deals/${publicId}/attachments`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (res.ok) {
        await fetchAttachments();
      }
    } catch (e) {
      console.error("Failed to upload:", e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-[#0C0C10] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <Paperclip className="w-4 h-4 text-amber-300" />
        <h3 className="text-[13px] font-semibold text-zinc-100">Anexos y Documentos</h3>
      </div>
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /></div>
        ) : (
          <div className="space-y-2">
            {attachments.length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic text-center">No hay anexos subidos</p>
            ) : (
              attachments.map(att => (
                <div key={att.id} className="flex flex-col gap-1 p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-zinc-200 hover:text-amber-300 transition-colors">
                    <FileIcon className="w-3.5 h-3.5" />
                    <span className="truncate" title={att.filename}>{att.filename}</span>
                  </a>
                  <p className="text-[9px] text-zinc-500 pl-5">Por: {att.uploadedBy} · {new Date(att.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        )}

        <div className="pt-2 border-t border-white/5">
          <label className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "SUBIENDO..." : "SUBIR ANEXO"}
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>
    </div>
  );
}

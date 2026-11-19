"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";
import { shortMeetingPath, shareOrCopyMeeting } from "@/lib/meet/meeting-links";

interface MeetingShareButtonProps {
  meetingId: string;
  /** Título del deck o "Sovereign Meet" para el texto de compartir. */
  title?: string | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
}

export function MeetingShareButton({ meetingId, title, startsAt, endsAt }: MeetingShareButtonProps) {
  const [state, setState] = useState<"idle" | "done">("idle");

  const handleShare = async () => {
    const url = `${window.location.origin}${shortMeetingPath(meetingId)}`;
    const result = await shareOrCopyMeeting({ title, startsAt, endsAt, url });
    if (result === "failed") return;
    setState("done");
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg text-xs font-mono uppercase tracking-widest transition-colors"
      title="Compartir enlace con día y hora"
    >
      {state === "done" ? <Check size={14} className="text-lime-500" /> : <LinkIcon size={14} />}
      {state === "done" ? "Listo" : "Compartir"}
    </button>
  );
}

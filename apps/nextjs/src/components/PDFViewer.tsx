import React from 'react';
import { Add } from "@saasfly/ui/icons";

interface PDFViewerProps {
  pdfUrl: string | null | undefined;
  title: string;
}

export function PDFViewer({ pdfUrl, title }: PDFViewerProps) {
  if (!pdfUrl) {
    return (
      <div className="w-full h-[800px] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
          No PDF available
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
        <a
          href={pdfUrl}
          download
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all"
        >
          <Add className="w-4 h-4" />
          <span>Download PDF</span>
        </a>
      </div>
      <div className="w-full h-[800px] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <iframe
          src={`${pdfUrl}#view=FitH`}
          className="w-full h-full"
          title={title}
        />
      </div>
    </div>
  );
}
"use client";

import React from 'react';
import { Add } from "@saasfly/ui/icons";

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
}

export function PDFViewer({ pdfUrl, title }: PDFViewerProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
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
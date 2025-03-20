import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PDFViewer } from "./PDFViewer";

interface ConstructionTab {
    id: string;
    title: string;
    content: string;
    pdfUrl?: string;
  }

interface ConstructionDashboardProps {
  tabs: ConstructionTab[];
}

export function ConstructionDashboard({ tabs }: ConstructionDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? '');

  return (
    <div className="grid grid-cols-12 gap-6 bg-neutral-100/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
      {/* Sidebar with tabs */}
      <div className="col-span-3 space-y-2">
        {tabs.map((tab: ConstructionTab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-neutral-800 shadow-md"
                : "hover:bg-white/50 dark:hover:bg-neutral-800/50"
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="font-medium">{tab.title}</span>
          </motion.button>
        ))}
      </div>

      {/* Content area */}
      <div className="col-span-9">
        <AnimatePresence mode="wait">
          {tabs.map((tab: ConstructionTab) => {
            if (tab.id !== activeTab) return null;
            return (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  {tab.content}
                </p>
                <PDFViewer 
                  pdfUrl={tab.pdfUrl ?? null} 
                  title={tab.title} 
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PDFViewer } from "./PDFViewer";
import { ChevronDown } from "@saasfly/ui/icons";

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
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mobile: Show only first tab, rest go to dropdown
  const visibleTabs = tabs.slice(0, 1);
  const dropdownTabs = tabs.slice(1);

  return (
    <div className="flex flex-col sm:flex-row gap-6 bg-neutral-100/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800">
      {/* Mobile Tabs - Only visible on small screens */}
      <div className="sm:hidden flex flex-row w-full gap-2">
        {visibleTabs.map((tab: ConstructionTab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors text-sm ${
              activeTab === tab.id
                ? "bg-white dark:bg-neutral-800 shadow-md"
                : "hover:bg-white/50 dark:hover:bg-neutral-800/50"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <span className="font-medium truncate">{tab.title}</span>
          </motion.button>
        ))}

        {/* Mobile dropdown */}
        <div className="relative flex-1">
          <motion.button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-800/10 dark:hover:bg-neutral-800/20"
            whileTap={{ scale: 0.98 }}
          >
            <span className="font-medium text-sm absolute left-1/2 -translate-x-1/2">
              +
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden z-10"
              >
                {dropdownTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {tab.title}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop Sidebar - Only visible on larger screens */}
      <div className="hidden sm:flex flex-col w-1/4 gap-2">
        {tabs.map((tab: ConstructionTab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-left px-4 py-3 rounded-lg transition-colors ${
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
      <div className="sm:w-3/4">
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
                className="space-y-6"
              >
                <p className="text-neutral-600 dark:text-neutral-400">
                  {tab.content}
                </p>
                <PDFViewer pdfUrl={tab.pdfUrl} title={tab.title} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

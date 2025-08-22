import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdvancedLoader } from "./AdvancedLoader";

interface MintingProgressModalProps {
  step: string;
  onClose: () => void; // This will be called by AdvancedLoader on complete
  isMinting?: boolean; // Make optional
}

export function MintingProgressModal({ step, onClose, isMinting = true }: MintingProgressModalProps) { // Add default value
  const isVisible = step !== "idle" && step !== "success";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-[999]"
        >
          <div className="w-full max-w-lg p-4">
            <AdvancedLoader onComplete={onClose} isMinting={isMinting} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
'use client';

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AdvancedLoader } from "./AdvancedLoader";

interface MintingProgressModalProps {
  step: string;
  onClose: () => void;
  isMinting?: boolean;
  alreadyOwned?: boolean;
}

export function MintingProgressModal({ step, onClose, isMinting = true, alreadyOwned = false }: MintingProgressModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isVisible = step !== "idle" && step !== "success";

  const modalContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-[999]"
        >
          <div className="w-full max-w-lg p-4">
            <AdvancedLoader onComplete={onClose} isMinting={isMinting} alreadyOwned={alreadyOwned} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isMounted) {
    return ReactDOM.createPortal(modalContent, document.body);
  }

  return null;
}
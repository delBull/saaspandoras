import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MintingProgressModalProps {
  step: string;
  onClose: () => void; // Function to close the modal, if needed
}

export function MintingProgressModal({ step, onClose }: MintingProgressModalProps) {
  const getMessage = (currentStep: string) => {
    switch (currentStep) {
      case "checking_key":
        return "Checking for your Pandora's Key...";
      case "awaiting_confirmation":
        return "Awaiting transaction confirmation in your wallet...";
      case "minting":
        return "Minting your free Pandora's Key NFT...";
      case "success":
        return "Minting successful! Displaying your NFT...";
      case "error":
        return "Minting failed. Please try again.";
      default:
        return "Initializing minting process...";
    }
  };

  const isVisible = step !== "idle" && step !== "success" && step !== "error"; // Show modal during these steps

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-sm mx-auto"
          >
            <h2 className="text-xl font-semibold mb-4">Minting Progress</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{getMessage(step)}</p>
            {/* Add a simple spinner or animation here */}
            {step !== "success" && step !== "error" && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
            )}
            {step === "error" && (
              <button
                onClick={onClose} // Assuming onClose will reset the state to idle
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
              >
                Close
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

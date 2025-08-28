'use client';

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@saasfly/ui/button";

type Step = "idle" | "checking_key" | "awaiting_confirmation" | "success" | "error" | "alreadyOwned";

interface MintingProgressModalProps {
  step: Step;
  alreadyOwned: boolean;
  onClose: () => void;
}

const stepContent = {
  checking_key: {
    icon: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />,
    title: "Verifying Access",
    description: "Checking your wallet for a Pandora's Key...",
  },
  awaiting_confirmation: {
    icon: <HelpCircle className="w-12 h-12 text-yellow-500" />,
    title: "Action Required",
    description: "Please confirm the transaction in your wallet to proceed.",
  },
  success: {
    icon: <CheckCircle className="w-12 h-12 text-green-500" />,
    title: "Verification Complete",
    description: "You can now access the platform.",
  },
  alreadyOwned: {
    icon: <CheckCircle className="w-12 h-12 text-green-500" />,
    title: "Key Found!",
    description: "Welcome back! You already have an access key.",
  },
  error: {
    icon: <XCircle className="w-12 h-12 text-red-500" />,
    title: "An Error Occurred",
    description: "Something went wrong. Please try again or contact support.",
  },
};

export function MintingProgressModal({ step, alreadyOwned, onClose }: MintingProgressModalProps) {
  const content = alreadyOwned ? stepContent.alreadyOwned : stepContent[step] || null;

  useEffect(() => {
    if (alreadyOwned) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds if key is already owned
      return () => clearTimeout(timer);
    }
  }, [alreadyOwned, onClose]);


  if (!content) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60"
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl"
        >
          <div className="flex flex-col items-center text-center">
            {content.icon}
            <h3 className="mt-4 text-xl font-semibold text-gray-900">{content.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{content.description}</p>
            {(alreadyOwned || step === 'error') && (
              <Button onClick={onClose} className="mt-6">
                {alreadyOwned ? 'Continue' : 'Close'}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

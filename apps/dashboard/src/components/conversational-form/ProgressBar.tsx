"use client";
import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full bg-zinc-700 rounded-full h-2 mb-8 overflow-hidden">
      <motion.div
        className="bg-gradient-to-r from-lime-400 to-emerald-400 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}
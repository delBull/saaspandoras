"use client";

import { motion } from "framer-motion";
import { cn } from "@saasfly/ui";
import { Shadows_Into_Light } from "next/font/google";

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
});

interface InvestmentStep {
  title: string;
  content: string;
  caption: string;
}

interface InvestmentStepsDict {
  title: string;
  steps: InvestmentStep[];
}

interface InvestmentStepsProps {
  dict?: Partial<InvestmentStepsDict>;
}

export function InvestmentSteps({ dict }: InvestmentStepsProps) {
  if (!dict?.steps?.length) return null;

  return (
    <div className="relative w-full py-20">
      {/* Title */}
      <div className="mb-16 flex items-center gap-4">
        <motion.h2
          initial={{ opacity: 0, x: 20, rotate: -3 }}
          whileInView={{ opacity: 1, x: 0 }}
          className={cn(
            shadowsIntoLight.className,
            "text-4xl sm:text-5xl text-neutral-800 dark:text-neutral-200",
          )}
        >
          {dict?.title}
        </motion.h2>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          transition={{ delay: 0.2 }}
          className="h-[2px] bg-gradient-to-r from-lime-300 to-transparent"
        />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {dict.steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Step number */}
            <div
              className={cn(
                shadowsIntoLight.className,
                "absolute -left-4 -top-16 text-9xl text-lime-300/20 transform -rotate-6",
              )}
              style={{
                WebkitTextStroke: "8px rgba(163, 230, 53, 0.2)",
              }}
            >
              {index + 1}
            </div>

            {/* Content */}
            <div className="relative z-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-6">
              <h3 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
                {step.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed md:pb-0 pb-20">
                {step.content}
              </p>
            </div>

            {/* Caption */}
            <motion.div
              initial={{ rotate: -2 }}
              whileHover={{ rotate: 3 }}
              className={cn(
                shadowsIntoLight.className,
                "absolute inset-x-0 md:-mt-4 -mt-20 md:text-3xl text-2xl text-neutral-700 dark:text-neutral-300 -ml-3 z-10",
              )}
            >
              {step.caption}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

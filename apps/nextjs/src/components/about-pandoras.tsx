"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export function AboutPandoras({ dict }: { dict: any }) {
  return (
    <section className="container mx-auto py-16">
      <div
        className="relative p-8 rounded-xl shadow-lg max-w-5xl mx-auto"
        style={{
          background: "linear-gradient(to bottom right, rgba(123, 27, 116, 0.8), rgba(180, 80, 170, 0.2))",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "2px solid rgba(255,255,255,0.3)",
        }}
      >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="absolute top-0 left-0 -mt-[20rem] md:-mt-[22rem] md:-ml-20 z-10"
          >
            <Image
              src="/images/onlybox2.png"
              alt="Pandora's Key"
              width={800}
              height={800}
              className="hidden md:block rounded-lg object-cover w-full md:w-2/3 h-auto"
            />
          </motion.div>
        {/* First Row */}
        <div className="flex justify-end">
          <div className="flex flex-col md:flex-row items-right text-right md:items-start w-full md:w-2/4 gap-4">
            <h2 className="text-5xl font-bold mb-4 font-mono">
              {dict.problem_we_solve.title}
            </h2>
            <ul className="text-xl text-neutral-600 dark:text-neutral-300 inline-block text-right md:text-left">
              <li >
                <p>{dict.problem_we_solve.problem_1}</p>
              </li>
              <li >
                <p>{dict.problem_we_solve.problem_2}</p>
              </li>
              <li >
                <p>{dict.problem_we_solve.problem_3}</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Second Row: The Problem We Solve (centered) */}
        <div className="text-center mt-12">
          <div className="flex flex-col justify-center text-left md:w-3/1 md:pl-8">
            <h2 className="text-4xl font-bold mb-4 font-mono tracking-tighter">
              {dict.what_is_pandoras.title}
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6 md:w-3/1">
              {dict.what_is_pandoras.description}
            </p>
            {/*
            <div className="space-y-4">
              <div className="flex items-center">
                <Icons.Check className="w-6 h-6 mr-2 text-green-500" />
                <span className="max-w-prose">{dict.what_is_pandoras.feature_1}</span>
              </div>
              <div className="flex items-center">
                <Icons.Check className="w-6 h-6 mr-2 text-green-500" />
                <span className="max-w-prose">{dict.what_is_pandoras.feature_2}</span>
              </div>
              <div className="flex items-center">
                <Icons.Check className="w-6 h-6 mr-2 text-green-500" />
                <span className="max-w-prose">{dict.what_is_pandoras.feature_3}</span>
              </div>
            </div>
            */}
          </div>
        </div>
      </div>
    </section>
  );
}

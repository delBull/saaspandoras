"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  setIsOpen: () => void;
  isFirst: boolean;
  isThird: boolean;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, setIsOpen, isFirst, isThird }) => {
  return (
    <div className="w-full">
      <div className="flex items-start gap-3 cursor-pointer" onClick={setIsOpen}>
        <div className="relative w-fit max-w-[80%] group">
          <div className={`bg-gray-200 dark:bg-gray-800 p-3 rounded-2xl`}>
            <p className={`font-mono font-medium transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>{question}</p>
          </div>
          {isThird && <span className="absolute -top-0 -left-3 text-2xl transform -rotate-12">⭐</span>}
          {isFirst && <span className="absolute -top-3 -right-2 text-2xl transform rotate-[30deg]">❤️</span>}
        </div>
        <div 
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
          {isOpen ? <Minus size={16} className="text-white" /> : <Plus size={16} className="text-gray-800 dark:text-white" />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex justify-end mt-2"
          >
            <div className="relative w-fit max-w-[80%]">
              <div className="bg-blue-600 text-white p-3 rounded-2xl">
                <p>{answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FaqSectionProps {
  dict: {
    title: string;
    faqs: {
      question: string;
      answer: string;
    }[];
  };
}

export const FaqSection: React.FC<FaqSectionProps> = ({ dict }) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }));
  }, []);

  const handleToggle = (index: number) => {
    setOpenIndexes(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) // Close question
        : [...prev, index] // Open question
    );
  };

  return (
    <section id="faq" className="container py-16 md:py-24 bg-black">
      <div className="mx-auto flex max-w-md md:max-w-2xl flex-col items-start gap-4">
        {currentTime && <p className="text-md font-mono text-gray-500 text-left mb-0">From FAQ Planet, {currentTime}</p>}
        {dict.faqs.map((faq, index) => (
          <FaqItem 
            key={index} 
            question={faq.question} 
            answer={faq.answer} 
            isOpen={openIndexes.includes(index)}
            setIsOpen={() => handleToggle(index)}
            isFirst={index === 0}
            isThird={index === 2}
          />
        ))}
      </div>
    </section>
  );
};
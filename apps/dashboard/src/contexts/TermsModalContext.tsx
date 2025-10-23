"use client";

import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface TermsModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const TermsModalContext = createContext<TermsModalContextType | undefined>(undefined);

export function TermsModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <TermsModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </TermsModalContext.Provider>
  );
}

export function useTermsModal() {
  const context = useContext(TermsModalContext);
  if (context === undefined) {
    throw new Error("useTermsModal must be used within a TermsModalProvider");
  }
  return context;
}
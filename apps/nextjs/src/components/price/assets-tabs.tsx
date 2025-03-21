"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@saasfly/ui";
import { useToast } from "@saasfly/ui/use-toast";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Locale } from "~/config/i18n-config";

interface AssetTabsProps {
  lang: Locale;
  dict: {
    real_estate: string;
    startups: string;
    others: string;
    coming_soon: string;
  };
}

type TabId = "real-estate" | "startups" | "others";

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}

function TabButton({ isActive, onClick, disabled, children }: TabButtonProps) {
  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative px-4 py-2 text-sm font-medium transition-colors",
        isActive 
          ? "text-black dark:text-lime-300" 
          : disabled 
            ? "text-neutral-400 dark:text-neutral-600 cursor-default"
            : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-300"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-lime-300 opacity-50"
          transition={{ type: "spring", duration: 0.5 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );

if (disabled) {
  return (
    <Tooltip.Provider delayDuration={50}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {button}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 rounded-md bg-neutral-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95 shadow-md"
            sideOffset={5}
            side="top"
            align="center"
            avoidCollisions
          >
            Coming Soon
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

return button;
}

export function AssetTabs({ dict }: AssetTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("real-estate");
  const { toast } = useToast();

  if (!dict) {
    console.error("Dictionary not provided to AssetTabs");
    return null;
  }

  const handleTabClick = (tabId: TabId) => {
    if (tabId !== "real-estate") {
      toast({
        description: dict.coming_soon,
        duration: 2000,
      });
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <div className="w-full bg-background">
      <div className="container mx-auto px-4">
        <nav className="flex items-center h-14 gap-4" aria-label="Asset categories">
          <TabButton
            isActive={activeTab === "real-estate"}
            onClick={() => handleTabClick("real-estate")}
            disabled={false}
          >
            {dict.real_estate}
          </TabButton>
          
          <TabButton
            isActive={false}
            onClick={() => handleTabClick("startups")}
            disabled={true}
          >
            {dict.startups}
          </TabButton>
          
          <TabButton
            isActive={false}
            onClick={() => handleTabClick("others")}
            disabled={true}
          >
            {dict.others}
          </TabButton>
        </nav>
      </div>
    </div>
  );
}
"use client"

import { useState } from "react"
import * as Icons from "@saasfly/ui/icons";

export function CodeCopy() {
  const [copied, setCopied] = useState(false)
  const command = "Fortune favors the bold"

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <div className="rounded-full h-12 px-3 flex items-center justify-between w-full max-w-[280px] sm:max-w-xl bg-neutral-200 dark:bg-neutral-700/40">
      <div className="flex items-center space-x-2 font-mono text-neutral-700 dark:text-neutral-300 overflow-hidden">
        <span className="flex-shrink-0">$</span>
        <span className="truncate text-xs sm:text-base">{command}</span>
      </div>
      <button
        onClick={copyToClipboard}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-md transition-colors ml-2 flex-shrink-0"
        aria-label="Copy to clipboard"
      >
        {copied ? <Icons.Check className="w-4 h-4 text-neutral-700 dark:text-neutral-300" /> : <Icons.Copy className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />}
      </button>
    </div>
  )
}
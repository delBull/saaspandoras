"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@saasfly/ui/button";

interface TransformTokenDetailsProps {
  dict: {
    title: string;
    desc: string;
    more_details?: string;
    close?: string;
    part1_title?: string;
    part1_content?: string;
    part2_title?: string;
    part2_content?: string;
  };
}

export function TransformTokenDetails({ dict }: TransformTokenDetailsProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button 
          className="bg-gradient-to-r from-lime-300 to-lime-200 hover:from-lime-500 hover:to-lime-400 text-black rounded-full text-lg px-8 h-12 font-medium"
        >
          {dict.more_details ?? "More Details"}
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white dark:bg-neutral-900 p-8 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <div className="space-y-8">
            <div>
              <Dialog.Title className="text-2xl font-bold mb-4 dark:text-white">
                {dict.part1_title ?? dict.title}
              </Dialog.Title>
              <Dialog.Description className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {dict.part1_content ?? dict.desc}
              </Dialog.Description>
            </div>
            
            {dict.part2_title && dict.part2_content && (
              <div>
                <Dialog.Title className="text-2xl font-bold mb-4 dark:text-white">
                  {dict.part2_title}
                </Dialog.Title>
                <Dialog.Description className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {dict.part2_content}
                </Dialog.Description>
              </div>
            )}
          </div>
          
          <Dialog.Close asChild>
            <button
              className="absolute right-6 top-6 rounded-full p-2.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              aria-label={dict.close ?? "Close"}
            >
              <Cross2Icon className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
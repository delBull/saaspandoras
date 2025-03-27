'use client'

import { Button } from "@saasfly/ui/button"
import * as Icons from "@saasfly/ui/icons"

interface ScrollButtonProps {
  text: string
}

export function ScrollButton({ text }: ScrollButtonProps) {
  return (
    <Button
      onClick={() => {
        document.querySelector('#investment-steps')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }}
      className="bg-lime-300 hover:bg-lime-500 text-black rounded-full text-lg px-6 h-12 font-medium"
    >
      {text}
      <Icons.ArrowRight className="h-5 w-5"/>
    </Button>
  )
}
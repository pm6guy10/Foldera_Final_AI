'use client'

import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <Toaster />
      {children}
    </TooltipProvider>
  )
}

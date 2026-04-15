'use client'

import React from 'react'

interface SectionLoadingProps {
  isLoading: boolean
}

export function SectionLoading({ isLoading }: SectionLoadingProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Only show on right side - overlay section only */}
      <div className="absolute right-6 top-20 bottom-6 w-96 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
        <div className="relative w-16 h-16">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin" />
          
          {/* Middle rotating ring (slower) */}
          <div className="absolute inset-2 border-3 border-transparent border-b-cyan-400 border-l-cyan-400 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-4 bg-gradient-to-br from-primary/50 to-purple-500/50 rounded-full animate-pulse" />
          
          {/* Center dot */}
          <div className="absolute inset-5 bg-primary rounded-full" />
        </div>
      </div>
    </div>
  )
}

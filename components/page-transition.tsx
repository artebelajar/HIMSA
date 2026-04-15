'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransition() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <>
      {isLoading && (
        <div className="fixed right-0 top-0 bottom-0 z-50 pointer-events-none" style={{ width: 'calc(100% - 320px)' }}>
          {/* Dark overlay - section only */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          {/* Gradient overlay with animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse" />
          
          {/* Loading indicator center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-24 h-24">
              {/* Outer rotating ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-300"
                style={{
                  animation: 'spin 2s linear infinite',
                  boxShadow: '0 0 20px rgba(0, 217, 255, 0.5)',
                }}
              />
              
              {/* Middle rotating ring */}
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-400 border-l-purple-300"
                style={{
                  animation: 'spin 3s linear infinite reverse',
                  boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
                }}
              />
              
              {/* Inner pulsing circle */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-r from-cyan-400/50 to-purple-400/50 animate-pulse" />
              
              {/* Center dot */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
            </div>
          </div>

          {/* Horizontal scan line effect */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                rgba(0, 217, 255, 0.03) 0px,
                rgba(0, 217, 255, 0.03) 1px,
                transparent 1px,
                transparent 2px
              )`,
              animation: 'scan 8s linear infinite',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </>
  )
}

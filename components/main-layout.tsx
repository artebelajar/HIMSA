"use client"

import React, { useState } from 'react'
import { Sidebar } from './sidebar'
import { useApp } from '@/providers/app-provider'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useApp()
  const pathname = usePathname()

  const isAuthPage = pathname?.startsWith('/auth')
  
  if (isAuthPage || !user) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <main
        className={cn(
          'flex-1 transition-all duration-300 p-6',
          sidebarCollapsed ? 'ml-20' : 'ml-72'
        )}
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
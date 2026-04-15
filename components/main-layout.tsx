'use client'

import React, { useState } from 'react'
import { Sidebar } from './sidebar'
import { useApp } from '@/providers/app-provider'
import { usePathname } from 'next/navigation'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useApp()
  const pathname = usePathname()

  // Jangan tampilkan layout jika user tidak login
  if (pathname === '/auth' || pathname === '/auth/login' || pathname === '/auth/register' || !user) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen relative">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-28' : 'ml-80'} overflow-y-auto`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

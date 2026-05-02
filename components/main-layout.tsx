"'use client"

import React, { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { useApp } from '@/providers/app-provider'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function MainLayout({ children }: { children: React.ReactNode }) {
  // Ambil dari localStorage saat pertama load
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true'
    }
    return false
  })
  
  const { user } = useApp()
  const pathname = usePathname()

  // Simpan ke localStorage setiap kali berubah
  const handleCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
    localStorage.setItem('sidebar_collapsed', String(collapsed))
  }

  const isAuthPage = pathname?.startsWith('/auth')
  
  if (isAuthPage || !user) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={handleCollapsedChange} />
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
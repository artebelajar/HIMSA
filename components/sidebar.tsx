"'use client"

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home, Upload, MessageSquare, Info, FileText, Settings, LogOut,
  ChevronRight, Volume2, VolumeX, Calendar, Users, Wallet, Utensils, Moon,
  LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useApp } from '@/providers/app-provider'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, backSoundEnabled, setBackSoundEnabled, canUploadContent } = useApp()

  const handleToggleBackSound = () => {
    setBackSoundEnabled(!backSoundEnabled)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const getAvatarUrl = (avatar: string | null, name: string) => {
    if (avatar) return avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
  }

  const menuItems = [
    ...(user?.role === 'admin' ? [{ icon: LayoutDashboard, label: 'Admin Dashboard', href: '/admin/dashboard' }] : []),
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Calendar, label: 'Kalender', href: '/schedule' },
    { icon: Users, label: 'Absensi', href: '/absensi' },
    { icon: Wallet, label: 'Keuangan', href: '/keuangan' },
    { icon: Utensils, label: 'Kesejahteraan', href: '/kesejahteraan' },
    { icon: Moon, label: 'Dakwah', href: '/dakwah' },
    ...(canUploadContent ? [{ icon: Upload, label: 'Upload', href: '/upload' }] : []),
    { icon: MessageSquare, label: 'Ruang Obrolan', href: '/chat' },
    { icon: FileText, label: 'Proker', href: '/proker' },
    { icon: Settings, label: 'Pengaturan', href: '/setting' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div
      className={cn(
        'fixed top-4 left-4 bottom-4 backdrop-blur-md border border-white/20 bg-sidebar/90 shadow-2xl transition-all duration-300 z-40 rounded-2xl',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      <div className="flex flex-col h-full p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="font-orbitron text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                HIMSA
              </h1>
              <p className="text-[10px] text-muted-foreground">Himpunan Santri Almahir</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn('h-8 w-8 hover:bg-primary/20', collapsed && 'mx-auto')}
          >
            <ChevronRight className={cn('h-5 w-5 transition-transform duration-300', collapsed ? '' : 'rotate-180')} />
          </Button>
        </div>

        {/* User Info dengan Avatar */}
        {user && (
          <div className={cn(
            "mb-6 p-3 bg-primary/10 rounded-lg border border-primary/20",
            collapsed && "flex justify-center p-2"
          )}>
            {collapsed ? (
              <Avatar className="h-10 w-10 border-2 border-primary/50">
                <AvatarImage src={getAvatarUrl(user.avatar || null, user.name)} />
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/50 flex-shrink-0">
                  <AvatarImage src={getAvatarUrl(user.avatar || null, user.name)} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  {user.currentDivision && (
                    <p className="text-xs text-accent mt-0.5 truncate">Mode: {user.currentDivision}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    collapsed && 'justify-center px-0',
                    active && 'bg-primary text-primary-foreground'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="space-y-1 border-t border-sidebar-border pt-4 mt-2">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start',
              collapsed && 'justify-center px-0',
              backSoundEnabled && 'bg-primary/20'
            )}
            onClick={handleToggleBackSound}
            title={collapsed ? (backSoundEnabled ? 'Matikan musik' : 'Nyalakan musik') : undefined}
          >
            {backSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {!collapsed && (
              <span className="ml-3 text-xs">{backSoundEnabled ? 'Nasyid ON' : 'Nasyid OFF'}</span>
            )}
          </Button>

          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start text-destructive hover:text-destructive',
              collapsed && 'justify-center px-0'
            )}
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}
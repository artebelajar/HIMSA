'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home,
  Upload,
  MessageSquare,
  Info,
  FileText,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Volume2,
  VolumeX,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/providers/app-provider'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

const DIVISIONS = [
  'Kebersihan',
  'Kesehatan',
  'Keamanan',
  'Kesejahteraan',
  'Olahraga',
  'Dakwah',
  'Bahasa',
  'Wakil',
  'Ketua',
]

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, backSoundEnabled, setBackSoundEnabled } = useApp()
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [oscillatorRef, setOscillatorRef] = useState<OscillatorNode | null>(null)

  useEffect(() => {
    if (backSoundEnabled && !audioContext) {
      // Initialize Web Audio API
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        setAudioContext(context)

        // Create gentle ambient sound
        const osc = context.createOscillator()
        const gain = context.createGain()

        osc.frequency.value = 110 // A2 frequency
        osc.type = 'sine'
        gain.gain.value = 0.05 // Very low volume for ambient

        osc.connect(gain)
        gain.connect(context.destination)

        osc.start()
        setOscillatorRef(osc)
      } catch (e) {
        console.error('Audio context error:', e)
      }
    } else if (!backSoundEnabled && audioContext) {
      // Stop and cleanup
      if (oscillatorRef) {
        try {
          oscillatorRef.stop()
        } catch (e) {
          // Already stopped
        }
      }
      try {
        audioContext.close()
      } catch (e) {
        // Already closed
      }
      setAudioContext(null)
      setOscillatorRef(null)
    }
  }, [backSoundEnabled])

  const handleToggleBackSound = () => {
    setBackSoundEnabled(!backSoundEnabled)
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Calendar, label: 'Jadwal', href: '/schedule' },
    ...(user?.role !== 'user'
      ? [{ icon: Upload, label: 'Upload', href: '/upload' }]
      : []),
    { icon: MessageSquare, label: 'Chat', href: '/chat' },
    { icon: Info, label: 'Tentang Kami', href: '/about' },
    { icon: FileText, label: 'Proposal', href: '/proposal' },
    { icon: Settings, label: 'Pengaturan', href: '/settings' },
  ]

  const isActive = (href: string) => pathname === href

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <div
      className={cn(
        'fixed left-4 top-4 h-[calc(100vh-2rem)] rounded-xl backdrop-blur-md border border-white/20 bg-sidebar shadow-2xl transition-all duration-300 z-40',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="font-semibold text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">HIMSA</h1>
              <p className="text-xs text-muted-foreground">Santri Almahir</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(!collapsed)}
            className="h-8 w-8 hover:bg-primary/20"
          >
            <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
          </Button>
        </div>

        {/* User Info */}
        {!collapsed && user && (
          <div className="mb-6 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-semibold text-primary">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            {user.division && (
              <p className="text-xs text-accent mt-1">{user.division}</p>
            )}
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    active && 'bg-primary text-primary-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="space-y-2 border-t border-sidebar-border pt-4">
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            onClick={handleToggleBackSound}
            className={cn(
              'w-full justify-start',
              backSoundEnabled && 'bg-primary/20'
            )}
            title={backSoundEnabled ? 'Matikan musik' : 'Nyalakan musik'}
          >
            {backSoundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            {!collapsed && (
              <span className="ml-3 text-xs">
                {backSoundEnabled ? 'Musik ON' : 'Musik OFF'}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}

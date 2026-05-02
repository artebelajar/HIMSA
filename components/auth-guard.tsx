"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useApp } from '@/providers/app-provider'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useApp()
  const router = useRouter()
  const pathname = usePathname()

  // Halaman yang tidak perlu login
  const publicPaths = ['/auth/login', '/auth/register']
  const isPublicPath = publicPaths.includes(pathname)

  useEffect(() => {
    if (isLoading) return // Tunggu loading selesai

    if (!user && !isPublicPath) {
      // Belum login & bukan halaman public -> redirect ke login
      router.replace('/auth/login')
    }
  }, [user, isLoading, isPublicPath, router])

  // Tampilkan loading saat mengecek auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Jika public path, selalu tampilkan
  if (isPublicPath) {
    return <>{children}</>
  }

  // Jika sudah login, tampilkan halaman
  if (user) {
    return <>{children}</>
  }

  // Fallback loading saat redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
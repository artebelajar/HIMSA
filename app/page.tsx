'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/providers/app-provider'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useApp()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-orbitron text-4xl font-bold text-primary mb-2">HIMSA</h1>
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useApp()
  const [email, setEmail] = useState('admin@himsa.com')
  const [password, setPassword] = useState('admin123')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Login berhasil!')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login gagal')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur border border-white/20">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="font-orbitron text-3xl font-bold text-primary mb-2">HIMSA</h1>
            <p className="text-muted-foreground">Login ke aplikasi Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-input/50 border-white/20"
              />
              <p className="text-xs text-muted-foreground mt-1">Demo: admin@himsa.com</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-input/50 border-white/20"
              />
              <p className="text-xs text-muted-foreground mt-1">Demo: admin123</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Sedang Login...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-sm text-muted-foreground mb-4">
              Demo Users (Password: sama dengan email tanpa @himsa.com):
            </p>
            <div className="space-y-2 text-xs bg-muted/20 p-3 rounded border border-white/10">
              <p>👤 <span className="text-primary">admin@himsa.com</span> / admin123</p>
              <p>👤 <span className="text-primary">division@himsa.com</span> / division123</p>
              <p>👤 <span className="text-primary">user@himsa.com</span> / user123</p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

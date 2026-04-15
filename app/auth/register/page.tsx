'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useApp()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Semua field harus diisi')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }

    try {
      await register(formData.name, formData.email, formData.password)
      toast.success('Register berhasil!')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Register gagal')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur border border-white/20">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="font-orbitron text-3xl font-bold text-primary mb-2">HIMSA</h1>
            <p className="text-muted-foreground">Daftar akun baru</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
              <Input
                type="text"
                name="name"
                placeholder="Masukkan nama"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className="bg-input/50 border-white/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="Masukkan email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="bg-input/50 border-white/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                name="password"
                placeholder="Masukkan password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="bg-input/50 border-white/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Konfirmasi Password</label>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className="bg-input/50 border-white/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Sedang Mendaftar...' : 'Daftar'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Login di sini
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

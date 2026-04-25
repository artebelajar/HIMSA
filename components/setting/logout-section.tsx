"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface LogoutSectionProps {
  onLogout: () => void
}

export function LogoutSection({ onLogout }: LogoutSectionProps) {
  return (
    <Card className="bg-card/50 border-white/20 p-6">
      <div className="text-center space-y-4">
        <LogOut className="h-16 w-16 text-destructive mx-auto" />
        <h3 className="text-xl font-semibold text-foreground">Keluar dari Akun</h3>
        <p className="text-muted-foreground">Anda akan keluar dari aplikasi dan perlu login kembali untuk mengakses.</p>
        <Button onClick={onLogout} className="w-full sm:w-auto px-8 bg-destructive hover:bg-destructive/90 gap-2">
          <LogOut className="h-4 w-4" /> Logout Sekarang
        </Button>
      </div>
    </Card>
  )
}
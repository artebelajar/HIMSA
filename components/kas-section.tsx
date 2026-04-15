'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApp } from '@/providers/app-provider'
import { Wallet, Check, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface KasPayment {
  id: string
  name: string
  paid: boolean
  paidDate?: string
}

const ALL_MEMBERS = Array.from({ length: 21 }, (_, i) => `Member ${i + 1}`)

export function KasSection() {
  const { user } = useApp()
  const [payments, setPayments] = useState<KasPayment[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const checkAndResetMonthly = () => {
      const saved = localStorage.getItem('himsa_kas_payments')
      const lastResetDate = localStorage.getItem('himsa_kas_last_reset')
      const today = new Date()
      const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`
      
      if (saved && lastResetDate === currentMonthKey) {
        setPayments(JSON.parse(saved))
      } else {
        // Reset kas pada akhir/awal bulan
        const initial = ALL_MEMBERS.map(name => ({
          id: Math.random().toString(),
          name,
          paid: false,
          paidDate: undefined,
        }))
        setPayments(initial)
        localStorage.setItem('himsa_kas_payments', JSON.stringify(initial))
        localStorage.setItem('himsa_kas_last_reset', currentMonthKey)
      }
    }
    
    checkAndResetMonthly()
  }, [])

  const canEdit = user?.role === 'admin' || user?.divisions?.includes('Wakil')

  const handleTogglePaid = (id: string) => {
    const updated = payments.map(p => {
      if (p.id === id) {
        return {
          ...p,
          paid: !p.paid,
          paidDate: !p.paid ? new Date().toISOString().split('T')[0] : undefined,
        }
      }
      return p
    })
    setPayments(updated)
    localStorage.setItem('himsa_kas_payments', JSON.stringify(updated))
    const member = payments.find(p => p.id === id)
    toast.success(`Status kas ${member?.name} diperbarui`)
  }

  const paidCount = payments.filter(p => p.paid).length
  const notPaidCount = payments.length - paidCount

  return (
    <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 mb-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Wallet className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-green-400">Status Pembayaran Kas</h3>
            <p className="text-sm text-muted-foreground">
              <span className="text-green-300">{paidCount} sudah bayar</span> • <span className="text-orange-300">{notPaidCount} belum bayar</span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progress pembayaran</span>
          <span className="text-green-300">{Math.round((paidCount / payments.length) * 100)}%</span>
        </div>
        <div className="w-full h-3 bg-background/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${(paidCount / payments.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Member list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-colors',
              payment.paid
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-background/50 border-border/50 hover:border-orange-500/30'
            )}
          >
            <div>
              <p className="font-medium text-sm">{payment.name}</p>
              {payment.paidDate && (
                <p className="text-xs text-muted-foreground">{payment.paidDate}</p>
              )}
            </div>
            {canEdit ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTogglePaid(payment.id)}
                className={cn(
                  'h-8 w-8 p-0',
                  payment.paid && 'bg-green-500/20'
                )}
              >
                <Check className={cn(
                  'h-4 w-4',
                  payment.paid ? 'text-green-400' : 'text-muted-foreground'
                )} />
              </Button>
            ) : (
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center',
                payment.paid ? 'bg-green-500/30' : 'bg-orange-500/30'
              )}>
                {payment.paid && <Check className="h-4 w-4 text-green-400" />}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

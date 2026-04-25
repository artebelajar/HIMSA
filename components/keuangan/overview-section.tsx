"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/providers/app-provider'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  created_by: string
  created_by_name: string
  created_at: string
}

interface OverviewSectionProps {
  balance: number
  totalIncome: number
  totalExpense: number
  transactions: Transaction[]
  canManage: boolean
  onAddTransaction: () => void
  onDeleteTransaction: (id: string) => void
  formatRupiah: (amount: number) => string
  formatDate: (date: string) => string
}

export function OverviewSection({
  balance,
  totalIncome,
  totalExpense,
  transactions,
  canManage,
  onAddTransaction,
  onDeleteTransaction,
  formatRupiah,
  formatDate,
}: OverviewSectionProps) {
  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/30 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Wallet className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Saat Ini</p>
              <p className="text-3xl font-bold text-emerald-400">{formatRupiah(balance)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pemasukan</p>
              <p className="text-3xl font-bold text-blue-400">{formatRupiah(totalIncome)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
              <p className="text-3xl font-bold text-red-400">{formatRupiah(totalExpense)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="bg-card/50 border-white/20 overflow-hidden">
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <h3 className="font-semibold text-primary">Riwayat Transaksi</h3>
          {canManage && (
            <Button size="sm" onClick={onAddTransaction} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          )}
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
            {transactions.slice(0, 20).map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                  )}>
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="h-5 w-5 text-green-400" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category} • {formatDate(tx.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={cn(
                    'font-semibold',
                    tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                  )}>
                    {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                  </p>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
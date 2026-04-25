"use client"

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
import { OverviewSection } from '@/components/keuangan/overview-section'
import { StatistikSection } from '@/components/keuangan/statistik-section'
import { KasSection } from '@/components/keuangan/kas-section'

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

interface KasKelas {
  id: string
  kelas_id: string
  user_id: string
  month: number
  year: number
  amount: number
  is_paid: boolean
  paid_at: string | null
  kelas: { id: string; name: string }
  users: { id: string; name: string; email: string }
}

interface Kelas {
  id: string
  name: string
}

interface KelasMember {
  kelas_id: string
  user_id: string
  users: { id: string; name: string; email: string }
}

interface MonthlyStat {
  month: string
  year: number
  income: number
  expense: number
  balance: number
}

interface KasStat {
  kelas_id: string
  kelas_name: string
  total_santri: number
  paid_santri: number
  unpaid_santri: number
  percentage: number
  total_amount: number
  paid_amount: number
}

export default function KeuanganPage() {
  const { user } = useApp()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  
  const [balance, setBalance] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  const [kasKelas, setKasKelas] = useState<KasKelas[]>([])
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [kelasMembers, setKelasMembers] = useState<KelasMember[]>([])
  const [selectedKelas, setSelectedKelas] = useState<string>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([])
  const [kasStats, setKasStats] = useState<KasStat[]>([])
  const [expenseByCategory, setExpenseByCategory] = useState<{ name: string; value: number }[]>([])
  
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showGenerateKasModal, setShowGenerateKasModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [isUpdatingKas, setIsUpdatingKas] = useState<string | null>(null)
  
  const [txType, setTxType] = useState<'income' | 'expense'>('income')
  const [txAmount, setTxAmount] = useState('')
  const [txDescription, setTxDescription] = useState('')
  const [txCategory, setTxCategory] = useState('')
  const [generateKelasId, setGenerateKelasId] = useState('')
  const [generateAmount, setGenerateAmount] = useState('50000')

  const canManage = user?.role === 'admin' || user?.divisions?.includes('Sekretaris')

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  // Simpan tab terakhir di localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('keuangan_tab')
    if (savedTab) setActiveTab(savedTab)
  }, [])

  useEffect(() => {
    localStorage.setItem('keuangan_tab', activeTab)
  }, [activeTab])

  useEffect(() => {
    loadData()
  }, [currentMonth, currentYear])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/keuangan?month=${currentMonth}&year=${currentYear}`)
      const result = await response.json()
      
      if (result.success) {
        setTransactions(result.data.transactions || [])
        setBalance(result.data.balance || 0)
        setTotalIncome(result.data.income || 0)
        setTotalExpense(result.data.expense || 0)
        setKasKelas(result.data.kas || [])
        setKelas(result.data.kelas || [])
        setKelasMembers(result.data.kelasMembers || [])
        setMonthlyStats(result.data.monthlyStats || [])
        setKasStats(result.data.kasStats || [])
        setExpenseByCategory(result.data.expenseByCategory || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    if (!txAmount || !txDescription || !txCategory) {
      toast.error('Semua field harus diisi')
      return
    }

    if (!user) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/keuangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transaction',
          type: txType,
          amount: parseFloat(txAmount),
          description: txDescription,
          category: txCategory,
          created_by: user.id,
          created_by_name: user.name,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Transaksi berhasil ditambahkan')
        setShowTransactionModal(false)
        setTxType('income')
        setTxAmount('')
        setTxDescription('')
        setTxCategory('')
        loadData()
      } else {
        toast.error(result.error || 'Gagal menambah transaksi')
      }
    } catch (error) {
      toast.error('Gagal menambah transaksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateKas = async () => {
    if (!generateKelasId) {
      toast.error('Pilih kelas terlebih dahulu')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/keuangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-kas',
          kelas_id: generateKelasId,
          month: currentMonth,
          year: currentYear,
          amount: parseFloat(generateAmount),
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Kas untuk ${result.data.generated} anggota berhasil dibuat`)
        setShowGenerateKasModal(false)
        setGenerateKelasId('')
        setGenerateAmount('50000')
        loadData()
        setActiveTab('kas')
      } else {
        toast.error(result.error || 'Gagal generate kas')
      }
    } catch (error) {
      toast.error('Gagal generate kas')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleKas = async (kasId: string, currentStatus: boolean) => {
    setIsUpdatingKas(kasId)
    try {
      const response = await fetch('/api/keuangan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kas_id: kasId, is_paid: !currentStatus }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(currentStatus ? 'Kas ditandai belum lunas' : 'Kas ditandai lunas')
        loadData()
      } else {
        toast.error(result.error || 'Gagal mengupdate kas')
      }
    } catch (error) {
      toast.error('Gagal mengupdate kas')
    } finally {
      setIsUpdatingKas(null)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return
    try {
      const response = await fetch(`/api/keuangan?id=${id}&type=transaction`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast.success('Transaksi dihapus')
        loadData()
      }
    } catch (error) {
      toast.error('Gagal menghapus transaksi')
    }
  }

  const handleCleanupKas = async () => {
    if (!confirm('Bersihkan data kas yang tidak sesuai dengan kelas saat ini?')) return
    
    setIsCleaning(true)
    try {
      const response = await fetch('/api/keuangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup-kas' }),
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success(`${result.data.cleaned} data kas dibersihkan`)
        await loadData()
      } else {
        toast.error(result.error || 'Gagal membersihkan data')
      }
    } catch (error) {
      toast.error('Gagal membersihkan data')
    } finally {
      setIsCleaning(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSantriCountInKelas = (kelasId: string) => {
    return kelasMembers.filter(m => m.kelas_id === kelasId).length
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            Keuangan
          </h1>
          <p className="text-muted-foreground">Kelola keuangan, kas, dan lihat laporan statistik</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/30 border border-white/20">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="statistik">📊 Statistik</TabsTrigger>
            <TabsTrigger value="kas">💰 Kas Kelas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewSection
              balance={balance}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              transactions={transactions}
              canManage={canManage}
              onAddTransaction={() => setShowTransactionModal(true)}
              onDeleteTransaction={handleDeleteTransaction}
              formatRupiah={formatRupiah}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent value="statistik" className="mt-6">
            <StatistikSection
              monthlyStats={monthlyStats}
              expenseByCategory={expenseByCategory}
              kasStats={kasStats}
              formatRupiah={formatRupiah}
            />
          </TabsContent>

          <TabsContent value="kas" className="mt-6">
            <KasSection
              kasKelas={kasKelas}
              kelas={kelas}
              kasStats={kasStats}
              selectedKelas={selectedKelas}
              currentMonth={currentMonth}
              currentYear={currentYear}
              canManage={canManage}
              isCleaning={isCleaning}
              isUpdatingKas={isUpdatingKas}
              onSelectKelas={setSelectedKelas}
              onPrevMonth={() => {
                if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1) }
                else { setCurrentMonth(currentMonth - 1) }
              }}
              onNextMonth={() => {
                if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1) }
                else { setCurrentMonth(currentMonth + 1) }
              }}
              onCleanup={handleCleanupKas}
              onGenerateKas={() => setShowGenerateKasModal(true)}
              onToggleKas={handleToggleKas}
              formatRupiah={formatRupiah}
              getSantriCountInKelas={getSantriCountInKelas}
              monthNames={monthNames}
            />
          </TabsContent>
        </Tabs>

        {/* Generate Kas Modal */}
        <Dialog open={showGenerateKasModal} onOpenChange={setShowGenerateKasModal}>
          <DialogContent className="bg-card border-white/20">
            <DialogHeader>
              <DialogTitle className="text-primary">Generate Kas</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Kas akan otomatis dibuat untuk semua anggota di kelas yang dipilih.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Pilih Kelas</Label>
                <Select value={generateKelasId} onValueChange={setGenerateKelasId}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                  <SelectContent>
                    {kelas.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        Kelas {k.name} ({getSantriCountInKelas(k.id)} anggota)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jumlah Kas per Anggota (Rp)</Label>
                <Input type="number" value={generateAmount} onChange={(e) => setGenerateAmount(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowGenerateKasModal(false)}>Batal</Button>
              <Button className="flex-1 bg-primary" onClick={handleGenerateKas} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transaction Modal */}
        <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
          <DialogContent className="bg-card border-white/20">
            <DialogHeader>
              <DialogTitle className="text-primary">Tambah Transaksi</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div>
                <Label>Tipe</Label>
                <Select value={txType} onValueChange={(v) => setTxType(v as 'income' | 'expense')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">💰 Pemasukan</SelectItem>
                    <SelectItem value="expense">📤 Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jumlah (Rp)</Label>
                <Input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
              </div>
              <div>
                <Label>Kategori</Label>
                <Input value={txCategory} onChange={(e) => setTxCategory(e.target.value)} />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Input value={txDescription} onChange={(e) => setTxDescription(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowTransactionModal(false)}>Batal</Button>
              <Button className="flex-1 bg-primary" onClick={handleAddTransaction} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
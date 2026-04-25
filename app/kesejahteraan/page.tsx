"use client"

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { User, RefreshCw, Loader2, Check, Utensils, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScheduleItem {
  id: string; schedule_date: string; santri_id: string; santri_name: string
  kelas_id: string | null; order_index: number; is_active: boolean
  completed_04: boolean; completed_10: boolean; completed_16: boolean
}

interface SantriData {
  user_id: string; kelas_id: string; nomor_absen: number
  users: { id: string; name: string; email: string; avatar_url: string | null }
  kelas: { id: string; name: string }
}

export default function KesejahteraanPage() {
  const { user } = useApp()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [santriList, setSantriList] = useState<SantriData[]>([])
  const [today, setToday] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState<string | null>(null)

  const canManage = user?.role === 'admin' || user?.currentDivision === 'Kesejahteraan'

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const month = new Date().getMonth() + 1; const year = new Date().getFullYear()
      const response = await fetch(`/api/kesejahteraan?month=${month}&year=${year}`)
      const result = await response.json()
      if (result.success) { setSchedule(result.data.schedule || []); setSantriList(result.data.santriList || []); setToday(result.data.today) }
    } catch (error) { console.error('Failed to load data:', error) } finally { setIsLoading(false) }
  }

  const handleGenerate = async () => {
    if (santriList.length === 0) { toast.error('Tidak ada anggota'); return }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/kesejahteraan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate' }) })
      const result = await response.json()
      if (result.success) { toast.success(result.message || 'Jadwal dibuat'); await loadData() }
      else { toast.error(result.error || 'Gagal') }
    } catch (error) { toast.error('Gagal') } finally { setIsGenerating(false) }
  }

  const handleToggleComplete = async (item: ScheduleItem) => {
    setIsCompleting(item.id)
    try {
      const response = await fetch('/api/kesejahteraan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_complete', schedule_id: item.id, completed: item.is_active }) })
      const result = await response.json()
      if (result.success) { toast.success(item.is_active ? 'Selesai!' : 'Dikembalikan'); await loadData() }
    } catch (error) { toast.error('Gagal') } finally { setIsCompleting(null) }
  }

  const handleToggleWaktu = async (item: ScheduleItem, timeSlot: '04' | '10' | '16') => {
    const key = `${item.id}-${timeSlot}`; setIsUpdating(key)
    const field = timeSlot === '04' ? 'completed_04' : timeSlot === '10' ? 'completed_10' : 'completed_16'
    try {
      const response = await fetch('/api/kesejahteraan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schedule_id: item.id, time_slot: timeSlot === '04' ? '04:00' : timeSlot === '10' ? '10:00' : '16:00', completed: !item[field] }) })
      const result = await response.json()
      if (result.success) { setSchedule(prev => prev.map(s => s.id === item.id ? { ...s, [field]: !item[field] } : s)) }
    } catch (error) { toast.error('Gagal') } finally { setIsUpdating(null) }
  }

  const getAvatarUrl = (avatar: string | null, name: string) => avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`

  // Filter & urutkan
  const activeSchedule = schedule.filter(s => s.schedule_date >= today)
    .sort((a, b) => { if (a.is_active !== b.is_active) return a.is_active ? -1 : 1; return a.schedule_date.localeCompare(b.schedule_date) })

  if (isLoading) return <MainLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">
        <div className="flex items-center justify-between">
          <div><h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">Kesejahteraan</h1><p className="text-muted-foreground">Jadwal Masak Nasi</p></div>
          {canManage && <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Generate</Button>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-white/20 p-4"><div className="flex items-center gap-3"><User className="h-6 w-6 text-primary" /><div><p className="text-2xl font-bold">{santriList.length}</p><p className="text-xs text-muted-foreground">Total Anggota</p></div></div></Card>
          <Card className="bg-card/50 border-white/20 p-4"><div className="flex items-center gap-3"><Utensils className="h-6 w-6 text-amber-400" /><div><p className="text-2xl font-bold">{activeSchedule.filter(s => s.is_active).length}</p><p className="text-xs text-muted-foreground">Antrian</p></div></div></Card>
          <Card className="bg-card/50 border-white/20 p-4"><div className="flex items-center gap-3"><Calendar className="h-6 w-6 text-purple-400" /><div><p className="text-2xl font-bold">{new Date(today).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p><p className="text-xs text-muted-foreground">Hari Ini</p></div></div></Card>
        </div>

        <Card className="bg-card/50 border-white/20 overflow-hidden">
          <div className="p-4 border-b border-white/20"><h3 className="font-semibold text-primary">Jadwal Masak</h3></div>
          {activeSchedule.length === 0 ? (
            <div className="p-8 text-center"><p className="text-muted-foreground mb-4">Belum ada jadwal</p>{canManage && <Button onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Generate</Button>}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-primary/20 border-b border-white/20">
                  <tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Tanggal</th><th className="px-4 py-3 text-left">Petugas</th><th className="px-4 py-3 text-left">Kelas</th><th className="px-4 py-3 text-center">04:00</th><th className="px-4 py-3 text-center">10:00</th><th className="px-4 py-3 text-center">16:00</th><th className="px-4 py-3 text-center">Aksi</th></tr>
                </thead>
                <tbody>
                  {activeSchedule.map((item, index) => {
                    const entryDate = new Date(item.schedule_date); const isToday = item.schedule_date === today
                    const santri = santriList.find(s => s.user_id === item.santri_id)
                    const isFirstActive = item.is_active && activeSchedule.filter(s => s.is_active)[0]?.id === item.id
                    return (
                      <tr key={item.id} className={cn('border-b border-white/10', isToday && 'bg-primary/10', isFirstActive && 'border-l-4 border-l-green-500', !item.is_active && 'opacity-60')}>
                        <td className="px-4 py-3"><div className={cn('w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs', item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted/50 text-muted-foreground')}>{index + 1}</div></td>
                        <td className="px-4 py-3"><span className={cn(isToday && 'text-primary font-medium')}>{entryDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-white/20"><AvatarImage src={getAvatarUrl(santri?.users?.avatar_url || null, item.santri_name)} /><AvatarFallback className="text-xs">{item.santri_name.charAt(0)}</AvatarFallback></Avatar>
                            <span className={cn(!item.is_active && 'text-muted-foreground line-through')}>{item.santri_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">Kelas {santri?.kelas?.name || '-'}</Badge></td>
                        {(['04', '10', '16'] as const).map(time => {
                          const field = time === '04' ? 'completed_04' : time === '10' ? 'completed_10' : 'completed_16'
                          const key = `${item.id}-${time}`
                          return (
                            <td key={time} className="px-1 py-3 text-center">
                              <button onClick={() => handleToggleWaktu(item, time)} disabled={isUpdating === key || !item.is_active}
                                className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all', item[field] ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/10 text-red-400 border border-red-500/30', (!item.is_active || isUpdating === key) && 'opacity-50 cursor-not-allowed')}>
                                {isUpdating === key ? <Loader2 className="h-3 w-3 animate-spin" /> : item[field] ? <Check className="h-4 w-4" /> : '✖️'}
                              </button>
                            </td>
                          )
                        })}
                        <td className="px-2 py-3 text-center">
                          {item.is_active ? (
                            <Button variant="outline" size="sm" onClick={() => handleToggleComplete(item)} disabled={isCompleting === item.id} className="text-xs">{isCompleting === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3" /><span className="hidden sm:inline">Selesai</span></>}</Button>
                          ) : <Badge variant="secondary" className="text-xs">✅</Badge>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  )
}
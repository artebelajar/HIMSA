"use client"

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { Loader2, Lock, Globe, Trash2 } from 'lucide-react'
import { WaktuSection } from '@/components/kalender/waktu-section'
import { KalenderSection } from '@/components/kalender/kalender-section'
import { IslamicEvents } from '@/components/kalender/islamic-events'
import { getHijriDate } from '@/lib/hijriyah'
import { supabase } from '@/lib/supabase'

interface AgendaItem {
  id: string; title: string; agenda_date: string; time_slot: string
  visibility: 'public' | 'private'; created_by: string; created_by_name: string; created_by_role: string
}

export default function SchedulePage() {
  const { user } = useApp()
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [agendaTitle, setAgendaTitle] = useState('')
  const [agendaTime, setAgendaTime] = useState('09:00')
  const [agendaVisibility, setAgendaVisibility] = useState<'public' | 'private'>('private')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [today, setToday] = useState('')

  const canMakePublic = user?.role === 'admin' || user?.role === 'division'

  useEffect(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    setToday(`${y}-${m}-${d}`)
    loadAgendas()
  }, [])

  const loadAgendas = async () => {
    setIsLoading(true)
    try {
      const todayDate = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .gte('agenda_date', todayDate)
        .order('agenda_date', { ascending: true })
        .order('time_slot', { ascending: true })
      if (error) throw error
      setAgendas(data || [])
    } catch (error) {
      console.error('Failed to load agendas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAgenda = async () => {
    if (!selectedDate || !agendaTitle.trim()) { toast.error('Judul agenda harus diisi'); return }
    if (!user) return
    setIsAdding(true)
    try {
      const response = await fetch('/api/agendas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: agendaTitle.trim(), agenda_date: selectedDate, time_slot: agendaTime, visibility: agendaVisibility, user_id: user.id, user_name: user.name, user_role: user.role, user_division: user.currentDivision || null }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Agenda berhasil ditambahkan')
        await loadAgendas()
        setSelectedDate(null); setAgendaTitle(''); setAgendaTime('09:00'); setAgendaVisibility('private')
      } else { toast.error(result.error || 'Gagal menambah agenda') }
    } catch (error) { toast.error('Gagal menambah agenda') }
    finally { setIsAdding(false) }
  }

  const handleDeleteAgenda = async (agendaId: string) => {
    if (!user) return
    setIsDeleting(agendaId)
    try {
      const response = await fetch(`/api/agendas?id=${agendaId}&userId=${user.id}&userRole=${user.role}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) { toast.success('Agenda dihapus'); await loadAgendas() }
      else { toast.error(result.error || 'Gagal menghapus agenda') }
    } catch (error) { toast.error('Gagal menghapus agenda') }
    finally { setIsDeleting(null) }
  }

  const canDeleteAgenda = (agenda: AgendaItem) => {
    if (agenda.visibility === 'private' && agenda.created_by === user?.id) return true
    if (user?.role === 'admin' || user?.role === 'division') return true
    return false
  }

  const agendasByDate = agendas.reduce((acc, agenda) => {
    if (!acc[agenda.agenda_date]) acc[agenda.agenda_date] = []
    acc[agenda.agenda_date].push(agenda)
    return acc
  }, {} as Record<string, AgendaItem[]>)

  const todayHijri = getHijriDate(new Date())

  if (isLoading) {
    return <MainLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Kalender & Agenda</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <WaktuSection />
            <IslamicEvents currentHijriMonth={todayHijri.monthIndex} currentHijriYear={todayHijri.year} />
          </div>
          <div className="lg:col-span-2">
            <KalenderSection today={today} onSelectDate={setSelectedDate} agendasByDate={agendasByDate} />
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-white/20 p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-primary">{new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
              {agendasByDate[selectedDate] && agendasByDate[selectedDate].length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Agenda Hari Ini</h4>
                  {agendasByDate[selectedDate].map((agenda) => (
                    <div key={agenda.id} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{agenda.title}</p>
                            {agenda.visibility === 'public' ? <Globe className="h-3 w-3 text-green-400" /> : <Lock className="h-3 w-3 text-yellow-400" />}
                          </div>
                          <p className="text-xs text-amber-300 mt-1">{agenda.time_slot} • oleh {agenda.created_by_name}</p>
                        </div>
                        {canDeleteAgenda(agenda) && (
                          <button onClick={() => handleDeleteAgenda(agenda.id)} disabled={isDeleting === agenda.id} className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50">
                            {isDeleting === agenda.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-semibold mb-3">Tambah Agenda</h4>
                <input type="text" placeholder="Judul agenda" value={agendaTitle} onChange={(e) => setAgendaTitle(e.target.value)} className="w-full px-3 py-2 bg-input/50 border border-white/20 rounded-lg text-sm" />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <input type="time" value={agendaTime} onChange={(e) => setAgendaTime(e.target.value)} className="w-full px-3 py-2 bg-input/50 border border-white/20 rounded-lg text-sm" />
                  {canMakePublic ? (
                    <select value={agendaVisibility} onChange={(e) => setAgendaVisibility(e.target.value as 'public' | 'private')} className="w-full px-3 py-2 bg-input/50 border border-white/20 rounded-lg text-sm">
                      <option value="private">🔒 Private</option>
                      <option value="public">🌐 Public</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-input/50 border border-white/20 rounded-lg text-sm text-muted-foreground"><Lock className="h-3 w-3" /> Private only</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4 mt-4 border-t border-white/10">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedDate(null)}>Tutup</Button>
              <Button className="flex-1 bg-primary" onClick={handleAddAgenda} disabled={isAdding}>
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tambah'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  )
}
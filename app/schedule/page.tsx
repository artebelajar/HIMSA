'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApp } from '@/providers/app-provider'
import { Calendar as CalendarIcon, Clock, Users, Bell, ChevronLeft, ChevronRight, Edit2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SecurityShift {
  group: number
  members: string[]
  date: string
}

interface WelfareEntry {
  date: string
  time: string
  person: string
  completed: boolean
}

const SECURITY_GROUPS = 7
const MEMBERS_PER_GROUP = 3
const WELFARE_TIMES = ['04:00', '10:00', '16:00']
const ALL_MEMBERS = Array.from({ length: 21 }, (_, i) => `Anggota ${i + 1}`)

export default function SchedulePage() {
  const { user } = useApp()
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [securitySchedule, setSecuritySchedule] = useState<SecurityShift[]>([])
  const [welfareSchedule, setWelfareSchedule] = useState<WelfareEntry[]>([])
  const [showUserSelector, setShowUserSelector] = useState<{ type: 'security' | 'welfare', date: string, time?: string } | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [agendaItems, setAgendaItems] = useState<{ [key: string]: string[] }>({})
  const [calendarDays, setCalendarDays] = useState<any[]>([])
  const [selectedDateForAgenda, setSelectedDateForAgenda] = useState<string | null>(null)
  const [agendaTitle, setAgendaTitle] = useState('')
  const [agendaTime, setAgendaTime] = useState('09:00')
  const [agendaVisibility, setAgendaVisibility] = useState<'public' | 'private'>('public')

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      setCurrentTime(timeString)
      
      const dateStr = now.toISOString().split('T')[0]
      setCurrentDate(dateStr)

      // Check for 11:15 reminder for security shift
      if (now.getHours() === 11 && now.getMinutes() === 15 && now.getSeconds() === 0) {
        const todayShift = securitySchedule.find(s => s.date === dateStr)
        if (todayShift) {
          toast.info(`Pengingat: Giliran Keamanan Grup ${todayShift.group}`)
        }
      }
    }

    const timer = setInterval(updateTime, 1000)
    updateTime()
    return () => clearInterval(timer)
  }, [securitySchedule])

  // Initialize schedules from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('himsa_security_schedule')
    if (saved) {
      setSecuritySchedule(JSON.parse(saved))
    } else {
      // Initialize with 7 groups rotating
      const initial: SecurityShift[] = []
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        const dayOfWeek = date.getDay()
        
        if (dayOfWeek !== 0 && dayOfWeek !== 5) { // Skip Friday (5) and Sunday (0)
          const groupNum = (i % SECURITY_GROUPS) + 1
          initial.push({
            group: groupNum,
            members: ALL_MEMBERS.slice((groupNum - 1) * MEMBERS_PER_GROUP, groupNum * MEMBERS_PER_GROUP),
            date: date.toISOString().split('T')[0],
          })
        }
      }
      setSecuritySchedule(initial)
      localStorage.setItem('himsa_security_schedule', JSON.stringify(initial))
    }

    const savedWelfare = localStorage.getItem('himsa_welfare_schedule')
    if (savedWelfare) {
      setWelfareSchedule(JSON.parse(savedWelfare))
    } else {
      // Initialize with 21 days of welfare (each person takes 1 day with 3 times)
      const initial: WelfareEntry[] = []
      for (let i = 0; i < 63; i++) { // 63 = 21 people × 3 times
        const date = new Date()
        date.setDate(date.getDate() + Math.floor(i / 3))
        const timeIndex = i % 3
        const personIndex = Math.floor(i / 3) % 21
        
        initial.push({
          date: date.toISOString().split('T')[0],
          time: WELFARE_TIMES[timeIndex],
          person: ALL_MEMBERS[personIndex],
          completed: false,
        })
      }
      setWelfareSchedule(initial)
      localStorage.setItem('himsa_welfare_schedule', JSON.stringify(initial))
    }

    const savedAgenda = localStorage.getItem('himsa_agenda_items')
    if (savedAgenda) {
      setAgendaItems(JSON.parse(savedAgenda))
    }
  }, [])

  const canEditSecurity = user?.role === 'admin' || user?.currentDivision === 'Keamanan'
  const canEditWelfare = user?.role === 'admin' || user?.currentDivision === 'Kesejahteraan'

  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getTodaySecurityShift = () => {
    return securitySchedule.find(s => s.date === currentDate)
  }

  const getTodayWelfareShifts = () => {
    return welfareSchedule.filter(w => w.date === currentDate)
  }

  const handleEditMember = (date: string, isSecurity: boolean, time?: string) => {
    if (isSecurity && !canEditSecurity) {
      toast.error('Hanya Division Keamanan atau Admin yang bisa mengubah jadwal keamanan')
      return
    }
    if (!isSecurity && !canEditWelfare) {
      toast.error('Hanya Division Kesejahteraan atau Admin yang bisa mengubah jadwal masak')
      return
    }
    
    setShowUserSelector({ type: isSecurity ? 'security' : 'welfare', date, time })
    setSelectedUsers([])
  }

  const handleSaveUsers = () => {
    if (!showUserSelector) return

    if (showUserSelector.type === 'security') {
      if (selectedUsers.length !== MEMBERS_PER_GROUP) {
        toast.error(`Pilih tepat ${MEMBERS_PER_GROUP} anggota`)
        return
      }
      
      const updated = securitySchedule.map(s =>
        s.date === showUserSelector.date
          ? { ...s, members: selectedUsers }
          : s
      )
      setSecuritySchedule(updated)
      localStorage.setItem('himsa_security_schedule', JSON.stringify(updated))
      toast.success('Jadwal keamanan berhasil diubah')
    } else if (showUserSelector.type === 'welfare' && showUserSelector.time) {
      const updated = welfareSchedule.map(w =>
        w.date === showUserSelector.date && w.time === showUserSelector.time
          ? { ...w, person: selectedUsers[0] || w.person }
          : w
      )
      setWelfareSchedule(updated)
      localStorage.setItem('himsa_welfare_schedule', JSON.stringify(updated))
      toast.success('Jadwal masak berhasil diubah')
    }

    setShowUserSelector(null)
    setSelectedUsers([])
  }

  const handleAddAgenda = () => {
    if (!selectedDateForAgenda || !agendaTitle.trim()) {
      toast.error('Judul agenda harus diisi')
      return
    }

    const updated = { ...agendaItems }
    if (!updated[selectedDateForAgenda]) {
      updated[selectedDateForAgenda] = []
    }
    updated[selectedDateForAgenda].push(`${agendaTitle} (${agendaTime})`)
    setAgendaItems(updated)
    localStorage.setItem('himsa_agenda_items', JSON.stringify(updated))
    toast.success('Agenda berhasil ditambahkan')
    
    setSelectedDateForAgenda(null)
    setAgendaTitle('')
    setAgendaTime('09:00')
    setAgendaVisibility('public')
  }

  const calendarDaysList = generateCalendar()

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">
        {/* Header with Live Time */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Jadwal
          </h1>
          <Card className="bg-card/50 border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Tanggal & Waktu Sekarang</p>
                <p className="font-mono text-2xl font-bold text-primary tracking-wide">{currentTime}</p>
              </div>
              <Clock className="w-12 h-12 text-primary/50" />
            </div>
          </Card>
        </div>

        {/* Tabs for Calendar, Security, and Welfare */}
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/30 border border-white/20">
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
            <TabsTrigger value="security">Keamanan</TabsTrigger>
            <TabsTrigger value="welfare">Kesejahteraan</TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-6 space-y-4">
            <Card className="bg-card/50 border-white/20 p-6">
              <div className="space-y-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-xl font-bold text-primary">
                    {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-3">
                  {['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-muted-foreground p-3 border border-white/10 rounded-lg">
                      {day}
                    </div>
                  ))}
                  {calendarDaysList.map((day, idx) => {
                    if (!day) {
                      return <div key={`empty-${idx}`} className="border border-white/5 rounded-lg" />
                    }

                    const dateStr = day.toISOString().split('T')[0]
                    const isToday = dateStr === currentDate
                    const hasAgenda = agendaItems[dateStr] && agendaItems[dateStr].length > 0
                    const agendaCount = agendaItems[dateStr]?.length || 0
                    const todayShift = securitySchedule.find(s => s.date === dateStr)
                    const isOtherMonth = day.getMonth() !== currentMonth.getMonth()

                    return (
                      <div
                        key={dateStr}
                        onClick={() => !isOtherMonth && setSelectedDateForAgenda(dateStr)}
                        className={cn(
                          'aspect-square p-2 rounded-lg border transition-all cursor-pointer flex flex-col overflow-hidden',
                          isOtherMonth
                            ? 'bg-transparent border-white/5 opacity-50'
                            : isToday
                            ? 'bg-primary/25 border-primary ring-2 ring-primary/50 hover:shadow-lg'
                            : hasAgenda
                            ? 'bg-amber-500/15 border-amber-500/40 hover:shadow-lg hover:border-amber-500/60'
                            : 'bg-card/30 border-white/20 hover:border-white/40 hover:bg-card/40'
                        )}
                      >
                        <p className={cn('font-bold text-sm leading-tight', isToday && 'text-primary')}>
                          {day.getDate()}
                        </p>
                        
                        {todayShift && !isOtherMonth && (
                          <p className="text-xs text-cyan-300 mt-1 truncate">
                            Gr{todayShift.group}
                          </p>
                        )}
                        
                        {hasAgenda && !isOtherMonth && (
                          <div className="mt-1 flex-1 flex flex-col gap-0.5 text-xs">
                            {agendaCount === 1 ? (
                              <p className="text-amber-300 truncate">
                                {agendaItems[dateStr][0].split('(')[0].trim()}
                              </p>
                            ) : (
                              <>
                                <p className="text-amber-300 font-semibold">{agendaCount} agenda</p>
                                <div className="text-amber-200/70 space-y-0.5">
                                  {agendaItems[dateStr].slice(0, 2).map((agenda, i) => (
                                    <p key={i} className="truncate text-xs">
                                      {agenda.split('(')[0].trim()}
                                    </p>
                                  ))}
                                  {agendaCount > 2 && (
                                    <p className="text-amber-200/60 text-xs">+{agendaCount - 2} lagi</p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security Schedule Tab */}
          <TabsContent value="security" className="mt-6">
            <Card className="bg-card/50 border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-primary/20 border-b border-white/20">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-primary">Tanggal</th>
                      <th className="px-4 py-3 text-left font-bold text-primary">Grup</th>
                      <th className="px-4 py-3 text-left font-bold text-primary">Anggota (3 Orang)</th>
                      {canEditSecurity && <th className="px-4 py-3 text-left font-bold text-primary">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {securitySchedule.slice(0, 7).map((shift) => {
                      const isToday = shift.date === currentDate
                      return (
                        <tr
                          key={shift.date}
                          className={cn(
                            'transition-colors',
                            isToday && 'bg-primary/20'
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isToday && <Bell className="w-4 h-4 text-primary animate-pulse" />}
                              <span>{new Date(shift.date).toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-primary">Grup {shift.group}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {shift.members.join(', ')}
                          </td>
                          {canEditSecurity && (
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditMember(shift.date, true)}
                                className="text-primary hover:bg-primary/20"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Welfare Schedule Tab */}
          <TabsContent value="welfare" className="mt-6">
            <Card className="bg-card/50 border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-primary/20 border-b border-white/20">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-primary">Tanggal</th>
                      <th className="px-4 py-3 text-left font-bold text-primary">Waktu</th>
                      <th className="px-4 py-3 text-left font-bold text-primary">Nama Masak</th>
                      <th className="px-4 py-3 text-left font-bold text-primary">Status</th>
                      {canEditWelfare && <th className="px-4 py-3 text-left font-bold text-primary">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {welfareSchedule.slice(0, 21).map((entry, index) => {
                      const isToday = entry.date === currentDate
                      const isFirstTimeOfDay = index === 0 || welfareSchedule[index - 1]?.date !== entry.date
                      const isLastTimeOfDay = index === welfareSchedule.length - 1 || welfareSchedule[index + 1]?.date !== entry.date
                      return (
                        <tr
                          key={`${entry.date}-${entry.time}`}
                          className={cn(
                            'transition-colors border-t border-white/10',
                            isLastTimeOfDay && 'border-b-2 border-primary/50',
                            isToday && 'bg-primary/10'
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isToday && <Bell className="w-4 h-4 text-primary animate-pulse" />}
                              <span>{new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-lg text-cyan-300 tracking-wider">{entry.time}</span>
                          </td>
                          <td className="px-4 py-3">{entry.person}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-bold',
                              entry.completed
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            )}>
                              {entry.completed ? 'Selesai' : 'Menunggu'}
                            </span>
                          </td>
                          {canEditWelfare && (
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditMember(entry.date, false, entry.time)}
                                className="text-primary hover:bg-primary/20"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Selector Modal */}
        {showUserSelector && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="bg-card border-white/20 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">
                  {showUserSelector.type === 'security' ? 'Pilih Anggota Keamanan' : 'Pilih Anggota Masak'}
                </h3>
                <button
                  onClick={() => setShowUserSelector(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ALL_MEMBERS.map((member) => (
                  <label
                    key={member}
                    className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer transition"
                  >
                    <input
                      type={showUserSelector.type === 'security' ? 'checkbox' : 'radio'}
                      name={showUserSelector.type === 'security' ? 'members' : 'person'}
                      value={member}
                      checked={selectedUsers.includes(member)}
                      onChange={(e) => {
                        if (showUserSelector.type === 'security') {
                          setSelectedUsers(
                            e.target.checked
                              ? [...selectedUsers, member]
                              : selectedUsers.filter(m => m !== member)
                          )
                        } else {
                          setSelectedUsers([member])
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{member}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUserSelector(null)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/80"
                  onClick={handleSaveUsers}
                >
                  Simpan
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Agenda Modal */}
        {selectedDateForAgenda && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-card border-white/20 p-6 w-full max-w-md max-h-96 flex flex-col">
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div>
                  <h3 className="font-bold text-lg text-primary mb-2">
                    {new Date(selectedDateForAgenda).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  {agendaItems[selectedDateForAgenda] && agendaItems[selectedDateForAgenda].length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {agendaItems[selectedDateForAgenda].length} agenda
                    </p>
                  )}
                </div>

                {agendaItems[selectedDateForAgenda]?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Agenda Hari Ini</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {agendaItems[selectedDateForAgenda].map((item, idx) => (
                        <div key={idx} className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-sm">
                          <p className="text-foreground font-medium">{item.split('(')[0].trim()}</p>
                          <p className="text-xs text-amber-300">{item.match(/\((.*?)\)/)?.[1] || ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Tambah Agenda Baru</h4>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Judul Agenda</label>
                    <input
                      type="text"
                      placeholder="Masukkan judul agenda"
                      value={agendaTitle}
                      onChange={(e) => setAgendaTitle(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-input/50 border border-white/20 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">Jam</label>
                      <input
                        type="time"
                        value={agendaTime}
                        onChange={(e) => setAgendaTime(e.target.value)}
                        className="w-full mt-2 px-3 py-2 bg-input/50 border border-white/20 rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Visibilitas</label>
                      <select
                        value={agendaVisibility}
                        onChange={(e) => setAgendaVisibility(e.target.value as 'public' | 'private')}
                        className="w-full mt-2 px-3 py-2 bg-input/50 border border-white/20 rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
                      >
                        <option value="public">Publik</option>
                        <option value="private">Pribadi</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedDateForAgenda(null)
                    setAgendaTitle('')
                    setAgendaTime('09:00')
                  }}
                >
                  Tutup
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/80"
                  onClick={handleAddAgenda}
                >
                  Tambah
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

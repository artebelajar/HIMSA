"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getHijriDate } from '@/lib/hijriyah'

interface AgendaItem {
  id: string; title: string; agenda_date: string; time_slot: string
  visibility: 'public' | 'private'; created_by: string; created_by_name: string
}

interface KalenderSectionProps {
  today: string
  onSelectDate: (date: string) => void
  agendasByDate: Record<string, AgendaItem[]>
}

export function KalenderSection({ today, onSelectDate, agendasByDate }: KalenderSectionProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const startDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < startDayOfWeek; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
    return days
  }

  const calendarDays = generateCalendar()
  const currentHijri = getHijriDate(currentMonth)

  return (
    <Card className="bg-card/50 border-white/20 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-primary">{currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2>
            <p className="text-xs text-amber-400 mt-0.5">{currentHijri.day} {currentHijri.month} {currentHijri.year} H</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-muted-foreground p-1.5">{day}</div>
          ))}
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square" />
            const year = day.getFullYear()
            const month = String(day.getMonth() + 1).padStart(2, '0')
            const dayOfMonth = String(day.getDate()).padStart(2, '0')
            const dateStr = `${year}-${month}-${dayOfMonth}`
            const isToday = dateStr === today
            const hasAgenda = agendasByDate[dateStr] && agendasByDate[dateStr].length > 0
            const agendaCount = agendasByDate[dateStr]?.length || 0
            const isOtherMonth = day.getMonth() !== currentMonth.getMonth()
            const isSunday = day.getDay() === 0
            const isFriday = day.getDay() === 5
            const hijri = getHijriDate(day)

            return (
              <div key={dateStr} onClick={() => !isOtherMonth && onSelectDate(dateStr)}
                className={cn(
                  'aspect-square p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center',
                  isOtherMonth && 'opacity-30 border-white/5',
                  isToday && 'bg-primary/25 border-primary ring-2 ring-primary/50',
                  hasAgenda && !isToday && 'bg-amber-500/20 border-amber-500/30',
                  isSunday && !isToday && 'bg-red-500/10 border-red-500/30',
                  isFriday && !isToday && !isSunday && 'bg-blue-500/10 border-blue-500/30',
                  !isToday && !hasAgenda && !isSunday && !isFriday && !isOtherMonth && 'bg-card/30 border-white/20 hover:bg-card/40'
                )}>
                <span className={cn('text-xs font-semibold', isToday && 'text-primary font-bold', isSunday && !isToday && 'text-red-400', isFriday && !isToday && !isSunday && 'text-blue-400')}>{day.getDate()}</span>
                <span className="text-[9px] text-muted-foreground leading-tight">{hijri.day}</span>
                {hasAgenda && (
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(agendaCount, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-amber-400" />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
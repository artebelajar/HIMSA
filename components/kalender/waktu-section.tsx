"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Clock, Moon, Sun } from 'lucide-react'
import { getHijriDate } from '@/lib/hijriyah'

function getPrayerTimes(date: Date) {
  const month = date.getMonth() + 1
  let subuhHour = 4, subuhMin = 30, dzuhurHour = 11, dzuhurMin = 50
  let asharHour = 15, asharMin = 10, maghribHour = 17, maghribMin = 50, isyaHour = 19, isyaMin = 5
  
  if (month >= 4 && month <= 9) {
    subuhHour = 4; subuhMin = 45; dzuhurHour = 11; dzuhurMin = 45
    asharHour = 15; asharMin = 5; maghribHour = 17; maghribMin = 45; isyaHour = 19; isyaMin = 0
  }
  if (month >= 10 || month <= 3) {
    subuhHour = 4; subuhMin = 15; dzuhurHour = 11; dzuhurMin = 55
    asharHour = 15; asharMin = 15; maghribHour = 17; maghribMin = 55; isyaHour = 19; isyaMin = 10
  }
  
  const fmt = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  
  return [
    { name: 'Subuh', time: fmt(subuhHour, subuhMin), icon: '🌅', color: 'text-amber-400' },
    { name: 'Dzuhur', time: fmt(dzuhurHour, dzuhurMin), icon: '☀️', color: 'text-yellow-400' },
    { name: 'Ashar', time: fmt(asharHour, asharMin), icon: '🌤️', color: 'text-orange-400' },
    { name: 'Maghrib', time: fmt(maghribHour, maghribMin), icon: '🌇', color: 'text-red-400' },
    { name: 'Isya', time: fmt(isyaHour, isyaMin), icon: '🌙', color: 'text-blue-400' },
  ]
}

export function WaktuSection() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [hijriDate, setHijriDate] = useState<any>(null)
  const [prayerTimes, setPrayerTimes] = useState<any[]>([])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
      setHijriDate(getHijriDate(now))
      setPrayerTimes(getPrayerTimes(now))
    }
    const timer = setInterval(updateTime, 1000)
    updateTime()
    return () => clearInterval(timer)
  }, [])

  const today = new Date()
  const formattedDate = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Card className="bg-card/50 border-white/20 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Waktu Saat Ini</p>
            <p className="font-mono text-3xl font-bold text-primary tracking-wide">{currentTime}</p>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Clock className="h-7 w-7 text-primary" />
          </div>
        </div>

        {hijriDate && (
          <div className="border-t border-white/20 pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><Moon className="h-3 w-3" /> Kalender Hijriyah</p>
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xl font-bold text-amber-400 text-center">{hijriDate.day} {hijriDate.month} {hijriDate.year} H</p>
            </div>
          </div>
        )}

        <div className="border-t border-white/20 pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><Sun className="h-3 w-3" /> Jadwal Sholat WIB</p>
          <div className="space-y-2">
            {prayerTimes.map((p: any) => (
              <div key={p.name} className="flex items-center justify-between bg-primary/5 border border-white/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <span className={`text-sm font-medium ${p.color}`}>{p.name}</span>
                </div>
                <span className="font-mono font-semibold text-sm">{p.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
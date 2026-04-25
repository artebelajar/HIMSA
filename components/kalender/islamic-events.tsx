"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { ISLAMIC_EVENTS, HIJRI_MONTHS } from '@/lib/hijriyah'

interface IslamicEventsProps {
  currentHijriMonth: number
  currentHijriYear: number
}

export function IslamicEvents({ currentHijriMonth, currentHijriYear }: IslamicEventsProps) {
  const monthEvents = ISLAMIC_EVENTS.filter(e => e.hijriMonth === currentHijriMonth)
  const monthName = HIJRI_MONTHS[currentHijriMonth - 1] || ''

  return (
    <Card className="bg-card/50 border-white/20 p-4">
      <h3 className="font-semibold text-primary text-sm mb-3 flex items-center gap-2">
        <Star className="h-4 w-4" />
        Event Islam - {monthName}
      </h3>
      
      {monthEvents.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Tidak ada event besar bulan ini
        </p>
      ) : (
        <div className="space-y-2">
          {monthEvents.map((event, idx) => (
            <div key={idx} className="bg-gradient-to-r from-primary/5 to-transparent border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{event.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${event.color}`}>{event.name}</p>
                  <p className="text-xs text-muted-foreground">{event.description} {currentHijriYear} H</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ayyamul Bidh */}
      <div className="mt-3 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌕</span>
          <div>
            <p className="text-sm font-semibold text-yellow-400">Ayyamul Bidh</p>
            <p className="text-xs text-muted-foreground">
              13-15 {monthName} {currentHijriYear} H • Puasa sunnah hari putih
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
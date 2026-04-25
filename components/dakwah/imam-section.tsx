"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { RefreshCw, Loader2, Check, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScheduleItem {
  id: string
  type: string
  schedule_date: string
  santri_id: string
  santri_name: string
  kelas_name: string | null
  nomor_absen: number | null
  is_active: boolean
}

interface SantriData {
  user_id: string
  nomor_absen: number
  users: { id: string; name: string; avatar_url: string | null }
  kelas: { id: string; name: string }
}

interface ImamSectionProps {
  schedule: ScheduleItem[]
  eligibleList: SantriData[]
  today: string
  canManage: boolean
  isGenerating: boolean
  isUpdating: string | null
  onGenerate: () => void
  onToggleComplete: (item: ScheduleItem) => void
  onManageSantri: () => void
  getAvatarUrl: (avatar: string | null, name: string) => string
  getKelasColor: (kelasName: string) => string
}

export function ImamSection({
  schedule,
  eligibleList,
  today,
  canManage,
  isGenerating,
  isUpdating,
  onGenerate,
  onToggleComplete,
  onManageSantri,
  getAvatarUrl,
  getKelasColor,
}: ImamSectionProps) {
  // Filter & urutkan schedule
  const scheduleItems = schedule
    .filter(s => s.type === 'imam')
    .sort((a, b) => {
      // Yang aktif di atas, yang non-aktif di bawah
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
      return new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime()
    })

  const activeItems = scheduleItems.filter(s => s.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Card className="bg-card/50 border-white/20 px-4 py-2">
            <span className="text-sm text-muted-foreground">Total Santri: </span>
            <span className="font-bold text-primary">{eligibleList.length}</span>
          </Card>
          <Card className="bg-card/50 border-white/20 px-4 py-2">
            <span className="text-sm text-muted-foreground">Antrian: </span>
            <span className="font-bold text-green-400">{activeItems.length}</span>
          </Card>
        </div>
        
        {canManage && (
          <div className="flex gap-2">
            <Button onClick={onManageSantri} variant="outline" className="gap-2">
              <UserX className="h-4 w-4" />
              Kelola Santri
            </Button>
            <Button onClick={onGenerate} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Generate
            </Button>
          </div>
        )}
      </div>

      {/* Antrian */}
      <Card className="bg-card/50 border-white/20 overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h3 className="font-semibold text-primary">Jadwal Imam</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Kelas 11 & 12 • Klik tombol selesai untuk memindahkan ke antrian paling bawah
          </p>
        </div>
        
        {scheduleItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Belum ada jadwal</p>
            {canManage && eligibleList.length > 0 && (
              <Button onClick={onGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Generate Jadwal
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {scheduleItems.map((item, index) => {
              const entryDate = new Date(item.schedule_date)
              const isToday = item.schedule_date === today
              const santriData = eligibleList.find(s => s.user_id === item.santri_id)
              const isFirst = item.is_active && activeItems[0]?.id === item.id
              
              return (
                <div 
                  key={item.id} 
                  className={cn(
                    'p-4 flex items-center justify-between transition-all',
                    isToday && 'bg-primary/10',
                    isFirst && item.is_active && 'border-l-4 border-l-green-500'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Nomor Antrian */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                      item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted/50 text-muted-foreground'
                    )}>
                      {index + 1}
                    </div>
                    
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                      <AvatarImage src={getAvatarUrl(santriData?.users?.avatar_url || null, item.santri_name)} />
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {item.santri_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={cn('font-medium', !item.is_active && 'text-muted-foreground')}>
                          {item.santri_name}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Kelas {item.kelas_name} • Absen {item.nomor_absen} • {entryDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Tombol Selesai */}
                  {item.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleComplete(item)}
                      disabled={isUpdating === item.id}
                      className="min-w-28 gap-2"
                    >
                      {isUpdating === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Selesai</span>
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Yang sudah selesai tampil tanpa tombol */}
                  {!item.is_active && (
                    <span className="text-xs text-muted-foreground italic">Menunggu jadwal baru...</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
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
  waktu: string | null
  is_active: boolean
}

interface SantriData {
  user_id: string
  nomor_absen: number
  users: { id: string; name: string; avatar_url: string | null }
  kelas: { id: string; name: string }
}

interface KultumSectionProps {
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

export function KultumSection({
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
}: KultumSectionProps) {
  // Urutkan: yang aktif di atas, yang non-aktif di bawah
  const scheduleItems = schedule
    .filter(s => s.type === 'kultum')
    .sort((a, b) => {
      if (a.schedule_date !== b.schedule_date) 
        return a.schedule_date.localeCompare(b.schedule_date)
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
      return (a.waktu === 'subuh' ? 0 : 1) - (b.waktu === 'subuh' ? 0 : 1)
    })

  const activeItems = scheduleItems.filter(s => s.is_active)

  // Group by date untuk tampilan
  const groupedByDate = scheduleItems.reduce((acc, item) => {
    if (!acc[item.schedule_date]) acc[item.schedule_date] = []
    acc[item.schedule_date].push(item)
    return acc
  }, {} as Record<string, ScheduleItem[]>)

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

      {/* Jadwal Kultum - Tabel */}
      <Card className="bg-card/50 border-white/20 overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h3 className="font-semibold text-primary">Jadwal Kultum</h3>
          <p className="text-xs text-muted-foreground mt-1">
            2 waktu per hari (Subuh & Dhuhur) • Klik tombol selesai untuk pindah ke bawah
          </p>
        </div>
        
        {Object.keys(groupedByDate).length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary/20 border-b border-white/20">
                <tr>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">🌅 Subuh</th>
                  <th className="px-4 py-3 text-left">☀️ Dhuhur</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByDate).map(([date, items]) => {
                  const entryDate = new Date(date)
                  const isToday = date === today
                  const subuh = items.find(i => i.waktu === 'subuh')
                  const dhuhur = items.find(i => i.waktu === 'dhuhur')
                  const allActive = items.every(i => i.is_active)
                  
                  return (
                    <tr 
                      key={date} 
                      className={cn(
                        'border-b border-white/10',
                        isToday && 'bg-primary/10',
                        !allActive && 'opacity-60'
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className={cn(isToday && 'text-primary font-medium')}>
                          {entryDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                          {isToday && <span className="ml-2 text-xs text-primary">• Hari ini</span>}
                        </span>
                      </td>
                      
                      {/* Slot Subuh */}
                      <td className="px-4 py-3">
                        {subuh ? (
                          <KultumSlot 
                            item={subuh} 
                            eligibleList={eligibleList}
                            isUpdating={isUpdating}
                            onToggleComplete={onToggleComplete}
                            getAvatarUrl={getAvatarUrl}
                            getKelasColor={getKelasColor}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      
                      {/* Slot Dhuhur */}
                      <td className="px-4 py-3">
                        {dhuhur ? (
                          <KultumSlot 
                            item={dhuhur} 
                            eligibleList={eligibleList}
                            isUpdating={isUpdating}
                            onToggleComplete={onToggleComplete}
                            getAvatarUrl={getAvatarUrl}
                            getKelasColor={getKelasColor}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
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
  )
}

// Komponen untuk setiap slot kultum
function KultumSlot({ 
  item, 
  eligibleList, 
  isUpdating, 
  onToggleComplete, 
  getAvatarUrl, 
  getKelasColor,
}: {
  item: ScheduleItem
  eligibleList: SantriData[]
  isUpdating: string | null
  onToggleComplete: (item: ScheduleItem) => void
  getAvatarUrl: (avatar: string | null, name: string) => string
  getKelasColor: (kelasName: string) => string
}) {
  const santriData = eligibleList.find(s => s.user_id === item.santri_id)
  
  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg transition-all',
      item.is_active 
        ? 'bg-green-500/5 border border-green-500/20 hover:bg-green-500/10' 
        : 'bg-muted/30'
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9 border border-white/20 flex-shrink-0">
          <AvatarImage src={getAvatarUrl(santriData?.users?.avatar_url || null, item.santri_name)} />
          <AvatarFallback className="text-xs">{item.santri_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className={cn('text-sm font-medium truncate', !item.is_active && 'text-muted-foreground')}>
            {item.santri_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            <Badge variant="outline" className={cn('text-xs mr-1', getKelasColor(item.kelas_name || ''))}>
              Kelas {item.kelas_name}
            </Badge>
            Absen {item.nomor_absen}
          </p>
        </div>
      </div>
      
      {item.is_active && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleComplete(item)}
          disabled={isUpdating === item.id}
          className="gap-1 flex-shrink-0 ml-2"
        >
          {isUpdating === item.id ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <Check className="h-3 w-3" />
              <span className="hidden sm:inline">Selesai</span>
            </>
          )}
        </Button>
      )}
    </div>
  )
}
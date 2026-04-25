"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { RefreshCw, Loader2, Check, X, UserX } from 'lucide-react'
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
  subuh: boolean
  dhuhur: boolean
  ashar: boolean
  maghrib: boolean
  isya: boolean
}

interface SantriData {
  user_id: string
  nomor_absen: number
  users: { id: string; name: string; avatar_url: string | null }
  kelas: { id: string; name: string }
}

const ADZAN_TIMES = [
  { key: 'subuh', label: 'Subuh', icon: '🌅' },
  { key: 'dhuhur', label: 'Dhuhur', icon: '☀️' },
  { key: 'ashar', label: 'Ashar', icon: '🌤️' },
  { key: 'maghrib', label: 'Maghrib', icon: '🌇' },
  { key: 'isya', label: 'Isya', icon: '🌙' },
] as const

interface MuadzinSectionProps {
  schedule: ScheduleItem[]
  eligibleList: SantriData[]
  today: string
  canManage: boolean
  isGenerating: boolean
  isUpdatingAdzan: string | null
  onGenerate: () => void
  onToggleAdzan: (item: ScheduleItem, waktu: string) => void
  onToggleComplete: (item: ScheduleItem) => void
  onManageSantri: () => void
  getAvatarUrl: (avatar: string | null, name: string) => string
}

export function MuadzinSection({
  schedule,
  eligibleList,
  today,
  canManage,
  isGenerating,
  isUpdatingAdzan,
  onGenerate,
  onToggleAdzan,
  onToggleComplete,
  onManageSantri,
  getAvatarUrl,
}: MuadzinSectionProps) {
  const scheduleItems = schedule
    .filter(s => s.type === 'muadzin')
    .sort((a, b) => {
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

      {/* Jadwal Muadzin */}
      <Card className="bg-card/50 border-white/20 overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h3 className="font-semibold text-primary">Jadwal Muadzin</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Kelas 10 • 1 orang per hari • 5 waktu adzan
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary/20 border-b border-white/20">
                <tr>
                  <th className="px-3 py-3 text-left">#</th>
                  <th className="px-3 py-3 text-left">Tanggal</th>
                  <th className="px-3 py-3 text-left">Petugas</th>
                  <th className="px-3 py-3 text-left">Kelas</th>
                  <th className="px-3 py-3 text-left">Absen</th>
                  {ADZAN_TIMES.map((time) => (
                    <th key={time.key} className="px-2 py-3 text-center">
                      <span className="text-xs">{time.icon}</span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {scheduleItems.map((item, index) => {
                  const entryDate = new Date(item.schedule_date)
                  const isToday = item.schedule_date === today
                  const santriData = eligibleList.find(s => s.user_id === item.santri_id)
                  const isFirstActive = item.is_active && activeItems[0]?.id === item.id
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={cn(
                        'border-b border-white/10 transition-all',
                        isToday && item.is_active && 'bg-primary/10',
                        isFirstActive && 'border-l-4 border-l-green-500',
                        !item.is_active && 'opacity-50 bg-muted/20'
                      )}
                    >
                      <td className="px-3 py-3">
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs',
                          item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted/50 text-muted-foreground'
                        )}>
                          {index + 1}
                        </div>
                      </td>
                      
                      <td className="px-3 py-3">
                        <span className={cn(isToday && item.is_active && 'text-primary font-medium')}>
                          {entryDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                      
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border border-white/20">
                            <AvatarImage src={getAvatarUrl(santriData?.users?.avatar_url || null, item.santri_name)} />
                            <AvatarFallback className="text-xs">{item.santri_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className={cn('text-sm font-medium', !item.is_active && 'text-muted-foreground line-through')}>
                            {item.santri_name}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-3 py-3">
                        <Badge variant="outline" className="text-xs">Kelas {item.kelas_name}</Badge>
                      </td>
                      
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs">{item.nomor_absen}</span>
                      </td>
                      
                      {ADZAN_TIMES.map((time) => {
                        const isChecked = item[time.key as keyof Pick<ScheduleItem, 'subuh' | 'dhuhur' | 'ashar' | 'maghrib' | 'isya'>] as boolean
                        const isUpdating = isUpdatingAdzan === `${item.id}-${time.key}`
                        
                        return (
                          <td key={time.key} className="px-1 py-3 text-center">
                            <button
                              onClick={() => onToggleAdzan(item, time.key)}
                              disabled={isUpdating || !item.is_active}
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm',
                                isChecked 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30',
                                (!item.is_active || isUpdating) && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isChecked ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        )
                      })}
                      
                      {/* Tombol Selesai */}
                      <td className="px-3 py-3 text-center">
                        {item.is_active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleComplete(item)}
                            className="gap-1 text-xs"
                          >
                            <Check className="h-3 w-3" />
                            <span className="hidden sm:inline">Selesai</span>
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-xs">✅ Selesai</Badge>
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
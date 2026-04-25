"use client"

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { Sun, Moon, Mic, Loader2 } from 'lucide-react'
import { ImamSection } from '@/components/dakwah/imam-section'
import { MuadzinSection } from '@/components/dakwah/muadzin-section'
import { KultumSection } from '@/components/dakwah/kultum-section'
import { ManageSantriModal } from '@/components/dakwah/manage-santri-modal'

interface ScheduleItem {
  id: string
  type: 'imam' | 'muadzin' | 'kultum'
  schedule_date: string
  santri_id: string
  santri_name: string
  kelas_id: string | null
  kelas_name: string | null
  nomor_absen: number | null
  waktu: string | null
  is_active: boolean
  subuh: boolean
  dhuhur: boolean
  ashar: boolean
  maghrib: boolean
  isya: boolean
}

interface SantriData {
  user_id: string
  kelas_id: string
  nomor_absen: number
  users: { id: string; name: string; avatar_url: string | null }
  kelas: { id: string; name: string }
}

export default function DakwahPage() {
  const { user } = useApp()
  const [activeTab, setActiveTab] = useState('imam')
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [eligibleImam, setEligibleImam] = useState<SantriData[]>([])
  const [eligibleMuadzin, setEligibleMuadzin] = useState<SantriData[]>([])
  const [eligibleKultum, setEligibleKultum] = useState<SantriData[]>([])
  const [allImam, setAllImam] = useState<SantriData[]>([])
  const [allMuadzin, setAllMuadzin] = useState<SantriData[]>([])
  const [allKultum, setAllKultum] = useState<SantriData[]>([])
  const [disabledImamIds, setDisabledImamIds] = useState<string[]>([])
  const [disabledMuadzinIds, setDisabledMuadzinIds] = useState<string[]>([])
  const [disabledKultumIds, setDisabledKultumIds] = useState<string[]>([])
  const [today, setToday] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingAdzan, setIsUpdatingAdzan] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [selectedType, setSelectedType] = useState<'imam' | 'muadzin' | 'kultum'>('imam')

  const canManage = user?.role === 'admin' || user?.divisions?.includes('Dakwah')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dakwah')
      const result = await response.json()

      if (result.success) {
        setSchedule(result.data.schedule || [])
        setEligibleImam(result.data.eligible.imam || [])
        setEligibleMuadzin(result.data.eligible.muadzin || [])
        setEligibleKultum(result.data.eligible.kultum || [])
        setAllImam(result.data.allSantri?.imam || [])
        setAllMuadzin(result.data.allSantri?.muadzin || [])
        setAllKultum(result.data.allSantri?.kultum || [])
        setDisabledImamIds(result.data.disabledIds?.imam || [])
        setDisabledMuadzinIds(result.data.disabledIds?.muadzin || [])
        setDisabledKultumIds(result.data.disabledIds?.kultum || [])
        setToday(result.data.today)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAdzan = async (item: ScheduleItem, waktu: string) => {
    const key = `${item.id}-${waktu}`
    setIsUpdatingAdzan(key)

    try {
      const response = await fetch('/api/dakwah', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_adzan',
          schedule_id: item.id,
          waktu,
        }),
      })

      const result = await response.json()
      if (result.success) {
        await loadData()
      }
    } catch (error) {
      toast.error('Gagal update adzan')
    } finally {
      setIsUpdatingAdzan(null)
    }
  }

  const handleToggleComplete = async (item: ScheduleItem) => {
    setIsUpdatingAdzan(item.id)
    try {
      const response = await fetch('/api/dakwah', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_complete',
          schedule_id: item.id,
          completed: item.is_active,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(item.is_active ? 'Ditandai selesai' : 'Dikembalikan ke antrian')
        await loadData()
      }
    } catch (error) {
      toast.error('Gagal update status')
    } finally {
      setIsUpdatingAdzan(null)
    }
  }

  const handleGenerate = async (type: 'imam' | 'muadzin' | 'kultum') => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/dakwah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', type }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Jadwal ${type} berhasil dibuat`)
        await loadData()
      } else {
        toast.error(result.error || 'Gagal generate jadwal')
      }
    } catch (error) {
      toast.error('Gagal generate jadwal')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleDisable = async (santriId: string, santriName: string, type: string, currentlyDisabled: boolean) => {
    try {
      const response = await fetch('/api/dakwah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentlyDisabled ? 'enable' : 'disable',
          santri_id: santriId,
          type,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(currentlyDisabled ? `${santriName} diaktifkan` : `${santriName} dinonaktifkan`)
        await loadData()
      } else {
        toast.error(result.error || 'Gagal mengubah status')
      }
    } catch (error) {
      toast.error('Gagal mengubah status')
    }
  }

  const getAvatarUrl = (avatar: string | null, name: string) => {
    if (avatar) return avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
  }

  const getKelasColor = (kelasName: string) => {
    switch (kelasName) {
      case '12': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case '11': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case '10': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getTypeLabel = (type: string) => {
    if (type === 'imam') return 'Imam'
    if (type === 'muadzin') return 'Muadzin'
    return 'Kultum'
  }

  const getTypeDescription = (type: string) => {
    if (type === 'imam') return 'Kelas 11 & 12'
    if (type === 'muadzin') return 'Kelas 10'
    return 'Semua Kelas (Round-robin: 12 → 11 → 10)'
  }

  const getDisabledIds = (type: string) => {
    if (type === 'imam') return disabledImamIds
    if (type === 'muadzin') return disabledMuadzinIds
    return disabledKultumIds
  }

  const getAllSantri = (type: string) => {
    if (type === 'imam') return allImam
    if (type === 'muadzin') return allMuadzin
    return allKultum
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
            Dakwah
          </h1>
          <p className="text-muted-foreground">Jadwal Imam, Muadzin & Kultum</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'imam' | 'muadzin' | 'kultum')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/30 border border-white/20">
            <TabsTrigger value="imam" className="text-lg">
              <Sun className="h-4 w-4 mr-2" />
              Imam
            </TabsTrigger>
            <TabsTrigger value="muadzin" className="text-lg">
              <Moon className="h-4 w-4 mr-2" />
              Muadzin
            </TabsTrigger>
            <TabsTrigger value="kultum" className="text-lg">
              <Mic className="h-4 w-4 mr-2" />
              Kultum
            </TabsTrigger>
          </TabsList>

          <TabsContent value="imam" className="mt-6">
            <ImamSection
              schedule={schedule}
              eligibleList={eligibleImam}
              today={today}
              canManage={canManage}
              isGenerating={isGenerating}
              onGenerate={() => handleGenerate('imam')}
              onManageSantri={() => { setSelectedType('imam'); setShowDisableModal(true) }}
              getAvatarUrl={getAvatarUrl}
              getKelasColor={getKelasColor}
              isUpdating={isUpdatingAdzan}
              onToggleComplete={handleToggleComplete}
            />
          </TabsContent>

          <TabsContent value="muadzin" className="mt-6">
            <MuadzinSection
              schedule={schedule}
              eligibleList={eligibleMuadzin}
              today={today}
              canManage={canManage}
              isGenerating={isGenerating}
              isUpdatingAdzan={isUpdatingAdzan}
              onGenerate={() => handleGenerate('muadzin')}
              onToggleAdzan={handleToggleAdzan}
              onToggleComplete={handleToggleComplete}
              onManageSantri={() => { setSelectedType('muadzin'); setShowDisableModal(true) }}
              getAvatarUrl={getAvatarUrl}
            />
          </TabsContent>

          <TabsContent value="kultum" className="mt-6">
            <KultumSection
              schedule={schedule}
              eligibleList={eligibleKultum}
              today={today}
              canManage={canManage}
              isGenerating={isGenerating}
              isUpdating={isUpdatingAdzan}
              onGenerate={() => handleGenerate('kultum')}
              onToggleComplete={handleToggleComplete}
              onManageSantri={() => { setSelectedType('kultum'); setShowDisableModal(true) }}
              getAvatarUrl={getAvatarUrl}
              getKelasColor={getKelasColor}
            />
          </TabsContent>
        </Tabs>

        {/* Manage Santri Modal */}
        <ManageSantriModal
          open={showDisableModal}
          onOpenChange={setShowDisableModal}
          selectedType={selectedType}
          eligibleList={getAllSantri(selectedType)}
          disabledIds={getDisabledIds(selectedType)}
          onToggleDisable={(santriId, santriName, type, currentlyDisabled) =>
            handleToggleDisable(santriId, santriName, type, currentlyDisabled)
          }
          getAvatarUrl={getAvatarUrl}
          getTypeLabel={getTypeLabel}
          getTypeDescription={getTypeDescription}
        />
      </div>
    </MainLayout>
  )
}
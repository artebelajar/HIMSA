"use client"

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { Users, UserPlus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KelasTab } from '@/components/absensi/kelas-tab'
import { AddSantriModal } from '@/components/absensi/add-santri-modal'

interface Kelas {
  id: string
  name: string
}

interface KelasMember {
  id: string
  kelas_id: string
  user_id: string
  is_ketua: boolean
  nomor_absen: number | null
  users: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
}

interface Santri {
  id: string
  name: string
  email: string
  avatar_url?: string | null
}

export default function AbsensiPage() {
  const { user } = useApp()
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [members, setMembers] = useState<KelasMember[]>([])
  const [allSantri, setAllSantri] = useState<Santri[]>([])
  const [availableSantri, setAvailableSantri] = useState<Santri[]>([])
  const [activeTab, setActiveTab] = useState('10')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isSettingKetua, setIsSettingKetua] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState<string | null>(null)

  const canManage = user?.role === 'admin' || user?.divisions?.includes('Ketua')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/kelas')
      const result = await response.json()
      
      if (result.success) {
        setKelas(result.data.kelas || [])
        setMembers(result.data.members || [])
        setAllSantri(result.data.allSantri || [])
        setAvailableSantri(result.data.availableSantri || [])
        
        // Jangan reset activeTab, gunakan yang sudah ada
        if (result.data.kelas && result.data.kelas.length > 0 && !activeTab) {
          setActiveTab(result.data.kelas[0].name)
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getKelasMembers = (kelasId: string) => {
    return members
      .filter(m => m.kelas_id === kelasId)
      .sort((a, b) => (a.nomor_absen || 999) - (b.nomor_absen || 999))
  }

  const getKetua = (kelasId: string) => {
    return members.find(m => m.kelas_id === kelasId && m.is_ketua)
  }

  const handleAddSantri = async (santriId: string) => {
    if (!selectedKelas) return
    
    setIsAdding(true)
    try {
      const response = await fetch('/api/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelas_id: selectedKelas.id, user_id: santriId }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Santri berhasil ditambahkan')
        await loadData()
        setShowAddModal(false)
        // TETAP di tab yang sama
      } else {
        toast.error(result.error || 'Gagal menambahkan santri')
      }
    } catch (error) {
      toast.error('Gagal menambahkan santri')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Keluarkan ${memberName} dari kelas?`)) return
    
    setIsRemoving(memberId)
    try {
      const response = await fetch(`/api/kelas?id=${memberId}`, { method: 'DELETE' })
      const result = await response.json()
      
      if (result.success) {
        toast.success('Santri dikeluarkan dari kelas')
        await loadData()
      }
    } catch (error) {
      toast.error('Gagal mengeluarkan santri')
    } finally {
      setIsRemoving(null)
    }
  }

  const handleSetKetua = async (member: KelasMember) => {
    setIsSettingKetua(member.id)
    try {
      const response = await fetch('/api/kelas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_ketua',
          kelas_id: member.kelas_id,
          user_id: member.user_id,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`${member.users.name} menjadi ketua kelas`)
        await loadData()
      }
    } catch (error) {
      toast.error('Gagal mengubah ketua kelas')
    } finally {
      setIsSettingKetua(null)
    }
  }

  const handleMoveUp = async (member: KelasMember) => {
    if (member.nomor_absen && member.nomor_absen <= 1) {
      toast.info('Sudah di posisi paling atas')
      return
    }

    setIsMoving(member.id)
    try {
      const response = await fetch('/api/kelas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move_up', memberId: member.id }),
      })

      const result = await response.json()
      if (result.success) await loadData()
    } catch (error) {
      toast.error('Gagal mengubah urutan')
    } finally {
      setIsMoving(null)
    }
  }

  const handleMoveDown = async (member: KelasMember) => {
    const kelasMembers = getKelasMembers(member.kelas_id)
    const maxAbsen = Math.max(...kelasMembers.map(m => m.nomor_absen || 0))
    
    if ((member.nomor_absen || 0) >= maxAbsen) {
      toast.info('Sudah di posisi paling bawah')
      return
    }

    setIsMoving(member.id)
    try {
      const response = await fetch('/api/kelas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move_down', memberId: member.id }),
      })

      const result = await response.json()
      if (result.success) await loadData()
    } catch (error) {
      toast.error('Gagal mengubah urutan')
    } finally {
      setIsMoving(null)
    }
  }

  const getKelasColor = (kelasName: string) => {
    switch (kelasName) {
      case '12': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case '11': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case '10': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getAvatarUrl = (avatar: string | null, name: string) => {
    if (avatar) return avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
  }

  const getTotalSantri = () => allSantri.length
  const getAssignedSantri = () => members.length
  const getUnassignedSantri = () => allSantri.length - members.length

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Absensi & Kelas
          </h1>
          <p className="text-muted-foreground">Kelola santri per kelas, nomor absen, dan tunjuk ketua kelas</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-white/20 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <p className="text-2xl font-bold">{getTotalSantri()}</p>
                <p className="text-xs text-muted-foreground">Total Santri</p>
              </div>
            </div>
          </Card>
          <Card className="bg-card/50 border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{getAssignedSantri()}</p>
                <p className="text-xs text-muted-foreground">Sudah Masuk Kelas</p>
              </div>
            </div>
          </Card>
          <Card className="bg-card/50 border-yellow-500/30 p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{getUnassignedSantri()}</p>
                <p className="text-xs text-muted-foreground">Belum Masuk Kelas</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/30 border border-white/20">
            {kelas.map((k) => (
              <TabsTrigger key={k.id} value={k.name} className="text-lg font-semibold">
                Kelas {k.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {kelas.map((k) => (
            <TabsContent key={k.id} value={k.name} className="mt-6">
              <KelasTab
                kelasId={k.id}
                kelasName={k.name}
                members={getKelasMembers(k.id)}
                canManage={canManage}
                isMoving={isMoving}
                isRemoving={isRemoving}
                isSettingKetua={isSettingKetua}
                onAddSantri={() => { setSelectedKelas(k); setShowAddModal(true) }}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onSetKetua={handleSetKetua}
                onRemoveMember={handleRemoveMember}
                getKelasColor={getKelasColor}
                getAvatarUrl={getAvatarUrl}
                getKetua={() => getKetua(k.id)}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Add Santri Modal */}
        <AddSantriModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          selectedKelas={selectedKelas}
          availableSantri={availableSantri}
          isAdding={isAdding}
          onAddSantri={handleAddSantri}
          getAvatarUrl={getAvatarUrl}
          totalSantri={allSantri.length}
        />
      </div>
    </MainLayout>
  )
}
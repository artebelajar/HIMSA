"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Users, UserPlus, Crown, Loader2, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface KelasTabProps {
  kelasId: string
  kelasName: string
  members: KelasMember[]
  canManage: boolean
  isMoving: string | null
  isRemoving: string | null
  isSettingKetua: string | null
  onAddSantri: () => void
  onMoveUp: (member: KelasMember) => void
  onMoveDown: (member: KelasMember) => void
  onSetKetua: (member: KelasMember) => void
  onRemoveMember: (memberId: string, memberName: string) => void
  getKelasColor: (kelasName: string) => string
  getAvatarUrl: (avatar: string | null, name: string) => string
  getKetua: () => KelasMember | undefined
}

export function KelasTab({
  kelasId,
  kelasName,
  members,
  canManage,
  isMoving,
  isRemoving,
  isSettingKetua,
  onAddSantri,
  onMoveUp,
  onMoveDown,
  onSetKetua,
  onRemoveMember,
  getKelasColor,
  getAvatarUrl,
  getKetua,
}: KelasTabProps) {
  const ketua = getKetua()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/50 border-white/20 p-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-sm text-muted-foreground">Total Santri</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-card/50 border-white/20 p-6">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-lg font-bold truncate">{ketua?.users?.name || 'Belum ada'}</p>
              <p className="text-sm text-muted-foreground">Ketua Kelas</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-card/50 border-white/20 overflow-hidden">
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <h3 className="font-semibold text-primary">Daftar Santri Kelas {kelasName}</h3>
          {canManage && (
            <Button size="sm" onClick={onAddSantri} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Tambah Santri
            </Button>
          )}
        </div>
        
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Belum ada santri di kelas ini</p>
            {canManage && (
              <Button variant="outline" className="mt-4" onClick={onAddSantri}>
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Santri
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {members.map((member, index) => (
              <div key={member.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition">
                <div className="flex items-center gap-4">
                  {/* Nomor Absen */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border font-bold text-lg",
                    getKelasColor(kelasName)
                  )}>
                    {member.nomor_absen || index + 1}
                  </div>
                  
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 border-2 border-primary/30">
                    <AvatarImage src={getAvatarUrl(member.users.avatar_url, member.users.name)} />
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {member.users.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.users.name}</p>
                      {member.is_ketua && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Crown className="h-3 w-3 mr-1" />
                          Ketua
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.users.email}</p>
                  </div>
                </div>
                
                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveUp(member)}
                      disabled={isMoving === member.id || (member.nomor_absen || 0) <= 1}
                      className="text-muted-foreground hover:text-primary"
                      title="Naikkan"
                    >
                      {isMoving === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveDown(member)}
                      disabled={isMoving === member.id}
                      className="text-muted-foreground hover:text-primary"
                      title="Turunkan"
                    >
                      {isMoving === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {!member.is_ketua && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetKetua(member)}
                        disabled={isSettingKetua === member.id}
                        className="text-yellow-400 hover:text-yellow-300"
                        title="Jadikan Ketua Kelas"
                      >
                        {isSettingKetua === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Crown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMember(member.id, member.users.name)}
                      disabled={isRemoving === member.id}
                      className="text-red-400 hover:text-red-300"
                      title="Keluarkan dari Kelas"
                    >
                      {isRemoving === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
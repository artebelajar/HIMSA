"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserPlus } from 'lucide-react'

interface Santri {
  id: string
  name: string
  email: string
  avatar_url?: string | null
}

interface AddSantriModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedKelas: { id: string; name: string } | null
  availableSantri: Santri[]
  isAdding: boolean
  onAddSantri: (santriId: string) => void
  getAvatarUrl: (avatar: string | null, name: string) => string
  totalSantri: number
}

export function AddSantriModal({
  open,
  onOpenChange,
  selectedKelas,
  availableSantri,
  isAdding,
  onAddSantri,
  getAvatarUrl,
  totalSantri,
}: AddSantriModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/20 max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            Tambah Santri ke Kelas {selectedKelas?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {availableSantri.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Semua santri sudah masuk kelas</p>
              <p className="text-xs text-muted-foreground mt-2">
                Total {totalSantri} santri sudah terdaftar
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {availableSantri.length} santri belum masuk kelas
              </p>
              <div className="space-y-2">
                {availableSantri.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onAddSantri(s.id)}
                    disabled={isAdding}
                    className="w-full p-3 flex items-center justify-between rounded-lg border border-white/10 hover:bg-white/5 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getAvatarUrl(s.avatar_url || null, s.name)} />
                        <AvatarFallback className="text-xs">{s.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                    <UserPlus className="h-4 w-4 text-green-400" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
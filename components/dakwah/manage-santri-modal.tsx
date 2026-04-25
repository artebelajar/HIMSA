"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { UserCheck, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SantriData {
  user_id: string
  kelas_id: string
  nomor_absen: number
  users: { id: string; name: string; avatar_url: string | null }
  kelas: { id: string; name: string }
}

interface ManageSantriModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedType: 'imam' | 'muadzin' | 'kultum'
  eligibleList: SantriData[]
  disabledIds: string[]
  onToggleDisable: (santriId: string, santriName: string, type: string, currentlyDisabled: boolean) => void
  getAvatarUrl: (avatar: string | null, name: string) => string
  getTypeLabel: (type: string) => string
  getTypeDescription: (type: string) => string
}

export function ManageSantriModal({
  open,
  onOpenChange,
  selectedType,
  eligibleList,
  disabledIds,
  onToggleDisable,
  getAvatarUrl,
  getTypeLabel,
  getTypeDescription,
}: ManageSantriModalProps) {
  const isDisabled = (santriId: string) => disabledIds.includes(santriId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/20 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            Kelola Santri - {getTypeLabel(selectedType)}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {getTypeDescription(selectedType)}
            <br />
            Nonaktifkan santri yang tidak ingin diikutsertakan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {eligibleList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Tidak ada santri</p>
          ) : (
            <div className="space-y-2">
              {eligibleList.map((santri) => {
                const isSantriDisabled = isDisabled(santri.user_id)
                
                return (
                  <div 
                    key={santri.user_id} 
                    className={cn(
                      'p-3 rounded-lg border flex items-center justify-between transition-all',
                      isSantriDisabled 
                        ? 'border-red-500/50 bg-red-500/10' 
                        : 'border-white/10 hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-white/20">
                        <AvatarImage src={getAvatarUrl(santri.users.avatar_url, santri.users.name)} />
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                          {santri.users.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{santri.users.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Kelas {santri.kelas.name}</span>
                          <span>•</span>
                          <span>No. Absen {santri.nomor_absen}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant={isSantriDisabled ? 'default' : 'destructive'}
                      size="sm"
                      onClick={() => onToggleDisable(santri.user_id, santri.users.name, selectedType, isSantriDisabled)}
                      className={cn('min-w-24', isSantriDisabled && 'bg-green-500 hover:bg-green-600')}
                    >
                      {isSantriDisabled ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Aktifkan
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Nonaktifkan
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
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
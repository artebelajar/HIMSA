"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Layers, Loader2, Edit2, Save, X } from 'lucide-react'

interface Division {
  id: string; name: string; description: string | null; color: string; is_active: boolean
}

interface DivisionsSectionProps {
  divisionsData: Division[]
  isLoadingDivisions: boolean
  showAddDivision: boolean
  newDivision: { name: string; description: string; color: string }
  editingDivision: Division | null
  onShowAddDivision: (show: boolean) => void
  onNewDivisionChange: (data: { name: string; description: string; color: string }) => void
  onAddDivision: () => void
  onEditDivision: (division: Division) => void
  onUpdateDivision: () => void
  onCancelEdit: () => void
  onToggleStatus: (division: Division) => void
}

export function DivisionsSection({
  divisionsData,
  isLoadingDivisions,
  showAddDivision,
  newDivision,
  editingDivision,
  onShowAddDivision,
  onNewDivisionChange,
  onAddDivision,
  onEditDivision,
  onUpdateDivision,
  onCancelEdit,
  onToggleStatus,
}: DivisionsSectionProps) {
  return (
    <Card className="bg-card/50 border-green-500/30 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2"><Layers className="h-5 w-5 text-green-400" /><h3 className="font-semibold text-foreground">Manajemen Divisi</h3></div>
        <Button size="sm" onClick={() => onShowAddDivision(true)} className="sm:w-auto"><Plus className="h-4 w-4 mr-1" />Tambah Divisi</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Tambah, edit, atau nonaktifkan divisi.</p>

      {isLoadingDivisions ? (
        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {divisionsData.map((division) => (
            <Card key={division.id} className="bg-muted/30 border-white/10 p-4">
              {editingDivision?.id === division.id ? (
                <div className="space-y-3">
                  <Input value={editingDivision.name} onChange={(e) => onEditDivision({ ...editingDivision, name: e.target.value })} placeholder="Nama divisi" className="bg-input/50 border-white/20" />
                  <Input value={editingDivision.description || ''} onChange={(e) => onEditDivision({ ...editingDivision, description: e.target.value })} placeholder="Deskripsi" className="bg-input/50 border-white/20" />
                  <div className="flex items-center gap-2">
                    <input type="color" value={editingDivision.color} onChange={(e) => onEditDivision({ ...editingDivision, color: e.target.value })} className="w-12 h-8 rounded cursor-pointer" />
                    <span className="text-xs text-muted-foreground">Warna</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={onUpdateDivision}><Save className="h-4 w-4 mr-1" />Simpan</Button>
                    <Button size="sm" variant="ghost" onClick={onCancelEdit}><X className="h-4 w-4" />Batal</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: division.color }} />
                    <div>
                      <p className="font-semibold">{division.name}</p>
                      {division.description && <p className="text-xs text-muted-foreground">{division.description}</p>}
                    </div>
                    {!division.is_active && <Badge variant="secondary" className="text-xs">Nonaktif</Badge>}
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button size="sm" variant="ghost" onClick={() => onEditDivision(division)}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => onToggleStatus(division)} className={division.is_active ? 'text-yellow-400' : 'text-green-400'}>{division.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Division Modal */}
      {showAddDivision && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-card border-white/20 max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-primary">Tambah Divisi Baru</h3>
            <div className="space-y-3">
              <Input placeholder="Nama divisi" value={newDivision.name} onChange={(e) => onNewDivisionChange({ ...newDivision, name: e.target.value })} className="bg-input/50 border-white/20" />
              <Input placeholder="Deskripsi (opsional)" value={newDivision.description} onChange={(e) => onNewDivisionChange({ ...newDivision, description: e.target.value })} className="bg-input/50 border-white/20" />
              <div className="flex items-center gap-2">
                <input type="color" value={newDivision.color} onChange={(e) => onNewDivisionChange({ ...newDivision, color: e.target.value })} className="w-12 h-8 rounded cursor-pointer" />
                <span className="text-xs text-muted-foreground">Warna</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => onShowAddDivision(false)}>Batal</Button>
              <Button className="flex-1 bg-primary" onClick={onAddDivision}>Tambah</Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}
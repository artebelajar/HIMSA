"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, Loader2 } from 'lucide-react'

interface QuoteFormProps {
  form: { content: string; division: string }
  saving: boolean
  isEditing: boolean
  divisions: string[]
  onFormChange: (form: any) => void
  onSave: () => void
  onCancel: () => void
}

export function QuoteForm({
  form, saving, isEditing, divisions, onFormChange, onSave, onCancel,
}: QuoteFormProps) {
  return (
    <Card className="p-6 bg-card/50 border-white/20">
      <h2 className="text-lg font-bold mb-4 text-primary">{isEditing ? 'Edit Quote' : 'Tulis Quote Baru'}</h2>
      <div className="space-y-4">
        <div>
          <Label>Divisi</Label>
          <Select value={form.division} onValueChange={(v) => onFormChange({ ...form, division: v })}>
            <SelectTrigger className="mt-2 bg-input/50 border-white/20"><SelectValue placeholder="Pilih Divisi" /></SelectTrigger>
            <SelectContent>{divisions.map((div) => <SelectItem key={div} value={div}>{div}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Quote</Label>
          <Textarea placeholder="Tulis quote..." value={form.content} onChange={(e) => onFormChange({ ...form, content: e.target.value })} className="w-full h-32 mt-2 bg-input/50 border-white/20 resize-none" />
        </div>
        <div className="flex gap-2 justify-end">
          {isEditing && <Button variant="ghost" onClick={onCancel}><X className="h-4 w-4 mr-2" />Batal</Button>}
          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isEditing ? 'Update' : 'Publikasi'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
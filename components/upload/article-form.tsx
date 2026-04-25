"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, Loader2, Link, FolderOpen } from 'lucide-react'

interface ArticleFormProps {
  form: { title: string; content: string; image_url: string; division: string }
  imageMode: 'url' | 'upload'
  uploading: boolean
  saving: boolean
  isEditing: boolean
  divisions: string[]
  onFormChange: (form: any) => void
  onImageModeChange: (mode: 'url' | 'upload') => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSave: () => void
  onCancel: () => void
}

export function ArticleForm({
  form, imageMode, uploading, saving, isEditing, divisions,
  onFormChange, onImageModeChange, onUpload, onSave, onCancel,
}: ArticleFormProps) {
  return (
    <Card className="p-6 bg-card/50 border-white/20">
      <h2 className="text-lg font-bold mb-4 text-primary">{isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru'}</h2>
      <div className="space-y-4">
        <div>
          <Label>Judul</Label>
          <Input placeholder="Masukkan judul artikel..." value={form.title} onChange={(e) => onFormChange({ ...form, title: e.target.value })} className="mt-2 bg-input/50 border-white/20" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Divisi</Label>
            <Select value={form.division} onValueChange={(v) => onFormChange({ ...form, division: v })}>
              <SelectTrigger className="mt-2 bg-input/50 border-white/20"><SelectValue placeholder="Pilih Divisi" /></SelectTrigger>
              <SelectContent>{divisions.map((div) => <SelectItem key={div} value={div}>{div}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Gambar</Label>
            <div className="flex gap-2 mt-2">
              <Button type="button" variant={imageMode === 'url' ? 'default' : 'outline'} size="sm" onClick={() => onImageModeChange('url')}><Link className="h-4 w-4 mr-1" />URL</Button>
              <Button type="button" variant={imageMode === 'upload' ? 'default' : 'outline'} size="sm" onClick={() => onImageModeChange('upload')}><FolderOpen className="h-4 w-4 mr-1" />Upload</Button>
            </div>
          </div>
        </div>

        {imageMode === 'url' ? (
          <div>
            <Label>URL Gambar</Label>
            <Input placeholder="https://..." value={form.image_url} onChange={(e) => onFormChange({ ...form, image_url: e.target.value })} className="mt-2 bg-input/50 border-white/20" />
          </div>
        ) : (
          <div>
            <Label>Upload Gambar (max 5MB)</Label>
            <div className="mt-2">
              <input type="file" accept="image/*" onChange={onUpload} className="hidden" id="article-image-upload" />
              <Button type="button" variant="outline" onClick={() => document.getElementById('article-image-upload')?.click()} disabled={uploading} className="w-full border-dashed">
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {form.image_url ? 'Gambar terpilih' : 'Pilih Gambar'}
              </Button>
              {form.image_url && (
                <div className="mt-2 relative">
                  <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-white/20" />
                  <button onClick={() => onFormChange({ ...form, image_url: '' })} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full"><X className="h-3 w-3 text-white" /></button>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <Label>Konten</Label>
          <Textarea placeholder="Tulis konten artikel..." value={form.content} onChange={(e) => onFormChange({ ...form, content: e.target.value })} className="w-full h-40 mt-2 bg-input/50 border-white/20 resize-none" />
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
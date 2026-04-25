"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useApp } from '@/providers/app-provider'
import { BookOpen, Edit2, Save, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface HafalanData {
  id: string
  content: string
  language: 'arabic' | 'english'
  week_number: number
  year: number
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export function HafalanSection() {
  const { user } = useApp()
  const [hafalan, setHafalan] = useState<HafalanData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editLanguage, setEditLanguage] = useState<'arabic' | 'english'>('arabic')

  const canEdit = user?.role === 'admin' || user?.divisions?.includes('Dakwah')

  useEffect(() => {
    loadHafalan()
  }, [])

  const loadHafalan = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/hafalan')
      const result = await response.json()
      if (result.success) setHafalan(result.data)
    } catch (error) {
      console.error('Failed to load hafalan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    if (hafalan) {
      setEditContent(hafalan.content)
      setEditLanguage(hafalan.language)
    } else {
      setEditContent('')
      setEditLanguage('arabic')
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditContent('')
  }

  const handleSave = async () => {
    if (!editContent.trim()) {
      toast.error('Hafalan tidak boleh kosong')
      return
    }

    if (!user) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/hafalan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent.trim(),
          language: editLanguage,
          user_id: user.id,
          user_name: user.name,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Hafalan mingguan berhasil disimpan')
        setHafalan(result.data)
        setIsEditing(false)
      } else {
        toast.error(result.error || 'Gagal menyimpan hafalan')
      }
    } catch (error) {
      toast.error('Gagal menyimpan hafalan')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 mb-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <BookOpen className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-amber-400">Hafalan Mingguan</h3>
            <p className="text-xs text-muted-foreground">
              {hafalan ? (
                <>
                  {hafalan.language === 'arabic' ? 'Bahasa Arab' : 'English'} •
                  Minggu ke-{hafalan.week_number}, {hafalan.year} •
                  Oleh: {hafalan.created_by_name}
                </>
              ) : (
                'Belum ada hafalan minggu ini'
              )}
            </p>
          </div>
        </div>
        {canEdit && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-9 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            {hafalan ? 'Edit' : 'Tambah'}
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-32 bg-background/50 border-amber-500/30 focus:border-amber-500 resize-y text-center"
            placeholder="Masukkan hafalan... (Bisa pakai Enter untuk baris baru)"
            rows={6}
          />
          <div className="flex items-center gap-2">
            <select
              value={editLanguage}
              onChange={(e) => setEditLanguage(e.target.value as 'arabic' | 'english')}
              className="px-3 py-2 rounded-lg bg-background/50 border border-amber-500/30 text-sm"
            >
              <option value="arabic">Bahasa Arab</option>
              <option value="english">English</option>
            </select>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={handleCancel} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" /> Batal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-white">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Simpan</>}
            </Button>
          </div>
        </div>
      ) : hafalan ? (
        <div className={cn(
          'p-4 rounded-lg text-center',
          hafalan.language === 'arabic'
            ? 'text-2xl font-bold text-amber-300 leading-relaxed'
            : 'text-lg text-amber-200'
        )}>
          <p className="whitespace-pre-wrap">{hafalan.content}</p>
        </div>
      ) : (
        <div className="p-4 rounded-lg text-center">
          <p className="text-muted-foreground text-sm">
            {canEdit ? 'Klik tombol Tambah untuk menambahkan hafalan minggu ini' : 'Belum ada hafalan untuk minggu ini'}
          </p>
        </div>
      )}
    </Card>
  )
}
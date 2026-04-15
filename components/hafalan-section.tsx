'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApp } from '@/providers/app-provider'
import { BookOpen, Edit2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface HafalanData {
  text: string
  language: 'arabic' | 'english'
  updatedBy: string
  updatedAt: string
}

export function HafalanSection() {
  const { user } = useApp()
  const [hafalan, setHafalan] = useState<HafalanData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [editLang, setEditLang] = useState<'arabic' | 'english'>('arabic')

  useEffect(() => {
    const saved = localStorage.getItem('himsa_hafalan')
    if (saved) {
      setHafalan(JSON.parse(saved))
    } else {
      const defaultHafalan: HafalanData = {
        text: 'Bismillaah illaahi laa tafsaa...',
        language: 'arabic',
        updatedBy: 'Admin HIMSA',
        updatedAt: new Date().toISOString(),
      }
      setHafalan(defaultHafalan)
      localStorage.setItem('himsa_hafalan', JSON.stringify(defaultHafalan))
    }
  }, [])

  const canEdit = user?.role === 'admin' || user?.division === 'Dakwah'

  const handleEdit = () => {
    if (hafalan) {
      setEditText(hafalan.text)
      setEditLang(hafalan.language)
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (!editText.trim()) {
      toast.error('Hafalan tidak boleh kosong')
      return
    }

    const updated: HafalanData = {
      text: editText,
      language: editLang,
      updatedBy: user?.name || 'Unknown',
      updatedAt: new Date().toISOString(),
    }

    setHafalan(updated)
    localStorage.setItem('himsa_hafalan', JSON.stringify(updated))
    setIsEditing(false)
    toast.success('Hafalan mingguan diperbarui')
  }

  if (!hafalan) return null

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
              {hafalan.language === 'arabic' ? 'Bahasa Arab' : 'English'} • Diperbarui oleh {hafalan.updatedBy}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={isEditing ? handleSave : handleEdit}
            className="h-9"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-1" />
                Simpan
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </>
            )}
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-32 p-3 rounded-lg bg-background/50 border border-border text-sm resize-none focus:outline-none focus:border-primary"
            placeholder="Masukkan hafalan..."
          />
          <div className="flex items-center gap-2">
            <select
              value={editLang}
              onChange={(e) => setEditLang(e.target.value as 'arabic' | 'english')}
              className="px-3 py-2 rounded-lg bg-background/50 border border-border text-sm"
            >
              <option value="arabic">Bahasa Arab</option>
              <option value="english">English</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn(
          'p-4 rounded-lg text-center',
          hafalan.language === 'arabic'
            ? 'text-xl font-bold text-amber-300 font-arabic'
            : 'text-lg text-amber-200'
        )}>
          {hafalan.text}
        </div>
      )}
    </Card>
  )
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}

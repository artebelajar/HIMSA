"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

interface PosterListProps {
  posters: Post[]
  userId?: string
  onEdit: (poster: Post) => void
  onDelete: (id: string) => void
}

export function PosterList({ posters, userId, onEdit, onDelete }: PosterListProps) {
  const myPosters = posters.filter(p => p.author_id === userId)

  const getAspectClass = (ratio: string | null) => {
    if (ratio === '9:16') return 'aspect-[9/16]'
    if (ratio === '16:9') return 'aspect-[16/9]'
    return 'aspect-square'
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-primary mb-4">Poster Saya ({myPosters.length})</h2>
      {myPosters.length === 0 ? (
        <Card className="p-6 text-center bg-card/50 border-white/20">
          <p className="text-muted-foreground">Belum ada poster</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {myPosters.map((poster) => (
            <Card key={poster.id} className="overflow-hidden bg-card/50 border-white/20 group">
              {poster.image_url && (
                <div className="relative">
                  <img src={poster.image_url} alt={poster.title || ''} className={cn('w-full object-cover', getAspectClass(poster.aspect_ratio))} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(poster)} className="bg-black/50 hover:bg-black/70"><Edit2 className="h-4 w-4 text-white" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(poster.id)} className="bg-black/50 hover:bg-black/70"><Trash2 className="h-4 w-4 text-red-400" /></Button>
                  </div>
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium line-clamp-1">{poster.title}</p>
                <p className="text-xs text-muted-foreground">{poster.division}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
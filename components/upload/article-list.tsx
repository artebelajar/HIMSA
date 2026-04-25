"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import type { Post } from '@/lib/types'

interface ArticleListProps {
  articles: Post[]
  userId?: string
  onEdit: (article: Post) => void
  onDelete: (id: string) => void
}

export function ArticleList({ articles, userId, onEdit, onDelete }: ArticleListProps) {
  const myArticles = articles.filter(a => a.author_id === userId)

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-primary">Artikel Saya ({myArticles.length})</h2>
      {myArticles.length === 0 ? (
        <Card className="p-6 text-center bg-card/50 border-white/20">
          <p className="text-muted-foreground">Belum ada artikel</p>
        </Card>
      ) : (
        myArticles.map((article) => (
          <Card key={article.id} className="p-4 bg-card/50 border-white/20 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{article.title}</h3>
              <p className="text-xs text-muted-foreground">{article.division} • {new Date(article.created_at).toLocaleDateString('id-ID')}</p>
            </div>
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => onEdit(article)}><Edit2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => onDelete(article.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
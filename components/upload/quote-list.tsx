"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import type { Post } from '@/lib/types'

interface QuoteListProps {
  quotes: Post[]
  userId?: string
  onEdit: (quote: Post) => void
  onDelete: (id: string) => void
}

const QUOTE_COLORS = [
  'from-cyan-500/10 to-blue-500/10 border-cyan-500/50',
  'from-purple-500/10 to-pink-500/10 border-purple-500/50',
  'from-green-500/10 to-emerald-500/10 border-green-500/50',
  'from-orange-500/10 to-red-500/10 border-orange-500/50',
  'from-indigo-500/10 to-cyan-500/10 border-indigo-500/50',
]

export function QuoteList({ quotes, userId, onEdit, onDelete }: QuoteListProps) {
  const myQuotes = quotes.filter(q => q.author_id === userId)

  return (
    <div>
      <h2 className="text-lg font-bold text-primary mb-4">Quote Saya ({myQuotes.length})</h2>
      {myQuotes.length === 0 ? (
        <Card className="p-6 text-center bg-card/50 border-white/20">
          <p className="text-muted-foreground">Belum ada quote</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {myQuotes.map((quote, i) => (
            <Card key={quote.id} className={`p-4 border-l-4 bg-gradient-to-br ${QUOTE_COLORS[i % QUOTE_COLORS.length]}`}>
              <p className="text-sm italic mb-3">{quote.content}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{quote.division}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(quote)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-400" onClick={() => onDelete(quote.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
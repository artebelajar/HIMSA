"'use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Post {
  id: string
  title: string | null
  content: string | null
  image_url: string | null
  division: string
  author_name: string
  likes_count: number
  created_at: string
  liked?: boolean
}

interface ArticleDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: Post | null
  onLike: (id: string) => void
}

export function ArticleDetailModal({
  open,
  onOpenChange,
  article,
  onLike,
}: ArticleDetailModalProps) {
  if (!article) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-white/20 backdrop-blur-xl">
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl font-orbitron text-primary">
            {article.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {article.image_url && (
            <img
              src={article.image_url}
              alt={article.title || ''}
              className="w-full h-80 object-cover rounded-xl border border-white/20"
            />
          )}

          <div className="flex items-center justify-between px-1">
            <div className="flex gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Divisi</span>
                <span className="text-primary font-semibold">{article.division}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Oleh</span>
                <span className="font-semibold text-foreground">{article.author_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Tanggal</span>
                <span className="font-semibold text-foreground">
                  {new Date(article.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onLike(article.id)}
              className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
            >
              <Heart
                className={cn('h-5 w-5', {
                  'fill-current': article.liked,
                })}
              />
            </Button>
          </div>

          <div className="h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

          <div className="prose prose-invert max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {article.content}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-white/20">
            <Heart
              className={cn('h-5 w-5', {
                'fill-red-500 text-red-500': article.liked,
                'text-muted-foreground': !article.liked,
              })}
            />
            <span className="text-sm text-muted-foreground">
              {article.likes_count} orang menyukai artikel ini
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Heart, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ArticleDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: {
    id: string
    title: string
    content: string
    image: string
    division: string
    author: string
    likes: number
    liked: boolean
    createdAt: string
  } | null
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
          {/* Featured Image */}
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-80 object-cover rounded-xl border border-white/20"
          />

          {/* Metadata */}
          <div className="flex items-center justify-between px-1">
            <div className="flex gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Divisi</span>
                <span className="text-primary font-semibold">{article.division}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Oleh</span>
                <span className="font-semibold text-foreground">{article.author}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Tanggal</span>
                <span className="font-semibold text-foreground">
                  {new Date(article.createdAt).toLocaleDateString('id-ID', {
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
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Heart
                className={cn('h-5 w-5', {
                  'fill-current': article.liked,
                })}
              />
            </Button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {article.content}
            </p>
          </div>

          {/* Like Section */}
          <div className="flex items-center gap-2 pt-4 border-t border-white/20">
            <Heart
              className={cn('h-5 w-5', {
                'fill-destructive text-destructive': article.liked,
                'text-muted-foreground': !article.liked,
              })}
            />
            <span className="text-sm text-muted-foreground">
              {article.likes} orang menyukai artikel ini
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

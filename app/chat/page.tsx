"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { Send, Loader2, Trash2, Reply, Smile, X, Edit2, Check, CornerDownRight, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  sender_avatar: string | null
  reply_to_id: string | null
  created_at: string
  updated_at?: string
  reactions: Record<string, { count: number; users: string[] }>
  reply_count: number
}

const EMOJIS = ['👍', '❤️', '😆', '😮', '😢', '🔥']
const MESSAGES_PER_PAGE = 20

export default function ChatPage() {
  const { user } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  
  // Ref untuk container scroll dan titik akhir
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  // Fungsi Scroll ke Bawah
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    loadMessages()
    setupRealtime()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  const setupRealtime = () => {
    channelRef.current = supabase
      .channel('chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, { ...newMessage, reactions: {}, reply_count: 0 }])
          // Scroll otomatis saat ada pesan masuk
          setTimeout(() => scrollToBottom('smooth'), 100)
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updated = payload.new as Message
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, content: updated.content } : m))
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id))
        }
      )
      .subscribe()
  }

  const loadMessages = async (before?: string) => {
    try {
      const url = new URL('/api/messages', window.location.origin)
      url.searchParams.set('limit', String(MESSAGES_PER_PAGE))
      if (before) url.searchParams.set('before', before)

      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        const newMessages = result.data.messages
        if (before) {
          // Jika load older messages, jangan scroll ke bawah otomatis
          setMessages(prev => [...newMessages, ...prev])
        } else {
          setMessages(newMessages)
          // Scroll ke bawah saat pertama kali load (instant tanpa animasi)
          setTimeout(() => scrollToBottom('auto'), 100)
        }
        setHasMore(result.data.hasMore)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMore = () => {
    const oldest = messages[0]
    if (oldest && !isLoadingMore) {
      setIsLoadingMore(true)
      loadMessages(oldest.created_at)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending || !user) return

    setIsSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputValue.trim(),
          reply_to_id: replyingTo?.id || null,
          sender_id: user.id,
          sender_name: user.name,
          sender_avatar: user.avatar || null,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setInputValue('')
        setReplyingTo(null)
        // Scroll ke bawah setelah mengirim pesan
        setTimeout(() => scrollToBottom('smooth'), 100)
      } else {
        toast.error('Gagal mengirim pesan')
      }
    } catch (error) {
      toast.error('Gagal mengirim pesan')
    } finally {
      setIsSending(false)
    }
  }

  // ... (handleUpdateMessage, handleDeleteMessage, handleToggleReaction tetap sama)
  const handleUpdateMessage = async () => {
    if (!editContent.trim() || !editingMessage) return
    setIsEditing(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: editingMessage.id, content: editContent.trim(), user_id: user?.id }),
      })
      const result = await response.json()
      if (result.success) { toast.success('Pesan diperbarui'); setEditingMessage(null); setEditContent('') }
      else toast.error('Gagal')
    } catch (error) { toast.error('Gagal') } finally { setIsEditing(false) }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return
    if (!confirm('Hapus pesan ini?')) return
    try {
      await fetch(`/api/messages?id=${messageId}&userId=${user.id}`, { method: 'DELETE' })
      toast.success('Pesan dihapus')
    } catch (error) { toast.error('Gagal') }
  }

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return
    try {
      await fetch('/api/messages', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_reaction', message_id: messageId, user_id: user.id, emoji }),
      })
    } catch (error) { console.error('Reaction error:', error) }
  }

  const getAvatarUrl = (avatar: string | null, name: string) => {
    if (avatar) return avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    return isToday
      ? date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const MessageBubble = ({ message }: { message: Message }) => {
    const isOwn = message.sender_id === user?.id
    const replyToMessage = message.reply_to_id
      ? messages.find(m => m.id === message.reply_to_id)
      : null

    return (
      <div className="group relative py-2 px-1 rounded-lg transition-all duration-200 hover:bg-white/5">
        {replyToMessage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 ml-12">
            <CornerDownRight className="h-3 w-3" />
            <span>Membalas <span className="font-medium text-primary">{replyToMessage.sender_name}</span></span>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-background">
            <AvatarImage src={getAvatarUrl(message.sender_avatar, message.sender_name)} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
              {message.sender_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{message.sender_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatTime(message.created_at)}
                {message.updated_at && message.updated_at !== message.created_at && (
                  <span className="ml-1 italic">(diedit)</span>
                )}
              </span>
            </div>

            <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>

            {/* Reactions */}
            {Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(message.reactions).map(([emoji, data]) => (
                  <button key={emoji} onClick={() => handleToggleReaction(message.id, emoji)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all hover:scale-105",
                      data.users.includes(user?.id || '') ? "bg-primary/20 border-primary text-primary" : "bg-muted/50 border-white/10 hover:bg-muted"
                    )}>
                    <span>{emoji}</span> <span>{data.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Aksi Pesan */}
            <div className="flex items-center gap-3 mt-1.5">
              <button onClick={() => setReplyingTo(message)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <Reply className="h-3 w-3" /> Balas
              </button>
              
              {/* Tampilan "x balasan" */}
              {message.reply_count > 0 && (
                <button 
                  onClick={() => toast.info(`${message.reply_count} balasan untuk pesan ini`)}
                  className="text-xs text-primary font-medium flex items-center gap-1 hover:underline underline-offset-2 transition-all"
                >
                  <MessageCircle className="h-3 w-3" />
                  {message.reply_count} balasan
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted"><Smile className="h-3.5 w-3.5" /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1.5" align="end">
                <div className="flex gap-0.5">
                  {EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => handleToggleReaction(message.id, emoji)}
                      className="h-8 w-8 text-lg hover:bg-muted rounded transition-all hover:scale-110">{emoji}</button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {isOwn && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted"
                onClick={() => { setEditingMessage(message); setEditContent(message.content) }}><Edit2 className="h-3.5 w-3.5" /></Button>
            )}
            {(isOwn || user?.role === 'admin') && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => handleDeleteMessage(message.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <MainLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-6rem)]">
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col bg-card/50 border-white/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/20 flex-shrink-0">
              <h2 className="font-semibold text-primary flex items-center gap-2">💬 Ruang Obrolan</h2>
            </div>

            {/* Chat Container */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-3 py-2 space-y-1 flex flex-col"
            >
              {hasMore && (
                <div className="text-center py-3 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={loadMore} disabled={isLoadingMore} className="text-muted-foreground text-xs">
                    {isLoadingMore ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : '↑ Lihat sebelumnya'}
                  </Button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Belum ada pesan</p>
                    <p className="text-xs text-muted-foreground mt-1">Mulai percakapan pertama!</p>
                  </div>
                </div>
              ) : (
                messages.map(message => <MessageBubble key={message.id} message={message} />)
              )}
              {/* Ref untuk scroll target */}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Section */}
            <div className="p-3 border-t border-white/20 bg-background/50 flex-shrink-0">
              {replyingTo && (
                <div className="flex items-center justify-between p-2 mb-2 bg-primary/10 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <Reply className="h-3 w-3 text-primary" /> Membalas <strong>{replyingTo.sender_name}</strong>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 w-6 p-0"><X className="h-3 w-3" /></Button>
                </div>
              )}
              <div className="flex gap-2">
                <Input 
                  placeholder="Tulis pesan..." 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} 
                  disabled={isSending}
                  className="bg-input/50 border-white/20 flex-1 h-10" 
                />
                <Button onClick={handleSendMessage} disabled={isSending || !inputValue.trim()} size="sm" className="px-4">
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal tetap sama */}
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent className="bg-card border-white/20">
          <DialogHeader><DialogTitle className="text-primary">Edit Pesan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-32 bg-input/50 border-white/20 resize-none" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditingMessage(null)}>Batal</Button>
            <Button className="flex-1 bg-primary" onClick={handleUpdateMessage} disabled={isEditing}>
              {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" />Simpan</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
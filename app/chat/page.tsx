"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { Send, Loader2, Trash2, Reply, Smile, X, Edit2, MessageCircle, Check, CornerDownRight, ArrowLeft } from 'lucide-react'
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
  reply_to?: Message | null
  reactions: Record<string, { count: number, users: string[] }>
}

const EMOJIS = ['👍', '❤️', '😆', '😮', '😢', '🔥']

export default function ChatPage() {
  const { user } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [threadMessage, setThreadMessage] = useState<Message | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [showThread, setShowThread] = useState(false)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    loadMessages()
    setupRealtime()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  const setupRealtime = () => {
    channelRef.current = supabase
      .channel('chat-room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message
          if (!newMessage.reply_to_id) {
            setMessages(prev => [...prev, { ...newMessage, reactions: {} }])
          } else if (threadMessage && newMessage.reply_to_id === threadMessage.id) {
            setThreadMessages(prev => [...prev, { ...newMessage, reactions: {} }])
          }
          scrollToBottom()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMessage = payload.new as Message
          setMessages(prev => prev.map(m => m.id === updatedMessage.id ? { ...m, content: updatedMessage.content } : m))
          setThreadMessages(prev => prev.map(m => m.id === updatedMessage.id ? { ...m, content: updatedMessage.content } : m))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const deletedId = payload.old.id
          setMessages(prev => prev.filter(m => m.id !== deletedId))
          setThreadMessages(prev => prev.filter(m => m.id !== deletedId))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        () => { loadMessages() }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        () => { loadMessages() }
      )
      .subscribe()
  }

  const loadMessages = async (before?: string) => {
    try {
      const url = new URL('/api/messages', window.location.origin)
      url.searchParams.set('limit', '50')
      if (before) url.searchParams.set('before', before)

      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        if (before) {
          setMessages(prev => [...result.data.messages, ...prev])
        } else {
          setMessages(result.data.messages)
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

  const loadThread = async (messageId: string) => {
    try {
      const url = new URL('/api/messages', window.location.origin)
      url.searchParams.set('replyTo', messageId)
      url.searchParams.set('limit', '50')

      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setThreadMessages(result.data.messages)
      }
    } catch (error) {
      console.error('Failed to load thread:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        if (!replyingTo) {
          scrollToBottom()
        }
      } else {
        toast.error('Gagal mengirim pesan')
      }
    } catch (error) {
      toast.error('Gagal mengirim pesan')
    } finally {
      setIsSending(false)
    }
  }

  const handleUpdateMessage = async () => {
    if (!editContent.trim() || !editingMessage) return

    setIsEditing(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editingMessage.id,
          content: editContent.trim(),
          user_id: user?.id,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Pesan diperbarui')
        setEditingMessage(null)
        setEditContent('')
      } else {
        toast.error(result.error || 'Gagal mengupdate pesan')
      }
    } catch (error) {
      toast.error('Gagal mengupdate pesan')
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return
    if (!confirm('Hapus pesan ini?')) return

    try {
      const response = await fetch(`/api/messages?id=${messageId}&userId=${user.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Pesan dihapus')
      } else {
        toast.error(result.error || 'Gagal menghapus pesan')
      }
    } catch (error) {
      toast.error('Gagal menghapus pesan')
    }
  }

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return

    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_reaction',
          message_id: messageId,
          user_id: user.id,
          emoji,
        }),
      })
    } catch (error) {
      console.error('Reaction error:', error)
    }
  }

  const handleReply = (message: Message) => {
    setReplyingTo(message)
  }

  const handleOpenThread = async (message: Message) => {
    setThreadMessage(message)
    await loadThread(message.id)
    setShowThread(true)
  }

  const handleCloseThread = () => {
    setShowThread(false)
    setThreadMessage(null)
    setThreadMessages([])
  }

  const getAvatarUrl = (avatar: string | null, name: string) => {
    if (avatar) return avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    }
  }

  const MessageBubble = ({ message, isReply = false }: { message: Message, isReply?: boolean }) => {
    const isOwn = message.sender_id === user?.id
    const replyToMessage = message.reply_to_id && !isReply 
      ? messages.find(m => m.id === message.reply_to_id)
      : null
    const replyCount = messages.filter(m => m.reply_to_id === message.id).length

    return (
      <div 
        className={cn(
          "group relative p-3 -mx-3 rounded-lg transition-all duration-200",
          "hover:bg-white/5",
          isReply && "ml-11"
        )}
      >
        {replyToMessage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 ml-11">
            <CornerDownRight className="h-3 w-3" />
            <span>Membalas <span className="font-medium text-primary">{replyToMessage.sender_name}</span></span>
            <span className="line-clamp-1 opacity-70">"{replyToMessage.content.substring(0, 50)}..."</span>
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-background">
            <AvatarImage src={getAvatarUrl(message.sender_avatar, message.sender_name)} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {message.sender_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{message.sender_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatTime(message.created_at)}
                {message.updated_at && message.updated_at !== message.created_at && (
                  <span className="ml-1 italic">(diedit)</span>
                )}
              </span>
            </div>
            
            <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
            
            {/* Reactions */}
            {Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(message.reactions).map(([emoji, data]) => (
                  <button
                    key={emoji}
                    onClick={() => handleToggleReaction(message.id, emoji)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-all",
                      "hover:scale-105 active:scale-95",
                      data.users.includes(user?.id || '')
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-muted/50 border-white/10 hover:bg-muted hover:border-white/30"
                    )}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="text-xs font-medium">{data.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Reply & Thread buttons */}
            {!isReply && (
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => handleReply(message)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Balas
                </button>
                {replyCount > 0 && (
                  <button
                    onClick={() => handleOpenThread(message)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {replyCount} balasan - Lihat Thread
                  </button>
                )}
                {replyCount === 0 && (
                  <button
                    onClick={() => handleOpenThread(message)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Lihat Thread
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <div className="flex gap-1">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleToggleReaction(message.id, emoji)}
                      className="h-9 w-9 text-xl hover:bg-muted rounded-lg transition-all hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {isOwn && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={() => {
                  setEditingMessage(message)
                  setEditContent(message.content)
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            
            {(isOwn || user?.role === 'admin') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => handleDeleteMessage(message.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden">
        {/* Main Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 overflow-hidden",
          showThread && "lg:w-2/3"
        )}>
          <Card className="flex-1 flex flex-col bg-card/50 border-white/20 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/20 flex-shrink-0">
              <h2 className="font-semibold text-primary text-lg flex items-center gap-2">
                💬 Ruang Obrolan
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {messages.length} pesan • Selamat datang di ruang obrolan HIMSA
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {hasMore && (
                <div className="text-center pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const oldest = messages[0]
                      if (oldest) {
                        setIsLoadingMore(true)
                        loadMessages(oldest.created_at)
                      }
                    }}
                    disabled={isLoadingMore}
                    className="text-muted-foreground"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Muat pesan sebelumnya...'
                    )}
                  </Button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Belum ada pesan</p>
                  <p className="text-sm text-muted-foreground mt-1">Mulai percakapan pertama!</p>
                </div>
              ) : (
                messages.map(message => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/20 bg-background/50 flex-shrink-0">
              {replyingTo && (
                <div className="flex items-center justify-between p-3 mb-3 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="flex items-center gap-2 text-sm">
                    <Reply className="h-4 w-4 text-primary" />
                    <span>Membalas <strong className="text-primary">{replyingTo.sender_name}</strong></span>
                    <span className="text-muted-foreground line-clamp-1">"{replyingTo.content}"</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  placeholder={`Tulis pesan... ${replyingTo ? '(Balasan)' : ''}`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={isSending}
                  className="bg-input/50 border-white/20 flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSending || !inputValue.trim()}
                  className="px-6"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Kirim
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Thread Sidebar */}
        {showThread && threadMessage && (
          <div className="hidden lg:block w-1/3 overflow-hidden">
            <Card className="h-full flex flex-col bg-card/50 border-white/20 overflow-hidden">
              <div className="p-4 border-b border-white/20 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCloseThread} className="lg:hidden">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Thread
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {threadMessages.length} balasan
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseThread}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Original message */}
                <div className="border-l-2 border-primary pl-3 pb-2">
                  <MessageBubble message={threadMessage} />
                </div>

                {/* Replies */}
                {threadMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-12">
                    Belum ada balasan
                  </p>
                ) : (
                  threadMessages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} isReply />
                  ))
                )}
              </div>

              {/* Thread Input */}
              <div className="p-4 border-t border-white/20 bg-background/50 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Balas di thread..."
                    value={replyingTo?.id === threadMessage.id ? inputValue : ''}
                    onChange={(e) => {
                      setInputValue(e.target.value)
                      if (!replyingTo) setReplyingTo(threadMessage)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="bg-input/50 border-white/20 text-sm"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isSending || !inputValue.trim()}
                    size="sm"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mobile Thread Modal */}
        {showThread && threadMessage && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full h-[90vh] flex flex-col bg-card border-white/20 overflow-hidden">
              <div className="p-4 border-b border-white/20 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    Thread
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {threadMessages.length} balasan
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseThread}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="border-l-2 border-primary pl-3 pb-2">
                  <MessageBubble message={threadMessage} />
                </div>

                {threadMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-12">
                    Belum ada balasan
                  </p>
                ) : (
                  threadMessages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} isReply />
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/20 bg-background/50 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Balas di thread..."
                    value={replyingTo?.id === threadMessage.id ? inputValue : ''}
                    onChange={(e) => {
                      setInputValue(e.target.value)
                      if (!replyingTo) setReplyingTo(threadMessage)
                    }}
                    className="bg-input/50 border-white/20 text-sm"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isSending || !inputValue.trim()}
                    size="sm"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Message Modal */}
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent className="bg-card border-white/20">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit Pesan</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Perbarui pesan Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-32 bg-input/50 border-white/20 resize-none"
              placeholder="Tulis pesan..."
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditingMessage(null)}>
              Batal
            </Button>
            <Button className="flex-1 bg-primary" onClick={handleUpdateMessage} disabled={isEditing}>
              {isEditing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
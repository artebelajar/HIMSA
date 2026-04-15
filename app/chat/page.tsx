'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Paperclip, Send, Loader } from 'lucide-react'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  sender: string
  senderRole: string
  content: string
  timestamp: string
  isOwn: boolean
  attachmentUrl?: string
  attachmentType?: 'image' | 'document'
}

const DEMO_USERS = [
  { name: 'Admin User', role: 'Admin' },
  { name: 'Divisi Dakwah', role: 'Division' },
  { name: 'Regular User', role: 'User' },
  { name: 'Divisi Olahraga', role: 'Division' },
]

const DEMO_MESSAGES = [
  {
    sender: 'Admin User',
    senderRole: 'Admin',
    content: 'Assalamualaikum semua! Selamat datang di channel HIMSA.',
    isOwn: false,
  },
  {
    sender: 'Divisi Dakwah',
    senderRole: 'Division',
    content: 'Wa\'alaikumassalam. Alhamdulillah bisa bergabung di sini.',
    isOwn: false,
  },
  {
    sender: 'Regular User',
    senderRole: 'User',
    content: 'Halo semua! Apa kabar?',
    isOwn: false,
  },
]

export default function ChatPage() {
  const { user } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [messagesLimit, setMessagesLimit] = useState(30)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const displayedMessages = messages.slice(-messagesLimit)

  useEffect(() => {
    // Load messages from localStorage
    const savedMessages = localStorage.getItem('himsa_chat_messages')
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    } else {
      // Initialize with demo messages
      const initialMessages = DEMO_MESSAGES.map((msg, idx) => ({
        id: String(idx),
        ...msg,
        timestamp: new Date(Date.now() - (DEMO_MESSAGES.length - idx) * 60000).toISOString(),
      }))
      setMessages(initialMessages)
      localStorage.setItem('himsa_chat_messages', JSON.stringify(initialMessages))
    }

    // Simulate random typing indicator
    const typingInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const randomUser = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)]
        setTypingUser(randomUser.name)
        setTimeout(() => setTypingUser(null), 2000 + Math.random() * 2000)
      }
    }, 8000)

    return () => clearInterval(typingInterval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUser])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: String(Date.now()),
      sender: user?.name || 'Anonymous',
      senderRole: user?.role || 'User',
      content: inputValue,
      timestamp: new Date().toISOString(),
      isOwn: true,
    }

    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    localStorage.setItem('himsa_chat_messages', JSON.stringify(updatedMessages))
    setInputValue('')
    toast.success('Pesan terkirim!')

    // Simulate response
    setTimeout(() => {
      const randomUser = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)]
      const responses = [
        'Iya, setuju!',
        'Bagus itu idenya.',
        'Mari kita koordinasikan.',
        'Baik, sudah dicatat.',
        'Terima kasih atas informasinya.',
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      const responseMessage: Message = {
        id: String(Date.now()),
        sender: randomUser.name,
        senderRole: randomUser.role,
        content: randomResponse,
        timestamp: new Date().toISOString(),
        isOwn: false,
      }

      const messagesWithResponse = [...updatedMessages, responseMessage]
      setMessages(messagesWithResponse)
      localStorage.setItem('himsa_chat_messages', JSON.stringify(messagesWithResponse))
    }, 1500)
  }

  const handleAttachFile = () => {
    toast.success('Simulasi: File terlampir (Demo)')
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <MainLayout>
      <div className="h-screen flex flex-col space-y-4">
        <div>
          <h1 className="font-orbitron text-3xl font-bold text-primary">Chat Komunitas</h1>
          <p className="text-muted-foreground">Berbincang dengan anggota HIMSA</p>
        </div>

        <Card className="bg-card/50 border-white/20 flex-1 overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length > messagesLimit && (
              <div className="text-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessagesLimit(messagesLimit + 20)}
                  className="text-xs"
                >
                  Muat lebih banyak ({messages.length - messagesLimit} lainnya)
                </Button>
              </div>
            )}
            {displayedMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.isOwn && 'justify-end'
                )}
              >
                {!message.isOwn && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {message.sender[0]}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                    message.isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  )}
                >
                  {!message.isOwn && (
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      {message.sender}
                    </p>
                  )}
                  <p className="text-sm break-words">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {typingUser && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {typingUser[0]}
                  </span>
                </div>
                <div className="bg-muted text-foreground px-4 py-2 rounded-lg rounded-bl-none">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {typingUser}
                  </p>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/20 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAttachFile}
                className="border-white/20"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Tulis pesan..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="bg-input/50 border-white/20"
              />
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Kirim</span>
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}

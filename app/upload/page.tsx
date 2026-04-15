'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Upload, FileText, Quote, Image as ImageIcon, Trash2, Edit2, Save, X } from 'lucide-react'
import { useApp } from '@/providers/app-provider'
import { cn } from '@/lib/utils'

const DIVISIONS = [
  'Kebersihan', 'Kesehatan', 'Keamanan', 'Kesejahteraan',
  'Olahraga', 'Dakwah', 'Bahasa', 'Wakil', 'Ketua',
]

const QUOTE_COLORS = [
  'from-cyan-500/20 to-blue-500/20',
  'from-purple-500/20 to-pink-500/20',
  'from-green-500/20 to-emerald-500/20',
  'from-orange-500/20 to-red-500/20',
  'from-indigo-500/20 to-cyan-500/20',
]

interface Article {
  id: string
  title: string
  content: string
  image: string
  division: string
  author: string
  likes: number
  createdAt: string
}

interface QuotePost {
  id: string
  text: string
  division: string
  author: string
  likes: number
  createdAt: string
}

interface Poster {
  id: string
  title: string
  image: string
  ratio: '9:16' | '16:9' | '1:1'
  division: string
  author: string
  likes: number
  createdAt: string
}

export default function UploadPage() {
  const { user } = useApp()
  
  // Article state
  const [articleForm, setArticleForm] = useState({ title: '', content: '', image: '', division: '' })
  const [articles, setArticles] = useState<Article[]>([])
  const [editingArticle, setEditingArticle] = useState<string | null>(null)
  
  // Quote state
  const [quoteForm, setQuoteForm] = useState({ text: '', division: '' })
  const [quotes, setQuotes] = useState<QuotePost[]>([])
  const [editingQuote, setEditingQuote] = useState<string | null>(null)
  
  // Poster state
  const [posterForm, setPosterForm] = useState({ title: '', image: '', ratio: '9:16' as const, division: '' })
  const [posters, setPosters] = useState<Poster[]>([])
  const [editingPoster, setEditingPoster] = useState<string | null>(null)

  // Load data from localStorage
  useEffect(() => {
    const savedArticles = localStorage.getItem('himsa_articles')
    const savedQuotes = localStorage.getItem('himsa_quotes')
    const savedPosters = localStorage.getItem('himsa_posters')

    if (savedArticles) setArticles(JSON.parse(savedArticles))
    if (savedQuotes) setQuotes(JSON.parse(savedQuotes))
    if (savedPosters) setPosters(JSON.parse(savedPosters))
  }, [])

  // Article handlers
  const handleAddArticle = () => {
    if (!articleForm.title || !articleForm.content || !articleForm.division) {
      toast.error('Semua field harus diisi')
      return
    }

    const newArticle: Article = {
      id: Math.random().toString(),
      ...articleForm,
      author: user?.name || 'Unknown',
      likes: 0,
      createdAt: new Date().toISOString(),
    }

    const updated = [newArticle, ...articles]
    setArticles(updated)
    localStorage.setItem('himsa_articles', JSON.stringify(updated))
    setArticleForm({ title: '', content: '', image: '', division: '' })
    toast.success('Artikel berhasil dipublikasi')
  }

  const handleUpdateArticle = (id: string) => {
    const updated = articles.map(a => 
      a.id === id ? { ...a, ...articleForm, updatedAt: new Date().toISOString() } : a
    )
    setArticles(updated)
    localStorage.setItem('himsa_articles', JSON.stringify(updated))
    setEditingArticle(null)
    setArticleForm({ title: '', content: '', image: '', division: '' })
    toast.success('Artikel berhasil diperbarui')
  }

  const handleDeleteArticle = (id: string) => {
    const updated = articles.filter(a => a.id !== id)
    setArticles(updated)
    localStorage.setItem('himsa_articles', JSON.stringify(updated))
    toast.success('Artikel berhasil dihapus')
  }

  // Quote handlers
  const handleAddQuote = () => {
    if (!quoteForm.text || !quoteForm.division) {
      toast.error('Semua field harus diisi')
      return
    }

    const newQuote: QuotePost = {
      id: Math.random().toString(),
      text: quoteForm.text,
      division: quoteForm.division,
      author: user?.name || 'Unknown',
      likes: 0,
      createdAt: new Date().toISOString(),
    }

    const updated = [newQuote, ...quotes]
    setQuotes(updated)
    localStorage.setItem('himsa_quotes', JSON.stringify(updated))
    setQuoteForm({ text: '', division: '' })
    toast.success('Quote berhasil dipublikasi')
  }

  const handleUpdateQuote = (id: string) => {
    const updated = quotes.map(q =>
      q.id === id ? { ...q, ...quoteForm } : q
    )
    setQuotes(updated)
    localStorage.setItem('himsa_quotes', JSON.stringify(updated))
    setEditingQuote(null)
    setQuoteForm({ text: '', division: '' })
    toast.success('Quote berhasil diperbarui')
  }

  const handleDeleteQuote = (id: string) => {
    const updated = quotes.filter(q => q.id !== id)
    setQuotes(updated)
    localStorage.setItem('himsa_quotes', JSON.stringify(updated))
    toast.success('Quote berhasil dihapus')
  }

  // Poster handlers
  const handleAddPoster = () => {
    if (!posterForm.title || !posterForm.image || !posterForm.division) {
      toast.error('Semua field harus diisi')
      return
    }

    const newPoster: Poster = {
      id: Math.random().toString(),
      ...posterForm,
      author: user?.name || 'Unknown',
      likes: 0,
      createdAt: new Date().toISOString(),
    }

    const updated = [newPoster, ...posters]
    setPosters(updated)
    localStorage.setItem('himsa_posters', JSON.stringify(updated))
    setPosterForm({ title: '', image: '', ratio: '9:16', division: '' })
    toast.success('Poster berhasil dipublikasi')
  }

  const handleUpdatePoster = (id: string) => {
    const updated = posters.map(p =>
      p.id === id ? { ...p, ...posterForm } : p
    )
    setPosters(updated)
    localStorage.setItem('himsa_posters', JSON.stringify(updated))
    setEditingPoster(null)
    setPosterForm({ title: '', image: '', ratio: '9:16', division: '' })
    toast.success('Poster berhasil diperbarui')
  }

  const handleDeletePoster = (id: string) => {
    const updated = posters.filter(p => p.id !== id)
    setPosters(updated)
    localStorage.setItem('himsa_posters', JSON.stringify(updated))
    toast.success('Poster berhasil dihapus')
  }

  const myArticles = articles.filter(a => a.author === user?.name)
  const myQuotes = quotes.filter(q => q.author === user?.name)
  const myPosters = posters.filter(p => p.author === user?.name)

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Upload Konten
          </h1>
          <p className="text-muted-foreground">Bagikan artikel, quotes, dan poster untuk komunitas HIMSA</p>
        </div>

        <Tabs defaultValue="article" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="article">
              <FileText className="h-4 w-4 mr-2" />
              Artikel
            </TabsTrigger>
            <TabsTrigger value="quote">
              <Quote className="h-4 w-4 mr-2" />
              Quote
            </TabsTrigger>
            <TabsTrigger value="poster">
              <ImageIcon className="h-4 w-4 mr-2" />
              Poster
            </TabsTrigger>
          </TabsList>

          {/* Article Tab */}
          <TabsContent value="article" className="space-y-6">
            {/* Form */}
            <Card className="p-6 border-border/50">
              <h2 className="text-lg font-bold mb-4">Tulis Artikel Baru</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Judul</Label>
                  <Input
                    placeholder="Masukkan judul artikel..."
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Divisi</Label>
                    <Select value={articleForm.division} onValueChange={(value) => setArticleForm({ ...articleForm, division: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIVISIONS.map((div) => (
                          <SelectItem key={div} value={div}>{div}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">URL Gambar</Label>
                    <Input
                      placeholder="https://..."
                      value={articleForm.image}
                      onChange={(e) => setArticleForm({ ...articleForm, image: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Konten</Label>
                  <textarea
                    placeholder="Tulis konten artikel..."
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    className="w-full h-40 p-3 rounded-lg bg-background/50 border border-border text-sm mt-2 resize-none focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  {editingArticle && (
                    <Button variant="ghost" onClick={() => { setEditingArticle(null); setArticleForm({ title: '', content: '', image: '', division: '' }); }}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  )}
                  <Button onClick={editingArticle ? () => handleUpdateArticle(editingArticle) : handleAddArticle} className="gap-2">
                    <Upload className="h-4 w-4" />
                    {editingArticle ? 'Update' : 'Publikasi'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* My Articles */}
            <div>
              <h2 className="text-lg font-bold mb-4">Artikel Saya ({myArticles.length})</h2>
              <div className="space-y-3">
                {myArticles.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">Belum ada artikel</p>
                  </Card>
                ) : (
                  myArticles.map((article) => (
                    <Card key={article.id} className="p-4 border-border/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{article.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{article.division} • {new Date(article.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingArticle(article.id)
                              setArticleForm({ title: article.title, content: article.content, image: article.image, division: article.division })
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteArticle(article.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Quote Tab */}
          <TabsContent value="quote" className="space-y-6">
            <Card className="p-6 border-border/50">
              <h2 className="text-lg font-bold mb-4">Tulis Quote Baru</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Divisi</Label>
                  <Select value={quoteForm.division} onValueChange={(value) => setQuoteForm({ ...quoteForm, division: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISIONS.map((div) => (
                        <SelectItem key={div} value={div}>{div}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Quote</Label>
                  <textarea
                    placeholder="Tulis quote..."
                    value={quoteForm.text}
                    onChange={(e) => setQuoteForm({ ...quoteForm, text: e.target.value })}
                    className="w-full h-32 p-3 rounded-lg bg-background/50 border border-border text-sm mt-2 resize-none focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  {editingQuote && (
                    <Button variant="ghost" onClick={() => { setEditingQuote(null); setQuoteForm({ text: '', division: '' }); }}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  )}
                  <Button onClick={editingQuote ? () => handleUpdateQuote(editingQuote) : handleAddQuote} className="gap-2">
                    <Upload className="h-4 w-4" />
                    {editingQuote ? 'Update' : 'Publikasi'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* My Quotes */}
            <div>
              <h2 className="text-lg font-bold mb-4">Quote Saya ({myQuotes.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myQuotes.length === 0 ? (
                  <Card className="p-6 text-center col-span-full">
                    <p className="text-muted-foreground">Belum ada quote</p>
                  </Card>
                ) : (
                  myQuotes.map((quote) => (
                    <Card
                      key={quote.id}
                      className={cn('p-4 border-l-4 border-l-primary', QUOTE_COLORS[Math.floor(Math.random() * QUOTE_COLORS.length)])}
                    >
                      <p className="text-sm italic mb-3">{quote.text}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{quote.division}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingQuote(quote.id)
                              setQuoteForm({ text: quote.text, division: quote.division })
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteQuote(quote.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Poster Tab */}
          <TabsContent value="poster" className="space-y-6">
            <Card className="p-6 border-border/50">
              <h2 className="text-lg font-bold mb-4">Upload Poster Baru</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Judul</Label>
                  <Input
                    placeholder="Masukkan judul poster..."
                    value={posterForm.title}
                    onChange={(e) => setPosterForm({ ...posterForm, title: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Divisi</Label>
                    <Select value={posterForm.division} onValueChange={(value) => setPosterForm({ ...posterForm, division: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIVISIONS.map((div) => (
                          <SelectItem key={div} value={div}>{div}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Rasio Aspek</Label>
                    <Select value={posterForm.ratio} onValueChange={(value: any) => setPosterForm({ ...posterForm, ratio: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">URL Gambar</Label>
                  <Input
                    placeholder="https://..."
                    value={posterForm.image}
                    onChange={(e) => setPosterForm({ ...posterForm, image: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  {editingPoster && (
                    <Button variant="ghost" onClick={() => { setEditingPoster(null); setPosterForm({ title: '', image: '', ratio: '9:16', division: '' }); }}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  )}
                  <Button onClick={editingPoster ? () => handleUpdatePoster(editingPoster) : handleAddPoster} className="gap-2">
                    <Upload className="h-4 w-4" />
                    {editingPoster ? 'Update' : 'Publikasi'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* My Posters */}
            <div>
              <h2 className="text-lg font-bold mb-4">Poster Saya ({myPosters.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {myPosters.length === 0 ? (
                  <Card className="p-6 text-center col-span-full">
                    <p className="text-muted-foreground">Belum ada poster</p>
                  </Card>
                ) : (
                  myPosters.map((poster) => (
                    <Card key={poster.id} className="overflow-hidden border-border/50 group">
                      <div className="relative overflow-hidden">
                        <img
                          src={poster.image}
                          alt={poster.title}
                          className={cn(
                            'w-full object-cover group-hover:scale-105 transition-transform',
                            poster.ratio === '9:16' ? 'aspect-[9/16]' : poster.ratio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'
                          )}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPoster(poster.id)
                              setPosterForm({ title: poster.title, image: poster.image, ratio: poster.ratio, division: poster.division })
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePoster(poster.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium line-clamp-1">{poster.title}</p>
                        <p className="text-xs text-muted-foreground">{poster.division}</p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

"use client"

import React, { useState, useEffect, useRef } from 'react'
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
import { Upload, FileText, Quote, ImageIcon, Trash2, Edit2, X, Loader2, Link, FolderOpen } from 'lucide-react'
import { useApp } from '@/providers/app-provider'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getDivisionNames } from '@/lib/divisions'

interface Post {
  id: string
  type: 'article' | 'quote' | 'poster'
  title: string | null
  content: string | null
  image_url: string | null
  aspect_ratio: '9:16' | '16:9' | '1:1' | null
  division: string
  author_id: string
  author_name: string
  likes_count: number
  created_at: string
}

export default function UploadPage() {
  const { user } = useApp()

  const [divisions, setDivisions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Posts data
  const [articles, setArticles] = useState<Post[]>([])
  const [quotes, setQuotes] = useState<Post[]>([])
  const [posters, setPosters] = useState<Post[]>([])

  // Article state
  const [articleForm, setArticleForm] = useState({ title: '', content: '', image_url: '', division: '' })
  const [editingArticle, setEditingArticle] = useState<Post | null>(null)
  const [articleImageMode, setArticleImageMode] = useState<'url' | 'upload'>('url')
  const [uploadingArticle, setUploadingArticle] = useState(false)
  const [savingArticle, setSavingArticle] = useState(false)
  const articleFileRef = useRef<HTMLInputElement>(null)

  // Quote state
  const [quoteForm, setQuoteForm] = useState({ content: '', division: '' })
  const [editingQuote, setEditingQuote] = useState<Post | null>(null)
  const [savingQuote, setSavingQuote] = useState(false)

  // Poster state
  const [posterForm, setPosterForm] = useState<{
    title: string
    image_url: string
    aspect_ratio: '9:16' | '16:9' | '1:1'
    division: string
  }>({
    title: '',
    image_url: '',
    aspect_ratio: '9:16',
    division: ''
  })
  const [editingPoster, setEditingPoster] = useState<Post | null>(null)
  const [posterImageMode, setPosterImageMode] = useState<'url' | 'upload'>('url')
  const [uploadingPoster, setUploadingPoster] = useState(false)
  const [savingPoster, setSavingPoster] = useState(false)
  const posterFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDivisions()
    loadAllPosts()
  }, [])

  const loadDivisions = async () => {
    const divs = await getDivisionNames()
    setDivisions(divs)
  }

  const loadAllPosts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/posts')
      const result = await response.json()

      if (result.success) {
        const posts = result.data as Post[]
        setArticles(posts.filter(p => p.type === 'article'))
        setQuotes(posts.filter(p => p.type === 'quote'))
        setPosters(posts.filter(p => p.type === 'poster'))
      }
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  // Article handlers
  const handleArticleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5 MB')
      return
    }

    setUploadingArticle(true)
    try {
      const publicUrl = await uploadFile(file, 'articles')
      setArticleForm({ ...articleForm, image_url: publicUrl })
      toast.success('Gambar berhasil diupload')
    } catch (error: any) {
      toast.error(error.message || 'Gagal upload gambar')
    } finally {
      setUploadingArticle(false)
      if (articleFileRef.current) articleFileRef.current.value = ''
    }
  }

  const handleSaveArticle = async () => {
    if (!articleForm.title || !articleForm.content || !articleForm.division) {
      toast.error('Judul, konten, dan divisi harus diisi')
      return
    }

    if (!user) return

    setSavingArticle(true)
    try {
      const payload = {
        type: 'article' as const,
        title: articleForm.title,
        content: articleForm.content,
        image_url: articleForm.image_url || null,
        division: articleForm.division,
        author_id: user.id,
        author_name: user.name,
      }

      const url = editingArticle ? '/api/posts' : '/api/posts'
      const method = editingArticle ? 'PUT' : 'POST'
      const body = editingArticle
        ? { id: editingArticle.id, ...payload }
        : payload

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingArticle ? 'Artikel diperbarui' : 'Artikel dipublikasi')
        resetArticleForm()
        loadAllPosts()
      } else {
        toast.error(result.error || 'Gagal menyimpan artikel')
      }
    } catch (error) {
      toast.error('Gagal menyimpan artikel')
    } finally {
      setSavingArticle(false)
    }
  }

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Hapus artikel ini?')) return

    try {
      const response = await fetch(`/api/posts?id=${id}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        toast.success('Artikel dihapus')
        loadAllPosts()
      } else {
        toast.error(result.error || 'Gagal menghapus artikel')
      }
    } catch (error) {
      toast.error('Gagal menghapus artikel')
    }
  }

  const resetArticleForm = () => {
    setArticleForm({ title: '', content: '', image_url: '', division: '' })
    setEditingArticle(null)
    setArticleImageMode('url')
  }

  // Quote handlers
  const handleSaveQuote = async () => {
    if (!quoteForm.content || !quoteForm.division) {
      toast.error('Quote dan divisi harus diisi')
      return
    }

    if (!user) return

    setSavingQuote(true)
    try {
      const payload = {
        type: 'quote' as const,
        content: quoteForm.content,
        division: quoteForm.division,
        author_id: user.id,
        author_name: user.name,
      }

      const url = editingQuote ? '/api/posts' : '/api/posts'
      const method = editingQuote ? 'PUT' : 'POST'
      const body = editingQuote
        ? { id: editingQuote.id, ...payload }
        : payload

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingQuote ? 'Quote diperbarui' : 'Quote dipublikasi')
        setQuoteForm({ content: '', division: '' })
        setEditingQuote(null)
        loadAllPosts()
      } else {
        toast.error(result.error || 'Gagal menyimpan quote')
      }
    } catch (error) {
      toast.error('Gagal menyimpan quote')
    } finally {
      setSavingQuote(false)
    }
  }

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Hapus quote ini?')) return

    try {
      const response = await fetch(`/api/posts?id=${id}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        toast.success('Quote dihapus')
        loadAllPosts()
      } else {
        toast.error(result.error || 'Gagal menghapus quote')
      }
    } catch (error) {
      toast.error('Gagal menghapus quote')
    }
  }

  // Poster handlers
  const handlePosterImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5 MB')
      return
    }

    setUploadingPoster(true)
    try {
      const publicUrl = await uploadFile(file, 'posters')
      setPosterForm({ ...posterForm, image_url: publicUrl })
      toast.success('Gambar berhasil diupload')
    } catch (error: any) {
      toast.error(error.message || 'Gagal upload gambar')
    } finally {
      setUploadingPoster(false)
      if (posterFileRef.current) posterFileRef.current.value = ''
    }
  }

  // Di bagian handleSavePoster
  const handleSavePoster = async () => {
    if (!posterForm.title || !posterForm.division) {
      toast.error('Judul dan divisi harus diisi')
      return
    }

    if (!user) return

    setSavingPoster(true)
    try {
      const payload = {
        type: 'poster' as const,
        title: posterForm.title,
        image_url: posterForm.image_url || null,
        aspect_ratio: posterForm.aspect_ratio, // Kirim apa adanya
        division: posterForm.division,
        author_id: user.id,
        author_name: user.name,
      }

      const url = editingPoster ? '/api/posts' : '/api/posts'
      const method = editingPoster ? 'PUT' : 'POST'
      const body = editingPoster
        ? { id: editingPoster.id, ...payload }
        : payload

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingPoster ? 'Poster diperbarui' : 'Poster dipublikasi')
        resetPosterForm()
        loadAllPosts()
      } else {
        toast.error(result.error || 'Gagal menyimpan poster')
      }
    } catch (error) {
      toast.error('Gagal menyimpan poster')
    } finally {
      setSavingPoster(false)
    }
  }

  const handleEditPoster = (poster: Post) => {
    setEditingPoster(poster)
    setPosterForm({
      title: poster.title || '',
      image_url: poster.image_url || '',
      aspect_ratio: (poster.aspect_ratio as '9:16' | '16:9' | '1:1') || '9:16',
      division: poster.division
    })
    setPosterImageMode(poster.image_url ? 'url' : 'url')
  }

  const handleDeletePoster = async (id: string) => {
    if (!confirm('Hapus poster ini?')) return

    try {
      const response = await fetch(`/api/posts?id=${id}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        toast.success('Poster dihapus')
        loadAllPosts()
      } else {
        toast.error(result.error || 'Gagal menghapus poster')
      }
    } catch (error) {
      toast.error('Gagal menghapus poster')
    }
  }

  const resetPosterForm = () => {
    setPosterForm({ title: '', image_url: '', aspect_ratio: '9:16', division: '' })
    setEditingPoster(null)
    setPosterImageMode('url')
  }

  const myArticles = articles.filter(a => a.author_id === user?.id)
  const myQuotes = quotes.filter(q => q.author_id === user?.id)
  const myPosters = posters.filter(p => p.author_id === user?.id)

  const QUOTE_COLORS = [
    'from-cyan-500/20 to-blue-500/20 border-cyan-500/50',
    'from-purple-500/20 to-pink-500/20 border-purple-500/50',
    'from-green-500/20 to-emerald-500/20 border-green-500/50',
    'from-orange-500/20 to-red-500/20 border-orange-500/50',
    'from-indigo-500/20 to-cyan-500/20 border-indigo-500/50',
  ]

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
      <div className="max-w-6xl mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Upload Konten
          </h1>
          <p className="text-muted-foreground">Bagikan artikel, quotes, dan poster untuk komunitas HIMSA</p>
        </div>

        <Tabs defaultValue="article" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-card/30 border border-white/20">
            <TabsTrigger value="article" className="data-[state=active]:bg-primary/20">
              <FileText className="h-4 w-4 mr-2" />
              Artikel
            </TabsTrigger>
            <TabsTrigger value="quote" className="data-[state=active]:bg-primary/20">
              <Quote className="h-4 w-4 mr-2" />
              Quote
            </TabsTrigger>
            <TabsTrigger value="poster" className="data-[state=active]:bg-primary/20">
              <ImageIcon className="h-4 w-4 mr-2" />
              Poster
            </TabsTrigger>
          </TabsList>

          {/* Article Tab */}
          <TabsContent value="article" className="space-y-6">
            <Card className="p-6 bg-card/50 border-white/20">
              <h2 className="text-lg font-bold mb-4 text-primary">
                {editingArticle ? 'Edit Artikel' : 'Tulis Artikel Baru'}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Judul</Label>
                  <Input
                    placeholder="Masukkan judul artikel..."
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    className="mt-2 bg-input/50 border-white/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Divisi</Label>
                    <Select value={articleForm.division} onValueChange={(value) => setArticleForm({ ...articleForm, division: value })}>
                      <SelectTrigger className="mt-2 bg-input/50 border-white/20">
                        <SelectValue placeholder="Pilih Divisi" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map((div) => (
                          <SelectItem key={div} value={div}>{div}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Gambar</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={articleImageMode === 'url' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setArticleImageMode('url')}
                      >
                        <Link className="h-4 w-4 mr-1" />
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant={articleImageMode === 'upload' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setArticleImageMode('upload')}
                      >
                        <FolderOpen className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>

                {articleImageMode === 'url' ? (
                  <div>
                    <Label className="text-sm">URL Gambar</Label>
                    <Input
                      placeholder="https://..."
                      value={articleForm.image_url}
                      onChange={(e) => setArticleForm({ ...articleForm, image_url: e.target.value })}
                      className="mt-2 bg-input/50 border-white/20"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm">Upload Gambar (max 5MB)</Label>
                    <div className="mt-2">
                      <input
                        ref={articleFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleArticleImageUpload}
                        className="hidden"
                        id="article-image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => articleFileRef.current?.click()}
                        disabled={uploadingArticle}
                        className="w-full border-dashed"
                      >
                        {uploadingArticle ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {articleForm.image_url ? 'Gambar terpilih' : 'Pilih Gambar'}
                      </Button>
                      {articleForm.image_url && (
                        <div className="mt-2 relative">
                          <img
                            src={articleForm.image_url}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border border-white/20"
                          />
                          <button
                            onClick={() => setArticleForm({ ...articleForm, image_url: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm">Konten</Label>
                  <textarea
                    placeholder="Tulis konten artikel..."
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    className="w-full h-40 p-3 rounded-lg bg-input/50 border border-white/20 text-sm mt-2 resize-none focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  {editingArticle && (
                    <Button variant="ghost" onClick={resetArticleForm}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  )}
                  <Button onClick={handleSaveArticle} disabled={savingArticle} className="gap-2">
                    {savingArticle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {editingArticle ? 'Update' : 'Publikasi'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* My Articles */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-primary">Artikel Saya ({myArticles.length})</h2>
              <div className="space-y-3">
                {myArticles.length === 0 ? (
                  <Card className="p-6 text-center bg-card/50 border-white/20">
                    <p className="text-muted-foreground">Belum ada artikel</p>
                  </Card>
                ) : (
                  myArticles.map((article) => (
                    <Card key={article.id} className="p-4 bg-card/50 border-white/20">
                      <div className="flex items-start gap-4">
                        {article.image_url && (
                          <img src={article.image_url} alt={article.title || ''} className="w-20 h-20 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{article.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {article.division} • {new Date(article.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingArticle(article)
                              setArticleForm({
                                title: article.title || '',
                                content: article.content || '',
                                image_url: article.image_url || '',
                                division: article.division
                              })
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
            <Card className="p-6 bg-card/50 border-white/20">
              <h2 className="text-lg font-bold mb-4 text-primary">
                {editingQuote ? 'Edit Quote' : 'Tulis Quote Baru'}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Divisi</Label>
                  <Select value={quoteForm.division} onValueChange={(value) => setQuoteForm({ ...quoteForm, division: value })}>
                    <SelectTrigger className="mt-2 bg-input/50 border-white/20">
                      <SelectValue placeholder="Pilih Divisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((div) => (
                        <SelectItem key={div} value={div}>{div}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Quote</Label>
                  <textarea
                    placeholder="Tulis quote..."
                    value={quoteForm.content}
                    onChange={(e) => setQuoteForm({ ...quoteForm, content: e.target.value })}
                    className="w-full h-32 p-3 rounded-lg bg-input/50 border border-white/20 text-sm mt-2 resize-none focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  {editingQuote && (
                    <Button variant="ghost" onClick={() => {
                      setEditingQuote(null)
                      setQuoteForm({ content: '', division: '' })
                    }}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  )}
                  <Button onClick={handleSaveQuote} disabled={savingQuote} className="gap-2">
                    {savingQuote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {editingQuote ? 'Update' : 'Publikasi'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* My Quotes */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-primary">Quote Saya ({myQuotes.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myQuotes.length === 0 ? (
                  <Card className="p-6 text-center col-span-full bg-card/50 border-white/20">
                    <p className="text-muted-foreground">Belum ada quote</p>
                  </Card>
                ) : (
                  myQuotes.map((quote, idx) => (
                    <Card
                      key={quote.id}
                      className={cn('p-4 border-l-4 bg-gradient-to-br', QUOTE_COLORS[idx % QUOTE_COLORS.length])}
                    >
                      <p className="text-sm italic mb-3">{quote.content}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{quote.division}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingQuote(quote)
                              setQuoteForm({ content: quote.content || '', division: quote.division })
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
            <Card className="p-6 bg-card/50 border-white/20">
              <h2 className="text-lg font-bold mb-4 text-primary">
                {editingPoster ? 'Edit Poster' : 'Upload Poster Baru'}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Judul</Label>
                  <Input
                    placeholder="Masukkan judul poster..."
                    value={posterForm.title}
                    onChange={(e) => setPosterForm({ ...posterForm, title: e.target.value })}
                    className="mt-2 bg-input/50 border-white/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Divisi</Label>
                    <Select value={posterForm.division} onValueChange={(value) => setPosterForm({ ...posterForm, division: value })}>
                      <SelectTrigger className="mt-2 bg-input/50 border-white/20">
                        <SelectValue placeholder="Pilih Divisi" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map((div) => (
                          <SelectItem key={div} value={div}>{div}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Rasio Aspek</Label>
                    <Select value={posterForm.aspect_ratio} onValueChange={(value: any) => setPosterForm({ ...posterForm, aspect_ratio: value })}>
                      <SelectTrigger className="mt-2 bg-input/50 border-white/20">
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
                  <Label className="text-sm">Gambar</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={posterImageMode === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPosterImageMode('url')}
                    >
                      <Link className="h-4 w-4 mr-1" />
                      URL
                    </Button>
                    <Button
                      type="button"
                      variant={posterImageMode === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPosterImageMode('upload')}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                </div>

                {posterImageMode === 'url' ? (
                  <div>
                    <Label className="text-sm">URL Gambar</Label>
                    <Input
                      placeholder="https://..."
                      value={posterForm.image_url}
                      onChange={(e) => setPosterForm({ ...posterForm, image_url: e.target.value })}
                      className="mt-2 bg-input/50 border-white/20"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm">Upload Gambar (max 5MB)</Label>
                    <div className="mt-2">
                      <input
                        ref={posterFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePosterImageUpload}
                        className="hidden"
                        id="poster-image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => posterFileRef.current?.click()}
                        disabled={uploadingPoster}
                        className="w-full border-dashed"
                      >
                        {uploadingPoster ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {posterForm.image_url ? 'Gambar terpilih' : 'Pilih Gambar'}
                      </Button>
                      {posterForm.image_url && posterForm.aspect_ratio && (
                        <div className="mt-2 relative">
                          <img
                            src={posterForm.image_url}
                            alt="Preview"
                            className={cn(
                              'w-full object-cover rounded-lg border border-white/20',
                              posterForm.aspect_ratio === '9:16' ? 'aspect-[9/16]' :
                                posterForm.aspect_ratio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'
                            )}
                          />
                          <button
                            onClick={() => setPosterForm({ ...posterForm, image_url: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  {editingPoster && (
                    <Button variant="ghost" onClick={resetPosterForm}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  )}
                  <Button onClick={handleSavePoster} disabled={savingPoster} className="gap-2">
                    {savingPoster ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {editingPoster ? 'Update' : 'Publikasi'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* My Posters */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-primary">Poster Saya ({myPosters.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {myPosters.length === 0 ? (
                  <Card className="p-6 text-center col-span-full bg-card/50 border-white/20">
                    <p className="text-muted-foreground">Belum ada poster</p>
                  </Card>
                ) : (
                  myPosters.map((poster) => (
                    <Card key={poster.id} className="overflow-hidden bg-card/50 border-white/20 group">
                      <div className="relative overflow-hidden">
                        {poster.image_url && (
                          <img
                            src={poster.image_url}
                            alt={poster.title || ''}
                            className={cn(
                              'w-full object-cover group-hover:scale-105 transition-transform',
                              poster.aspect_ratio === '9:16' ? 'aspect-[9/16]' :
                                poster.aspect_ratio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'
                            )}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPoster(poster)
                              setPosterForm({
                                title: poster.title || '',
                                image_url: poster.image_url || '',
                                aspect_ratio: poster.aspect_ratio || '9:16',
                                division: poster.division
                              })
                            }}
                            className="bg-black/50 hover:bg-black/70"
                          >
                            <Edit2 className="h-4 w-4 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePoster(poster.id)}
                            className="bg-black/50 hover:bg-black/70"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium line-clamp-1">{poster.title}</p>
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
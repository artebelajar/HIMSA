"use client"

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { FileText, Quote, ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getDivisionNames } from '@/lib/divisions'
import type { Post } from '@/lib/types'
import { ArticleForm } from '@/components/upload/article-form'
import { QuoteForm } from '@/components/upload/quote-form'
import { PosterForm } from '@/components/upload/poster-form'
import { ArticleList } from '@/components/upload/article-list'
import { QuoteList } from '@/components/upload/quote-list'
import { PosterList } from '@/components/upload/poster-list'

export default function UploadPage() {
  const { user } = useApp()
  const [activeTab, setActiveTab] = useState('article')
  const [divisions, setDivisions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [articles, setArticles] = useState<Post[]>([])
  const [quotes, setQuotes] = useState<Post[]>([])
  const [posters, setPosters] = useState<Post[]>([])

  // Article
  const [articleForm, setArticleForm] = useState({ title: '', content: '', image_url: '', division: '' })
  const [editingArticle, setEditingArticle] = useState<Post | null>(null)
  const [articleImageMode, setArticleImageMode] = useState<'url' | 'upload'>('url')
  const [uploadingArticle, setUploadingArticle] = useState(false)
  const [savingArticle, setSavingArticle] = useState(false)

  // Quote
  const [quoteForm, setQuoteForm] = useState({ content: '', division: '' })
  const [editingQuote, setEditingQuote] = useState<Post | null>(null)
  const [savingQuote, setSavingQuote] = useState(false)

  // Poster
  const [posterForm, setPosterForm] = useState({ title: '', image_url: '', aspect_ratio: '9:16' as const, division: '' })
  const [editingPoster, setEditingPoster] = useState<Post | null>(null)
  const [posterImageMode, setPosterImageMode] = useState<'url' | 'upload'>('url')
  const [uploadingPoster, setUploadingPoster] = useState(false)
  const [savingPoster, setSavingPoster] = useState(false)

  useEffect(() => { loadDivisions(); loadAllPosts() }, [])
  useEffect(() => { localStorage.setItem('upload_tab', activeTab) }, [activeTab])

  const loadDivisions = async () => { setDivisions(await getDivisionNames()) }

  const loadAllPosts = async () => {
    setIsLoading(true)
    try {
      const r = await fetch('/api/posts'); const d = await r.json()
      if (d.success) { const posts = d.data as Post[]; setArticles(posts.filter(p => p.type === 'article')); setQuotes(posts.filter(p => p.type === 'quote')); setPosters(posts.filter(p => p.type === 'poster')) }
    } catch (e) {} finally { setIsLoading(false) }
  }

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop(); const fileName = `${folder}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { error } = await supabase.storage.from('uploads').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
    return data.publicUrl
  }

  const savePost = async (type: string, payload: any, isEditing: boolean, editingId?: string) => {
    const url = '/api/posts'; const method = isEditing ? 'PUT' : 'POST'
    const body = isEditing ? { id: editingId, ...payload } : payload
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    if (d.success) { toast.success(`${type} ${isEditing ? 'diperbarui' : 'dipublikasi'}`); await loadAllPosts(); return true }
    else { toast.error(d.error || 'Gagal'); return false }
  }

  const handleArticleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('File harus gambar'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Maksimal 5 MB'); return }
    setUploadingArticle(true)
    try { const url = await uploadFile(file, 'articles'); setArticleForm({ ...articleForm, image_url: url }); toast.success('Gambar diupload') }
    catch (err: any) { toast.error(err.message) } finally { setUploadingArticle(false) }
  }

  const handleSaveArticle = async () => {
    if (!articleForm.title || !articleForm.content || !articleForm.division) { toast.error('Judul, konten, dan divisi harus diisi'); return }
    if (!user) return
    setSavingArticle(true)
    const success = await savePost('Artikel', { type: 'article', title: articleForm.title, content: articleForm.content, image_url: articleForm.image_url || null, division: articleForm.division, author_id: user.id, author_name: user.name }, !!editingArticle, editingArticle?.id)
    if (success) { setArticleForm({ title: '', content: '', image_url: '', division: '' }); setEditingArticle(null) }
    setSavingArticle(false)
  }

  const handleSaveQuote = async () => {
    if (!quoteForm.content || !quoteForm.division) { toast.error('Quote dan divisi harus diisi'); return }
    if (!user) return
    setSavingQuote(true)
    const success = await savePost('Quote', { type: 'quote', content: quoteForm.content, division: quoteForm.division, author_id: user.id, author_name: user.name }, !!editingQuote, editingQuote?.id)
    if (success) { setQuoteForm({ content: '', division: '' }); setEditingQuote(null) }
    setSavingQuote(false)
  }

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('File harus gambar'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Maksimal 5 MB'); return }
    setUploadingPoster(true)
    try { const url = await uploadFile(file, 'posters'); setPosterForm({ ...posterForm, image_url: url }); toast.success('Gambar diupload') }
    catch (err: any) { toast.error(err.message) } finally { setUploadingPoster(false) }
  }

  const handleSavePoster = async () => {
    if (!posterForm.title || !posterForm.division) { toast.error('Judul dan divisi harus diisi'); return }
    if (!user) return
    setSavingPoster(true)
    const success = await savePost('Poster', { type: 'poster', title: posterForm.title, image_url: posterForm.image_url || null, aspect_ratio: posterForm.aspect_ratio, division: posterForm.division, author_id: user.id, author_name: user.name }, !!editingPoster, editingPoster?.id)
    if (success) { setPosterForm({ title: '', image_url: '', aspect_ratio: '9:16', division: '' }); setEditingPoster(null) }
    setSavingPoster(false)
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm('Hapus?')) return
    try { await fetch(`/api/posts?id=${id}`, { method: 'DELETE' }); toast.success('Dihapus'); await loadAllPosts() }
    catch (e) { toast.error('Gagal') }
  }

  if (isLoading) return <MainLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-6">
        <div className="mb-8"><h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">Upload Konten</h1><p className="text-muted-foreground">Bagikan artikel, quotes, dan poster</p></div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-card/30 border border-white/20">
            <TabsTrigger value="article"><FileText className="h-4 w-4 mr-2" />Artikel</TabsTrigger>
            <TabsTrigger value="quote"><Quote className="h-4 w-4 mr-2" />Quote</TabsTrigger>
            <TabsTrigger value="poster"><ImageIcon className="h-4 w-4 mr-2" />Poster</TabsTrigger>
          </TabsList>

          <TabsContent value="article" className="space-y-6">
            <ArticleForm form={articleForm} imageMode={articleImageMode} uploading={uploadingArticle} saving={savingArticle} isEditing={!!editingArticle} divisions={divisions} onFormChange={setArticleForm} onImageModeChange={setArticleImageMode} onUpload={handleArticleUpload} onSave={handleSaveArticle} onCancel={() => { setEditingArticle(null); setArticleForm({ title: '', content: '', image_url: '', division: '' }) }} />
            <ArticleList articles={articles} userId={user?.id} onEdit={(a) => { setEditingArticle(a); setArticleForm({ title: a.title || '', content: a.content || '', image_url: a.image_url || '', division: a.division }) }} onDelete={handleDeletePost} />
          </TabsContent>

          <TabsContent value="quote" className="space-y-6">
            <QuoteForm form={quoteForm} saving={savingQuote} isEditing={!!editingQuote} divisions={divisions} onFormChange={setQuoteForm} onSave={handleSaveQuote} onCancel={() => { setEditingQuote(null); setQuoteForm({ content: '', division: '' }) }} />
            <QuoteList quotes={quotes} userId={user?.id} onEdit={(q) => { setEditingQuote(q); setQuoteForm({ content: q.content || '', division: q.division }) }} onDelete={handleDeletePost} />
          </TabsContent>

          <TabsContent value="poster" className="space-y-6">
            <PosterForm form={posterForm} imageMode={posterImageMode} uploading={uploadingPoster} saving={savingPoster} isEditing={!!editingPoster} divisions={divisions} onFormChange={setPosterForm} onImageModeChange={setPosterImageMode} onUpload={handlePosterUpload} onSave={handleSavePoster} onCancel={() => { setEditingPoster(null); setPosterForm({ title: '', image_url: '', aspect_ratio: '9:16', division: '' }) }} />
            <PosterList posters={posters} userId={user?.id} onEdit={(p) => { setEditingPoster(p); setPosterForm({ title: p.title || '', image_url: p.image_url || '', aspect_ratio: (p.aspect_ratio as any) || '9:16', division: p.division }) }} onDelete={handleDeletePost} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
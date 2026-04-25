"use client"

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, FileText, Image, Quote, ChevronRight, Loader2 } from 'lucide-react'
import { useApp } from '@/providers/app-provider'
import { ArticleDetailModal } from '@/components/article-detail-modal'
import { HafalanSection } from '@/components/hafalan-section'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Post {
  id: string
  type: 'article' | 'quote' | 'poster'
  title: string | null
  content: string | null
  image_url: string | null
  aspect_ratio: string | null
  division: string
  author_id: string
  author_name: string
  likes_count: number
  created_at: string
  liked?: boolean
}

export default function DashboardPage() {
  const { user } = useApp()
  const [articles, setArticles] = useState<Post[]>([])
  const [quotes, setQuotes] = useState<Post[]>([])
  const [posters, setPosters] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<Post | null>(null)
  const [articlePage, setArticlePage] = useState(1)
  const [quotePage, setQuotePage] = useState(1)
  const [posterPage, setPosterPage] = useState(1)
  const [likingPost, setLikingPost] = useState<string | null>(null)

  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    loadAllPosts()
  }, [user])

  const loadAllPosts = async () => {
    setIsLoading(true)
    try {
      const url = user ? `/api/posts?userId=${user.id}` : '/api/posts'
      const response = await fetch(url)
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

  const handleLike = async (post: Post) => {
    if (!user) {
      toast.error('Silahkan login untuk menyukai postingan')
      return
    }

    setLikingPost(post.id)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          post_id: post.id,
          user_id: user.id,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        // Update local state
        const updatePost = (p: Post) => 
          p.id === post.id 
            ? { 
                ...p, 
                liked: result.data.liked, 
                likes_count: result.data.liked ? p.likes_count + 1 : p.likes_count - 1 
              } 
            : p
        
        setArticles(prev => prev.map(updatePost))
        setQuotes(prev => prev.map(updatePost))
        setPosters(prev => prev.map(updatePost))
        
        if (selectedArticle?.id === post.id) {
          setSelectedArticle(prev => prev ? { 
            ...prev, 
            liked: result.data.liked, 
            likes_count: result.data.liked ? prev.likes_count + 1 : prev.likes_count - 1 
          } : null)
        }
      }
    } catch (error) {
      toast.error('Gagal menyukai postingan')
    } finally {
      setLikingPost(null)
    }
  }

  const articlesPaginated = articles.slice((articlePage - 1) * ITEMS_PER_PAGE, articlePage * ITEMS_PER_PAGE)
  const quotesPaginated = quotes.slice((quotePage - 1) * ITEMS_PER_PAGE, quotePage * ITEMS_PER_PAGE)
  const postersPaginated = posters.slice((posterPage - 1) * ITEMS_PER_PAGE, posterPage * ITEMS_PER_PAGE)

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
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-orbitron text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Selamat datang, <span className="text-primary">{user?.name}</span>
          </p>
        </div>

        <HafalanSection />

        {/* Tabs */}
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/30 border border-white/10 backdrop-blur-sm p-1">
            <TabsTrigger value="articles" className="flex gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <FileText className="h-4 w-4" />
              <span>Artikel</span>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Quote className="h-4 w-4" />
              <span>Quotes</span>
            </TabsTrigger>
            <TabsTrigger value="posters" className="flex gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Image className="h-4 w-4" />
              <span>Poster</span>
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="mt-6 space-y-4">
            {articles.length === 0 ? (
              <Card className="bg-card/30 border-white/10 p-12 text-center backdrop-blur-sm">
                <p className="text-muted-foreground">Belum ada artikel</p>
              </Card>
            ) : (
              <>
                {articlesPaginated.map((article) => (
                  <Card
                    key={article.id}
                    className="bg-gradient-to-br from-card/50 to-card/30 border border-white/10 overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer group backdrop-blur-sm"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex gap-4 p-4">
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          alt={article.title || ''}
                          className="w-40 h-40 object-cover rounded-lg border border-white/10 group-hover:border-primary/50 transition-all"
                        />
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-orbitron text-lg font-semibold text-foreground group-hover:text-primary transition">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {article.content}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex gap-3 text-xs">
                            <span className="bg-primary/20 text-primary px-2 py-1 rounded-full font-semibold">
                              {article.division}
                            </span>
                            <span className="text-muted-foreground">
                              {article.author_name}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(article.created_at).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLike(article)
                              }}
                              disabled={likingPost === article.id}
                              className="h-8 w-8"
                            >
                              {likingPost === article.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Heart
                                  className={cn('h-4 w-4', {
                                    'fill-red-500 text-red-500': article.liked,
                                  })}
                                />
                              )}
                            </Button>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {article.likes_count}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {articles.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setArticlePage(p => Math.max(1, p - 1))}
                      disabled={articlePage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Halaman {articlePage} dari {Math.ceil(articles.length / ITEMS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setArticlePage(p => p + 1)}
                      disabled={articlePage >= Math.ceil(articles.length / ITEMS_PER_PAGE)}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="mt-6">
            {quotes.length === 0 ? (
              <Card className="bg-card/30 border-white/10 p-12 text-center backdrop-blur-sm">
                <p className="text-muted-foreground">Belum ada quotes</p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quotesPaginated.map((quote, idx) => {
                    const colors = [
                      'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-blue-500/10',
                      'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10',
                      'border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10',
                      'border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-red-500/10',
                      'border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10',
                    ]
                    return (
                      <Card
                        key={quote.id}
                        className={cn('p-6 border backdrop-blur-sm group hover:shadow-lg transition-all duration-300', colors[idx % colors.length])}
                      >
                        <div className="flex flex-col h-full">
                          <p className="text-foreground font-semibold text-center flex-1 flex items-center justify-center mb-4 italic">
                            "{quote.content}"
                          </p>
                          <div className="border-t border-white/20 pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs">
                                <p className="text-muted-foreground">{quote.division}</p>
                                <p className="text-primary font-semibold">{quote.author_name}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleLike(quote)}
                                disabled={likingPost === quote.id}
                                className="h-8 w-8"
                              >
                                {likingPost === quote.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Heart
                                    className={cn('h-4 w-4', {
                                      'fill-red-500 text-red-500': quote.liked,
                                    })}
                                  />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{new Date(quote.created_at).toLocaleDateString('id-ID')}</span>
                              <span>{quote.likes_count} suka</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
                {quotes.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuotePage(p => Math.max(1, p - 1))}
                      disabled={quotePage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Halaman {quotePage} dari {Math.ceil(quotes.length / ITEMS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuotePage(p => p + 1)}
                      disabled={quotePage >= Math.ceil(quotes.length / ITEMS_PER_PAGE)}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Posters Tab */}
          <TabsContent value="posters" className="mt-6">
            {posters.length === 0 ? (
              <Card className="bg-card/30 border-white/10 p-12 text-center backdrop-blur-sm">
                <p className="text-muted-foreground">Belum ada poster</p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {postersPaginated.map((poster) => {
                    const getAspectRatio = () => {
                      const ratio = poster.aspect_ratio || '1:1'
                      if (poster.aspect_ratio === '9:16') return 'aspect-[9/16]'
                      if (poster.aspect_ratio === '16:9') return 'aspect-video'
                      return 'aspect-square'
                    }
                    return (
                      <Card
                        key={poster.id}
                        className="bg-card/30 border border-white/10 overflow-hidden hover:border-primary/50 transition-all duration-300 group backdrop-blur-sm"
                      >
                        <div className="relative overflow-hidden">
                          {poster.image_url && (
                            <img
                              src={poster.image_url}
                              alt={poster.title || ''}
                              className={cn(
                                'w-full object-cover group-hover:scale-105 transition-transform duration-300',
                                getAspectRatio()
                              )}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <p className="text-white font-semibold text-sm">{poster.title}</p>
                          </div>
                        </div>
                        <div className="p-4 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="text-xs">
                              <p className="text-muted-foreground">{poster.division}</p>
                              <p className="text-primary font-semibold">{poster.author_name}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleLike(poster)}
                              disabled={likingPost === poster.id}
                              className="h-8 w-8"
                            >
                              {likingPost === poster.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Heart
                                  className={cn('h-4 w-4', {
                                    'fill-red-500 text-red-500': poster.liked,
                                  })}
                                />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>{new Date(poster.created_at).toLocaleDateString('id-ID')}</span>
                            <span>{poster.likes_count} suka</span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
                {posters.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPosterPage(p => Math.max(1, p - 1))}
                      disabled={posterPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Halaman {posterPage} dari {Math.ceil(posters.length / ITEMS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPosterPage(p => p + 1)}
                      disabled={posterPage >= Math.ceil(posters.length / ITEMS_PER_PAGE)}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ArticleDetailModal
        open={selectedArticle !== null}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
        article={selectedArticle}
        onLike={(id) => {
          if (selectedArticle) {
            handleLike(selectedArticle)
          }
        }}
      />
    </MainLayout>
  )
}
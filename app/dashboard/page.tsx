'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, FileText, Image, Quote, ChevronRight } from 'lucide-react'
import { useApp } from '@/providers/app-provider'
import { ArticleDetailModal } from '@/components/article-detail-modal'
import { HafalanSection } from '@/components/hafalan-section'
import { KasSection } from '@/components/kas-section'
import { Pagination } from '@/components/pagination'
import { cn } from '@/lib/utils'

interface Article {
  id: string
  title: string
  content: string
  image: string
  division: string
  author: string
  likes: number
  liked: boolean
  createdAt: string
}

interface QuotePost {
  id: string
  text: string
  division: string
  author: string
  color: string
  likes: number
  liked: boolean
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
  liked: boolean
  createdAt: string
}

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

export default function DashboardPage() {
  const { user } = useApp()
  const [articles, setArticles] = useState<Article[]>([])
  const [quotes, setQuotes] = useState<QuotePost[]>([])
  const [posters, setPosters] = useState<Poster[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articlePage, setArticlePage] = useState(1)
  const [quotePage, setQuotePage] = useState(1)
  const [posterPage, setPosterPage] = useState(1)

  const ITEMS_PER_PAGE = 10
  const articlesPaginated = articles.slice((articlePage - 1) * ITEMS_PER_PAGE, articlePage * ITEMS_PER_PAGE)
  const quotesPaginated = quotes.slice((quotePage - 1) * ITEMS_PER_PAGE, quotePage * ITEMS_PER_PAGE)
  const postersPaginated = posters.slice((posterPage - 1) * ITEMS_PER_PAGE, posterPage * ITEMS_PER_PAGE)

  useEffect(() => {
    const savedArticles = localStorage.getItem('himsa_articles')
    const savedQuotes = localStorage.getItem('himsa_quotes')
    const savedPosters = localStorage.getItem('himsa_posters')

    if (savedArticles) setArticles(JSON.parse(savedArticles))
    else {
      const dummyArticles: Article[] = [
        {
          id: '1',
          title: 'Kajian Rutin Ahad Pagi',
          content: 'Kegiatan kajian rutin setiap hari Ahad pagi dengan tema-tema islami yang relevan dan menarik. Diikuti oleh seluruh anggota HIMSA dan terbuka untuk umum. Dalam setiap kajian, kami membahas berbagai topik mulai dari akhlak, fiqih, hingga motivasi dalam kehidupan sehari-hari.',
          image: 'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=500&h=300&fit=crop',
          division: 'Dakwah',
          author: 'Admin HIMSA',
          likes: 24,
          liked: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Acara Bersih-Bersih Masjid',
          content: 'Program kebersihan masjid yang dilakukan setiap dua minggu sekali melibatkan semua anggota divisi kebersihan. Kegiatan ini sangat penting untuk menjaga kesucian tempat ibadah kita.',
          image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
          division: 'Kebersihan',
          author: 'Divisi Kebersihan',
          likes: 18,
          liked: false,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          title: 'Pelatihan Kesehatan Mental',
          content: 'Workshop khusus tentang kesehatan mental dan cara mengelola stress dalam kehidupan akademis. Dibimbing oleh praktisi kesehatan profesional.',
          image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
          division: 'Kesehatan',
          author: 'Divisi Kesehatan',
          likes: 31,
          liked: false,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]
      setArticles(dummyArticles)
      localStorage.setItem('himsa_articles', JSON.stringify(dummyArticles))
    }

    if (savedQuotes) setQuotes(JSON.parse(savedQuotes))
    else {
      const dummyQuotes: QuotePost[] = [
        {
          id: '1',
          text: 'Kebersihan itu indah dan bagian dari iman',
          division: 'Kebersihan',
          author: 'Divisi Kebersihan',
          color: QUOTE_COLORS[0],
          likes: 18,
          liked: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          text: 'Kesehatan adalah investasi terbaik untuk masa depan',
          division: 'Kesehatan',
          author: 'Divisi Kesehatan',
          color: QUOTE_COLORS[1],
          likes: 22,
          liked: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          text: 'Kebersamaan adalah kekuatan HIMSA',
          division: 'Ketua',
          author: 'Ketua Umum',
          color: QUOTE_COLORS[2],
          likes: 45,
          liked: false,
          createdAt: new Date().toISOString(),
        },
      ]
      setQuotes(dummyQuotes)
      localStorage.setItem('himsa_quotes', JSON.stringify(dummyQuotes))
    }

    if (savedPosters) setPosters(JSON.parse(savedPosters))
    else {
      const dummyPosters: Poster[] = [
        {
          id: '1',
          title: 'Lomba Olahraga Santri 2026',
          image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=750&fit=crop',
          ratio: '9:16',
          division: 'Olahraga',
          author: 'Divisi Olahraga',
          likes: 32,
          liked: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Seminar Dakwah Digital',
          image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
          ratio: '1:1',
          division: 'Dakwah',
          author: 'Divisi Dakwah',
          likes: 28,
          liked: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Edukasi Kesehatan Gizi',
          image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop',
          ratio: '16:9',
          division: 'Kesehatan',
          author: 'Divisi Kesehatan',
          likes: 19,
          liked: false,
          createdAt: new Date().toISOString(),
        },
      ]
      setPosters(dummyPosters)
      localStorage.setItem('himsa_posters', JSON.stringify(dummyPosters))
    }
  }, [])

  const handleLike = (type: 'article' | 'quote' | 'poster', id: string) => {
    if (type === 'article') {
      const updated = articles.map((a) => {
        if (a.id === id) {
          const newLiked = !a.liked
          return { ...a, liked: newLiked, likes: a.likes + (newLiked ? 1 : -1) }
        }
        return a
      })
      setArticles(updated)
      localStorage.setItem('himsa_articles', JSON.stringify(updated))
    } else if (type === 'quote') {
      const updated = quotes.map((q) => {
        if (q.id === id) {
          const newLiked = !q.liked
          return { ...q, liked: newLiked, likes: q.likes + (newLiked ? 1 : -1) }
        }
        return q
      })
      setQuotes(updated)
      localStorage.setItem('himsa_quotes', JSON.stringify(updated))
    } else {
      const updated = posters.map((p) => {
        if (p.id === id) {
          const newLiked = !p.liked
          return { ...p, liked: newLiked, likes: p.likes + (newLiked ? 1 : -1) }
        }
        return p
      })
      setPosters(updated)
      localStorage.setItem('himsa_posters', JSON.stringify(updated))
    }
  }

  const getQuoteGradient = (colorClass: string) => {
    const colorMap: Record<string, string> = {
      'from-cyan-500/20 to-blue-500/20': 'border-cyan-500/50 bg-cyan-500/10',
      'from-purple-500/20 to-pink-500/20': 'border-purple-500/50 bg-purple-500/10',
      'from-green-500/20 to-emerald-500/20': 'border-green-500/50 bg-green-500/10',
      'from-orange-500/20 to-red-500/20': 'border-orange-500/50 bg-orange-500/10',
      'from-indigo-500/20 to-cyan-500/20': 'border-indigo-500/50 bg-indigo-500/10',
    }
    return colorMap[colorClass] || 'border-primary/50 bg-primary/10'
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-orbitron text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Selamat datang, <span className="text-primary">{user?.name}</span></p>
        </div>

        {/* Hafalan & Kas Sections */}
        <HafalanSection />
        <KasSection />

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
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-40 h-40 object-cover rounded-lg border border-white/10 group-hover:border-primary/50 transition-all"
                    />
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
                            {article.author}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLike('article', article.id)
                            }}
                            className="h-8 w-8"
                          >
                            <Heart
                              className={cn('h-4 w-4', {
                                'fill-destructive text-destructive': article.liked,
                              })}
                            />
                          </Button>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {article.likes}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                ))}
                {articles.length > ITEMS_PER_PAGE && (
                  <Pagination
                    currentPage={articlePage}
                    totalPages={Math.ceil(articles.length / ITEMS_PER_PAGE)}
                    onPageChange={setArticlePage}
                  />
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
                  {quotesPaginated.map((quote) => (
                <Card
                  key={quote.id}
                  className={cn(
                    'p-6 border backdrop-blur-sm group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer',
                    getQuoteGradient(quote.color)
                  )}
                >
                  <div className="flex flex-col h-full">
                    <p className="text-foreground font-semibold text-center flex-1 flex items-center justify-center mb-4">
                      {quote.text}
                    </p>
                    <div className="border-t border-white/20 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <p className="text-muted-foreground">{quote.division}</p>
                          <p className="text-primary font-semibold">{quote.author}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleLike('quote', quote.id)}
                          className="h-8 w-8"
                        >
                          <Heart
                            className={cn('h-4 w-4', {
                              'fill-destructive text-destructive': quote.liked,
                            })}
                          />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground block text-center">
                        {quote.likes} suka
                      </span>
                    </div>
                  </div>
                </Card>
                  ))}
                </div>
                {quotes.length > ITEMS_PER_PAGE && (
                  <Pagination
                    currentPage={quotePage}
                    totalPages={Math.ceil(quotes.length / ITEMS_PER_PAGE)}
                    onPageChange={setQuotePage}
                  />
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
                  if (poster.ratio === '9:16') return 'aspect-[9/16]'
                  if (poster.ratio === '16:9') return 'aspect-video'
                  return 'aspect-square'
                }
                return (
                  <Card
                    key={poster.id}
                    className="bg-card/30 border border-white/10 overflow-hidden hover:border-primary/50 transition-all duration-300 group backdrop-blur-sm"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={poster.image}
                        alt={poster.title}
                        className={cn(
                          'w-full object-cover group-hover:scale-105 transition-transform duration-300',
                          getAspectRatio()
                        )}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <p className="text-white font-semibold text-sm">{poster.title}</p>
                      </div>
                    </div>
                    <div className="p-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <p className="text-muted-foreground">{poster.division}</p>
                          <p className="text-primary font-semibold">{poster.author}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleLike('poster', poster.id)}
                          className="h-8 w-8"
                        >
                          <Heart
                            className={cn('h-4 w-4', {
                              'fill-destructive text-destructive': poster.liked,
                            })}
                          />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground block mt-2 text-center">
                        {poster.likes} suka
                      </span>
                    </div>
                  </Card>
                  )
                })}
                </div>
                {posters.length > ITEMS_PER_PAGE && (
                  <Pagination
                    currentPage={posterPage}
                    totalPages={Math.ceil(posters.length / ITEMS_PER_PAGE)}
                    onPageChange={setPosterPage}
                  />
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
          handleLike('article', id)
        }}
      />
    </MainLayout>
  )
}

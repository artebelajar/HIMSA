"use client"

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useApp } from '@/providers/app-provider'
import { useRouter } from 'next/navigation'
import { 
  Users, FileText, Wallet, TrendingUp, TrendingDown, 
  Calendar, Clock, User, Loader2, ArrowRight, Bell,
  BookOpen, Utensils, Moon, Sun, Mic, Sparkles,
  PieChartIcon, BarChart3, Activity, DollarSign, ShoppingCart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DashboardStats {
  totalUsers: number
  roleStats: {
    admin: number
    division: number
    santri: number
    user: number
  }
  totalPosts: number
  postsByType: {
    article: number
    quote: number
    poster: number
  }
  santriPerKelas: Record<string, number>
  keuangan: {
    balance: number
    totalKas: number
    kasLunas: number
    kasTotal: number
    persentaseKas: number
  }
  recentActivities: {
    transactions: any[]
    posts: any[]
    users: any[]
  }
  todaySchedule: {
    welfare: any[]
    dakwah: any[]
  }
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboardPage() {
  const { user } = useApp()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadStats()
  }, [user])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/dashboard')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const getAvatarUrl = (name: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
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

  if (!stats) return null

  // Data untuk grafik role
  const roleData = [
    { name: 'Admin', value: stats.roleStats.admin, color: '#ef4444' },
    { name: 'Division', value: stats.roleStats.division, color: '#3b82f6' },
    { name: 'Santri', value: stats.roleStats.santri, color: '#10b981' },
    { name: 'User', value: stats.roleStats.user, color: '#f59e0b' },
  ]

  // Data untuk grafik posts
  const postsData = [
    { name: 'Artikel', value: stats.postsByType.article, color: '#3b82f6' },
    { name: 'Quote', value: stats.postsByType.quote, color: '#8b5cf6' },
    { name: 'Poster', value: stats.postsByType.poster, color: '#ec4899' },
  ]

  // Data untuk grafik santri per kelas
  const kelasData = Object.entries(stats.santriPerKelas).map(([name, value]) => ({
    name: `Kelas ${name}`,
    value,
  }))

  return (
    <MainLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Overview lengkap aplikasi HIMSA</p>
          </div>
          <Button onClick={loadStats} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
                <p className="text-xs text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Wallet className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatRupiah(stats.keuangan.balance)}</p>
                <p className="text-xs text-muted-foreground">Saldo</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.keuangan.persentaseKas}%</p>
                <p className="text-xs text-muted-foreground">Kas Lunas</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Distribution */}
          <Card className="bg-card/50 border-white/20 p-4">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribusi Users
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Posts Distribution */}
          <Card className="bg-card/50 border-white/20 p-4">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Posts by Type
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px' 
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Santri per Kelas */}
          <Card className="bg-card/50 border-white/20 p-4">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Santri per Kelas
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kelasData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" width={60} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px' 
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Today's Schedule */}
          <Card className="bg-card/50 border-white/20 p-4">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jadwal Hari Ini
            </h3>
            <div className="space-y-4">
              {/* Welfare */}
              {stats.todaySchedule.welfare.length > 0 ? (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Utensils className="h-4 w-4 text-orange-400" />
                    <span className="font-medium text-orange-400">Kesejahteraan (Masak)</span>
                  </div>
                  <p className="text-sm">
                    Petugas: <span className="font-semibold">{stats.todaySchedule.welfare[0]?.santri_name}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada jadwal masak hari ini</p>
              )}

              {/* Dakwah */}
              {stats.todaySchedule.dakwah.length > 0 && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-purple-400">Dakwah</span>
                  </div>
                  <div className="space-y-1">
                    {stats.todaySchedule.dakwah.map((d, i) => (
                      <p key={i} className="text-sm">
                        {d.type === 'imam' ? '🕌 Imam' : d.type === 'muadzin' ? '📢 Muadzin' : '🎤 Kultum'}: {' '}
                        <span className="font-semibold">{d.santri_name}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activities & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <Card className="bg-card/50 border-white/20 p-4">
            <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              User Baru
            </h3>
            <div className="space-y-3">
              {stats.recentActivities.users.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(u.name)} />
                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{u.role}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Posts */}
          <Card className="bg-card/50 border-white/20 p-4">
            <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Post Terbaru
            </h3>
            <div className="space-y-3">
              {stats.recentActivities.posts.map((p) => (
                <div key={p.id} className="flex items-start gap-3">
                  <div className={cn(
                    "p-1.5 rounded",
                    p.type === 'article' ? "bg-blue-500/20" : 
                    p.type === 'quote' ? "bg-purple-500/20" : "bg-pink-500/20"
                  )}>
                    <FileText className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title || p.content}</p>
                    <p className="text-xs text-muted-foreground">{p.author_name} • {p.division}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-card/50 border-white/20 p-4">
            <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Transaksi Terbaru
            </h3>
            <div className="space-y-3">
              {stats.recentActivities.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded",
                      t.type === 'income' ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      {t.type === 'income' ? 
                        <TrendingUp className="h-3 w-3 text-green-400" /> : 
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.created_by_name}</p>
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold",
                    t.type === 'income' ? "text-green-400" : "text-red-400"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card/50 border-white/20 p-4">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push('/absensi')} variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Kelola Absensi
            </Button>
            <Button onClick={() => router.push('/keuangan')} variant="outline" className="gap-2">
              <Wallet className="h-4 w-4" />
              Keuangan
            </Button>
            <Button onClick={() => router.push('/kesejahteraan')} variant="outline" className="gap-2">
              <Utensils className="h-4 w-4" />
              Kesejahteraan
            </Button>
            <Button onClick={() => router.push('/dakwah')} variant="outline" className="gap-2">
              <Moon className="h-4 w-4" />
              Dakwah
            </Button>
            <Button onClick={() => router.push('/setting')} variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Manajemen Users
            </Button>
            <Button onClick={() => router.push('/proker')} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Proker
            </Button>
            <Button onClick={() => router.push('/upload')} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Upload Konten
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
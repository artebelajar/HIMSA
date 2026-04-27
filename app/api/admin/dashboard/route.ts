import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Total Users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Users by role
    const { data: usersByRole } = await supabase
      .from('users')
      .select('role')
    
    const roleStats = {
      admin: usersByRole?.filter(u => u.role === 'admin').length || 0,
      division: usersByRole?.filter(u => u.role === 'division').length || 0,
      santri: usersByRole?.filter(u => u.role === 'santri').length || 0,
      user: usersByRole?.filter(u => u.role === 'user').length || 0,
    }

    // Total Santri per Kelas
    const { data: kelasMembers } = await supabase
      .from('kelas_members')
      .select('kelas_id, kelas:kelas_id(name)')
    
    const santriPerKelas: Record<string, number> = {}
    kelasMembers?.forEach(m => {
      const kelasName = (m.kelas as any)?.name || 'Unknown'
      santriPerKelas[kelasName] = (santriPerKelas[kelasName] || 0) + 1
    })

    // Total Posts
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    // Posts by type
    const { data: posts } = await supabase
      .from('posts')
      .select('type')
    
    const postsByType = {
      article: posts?.filter(p => p.type === 'article').length || 0,
      quote: posts?.filter(p => p.type === 'quote').length || 0,
      poster: posts?.filter(p => p.type === 'poster').length || 0,
    }

    // Total Kas (bulan ini)
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    const { data: kasBulanIni } = await supabase
      .from('kas_kelas')
      .select('amount, is_paid')
      .eq('month', currentMonth)
      .eq('year', currentYear)

    const totalKas = kasBulanIni?.reduce((acc, k) => acc + (k.amount || 0), 0) || 0
    const kasLunas = kasBulanIni?.filter(k => k.is_paid).length || 0
    const kasTotal = kasBulanIni?.length || 0

    // Saldo Keuangan
    const { data: transactions } = await supabase
      .from('transactions')
      .select('type, amount')

    const balance = transactions?.reduce((acc, tx) => {
      return acc + (tx.type === 'income' ? tx.amount : -tx.amount)
    }, 0) || 0

    // Recent Activities
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentPosts } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentUsers } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // Jadwal Hari Ini
    const todayStr = today.toISOString().split('T')[0]
    
    const { data: scheduleToday } = await supabase
      .from('welfare_daily_schedule')
      .select('*')
      .eq('schedule_date', todayStr)
      .limit(1)

    const { data: dakwahToday } = await supabase
      .from('dakwah_schedule')
      .select('*')
      .eq('schedule_date', todayStr)
      .limit(3)

    // Quick Stats
    const stats = {
      totalUsers: totalUsers || 0,
      roleStats,
      totalPosts: totalPosts || 0,
      postsByType,
      santriPerKelas,
      keuangan: {
        balance,
        totalKas,
        kasLunas,
        kasTotal,
        persentaseKas: kasTotal > 0 ? Math.round((kasLunas / kasTotal) * 100) : 0,
      },
      recentActivities: {
        transactions: recentTransactions || [],
        posts: recentPosts || [],
        users: recentUsers || [],
      },
      todaySchedule: {
        welfare: scheduleToday || [],
        dakwah: dakwahToday || [],
      },
    }

    return successResponse(stats)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return serverErrorResponse(error)
  }
}
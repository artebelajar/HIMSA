import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().min(1, 'Deskripsi harus diisi'),
  category: z.string().min(1, 'Kategori harus diisi'),
  created_by: z.string().uuid(),
  created_by_name: z.string(),
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Get all transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (txError) return errorResponse(txError.message, 'DB_ERROR', 500)

    // Get kas
    const { data: kas } = await supabase
      .from('kas_kelas')
      .select(`
        id,
        kelas_id,
        user_id,
        month,
        year,
        amount,
        is_paid,
        paid_at,
        kelas:kelas_id (id, name),
        users:user_id (id, name, email, avatar_url)
      `)
      .eq('month', month)
      .eq('year', year)

    // Get kelas
    const { data: kelas } = await supabase
      .from('kelas')
      .select('*')
      .order('name', { ascending: true })

    // Get kelas members
    const { data: kelasMembers } = await supabase
      .from('kelas_members')
      .select(`
        kelas_id,
        user_id,
        users:user_id (id, name, email)
      `)

    // Hitung balance
    const balance = transactions?.reduce((acc, tx) => {
      return acc + (tx.type === 'income' ? tx.amount : -tx.amount)
    }, 0) || 0

    const totalIncome = transactions?.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0) || 0
    const totalExpense = transactions?.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0) || 0

    // Statistik per bulan (6 bulan terakhir)
    const monthlyStats = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      const statMonth = d.getMonth() + 1
      const statYear = d.getFullYear()
      
      const monthTransactions = transactions?.filter(tx => {
        const txDate = new Date(tx.created_at)
        return txDate.getMonth() + 1 === statMonth && txDate.getFullYear() === statYear
      }) || []
      
      const income = monthTransactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0)
      const expense = monthTransactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0)
      
      monthlyStats.push({
        month: d.toLocaleDateString('id-ID', { month: 'short' }),
        year: statYear,
        income,
        expense,
        balance: income - expense,
      })
    }

    // Statistik kas per kelas
    const kasStats = kelas?.map(k => {
      const kasInKelas = kas?.filter(kas => kas.kelas_id === k.id) || []
      const paid = kasInKelas.filter(kas => kas.is_paid).length
      const total = kasInKelas.length
      const totalAmount = kasInKelas.reduce((acc, kas) => acc + (kas.amount || 0), 0)
      const paidAmount = kasInKelas.filter(kas => kas.is_paid).reduce((acc, kas) => acc + (kas.amount || 0), 0)
      
      return {
        kelas_id: k.id,
        kelas_name: k.name,
        total_santri: total,
        paid_santri: paid,
        unpaid_santri: total - paid,
        percentage: total > 0 ? Math.round((paid / total) * 100) : 0,
        total_amount: totalAmount,
        paid_amount: paidAmount,
      }
    }) || []

    // Kategori pengeluaran
    const expenseByCategory = transactions?.filter(tx => tx.type === 'expense').reduce((acc, tx) => {
      const category = tx.category || 'Lainnya'
      if (!acc[category]) acc[category] = 0
      acc[category] += tx.amount
      return acc
    }, {} as Record<string, number>) || {}

    return successResponse({
      transactions: transactions || [],
      balance,
      totalIncome,
      totalExpense,
      kas: kas || [],
      kelas: kelas || [],
      kelasMembers: kelasMembers || [],
      month,
      year,
      monthlyStats,
      kasStats,
      expenseByCategory: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const action = body.action

    if (action === 'transaction') {
      const validation = transactionSchema.safeParse(body)
      if (!validation.success) {
        return validationErrorResponse(validation.error)
      }

      const { type, amount, description, category, created_by, created_by_name } = validation.data

      const { data, error } = await supabase
        .from('transactions')
        .insert([{ type, amount, description, category, created_by, created_by_name }])
        .select()
        .single()

      if (error) return errorResponse(error.message, 'CREATE_ERROR', 500)

      return successResponse(data, 'Transaksi berhasil ditambahkan', 201)
    }

    if (action === 'generate-kas') {
      const { kelas_id, month, year, amount } = body

      // Get all members in this kelas from absensi
      const { data: members, error: membersError } = await supabase
        .from('kelas_members')
        .select('user_id, kelas_id')
        .eq('kelas_id', kelas_id)

      if (membersError) return errorResponse(membersError.message, 'DB_ERROR', 500)

      if (!members || members.length === 0) {
        return errorResponse('Tidak ada anggota di kelas ini', 'NO_MEMBERS', 400)
      }

      // HAPUS kas lama untuk user-user di kelas ini (bulan & tahun yang sama)
      const userIds = members.map(m => m.user_id)
      await supabase
        .from('kas_kelas')
        .delete()
        .eq('month', month)
        .eq('year', year)
        .in('user_id', userIds)

      // Generate kas entries baru
      const kasEntries = members.map(m => ({
        kelas_id: m.kelas_id,
        user_id: m.user_id,
        month,
        year,
        amount: amount || 50000,
        is_paid: false,
      }))

      // Insert menggunakan upsert dengan ON CONFLICT
      const { data, error } = await supabase
        .from('kas_kelas')
        .upsert(kasEntries, { 
          onConflict: 'kelas_id,user_id,month,year',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error('Generate kas error:', error)
        return errorResponse(error.message, 'GENERATE_ERROR', 500)
      }

      return successResponse({ generated: data?.length || 0 }, `Kas untuk ${data?.length || 0} anggota berhasil dibuat`, 201)
    }

    if (action === 'cleanup-kas') {
      const { data: invalidKas } = await supabase
        .from('kas_kelas')
        .select('id, user_id, kelas_id')
      
      const { data: members } = await supabase
        .from('kelas_members')
        .select('user_id, kelas_id')
      
      const memberMap = new Map(members?.map(m => [m.user_id, m.kelas_id]) || [])
      
      const toDelete = (invalidKas || []).filter(kas => {
        const currentKelasId = memberMap.get(kas.user_id)
        return !currentKelasId || currentKelasId !== kas.kelas_id
      })
      
      if (toDelete.length > 0) {
        const ids = toDelete.map(k => k.id)
        await supabase.from('kas_kelas').delete().in('id', ids)
      }
      
      return successResponse({ cleaned: toDelete.length }, 'Data kas dibersihkan')
    }

    return errorResponse('Invalid action', 'INVALID_ACTION', 400)
  } catch (error) {
    console.error('POST error:', error)
    return serverErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { kas_id, is_paid } = body

    const updates: any = { is_paid }
    if (is_paid) {
      updates.paid_at = new Date().toISOString()
    } else {
      updates.paid_at = null
    }

    const { data, error } = await supabase
      .from('kas_kelas')
      .update(updates)
      .eq('id', kas_id)
      .select()
      .single()

    if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)

    return successResponse(data, is_paid ? 'Kas ditandai lunas' : 'Kas ditandai belum lunas')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return errorResponse('ID dan type diperlukan', 'MISSING_PARAMS', 400)
    }

    const table = type === 'transaction' ? 'transactions' : 'kas_kelas'
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) return errorResponse(error.message, 'DELETE_ERROR', 500)

    return successResponse(null, 'Data berhasil dihapus')
  } catch (error) {
    return serverErrorResponse(error)
  }
}
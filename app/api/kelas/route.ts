import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'

const addMemberSchema = z.object({
  kelas_id: z.string().uuid(),
  user_id: z.string().uuid(),
})

const setKetuaSchema = z.object({
  kelas_id: z.string().uuid(),
  user_id: z.string().uuid(),
})

const updateOrderSchema = z.object({
  kelas_id: z.string().uuid(),
  members: z.array(z.object({
    id: z.string().uuid(),
    nomor_absen: z.number(),
  })),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get all kelas
    const { data: kelas, error: kelasError } = await supabase
      .from('kelas')
      .select('*')
      .order('name', { ascending: true })

    if (kelasError) return errorResponse(kelasError.message, 'DB_ERROR', 500)

    // Get all members with user details - ORDER BY nomor_absen
    const { data: members, error: membersError } = await supabase
  .from('kelas_members')
  .select(`
    id,
    kelas_id,
    user_id,
    is_ketua,
    nomor_absen,
    users:user_id (id, name, email, role, avatar_url)
  `)
  .order('kelas_id', { ascending: true })
  .order('nomor_absen', { ascending: true, nullsFirst: false })

    if (membersError) return errorResponse(membersError.message, 'DB_ERROR', 500)

    // Get all santri
    const { data: allSantri, error: santriError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .in('role', ['santri', 'division'])
      .order('name', { ascending: true })

    if (santriError) return errorResponse(santriError.message, 'DB_ERROR', 500)

    // Get IDs of santri that are already in any class
    const assignedSantriIds = members?.map(m => m.user_id) || []
    
    // Filter available santri
    const availableSantri = allSantri?.filter(s => !assignedSantriIds.includes(s.id)) || []

    return successResponse({
      kelas: kelas || [],
      members: members || [],
      allSantri: allSantri || [],
      availableSantri: availableSantri,
      assignedSantriIds: assignedSantriIds,
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const validation = addMemberSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { kelas_id, user_id } = validation.data

    // Check if user is already in any class
    const { data: existingMember } = await supabase
      .from('kelas_members')
      .select('id, kelas_id')
      .eq('user_id', user_id)
      .single()

    if (existingMember) {
      const { data: kelasData } = await supabase
        .from('kelas')
        .select('name')
        .eq('id', existingMember.kelas_id)
        .single()
      
      return errorResponse(
        `Santri sudah terdaftar di Kelas ${kelasData?.name || 'lain'}`,
        'ALREADY_ASSIGNED',
        400
      )
    }

    // Get max nomor_absen for this kelas
    const { data: maxAbsen } = await supabase
      .from('kelas_members')
      .select('nomor_absen')
      .eq('kelas_id', kelas_id)
      .order('nomor_absen', { ascending: false })
      .limit(1)
      .single()

    const nextNomorAbsen = (maxAbsen?.nomor_absen || 0) + 1

    const { data, error } = await supabase
      .from('kelas_members')
      .insert([{ 
        kelas_id, 
        user_id, 
        is_ketua: false,
        nomor_absen: nextNomorAbsen 
      }])
      .select(`
        id,
        kelas_id,
        user_id,
        is_ketua,
        nomor_absen,
        users:user_id (id, name, email)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return errorResponse('Santri sudah terdaftar di kelas lain', 'ALREADY_ASSIGNED', 400)
      }
      return errorResponse(error.message, 'CREATE_ERROR', 500)
    }

    return successResponse(data, 'Santri berhasil ditambahkan ke kelas', 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('id')

    if (!memberId) {
      return errorResponse('Member ID diperlukan', 'MISSING_ID', 400)
    }

    // Get member info before delete
    const { data: member } = await supabase
      .from('kelas_members')
      .select('kelas_id, nomor_absen')
      .eq('id', memberId)
      .single()

    const { error } = await supabase
      .from('kelas_members')
      .delete()
      .eq('id', memberId)

    if (error) return errorResponse(error.message, 'DELETE_ERROR', 500)

    // Reorder remaining members
    if (member) {
      const { data: remainingMembers } = await supabase
        .from('kelas_members')
        .select('id')
        .eq('kelas_id', member.kelas_id)
        .gt('nomor_absen', member.nomor_absen)
        .order('nomor_absen', { ascending: true })

      for (const m of remainingMembers || []) {
        await supabase
          .from('kelas_members')
          .update({ nomor_absen: member.nomor_absen })
          .eq('id', m.id)
        member.nomor_absen++
      }
    }

    return successResponse(null, 'Santri dikeluarkan dari kelas')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { action } = body

    if (action === 'set_ketua') {
      const validation = setKetuaSchema.safeParse(body)
      if (!validation.success) {
        return validationErrorResponse(validation.error)
      }

      const { kelas_id, user_id } = validation.data

      await supabase
        .from('kelas_members')
        .update({ is_ketua: false })
        .eq('kelas_id', kelas_id)

      const { data, error } = await supabase
        .from('kelas_members')
        .update({ is_ketua: true })
        .eq('kelas_id', kelas_id)
        .eq('user_id', user_id)
        .select(`
          id,
          kelas_id,
          user_id,
          is_ketua,
          nomor_absen,
          users:user_id (id, name, email)
        `)
        .single()

      if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)

      return successResponse(data, 'Ketua kelas berhasil diubah')
    }

    if (action === 'update_order') {
      const validation = updateOrderSchema.safeParse(body)
      if (!validation.success) {
        return validationErrorResponse(validation.error)
      }

      const { members } = validation.data

      // Update each member's nomor_absen
      for (const member of members) {
        await supabase
          .from('kelas_members')
          .update({ nomor_absen: member.nomor_absen })
          .eq('id', member.id)
      }

      return successResponse(null, 'Urutan absen berhasil diupdate')
    }

    if (action === 'move_up') {
      const { memberId } = body
      
      const { data: member } = await supabase
        .from('kelas_members')
        .select('kelas_id, nomor_absen')
        .eq('id', memberId)
        .single()

      if (!member || member.nomor_absen <= 1) {
        return successResponse(null, 'Sudah di posisi paling atas')
      }

      // Swap with previous member
      const { data: prevMember } = await supabase
        .from('kelas_members')
        .select('id, nomor_absen')
        .eq('kelas_id', member.kelas_id)
        .eq('nomor_absen', member.nomor_absen - 1)
        .single()

      if (prevMember) {
        await supabase
          .from('kelas_members')
          .update({ nomor_absen: member.nomor_absen })
          .eq('id', prevMember.id)

        await supabase
          .from('kelas_members')
          .update({ nomor_absen: member.nomor_absen - 1 })
          .eq('id', memberId)
      }

      return successResponse(null, 'Urutan diubah')
    }

    if (action === 'move_down') {
      const { memberId } = body
      
      const { data: member } = await supabase
        .from('kelas_members')
        .select('kelas_id, nomor_absen')
        .eq('id', memberId)
        .single()

      if (!member) return errorResponse('Member tidak ditemukan', 'NOT_FOUND', 404)

      // Check if there's next member
      const { data: nextMember } = await supabase
        .from('kelas_members')
        .select('id')
        .eq('kelas_id', member.kelas_id)
        .eq('nomor_absen', member.nomor_absen + 1)
        .single()

      if (!nextMember) {
        return successResponse(null, 'Sudah di posisi paling bawah')
      }

      // Swap with next member
      await supabase
        .from('kelas_members')
        .update({ nomor_absen: member.nomor_absen })
        .eq('id', nextMember.id)

      await supabase
        .from('kelas_members')
        .update({ nomor_absen: member.nomor_absen + 1 })
        .eq('id', memberId)

      return successResponse(null, 'Urutan diubah')
    }

    return errorResponse('Invalid action', 'INVALID_ACTION', 400)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
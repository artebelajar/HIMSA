import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'
import { clearDivisionsCache } from '@/lib/divisions'

const createDivisionSchema = z.object({
  name: z.string().min(1, 'Nama divisi harus diisi').max(100),
  description: z.string().optional(),
  color: z.string().default('#00d9ff'),
})

const updateDivisionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nama divisi harus diisi').max(100).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  is_active: z.boolean().optional(),
})


export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Gunakan Admin Client - BYPASS AUTH
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .order('name')

    if (error) return errorResponse(error.message, 'DB_ERROR', 500)

    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Gunakan Admin Client - BYPASS AUTH
    const supabase = createAdminClient()
    const body = await request.json()
    
    const validation = createDivisionSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { name, description, color } = validation.data

    // Check if division already exists
    const { data: existing } = await supabase
      .from('divisions')
      .select('id')
      .ilike('name', name)
      .single()

    if (existing) {
      return errorResponse('Divisi dengan nama tersebut sudah ada', 'DUPLICATE', 400)
    }

    const { data, error } = await supabase
      .from('divisions')
      .insert([{ name, description, color }])
      .select()
      .single()

    if (error) return errorResponse(error.message, 'CREATE_ERROR', 500)

    clearDivisionsCache()
    return successResponse(data, 'Divisi berhasil ditambahkan', 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Gunakan Admin Client - BYPASS AUTH
    const supabase = createAdminClient()
    const body = await request.json()
    
    const validation = updateDivisionSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { id, ...updates } = validation.data

    const { data, error } = await supabase
      .from('divisions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)

    clearDivisionsCache()
    return successResponse(data, 'Divisi berhasil diupdate')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Gunakan Admin Client - BYPASS AUTH
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('ID divisi diperlukan', 'MISSING_ID', 400)
    }

    // Soft delete (set is_active = false)
    const { error } = await supabase
      .from('divisions')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return errorResponse(error.message, 'DELETE_ERROR', 500)

    clearDivisionsCache()
    return successResponse(null, 'Divisi berhasil dinonaktifkan')
  } catch (error) {
    return serverErrorResponse(error)
  }
}
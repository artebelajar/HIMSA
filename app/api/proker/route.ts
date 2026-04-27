import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'

const createProkerSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi'),
  description: z.string().optional(),
  division: z.string().min(1, 'Divisi harus diisi'),
  file_name: z.string(),
  file_url: z.string().url(),
  file_size: z.number().optional(),
  uploaded_by: z.string().uuid(),
  uploaded_by_name: z.string(),
})

const updateProkerSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Judul harus diisi').optional(),
  description: z.string().optional(),
  division: z.string().min(1, 'Divisi harus diisi').optional(),
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const division = searchParams.get('division')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('proker')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (division && division !== 'all') {
      query = query.eq('division', division)
    }

    const { data, error } = await query

    if (error) return errorResponse(error.message, 'DB_ERROR', 500)

    return successResponse(data || [])
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const validation = createProkerSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { title, description, division, file_name, file_url, file_size, uploaded_by, uploaded_by_name } = validation.data

    const { data, error } = await supabase
      .from('proker')
      .insert([{
        title,
        description: description || null,
        division,
        file_name,
        file_url,
        file_size: file_size || null,
        uploaded_by,
        uploaded_by_name,
      }])
      .select()
      .single()

    if (error) return errorResponse(error.message, 'CREATE_ERROR', 500)

    return successResponse(data, 'Proker berhasil diupload', 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const validation = updateProkerSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { id, ...updates } = validation.data

    const { data, error } = await supabase
      .from('proker')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)

    return successResponse(data, 'Proker berhasil diupdate')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const fileUrl = searchParams.get('fileUrl')

    if (!id) {
      return errorResponse('Proker ID required', 'MISSING_ID', 400)
    }

    // Hapus file dari storage jika ada
    if (fileUrl) {
      try {
        const url = new URL(fileUrl)
        const pathParts = url.pathname.split('/')
        const fileName = pathParts[pathParts.length - 1]
        
        if (fileName) {
          await supabase.storage.from('proker').remove([fileName])
        }
      } catch (e) {
        console.error('Failed to delete file:', e)
      }
    }

    const { error } = await supabase
      .from('proker')
      .delete()
      .eq('id', id)

    if (error) return errorResponse(error.message, 'DELETE_ERROR', 500)

    return successResponse(null, 'Proker berhasil dihapus')
  } catch (error) {
    return serverErrorResponse(error)
  }
}
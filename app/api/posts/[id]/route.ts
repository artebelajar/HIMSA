import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'

const updatePostSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().url().optional(),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']).optional(),
  division: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return errorResponse('Post not found', 'NOT_FOUND', 404)
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validation = updatePostSchema.safeParse(body)
    
    if (!validation.success) return validationErrorResponse(validation.error)

    const supabase = createAdminClient()
    const updates: any = {}
    if (validation.data.title !== undefined) updates.title = validation.data.title
    if (validation.data.content !== undefined) updates.content = validation.data.content
    if (validation.data.imageUrl !== undefined) updates.image_url = validation.data.imageUrl
    if (validation.data.aspectRatio !== undefined) updates.aspect_ratio = validation.data.aspectRatio
    if (validation.data.division !== undefined) updates.division = validation.data.division

    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)
    return successResponse(data, 'Post updated')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) return errorResponse(error.message, 'DELETE_ERROR', 500)
    return successResponse(null, 'Post deleted')
  } catch (error) {
    return serverErrorResponse(error)
  }
}
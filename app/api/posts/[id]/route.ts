import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-utils'
import { invalidateCache, deleteCache } from '@/lib/redis'

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

    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return notFoundResponse('Post')
    }

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
    const user = await requireAuth().catch(() => null)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()
    const validation = updatePostSchema.safeParse(body)
    
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const supabase = await createServerClient()
    
    // Check ownership
    const { data: existingPost } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!existingPost) {
      return notFoundResponse('Post')
    }

    if (existingPost.author_id !== user.id && user.role !== 'admin') {
      return forbiddenResponse('You can only edit your own posts')
    }

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

    if (error) {
      return errorResponse(error.message, 'UPDATE_ERROR', 500)
    }

    await invalidateCache('posts')
    await deleteCache(`post:${id}`)

    return successResponse(data, 'Post updated successfully')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const supabase = await createServerClient()
    
    // Check ownership
    const { data: existingPost } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!existingPost) {
      return notFoundResponse('Post')
    }

    if (existingPost.author_id !== user.id && user.role !== 'admin') {
      return forbiddenResponse('You can only delete your own posts')
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      return errorResponse(error.message, 'DELETE_ERROR', 500)
    }

    await invalidateCache('posts')
    await deleteCache(`post:${id}`)

    return successResponse(null, 'Post deleted successfully')
  } catch (error) {
    return serverErrorResponse(error)
  }
}
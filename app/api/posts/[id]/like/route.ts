import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, serverErrorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-utils'
import { invalidateCache } from '@/lib/redis'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const supabase = createServerClient()
    
    // Check if post exists
    const { data: post } = await supabase
      .from('posts')
      .select('id, likes_count')
      .eq('id', id)
      .single()

    if (!post) {
      return notFoundResponse('Post')
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        return errorResponse(deleteError.message, 'UNLIKE_ERROR', 500)
      }

      // Decrement likes count
      await supabase
        .from('posts')
        .update({ likes_count: Math.max(0, (post.likes_count || 1) - 1) })
        .eq('id', id)

      await invalidateCache('posts')
      
      return successResponse({ liked: false }, 'Post unliked')
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{ post_id: id, user_id: user.id }])

      if (insertError) {
        return errorResponse(insertError.message, 'LIKE_ERROR', 500)
      }

      // Increment likes count
      await supabase
        .from('posts')
        .update({ likes_count: (post.likes_count || 0) + 1 })
        .eq('id', id)

      await invalidateCache('posts')
      
      return successResponse({ liked: true }, 'Post liked')
    }
  } catch (error) {
    return serverErrorResponse(error)
  }
}
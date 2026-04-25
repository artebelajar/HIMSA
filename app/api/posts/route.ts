import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'

const createPostSchema = z.object({
  type: z.enum(['article', 'quote', 'poster']),
  title: z.string().optional(),
  content: z.string().optional(),
  image_url: z.string().optional().nullable(),
  aspect_ratio: z.enum(['9:16', '16:9', '1:1']).optional().nullable(),
  division: z.string(),
  author_id: z.string().uuid(),
  author_name: z.string(),
})

const updatePostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().optional(),
  image_url: z.string().optional(),
  aspect_ratio: z.enum(['9:16', '16:9', '1:1']).optional(),
  division: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const authorId = searchParams.get('authorId')
    const userId = searchParams.get('userId') // Untuk cek like status
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('type', type)
    }

    if (authorId) {
      query = query.eq('author_id', authorId)
    }

    const { data: posts, error } = await query

    if (error) return errorResponse(error.message, 'DB_ERROR', 500)

    // Get likes untuk setiap post jika userId ada
    if (userId && posts) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)

      const likedPostIds = new Set(likes?.map(l => l.post_id) || [])
      
      const postsWithLiked = posts.map(post => ({
        ...post,
        liked: likedPostIds.has(post.id)
      }))

      return successResponse(postsWithLiked)
    }

    return successResponse(posts || [])
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    // Handle like/unlike
    if (body.action === 'like') {
      const { post_id, user_id } = body
      
      // Check if already liked
      const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post_id)
        .eq('user_id', user_id)
        .single()

      if (existing) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post_id)
          .eq('user_id', user_id)

        // Decrement likes_count
        await supabase.rpc('decrement_likes', { post_id })

        return successResponse({ liked: false }, 'Unliked')
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert([{ post_id, user_id }])

        // Increment likes_count
        await supabase.rpc('increment_likes', { post_id })

        return successResponse({ liked: true }, 'Liked')
      }
    }

    // Create post
    const validation = createPostSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { type, title, content, image_url, aspect_ratio, division, author_id, author_name } = validation.data

    const { data, error } = await supabase
  .from('posts')
  .insert([{
    type,
    title: title || null,
    content: content || null,
    image_url: image_url || null,
    aspect_ratio: aspect_ratio || null, // Bisa null
    division,
    author_id,
    author_name,
  }])
  .select()
  .single()

    if (error) return errorResponse(error.message, 'CREATE_ERROR', 500)

    return successResponse(data, 'Post created', 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const validation = updatePostSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { id, ...updates } = validation.data

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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('Post ID required', 'MISSING_ID', 400)
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) return errorResponse(error.message, 'DELETE_ERROR', 500)

    return successResponse(null, 'Post deleted')
  } catch (error) {
    return serverErrorResponse(error)
  }
}
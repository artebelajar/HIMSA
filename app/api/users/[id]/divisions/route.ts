import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-utils'
import { invalidateCache } from '@/lib/redis'
import { DIVISIONS } from '@/lib/utils'

const updateDivisionsSchema = z.object({
  divisions: z.array(z.enum(DIVISIONS as unknown as [string, ...string[]])),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin().catch(() => null)
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()
    const validation = updateDivisionsSchema.safeParse(body)
    
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { divisions } = validation.data

    const supabase = createAdminClient()
    
    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single()

    if (!user) {
      return notFoundResponse('User')
    }

    // Update divisions
    const { data, error } = await supabase
      .from('users')
      .update({ 
        divisions,
        current_division: divisions.length > 0 ? divisions[0] : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return errorResponse(error.message, 'UPDATE_ERROR', 500)
    }

    // Invalidate cache
    await invalidateCache(`user:${id}`)

    return successResponse(data, 'Divisions updated successfully')
  } catch (error) {
    return serverErrorResponse(error)
  }
}
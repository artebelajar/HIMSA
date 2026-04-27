import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'

const updateProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  avatar_url: z.string().url().optional(),
})

const changePasswordSchema = z.object({
  userId: z.string().uuid(),
  currentPassword: z.string().min(6, 'Password minimal 6 karakter'),
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { action } = body

    if (action === 'update-profile') {
      // Tambahkan userId dari body
      const validation = updateProfileSchema.safeParse(body)
      if (!validation.success) {
        return validationErrorResponse(validation.error)
      }

      const { userId, name, avatar_url } = validation.data

      const updates: any = {}
      if (name) updates.name = name
      if (avatar_url) updates.avatar_url = avatar_url

      if (Object.keys(updates).length === 0) {
        return errorResponse('Tidak ada data yang diupdate', 'NO_DATA', 400)
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)

      return successResponse(data, 'Profil berhasil diupdate')
    }

    if (action === 'change-password') {
      const validation = changePasswordSchema.safeParse(body)
      if (!validation.success) {
        return validationErrorResponse(validation.error)
      }

      const { userId, currentPassword, newPassword } = validation.data

      // Get user email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (userError) return errorResponse(userError.message, 'USER_ERROR', 500)

      // Sign in to verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: currentPassword,
      })

      if (signInError) {
        return errorResponse('Password saat ini salah', 'INVALID_PASSWORD', 400)
      }

      // Update password menggunakan admin client
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      )

      if (updateError) return errorResponse(updateError.message, 'UPDATE_ERROR', 500)

      return successResponse(null, 'Password berhasil diubah')
    }

    return errorResponse('Invalid action', 'INVALID_ACTION', 400)
  } catch (error) {
    console.error('Server error:', error)
    return serverErrorResponse(error)
  }
}
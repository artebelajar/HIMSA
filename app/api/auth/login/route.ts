import { NextRequest } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { createToken } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = loginSchema.safeParse(body)
    
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { email, password } = validation.data
    
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return errorResponse(error.message, 'AUTH_ERROR', 401)
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      return errorResponse('User profile not found', 'PROFILE_NOT_FOUND', 404)
    }

    // Buat token dengan nama user
    const token = await createToken({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      divisions: profile.divisions || [],
      currentDivision: profile.current_division,
      name: profile.name,
    })

    // Set cookie - PASTIKAN path dan domain benar
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: false, // Set false untuk localhost
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    console.log('Login successful, token set for:', profile.email)

    return successResponse({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        divisions: profile.divisions,
        currentDivision: profile.current_division,
        avatar: profile.avatar_url,
      },
    }, 'Login successful')
  } catch (error) {
    console.error('Login error:', error)
    return serverErrorResponse(error)
  }
}
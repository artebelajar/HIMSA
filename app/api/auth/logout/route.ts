import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, serverErrorResponse } from '@/lib/api-utils'


export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('auth-token')

    return successResponse(null, 'Logout successful')
  } catch (error) {
    return serverErrorResponse(error)
  }
}
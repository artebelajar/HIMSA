import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log('[API Login] Request:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi!' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.log('[API Login] User not found:', email)
      return NextResponse.json(
        { error: 'Email atau password salah!' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log('[API Login] Invalid password for:', email)
      return NextResponse.json(
        { error: 'Email atau password salah!' },
        { status: 401 }
      )
    }

    const { data: divisions } = await supabase
      .from('user_divisions')
      .select('division')
      .eq('user_id', user.id)

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    )

    console.log('[API Login] Success:', user.id)

    return NextResponse.json(
      {
        message: 'Login berhasil!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          divisions: divisions?.map((d: any) => d.division) || [],
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API Login] Error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    console.log('[API Register] Request:', { name, email })

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Nama, email, dan password harus diisi!' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar!' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: 'user',
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('[API Register] Error:', error)
      throw error
    }

    console.log('[API Register] Success:', data[0]?.id)

    return NextResponse.json(
      {
        message: 'Pendaftaran berhasil!',
        user: {
          id: data[0].id,
          name: data[0].name,
          email: data[0].email,
          role: data[0].role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API Register] Error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

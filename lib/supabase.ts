import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client setup (for API routes)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

// Types for database
export interface User {
  id: string
  email: string
  name: string
  division: string
  role: 'admin' | 'user' | 'division'
  created_at: string
}

export interface Article {
  id: string
  title: string
  content: string
  image_url?: string
  author_id: string
  division: string
  likes: number
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  content: string
  division: string
  author_id: string
  likes: number
  created_at: string
}

export interface Poster {
  id: string
  title: string
  image_url: string
  aspect_ratio: string
  author_id: string
  likes: number
  created_at: string
}

export interface Message {
  id: string
  content: string
  user_id: string
  user_name: string
  created_at: string
}

export interface SecurityShift {
  id: string
  date: string
  group_number: number
  members: string[]
  created_at: string
  updated_at: string
}

export interface WelfareSchedule {
  id: string
  date: string
  time: string
  person_name: string
  person_id: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface HafalanWeekly {
  id: string
  content: string
  week_start: string
  language: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Kas {
  id: string
  user_id: string
  user_name: string
  amount: number
  paid: boolean
  payment_date?: string
  created_at: string
  updated_at: string
}

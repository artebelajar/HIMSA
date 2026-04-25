import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client - SINGLE INSTANCE
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'himsa-auth-token', // Custom storage key
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

// Admin client - bypass RLS (only for server)
export const createAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set!')
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Types
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string | null
  role: 'admin' | 'user' | 'division' | 'santri'
  divisions: string[]
  current_division?: string | null
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Post {
  id: string
  type: 'article' | 'quote' | 'poster'
  title?: string | null
  content?: string | null
  image_url?: string | null
  aspect_ratio?: string | null
  division?: string | null
  author_id: string
  author_name: string
  author_division?: string | null
  likes_count: number
  created_at: string
  updated_at: string
}

export interface SecurityShift {
  id: string
  schedule_date: string
  group_number: number
  members: string[]
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface WelfareShift {
  id: string
  schedule_date: string
  time_slot: string
  assigned_person: string
  assigned_person_id?: string | null
  completed: boolean
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface Agenda {
  id: string
  title: string
  agenda_date: string
  time_slot: string
  visibility: 'public' | 'division' | 'private'
  created_by: string
  created_by_role: string
  created_by_division?: string | null
  reminder_time?: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  sender_role: string
  attachment_url?: string | null
  attachment_type?: 'image' | 'document' | null
  created_at: string
}

export interface Hafalan {
  id: string
  content: string
  week_number: number
  year: number
  language: 'arabic' | 'english'
  created_by: string
  created_by_division?: string | null
  created_at: string
  updated_at: string
}

export interface KasPayment {
  id: string
  user_id: string
  user_name: string
  month: number
  year: number
  is_paid: boolean
  paid_date?: string | null
  paid_by?: string | null
  created_at: string
  updated_at: string
}

export interface Proposal {
  id: string
  name: string
  file_name: string
  description?: string | null
  file_url: string
  file_size?: string | null
  uploaded_by: string
  uploaded_at: string
  created_at: string
}
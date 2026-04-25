import { supabase } from './supabase'
import { getCache, setCache, deleteCache } from './redis'

const CACHE_KEY = 'divisions:list'
const CACHE_TTL = 600 // 10 menit

export interface Division {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Get list of division names only
 */
export async function getDivisionNames(): Promise<string[]> {
  // Cek cache dulu
  const cached = await getCache<string[]>(`${CACHE_KEY}:names`)
  if (cached) {
    console.log('✅ Divisions names from Redis cache')
    return cached
  }

  console.log('🔄 Fetching divisions names from database...')
  const { data, error } = await supabase
    .from('divisions')
    .select('name')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Failed to fetch divisions:', error)
    return []
  }

  const names = data?.map(d => d.name) || []
  
  // Simpan ke cache
  await setCache(`${CACHE_KEY}:names`, names, CACHE_TTL)

  return names
}

/**
 * Get full division data (for admin panel)
 */
export async function getDivisions(): Promise<Division[]> {
  // Cek cache dulu
  const cached = await getCache<Division[]>(`${CACHE_KEY}:full`)
  if (cached) {
    console.log('✅ Divisions full from Redis cache')
    return cached
  }

  console.log('🔄 Fetching divisions full from database...')
  const { data, error } = await supabase
    .from('divisions')
    .select('*')
    .order('name')

  if (error) {
    console.error('Failed to fetch divisions:', error)
    return []
  }

  // Simpan ke cache
  await setCache(`${CACHE_KEY}:full`, data || [], CACHE_TTL)

  return data || []
}

/**
 * Clear divisions cache (panggil setelah update/delete/add)
 */
export async function clearDivisionsCache(): Promise<void> {
  await deleteCache(`${CACHE_KEY}:names`)
  await deleteCache(`${CACHE_KEY}:full`)
  console.log('🗑️ Divisions cache cleared')
}
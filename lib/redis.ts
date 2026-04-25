import { Redis } from '@upstash/redis'

// Cek apakah credentials ada
const hasRedis = process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN

// Buat client hanya jika credentials ada
export const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    })
  : null

// Helper functions
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null
  
  try {
    const data = await redis.get<T>(key)
    return data ?? null
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

export async function setCache<T>(key: string, data: T, ttl: number = 300): Promise<void> {
  if (!redis) return
  
  try {
    await redis.setex(key, ttl, data)
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!redis) return
  
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis delete error:', error)
  }
}

export async function deletePattern(pattern: string): Promise<void> {
  if (!redis) return
  
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Redis delete pattern error:', error)
  }
}
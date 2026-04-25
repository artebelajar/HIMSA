import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
)

export interface JWTPayload {
  id: string
  email: string
  role: string
  divisions: string[]
  currentDivision?: string | null
  name?: string
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return null
    return await verifyToken(token)
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin(): Promise<JWTPayload> {
  const user = await requireAuth()
  if (user.role !== 'admin') throw new Error('Forbidden')
  return user
}

export function canEditSecurity(user: JWTPayload | null): boolean {
  if (!user) return false
  return user.role === 'admin' || user.divisions?.includes('Keamanan') || false
}

export function canEditWelfare(user: JWTPayload | null): boolean {
  if (!user) return false
  return user.role === 'admin' || user.divisions?.includes('Kesejahteraan') || false
}

export function canEditHafalan(user: JWTPayload | null): boolean {
  if (!user) return false
  return user.role === 'admin' || user.divisions?.includes('Dakwah') || false
}

export function canEditKas(user: JWTPayload | null): boolean {
  if (!user) return false
  return user.role === 'admin' || user.divisions?.includes('Wakil') || false
}

export function canUploadContent(user: JWTPayload | null): boolean {
  if (!user) return false
  return user.role !== 'user'
}
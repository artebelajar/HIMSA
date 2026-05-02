"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { PageTransition } from '@/components/page-transition'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { getDivisionNames } from '@/lib/divisions'

type UserRole = 'user' | 'admin' | 'division' | 'santri'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  divisions: string[]
  currentDivision?: string
  avatar?: string
  created_at?: string
}

interface AppContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<{ user: any } | undefined>
  logout: () => Promise<void>
  switchDivision: (division: string) => void
  switchToUserMode: () => void
  updateUser: (updates: Partial<User>) => Promise<void>
  backSoundEnabled: boolean
  setBackSoundEnabled: (enabled: boolean) => void
  cursorTrailEnabled: boolean
  setCursorTrailEnabled: (enabled: boolean) => void
  canEditSecurity: boolean
  canEditWelfare: boolean
  canEditHafalan: boolean
  canEditKas: boolean
  canUploadContent: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [backSoundEnabled, setBackSoundEnabled] = useState(false)
  const [cursorTrailEnabled, setCursorTrailEnabled] = useState(true)
  const loadingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Inisialisasi audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/backsound.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = 0.3
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  // Handle play/pause backSound
  useEffect(() => {
    if (!audioRef.current) return
    if (backSoundEnabled) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    } else {
      audioRef.current.pause()
    }
  }, [backSoundEnabled])

  // Visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && backSoundEnabled && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Resume play failed:', e))
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [backSoundEnabled])

  const toggleBackSound = () => setBackSoundEnabled(prev => !prev)
  const toggleCursorTrail = () => setCursorTrailEnabled(prev => !prev)

  useEffect(() => {
  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setIsLoading(false)
        // Redirect ke login jika tidak di halaman auth
        if (typeof window !== 'undefined' && 
            !window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/login'
        }
      }
    } catch (error) {
      console.error('Auth init error:', error)
      setIsLoading(false)
    }
  }

  initAuth()

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await loadUserProfile(session.user.id)
    } else if (event === 'SIGNED_OUT') {
      setUser(null)
      // Redirect ke login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
  })

  return () => subscription.unsubscribe()
}, [])

  const loadUserProfile = async (userId: string) => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        const allDivisions = await getDivisionNames()
        const divisions = data.role === 'admin' ? allDivisions : (data.divisions || [])
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          divisions: divisions,
          currentDivision: data.current_division || (divisions.length > 0 ? divisions[0] : undefined),
          avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
          created_at: data.created_at,
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      loadingRef.current = false
    }
  }

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        await loadUserProfile(data.user.id)
        toast.success('Login berhasil!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Login gagal')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name } },
      })
      if (error) {
        if (error.message.includes('already registered')) throw new Error('Email sudah terdaftar')
        throw error
      }
      if (data.user) {
        toast.success('Registrasi berhasil! Silahkan login.')
        return data
      }
    } catch (error: any) {
      toast.error(error.message || 'Registrasi gagal')
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      toast.success('Logout berhasil')
      window.location.href = '/auth/login'
    } catch (error: any) {
      toast.error('Gagal logout')
    } finally {
      setIsLoading(false)
    }
  }

  const switchDivision = (division: string) => {
    if (user) {
      const canSwitch = user.role === 'admin' || user.divisions.includes(division)
      if (canSwitch) {
        const updated = { ...user, currentDivision: division }
        setUser(updated)
        supabase.from('users').update({ current_division: division }).eq('id', user.id).then(({ error }) => {
          if (error) console.error('Error updating current division:', error)
        })
        toast.success(`Beralih ke Division ${division}`)
      }
    }
  }

  const switchToUserMode = () => {
    if (user) {
      const updated = { ...user, currentDivision: undefined }
      setUser(updated)
      supabase.from('users').update({ current_division: null }).eq('id', user.id).then(({ error }) => {
        if (error) console.error('Error clearing current division:', error)
      })
      toast.success('Beralih ke User Mode')
    }
  }

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (user) {
      const updated = { ...user, ...updates }
      setUser(updated)
      const dbUpdates: any = {}
      if (updates.name) dbUpdates.name = updates.name
      if (updates.avatar) dbUpdates.avatar_url = updates.avatar
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from('users').update(dbUpdates).eq('id', user.id)
        if (error) toast.error('Gagal memperbarui profil')
        else toast.success('Profil berhasil diperbarui')
      }
    }
  }

  const canEditSecurity = user?.role === 'admin' || user?.currentDivision === 'Keamanan' || false
  const canEditWelfare = user?.role === 'admin' || user?.currentDivision === 'Kesejahteraan' || false
  const canEditHafalan = user?.role === 'admin' || user?.currentDivision === 'Dakwah' || false
  const canEditKas = user?.role === 'admin' || user?.currentDivision === 'Wakil' || false
  const canUploadContent = user?.role === 'admin' || user?.role === 'division' || false

  const value: AppContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    switchDivision,
    switchToUserMode,
    updateUser,
    backSoundEnabled,
    setBackSoundEnabled: toggleBackSound,
    cursorTrailEnabled,
    setCursorTrailEnabled: toggleCursorTrail,
    canEditSecurity,
    canEditWelfare,
    canEditHafalan,
    canEditKas,
    canUploadContent,
  }

  return (
    <AppContext.Provider value={value}>
      <PageTransition />
      {children}
      <Toaster />
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
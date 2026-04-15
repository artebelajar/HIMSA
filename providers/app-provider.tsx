'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { PageTransition } from '@/components/page-transition'

type UserRole = 'user' | 'admin'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  divisions: string[] // Can have multiple divisions
  currentDivision?: string // Currently active division (for demo/testing)
  avatar?: string
}

interface AgendaItem {
  id: string
  title: string
  date: string
  time: string
  createdBy: string
  createdByRole: UserRole
  createdByDivision?: string
  isPrivate: boolean
  visibility: 'public' | 'division' | 'private' // public: admin/division agenda visible to all, private: only owner
}

interface AppContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  switchDivision: (division: string) => void
  switchToUserMode: () => void
  updateUser: (user: Partial<User>) => void
  backSoundEnabled: boolean
  setBackSoundEnabled: (enabled: boolean) => void
  canEditSchedules: boolean // True if user is admin or in Keamanan/Kesejahteraan divisions
  canEditHafalan: boolean // True if user is admin or in Dakwah division
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const DUMMY_USERS = [
  {
    id: '1',
    name: 'Admin HIMSA',
    email: 'admin@himsa.com',
    password: 'admin123',
    role: 'admin' as UserRole,
    divisions: [], // Admin tidak memiliki divisions, tapi bisa switch ke division mode
  },
  {
    id: '2',
    name: 'Mukti Dakwah & Bahasa',
    email: 'mukti@himsa.com',
    password: 'mukti123',
    role: 'user' as UserRole,
    divisions: ['Dakwah', 'Bahasa'], // Multiple divisions
  },
  {
    id: '3',
    name: 'Budi Keamanan',
    email: 'budi@himsa.com',
    password: 'budi123',
    role: 'user' as UserRole,
    divisions: ['Keamanan'],
  },
  {
    id: '4',
    name: 'Siti Kesejahteraan',
    email: 'siti@himsa.com',
    password: 'siti123',
    role: 'user' as UserRole,
    divisions: ['Kesejahteraan'],
  },
  {
    id: '5',
    name: 'Regular User',
    email: 'user@himsa.com',
    password: 'user123',
    role: 'user' as UserRole,
    divisions: [], // No divisions
  },
]

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [backSoundEnabled, setBackSoundEnabled] = useState(false)

  useEffect(() => {
    // Load from localStorage
    const savedUser = localStorage.getItem('himsa_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed to parse saved user:', e)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log('[AppProvider] Logging in:', email)
      
      // Hit API route untuk login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal')
      }

      console.log('[AppProvider] Login success:', data.user)

      // Simpan token dan user data
      localStorage.setItem('himsa_token', data.token)
      localStorage.setItem('himsa_user', JSON.stringify(data.user))

      // Update state dengan data dari database
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        divisions: data.user.divisions || [],
        currentDivision: data.user.divisions?.length > 0 ? data.user.divisions[0] : undefined,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.name}`,
      }
      
      setUser(userData)
    } catch (error) {
      console.error('[AppProvider] Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log('[AppProvider] Registering:', email)
      
      // Hit API route untuk register
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Register gagal')
      }

      console.log('[AppProvider] Register success:', data.user)

      // Simpan user data (belum ada token karena belum login)
      localStorage.setItem('himsa_user', JSON.stringify(data.user))

      // Update state dengan data dari database
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        divisions: [],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.name}`,
      }
      
      setUser(userData)
    } catch (error) {
      console.error('[AppProvider] Register error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('himsa_user')
  }

  const switchDivision = (division: string) => {
    if (user && user.divisions.includes(division)) {
      const updated = { ...user, currentDivision: division }
      setUser(updated)
      localStorage.setItem('himsa_user', JSON.stringify(updated))
    }
  }

  const switchToUserMode = () => {
    if (user) {
      const updated = { ...user, currentDivision: undefined }
      setUser(updated)
      localStorage.setItem('himsa_user', JSON.stringify(updated))
    }
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates }
      setUser(updated)
      localStorage.setItem('himsa_user', JSON.stringify(updated))
    }
  }

  const canEditSchedules = user?.role === 'admin' || ['Keamanan', 'Kesejahteraan'].includes(user?.currentDivision || '')
  const canEditHafalan = user?.role === 'admin' || user?.currentDivision === 'Dakwah'

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
    setBackSoundEnabled,
    canEditSchedules,
    canEditHafalan,
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
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import {
  LogOut, User, Shield, Edit2, Save, X, Check,
  ChevronLeft, ChevronRight, Search, Plus, Layers, Camera, Loader2, Lock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getDivisionNames, getDivisions, clearDivisionsCache, type Division } from '@/lib/divisions'
import { cn } from '@/lib/utils'

interface UserData {
  id: string
  email: string
  name: string
  role: string
  divisions: string[]
  current_division?: string
  avatar_url?: string
  created_at: string
}

export default function SettingsPage() {
  const { user, updateUser, logout, switchDivision, switchToUserMode } = useApp()
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
  })

  // Profile states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null)
  const [uploading, setUploading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // User management states
  const [users, setUsers] = useState<UserData[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editDivisions, setEditDivisions] = useState<string[]>([])
  const [editRole, setEditRole] = useState<string>('user')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Divisions states
  const [allDivisions, setAllDivisions] = useState<string[]>([])
  const [divisionsData, setDivisionsData] = useState<Division[]>([])
  const [showAddDivision, setShowAddDivision] = useState(false)
  const [newDivision, setNewDivision] = useState({ name: '', description: '', color: '#00d9ff' })
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false)

  const ITEMS_PER_PAGE = 10
  const isAdmin = user?.role === 'admin'
  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE)

  useEffect(() => {
    loadDivisions()
    if (user?.avatar) {
      setAvatarUrl(user.avatar)
    }
  }, [user])

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
      loadDivisionsData()
    }
  }, [isAdmin, currentPage, searchTerm])

  const loadDivisions = async () => {
    const divisions = await getDivisionNames()
    setAllDivisions(divisions)
  }

  const loadDivisionsData = async () => {
    setIsLoadingDivisions(true)
    try {
      const data = await getDivisions()
      setDivisionsData(data)
    } catch (error) {
      console.error('Failed to load divisions:', error)
    } finally {
      setIsLoadingDivisions(false)
    }
  }

  const loadUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/users?${params}`)
      const result = await response.json()

      if (result.success) {
        setUsers(result.data.users)
        setTotalUsers(result.data.total)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, GIF)')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Ukuran file maksimal 5 MB')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          userId: user?.id,
          avatar_url: publicUrl,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setAvatarUrl(publicUrl)
        updateUser({ avatar: publicUrl })
        toast.success('Foto profil berhasil diupload')
      } else {
        toast.error(result.error || 'Gagal update profil')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Gagal upload foto')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      toast.error('Nama harus diisi')
      return
    }

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          userId: user?.id,
          name: editForm.name,
        }),
      })

      const result = await response.json()
      if (result.success) {
        updateUser({ name: editForm.name })
        toast.success('Profil berhasil diperbarui')
      } else {
        toast.error(result.error || 'Gagal update profil')
      }
    } catch (error) {
      toast.error('Gagal update profil')
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field password harus diisi')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password baru tidak cocok')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          userId: user?.id,
          currentPassword,
          newPassword,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Password berhasil diubah')
        setShowPasswordModal(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(result.error || 'Gagal mengubah password')
      }
    } catch (error) {
      toast.error('Gagal mengubah password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleSwitchDivision = (division: string) => {
    switchDivision(division)
  }

  const handleSwitchToUser = () => {
    switchToUserMode()
  }

  const handleEditUser = (u: UserData) => {
    setEditingUserId(u.id)
    setEditDivisions(u.divisions || [])
    setEditRole(u.role)
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditDivisions([])
    setEditRole('user')
  }

  const handleSaveUser = async (userId: string) => {
    if (editDivisions.length === 0 && editRole === 'division') {
      toast.error('Division harus memiliki minimal satu divisi')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, divisions: editDivisions, role: editRole }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`User berhasil diupdate menjadi ${editRole}`)
        setEditingUserId(null)
        loadUsers()
      } else {
        toast.error(result.error || 'Gagal mengupdate user')
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate user')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleDivision = (division: string) => {
    if (editDivisions.includes(division)) {
      setEditDivisions(editDivisions.filter(d => d !== division))
    } else {
      setEditDivisions([...editDivisions, division])
    }
  }

  const handleSearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
  }

  const handleAddDivision = async () => {
    if (!newDivision.name.trim()) {
      toast.error('Nama divisi harus diisi')
      return
    }

    try {
      const response = await fetch('/api/admin/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDivision),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Divisi berhasil ditambahkan')
        setShowAddDivision(false)
        setNewDivision({ name: '', description: '', color: '#00d9ff' })
        clearDivisionsCache()
        await loadDivisions()
        await loadDivisionsData()
      } else {
        toast.error(result.error || 'Gagal menambah divisi')
      }
    } catch (error) {
      toast.error('Gagal menambah divisi')
    }
  }

  const handleUpdateDivision = async () => {
    if (!editingDivision) return

    try {
      const response = await fetch('/api/admin/divisions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDivision.id,
          name: editingDivision.name,
          description: editingDivision.description,
          color: editingDivision.color,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Divisi berhasil diupdate')
        setEditingDivision(null)
        clearDivisionsCache()
        await loadDivisions()
        await loadDivisionsData()
      } else {
        toast.error(result.error || 'Gagal mengupdate divisi')
      }
    } catch (error) {
      toast.error('Gagal mengupdate divisi')
    }
  }

  const handleToggleDivisionStatus = async (division: Division) => {
    try {
      const response = await fetch('/api/admin/divisions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: division.id,
          is_active: !division.is_active,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Divisi ${division.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
        clearDivisionsCache()
        await loadDivisions()
        await loadDivisionsData()
      }
    } catch (error) {
      toast.error('Gagal mengubah status divisi')
    }
  }

  // Tentukan jumlah tab berdasarkan role
  const tabCount = isAdmin ? 4 : 2

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="font-orbitron text-3xl font-bold text-primary mb-2">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola akun dan preferensi Anda</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn(
  "w-full bg-card/30 border border-white/20 p-1",
  "grid",
  isAdmin ? "grid-cols-4" : "grid-cols-3"
)}>
  <TabsTrigger value="profile" className="flex items-center justify-center gap-2">
    <User className="h-4 w-4" />
    <span className="hidden sm:inline">Profil</span>
  </TabsTrigger>
  <TabsTrigger value="role" className="flex items-center justify-center gap-2">
    <Shield className="h-4 w-4" />
    <span className="hidden sm:inline">Role</span>
  </TabsTrigger>
  {isAdmin && (
    <TabsTrigger value="divisions" className="flex items-center justify-center gap-2">
      <Layers className="h-4 w-4" />
      <span className="hidden sm:inline">Divisi</span>
    </TabsTrigger>
  )}
  <TabsTrigger value="logout" className="flex items-center justify-center gap-2">
    <LogOut className="h-4 w-4" />
    <span className="hidden sm:inline">Logout</span>
  </TabsTrigger>
</TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-card/50 border-white/20 p-6 space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-primary rounded-full hover:bg-primary/80 transition"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleUploadAvatar}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Klik ikon kamera untuk upload foto (max 5MB)
                </p>
              </div>

              <div className="border-t border-white/20 pt-6">
                <h3 className="font-semibold text-foreground mb-4">Informasi Akun</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Nama Lengkap</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ name: e.target.value })}
                      className="mt-2 bg-input/50 border-white/20"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-2 bg-input/50 border-white/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button onClick={handleSaveProfile} className="flex-1 bg-primary hover:bg-primary/90">
                    Simpan Perubahan
                  </Button>
                  <Button
                    onClick={() => setShowPasswordModal(true)}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Ubah Password
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Role Tab */}
          <TabsContent value="role" className="mt-6 space-y-6">
            <Card className="bg-card/50 border-white/20 p-6">
              <h3 className="font-semibold text-foreground mb-4">
                {user?.role === 'admin' ? 'Pilih Divisi (Admin Mode)' : 'Ganti Divisi Aktif'}
              </h3>

              {user?.role === 'admin' ? (
                <div className="space-y-3">
                  <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded p-3 mb-3">
                    Sebagai Admin, Anda dapat mengakses semua divisi.
                  </p>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                    {allDivisions.map(division => (
                      <Button
                        key={division}
                        variant={user.currentDivision === division ? 'default' : 'outline'}
                        className="w-full justify-start border-white/20"
                        onClick={() => handleSwitchDivision(division)}
                      >
                        <span className="flex-1 text-left">{division}</span>
                        {user.currentDivision === division && (
                          <span className="text-xs bg-primary/20 px-2 py-1 rounded">Aktif</span>
                        )}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant={!user.currentDivision ? 'default' : 'outline'}
                    className="w-full justify-start border-white/20 mt-4"
                    onClick={handleSwitchToUser}
                  >
                    <span className="flex-1 text-left">Mode User Biasa</span>
                    {!user.currentDivision && (
                      <span className="text-xs bg-primary/20 px-2 py-1 rounded">Aktif</span>
                    )}
                  </Button>
                </div>
              ) : user?.divisions && user.divisions.length > 0 ? (
                <div className="space-y-3">
                  {user.divisions.map(division => (
                    <Button
                      key={division}
                      variant={user.currentDivision === division ? 'default' : 'outline'}
                      className="w-full justify-start border-white/20"
                      onClick={() => handleSwitchDivision(division)}
                    >
                      <span className="flex-1 text-left">{division}</span>
                      {user.currentDivision === division && (
                        <span className="text-xs bg-primary/20 px-2 py-1 rounded">Aktif</span>
                      )}
                    </Button>
                  ))}
                  <Button
                    variant={!user.currentDivision ? 'default' : 'outline'}
                    className="w-full justify-start border-white/20 mt-4"
                    onClick={handleSwitchToUser}
                  >
                    <span className="flex-1 text-left">Mode User Biasa</span>
                    {!user.currentDivision && (
                      <span className="text-xs bg-primary/20 px-2 py-1 rounded">Aktif</span>
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                  Anda tidak memiliki divisi yang ditugaskan.
                </p>
              )}
            </Card>

            {/* Admin User Management Panel */}
            {isAdmin && (
              <Card className="bg-card/50 border-red-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-red-400" />
                  <h3 className="font-semibold text-foreground">Panel Admin - Manajemen Users</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Input
                    placeholder="Cari user..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-input/50 border-white/20 flex-1"
                  />
                  <Button onClick={handleSearch} variant="outline" className="sm:w-auto">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Memuat data users...</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 mb-4">
                      {users.map((u) => (
                        <Card key={u.id} className="bg-muted/30 border-white/10 p-4">
                          {editingUserId === u.id ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">{u.name}</p>
                                  <p className="text-sm text-muted-foreground">{u.email}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveUser(u.id)} disabled={isSaving}>
                                    <Save className="h-4 w-4 mr-1" />
                                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs">Role</Label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User Biasa</SelectItem>
                                    <SelectItem value="santri">Santri</SelectItem>
                                    <SelectItem value="division">Division</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label className="text-xs">Divisions</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {allDivisions.map((div) => (
                                    <Badge
                                      key={div}
                                      variant={editDivisions.includes(div) ? 'default' : 'outline'}
                                      className="cursor-pointer text-xs"
                                      onClick={() => toggleDivision(div)}
                                    >
                                      {editDivisions.includes(div) && <Check className="h-3 w-3 mr-1" />}
                                      {div}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-semibold text-sm">{u.name}</p>
                                  <Badge
                                    variant={
                                      u.role === 'admin' ? 'destructive' :
                                        u.role === 'division' ? 'default' :
                                          u.role === 'santri' ? 'outline' :
                                            'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {u.role === 'division' ? 'Division' :
                                      u.role === 'admin' ? 'Admin' :
                                        u.role === 'santri' ? 'Santri' : 'User'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{u.email}</p>
                                <div className="flex flex-wrap gap-1">
                                  {u.divisions?.length > 0 ? (
                                    u.divisions.map((div) => (
                                      <Badge key={div} variant="outline" className="text-xs">{div}</Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Belum ada division</span>
                                  )}
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => handleEditUser(u)} className="self-end sm:self-center">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/20">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground px-4">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Total {totalUsers} user
                    </p>
                  </>
                )}
              </Card>
            )}
          </TabsContent>

          {/* Divisions Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="divisions" className="mt-6">
              <Card className="bg-card/50 border-green-500/30 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-green-400" />
                    <h3 className="font-semibold text-foreground">Manajemen Divisi</h3>
                  </div>
                  <Button size="sm" onClick={() => setShowAddDivision(true)} className="sm:w-auto">
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Divisi
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Tambah, edit, atau nonaktifkan divisi.
                </p>

                {isLoadingDivisions ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Memuat data divisi...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {divisionsData.map((division) => (
                      <Card key={division.id} className="bg-muted/30 border-white/10 p-4">
                        {editingDivision?.id === division.id ? (
                          <div className="space-y-3">
                            <Input
                              value={editingDivision.name}
                              onChange={(e) => setEditingDivision({ ...editingDivision, name: e.target.value })}
                              placeholder="Nama divisi"
                              className="bg-input/50 border-white/20"
                            />
                            <Input
                              value={editingDivision.description || ''}
                              onChange={(e) => setEditingDivision({ ...editingDivision, description: e.target.value })}
                              placeholder="Deskripsi (opsional)"
                              className="bg-input/50 border-white/20"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={editingDivision.color}
                                onChange={(e) => setEditingDivision({ ...editingDivision, color: e.target.value })}
                                className="w-12 h-8 rounded cursor-pointer"
                              />
                              <span className="text-xs text-muted-foreground">Warna divisi</span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateDivision}>
                                <Save className="h-4 w-4 mr-1" /> Simpan
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingDivision(null)}>
                                <X className="h-4 w-4" /> Batal
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: division.color }}
                              />
                              <div>
                                <p className="font-semibold">{division.name}</p>
                                {division.description && (
                                  <p className="text-xs text-muted-foreground">{division.description}</p>
                                )}
                              </div>
                              {!division.is_active && (
                                <Badge variant="secondary" className="text-xs">Nonaktif</Badge>
                              )}
                            </div>
                            <div className="flex gap-2 self-end sm:self-center">
                              <Button size="sm" variant="ghost" onClick={() => setEditingDivision(division)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleDivisionStatus(division)}
                                className={division.is_active ? 'text-yellow-400' : 'text-green-400'}
                              >
                                {division.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          )}

          {/* Logout Tab */}
          <TabsContent value="logout" className="mt-6">
            <Card className="bg-card/50 border-white/20 p-6">
              <div className="text-center space-y-4">
                <LogOut className="h-16 w-16 text-destructive mx-auto" />
                <h3 className="text-xl font-semibold text-foreground">Keluar dari Akun</h3>
                <p className="text-muted-foreground">
                  Anda akan keluar dari aplikasi dan perlu login kembali untuk mengakses.
                </p>
                <Button onClick={handleLogout} className="w-full sm:w-auto px-8 bg-destructive hover:bg-destructive/90 gap-2">
                  <LogOut className="h-4 w-4" /> Logout Sekarang
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Division Modal */}
        {showAddDivision && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="bg-card border-white/20 max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-primary">Tambah Divisi Baru</h3>

              <div className="space-y-3">
                <Input
                  placeholder="Nama divisi"
                  value={newDivision.name}
                  onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
                  className="bg-input/50 border-white/20"
                />
                <Input
                  placeholder="Deskripsi (opsional)"
                  value={newDivision.description}
                  onChange={(e) => setNewDivision({ ...newDivision, description: e.target.value })}
                  className="bg-input/50 border-white/20"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newDivision.color}
                    onChange={(e) => setNewDivision({ ...newDivision, color: e.target.value })}
                    className="w-12 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">Warna divisi</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddDivision(false)}>
                  Batal
                </Button>
                <Button className="flex-1 bg-primary" onClick={handleAddDivision}>
                  Tambah
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Change Password Modal */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="bg-card border-white/20">
            <DialogHeader>
              <DialogTitle className="text-primary">Ubah Password</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Masukkan password saat ini dan password baru Anda.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Password Saat Ini</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-2 bg-input/50 border-white/20"
                />
              </div>
              <div>
                <Label>Password Baru</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 bg-input/50 border-white/20"
                />
              </div>
              <div>
                <Label>Konfirmasi Password Baru</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 bg-input/50 border-white/20"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPasswordModal(false)}>
                Batal
              </Button>
              <Button
                className="flex-1 bg-primary"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { User, Shield, Layers, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDivisionNames, getDivisions, clearDivisionsCache, type Division } from '@/lib/divisions'
import { ProfileSection } from '@/components/setting/profile-section'
import { RoleSection } from '@/components/setting/role-section'
import { DivisionsSection } from '@/components/setting/divisions-section'
import { LogoutSection } from '@/components/setting/logout-section'

interface UserData {
  id: string; email: string; name: string; role: string; divisions: string[]; current_division?: string; avatar_url?: string; created_at: string
}

export default function SettingsPage() {
  const { user, updateUser, logout, switchDivision, switchToUserMode } = useApp()
  
  // Profile
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null)
  const [editForm, setEditForm] = useState({ name: user?.name || '' })
  const [uploading, setUploading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Role/Admin
  const [users, setUsers] = useState<UserData[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editDivisions, setEditDivisions] = useState<string[]>([])
  const [editRole, setEditRole] = useState<string>('user')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [allDivisions, setAllDivisions] = useState<string[]>([])

  // Divisions
  const [divisionsData, setDivisionsData] = useState<Division[]>([])
  const [showAddDivision, setShowAddDivision] = useState(false)
  const [newDivision, setNewDivision] = useState({ name: '', description: '', color: '#00d9ff' })
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false)

  const ITEMS_PER_PAGE = 10
  const isAdmin = user?.role === 'admin'
  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE)
  const tabCount = isAdmin ? 4 : 2

  useEffect(() => { loadDivisions(); if (user?.avatar) setAvatarUrl(user.avatar) }, [user])
  useEffect(() => { if (isAdmin) { loadUsers(); loadDivisionsData() } }, [isAdmin, currentPage, searchTerm])

  const loadDivisions = async () => { const d = await getDivisionNames(); setAllDivisions(d) }
  const loadDivisionsData = async () => { setIsLoadingDivisions(true); try { setDivisionsData(await getDivisions()) } catch (e) {} finally { setIsLoadingDivisions(false) } }
  const loadUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const params = new URLSearchParams({ page: currentPage.toString(), limit: ITEMS_PER_PAGE.toString() })
      if (searchTerm) params.append('search', searchTerm)
      const r = await fetch(`/api/admin/users?${params}`); const d = await r.json()
      if (d.success) { setUsers(d.data.users); setTotalUsers(d.data.total) }
    } catch (e) {} finally { setIsLoadingUsers(false) }
  }

  const handleEditDivision = (division: Division) => {
  setEditingDivision(division)
}

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) { toast.error('Nama harus diisi'); return }
    try {
      const r = await fetch('/api/auth/update-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-profile', userId: user?.id, name: editForm.name }) })
      const d = await r.json()
      if (d.success) { updateUser({ name: editForm.name }); toast.success('Profil diperbarui') } else toast.error(d.error)
    } catch (e) { toast.error('Gagal') }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('Semua field harus diisi'); return }
    if (newPassword !== confirmPassword) { toast.error('Password tidak cocok'); return }
    if (newPassword.length < 6) { toast.error('Minimal 6 karakter'); return }
    setIsChangingPassword(true)
    try {
      const r = await fetch('/api/auth/update-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'change-password', userId: user?.id, currentPassword, newPassword }) })
      const d = await r.json()
      if (d.success) { toast.success('Password diubah'); setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') } else toast.error(d.error)
    } catch (e) { toast.error('Gagal') } finally { setIsChangingPassword(false) }
  }

  const handleSaveUser = async (userId: string) => {
    setIsSaving(true)
    try {
      const r = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, divisions: editDivisions, role: editRole }) })
      const d = await r.json()
      if (d.success) { toast.success('User diupdate'); setEditingUserId(null); loadUsers() } else toast.error(d.error)
    } catch (e: any) { toast.error(e.message) } finally { setIsSaving(false) }
  }

  const handleAddDivision = async () => {
    if (!newDivision.name.trim()) { toast.error('Nama harus diisi'); return }
    try {
      const r = await fetch('/api/admin/divisions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDivision) })
      const d = await r.json()
      if (d.success) { toast.success('Divisi ditambahkan'); setShowAddDivision(false); setNewDivision({ name: '', description: '', color: '#00d9ff' }); clearDivisionsCache(); await loadDivisions(); await loadDivisionsData() } else toast.error(d.error)
    } catch (e) { toast.error('Gagal') }
  }

  const handleUpdateDivision = async () => {
    if (!editingDivision) return
    try {
      const r = await fetch('/api/admin/divisions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingDivision.id, name: editingDivision.name, description: editingDivision.description, color: editingDivision.color }) })
      const d = await r.json()
      if (d.success) { toast.success('Divisi diupdate'); setEditingDivision(null); clearDivisionsCache(); await loadDivisions(); await loadDivisionsData() } else toast.error(d.error)
    } catch (e) { toast.error('Gagal') }
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div><h1 className="font-orbitron text-3xl font-bold text-primary mb-2">Pengaturan</h1><p className="text-muted-foreground">Kelola akun dan preferensi Anda</p></div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn("w-full bg-card/30 border border-white/20 p-1 grid", tabCount === 4 ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="profile" className="flex items-center justify-center gap-2"><User className="h-4 w-4" /><span className="hidden sm:inline">Profil</span></TabsTrigger>
            <TabsTrigger value="role" className="flex items-center justify-center gap-2"><Shield className="h-4 w-4" /><span className="hidden sm:inline">Role</span></TabsTrigger>
            {isAdmin && <TabsTrigger value="divisions" className="flex items-center justify-center gap-2"><Layers className="h-4 w-4" /><span className="hidden sm:inline">Divisi</span></TabsTrigger>}
            <TabsTrigger value="logout" className="flex items-center justify-center gap-2"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span></TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileSection user={user} avatarUrl={avatarUrl} editForm={editForm} uploading={uploading}
              onAvatarChange={(url) => { setAvatarUrl(url); updateUser({ avatar: url }) }}
              onNameChange={(name) => setEditForm({ name })} onSave={handleSaveProfile}
              onChangePassword={() => setShowPasswordModal(true)} setUploading={setUploading} />
          </TabsContent>

          <TabsContent value="role" className="mt-6">
            <RoleSection user={user} isAdmin={isAdmin} allDivisions={allDivisions} users={users} totalUsers={totalUsers}
              currentPage={currentPage} totalPages={totalPages} editingUserId={editingUserId} editDivisions={editDivisions}
              editRole={editRole} searchInput={searchInput} isLoadingUsers={isLoadingUsers} isSaving={isSaving}
              onSwitchDivision={switchDivision} onSwitchToUser={switchToUserMode}
              onEditUser={(u) => { setEditingUserId(u.id); setEditDivisions(u.divisions || []); setEditRole(u.role) }}
              onCancelEdit={() => { setEditingUserId(null); setEditDivisions([]); setEditRole('user') }}
              onSaveUser={handleSaveUser} onToggleDivision={(d) => setEditDivisions(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
              onRoleChange={setEditRole} onSearch={() => { setSearchTerm(searchInput); setCurrentPage(1) }}
              onSearchInputChange={setSearchInput} onPageChange={setCurrentPage} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="divisions" className="mt-6">
              <DivisionsSection divisionsData={divisionsData} isLoadingDivisions={isLoadingDivisions}
                showAddDivision={showAddDivision} newDivision={newDivision} editingDivision={editingDivision}
                onShowAddDivision={setShowAddDivision} onNewDivisionChange={setNewDivision}
                onAddDivision={handleAddDivision} onEditDivision={handleEditDivision}
                onUpdateDivision={handleUpdateDivision} onCancelEdit={() => setEditingDivision(null)}
                onToggleStatus={async (div) => {
                  try {
                    const r = await fetch('/api/admin/divisions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: div.id, is_active: !div.is_active }) })
                    const d = await r.json()
                    if (d.success) { toast.success(`Divisi ${div.is_active ? 'dinonaktifkan' : 'diaktifkan'}`); clearDivisionsCache(); await loadDivisions(); await loadDivisionsData() }
                  } catch (e) { toast.error('Gagal') }
                }} />
            </TabsContent>
          )}

          <TabsContent value="logout" className="mt-6">
            <LogoutSection onLogout={async () => await logout()} />
          </TabsContent>
        </Tabs>

        {/* Password Modal */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="bg-card border-white/20">
            <DialogHeader><DialogTitle className="text-primary">Ubah Password</DialogTitle><DialogDescription className="text-muted-foreground">Masukkan password saat ini dan password baru.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Password Saat Ini</Label><Input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-2 bg-input/50 border-white/20" /></div>
              <div><Label>Password Baru</Label><Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 bg-input/50 border-white/20" /></div>
              <div><Label>Konfirmasi Password</Label><Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 bg-input/50 border-white/20" /></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPasswordModal(false)}>Batal</Button>
              <Button className="flex-1 bg-primary" onClick={handleChangePassword} disabled={isChangingPassword}>{isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
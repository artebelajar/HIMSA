"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Search, Edit2, Save, X, Check, ChevronLeft, ChevronRight } from 'lucide-react'

interface UserData {
  id: string; email: string; name: string; role: string; divisions: string[]; current_division?: string; avatar_url?: string; created_at: string
}

interface RoleSectionProps {
  user: any
  isAdmin: boolean
  allDivisions: string[]
  users: UserData[]
  totalUsers: number
  currentPage: number
  totalPages: number
  editingUserId: string | null
  editDivisions: string[]
  editRole: string
  searchInput: string
  isLoadingUsers: boolean
  isSaving: boolean
  onSwitchDivision: (division: string) => void
  onSwitchToUser: () => void
  onEditUser: (u: UserData) => void
  onCancelEdit: () => void
  onSaveUser: (userId: string) => void
  onToggleDivision: (division: string) => void
  onRoleChange: (role: string) => void
  onSearch: () => void
  onSearchInputChange: (val: string) => void
  onPageChange: (page: number) => void
}

export function RoleSection({
  user,
  isAdmin,
  allDivisions,
  users,
  totalUsers,
  currentPage,
  totalPages,
  editingUserId,
  editDivisions,
  editRole,
  searchInput,
  isLoadingUsers,
  isSaving,
  onSwitchDivision,
  onSwitchToUser,
  onEditUser,
  onCancelEdit,
  onSaveUser,
  onToggleDivision,
  onRoleChange,
  onSearch,
  onSearchInputChange,
  onPageChange,
}: RoleSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-white/20 p-6">
        <h3 className="font-semibold text-foreground mb-4">
          {user?.role === 'admin' ? 'Pilih Divisi (Admin Mode)' : 'Ganti Divisi Aktif'}
        </h3>

        {user?.role === 'admin' ? (
          <div className="space-y-3">
            <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded p-3">Sebagai Admin, Anda dapat mengakses semua divisi.</p>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {allDivisions.map(division => (
                <Button key={division} variant={user.currentDivision === division ? 'default' : 'outline'} className="w-full justify-start border-white/20" onClick={() => onSwitchDivision(division)}>
                  <span className="flex-1 text-left">{division}</span>
                  {user.currentDivision === division && <span className="text-xs bg-primary/20 px-2 py-1 rounded">Aktif</span>}
                </Button>
              ))}
            </div>
            <Button variant={!user.currentDivision ? 'default' : 'outline'} className="w-full justify-start border-white/20 mt-4" onClick={onSwitchToUser}>
              <span className="flex-1 text-left">Mode User Biasa</span>
              {!user.currentDivision && <span className="text-xs bg-primary/20 px-2 py-1 rounded">Aktif</span>}
            </Button>
          </div>
        ) : user?.divisions && user.divisions.length > 0 ? (
          <div className="space-y-3">
            {user.divisions.map(division => (
              <Button key={division} variant={user.currentDivision === division ? 'default' : 'outline'} className="w-full justify-start border-white/20" onClick={() => onSwitchDivision(division)}>
                <span className="flex-1 text-left">{division}</span>
                {user.currentDivision === division && <span className="text-xs bg-primary/20 px-2 py-1 rounded">Aktif</span>}
              </Button>
            ))}
            <Button variant={!user.currentDivision ? 'default' : 'outline'} className="w-full justify-start border-white/20 mt-4" onClick={onSwitchToUser}>
              <span className="flex-1 text-left">Mode User Biasa</span>
              {!user.currentDivision && <span className="text-xs bg-primary/20 px-2 py-1 rounded">Aktif</span>}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">Anda tidak memiliki divisi yang ditugaskan.</p>
        )}
      </Card>

      {isAdmin && (
        <Card className="bg-card/50 border-red-500/30 p-6">
          <div className="flex items-center gap-2 mb-4"><Shield className="h-5 w-5 text-red-400" /><h3 className="font-semibold text-foreground">Panel Admin - Manajemen Users</h3></div>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input placeholder="Cari user..." value={searchInput} onChange={(e) => onSearchInputChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} className="bg-input/50 border-white/20 flex-1" />
            <Button onClick={onSearch} variant="outline" className="sm:w-auto"><Search className="h-4 w-4" /></Button>
          </div>

          {isLoadingUsers ? (
            <div className="text-center py-8"><p className="text-muted-foreground">Memuat data users...</p></div>
          ) : (
            <>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 mb-4">
                {users.map((u) => (
                  <Card key={u.id} className="bg-muted/30 border-white/10 p-4">
                    {editingUserId === u.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div><p className="font-semibold">{u.name}</p><p className="text-sm text-muted-foreground">{u.email}</p></div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => onSaveUser(u.id)} disabled={isSaving}><Save className="h-4 w-4 mr-1" />{isSaving ? '...' : 'Simpan'}</Button>
                            <Button size="sm" variant="ghost" onClick={onCancelEdit}><X className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Role</Label>
                          <Select value={editRole} onValueChange={onRoleChange}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                              <Badge key={div} variant={editDivisions.includes(div) ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => onToggleDivision(div)}>
                                {editDivisions.includes(div) && <Check className="h-3 w-3 mr-1" />}{div}
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
                            <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'division' ? 'default' : u.role === 'santri' ? 'outline' : 'secondary'} className="text-xs">
                              {u.role === 'division' ? 'Division' : u.role === 'admin' ? 'Admin' : u.role === 'santri' ? 'Santri' : 'User'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{u.email}</p>
                          <div className="flex flex-wrap gap-1">
                            {u.divisions?.length > 0 ? u.divisions.map((div) => <Badge key={div} variant="outline" className="text-xs">{div}</Badge>) : <span className="text-xs text-muted-foreground">Belum ada division</span>}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => onEditUser(u)} className="self-end sm:self-center"><Edit2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/20">
                  <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm text-muted-foreground px-4">{currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center mt-2">Total {totalUsers} user</p>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
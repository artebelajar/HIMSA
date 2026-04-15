'use client'

import React, { useState } from 'react'
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
import { useApp } from '@/providers/app-provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, User, Shield } from 'lucide-react'

const DIVISIONS = [
  'Kebersihan',
  'Kesehatan',
  'Keamanan',
  'Kesejahteraan',
  'Olahraga',
  'Dakwah',
  'Bahasa',
  'Wakil',
  'Ketua',
]

export default function SettingsPage() {
  const { user, updateUser, logout, switchDivision, switchToUserMode } = useApp()
  const router = useRouter()
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  const handleSaveProfile = () => {
    if (!editForm.name || !editForm.email) {
      toast.error('Nama dan email harus diisi')
      return
    }
    updateUser({
      name: editForm.name,
      email: editForm.email,
    })
    toast.success('Profil berhasil diperbarui!')
  }

  const handleLogout = () => {
    logout()
    toast.success('Logout berhasil')
    router.push('/auth/login')
  }

  const handleSwitchDivision = (division: string) => {
    switchDivision(division)
    toast.success(`Beralih ke Division ${division}`)
  }

  const handleSwitchToUser = () => {
    switchToUserMode()
    toast.success('Beralih ke User Mode')
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-orbitron text-3xl font-bold text-primary mb-2">
            Pengaturan
          </h1>
          <p className="text-muted-foreground">Kelola akun dan preferensi Anda</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-white/20">
            <TabsTrigger value="profile" className="flex gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="role" className="flex gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Role</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Lainnya</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-card/50 border-white/20 p-6 space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 rounded-full border-2 border-primary"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-foreground">Foto Profil</h3>
                  <p className="text-sm text-muted-foreground">
                    Gambar profil diambil dari avatar generator
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 border-white/20">
                    Buat Avatar Baru
                  </Button>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6">
                <h3 className="font-semibold text-foreground mb-4">Informasi Akun</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Nama Lengkap</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="mt-2 bg-input/50 border-white/20"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Email</Label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="mt-2 bg-input/50 border-white/20"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Role</Label>
                    <Input
                      type="text"
                      value={user?.role === 'admin' ? 'Admin' : 'User Biasa'}
                      disabled
                      className="mt-2 bg-input/50 border-white/20"
                    />
                  </div>

                  {user?.divisions && user.divisions.length > 0 && (
                    <div>
                      <Label className="text-foreground">Divisi Saya</Label>
                      <Input
                        type="text"
                        value={user.divisions.join(', ')}
                        disabled
                        className="mt-2 bg-input/50 border-white/20"
                      />
                    </div>
                  )}

                  {user?.currentDivision && (
                    <div>
                      <Label className="text-foreground">Divisi Aktif</Label>
                      <Input
                        type="text"
                        value={user.currentDivision}
                        disabled
                        className="mt-2 bg-input/50 border-white/20"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSaveProfile}
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Role Tab */}
          <TabsContent value="role" className="mt-6">
            <Card className="bg-card/50 border-white/20 p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-4">
                  {user?.divisions && user.divisions.length > 0 ? 'Ganti Divisi Aktif' : 'Divisi Anda'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {user?.divisions && user.divisions.length > 0
                    ? 'Pilih divisi mana yang ingin Anda gunakan saat ini'
                    : 'Anda tidak memiliki divisi yang ditugaskan'}
                </p>

                {user?.divisions && user.divisions.length > 0 ? (
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
                    Menunggu admin untuk menugaskan divisi kepada Anda
                  </p>
                )}
              </div>

              {user?.role !== 'user' && (
                <div className="border-t border-white/20 pt-6">
                  <h3 className="font-semibold text-foreground mb-4">Panel Admin</h3>
                  {user?.role === 'admin' && (
                    <Card className="bg-muted/50 border border-white/20 p-4">
                      <h4 className="font-semibold text-foreground mb-3">
                        Manajemen User & Division
                      </h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Kelola divisions yang diberikan kepada setiap user
                      </p>
                      <div className="space-y-2 text-sm">
                        {/* Demo Users - you can expand this with real admin functionality */}
                        <div className="p-3 bg-card/50 rounded border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground">
                                Mukti Dakwah & Bahasa
                              </p>
                              <p className="text-xs text-muted-foreground">
                                mukti@himsa.com
                              </p>
                            </div>
                            <span className="text-xs text-cyan-300 font-semibold">
                              Dakwah, Bahasa
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Admin dapat mengubah divisions di panel admin (simulasi)
                          </p>
                        </div>
                        
                        <div className="p-3 bg-card/50 rounded border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground">
                                Budi Keamanan
                              </p>
                              <p className="text-xs text-muted-foreground">
                                budi@himsa.com
                              </p>
                            </div>
                            <span className="text-xs text-primary font-semibold">
                              Keamanan
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            User dapat ditugaskan ke satu atau lebih divisions
                          </p>
                        </div>

                        <div className="p-3 bg-card/50 rounded border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground">
                                Siti Kesejahteraan
                              </p>
                              <p className="text-xs text-muted-foreground">
                                siti@himsa.com
                              </p>
                            </div>
                            <span className="text-xs text-orange-300 font-semibold">
                              Kesejahteraan
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Admin dapat menambah/mengurangi divisions
                          </p>
                        </div>

                        <div className="p-3 bg-card/50 rounded border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground">
                                Regular User
                              </p>
                              <p className="text-xs text-muted-foreground">
                                user@himsa.com
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground font-semibold">
                              Belum Ada Division
                            </span>
                          </div>
                          <p className="text-xs text-yellow-400">
                            User ini menunggu untuk ditugaskan ke divisions
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger" className="mt-6">
            <Card className="bg-card/50 border-white/20 p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Informasi Akun</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID User:</span>
                    <span className="text-foreground font-mono">{user?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bergabung:</span>
                    <span className="text-foreground">
                      {new Date().toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6">
                <h3 className="font-semibold text-foreground mb-4">Logout</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Keluar dari akun Anda. Anda akan diarahkan ke halaman login.
                </p>
                <Button
                  onClick={handleLogout}
                  className="w-full bg-destructive hover:bg-destructive/90 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout Sekarang
                </Button>
              </div>

              <div className="border-t border-white/20 pt-6">
                <h3 className="font-semibold text-foreground mb-4">Hapus Data Demo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Hapus semua data demo lokal (artikel, quotes, poster, chat).
                </p>
                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    localStorage.removeItem('himsa_articles')
                    localStorage.removeItem('himsa_quotes')
                    localStorage.removeItem('himsa_posters')
                    localStorage.removeItem('himsa_chat_messages')
                    toast.success('Data demo berhasil dihapus!')
                  }}
                >
                  Hapus Semua Data Demo
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

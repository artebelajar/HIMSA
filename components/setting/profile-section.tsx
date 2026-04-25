"use client"

import React, { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { User, Camera, Loader2, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProfileSectionProps {
  user: any
  avatarUrl: string | null
  editForm: { name: string }
  uploading: boolean
  onAvatarChange: (url: string) => void
  onNameChange: (name: string) => void
  onSave: () => void
  onChangePassword: () => void
  setUploading: (val: boolean) => void
}

export function ProfileSection({
  user,
  avatarUrl,
  editForm,
  uploading,
  onAvatarChange,
  onNameChange,
  onSave,
  onChangePassword,
  setUploading,
}: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('File harus gambar'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Maksimal 5 MB'); return }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = urlData.publicUrl

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-profile', userId: user?.id, avatar_url: publicUrl }),
      })
      const result = await response.json()
      if (result.success) { onAvatarChange(publicUrl); toast.success('Foto diupload') }
      else toast.error('Gagal update')
    } catch (error: any) { toast.error(error.message) }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  return (
    <Card className="bg-card/50 border-white/20 p-6 space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
              <User className="h-12 w-12 text-primary" />
            </div>
          )}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute bottom-0 right-0 p-2 bg-primary rounded-full hover:bg-primary/80 transition">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Camera className="h-4 w-4 text-white" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleUploadAvatar} className="hidden" />
        </div>
        <p className="text-xs text-muted-foreground">Klik ikon kamera (max 5MB)</p>
      </div>

      <div className="border-t border-white/20 pt-6">
        <h3 className="font-semibold text-foreground mb-4">Informasi Akun</h3>
        <div className="space-y-4">
          <div>
            <Label>Nama Lengkap</Label>
            <Input value={editForm.name} onChange={(e) => onNameChange(e.target.value)} className="mt-2 bg-input/50 border-white/20" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={user?.email || ''} disabled className="mt-2 bg-input/50 border-white/20" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button onClick={onSave} className="flex-1 bg-primary hover:bg-primary/90">Simpan Perubahan</Button>
          <Button onClick={onChangePassword} variant="outline" className="flex-1 gap-2"><Lock className="h-4 w-4" /> Ubah Password</Button>
        </div>
      </div>
    </Card>
  )
}
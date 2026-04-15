'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AgendaModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (agenda: { title: string; time: string; reminder: boolean; reminderTime: string; isPrivate: boolean }) => void
  defaultDate: string
  userRole: 'admin' | 'user'
  userDivision?: string
}

export function AgendaModal({ isOpen, onClose, onSave, defaultDate, userRole, userDivision }: AgendaModalProps) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState('08:00')
  const [isPrivate, setIsPrivate] = useState(userRole === 'user')
  const [hours, setHours] = useState('09')
  const [minutes, setMinutes] = useState('00')

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Judul agenda tidak boleh kosong')
      return
    }

    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`

    onSave({
      title: title.trim(),
      time: formattedTime,
      reminder: reminderEnabled,
      reminderTime: reminderTime,
      isPrivate: isPrivate,
    })

    // Reset form
    setTitle('')
    setHours('09')
    setMinutes('00')
    setReminderTime('08:00')
    setIsPrivate(userRole === 'user')
    onClose()

    toast.success('Agenda berhasil ditambahkan')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-white/20">
        <DialogHeader>
          <DialogTitle>Tambah Agenda</DialogTitle>
          <DialogDescription>
            {defaultDate} - Buat agenda baru dengan waktu spesifik
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="agenda-title">Judul Agenda</Label>
            <Input
              id="agenda-title"
              placeholder="Contoh: Rapat divisi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-card/50 border-white/20"
            />
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label>Waktu</Label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-2 items-center">
                <Select value={hours} onValueChange={setHours}>
                  <SelectTrigger className="w-20 bg-card/50 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-lg font-bold">:</span>
                <Select value={minutes} onValueChange={setMinutes}>
                  <SelectTrigger className="w-20 bg-card/50 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }, (_, i) => (
                      <SelectItem key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pengingat</Label>
              <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
            </div>
            {reminderEnabled && (
              <Select value={reminderTime} onValueChange={setReminderTime}>
                <SelectTrigger className="bg-card/50 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">1 jam sebelumnya</SelectItem>
                  <SelectItem value="08:30">30 menit sebelumnya</SelectItem>
                  <SelectItem value="08:45">15 menit sebelumnya</SelectItem>
                  <SelectItem value="09:00">Tepat waktu</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Visibility */}
          {userRole === 'admin' || userDivision ? (
            <div className="space-y-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Privat
                </Label>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>
              <p className="text-xs text-muted-foreground">
                {isPrivate ? 'Hanya Anda yang bisa melihat agenda ini' : 'Semua orang bisa melihat agenda ini'}
              </p>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

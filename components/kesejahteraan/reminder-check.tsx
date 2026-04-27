"use client"

import { useEffect } from 'react'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'

export function ReminderCheck({ schedule, santriList }: { schedule: any[], santriList: any[] }) {
  const { user } = useApp()

  useEffect(() => {
    // Minta izin notifikasi
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Dengarkan pesan dari Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'REMINDER_COMPLETE') {
          // Trigger complete di halaman
          toast.success('Ditandai selesai dari notifikasi!')
          window.location.reload()
        }
      })
    }

    // Cek jadwal setiap menit
    const checkReminder = () => {
      if (!user || !schedule.length || Notification.permission !== 'granted') return

      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const mealTimes = [4, 10, 16]
      const today = now.toISOString().split('T')[0]

      // Notifikasi 15 menit sebelum waktu masak
      mealTimes.forEach(hour => {
        const timeStr = `${String(hour).padStart(2, '0')}:00`
        const todaySchedule = schedule.find(s => 
          s.schedule_date === today && 
          s.is_active && 
          s.santri_id === user.id
        )

        // Muncul 15 menit sebelum
        if (todaySchedule && currentHour === hour && currentMinute === 45) {
          new Notification('🍳 Waktunya Masak!', {
            body: `Hai ${user.name}! 15 menit lagi kamu masak jam ${timeStr}. Siap-siap ya!`,
            icon: '/icon.svg',
            tag: `masak-${timeStr}`,
            requireInteraction: true,
          })
        }

        // Tepat waktu
        if (todaySchedule && currentHour === hour && currentMinute === 0) {
          new Notification('⏰ Waktunya Masak Sekarang!', {
            body: `${user.name}, sekarang jam ${timeStr}. Ayo masak!`,
            icon: '/icon.svg',
            tag: `masak-tepat-${timeStr}`,
            requireInteraction: true,
          })
        }
      })
    }

    const interval = setInterval(checkReminder, 60000)
    checkReminder()

    return () => clearInterval(interval)
  }, [user, schedule])

  return null // Tidak render apa-apa
}
'use client'

import React from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="font-orbitron text-3xl font-bold text-primary mb-2">
            Tentang HIMSA
          </h1>
          <p className="text-muted-foreground">
            Himpunan Santri Almahir - Organisasi yang berdedikasi untuk pengembangan karakter dan
            keterampilan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/50 border-white/20 p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Visi</h2>
            <p className="text-foreground leading-relaxed">
              Menjadi organisasi yang menghasilkan generasi santri yang berakhlak mulia,
              berpengetahuan luas, dan siap berkontribusi untuk masyarakat dan bangsa.
            </p>
          </Card>

          <Card className="bg-card/50 border-white/20 p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Misi</h2>
            <ul className="space-y-2 text-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Mengembangkan karakter islami yang kuat</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Meningkatkan kompetensi dan keterampilan</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Membangun ukhuwah islamiyah yang solid</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Memberikan kontribusi nyata kepada masyarakat</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card className="bg-card/50 border-white/20 p-6">
          <h2 className="text-xl font-bold text-primary mb-6">Struktur Organisasi</h2>
          
          {/* Leadership */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Kepemimpinan</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { role: 'ketua', name: 'Ketua Umum', desc: 'Pemimpin Organisasi' },
                { role: 'wakil', name: 'Wakil Ketua', desc: 'Divisi Wakil' },
              ].map((pos) => (
                <div
                  key={pos.role}
                  className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg"
                >
                  <p className="font-bold text-cyan-300 text-sm">{pos.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pos.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divisions */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Divisi</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { role: 'keamanan', name: '🛡️ Keamanan', desc: 'Keamanan & Shift' },
                { role: 'kesejahteraan', name: '🍽️ Kesejahteraan', desc: 'Kesejahteraan & Masak' },
                { role: 'kebersihan', name: '🧹 Kebersihan', desc: 'Kebersihan Asrama' },
                { role: 'kesehatan', name: '⚕️ Kesehatan', desc: 'Kesehatan Anggota' },
                { role: 'olahraga', name: '⚽ Olahraga', desc: 'Kegiatan Olahraga' },
                { role: 'dakwah', name: '📖 Dakwah', desc: 'Hafalan & Dakwah' },
                { role: 'bahasa', name: '🌐 Bahasa', desc: 'Bahasa Arab & Inggris' },
              ].map((div) => (
                <div
                  key={div.role}
                  className="p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-lg hover:border-primary/50 transition"
                >
                  <p className="font-bold text-primary text-sm">{div.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{div.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="bg-card/50 border-white/20 p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Nilai-Nilai Inti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Integritas', desc: 'Jujur dan bertanggung jawab' },
              { title: 'Kolaborasi', desc: 'Bekerja sama untuk kesuksesan bersama' },
              { title: 'Inovasi', desc: 'Terus berinovasi dan berkembang' },
              { title: 'Dedikasi', desc: 'Serius dan konsisten dalam tugas' },
            ].map((value) => (
              <div key={value.title} className="p-4">
                <h3 className="font-bold text-foreground mb-1">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}

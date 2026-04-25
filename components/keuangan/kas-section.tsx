"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Sparkles, Trash2, Loader2, Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KasKelas {
    id: string
    kelas_id: string
    user_id: string
    month: number
    year: number
    amount: number
    is_paid: boolean
    paid_at: string | null
    kelas: { id: string; name: string }
    users: { id: string; name: string; email: string; avatar_url?: string | null }
}

interface Kelas {
    id: string
    name: string
}

interface KasStat {
    kelas_id: string
    kelas_name: string
    total_santri: number
    paid_santri: number
    unpaid_santri: number
    percentage: number
}

interface KasSectionProps {
    kasKelas: KasKelas[]
    kelas: Kelas[]
    kasStats: KasStat[]
    selectedKelas: string
    currentMonth: number
    currentYear: number
    canManage: boolean
    isCleaning: boolean
    isUpdatingKas: string | null
    onSelectKelas: (id: string) => void
    onPrevMonth: () => void
    onNextMonth: () => void
    onCleanup: () => void
    onGenerateKas: () => void
    onToggleKas: (id: string, status: boolean) => void
    formatRupiah: (amount: number) => string
    getSantriCountInKelas: (kelasId: string) => number
    monthNames: string[]
}

export function KasSection({
    kasKelas,
    kelas,
    kasStats,
    selectedKelas,
    currentMonth,
    currentYear,
    canManage,
    isCleaning,
    isUpdatingKas,
    onSelectKelas,
    onPrevMonth,
    onNextMonth,
    onCleanup,
    onGenerateKas,
    onToggleKas,
    formatRupiah,
    getSantriCountInKelas,
    monthNames,
}: KasSectionProps) {

    // Helper untuk dapat avatar dari santriList
    const getAvatarUrl = (kas: KasKelas): string => {
        if (kas.users?.avatar_url) return kas.users.avatar_url

        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(kas.users?.name || 'User')}`
    }

    return (
        <div className="space-y-6">
            {/* Month Selector */}
            <Card className="bg-card/50 border-white/20 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="font-semibold text-primary">
                        Kas Bulan {monthNames[currentMonth - 1]} {currentYear}
                    </h3>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onPrevMonth}>←</Button>
                        <span className="px-4 min-w-32 text-center">
                            {monthNames[currentMonth - 1]} {currentYear}
                        </span>
                        <Button variant="outline" size="sm" onClick={onNextMonth}>→</Button>
                    </div>
                </div>
            </Card>

            {/* Kelas Selector */}
            <div className="flex gap-2 flex-wrap items-center">
                <Button
                    variant={selectedKelas === 'all' ? 'default' : 'outline'}
                    onClick={() => onSelectKelas('all')}
                >
                    Semua Kelas
                </Button>
                {kelas.map((k) => (
                    <Button
                        key={k.id}
                        variant={selectedKelas === k.id ? 'default' : 'outline'}
                        onClick={() => onSelectKelas(k.id)}
                    >
                        Kelas {k.name}
                    </Button>
                ))}
                {canManage && (
                    <div className="ml-auto flex gap-2">
                        <Button
                            onClick={onCleanup}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={isCleaning}
                        >
                            {isCleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Bersihkan
                        </Button>
                        <Button onClick={onGenerateKas} className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500">
                            <Sparkles className="h-4 w-4" />
                            Generate Kas
                        </Button>
                    </div>
                )}
            </div>

            {/* Kas per Kelas */}
            {kelas.map((k) => {
                if (selectedKelas !== 'all' && selectedKelas !== k.id) return null

                const kasInKelas = kasKelas.filter(kas => kas.kelas_id === k.id)
                const santriCount = getSantriCountInKelas(k.id)
                const stat = kasStats.find(s => s.kelas_id === k.id)

                return (
                    <Card key={k.id} className="bg-card/50 border-white/20 overflow-hidden">
                        <div className="p-4 border-b border-white/20 bg-primary/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-primary">Kelas {k.name}</h3>
                                    <p className="text-xs text-muted-foreground">{santriCount} anggota</p>
                                </div>
                                <Badge variant="outline">
                                    {stat?.paid_santri || 0}/{stat?.total_santri || 0} Lunas ({stat?.percentage || 0}%)
                                </Badge>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full mt-3">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: `${stat?.percentage || 0}%` }}
                                />
                            </div>
                        </div>

                        {kasInKelas.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-muted-foreground mb-4">Belum ada data kas</p>
                                {canManage && (
                                    <Button onClick={onGenerateKas} className="gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Generate Kas
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
                                {kasInKelas.map((kas) => (
                                    <div key={kas.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar dengan foto profil dari database */}
                                            {/* Avatar dengan foto profil dari database */}
                                            <Avatar className="h-10 w-10 border-2 border-primary/30 flex-shrink-0">
                                                <AvatarImage
                                                    src={getAvatarUrl(kas)}
                                                    alt={kas.users.name}
                                                />
                                                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                                    {kas.users.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{kas.users.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{kas.users.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <p className="font-semibold">{formatRupiah(kas.amount)}</p>
                                            {canManage ? (
                                                <Button
                                                    variant={kas.is_paid ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => onToggleKas(kas.id, kas.is_paid)}
                                                    disabled={isUpdatingKas === kas.id}
                                                    className={cn(kas.is_paid && 'bg-green-500 hover:bg-green-600')}
                                                >
                                                    {isUpdatingKas === kas.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : kas.is_paid ? (
                                                        <>
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Lunas
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="h-4 w-4 mr-1" />
                                                            Belum
                                                        </>
                                                    )}
                                                </Button>
                                            ) : (
                                                <Badge variant={kas.is_paid ? 'default' : 'secondary'}>
                                                    {kas.is_paid ? 'Lunas' : 'Belum Lunas'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )
            })}
        </div>
    )
}
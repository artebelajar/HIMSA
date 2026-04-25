"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import {
    FileText, Upload, Download, Eye, Trash2, Edit2, Plus, Loader2, X,
    FileDigit, Calendar, User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getDivisionNames } from '@/lib/divisions'

interface Proker {
    id: string
    title: string
    description: string | null
    division: string
    file_name: string
    file_url: string
    file_size: number | null
    uploaded_by: string
    uploaded_by_name: string
    created_at: string
}

export default function ProkerPage() {
    const { user } = useApp()
    const [prokerList, setProkerList] = useState<Proker[]>([])
    const [divisions, setDivisions] = useState<string[]>([])
    const [selectedDivision, setSelectedDivision] = useState<string>('all')
    const [isLoading, setIsLoading] = useState(true)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedProker, setSelectedProker] = useState<Proker | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [editingProker, setEditingProker] = useState<Proker | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        division: '',
        file: null as File | null,
    })

    const canManage = user?.role === 'admin' || user?.divisions?.includes('Ketua')

    useEffect(() => {
        loadDivisions()
        loadProker()
    }, [selectedDivision])

    const loadDivisions = async () => {
        const divs = await getDivisionNames()
        setDivisions(divs)
    }

    const loadProker = async () => {
        setIsLoading(true)
        try {
            const url = selectedDivision === 'all'
                ? '/api/proker'
                : `/api/proker?division=${selectedDivision}`

            const response = await fetch(url)
            const result = await response.json()

            if (result.success) {
                setProkerList(result.data)
            }
        } catch (error) {
            console.error('Failed to load proker:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error('Hanya file PDF yang diperbolehkan')
                return
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error('Ukuran file maksimal 10 MB')
                return
            }

            setFormData({ ...formData, file })
        }
    }

    const handleUpload = async () => {
        if (!formData.title || !formData.division || !formData.file) {
            toast.error('Judul, divisi, dan file harus diisi')
            return
        }

        if (!user) return

        setIsUploading(true)
        try {
            // Upload file ke Supabase Storage
            const fileExt = formData.file.name.split('.').pop()
            const fileName = `proker-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('proker')
                .upload(fileName, formData.file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from('proker')
                .getPublicUrl(fileName)

            // Simpan ke database
            const response = await fetch('/api/proker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description || null,
                    division: formData.division,
                    file_name: formData.file.name,
                    file_url: urlData.publicUrl,
                    file_size: formData.file.size,
                    uploaded_by: user.id,
                    uploaded_by_name: user.name,
                }),
            })

            const result = await response.json()

            if (result.success) {
                toast.success('Proker berhasil diupload')
                setShowUploadModal(false)
                resetForm()
                loadProker()
            } else {
                toast.error(result.error || 'Gagal menyimpan proker')
            }
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Gagal upload file')
        } finally {
            setIsUploading(false)
        }
    }

    const handleUpdate = async () => {
        if (!editingProker) return
        if (!formData.title || !formData.division) {
            toast.error('Judul dan divisi harus diisi')
            return
        }

        setIsSaving(true)
        try {
            const response = await fetch('/api/proker', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingProker.id,
                    title: formData.title,
                    description: formData.description || null,
                    division: formData.division,
                }),
            })

            const result = await response.json()

            if (result.success) {
                toast.success('Proker berhasil diupdate')
                setShowUploadModal(false)
                setEditingProker(null)
                resetForm()
                loadProker()
            } else {
                toast.error(result.error || 'Gagal mengupdate proker')
            }
        } catch (error) {
            toast.error('Gagal mengupdate proker')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (proker: Proker) => {
        if (!confirm(`Hapus proker "${proker.title}"?`)) return

        setIsDeleting(proker.id)
        try {
            const response = await fetch(`/api/proker?id=${proker.id}&fileUrl=${encodeURIComponent(proker.file_url)}`, {
                method: 'DELETE',
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Proker berhasil dihapus')
                loadProker()
            } else {
                toast.error(result.error || 'Gagal menghapus proker')
            }
        } catch (error) {
            toast.error('Gagal menghapus proker')
        } finally {
            setIsDeleting(null)
        }
    }

    const handleEdit = (proker: Proker) => {
        setEditingProker(proker)
        setFormData({
            title: proker.title,
            description: proker.description || '',
            division: proker.division,
            file: null,
        })
        setShowUploadModal(true)
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            division: '',
            file: null,
        })
        setEditingProker(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '-'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="space-y-8 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Program Kerja
                        </h1>
                        <p className="text-muted-foreground">Dokumen program kerja setiap divisi</p>
                    </div>

                    {canManage && (
                        <Button onClick={() => { resetForm(); setShowUploadModal(true) }} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Upload Proker
                        </Button>
                    )}
                </div>

                {/* Filter */}
                <Card className="bg-card/50 border-white/20 p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <Label className="text-sm">Filter Divisi:</Label>
                        <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                            <SelectTrigger className="w-64 bg-input/50 border-white/20">
                                <SelectValue placeholder="Semua Divisi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Divisi</SelectItem>
                                {divisions.map((div) => (
                                    <SelectItem key={div} value={div}>{div}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Proker List */}
                {prokerList.length === 0 ? (
                    <Card className="bg-card/50 border-white/20 p-12 text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Belum ada program kerja</p>
                        {canManage && (
                            <Button onClick={() => { resetForm(); setShowUploadModal(true) }} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Upload Proker
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {prokerList.map((proker) => (
                            <Card key={proker.id} className="bg-card/50 border-white/20 overflow-hidden hover:border-primary/50 transition-all">
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-500/20 rounded-lg">
                                                <FileText className="h-5 w-5 text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground line-clamp-1">{proker.title}</h3>
                                                <Badge variant="outline" className="mt-1">{proker.division}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {proker.description && (
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {proker.description}
                                        </p>
                                    )}

                                    <div className="space-y-2 text-xs text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileDigit className="h-3 w-3" />
                                            <span>{proker.file_name} ({formatFileSize(proker.file_size)})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDate(proker.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            <span>{proker.uploaded_by_name}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => { setSelectedProker(proker); setShowViewModal(true) }}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Baca
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => window.open(proker.file_url, '_blank')}
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                        </Button>
                                        {canManage && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(proker)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(proker)}
                                                    disabled={isDeleting === proker.id}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    {isDeleting === proker.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Upload/Edit Modal */}
                <Dialog open={showUploadModal} onOpenChange={(open) => {
                    setShowUploadModal(open)
                    if (!open) resetForm()
                }}>
                    <DialogContent className="bg-card border-white/20 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-primary">
                                {editingProker ? 'Edit Program Kerja' : 'Upload Program Kerja'}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                {editingProker ? 'Edit informasi program kerja.' : 'Upload file PDF program kerja divisi.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Judul</Label>
                                <Input
                                    placeholder="Contoh: Program Kerja Dakwah 2026"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="mt-2 bg-input/50 border-white/20"
                                />
                            </div>

                            <div>
                                <Label>Divisi</Label>
                                <Select value={formData.division} onValueChange={(v) => setFormData({ ...formData, division: v })}>
                                    <SelectTrigger className="mt-2 bg-input/50 border-white/20">
                                        <SelectValue placeholder="Pilih Divisi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {divisions.map((div) => (
                                            <SelectItem key={div} value={div}>{div}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Deskripsi (Opsional)</Label>
                                <Textarea
                                    placeholder="Deskripsi singkat program kerja..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-2 bg-input/50 border-white/20 resize-none"
                                    rows={3}
                                />
                            </div>

                            {!editingProker && (
                                <div>
                                    <Label>File PDF (Max 10MB)</Label>
                                    <div className="mt-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,application/pdf"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="proker-file"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full border-dashed"
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            {formData.file ? formData.file.name : 'Pilih File PDF'}
                                        </Button>
                                        {formData.file && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatFileSize(formData.file.size)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => {
                                setShowUploadModal(false)
                                resetForm()
                            }}>
                                Batal
                            </Button>
                            <Button
                                className="flex-1 bg-primary"
                                onClick={editingProker ? handleUpdate : handleUpload}
                                disabled={isUploading || isSaving}
                            >
                                {(isUploading || isSaving) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : editingProker ? (
                                    'Simpan'
                                ) : (
                                    'Upload'
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* View PDF Modal */}
                {/* View PDF Fullscreen - Bukan Modal */}
                {showViewModal && selectedProker && (
                    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                        {/* Header */}
                        <div className="bg-card/95 border-b border-white/20 p-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-primary">{selectedProker.title}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {selectedProker.division} • {selectedProker.file_name} • {formatFileSize(selectedProker.file_size)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => window.open(selectedProker.file_url, '_blank')}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* PDF Viewer */}
                        <div className="flex-1 w-full">
                            <iframe
                                src={selectedProker.file_url}
                                className="w-full h-full"
                                title={selectedProker.title}
                            />
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}
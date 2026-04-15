'use client'

import React, { useState } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Proposal {
  id: string
  name: string
  fileName: string
  description: string
  date: string
  size: string
}

const PROPOSALS: Proposal[] = [
  {
    id: '1',
    name: 'Proposal Program Dakwah 2026',
    fileName: 'proposal-dakwah-2026.docx',
    description: 'Rencana program dakwah untuk tahun 2026 mencakup kajian rutin dan seminar.',
    date: '2026-01-15',
    size: '2.4 MB',
  },
  {
    id: '2',
    name: 'Proposal Kegiatan Olahraga Semesteran',
    fileName: 'proposal-olahraga-semester.docx',
    description: 'Proposal untuk acara olahraga tahunan yang melibatkan seluruh divisi.',
    date: '2026-02-10',
    size: '1.8 MB',
  },
  {
    id: '3',
    name: 'Proposal Pengembangan Kebersihan Lingkungan',
    fileName: 'proposal-kebersihan.docx',
    description: 'Program kebersihan lingkungan berkelanjutan untuk asrama dan sekitarnya.',
    date: '2026-03-05',
    size: '2.1 MB',
  },
  {
    id: '4',
    name: 'Proposal Kesehatan dan Wellness',
    fileName: 'proposal-kesehatan.docx',
    description: 'Program kesehatan meliputi pemeriksaan kesehatan berkala dan edukasi.',
    date: '2026-01-20',
    size: '1.9 MB',
  },
]

export default function ProposalPage() {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handlePreview = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setIsDialogOpen(true)
  }

  const handleDownload = (proposal: Proposal) => {
    toast.success(`Mengunduh ${proposal.fileName}...`)
    // In a real app, this would trigger an actual download
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="font-orbitron text-3xl font-bold text-primary mb-2">
            Proposal & Dokumen
          </h1>
          <p className="text-muted-foreground">
            Koleksi proposal dan dokumen penting dari HIMSA
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROPOSALS.map((proposal) => (
            <Card
              key={proposal.id}
              className="bg-card/50 border-white/20 p-6 hover:border-primary/50 transition"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-1">
                    {proposal.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {proposal.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{formatDate(proposal.date)}</span>
                    <span>{proposal.size}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(proposal)}
                      className="flex-1 border-white/20 gap-2"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleDownload(proposal)}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      Unduh
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Preview Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl bg-card/50 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-primary">
                {selectedProposal?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-8 text-center min-h-96 flex items-center justify-center">
                <div className="space-y-4">
                  <FileText className="h-16 w-16 text-primary mx-auto opacity-50" />
                  <div>
                    <p className="text-foreground font-semibold mb-2">
                      {selectedProposal?.fileName}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      {selectedProposal?.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Tanggal Upload</p>
                  <p className="text-foreground font-semibold">
                    {selectedProposal && formatDate(selectedProposal.date)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ukuran File</p>
                  <p className="text-foreground font-semibold">
                    {selectedProposal?.size}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  handleDownload(selectedProposal!)
                  setIsDialogOpen(false)
                }}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Unduh File
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

"use client"

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ZoomIn, ZoomOut } from 'lucide-react'

interface CropModalProps {
  open: boolean
  onClose: () => void
  imageUrl: string
  aspectRatio: '9:16' | '16:9' | '1:1'
  onCropComplete: (croppedImageUrl: string) => void
}

export function CropModal({ open, onClose, imageUrl, aspectRatio, onCropComplete }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const getAspectRatio = () => {
    switch (aspectRatio) {
      case '9:16': return 9 / 16
      case '16:9': return 16 / 9
      default: return 1
    }
  }

  const onCropChange = useCallback((crop: any) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onCropAreaComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return

    try {
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels)
      onCropComplete(croppedImage)
      onClose()
    } catch (e) {
      console.error('Crop error:', e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">Sesuaikan Posisi Poster</DialogTitle>
        </DialogHeader>

        <div className="relative h-[400px] bg-black rounded-lg overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={getAspectRatio()}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
            cropShape="rect"
            showGrid={true}
            objectFit="contain"
          />
        </div>

        {/* Zoom Control */}
        <div className="flex items-center gap-3 px-2">
          <ZoomOut className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[zoom]}
            onValueChange={([val]) => setZoom(val)}
            min={1}
            max={3}
            step={0.1}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Geser untuk mengatur posisi • Zoom untuk memperbesar/memperkecil
        </p>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button className="flex-1 bg-primary" onClick={handleSave}>
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper: Create cropped image
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('No 2d context')

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      resolve(url)
    }, 'image/jpeg', 0.95)
  })
}
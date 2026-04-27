"use client"

import { useApp } from '@/providers/app-provider'
import { CursorTrail } from '@/components/cursor-trail'

export function CursorTrailWrapper() {
  const { cursorTrailEnabled } = useApp()
  
  if (!cursorTrailEnabled) return null
  
  return <CursorTrail />
}
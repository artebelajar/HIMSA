'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  radius: number
  id: number
  colorIndex: number
}

const colors = [
  { r: 0, g: 217, b: 255 },      // Cyan
  { r: 0, g: 255, b: 221 },      // Turquoise
  { r: 0, g: 255, b: 170 },      // Mint
  { r: 99, g: 102, b: 241 },     // Indigo
  { r: 168, g: 85, b: 247 },     // Purple
]

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const lastXRef = useRef(0)
  const lastYRef = useRef(0)
  const particleIdRef = useRef(0)
  const mouseXRef = useRef(0)
  const mouseYRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX
      mouseYRef.current = e.clientY
      const x = e.clientX
      const y = e.clientY

      // Create multiple particles every 3 pixels
      if (Math.hypot(x - lastXRef.current, y - lastYRef.current) > 3) {
        for (let i = 0; i < 2; i++) {
          const angle = (Math.random() * Math.PI * 2)
          const speed = Math.random() * 1.5 + 0.5
          particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            radius: Math.random() * 2.5 + 1.5,
            id: particleIdRef.current++,
            colorIndex: Math.floor(Math.random() * colors.length),
          })
        }
        lastXRef.current = x
        lastYRef.current = y
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw ambient glow
      const gradient = ctx.createRadialGradient(mouseXRef.current, mouseYRef.current, 0, mouseXRef.current, mouseYRef.current, 150)
      gradient.addColorStop(0, 'rgba(0, 217, 255, 0.1)')
      gradient.addColorStop(0.5, 'rgba(0, 255, 221, 0.05)')
      gradient.addColorStop(1, 'rgba(0, 217, 255, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.alpha -= 0.015
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vx *= 0.98
        particle.vy *= 0.98
        particle.vy += 0.1 // gravity

        if (particle.alpha <= 0) return false

        const color = colors[particle.colorIndex]
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.alpha * 0.7})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()

        // Add glow
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.alpha * 0.3})`
        ctx.lineWidth = 1
        ctx.stroke()

        return true
      })

      requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    const animationId = requestAnimationFrame(animate)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ top: 0, left: 0 }}
    />
  )
}

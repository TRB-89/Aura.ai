import { useEffect, useRef } from 'react'

interface GoldenNeuralWaveProps {
  className?: string
  height?: number
  interactive?: boolean
}

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  fadeSpeed: number
}

export function GoldenNeuralWave({ className = '', height = 480, interactive = true }: GoldenNeuralWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let canvasHeight = (canvas.height = height)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      canvasHeight = canvas.height = height
    }
    window.addEventListener('resize', handleResize)

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || !canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.targetX = (e.clientX - rect.left) / width
      mouseRef.current.targetY = (e.clientY - rect.top) / canvasHeight
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Stardust embers
    const particles: Particle[] = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * canvasHeight,
      size: Math.random() * 2 + 0.6,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.5 - 0.1,
      opacity: Math.random() * 0.6 + 0.2,
      fadeSpeed: Math.random() * 0.01 + 0.005,
    }))

    // Flowing ribbon layers
    const waves = [
      { color: 'rgba(243, 199, 124, 0.55)', width: 2.5, speed: 0.016, freq: 0.003, amp: 55, yOffset: 0.52 },
      { color: 'rgba(212, 175, 55, 0.45)', width: 2.0, speed: 0.012, freq: 0.004, amp: 70, yOffset: 0.50 },
      { color: 'rgba(197, 155, 109, 0.40)', width: 1.8, speed: 0.020, freq: 0.0025, amp: 45, yOffset: 0.48 },
      { color: 'rgba(229, 184, 105, 0.35)', width: 1.5, speed: 0.010, freq: 0.005, amp: 85, yOffset: 0.54 },
      { color: 'rgba(255, 235, 190, 0.60)', width: 1.2, speed: 0.024, freq: 0.0035, amp: 35, yOffset: 0.51 },
      { color: 'rgba(158, 116, 74, 0.25)', width: 3.5, speed: 0.008, freq: 0.002, amp: 95, yOffset: 0.47 },
    ]

    let time = 0

    const render = () => {
      time += 1

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05

      ctx.clearRect(0, 0, width, canvasHeight)

      // Ambient radial glow behind the center of the wave
      const radialGlow = ctx.createRadialGradient(
        width * 0.5,
        canvasHeight * 0.5,
        10,
        width * 0.5,
        canvasHeight * 0.5,
        width * 0.45
      )
      radialGlow.addColorStop(0, 'rgba(197, 155, 109, 0.12)')
      radialGlow.addColorStop(0.5, 'rgba(212, 175, 55, 0.05)')
      radialGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = radialGlow
      ctx.fillRect(0, 0, width, canvasHeight)

      // Render floating golden stardust
      ctx.save()
      for (const p of particles) {
        p.x += p.speedX
        p.y += p.speedY
        p.opacity += p.fadeSpeed
        if (p.opacity > 0.8 || p.opacity < 0.1) {
          p.fadeSpeed = -p.fadeSpeed
        }
        if (p.y < 0) {
          p.y = canvasHeight
          p.x = Math.random() * width
        }
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(243, 199, 124, ${Math.max(0, Math.min(1, p.opacity))})`
        ctx.shadowColor = 'rgba(243, 199, 124, 0.8)'
        ctx.shadowBlur = 6
        ctx.fill()
      }
      ctx.restore()

      // Render flowing neural ribbon layers with screen blending
      ctx.save()
      ctx.globalCompositeOperation = 'screen'

      const mouseInfluenceX = (mouseRef.current.x - 0.5) * 60
      const mouseInfluenceY = (mouseRef.current.y - 0.5) * 45

      waves.forEach((wave, waveIdx) => {
        ctx.beginPath()
        ctx.lineWidth = wave.width
        ctx.strokeStyle = wave.color
        ctx.shadowColor = wave.color
        ctx.shadowBlur = 12

        const step = 6
        for (let x = 0; x <= width + step; x += step) {
          const t = time * wave.speed
          // Multi-frequency harmonic wave
          const baseSin = Math.sin(x * wave.freq + t + waveIdx)
          const harmonicSin = Math.sin(x * wave.freq * 2.2 - t * 0.7) * 0.35
          const subSin = Math.cos(x * 0.001 + t * 0.4) * 0.2

          // Envelope damping near edges
          const edgeDamp = Math.sin((x / width) * Math.PI)
          const totalAmp = wave.amp * edgeDamp + edgeDamp * mouseInfluenceY

          const y =
            canvasHeight * wave.yOffset +
            (baseSin + harmonicSin + subSin) * totalAmp +
            Math.sin(x * 0.002 + t) * (mouseInfluenceX * 0.3)

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      })

      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [height, interactive])

  return (
    <div className={`relative w-full overflow-hidden pointer-events-none select-none ${className}`} style={{ height }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  )
}

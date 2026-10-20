import { useEffect, useRef, useState } from 'react'

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing' | 'success' | 'error'

interface AuraLiveVoiceWaveProps {
  state: VoiceState
  height?: number
  currentAction?: string
  className?: string
}

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  angle: number
}

export function AuraLiveVoiceWave({
  state,
  height = 340,
  currentAction,
  className = '',
}: AuraLiveVoiceWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioLevelRef = useRef<number>(0)
  const smoothedLevelRef = useRef<number>(0)

  // Web Audio microphone listener for 'listening' state
  useEffect(() => {
    let active = true

    if (state === 'listening') {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          if (!active) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          mediaStreamRef.current = stream
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          const ctx = new AudioContextClass()
          audioContextRef.current = ctx
          const source = ctx.createMediaStreamSource(stream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 128
          analyser.smoothingTimeConstant = 0.8
          source.connect(analyser)
          analyserRef.current = analyser
        } catch (e) {
          console.warn('[VoiceWave] Microphone audio access fallback:', e)
        }
      }
      initAudio()
    } else {
      // Cleanup microphone stream when not listening
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
      analyserRef.current = null
      audioLevelRef.current = 0
    }

    return () => {
      active = false
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [state])

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || 900)
    let canvasHeight = (canvas.height = height)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      canvasHeight = canvas.height = height
    }
    window.addEventListener('resize', handleResize)

    // Golden stardust / ember particles
    const particles: Particle[] = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * canvasHeight,
      size: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.4 - 0.1,
      opacity: Math.random() * 0.7 + 0.2,
      angle: Math.random() * Math.PI * 2,
    }))

    const audioDataArray = new Uint8Array(64)
    let time = 0

    const render = () => {
      time += 1

      // Read real microphone amplitude if listening
      if (state === 'listening' && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(audioDataArray)
        let sum = 0
        for (let i = 0; i < audioDataArray.length; i++) {
          sum += audioDataArray[i]
        }
        const avg = sum / audioDataArray.length
        audioLevelRef.current = avg / 128 // 0.0 to 2.0
      } else if (state === 'speaking') {
        // Natural pulsing speech waveform modulation
        const speechSim = (Math.sin(time * 0.08) * 0.4 + Math.sin(time * 0.22) * 0.3 + 0.5)
        audioLevelRef.current = speechSim
      } else {
        audioLevelRef.current = 0
      }

      // Smooth amplitude transitions (EMA)
      smoothedLevelRef.current += (audioLevelRef.current - smoothedLevelRef.current) * 0.15
      const currentLevel = smoothedLevelRef.current

      ctx.clearRect(0, 0, width, canvasHeight)

      // State-specific palette & dynamics
      let primaryGlow = 'rgba(212, 175, 55, 0.15)'
      let coreAmp = 42
      let ribbonSpeed = 0.015

      if (state === 'listening') {
        primaryGlow = `rgba(243, 199, 124, ${0.18 + currentLevel * 0.25})`
        coreAmp = 45 + currentLevel * 75
        ribbonSpeed = 0.025 + currentLevel * 0.02
      } else if (state === 'thinking') {
        primaryGlow = 'rgba(212, 150, 40, 0.22)'
        coreAmp = 35 + Math.sin(time * 0.06) * 15
        ribbonSpeed = 0.035
      } else if (state === 'speaking') {
        primaryGlow = `rgba(255, 215, 120, ${0.2 + currentLevel * 0.2})`
        coreAmp = 40 + currentLevel * 60
        ribbonSpeed = 0.028
      } else if (state === 'executing') {
        primaryGlow = 'rgba(243, 199, 124, 0.25)'
        coreAmp = 30
        ribbonSpeed = 0.04
      } else if (state === 'success') {
        primaryGlow = 'rgba(120, 220, 160, 0.22)'
        coreAmp = 38
      } else if (state === 'error') {
        primaryGlow = 'rgba(230, 90, 70, 0.22)'
        coreAmp = 25
      }

      // 1. Ambient central radial lighting
      const radial = ctx.createRadialGradient(
        width * 0.5,
        canvasHeight * 0.5,
        15,
        width * 0.5,
        canvasHeight * 0.5,
        width * 0.42
      )
      radial.addColorStop(0, primaryGlow)
      radial.addColorStop(0.55, 'rgba(197, 155, 109, 0.04)')
      radial.addColorStop(1, 'transparent')
      ctx.fillStyle = radial
      ctx.fillRect(0, 0, width, canvasHeight)

      // 2. Floating golden ember particles
      ctx.save()
      for (const p of particles) {
        if (state === 'thinking') {
          // Orbital movement in thinking state
          p.angle += 0.02
          p.x = width * 0.5 + Math.cos(p.angle + p.size) * (width * 0.28)
          p.y = canvasHeight * 0.5 + Math.sin(p.angle * 1.5) * (canvasHeight * 0.25)
        } else {
          p.x += p.speedX
          p.y += p.speedY
          if (p.y < 0) {
            p.y = canvasHeight
            p.x = Math.random() * width
          }
          if (p.x < 0) p.x = width
          if (p.x > width) p.x = 0
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(243, 199, 124, ${p.opacity})`
        ctx.shadowColor = 'rgba(243, 199, 124, 0.8)'
        ctx.shadowBlur = 4
        ctx.fill()
      }
      ctx.restore()

      // 3. Layered Harmonic Fluid Ribbons
      const waveLayers = [
        {
          color: state === 'error' ? 'rgba(240, 90, 70, 0.55)' : state === 'success' ? 'rgba(100, 220, 160, 0.55)' : 'rgba(243, 199, 124, 0.65)',
          width: 2.8,
          speed: ribbonSpeed * 1.0,
          freq: 0.0032,
          amp: coreAmp,
          yOffset: 0.5,
        },
        {
          color: state === 'error' ? 'rgba(200, 60, 50, 0.45)' : state === 'success' ? 'rgba(80, 190, 140, 0.45)' : 'rgba(212, 175, 55, 0.45)',
          width: 2.0,
          speed: ribbonSpeed * 0.75,
          freq: 0.0042,
          amp: coreAmp * 0.85,
          yOffset: 0.52,
        },
        {
          color: 'rgba(255, 235, 190, 0.70)',
          width: 1.4,
          speed: ribbonSpeed * 1.3,
          freq: 0.0038,
          amp: coreAmp * 0.55,
          yOffset: 0.49,
        },
        {
          color: 'rgba(180, 130, 80, 0.35)',
          width: 3.2,
          speed: ribbonSpeed * 0.5,
          freq: 0.0022,
          amp: coreAmp * 1.15,
          yOffset: 0.48,
        },
      ]

      ctx.save()
      ctx.globalCompositeOperation = 'screen'

      waveLayers.forEach((w, layerIndex) => {
        ctx.beginPath()
        ctx.lineWidth = w.width
        ctx.strokeStyle = w.color
        ctx.shadowColor = w.color
        ctx.shadowBlur = 12

        const baseLineY = canvasHeight * w.yOffset
        const step = 6

        for (let x = 0; x <= width; x += step) {
          // Complex harmonic envelope
          const normalizedX = (x / width) * 2 - 1
          const envelope = Math.max(0, 1 - Math.pow(normalizedX, 2)) // Center peak taper

          const harmonic1 = Math.sin(x * w.freq + time * w.speed + layerIndex * 1.2)
          const harmonic2 = Math.cos(x * w.freq * 1.7 - time * w.speed * 0.8)
          const displacement = (harmonic1 * 0.7 + harmonic2 * 0.3) * w.amp * envelope

          const y = baseLineY + displacement

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
      })

      // 4. Executing scan beam effect
      if (state === 'executing') {
        const scanX = ((time * 4) % (width + 200)) - 100
        const scanGrad = ctx.createLinearGradient(scanX - 60, 0, scanX + 60, 0)
        scanGrad.addColorStop(0, 'transparent')
        scanGrad.addColorStop(0.5, 'rgba(255, 235, 190, 0.4)')
        scanGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = scanGrad
        ctx.fillRect(scanX - 60, canvasHeight * 0.3, 120, canvasHeight * 0.4)
      }

      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [state, height])

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full pointer-events-none transition-all duration-500"
        style={{ height }}
      />

      {/* State Badge & Live Feedback */}
      <div className="absolute bottom-4 flex flex-col items-center gap-1.5 pointer-events-none">
        <div className="px-3.5 py-1 rounded-full bg-[#141720]/80 border border-[#C59B6D]/30 backdrop-blur-md shadow-lg flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              state === 'listening'
                ? 'bg-amber-400 animate-ping'
                : state === 'thinking'
                ? 'bg-amber-500 animate-pulse'
                : state === 'speaking'
                ? 'bg-[#F3C77C] animate-pulse'
                : state === 'executing'
                ? 'bg-blue-400 animate-spin'
                : state === 'success'
                ? 'bg-emerald-400'
                : state === 'error'
                ? 'bg-rose-500'
                : 'bg-[#C59B6D]/60'
            }`}
          />
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#E5D7C5]">
            {state === 'listening'
              ? 'Listening...'
              : state === 'thinking'
              ? 'Thinking...'
              : state === 'speaking'
              ? 'Speaking'
              : state === 'executing'
              ? 'Executing Automation'
              : state === 'success'
              ? 'Success'
              : state === 'error'
              ? 'Action Failed'
              : 'AURA Active'}
          </span>
        </div>

        {currentAction && (
          <p className="text-xs text-[#A89F91] font-mono tracking-wide px-3 py-0.5 rounded bg-black/40 border border-[#C59B6D]/15">
            {currentAction}
          </p>
        )}
      </div>
    </div>
  )
}

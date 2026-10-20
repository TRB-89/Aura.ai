import { motion } from 'framer-motion'
import type { VoiceState } from '@/types/aura'

interface OrbProps {
  state: VoiceState
  amplitude?: number // 0-1, from real mic input when available
  size?: number
  onClick?: () => void
}

const stateConfig: Record<string, { className: string; pulseRate: number; label: string; badgeColor: string }> = {
  idle: { className: 'orb-luxury-idle', pulseRate: 4, label: 'AURA STANDBY', badgeColor: 'text-aura-text-muted border-aura-border' },
  listening: { className: 'orb-luxury-listening', pulseRate: 1.5, label: 'LISTENING...', badgeColor: 'text-aura-cream border-aura-border-beige' },
  wake_detected: { className: 'orb-luxury-listening', pulseRate: 1.2, label: 'WAKING UP...', badgeColor: 'text-aura-cream border-aura-border-beige' },
  transcribing: { className: 'orb-luxury-thinking', pulseRate: 1.8, label: 'TRANSCRIBING', badgeColor: 'text-aura-bronze border-aura-border-bronze' },
  thinking: { className: 'orb-luxury-thinking', pulseRate: 2, label: 'THINKING...', badgeColor: 'text-aura-bronze border-aura-border-bronze' },
  executing: { className: 'orb-luxury-thinking', pulseRate: 1.6, label: 'EXECUTING TASK', badgeColor: 'text-aura-bronze border-aura-border-bronze' },
  speaking: { className: 'orb-luxury-speaking', pulseRate: 1.4, label: 'AURA SPEAKING', badgeColor: 'text-aura-success border-aura-success/30' },
  follow_up: { className: 'orb-luxury-listening', pulseRate: 3, label: 'READY FOR PROMPT', badgeColor: 'text-aura-beige border-aura-border-beige' },
  interrupted: { className: 'orb-luxury-idle', pulseRate: 4, label: 'INTERRUPTED', badgeColor: 'text-aura-text-muted border-aura-border' },
  canceled: { className: 'orb-luxury-idle', pulseRate: 4, label: 'CANCELED', badgeColor: 'text-aura-text-muted border-aura-border' },
  failed: { className: 'orb-luxury-error', pulseRate: 2, label: 'ERROR', badgeColor: 'text-aura-error border-aura-error/30' },
  mic_unavailable: { className: 'orb-luxury-error', pulseRate: 4, label: 'NO MICROPHONE', badgeColor: 'text-aura-error border-aura-error/30' },
  network_unavailable: { className: 'orb-luxury-error', pulseRate: 4, label: 'OFFLINE MODE', badgeColor: 'text-aura-warning border-aura-warning/30' },
}

export function AuraOrb({ state, amplitude = 0, size = 150, onClick }: OrbProps) {
  const config = stateConfig[state] ?? stateConfig.idle
  const audioScale = (state === 'listening' || state === 'speaking') ? 1 + amplitude * 0.18 : 1

  const isThinking = state === 'thinking' || state === 'transcribing' || state === 'executing'
  const isSpeaking = state === 'speaking'

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="relative flex items-center justify-center" style={{ width: size + 36, height: size + 36 }}>
        {/* Outer Orbit Dashed Ring */}
        <motion.div
          animate={{ rotate: isThinking ? 360 : 180 }}
          transition={{ duration: isThinking ? 8 : 40, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-dashed border-aura-bronze/20 pointer-events-none"
        />

        {/* Middle Precision Celestial Ring with Warm Accent Ticks */}
        <motion.div
          animate={{ rotate: isThinking ? -360 : 0 }}
          transition={{ duration: isThinking ? 12 : 60, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 rounded-full border border-aura-border-beige/40 pointer-events-none"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-aura-beige shadow-glow-beige" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-aura-bronze/80" />
        </motion.div>

        {/* Main Central Interactive Orb */}
        <motion.button
          onClick={onClick}
          animate={{ scale: audioScale }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className={`
            relative rounded-full cursor-pointer no-drag flex items-center justify-center
            ${config.className}
            transition-all duration-500 focus:outline-none
          `}
          style={{ width: size, height: size }}
          aria-label={`AURA assistant — ${state}`}
          title="Click to toggle voice interaction"
        >
          {/* Inner Gyroscopic Ring 1 */}
          <motion.div
            className="absolute inset-3 rounded-full border border-aura-cream/25"
            animate={{ rotate: isThinking ? 360 : isSpeaking ? 90 : 0 }}
            transition={{ duration: isThinking ? 4 : 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner Gyroscopic Ring 2 */}
          <motion.div
            className="absolute inset-6 rounded-full border border-aura-bronze/35"
            animate={{ rotate: isThinking ? -360 : 0 }}
            transition={{ duration: isThinking ? 6 : 14, repeat: Infinity, ease: 'linear' }}
          />

          {/* Deep Core Light Source */}
          <motion.div
            animate={{
              scale: isThinking ? [0.85, 1.15, 0.85] : [0.95, 1.05, 0.95],
              opacity: isThinking ? [0.6, 1, 0.6] : [0.8, 1, 0.8],
            }}
            transition={{ duration: config.pulseRate, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-full flex items-center justify-center"
            style={{
              width: size * 0.42,
              height: size * 0.42,
              background: isSpeaking
                ? 'radial-gradient(circle, #F4EBE1 0%, #4EBA88 60%, rgba(78, 186, 136, 0.1) 100%)'
                : state === 'failed' || state === 'mic_unavailable'
                ? 'radial-gradient(circle, #E26D77 0%, #96353D 60%, transparent 100%)'
                : 'radial-gradient(circle, #F4EBE1 0%, #C59B6D 60%, rgba(197, 155, 109, 0.1) 100%)',
              filter: 'blur(2px)',
            }}
          />

          {/* Typographic Core Logo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="font-bold tracking-[0.3em] text-[#0A0B0E] font-display select-none drop-shadow-sm"
              style={{ fontSize: size * 0.12 }}
            >
              AURA
            </span>
          </div>
        </motion.button>
      </div>

      {/* Luxury Status Badge Pill */}
      <motion.div
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        className={`px-3 py-1 rounded-full border text-[10px] font-semibold tracking-[0.2em] uppercase bg-[#141519]/90 backdrop-blur-md ${config.badgeColor}`}
      >
        {config.label}
      </motion.div>
    </div>
  )
}

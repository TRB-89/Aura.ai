import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GoldenNeuralWave } from './GoldenNeuralWave'
import {
  Sparkles,
  ArrowRight,
  Play,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Mic,
} from 'lucide-react'

interface HeroSectionProps {
  onLaunch?: () => void
}

const SAMPLE_COMMANDS = [
  { text: 'Open VS Code and prepare project workspace', tag: 'Developer Mode', icon: '⚡' },
  { text: 'Open Microsoft Word and draft project report', tag: 'Office Automation', icon: '📄' },
  { text: 'Open my Downloads folder in Explorer', tag: 'Filesystem', icon: '📁' },
  { text: 'Open Calculator and review telemetry statistics', tag: 'Windows Control', icon: '🧮' },
  { text: 'Open Chrome and navigate to Google', tag: 'Browser', icon: '🌐' },
]

export function HeroSection({ onLaunch }: HeroSectionProps) {
  const [activeCommandIndex, setActiveCommandIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCommandIndex((prev) => (prev + 1) % SAMPLE_COMMANDS.length)
    }, 3800)
    return () => clearInterval(timer)
  }, [])

  const currentCmd = SAMPLE_COMMANDS[activeCommandIndex]

  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-28 pb-16 px-6 overflow-hidden select-none">
      {/* Background radial gradients for warm luxury lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-radial from-aura-bronze/[0.12] via-aura-bronze/[0.03] to-transparent pointer-events-none blur-3xl" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-radial from-aura-beige/[0.08] to-transparent pointer-events-none blur-2xl" />

      {/* Top Pre-title Pill Badge */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-aura-border-bronze bg-[#141519]/80 backdrop-blur-md mb-6 shadow-glow-bronze"
      >
        <span className="w-2 h-2 rounded-full bg-aura-success shadow-[0_0_8px_rgba(78,186,136,0.8)]" />
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-aura-cream font-mono">
          WINDOWS 10 & 11 NATIVE COMPANION
        </span>
        <span className="w-1 h-1 rounded-full bg-aura-border" />
        <span className="text-[11px] text-aura-bronze font-medium">PHASE 1 VERIFIED</span>
      </motion.div>

      {/* Giant Cinematic Headline */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
        className="text-center max-w-4xl mx-auto z-10"
      >
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-aura-cream font-display tracking-tight leading-[1.08] mb-6">
          The Personal AI Companion That{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-aura-beige via-[#F3C77C] to-aura-bronze">
            Operates Your Computer.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-aura-text-muted max-w-2xl mx-auto leading-relaxed font-normal">
          A conversational Windows desktop assistant that listens, understands intent, launches installed apps,
          manages routines, creates Office documents, and completes authorized tasks on your PC.
        </p>
      </motion.div>

      {/* Hero CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="flex flex-wrap items-center justify-center gap-4 mt-8 z-20"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLaunch}
          className="px-8 py-3.5 rounded-full bg-gradient-to-r from-aura-beige via-aura-cream to-aura-beige text-[#0A0B0E] font-bold text-sm font-display shadow-glow-beige hover:shadow-[0_0_35px_rgba(232,213,196,0.45)] transition-all flex items-center gap-2.5"
        >
          <span>Get Started Free</span>
          <ArrowRight size={16} strokeWidth={2.4} />
        </motion.button>

        <a
          href="#meet-aura"
          className="px-7 py-3.5 rounded-full border border-white/[0.12] bg-[#141519]/70 hover:bg-white/[0.06] text-aura-cream text-sm font-semibold transition-all flex items-center gap-2 backdrop-blur-md shadow-sm"
        >
          <Play size={14} className="text-aura-bronze fill-aura-bronze" />
          <span>Watch Demo</span>
        </a>
      </motion.div>

      {/* CENTERPIECE: Glowing Golden Neural Wave Canvas */}
      <div className="relative w-full max-w-6xl my-4 flex items-center justify-center">
        <GoldenNeuralWave height={320} className="my-[-20px]" />

        {/* Floating Holographic Prompt Card hovering over the wave */}
        <motion.div
          key={currentCmd.text}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute z-20 px-6 py-4 rounded-3xl bg-[#141519]/90 border border-white/[0.1] backdrop-blur-xl shadow-luxury max-w-xl w-full mx-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#1C1E26] border border-white/[0.08] flex items-center justify-center text-lg flex-shrink-0 shadow-inner">
            {currentCmd.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-aura-bronze font-mono">
                {currentCmd.tag}
              </span>
              <span className="w-1 h-1 rounded-full bg-aura-success animate-pulse" />
              <span className="text-[9px] text-aura-success font-mono">EXECUTING ON WINDOWS</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-aura-cream font-mono truncate">
              "{currentCmd.text}"
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-aura-beige/10 border border-aura-border-beige flex items-center justify-center flex-shrink-0 text-aura-beige">
            <Mic size={14} />
          </div>
        </motion.div>
      </div>

      {/* Floating Trust Metrics Footer Strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12 mt-4 text-center z-10 max-w-3xl border-t border-white/[0.06] pt-6"
      >
        <div>
          <div className="text-xl sm:text-2xl font-bold font-display text-aura-cream">0ms</div>
          <div className="text-[10px] uppercase tracking-wider text-aura-text-muted mt-0.5">Simulation Free</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-display text-aura-beige">100%</div>
          <div className="text-[10px] uppercase tracking-wider text-aura-text-muted mt-0.5">Native Windows API</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-display text-aura-cream">12</div>
          <div className="text-[10px] uppercase tracking-wider text-aura-text-muted mt-0.5">SQLite Schema Tables</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-display text-aura-bronze">&lt; 20ms</div>
          <div className="text-[10px] uppercase tracking-wider text-aura-text-muted mt-0.5">Kernel Latency</div>
        </div>
      </motion.div>
    </section>
  )
}

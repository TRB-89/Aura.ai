import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Play } from 'lucide-react'

interface StatementSectionProps {
  onLaunch?: () => void
}

export function StatementSection({ onLaunch }: StatementSectionProps) {
  return (
    <section className="relative py-28 px-6 overflow-hidden bg-[#07080A] border-y border-white/[0.06] select-none text-center">
      {/* Background Starfield and Golden Nebular Illumination */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] rounded-full bg-radial from-aura-bronze/[0.14] via-aura-bronze/[0.04] to-transparent pointer-events-none blur-3xl" />
      <div className="absolute top-10 left-10 w-1.5 h-1.5 rounded-full bg-aura-cream opacity-60 animate-ping" />
      <div className="absolute bottom-16 right-20 w-1.5 h-1.5 rounded-full bg-aura-bronze opacity-70 animate-pulse" />
      <div className="absolute top-20 right-1/4 w-1 h-1 rounded-full bg-aura-beige opacity-80" />

      <div className="relative max-w-4xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-aura-border-bronze bg-[#141519]/90 mb-8"
        >
          <Sparkles size={12} className="text-aura-bronze" />
          <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-aura-cream font-mono">
            NEXT-GEN HUMAN-COMPUTER INTERACTION
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-aura-cream font-display tracking-tight leading-[1.08] mb-6"
        >
          Welcome to the era of{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-aura-beige via-aura-cream to-aura-bronze">
            Autonomous Desktop Assistance.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-2xl font-light text-aura-text-muted font-display tracking-wide mb-10"
        >
          AURA doesn’t just respond.{' '}
          <strong className="font-semibold text-aura-beige">It works.</strong>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLaunch}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-aura-beige via-aura-cream to-aura-beige text-[#0A0B0E] font-bold text-sm font-display shadow-glow-beige transition-all flex items-center gap-2"
          >
            <span>Talk to AURA</span>
            <ArrowRight size={15} />
          </motion.button>

          <a
            href="#features"
            className="px-7 py-3.5 rounded-full border border-white/[0.12] bg-[#141519]/80 hover:bg-white/[0.06] text-aura-cream text-sm font-semibold transition-all backdrop-blur-md"
          >
            <span>See How It Works</span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

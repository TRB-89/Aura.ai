import { motion } from 'framer-motion'
import { ArrowRight, Terminal, Sparkles, Download, ShieldCheck } from 'lucide-react'

interface FinalCtaSectionProps {
  onLaunch?: () => void
}

export function FinalCtaSection({ onLaunch }: FinalCtaSectionProps) {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto select-none relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-radial from-aura-bronze/[0.18] to-transparent pointer-events-none blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="luxury-card rounded-[38px] p-10 sm:p-16 text-center relative overflow-hidden border border-white/[0.12] shadow-2xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-aura-border-bronze bg-[#141519] mb-6">
          <Sparkles size={12} className="text-aura-bronze" />
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-aura-cream font-mono">
            READY FOR DEPLOYMENT
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-aura-cream font-display tracking-tight leading-[1.12] mb-6 max-w-3xl mx-auto">
          Build Your AI-Powered Workflow With{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-aura-beige via-aura-cream to-aura-bronze">
            AURA.
          </span>
        </h2>

        <p className="text-sm sm:text-base text-aura-text-muted max-w-xl mx-auto leading-relaxed mb-10">
          Voice-first automation, routine intelligence, and real desktop control — all in one personal companion.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLaunch}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-aura-beige via-aura-cream to-aura-beige text-[#0A0B0E] font-bold text-sm font-display shadow-glow-beige hover:shadow-[0_0_35px_rgba(232,213,196,0.5)] transition-all flex items-center gap-2.5"
          >
            <span>Launch AURA Desktop</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </motion.button>

          <a
            href="#features"
            className="px-7 py-3.5 rounded-full border border-white/[0.12] bg-[#141519]/80 hover:bg-white/[0.06] text-aura-cream text-sm font-semibold transition-all backdrop-blur-md"
          >
            <span>Explore All Capabilities</span>
          </a>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-6 text-xs text-aura-text-dim font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-aura-success" />
            <span>Local Execution Bounded by User Permissions</span>
          </span>
          <span>•</span>
          <span>Windows 10 / 11 64-bit</span>
          <span>•</span>
          <span>Python 3.11+ / Node.js 18+</span>
        </div>
      </motion.div>
    </section>
  )
}

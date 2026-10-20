import { motion } from 'framer-motion'
import { Sparkles, Quote } from 'lucide-react'

export function TestimonialSection() {
  return (
    <section className="py-24 px-6 max-w-5xl mx-auto select-none relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full bg-radial from-aura-bronze/[0.14] via-aura-beige/[0.04] to-transparent pointer-events-none blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="luxury-card rounded-[36px] p-8 sm:p-14 text-center relative overflow-hidden border border-white/[0.1]"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#1B1D23] border border-white/[0.08] flex items-center justify-center mx-auto mb-6 text-aura-bronze shadow-glow-bronze">
          <Quote size={20} />
        </div>

        <blockquote className="text-2xl sm:text-4xl font-extrabold text-aura-cream font-display tracking-tight leading-[1.25] mb-8 max-w-3xl mx-auto">
          “AURA feels less like software and more like a personal AI operator for your computer. It doesn’t just answer questions —{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-aura-beige via-[#F3C77C] to-aura-bronze">
            it executes actions.”
          </span>
        </blockquote>

        <div className="flex flex-col items-center">
          <div className="text-sm font-bold text-aura-cream font-display">ARCHITECTURAL DESIGN PRINCIPLE</div>
          <div className="text-xs text-aura-bronze font-mono mt-0.5">PROJECT AURA Specification §0.1</div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-aura-text-dim font-mono">
            <span>Verified across Windows 10 & 11 Desktop Kernels</span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

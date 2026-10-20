import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, ShieldCheck, Terminal } from 'lucide-react'

interface LandingNavbarProps {
  onOpenApp?: () => void
}

export function LandingNavbar({ onOpenApp }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Automation', href: '#automation' },
    { label: 'Voice Engine', href: '#voice' },
    { label: 'Workspaces', href: '#workspaces' },
    { label: 'Security', href: '#security' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-3 bg-[#0A0B0E]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo Monogram */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#2A2B33] to-[#121317] border border-white/[0.1] flex items-center justify-center shadow-glow-bronze relative transition-transform duration-300 group-hover:scale-105">
            <span className="text-sm font-extrabold text-aura-beige font-display tracking-wider">A</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-aura-success shadow-[0_0_8px_rgba(78,186,136,0.8)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.25em] text-aura-cream font-display group-hover:text-aura-beige transition-colors">
              PROJECT AURA
            </span>
            <span className="text-[9px] tracking-widest text-aura-text-dim uppercase font-mono">
              Windows Desktop AI
            </span>
          </div>
        </a>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#141519]/80 border border-white/[0.06] backdrop-blur-md shadow-inner">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-1 text-xs font-medium text-aura-text-muted hover:text-aura-cream hover:bg-white/[0.04] rounded-full transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          {onOpenApp && (
            <button
              onClick={onOpenApp}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-aura-cream transition-all"
              title="Switch to full desktop assistant dashboard"
            >
              <Terminal size={13} className="text-aura-bronze" />
              <span>Live Assistant</span>
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenApp}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-aura-beige via-aura-cream to-aura-beige text-[#0A0B0E] text-xs font-bold font-display shadow-glow-beige hover:shadow-[0_0_25px_rgba(232,213,196,0.4)] transition-all flex items-center gap-2"
          >
            <span>Launch AURA</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </header>
  )
}

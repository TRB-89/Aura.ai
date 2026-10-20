import { motion } from 'framer-motion'
import {
  FolderOpen,
  Calendar,
  FileText,
  Mic,
  Brain,
  Zap,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'

const CAPABILITIES = [
  {
    icon: FolderOpen,
    title: 'Launch Your Workspace',
    description: 'Spin up Visual Studio Code, open related documentation tabs in Chrome, and align windows in a single voice prompt.',
    tag: 'DEVELOPER AGILITY',
    accent: 'border-aura-beige/30',
  },
  {
    icon: Calendar,
    title: 'Automate Your Routine',
    description: 'Execute scheduled executive briefs, check task deadlines, and verify system status automatically at your preferred hours.',
    tag: 'DAILY CADENCE',
    accent: 'border-aura-bronze/30',
  },
  {
    icon: FileText,
    title: 'Create Files and Presentations',
    description: 'Generate formatted Word documents (.docx), executive slide decks (.pptx), and structured spreadsheets (.xlsx) on demand.',
    tag: 'OFFICE AUTOMATION',
    accent: 'border-aura-beige/30',
  },
  {
    icon: Mic,
    title: 'Speak and Control',
    description: 'Issue hands-free voice commands while typing, coding, or presenting. Continuous listening with zero cloud dependency required.',
    tag: 'VOICE CONTROL',
    accent: 'border-aura-bronze/30',
  },
  {
    icon: Brain,
    title: 'Manage Memory and Tasks',
    description: 'AURA retains personal context, preferred tools, and active project locations in a private offline SQLite WAL database.',
    tag: 'LONG-TERM CONTEXT',
    accent: 'border-aura-beige/30',
  },
  {
    icon: Zap,
    title: 'Work Faster Every Day',
    description: 'Sub-millisecond local app launching, PID-verified execution, and cryptographic sandboxing protect your operating system.',
    tag: 'NATIVE PERFORMANCE',
    accent: 'border-aura-bronze/30',
  },
]

export function CapabilityGrid() {
  return (
    <section id="workspaces" className="py-24 px-6 max-w-7xl mx-auto select-none">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aura-border-bronze bg-[#141519] mb-4">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-aura-bronze font-mono">
            CAPABILITY MATRIX
          </span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-aura-cream font-display tracking-tight leading-[1.15] mb-4">
          Engineered for Users Who Demand{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-aura-beige to-aura-bronze">
            Real Desktop Power.
          </span>
        </h2>
        <p className="text-sm sm:text-base text-aura-text-muted leading-relaxed font-normal">
          Explore the autonomous desktop capabilities that make AURA your personal executive assistant.
        </p>
      </div>

      {/* 6-Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CAPABILITIES.map((cap, i) => {
          const Icon = cap.icon
          return (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -5, borderColor: 'rgba(232, 213, 196, 0.3)' }}
              className="luxury-card rounded-[32px] p-8 flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#1B1D23] border border-white/[0.08] flex items-center justify-center text-aura-beige group-hover:text-aura-cream group-hover:shadow-glow-beige transition-all">
                    <Icon size={20} />
                  </div>
                  <ArrowUpRight size={18} className="text-aura-text-dim group-hover:text-aura-beige transition-colors" />
                </div>

                <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-aura-bronze block mb-2">
                  {cap.tag}
                </span>

                <h3 className="text-xl font-bold text-aura-cream font-display group-hover:text-aura-beige transition-colors mb-3">
                  {cap.title}
                </h3>

                <p className="text-xs text-aura-text-muted leading-relaxed font-normal">
                  {cap.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-aura-text-dim">
                <span>Phase 1 Verified</span>
                <span className="text-aura-success flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-aura-success" />
                  Native Windows
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import {
  Brain,
  Zap,
  Calendar,
  Database,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react'

const PILLARS = [
  {
    icon: Brain,
    title: 'Understanding',
    desc: 'Interprets conversational speech, ambiguous intents, and complex multi-step Windows instructions.',
  },
  {
    icon: Zap,
    title: 'Real Automation',
    desc: 'Launches native Win32/UWP applications, creates Office files, and opens directories with PID validation.',
  },
  {
    icon: Calendar,
    title: 'Productivity',
    desc: 'Executes recurring daily routines, automated morning standups, and deadline alerts directly on your PC.',
  },
  {
    icon: Database,
    title: 'Persistent Memory',
    desc: 'Stores approved user preferences, workspace paths, and personal context in an encrypted local SQLite database.',
  },
  {
    icon: Volume2,
    title: 'Natural Voice',
    desc: 'Zero-simulation speech synthesis (TTS) and Whisper transcription (STT) for fluid hands-free control.',
  },
]

export function ProductIntroSection({ onLaunch }: { onLaunch?: () => void }) {
  return (
    <section id="meet-aura" className="py-24 px-6 max-w-7xl mx-auto relative select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Visual Mockup Showcase Panel */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="lg:col-span-6 relative"
        >
          {/* Ambient Warm Golden Halo Glow */}
          <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-r from-aura-bronze/20 via-aura-beige/10 to-transparent blur-2xl pointer-events-none" />

          {/* Luxury Mockup Card */}
          <div className="relative rounded-[36px] bg-[#121318] border border-white/[0.1] p-6 sm:p-8 shadow-luxury overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/[0.06] mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-[#E06D76]/80" />
                <div className="w-3 h-3 rounded-full bg-[#E09E52]/80" />
                <div className="w-3 h-3 rounded-full bg-[#4EBA88]/80" />
                <span className="text-xs font-mono text-aura-text-dim ml-2">AURA Desktop Companion v0.1</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-aura-success/10 border border-aura-success/20 text-[10px] text-aura-success font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-aura-success" />
                <span>KERNEL READY</span>
              </div>
            </div>

            {/* Simulated Live Interaction Stream */}
            <div className="space-y-4">
              {/* User Voice Instruction */}
              <div className="flex justify-end">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-aura-beige text-[#0A0B0E] font-medium text-xs leading-relaxed shadow-sm">
                  "AURA, open VS Code, create a Word doc on Q3 deliverables, and open my Downloads."
                </div>
              </div>

              {/* AURA Real-Time Execution Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#1C1E26] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-aura-beige flex-shrink-0">
                  A
                </div>
                <div className="flex-1 space-y-2">
                  <div className="p-3.5 rounded-2xl bg-[#1A1C22] border border-white/[0.06] text-xs text-aura-cream leading-relaxed">
                    Executing 3 authorized Windows desktop actions:
                  </div>

                  {/* Action Badges */}
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-[#141519] border border-aura-success/30 flex items-center justify-between text-[11px] font-mono text-aura-cream">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-aura-success" />
                        <span>Code.exe launched (PID: 8404)</span>
                      </div>
                      <span className="text-aura-text-dim text-[10px]">16ms</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#141519] border border-aura-success/30 flex items-center justify-between text-[11px] font-mono text-aura-cream">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-aura-success" />
                        <span>Created Q3_Deliverables.docx in ~/Documents/AURA</span>
                      </div>
                      <span className="text-aura-text-dim text-[10px]">42ms</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#141519] border border-aura-success/30 flex items-center justify-between text-[11px] font-mono text-aura-cream">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-aura-success" />
                        <span>Explorer opened: C:\Users\TRB\Downloads</span>
                      </div>
                      <span className="text-aura-text-dim text-[10px]">12ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Telemetry Footer */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-aura-text-dim">
              <span>Verified Windows Process Tree</span>
              <span className="text-aura-beige font-semibold">100% Truthful Execution</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Narrative & Feature Pillars */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="lg:col-span-6 flex flex-col justify-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aura-border-bronze bg-[#141519] w-fit mb-4">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-aura-bronze font-mono">
              ENGINEERED FOR WINDOWS
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-aura-cream font-display tracking-tight leading-[1.12] mb-5">
            Meet AURA, the AI Companion That Works Like a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-aura-beige to-aura-bronze">
              Real Assistant.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-aura-text-muted leading-relaxed mb-8">
            Unlike web-only chat windows that merely simulate answers, AURA operates directly as a local Windows companion.
            It interacts with your real file system, starts desktop executables, formats professional office documents,
            and preserves your private workflow preferences offline.
          </p>

          {/* Pillars List */}
          <div className="space-y-4 mb-8">
            {PILLARS.map((pillar, i) => {
              const Icon = pillar.icon
              return (
                <div key={pillar.title} className="flex items-start gap-4 group">
                  <div className="w-9 h-9 rounded-xl bg-[#17181E] border border-white/[0.08] flex items-center justify-center text-aura-bronze group-hover:text-aura-beige group-hover:border-aura-border-beige transition-all flex-shrink-0 mt-0.5">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-aura-cream group-hover:text-aura-beige transition-colors font-display">
                      {pillar.title}
                    </h4>
                    <p className="text-xs text-aura-text-muted leading-relaxed mt-0.5">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <button
              onClick={onLaunch}
              className="px-6 py-3 rounded-full bg-aura-beige hover:bg-aura-cream text-[#0A0B0E] text-xs font-bold font-display shadow-glow-beige transition-all flex items-center gap-2"
            >
              <span>Explore AURA Architecture</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

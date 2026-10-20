import { motion } from 'framer-motion'
import {
  Brain,
  Mic,
  Database,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Sliders,
  FileText,
  Code2,
  FolderOpen,
} from 'lucide-react'

interface FeatureShowcaseProps {
  onExplore?: (feature: string) => void
}

export function FeatureShowcase({ onExplore }: FeatureShowcaseProps) {
  const showcases = [
    {
      id: 'understanding',
      badge: 'CONTEXTUAL REASONING',
      title: 'Understands What You Mean',
      subtitle: 'AURA interprets natural spoken and typed commands with deep contextual awareness and automatic disambiguation.',
      bulletList: [
        'Deterministic regex matching for sub-millisecond local app execution',
        'Smart disambiguation (e.g. asking which Microsoft application when ambiguous)',
        'Full Gemini function calling fallback for complex multi-step reasoning',
      ],
      ctaText: 'Explore Intelligence',
      reverse: false,
      renderVisual: () => (
        <div className="p-6 rounded-3xl bg-[#131418] border border-white/[0.08] shadow-luxury flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-mono text-aura-bronze pb-3 border-b border-white/[0.06]">
            <span>INTENT_DISAMBIGUATION_ENGINE</span>
            <span className="text-aura-success">VERIFIED</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#1B1D23] border border-white/[0.06]">
            <span className="text-[10px] text-aura-text-dim block mb-1 uppercase font-mono">Input Command</span>
            <span className="text-sm font-semibold text-aura-cream font-mono">"Open Microsoft"</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-aura-bronze/10 border border-aura-border-bronze flex items-start gap-3">
            <Sparkles size={16} className="text-aura-bronze flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-aura-beige block">Disambiguation Resolved</span>
              <span className="text-xs text-aura-cream/90 mt-0.5 block font-mono">
                "Which Microsoft application would you like to open? Word, Excel, or PowerPoint?"
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {['Word', 'Excel', 'PowerPoint'].map((app) => (
              <div key={app} className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center text-xs font-mono text-aura-cream">
                {app}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'voice',
      badge: 'CONTINUOUS CONVERSATION',
      title: 'Human, Conversational, Responsive',
      subtitle: 'Talk naturally with AURA using voice. Interrupt, continue, and interact like a real personal assistant.',
      bulletList: [
        'Local low-latency Text-to-Speech (TTS) via Windows speech synthesis',
        'Offline speech recognition powered by faster-whisper and audio VAD',
        'Audio-reactive orbital visualizer with real-time feedback states',
      ],
      ctaText: 'See Voice Features',
      reverse: true,
      renderVisual: () => (
        <div className="p-6 rounded-3xl bg-[#131418] border border-white/[0.08] shadow-luxury flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-mono text-aura-bronze pb-3 border-b border-white/[0.06]">
            <span>VOICE_SYNTHESIS_PIPELINE</span>
            <span className="text-aura-success">REAL-TIME</span>
          </div>
          {/* Animated Waveform Display */}
          <div className="p-6 rounded-2xl bg-[#181A20] border border-white/[0.06] flex items-center justify-center gap-1.5 h-32">
            {[40, 70, 30, 85, 100, 50, 90, 60, 95, 45, 80, 65, 35, 75, 40].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.3}%`] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                className="w-1.5 rounded-full bg-gradient-to-t from-aura-bronze to-aura-beige shadow-[0_0_8px_rgba(232,213,196,0.3)]"
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-aura-text-muted px-2">
            <span>Latency: &lt; 85ms</span>
            <span className="text-aura-beige">Sample Rate: 48kHz</span>
          </div>
        </div>
      ),
    },
    {
      id: 'memory',
      badge: 'PERSISTENT CONTEXT',
      title: 'Rapidly Learns Your Workflow',
      subtitle: 'AURA remembers approved preferences, project paths, workspace setups, and recurring tasks to help you move faster.',
      bulletList: [
        'Local SQLite database with WAL mode for rapid concurrent lookups',
        'Full keyword and vector memory search with auto-categorization',
        'Stores developer paths, coding habits, and project milestones',
      ],
      ctaText: 'View Memory System',
      reverse: false,
      renderVisual: () => (
        <div className="p-6 rounded-3xl bg-[#131418] border border-white/[0.08] shadow-luxury flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono text-aura-bronze pb-3 border-b border-white/[0.06]">
            <span>SQLITE_MEMORY_STORE</span>
            <span className="text-aura-beige">12 TABLES</span>
          </div>
          {[
            { cat: 'PREFERENCE', fact: 'Dark luxury theme with concise executive updates' },
            { cat: 'WORKSPACES', fact: 'Primary IDE: C:\\Users\\TRB\\AppData\\...\\Code.exe' },
            { cat: 'STORAGE', fact: 'Default docs: ~/Documents/AURA (Auto-created)' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-[#191B21] border border-white/[0.06] text-left">
              <span className="text-[9px] font-mono font-bold text-aura-bronze uppercase tracking-wider block mb-1">
                {item.cat}
              </span>
              <span className="text-xs font-mono text-aura-cream">{item.fact}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'automation',
      badge: 'LOCAL COMPUTER AUTOMATION',
      title: 'Turns Intent Into Action',
      subtitle: 'Open Word, launch Chrome, start coding workspaces, create files, manage tasks, and automate your desktop safely.',
      bulletList: [
        'PID-validated application launcher with fallback registry scanner',
        'Native python-docx and python-pptx document and slide generation',
        'Safe filesystem management bounded to authorized user roots',
      ],
      ctaText: 'Explore Automation',
      reverse: true,
      renderVisual: () => (
        <div className="p-6 rounded-3xl bg-[#131418] border border-white/[0.08] shadow-luxury flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono text-aura-bronze pb-3 border-b border-white/[0.06]">
            <span>KERNEL_ACTION_DISPATCHER</span>
            <span className="text-aura-success">REAL PROCESSES</span>
          </div>
          {[
            { icon: Code2, title: 'Code.exe', desc: 'Launched via PID tracking (16ms)' },
            { icon: FileText, title: 'python-docx', desc: 'Generated formatted assignment document' },
            { icon: FolderOpen, title: 'Explorer.exe', desc: 'Opened ~/Downloads directory' },
          ].map((action, i) => {
            const Icon = action.icon
            return (
              <div key={i} className="p-3 rounded-2xl bg-[#181A20] border border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-aura-beige">
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold font-mono text-aura-cream">{action.title}</div>
                  <div className="text-[10px] text-aura-text-dim">{action.desc}</div>
                </div>
                <CheckCircle2 size={16} className="text-aura-success flex-shrink-0" />
              </div>
            )
          })}
        </div>
      ),
    },
  ]

  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto space-y-28 select-none">
      {showcases.map((sc) => (
        <div
          key={sc.id}
          className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center ${
            sc.reverse ? 'lg:flex-row-reverse' : ''
          }`}
        >
          {/* Text narrative */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`lg:col-span-6 flex flex-col justify-center ${
              sc.reverse ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aura-border-bronze bg-[#141519] w-fit mb-4">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-aura-bronze font-mono">
                {sc.badge}
              </span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-aura-cream font-display tracking-tight leading-[1.15] mb-4">
              {sc.title}
            </h3>

            <p className="text-sm text-aura-text-muted leading-relaxed mb-6 font-normal">
              {sc.subtitle}
            </p>

            <ul className="space-y-3 mb-8">
              {sc.bulletList.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-aura-cream font-medium">
                  <CheckCircle2 size={15} className="text-aura-beige flex-shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div>
              <button
                onClick={() => onExplore?.(sc.id)}
                className="px-6 py-2.5 rounded-full border border-aura-border-beige hover:border-aura-beige text-xs font-bold text-aura-cream font-display hover:bg-white/[0.04] transition-all flex items-center gap-2"
              >
                <span>{sc.ctaText}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>

          {/* Visual Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`lg:col-span-6 ${sc.reverse ? 'lg:order-1' : 'lg:order-2'}`}
          >
            {sc.renderVisual()}
          </motion.div>
        </div>
      ))}
    </section>
  )
}

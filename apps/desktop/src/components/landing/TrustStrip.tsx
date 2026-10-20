import { motion } from 'framer-motion'
import {
  Code2,
  Globe,
  FileText,
  Presentation,
  FileSpreadsheet,
  FolderOpen,
  Music,
  Github,
  Monitor,
} from 'lucide-react'

const INTEGRATED_TOOLS = [
  { name: 'VS Code', category: 'Developer IDE', icon: Code2, color: 'text-aura-cream' },
  { name: 'Google Chrome', category: 'Web Browser', icon: Globe, color: 'text-aura-beige' },
  { name: 'Microsoft Word', category: 'Document Engine', icon: FileText, color: 'text-aura-cream' },
  { name: 'PowerPoint', category: 'Slide Decks', icon: Presentation, color: 'text-aura-bronze' },
  { name: 'Excel', category: 'Spreadsheets', icon: FileSpreadsheet, color: 'text-aura-beige' },
  { name: 'Windows Explorer', category: 'File System', icon: FolderOpen, color: 'text-aura-cream' },
  { name: 'GitHub', category: 'Version Control', icon: Github, color: 'text-aura-bronze' },
  { name: 'Spotify', category: 'Media Control', icon: Music, color: 'text-aura-beige' },
]

export function TrustStrip() {
  return (
    <section className="py-12 border-y border-white/[0.06] bg-[#0A0B0E]/60 backdrop-blur-md relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-aura-bronze font-mono">
            NATIVE ECOSYSTEM INTEGRATION
          </p>
          <h3 className="text-sm sm:text-base font-semibold text-aura-cream font-display mt-1">
            Orchestrates Your Everyday Windows Workflow & Productivity Stack
          </h3>
        </div>

        {/* Horizontal Grid of Tool Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {INTEGRATED_TOOLS.map((tool, idx) => {
            const Icon = tool.icon
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -4, borderColor: 'rgba(232, 213, 196, 0.25)' }}
                className="p-3.5 rounded-2xl bg-[#131418] border border-white/[0.06] flex flex-col items-center text-center gap-2 transition-all shadow-sm group cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-aura-beige/10 flex items-center justify-center transition-colors">
                  <Icon size={18} className={tool.color} />
                </div>
                <div>
                  <div className="text-xs font-bold text-aura-cream group-hover:text-aura-beige transition-colors">
                    {tool.name}
                  </div>
                  <div className="text-[9px] text-aura-text-dim uppercase font-mono tracking-wider mt-0.5">
                    {tool.category}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { Calendar, CheckSquare, FolderOpen, Brain, Activity, Plug, Settings, Sparkles } from 'lucide-react'

interface LuxuryPlaceholderProps {
  title: string
  subtitle: string
  icon: any
  tag: string
}

function LuxuryPlaceholderPage({ title, subtitle, icon: Icon, tag }: LuxuryPlaceholderProps) {
  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-[#0A0B0E] flex flex-col items-center justify-center select-none relative">
      <div className="ambient-glow-top" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full luxury-card rounded-[32px] p-8 text-center flex flex-col items-center relative z-10"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#1B1D23] border border-white/[0.08] flex items-center justify-center mb-5 text-aura-bronze shadow-glow-bronze">
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-aura-bronze font-mono mb-2">
          {tag}
        </span>
        <h2 className="text-2xl font-bold text-aura-cream font-display mb-2">{title}</h2>
        <p className="text-xs text-aura-text-muted leading-relaxed mb-6">{subtitle}</p>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-aura-beige font-mono">
          <Sparkles size={12} className="text-aura-bronze" />
          <span>Core Foundation Active</span>
        </div>
      </motion.div>
    </div>
  )
}

export const RoutinePage = () => (
  <LuxuryPlaceholderPage
    title="Executive Routine"
    subtitle="Scheduled automated workflows, daily standups, and recurring desktop habits."
    icon={Calendar}
    tag="CADENCE & SCHEDULE"
  />
)

export const TasksPage = () => (
  <LuxuryPlaceholderPage
    title="Task Orchestration"
    subtitle="Multi-step desktop missions, priority queues, and project milestones."
    icon={CheckSquare}
    tag="PRODUCTIVITY KERNEL"
  />
)

export const WorkspacesPage = () => (
  <LuxuryPlaceholderPage
    title="Saved Workspaces"
    subtitle="1-click orchestration of VS Code, browsers, terminals, and documentation."
    icon={FolderOpen}
    tag="ENVIRONMENT MANAGER"
  />
)

export const MemoryPage = () => (
  <LuxuryPlaceholderPage
    title="Personal Memory"
    subtitle="Persistent local SQLite memory storing user preferences, context, and project notes."
    icon={Brain}
    tag="LONG-TERM CONTEXT"
  />
)

export const ActivityPage = () => (
  <LuxuryPlaceholderPage
    title="Telemetry & Audit"
    subtitle="Cryptographic verification logs of executed tools, commands, and durations."
    icon={Activity}
    tag="EXECUTION AUDIT"
  />
)

export const IntegrationsPage = () => (
  <LuxuryPlaceholderPage
    title="External Connectors"
    subtitle="OAuth integrations for Google Workspace, GitHub, Microsoft Graph, and cloud tools."
    icon={Plug}
    tag="SERVICE CONNECTORS"
  />
)

export const SettingsPage = () => (
  <LuxuryPlaceholderPage
    title="System Configuration"
    subtitle="Configure Gemini API credentials, voice sensitivity, and security sandboxes."
    icon={Settings}
    tag="SECURITY & SYSTEM"
  />
)

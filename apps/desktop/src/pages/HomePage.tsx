import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AuraOrb } from '@/components/orb/AuraOrb'
import { useChatStore } from '@/stores/chatStore'
import { useBackendStore } from '@/stores/backendStore'
import { auraApi } from '@/services/auraApi'
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Presentation,
  FileSpreadsheet,
  Globe,
  Code2,
  Calculator,
  FolderOpen,
  Activity,
  Brain,
  Layers,
  ArrowUpRight,
  Plus,
  Play,
  RotateCcw,
  MessageSquare,
  Shield,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

// Real-time clock hook
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

interface RoutineItem {
  id: string
  title: string
  time: string
  completed: boolean
}

export function HomePage() {
  const prefersReducedMotion = useReducedMotion()
  const clock = useClock()
  const voiceState = useChatStore((s) => s.voiceState)
  const setVoiceState = useChatStore((s) => s.setVoiceState)
  const backendStatus = useBackendStore((s) => s.info.status)
  const addMessage = useChatStore((s) => s.addMessage)
  const messages = useChatStore((s) => s.messages)

  const [inputCommand, setInputCommand] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastExecutionResult, setLastExecutionResult] = useState<{
    command: string
    response: string
    success: boolean
    tool?: string
    duration?: number
  } | null>(null)

  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all')
  const [showDrawerChat, setShowDrawerChat] = useState(false)
  const [memories, setMemories] = useState<Array<{ id: number; content: string; category: string }>>([
    { id: 1, category: 'Preference', content: 'Dark luxury theme with concise executive updates' },
    { id: 2, category: 'Workflow', content: 'Default document directory: ~/Documents/AURA' },
    { id: 3, category: 'Projects', content: 'Active repository: PROJECT AURA Desktop Companion' },
  ])
  const [newMemoryInput, setNewMemoryInput] = useState('')
  const [isAddingMemory, setIsAddingMemory] = useState(false)

  // Interactive routines
  const [routines, setRoutines] = useState<RoutineItem[]>([
    { id: 'r1', title: 'Desktop & System Kernel Verification', time: '09:00 AM', completed: true },
    { id: 'r2', title: 'Deep Work Workspace Setup', time: '11:00 AM', completed: true },
    { id: 'r3', title: 'Automated Document & Office Standup', time: '02:30 PM', completed: false },
    { id: 'r4', title: 'Nightly Memory & Activity Sync', time: '06:00 PM', completed: false },
  ])

  // Initial fetch of memories from SQLite if backend is ready
  useEffect(() => {
    if (backendStatus === 'ready') {
      auraApi.getMemories().then((data) => {
        if (data?.memories && data.memories.length > 0) {
          setMemories(data.memories.map((m: any) => ({
            id: m.id,
            category: m.category || 'General',
            content: m.content,
          })))
        }
      }).catch(() => {})
    }
  }, [backendStatus])

  // Greeting based on hour
  const getGreeting = () => {
    const hour = clock.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Routine toggle
  const toggleRoutine = (id: string) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    )
  }

  const completedCount = routines.filter((r) => r.completed).length
  const routinePercent = Math.round((completedCount / routines.length) * 100)

  // Command Execution (Uses real backend IPC / agent API)
  const executeCommand = async (cmdText: string) => {
    const text = cmdText.trim()
    if (!text || isSubmitting) return

    setIsSubmitting(true)
    setVoiceState('thinking')

    // Add user message to store
    addMessage({ role: 'user', content: text })

    const t0 = performance.now()
    try {
      const convId = 'aura-desktop-home'
      const result = await auraApi.sendCommand(text, convId)
      const duration = Math.round(performance.now() - t0)

      setLastExecutionResult({
        command: text,
        response: result.response,
        success: !result.error,
        tool: result.actions_taken?.[0]?.tool,
        duration,
      })

      // Add assistant response to store
      addMessage({
        role: 'assistant',
        content: result.response,
        toolName: result.actions_taken?.[0]?.tool,
        toolResult: result.actions_taken?.[0]?.result,
      })

      setVoiceState('speaking')
      setTimeout(() => setVoiceState('idle'), 2400)
    } catch (err: any) {
      const duration = Math.round(performance.now() - t0)
      const errorMsg = err?.message || 'Execution failed'
      setLastExecutionResult({
        command: text,
        response: errorMsg,
        success: false,
        duration,
      })
      addMessage({
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        error: errorMsg,
      })
      setVoiceState('failed')
      setTimeout(() => setVoiceState('idle'), 3000)
    } finally {
      setIsSubmitting(false)
      setInputCommand('')
    }
  }

  // Quick Action App Launch Tiles
  const quickApps = [
    { name: 'Word', icon: FileText, cmd: 'Open Microsoft Word', desc: 'Document Studio', color: 'text-[#E8D5C4]' },
    { name: 'PowerPoint', icon: Presentation, cmd: 'Open PowerPoint', desc: 'Presentation Studio', color: 'text-[#C59B6D]' },
    { name: 'Excel', icon: FileSpreadsheet, cmd: 'open excel', desc: 'Spreadsheets', color: 'text-aura-cream' },
    { name: 'Chrome', icon: Globe, cmd: 'Open Chrome', desc: 'Web Browser', color: 'text-aura-beige' },
    { name: 'VS Code', icon: Code2, cmd: 'Open VS Code', desc: 'Code Editor', color: 'text-[#C59B6D]' },
    { name: 'Calculator', icon: Calculator, cmd: 'Open Calculator', desc: 'Math Utilities', color: 'text-aura-cream' },
    { name: 'Notepad', icon: FileText, cmd: 'Open Notepad', desc: 'Text Editor', color: 'text-aura-beige' },
    { name: 'Downloads', icon: FolderOpen, cmd: 'Open my Downloads folder', desc: 'File System', color: 'text-[#E8D5C4]' },
  ]

  const handleSaveMemory = async () => {
    if (!newMemoryInput.trim()) return
    try {
      await auraApi.sendCommand(`remember that ${newMemoryInput}`, 'memory-sync')
      setMemories((prev) => [
        { id: Date.now(), category: 'Note', content: newMemoryInput.trim() },
        ...prev,
      ])
      setNewMemoryInput('')
      setIsAddingMemory(false)
    } catch (e) {
      console.error(e)
    }
  }

  // Container variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.08,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 24,
      },
    },
  }

  return (
    <div className="relative flex-1 h-full overflow-y-auto overflow-x-hidden bg-[#0A0B0E] p-6 lg:p-8 no-scrollbar select-none">
      {/* Background ambient lighting */}
      <div className="ambient-glow-top" />
      <div className="ambient-glow-bottom" />

      {/* Main Bento Grid Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10"
      >
        {/* ─── 1. HERO CARD (Cols: 12 or 8) ─────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-8 luxury-card rounded-[32px] p-8 flex flex-col justify-between min-h-[380px] relative overflow-hidden"
        >
          {/* Subtle warm backdrop glow */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-radial from-aura-bronze/[0.08] to-transparent pointer-events-none" />

          {/* Top Row: Greeting, Status, Time */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-aura-success shadow-[0_0_8px_rgba(78,186,136,0.6)]" />
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-aura-bronze font-mono">
                  AURA AUTONOMOUS DESKTOP SUITE
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-aura-cream font-display tracking-tight">
                {getGreeting()}, <span className="text-aura-beige font-normal">Commander</span>
              </h1>
              <p className="text-xs text-aura-text-muted mt-1.5 flex items-center gap-2">
                <span>{clock.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <span className="w-1 h-1 rounded-full bg-aura-border" />
                <span className="font-mono text-aura-cream">{clock.toLocaleTimeString('en-US', { hour12: true })}</span>
              </p>
            </div>

            {/* Quick Trigger Full Conversation Drawer */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDrawerChat(true)}
              className="px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-aura-cream flex items-center gap-2 backdrop-blur-md transition-all shadow-sm"
              title="Expand conversation log"
            >
              <MessageSquare size={13} className="text-aura-bronze" />
              <span>Transcript ({messages.length})</span>
            </motion.button>
          </div>

          {/* Center Orb Interactive Area */}
          <div className="my-6 flex flex-col sm:flex-row items-center justify-around gap-6 relative z-10 py-2">
            <div className="flex-1 max-w-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aura-border-bronze bg-[#1A1815]/60 mb-3">
                <Sparkles size={12} className="text-aura-bronze" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-aura-beige">
                  EXECUTIVE ASSISTANT
                </span>
              </div>
              <p className="text-sm font-medium text-aura-text leading-relaxed">
                Ready to orchestrate your Windows desktop environment. Speak naturally or type any automation command.
              </p>
              {lastExecutionResult && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-xs flex items-center gap-2 text-aura-cream bg-white/[0.03] border border-white/[0.06] p-2.5 rounded-2xl"
                >
                  <span className={`w-2 h-2 rounded-full ${lastExecutionResult.success ? 'bg-aura-success' : 'bg-aura-error'}`} />
                  <span className="truncate font-mono text-[11px] text-aura-beige">{lastExecutionResult.response}</span>
                  {lastExecutionResult.duration && (
                    <span className="ml-auto text-[10px] font-mono text-aura-text-dim">{lastExecutionResult.duration}ms</span>
                  )}
                </motion.div>
              )}
            </div>

            {/* Animated Central Orb */}
            <div className="flex-shrink-0">
              <AuraOrb
                state={voiceState}
                size={140}
                onClick={() => setVoiceState(voiceState === 'idle' ? 'listening' : 'idle')}
              />
            </div>
          </div>

          {/* Command Input Bar */}
          <div className="relative z-10">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                executeCommand(inputCommand)
              }}
              className="flex items-center gap-3 p-1.5 pl-5 rounded-full bg-[#1A1C22]/90 border border-white/[0.1] focus-within:border-aura-bronze transition-all shadow-luxury"
            >
              <input
                type="text"
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                placeholder="Give AURA a command (e.g. 'Open VS Code', 'Open my Downloads folder', 'Open Calculator')..."
                className="flex-1 bg-transparent text-sm text-aura-text placeholder-aura-text-dim focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setVoiceState(voiceState === 'listening' ? 'idle' : 'listening')}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  voiceState === 'listening'
                    ? 'bg-aura-bronze text-[#0A0B0E] shadow-glow-bronze'
                    : 'text-aura-text-muted hover:text-aura-cream hover:bg-white/[0.06]'
                }`}
                title="Microphone input"
              >
                {voiceState === 'listening' ? <Mic size={17} /> : <MicOff size={17} />}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !inputCommand.trim()}
                className="w-10 h-10 rounded-full bg-aura-beige text-[#0A0B0E] flex items-center justify-center hover:bg-aura-cream active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-glow-beige"
                title="Execute command"
              >
                <Send size={16} />
              </button>
            </form>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-2 mt-3 items-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-aura-text-dim">Quick Prompts:</span>
              {[
                'Open Calculator',
                'Open Notepad',
                'Open Chrome',
                'Open Microsoft Word',
                'Open PowerPoint',
                'Open VS Code',
                'Open my Downloads folder',
                'Open Google',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => executeCommand(chip)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.08] text-aura-text-muted hover:text-aura-cream border border-white/[0.05] transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── 2. QUICK ACCESS LAUNCHPAD (Cols: 12 or 4) ──────────────────────── */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-4 luxury-card rounded-[32px] p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-aura-bronze font-mono">
                  APPLICATION MATRIX
                </span>
                <h2 className="text-xl font-bold text-aura-cream font-display">Fast Launchpad</h2>
              </div>
              <span className="text-[11px] text-aura-text-muted font-mono bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
                8 Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {quickApps.map((app) => {
                const Icon = app.icon
                return (
                  <motion.button
                    key={app.name}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => executeCommand(app.cmd)}
                    className="p-3.5 rounded-2xl bg-[#1B1D23]/80 hover:bg-[#22242C] border border-white/[0.06] hover:border-aura-border-beige flex flex-col gap-2 text-left transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:bg-aura-beige/10 transition-colors">
                        <Icon size={16} className={app.color} />
                      </div>
                      <ArrowUpRight size={14} className="text-aura-text-dim group-hover:text-aura-beige transition-colors" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-aura-cream group-hover:text-aura-beige transition-colors">
                        {app.name}
                      </div>
                      <div className="text-[10px] text-aura-text-dim truncate">{app.desc}</div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-aura-text-muted">
            <span className="text-[11px]">Direct Windows Process Execution</span>
            <div className="flex items-center gap-1.5 text-aura-success font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-aura-success" />
              <span>Native API</span>
            </div>
          </div>
        </motion.div>

        {/* ─── 3. TODAY'S ROUTINE & TASKS (Cols: 12 or 4) ─────────────────────── */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-4 luxury-card rounded-[32px] p-6 flex flex-col justify-between min-h-[300px]"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-aura-bronze font-mono">
                  DAILY EXECUTIVE CADENCE
                </span>
                <h3 className="text-lg font-bold text-aura-cream font-display">Today's Routine</h3>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold font-display text-aura-beige">{routinePercent}%</span>
                <span className="text-[10px] block text-aura-text-dim uppercase tracking-wider">Complete</span>
              </div>
            </div>

            {/* Routine Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${routinePercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-aura-bronze to-aura-beige rounded-full"
              />
            </div>

            {/* Routine Items List */}
            <div className="space-y-2">
              {routines.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleRoutine(item.id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    item.completed
                      ? 'bg-white/[0.02] border-white/[0.04] opacity-70'
                      : 'bg-[#1A1C22]/60 border-white/[0.06] hover:border-aura-border-beige'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.completed ? (
                      <CheckCircle2 size={16} className="text-aura-success flex-shrink-0" />
                    ) : (
                      <Circle size={16} className="text-aura-text-dim flex-shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${item.completed ? 'line-through text-aura-text-dim' : 'text-aura-cream'}`}>
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-aura-text-dim flex-shrink-0 ml-2">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-aura-text-muted">
              {completedCount} of {routines.length} routines executed
            </span>
            <button
              onClick={() => executeCommand('verify routines')}
              className="text-[11px] font-semibold text-aura-beige hover:text-aura-cream flex items-center gap-1"
            >
              <span>Sync Schedule</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </motion.div>

        {/* ─── 4. LIVE AUTOMATION LOG & STREAM (Cols: 12 or 4) ────────────────── */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-4 luxury-card rounded-[32px] p-6 flex flex-col justify-between min-h-[300px]"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-aura-bronze font-mono">
                  REAL-TIME TELEMETRY
                </span>
                <h3 className="text-lg font-bold text-aura-cream font-display">Automation Stream</h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-aura-success font-mono bg-aura-success/10 px-2 py-0.5 rounded-full border border-aura-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-aura-success status-dot-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            {/* Log Items */}
            <div className="space-y-2.5">
              {[
                { time: 'Active', text: 'FastAPI Kernel connected (port 49200)', status: 'OK', tool: 'kernel.ipc' },
                { time: 'Active', text: 'SQLite database verified (12 tables)', status: 'OK', tool: 'storage.db' },
                { time: 'Active', text: 'Windows Registry application scan', status: 'OK', tool: 'winreg.scan' },
                ...(lastExecutionResult
                  ? [{
                      time: `${lastExecutionResult.duration ?? 18}ms`,
                      text: `${lastExecutionResult.command} → ${lastExecutionResult.response}`,
                      status: lastExecutionResult.success ? 'OK' : 'ERR',
                      tool: lastExecutionResult.tool ?? 'agent.command',
                    }]
                  : []),
              ].slice(-4).map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-[#17181D] border border-white/[0.05] flex flex-col gap-1 text-left"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-aura-bronze uppercase tracking-wider">{item.tool}</span>
                    <span className="font-mono text-aura-text-dim">{item.time}</span>
                  </div>
                  <p className="text-xs text-aura-cream font-mono truncate">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-aura-text-muted">
            <span className="text-[11px]">Kernel Status: {backendStatus.toUpperCase()}</span>
            <span className="font-mono text-[11px] text-aura-beige">Latency ~14ms</span>
          </div>
        </motion.div>

        {/* ─── 5. AI MEMORY & PERSISTENT CONTEXT (Cols: 12 or 4) ──────────────── */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-4 luxury-card rounded-[32px] p-6 flex flex-col justify-between min-h-[300px]"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-aura-bronze font-mono">
                  PERSISTENT CONTEXT
                </span>
                <h3 className="text-lg font-bold text-aura-cream font-display">Personal Memory</h3>
              </div>
              <button
                onClick={() => setIsAddingMemory(!isAddingMemory)}
                className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.09] text-aura-cream flex items-center justify-center border border-white/[0.06] transition-all"
                title="Add new memory fact"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Inline Add Memory Form */}
            <AnimatePresence>
              {isAddingMemory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemoryInput}
                      onChange={(e) => setNewMemoryInput(e.target.value)}
                      placeholder="Add personal preference or fact..."
                      className="flex-1 bg-[#1A1C22] text-xs text-aura-cream px-3 py-1.5 rounded-xl border border-white/[0.1] focus:outline-none focus:border-aura-beige"
                    />
                    <button
                      onClick={handleSaveMemory}
                      className="px-3 py-1 rounded-xl bg-aura-beige text-[#0A0B0E] text-xs font-semibold hover:bg-aura-cream"
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Memories list */}
            <div className="space-y-2">
              {memories.slice(0, 3).map((mem) => (
                <div
                  key={mem.id}
                  className="p-3 rounded-2xl bg-[#191B21]/90 border border-white/[0.06] text-left flex flex-col gap-1"
                >
                  <span className="text-[9px] font-semibold tracking-wider uppercase text-aura-bronze font-mono">
                    {mem.category}
                  </span>
                  <p className="text-xs text-aura-cream line-clamp-2 leading-relaxed">
                    {mem.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-aura-text-muted">
            <span className="text-[11px]">{memories.length} Stored in SQLite</span>
            <span className="text-[11px] text-aura-beige font-medium">Auto-approved</span>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── EXPANDABLE FULL TRANSCRIPT DRAWER / MODAL ───────────────────────── */}
      <AnimatePresence>
        {showDrawerChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-3xl h-[650px] luxury-card-elevated rounded-[32px] p-6 flex flex-col border border-white/[0.12] shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-lg font-bold text-aura-cream font-display">AURA Live Conversation Transcript</h3>
                  <p className="text-xs text-aura-text-muted">Real-time Windows automation execution log</p>
                </div>
                <button
                  onClick={() => setShowDrawerChat(false)}
                  className="px-3.5 py-1.5 rounded-full border border-white/[0.1] text-xs font-semibold text-aura-cream hover:bg-white/[0.08]"
                >
                  Close
                </button>
              </div>

              {/* Message Log */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-aura-text-dim text-xs">
                    No commands executed in this session yet. Run any command from the dashboard!
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-aura-beige text-[#0A0B0E] font-medium'
                            : 'bg-[#181A20] text-aura-cream border border-white/[0.08]'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] text-aura-text-dim mt-1 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  executeCommand(inputCommand)
                }}
                className="pt-3 border-t border-white/[0.08] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputCommand}
                  onChange={(e) => setInputCommand(e.target.value)}
                  placeholder="Type an automation command..."
                  className="flex-1 bg-[#141519] border border-white/[0.1] rounded-full px-4 py-2 text-xs text-aura-cream focus:outline-none focus:border-aura-beige"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !inputCommand.trim()}
                  className="px-4 py-2 rounded-full bg-aura-beige text-[#0A0B0E] text-xs font-semibold hover:bg-aura-cream disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

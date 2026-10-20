import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Send,
  Lock,
  Settings,
  Brain,
  History,
  Clock,
  Sparkles,
  Camera,
  FolderOpen,
  Globe,
  Code2,
  FileText,
  Presentation,
  FileSpreadsheet,
  Music,
  CheckCircle2,
  XCircle,
  Terminal,
  Volume2,
  VolumeX,
  X,
  Plus,
  Trash2,
  Search,
} from 'lucide-react'
import { AuraLiveVoiceWave, type VoiceState } from '@/components/voice/AuraLiveVoiceWave'
import { auraApi, type CommandResponse } from '@/services/auraApi'
import { useBackendStore } from '@/stores/backendStore'

interface AuraMainDashboardProps {
  onLock: () => void
}

interface MessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  tool?: string
  durationMs?: number
  success?: boolean
  timestamp: string
}

export function AuraMainDashboard({ onLock }: AuraMainDashboardProps) {
  const backendStatus = useBackendStore((s) => s.info.status)
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [inputText, setInputText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentActionText, setCurrentActionText] = useState<string | undefined>()
  const [activeDrawer, setActiveDrawer] = useState<'routines' | 'memory' | 'history' | 'settings' | null>(null)

  // Messages log
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'AURA initialized. Ready to execute commands, open applications, and manage your Windows desktop.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  // Memory list
  const [memories, setMemories] = useState<Array<{ id: number; content: string; category: string }>>([])
  const [newMemoryText, setNewMemoryText] = useState('')
  const [newMemoryCategory, setNewMemoryCategory] = useState('user_preference')

  // History list
  const [historyItems, setHistoryItems] = useState<MessageItem[]>([])

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load memories on ready
  useEffect(() => {
    if (backendStatus === 'ready') {
      auraApi.getMemories().then((data) => {
        if (data?.memories) {
          setMemories(data.memories.map((m: any) => ({
            id: m.id,
            category: m.category || 'General',
            content: m.content,
          })))
        }
      }).catch(() => {})
    }
  }, [backendStatus])

  // Speech Synthesis
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.pitch = 0.95
    utterance.onstart = () => setVoiceState('speaking')
    utterance.onend = () => setVoiceState('idle')
    utterance.onerror = () => setVoiceState('idle')
    window.speechSynthesis.speak(utterance)
  }

  // Speech Recognition (Push-to-talk / toggle)
  const toggleListening = () => {
    if (voiceState === 'listening') {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setVoiceState('idle')
      return
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser environment. You can type commands directly.')
      return
    }

    try {
      const rec = new SpeechRec()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onstart = () => {
        setVoiceState('listening')
      }

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript
        if (transcript) {
          handleExecute(transcript)
        }
      }

      rec.onerror = (e: any) => {
        console.warn('Speech error:', e)
        setVoiceState('idle')
      }

      rec.onend = () => {
        setVoiceState((current) => (current === 'listening' ? 'idle' : current))
      }

      recognitionRef.current = rec
      rec.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setVoiceState('idle')
    }
  }

  // Command Execution Dispatcher
  const handleExecute = async (commandToRun: string) => {
    const text = commandToRun.trim()
    if (!text || isSubmitting) return

    setIsSubmitting(true)
    setVoiceState('thinking')
    setCurrentActionText(`Processing: "${text}"`)

    const userMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')

    const t0 = performance.now()

    try {
      setVoiceState('executing')
      const result: CommandResponse = await auraApi.sendCommand(text, 'aura-main-session')
      const durationMs = Math.round(performance.now() - t0)

      const assistantMsg: MessageItem = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: result.response,
        tool: result.actions_taken?.[0]?.tool,
        durationMs,
        success: !result.error && (result.actions_taken?.length === 0 || result.actions_taken?.[0]?.success !== false),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMsg])
      setHistoryItems((prev) => [assistantMsg, ...prev])
      setCurrentActionText(result.actions_taken?.[0]?.tool ? `Executed: ${result.actions_taken[0].tool}` : undefined)
      setVoiceState('success')

      // Speak response aloud
      speakText(result.response)

      setTimeout(() => {
        setVoiceState('idle')
        setCurrentActionText(undefined)
      }, 2500)
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - t0)
      const errorMsg: MessageItem = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: err?.message || 'Execution error encountered on desktop.',
        durationMs,
        success: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
      setVoiceState('error')
      setCurrentActionText('Action Failed')

      setTimeout(() => {
        setVoiceState('idle')
        setCurrentActionText(undefined)
      }, 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Action Pills
  const quickActions = [
    { label: 'Chrome', icon: Globe, cmd: 'Open Chrome' },
    { label: 'VS Code', icon: Code2, cmd: 'Open VS Code' },
    { label: 'Word', icon: FileText, cmd: 'Open Microsoft Word' },
    { label: 'PowerPoint', icon: Presentation, cmd: 'Open PowerPoint' },
    { label: 'Excel', icon: FileSpreadsheet, cmd: 'Open Excel' },
    { label: 'Spotify', icon: Music, cmd: 'Open Spotify' },
    { label: 'Downloads', icon: FolderOpen, cmd: 'Open my Downloads folder' },
    { label: 'Screenshot', icon: Camera, cmd: 'Take a screenshot' },
    { label: 'Assignment', icon: Search, cmd: 'Search for my assignment' },
  ]

  // Add Memory Handler
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemoryText.trim()) return
    try {
      const res = await auraApi.saveMemory(newMemoryText, newMemoryCategory)
      if (res.success) {
        setMemories((prev) => [
          ...prev,
          { id: res.id || Date.now(), content: newMemoryText, category: newMemoryCategory },
        ])
        setNewMemoryText('')
      }
    } catch (err) {
      console.error('Failed to save memory:', err)
    }
  }

  return (
    <div className="relative flex flex-col h-screen bg-[#07080A] text-[#EDE7DE] select-none overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-radial from-[#C59B6D]/15 via-[#B8860B]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3.5 border-b border-[#C59B6D]/15 bg-[#090B10]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2A231C] to-[#12100E] border border-[#C59B6D]/50 flex items-center justify-center shadow-md shadow-[#C59B6D]/15">
            <span className="font-extrabold text-sm tracking-wider text-[#F3C77C]">A</span>
          </div>
          <div>
            <span className="font-bold text-sm tracking-widest text-[#FFF5E6]">AURA</span>
            <span className="text-[10px] text-[#A0988A] ml-2 tracking-wider uppercase">Personal AI Companion</span>
          </div>
        </div>

        {/* Status Indicator & Drawer Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#12151E] border border-[#C59B6D]/25 text-xs text-[#C59B6D] mr-2">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'ready' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] font-mono tracking-tight">
              {backendStatus === 'ready' ? 'Desktop Kernel Connected' : 'Kernel Initializing...'}
            </span>
          </div>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'routines' ? null : 'routines')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
              activeDrawer === 'routines'
                ? 'bg-[#F3C77C]/15 border-[#F3C77C] text-[#F3C77C]'
                : 'bg-[#12151E]/60 border-[#C59B6D]/20 text-[#A0988A] hover:text-[#EDE7DE] hover:border-[#C59B6D]/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Routines</span>
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'memory' ? null : 'memory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
              activeDrawer === 'memory'
                ? 'bg-[#F3C77C]/15 border-[#F3C77C] text-[#F3C77C]'
                : 'bg-[#12151E]/60 border-[#C59B6D]/20 text-[#A0988A] hover:text-[#EDE7DE] hover:border-[#C59B6D]/40'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory</span>
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'history' ? null : 'history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
              activeDrawer === 'history'
                ? 'bg-[#F3C77C]/15 border-[#F3C77C] text-[#F3C77C]'
                : 'bg-[#12151E]/60 border-[#C59B6D]/20 text-[#A0988A] hover:text-[#EDE7DE] hover:border-[#C59B6D]/40'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'settings' ? null : 'settings')}
            className={`p-1.5 rounded-lg border transition-all ${
              activeDrawer === 'settings'
                ? 'bg-[#F3C77C]/15 border-[#F3C77C] text-[#F3C77C]'
                : 'bg-[#12151E]/60 border-[#C59B6D]/20 text-[#A0988A] hover:text-[#EDE7DE] hover:border-[#C59B6D]/40'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Lock Button */}
          <button
            onClick={onLock}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1F1812]/80 border border-[#C59B6D]/40 text-[#F3C77C] hover:bg-[#F3C77C] hover:text-black transition-all flex items-center gap-1.5 shadow-sm ml-1"
            title="Lock AURA"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Center Area */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col justify-between p-6 overflow-hidden max-w-5xl mx-auto w-full">
          {/* Hero Branding & Central Live Wave */}
          <div className="flex flex-col items-center text-center mt-2">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-extrabold tracking-widest bg-gradient-to-r from-[#FFF5E6] via-[#F3C77C] to-[#C59B6D] bg-clip-text text-transparent"
            >
              AURA
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm md:text-base font-light tracking-widest text-[#C59B6D] mt-1.5 uppercase"
            >
              Your Personal AI Companion
            </motion.p>

            {/* Central Animated Live Wave Interface */}
            <div className="w-full my-2">
              <AuraLiveVoiceWave
                state={voiceState}
                height={260}
                currentAction={currentActionText}
              />
            </div>
          </div>

          {/* Real-Time Conversation Log */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-[140px] max-h-[220px] scrollbar-thin scrollbar-thumb-[#C59B6D]/30 scrollbar-track-transparent">
            {messages.slice(-4).map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs md:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#C59B6D]/20 text-[#FFF5E6] border border-[#C59B6D]/35 rounded-br-none'
                      : 'bg-[#12151E]/80 text-[#EDE7DE] border border-[#C59B6D]/20 rounded-bl-none shadow-md'
                  }`}
                >
                  <p>{m.content}</p>

                  {m.tool && (
                    <div className="mt-2 pt-1.5 border-t border-[#C59B6D]/15 flex items-center gap-2 text-[11px] text-[#A0988A]">
                      {m.success !== false ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="font-mono text-[#F3C77C]">{m.tool}</span>
                      {m.durationMs && <span>({m.durationMs}ms)</span>}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#7A7268] mt-0.5 px-1">{m.timestamp}</span>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Desktop Actions Strip */}
          <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => handleExecute(qa.cmd)}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-xl bg-[#12151E]/70 hover:bg-[#C59B6D]/20 border border-[#C59B6D]/20 hover:border-[#F3C77C]/50 text-xs text-[#EDE7DE] transition-all flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
              >
                <qa.icon className="w-3.5 h-3.5 text-[#F3C77C]" />
                <span>{qa.label}</span>
              </button>
            ))}
          </div>

          {/* Interactive Command Input Strip */}
          <div className="mt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleExecute(inputText)
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Speak or type a command... (e.g., 'Open Chrome', 'Create a Word doc', 'Take a screenshot')"
                disabled={isSubmitting}
                className="w-full px-5 py-3.5 pl-5 pr-28 rounded-2xl bg-[#0F1219]/90 border border-[#C59B6D]/35 text-white placeholder-[#7A7268] text-sm focus:outline-none focus:border-[#F3C77C] focus:ring-1 focus:ring-[#F3C77C] shadow-lg shadow-black/60 transition-all disabled:opacity-50"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                {/* Microphone Activation Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl transition-all ${
                    voiceState === 'listening'
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 animate-pulse'
                      : 'bg-[#1F1812] hover:bg-[#C59B6D]/20 border border-[#C59B6D]/40 text-[#F3C77C]'
                  }`}
                  title={voiceState === 'listening' ? 'Stop Listening' : 'Activate Microphone'}
                >
                  {voiceState === 'listening' ? (
                    <Mic className="w-4 h-4 animate-bounce" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSubmitting}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3C77C] text-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Send Command"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sliding Side Drawers */}
        <AnimatePresence>
          {activeDrawer && (
            <motion.div
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 w-80 md:w-96 bg-[#0B0D13]/95 border-l border-[#C59B6D]/25 backdrop-blur-2xl p-6 flex flex-col z-30 shadow-2xl shadow-black"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#C59B6D]/15 mb-4">
                <div className="flex items-center gap-2">
                  {activeDrawer === 'routines' && <Clock className="w-4 h-4 text-[#F3C77C]" />}
                  {activeDrawer === 'memory' && <Brain className="w-4 h-4 text-[#F3C77C]" />}
                  {activeDrawer === 'history' && <History className="w-4 h-4 text-[#F3C77C]" />}
                  {activeDrawer === 'settings' && <Settings className="w-4 h-4 text-[#F3C77C]" />}
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-[#F3C77C]">
                    {activeDrawer}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="p-1 rounded-lg text-[#8C8275] hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Routines Drawer */}
              {activeDrawer === 'routines' && (
                <div className="flex-1 overflow-y-auto space-y-3">
                  <p className="text-xs text-[#A0988A] leading-relaxed mb-4">
                    Daily automated workflows configured for your Windows desktop.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { title: 'Morning Workspace Initialization', time: '09:00 AM', active: true },
                      { title: 'Deep Work Environment & App Setup', time: '11:00 AM', active: true },
                      { title: 'Weekly Assignment & Report Check', time: '03:00 PM', active: false },
                      { title: 'Nightly Memory & Activity Sync', time: '08:00 PM', active: true },
                    ].map((r, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-[#12151E]/60 border border-[#C59B6D]/20 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-[#EDE7DE]">{r.title}</div>
                          <div className="text-[11px] text-[#A0988A] mt-0.5">{r.time}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            r.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/30 text-zinc-400'
                          }`}
                        >
                          {r.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory Drawer */}
              {activeDrawer === 'memory' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <p className="text-xs text-[#A0988A] mb-3">
                    Personal preferences and context stored in local SQLite database.
                  </p>

                  <form onSubmit={handleAddMemory} className="mb-4 space-y-2">
                    <input
                      type="text"
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      placeholder="Add a new fact or preference..."
                      className="w-full px-3 py-2 rounded-lg bg-[#141720] border border-[#C59B6D]/30 text-xs text-white placeholder-[#686259] focus:outline-none focus:border-[#F3C77C]"
                    />
                    <div className="flex items-center justify-between">
                      <select
                        value={newMemoryCategory}
                        onChange={(e) => setNewMemoryCategory(e.target.value)}
                        className="px-2 py-1.5 rounded bg-[#141720] border border-[#C59B6D]/25 text-[11px] text-[#C59B6D] focus:outline-none"
                      >
                        <option value="user_preference">Preference</option>
                        <option value="workflow">Workflow</option>
                        <option value="project">Project</option>
                        <option value="general">General</option>
                      </select>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-[#F3C77C] text-black font-medium text-xs hover:brightness-105"
                      >
                        Save Memory
                      </button>
                    </div>
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {memories.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-[#12151E]/60 border border-[#C59B6D]/20 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#F3C77C] uppercase tracking-wider font-semibold">
                          <span>{m.category}</span>
                        </div>
                        <p className="text-[#EDE7DE]">{m.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History Drawer */}
              {activeDrawer === 'history' && (
                <div className="flex-1 overflow-y-auto space-y-2">
                  <p className="text-xs text-[#A0988A] mb-3">
                    Recent automation commands and tool execution results.
                  </p>
                  {historyItems.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[#7A7268]">
                      No previous automation history recorded this session.
                    </div>
                  ) : (
                    historyItems.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl bg-[#12151E]/60 border border-[#C59B6D]/20 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#A0988A]">
                          <span className="font-mono text-[#F3C77C]">{h.tool || 'Direct Execution'}</span>
                          <span>{h.timestamp}</span>
                        </div>
                        <p className="text-[#EDE7DE]">{h.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Settings Drawer */}
              {activeDrawer === 'settings' && (
                <div className="flex-1 overflow-y-auto space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-[#C59B6D] uppercase tracking-wider mb-1.5">
                      Backend Kernel Port
                    </label>
                    <div className="px-3 py-2 rounded-lg bg-[#141720] border border-[#C59B6D]/25 font-mono text-[#EDE7DE]">
                      49200 (Auto-managed localhost)
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#C59B6D] uppercase tracking-wider mb-1.5">
                      Storage Location
                    </label>
                    <div className="px-3 py-2 rounded-lg bg-[#141720] border border-[#C59B6D]/25 font-mono text-[11px] text-[#EDE7DE] break-all">
                      %LOCALAPPDATA%\AURA
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#C59B6D] uppercase tracking-wider mb-1.5">
                      Auto-Lock Inactivity
                    </label>
                    <select className="w-full px-3 py-2 rounded-lg bg-[#141720] border border-[#C59B6D]/25 text-white focus:outline-none">
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-[#C59B6D]/15">
                    <button
                      onClick={onLock}
                      className="w-full py-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 font-medium hover:bg-red-900/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock AURA Immediately</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff, StopCircle, ChevronDown, Sparkles } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useBackendStore } from '@/stores/backendStore'
import { auraApi } from '@/services/auraApi'
import type { Message } from '@/types/aura'

const CONVERSATION_ID = `conv-${Date.now()}`

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const isSystem = msg.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] text-aura-text-muted bg-[#141519] px-3 py-1 rounded-full border border-white/[0.06] font-mono">
          {msg.content}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2A2B33] to-[#141519] border border-white/[0.1] flex-shrink-0 flex items-center justify-center mr-2 mt-1">
          <span className="text-[8px] font-bold text-aura-beige font-display">A</span>
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
          isUser
            ? 'bg-aura-beige text-[#0A0B0E] font-medium rounded-tr-sm'
            : 'bg-[#181A20] text-aura-cream border border-white/[0.08] rounded-tl-sm'
        }`}
      >
        {msg.content || (msg.isStreaming ? '...' : '')}
        {msg.isStreaming && (
          <span className="inline-block ml-1 w-1.5 h-3 bg-aura-bronze/70 animate-pulse rounded-sm" />
        )}
        {msg.error && (
          <p className="mt-1 text-xs text-aura-error">{msg.error}</p>
        )}
        {msg.toolName && (
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <span className="text-[10px] text-aura-bronze font-mono uppercase tracking-wider">
              ⚡ {msg.toolName}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ChatPanel() {
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)

  const { messages, addMessage, updateMessage, voiceState, liveTranscript } = useChatStore()
  const isReady = useBackendStore((s) => s.isReady())

  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    else setShowScrollDown(true)
  }, [messages])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollDown(false)
  }

  const sendCommand = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return
    setInputText('')
    setIsSending(true)

    // Add user message
    addMessage({ role: 'user', content: text })

    // Optimistic assistant message
    const assistantId = addMessage({ role: 'assistant', content: '', isStreaming: true })

    try {
      if (!isReady) throw new Error('Backend is not connected yet. Please wait...')

      useChatStore.getState().setVoiceState('thinking')
      const result = await auraApi.sendCommand(text, CONVERSATION_ID)

      updateMessage(assistantId, {
        content: result.response,
        isStreaming: false,
        toolName: result.actions_taken?.[0]?.tool,
        toolResult: result.actions_taken?.[0]?.result,
      })

      useChatStore.getState().setVoiceState('speaking')
      setTimeout(() => {
        useChatStore.getState().setVoiceState('idle')
      }, 2000)
    } catch (err: any) {
      updateMessage(assistantId, {
        content: `Error: ${err.message || 'Action failed'}`,
        error: err.message,
        isStreaming: false,
      })
      useChatStore.getState().setVoiceState('failed')
      setTimeout(() => {
        useChatStore.getState().setVoiceState('idle')
      }, 3000)
    } finally {
      setIsSending(false)
    }
  }, [isSending, isReady, addMessage, updateMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendCommand(inputText)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#101115] border-l border-white/[0.06] select-none relative">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0 bg-[#0E0F13]/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-aura-bronze" />
          <span className="text-xs font-bold text-aura-cream font-display uppercase tracking-wider">
            Assistant Terminal
          </span>
        </div>
        <span className="text-[10px] text-aura-text-dim font-mono">
          {messages.length} logs
        </span>
      </div>

      {/* Live transcript banner */}
      <AnimatePresence>
        {liveTranscript && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-aura-bronze/10 border-b border-aura-border-bronze flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-aura-bronze status-dot-pulse flex-shrink-0" />
            <span className="text-xs text-aura-beige font-mono truncate">{liveTranscript}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 no-scrollbar"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 text-aura-text-dim">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
              <Sparkles size={16} className="text-aura-bronze" />
            </div>
            <p className="text-xs font-medium text-aura-cream mb-1">AURA Companion Ready</p>
            <p className="text-[11px] text-aura-text-dim max-w-xs leading-relaxed">
              Issue desktop commands, launch applications, or orchestrate Office workflows.
            </p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} msg={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll down pill */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-20 right-4 w-7 h-7 rounded-full bg-[#1C1E26] border border-white/[0.1] text-aura-cream flex items-center justify-center shadow-lg hover:bg-white/[0.08]"
          >
            <ChevronDown size={14} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] flex-shrink-0 bg-[#0E0F13]/80">
        <div className="flex items-center gap-2.5 bg-[#17181E] border border-white/[0.08] rounded-full px-4 py-2 transition-all focus-within:border-aura-bronze">
          <div className="flex-shrink-0">
            {voiceState === 'listening' ? (
              <Mic size={15} className="text-aura-bronze status-dot-pulse" />
            ) : voiceState === 'mic_unavailable' ? (
              <MicOff size={15} className="text-aura-error" />
            ) : (
              <Mic size={15} className="text-aura-text-dim" />
            )}
          </div>

          <input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !isReady ? 'Connecting to kernel...' :
              voiceState === 'listening' ? 'Listening...' :
              voiceState === 'thinking' ? 'Thinking...' :
              voiceState === 'executing' ? 'Executing...' :
              'Ask AURA anything... (Enter to send)'
            }
            disabled={isSending || !isReady}
            className="flex-1 bg-transparent text-xs text-aura-cream placeholder:text-aura-text-dim focus:outline-none disabled:opacity-50"
            aria-label="Command input"
            id="aura-command-input"
            autoComplete="off"
          />

          {isSending ? (
            <button
              onClick={() => {}}
              className="flex-shrink-0 text-aura-error hover:text-aura-error/80 transition-colors"
              aria-label="Cancel"
            >
              <StopCircle size={15} />
            </button>
          ) : (
            <button
              onClick={() => sendCommand(inputText)}
              disabled={!inputText.trim() || !isReady}
              className="flex-shrink-0 text-aura-beige hover:text-aura-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Send command"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

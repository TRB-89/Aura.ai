import { create } from 'zustand'
import type { Message, AgentTask, VoiceState } from '@/types/aura'

let msgIdCounter = 0
const newId = () => `msg-${Date.now()}-${++msgIdCounter}`

interface ChatStore {
  messages: Message[]
  currentTask: AgentTask | null
  voiceState: VoiceState
  liveTranscript: string
  isEmergencyStopped: boolean

  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, patch: Partial<Message>) => void
  appendAssistantText: (id: string, text: string) => void
  clearMessages: () => void

  setVoiceState: (s: VoiceState) => void
  setLiveTranscript: (t: string) => void
  setCurrentTask: (task: AgentTask | null) => void
  updateCurrentTask: (patch: Partial<AgentTask>) => void
  setEmergencyStopped: (v: boolean) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  currentTask: null,
  voiceState: 'idle',
  liveTranscript: '',
  isEmergencyStopped: false,

  addMessage: (msg) => {
    const id = newId()
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id, timestamp: Date.now() },
      ],
    }))
    return id
  },

  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  appendAssistantText: (id, text) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  setVoiceState: (voiceState) => set({ voiceState }),
  setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
  setCurrentTask: (task) => set({ currentTask: task }),
  updateCurrentTask: (patch) =>
    set((s) => ({
      currentTask: s.currentTask ? { ...s.currentTask, ...patch } : null,
    })),
  setEmergencyStopped: (v) => set({ isEmergencyStopped: v }),
}))

import { ChatPanel } from '@/components/chat/ChatPanel'
import { useChatStore } from '@/stores/chatStore'
import { AuraOrb } from '@/components/orb/AuraOrb'
import { motion, AnimatePresence } from 'framer-motion'

function TaskProgress() {
  const { currentTask } = useChatStore()
  if (!currentTask) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-4 mb-2 p-3.5 rounded-2xl luxury-card border border-white/[0.08]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-aura-bronze uppercase tracking-[0.2em] font-mono">
          ACTIVE AUTOMATION TASK
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
          currentTask.status === 'running' ? 'bg-aura-bronze/20 text-aura-beige' :
          currentTask.status === 'completed' ? 'bg-aura-success/20 text-aura-success' :
          currentTask.status === 'failed' ? 'bg-aura-error/20 text-aura-error' :
          'bg-white/[0.05] text-aura-text-muted'
        }`}>
          {currentTask.status}
        </span>
      </div>
      <p className="text-xs text-aura-cream truncate font-medium">{currentTask.userRequest}</p>
      {currentTask.steps.length > 0 && (
        <div className="mt-2.5 flex gap-1">
          {currentTask.steps.map((step, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                step.success ? 'bg-aura-success' : 'bg-aura-error'
              }`}
              title={step.tool}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export function AssistantPage() {
  const { voiceState, setVoiceState } = useChatStore()

  return (
    <div className="flex h-full overflow-hidden bg-[#0A0B0E] select-none">
      {/* Orb left column */}
      <div className="flex flex-col items-center justify-center w-[260px] flex-shrink-0 border-r border-white/[0.06] bg-[#0E0F13] gap-6 p-6">
        <AuraOrb
          state={voiceState}
          size={140}
          onClick={() => setVoiceState(voiceState === 'idle' ? 'listening' : 'idle')}
        />

        <div className="text-center">
          <p className="text-xs text-aura-text-muted">
            Press <kbd className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-[10px] font-mono text-aura-cream">Ctrl+Shift+Space</kbd>
          </p>
          <p className="text-[10px] text-aura-text-dim mt-1.5 uppercase tracking-wider">Voice Activation</p>
        </div>
      </div>

      {/* Chat full height column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence>
          <TaskProgress />
        </AnimatePresence>
        <div className="flex-1 overflow-hidden">
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}

import { Minus, Square, X, ShieldCheck } from 'lucide-react'

interface TitleBarProps {
  backendStatus: string
  onSwitchToLanding?: () => void
}

export function TitleBar({ backendStatus, onSwitchToLanding }: TitleBarProps) {
  const isReady = backendStatus === 'ready'
  const isStarting = backendStatus === 'starting'

  const statusColor = isReady
    ? 'bg-aura-success shadow-[0_0_8px_rgba(78,186,136,0.6)]'
    : isStarting
    ? 'bg-aura-warning status-dot-pulse'
    : 'bg-aura-error shadow-[0_0_8px_rgba(226,109,119,0.5)]'

  const statusLabel = isReady ? 'SYSTEM SECURE & CONNECTED' : isStarting ? 'CONNECTING KERNEL...' : 'DISCONNECTED'

  const handleMinimize = () => window.auraAPI?.window.minimize()
  const handleMaximize = () => window.auraAPI?.window.maximize()
  const handleHide = () => window.auraAPI?.window.hide()

  return (
    <header
      className="drag-region flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#0A0B0E] flex-shrink-0 select-none z-40"
    >
      {/* Left: App identity & luxury wordmark */}
      <div className="flex items-center gap-3 no-drag">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#22242C] to-[#141519] border border-white/[0.1] flex items-center justify-center">
          <span className="text-[9px] font-bold text-aura-beige font-display">A</span>
        </div>
        <span className="text-xs font-semibold text-aura-cream font-display tracking-[0.25em]">
          PROJECT AURA
        </span>
        <span className="text-[10px] text-aura-text-dim px-2 py-0.5 rounded-full border border-white/[0.05] bg-white/[0.02]">
          v0.1.0
        </span>
      </div>

      {/* Center: Real Windows Backend connection status badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-[#141519]/70 no-drag backdrop-blur-sm">
        <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} aria-hidden />
        <span className="text-[9px] font-semibold text-aura-text-muted tracking-[0.15em] uppercase font-mono">
          {statusLabel}
        </span>
      </div>

      {/* Right: Window control buttons */}
      <div className="flex items-center gap-1.5 no-drag">
        <button
          onClick={handleMinimize}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-aura-text-muted hover:text-aura-cream hover:bg-white/[0.06] transition-all"
          aria-label="Minimize"
        >
          <Minus size={13} strokeWidth={2} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-aura-text-muted hover:text-aura-cream hover:bg-white/[0.06] transition-all"
          aria-label="Maximize"
        >
          <Square size={11} strokeWidth={2} />
        </button>
        <button
          onClick={handleHide}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-aura-text-muted hover:text-white hover:bg-aura-error/80 transition-all"
          aria-label="Hide to tray"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}

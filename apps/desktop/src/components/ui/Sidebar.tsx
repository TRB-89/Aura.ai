import { motion } from 'framer-motion'
import {
  Home,
  MessageSquare,
  Calendar,
  CheckSquare,
  FolderOpen,
  Brain,
  Activity,
  Plug,
  Settings,
  AlertOctagon,
} from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'assistant', label: 'Assistant', icon: MessageSquare },
  { id: 'routine', label: 'Routine', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'workspaces', label: 'Workspaces', icon: FolderOpen },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'integrations', label: 'Connectors', icon: Plug },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export type PageId = typeof NAV_ITEMS[number]['id']

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { currentTask, isEmergencyStopped } = useChatStore()
  const hasActiveTask = currentTask?.status === 'running' || currentTask?.status === 'planning'

  const handleEmergencyStop = async () => {
    await window.auraAPI?.aura.emergencyStop()
    useChatStore.getState().setEmergencyStopped(true)
  }

  return (
    <aside
      className="flex flex-col items-center w-[76px] py-4 flex-shrink-0 border-r border-white/[0.06] bg-[#0E0F13] select-none z-30"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Top Logo / Monogram */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#1E2027] to-[#121317] border border-white/[0.08] flex items-center justify-center shadow-lg relative group cursor-pointer"
             title="AURA Desktop Assistant">
          <span className="text-sm font-extrabold text-aura-beige font-display tracking-wider">A</span>
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-aura-success border-2 border-[#0E0F13]" />
        </div>
      </div>

      {/* Nav Circular Buttons */}
      <nav className="flex-1 flex flex-col items-center gap-2.5 overflow-y-auto overflow-x-hidden no-scrollbar w-full px-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id
          return (
            <div key={id} className="relative flex items-center justify-center group">
              <button
                onClick={() => onNavigate(id)}
                aria-label={label}
                title={label}
                className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isActive
                    ? 'bg-aura-beige text-[#0A0B0E] shadow-glow-beige'
                    : 'text-aura-text-muted hover:text-aura-cream hover:bg-white/[0.05]'
                  }
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />

                {/* Task active pulse indicator */}
                {id === 'assistant' && hasActiveTask && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-aura-bronze status-dot-pulse border border-[#0E0F13]" />
                )}
              </button>

              {/* Hover Luxury Tooltip */}
              <div className="absolute left-[70px] px-3 py-1.5 rounded-xl bg-[#1B1D23] border border-white/[0.09] text-xs font-medium text-aura-cream whitespace-nowrap shadow-luxury pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50">
                {label}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom Emergency Stop Button */}
      <div className="mt-auto pt-3 flex flex-col items-center">
        <button
          onClick={handleEmergencyStop}
          disabled={isEmergencyStopped}
          className={`
            w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200
            ${isEmergencyStopped
              ? 'bg-aura-error/20 text-aura-error/40 cursor-not-allowed border border-aura-error/30'
              : 'text-aura-error/80 hover:text-white hover:bg-aura-error hover:shadow-lg active:scale-90 border border-aura-error/30'
            }
          `}
          aria-label="Emergency Stop"
          title="Emergency Stop — Cancel all active tasks (Ctrl+Alt+S)"
        >
          <AlertOctagon size={18} />
        </button>
      </div>
    </aside>
  )
}

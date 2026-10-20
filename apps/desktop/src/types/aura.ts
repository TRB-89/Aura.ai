// ─── AURA Domain Types ─────────────────────────────────────────────────────────

export type VoiceState =
  | 'idle'
  | 'wake_detected'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'executing'
  | 'speaking'
  | 'follow_up'
  | 'interrupted'
  | 'canceled'
  | 'failed'
  | 'mic_unavailable'
  | 'network_unavailable'

export type BackendStatus = 'starting' | 'ready' | 'error' | 'stopped'

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  toolName?: string
  toolResult?: unknown
  isStreaming?: boolean
  error?: string
}

export interface ActionResult {
  tool: string
  success: boolean
  result?: unknown
  error?: string
  duration?: number
}

export interface AgentTask {
  id: string
  userRequest: string
  intent?: string
  steps: ActionResult[]
  status: 'planning' | 'running' | 'completed' | 'failed' | 'canceled'
  startedAt: number
  completedAt?: number
  summary?: string
}

export interface ScheduledTask {
  id: string
  title: string
  description?: string
  dueAt?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'canceled'
  projectId?: string
}

export interface Reminder {
  id: string
  content: string
  scheduledAt: string
  recurrence?: string
  enabled: boolean
}

export interface Memory {
  id: string
  category: string
  content: string
  source: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface AppInfo {
  name: string
  canonicalId: string
  launchTarget: string
  aliases: string[]
  available: boolean
}

export interface Workspace {
  id: string
  name: string
  projectPath?: string
  editor?: string
  browser?: string
  configuredResources: string[]
}

import { useBackendStore } from '@/stores/backendStore'

// ─── AURA Backend API Client ───────────────────────────────────────────────────
// All API calls go through this service. Never use fetch directly in components.

export interface CommandResponse {
  message_id: string
  response: string
  actions_taken: ActionTaken[]
  task_id?: string
  error?: string
}

export interface ActionTaken {
  tool: string
  success: boolean
  result?: unknown
  error?: string
  duration_ms?: number
}

export interface HealthResponse {
  status: string
  version: string
  backend_ready: boolean
}

export interface StreamChunk {
  type: 'text' | 'action' | 'error' | 'done'
  content?: string
  action?: ActionTaken
  error?: string
}

class AuraApiService {
  private getBase(): string {
    const url = useBackendStore.getState().getBaseUrl()
    if (!url) throw new Error('Backend not connected')
    return url
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...useBackendStore.getState().getAuthHeader(),
    }
  }

  async health(): Promise<HealthResponse> {
    const res = await fetch(`${this.getBase()}/health`, {
      headers: this.getHeaders(),
    })
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
    return res.json()
  }

  async sendCommand(
    text: string,
    conversationId: string,
    options?: { stream?: boolean }
  ): Promise<CommandResponse> {
    const res = await fetch(`${this.getBase()}/agent/command`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        text,
        conversation_id: conversationId,
        stream: options?.stream ?? false,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Command failed (${res.status}): ${err}`)
    }
    return res.json()
  }

  async cancelTask(taskId: string): Promise<void> {
    await fetch(`${this.getBase()}/agent/cancel/${taskId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    })
  }

  async cancelAll(): Promise<void> {
    await fetch(`${this.getBase()}/agent/cancel-all`, {
      method: 'POST',
      headers: this.getHeaders(),
    })
  }

  async getApps(): Promise<{ apps: import('@/types/aura').AppInfo[] }> {
    const res = await fetch(`${this.getBase()}/apps`, {
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async getTasks(): Promise<{ tasks: import('@/types/aura').ScheduledTask[] }> {
    const res = await fetch(`${this.getBase()}/tasks`, {
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async getMemories(): Promise<{ memories: import('@/types/aura').Memory[] }> {
    const res = await fetch(`${this.getBase()}/memory`, {
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async saveMemory(content: string, category = 'user_preference'): Promise<{ success: boolean; id?: number; error?: string }> {
    const res = await fetch(`${this.getBase()}/memory`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content, category }),
    })
    return res.json()
  }

  async getAuthStatus(): Promise<{
    is_setup: boolean
    is_locked: boolean
    failed_attempts: number
    lockout_remaining_seconds: number
    attempts_remaining: number
  }> {
    const res = await fetch(`${this.getBase()}/auth/status`, {
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async setupPassword(password: string, confirmPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`${this.getBase()}/auth/setup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ password, confirm_password: confirmPassword }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to set password' }))
      throw new Error(err.detail || 'Failed to set password')
    }
    return res.json()
  }

  async unlock(password: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`${this.getBase()}/auth/unlock`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid password' }))
      throw new Error(err.detail || 'Invalid password')
    }
    return res.json()
  }

  async lock(): Promise<{ success: boolean; is_locked: boolean }> {
    const res = await fetch(`${this.getBase()}/auth/lock`, {
      method: 'POST',
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async authHeartbeat(): Promise<void> {
    try {
      await fetch(`${this.getBase()}/auth/heartbeat`, {
        method: 'POST',
        headers: this.getHeaders(),
      })
    } catch {}
  }
}

export const auraApi = new AuraApiService()

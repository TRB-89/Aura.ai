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
    if (!url) throw new Error('Unable to connect to AURA backend')
    return url
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...useBackendStore.getState().getAuthHeader(),
    }
  }

  private handleNetworkError(err: unknown): never {
    const msg = err instanceof Error ? err.message : String(err || '')
    if (
      err instanceof TypeError ||
      msg.includes('Failed to fetch') ||
      msg.includes('fetch failed') ||
      msg.includes('NetworkError') ||
      msg.includes('Network request failed') ||
      msg.includes('Backend not connected') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('Unable to connect')
    ) {
      throw new Error('Unable to connect to AURA backend')
    }
    throw err
  }

  async health(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${this.getBase()}/health`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async sendCommand(
    text: string,
    conversationId: string,
    options?: { stream?: boolean }
  ): Promise<CommandResponse> {
    try {
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
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    try {
      await fetch(`${this.getBase()}/agent/cancel/${taskId}`, {
        method: 'POST',
        headers: this.getHeaders(),
      })
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async cancelAll(): Promise<void> {
    try {
      await fetch(`${this.getBase()}/agent/cancel-all`, {
        method: 'POST',
        headers: this.getHeaders(),
      })
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async getApps(): Promise<{ apps: import('@/types/aura').AppInfo[] }> {
    try {
      const res = await fetch(`${this.getBase()}/apps`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`Failed to fetch apps: ${res.status}`)
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async getTasks(): Promise<{ tasks: import('@/types/aura').ScheduledTask[] }> {
    try {
      const res = await fetch(`${this.getBase()}/tasks`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`)
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async getMemories(): Promise<{ memories: import('@/types/aura').Memory[] }> {
    try {
      const res = await fetch(`${this.getBase()}/memory`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`Failed to fetch memories: ${res.status}`)
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async saveMemory(content: string, category = 'user_preference'): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const res = await fetch(`${this.getBase()}/memory`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ content, category }),
      })
      if (!res.ok) throw new Error(`Failed to save memory: ${res.status}`)
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async getAuthStatus(): Promise<{
    is_setup: boolean
    is_locked: boolean
    failed_attempts: number
    lockout_remaining_seconds: number
    attempts_remaining: number
  }> {
    try {
      const res = await fetch(`${this.getBase()}/auth/status`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`Auth status failed (${res.status})`)
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async setupPassword(password: string, confirmPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${this.getBase()}/auth/setup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ password, confirm_password: confirmPassword }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to set password' }))
        throw new Error(err.detail || 'Failed to set password')
      }
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async unlock(password: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${this.getBase()}/auth/unlock`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Invalid password' }))
        throw new Error(err.detail || 'Invalid password')
      }
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
  }

  async lock(): Promise<{ success: boolean; is_locked: boolean }> {
    try {
      const res = await fetch(`${this.getBase()}/auth/lock`, {
        method: 'POST',
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error('Lock request failed')
      return await res.json()
    } catch (err) {
      this.handleNetworkError(err)
    }
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

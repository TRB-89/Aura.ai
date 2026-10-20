import { create } from 'zustand'
import type { BackendStatus } from '@/types/aura'

interface BackendInfo {
  port: number | null
  token: string | null
  status: BackendStatus
  error?: string
}

interface BackendStore {
  info: BackendInfo
  setInfo: (info: Partial<BackendInfo>) => void
  isReady: () => boolean
  getBaseUrl: () => string | null
  getAuthHeader: () => Record<string, string>
}

export const useBackendStore = create<BackendStore>((set, get) => ({
  info: {
    port: 49200,
    token: 'dev-insecure-token',
    status: 'starting',
  },
  setInfo: (partial) =>
    set((s) => ({ info: { ...s.info, ...partial } })),
  isReady: () => get().info.status === 'ready' && get().info.port !== null,
  getBaseUrl: () => {
    const { port } = get().info
    return port ? `http://127.0.0.1:${port}` : 'http://127.0.0.1:49200'
  },
  getAuthHeader: () => {
    const { token } = get().info
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  },
}))

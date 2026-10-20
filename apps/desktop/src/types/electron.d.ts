// Global type augmentation for the Electron preload API
import type { BackendStatus } from './aura'

export interface BackendInfo {
  port: number | null
  token: string | null
  status: BackendStatus
}

export interface AuraElectronAPI {
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    hide: () => Promise<void>
    quit: () => Promise<void>
  }
  backend: {
    info: () => Promise<BackendInfo>
    status: () => Promise<BackendStatus>
    onStatusChange: (cb: (status: { status: BackendStatus; port: number | null; error?: string }) => void) => () => void
  }
  aura: {
    onActivateVoice: (cb: () => void) => () => void
    onEmergencyStop: (cb: () => void) => () => void
    emergencyStop: () => Promise<void>
  }
  shell: {
    openExternal: (url: string) => Promise<void>
  }
}

declare global {
  interface Window {
    auraAPI: AuraElectronAPI
  }
}

export {}

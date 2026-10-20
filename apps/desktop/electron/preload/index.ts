import { contextBridge, ipcRenderer } from 'electron'

// ─── Typed API Surface ────────────────────────────────────────────────────────
// This is the ONLY way the renderer can communicate with the main process.
// No Node.js APIs are exposed directly.

export type BackendStatus = 'starting' | 'ready' | 'error' | 'stopped'

export interface BackendInfo {
  port: number | null
  token: string | null
  status: BackendStatus
}

export interface AuraElectronAPI {
  // Window controls
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    hide: () => Promise<void>
    quit: () => Promise<void>
  }
  // Backend communication
  backend: {
    info: () => Promise<BackendInfo>
    status: () => Promise<BackendStatus>
    onStatusChange: (cb: (status: { status: BackendStatus; port: number | null; error?: string }) => void) => () => void
  }
  // AURA events from main
  aura: {
    onActivateVoice: (cb: () => void) => () => void
    onEmergencyStop: (cb: () => void) => () => void
    emergencyStop: () => Promise<void>
  }
  // Shell
  shell: {
    openExternal: (url: string) => Promise<void>
  }
}

// ─── Implementation ───────────────────────────────────────────────────────────

const api: AuraElectronAPI = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    hide: () => ipcRenderer.invoke('window:hide'),
    quit: () => ipcRenderer.invoke('window:quit'),
  },
  backend: {
    info: () => ipcRenderer.invoke('backend:info'),
    status: () => ipcRenderer.invoke('backend:status'),
    onStatusChange: (cb) => {
      const listener = (_: Electron.IpcRendererEvent, data: { status: BackendStatus; port: number | null; error?: string }) => cb(data)
      ipcRenderer.on('backend:status', listener)
      return () => ipcRenderer.removeListener('backend:status', listener)
    },
  },
  aura: {
    onActivateVoice: (cb) => {
      const listener = () => cb()
      ipcRenderer.on('aura:activate-voice', listener)
      return () => ipcRenderer.removeListener('aura:activate-voice', listener)
    },
    onEmergencyStop: (cb) => {
      const listener = () => cb()
      ipcRenderer.on('aura:emergency-stop', listener)
      return () => ipcRenderer.removeListener('aura:emergency-stop', listener)
    },
    emergencyStop: () => ipcRenderer.invoke('aura:emergency-stop'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },
}

contextBridge.exposeInMainWorld('auraAPI', api)

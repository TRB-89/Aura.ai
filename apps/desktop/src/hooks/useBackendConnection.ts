import { useEffect } from 'react'
import { useBackendStore } from '@/stores/backendStore'
import { useChatStore } from '@/stores/chatStore'

/**
 * Hook that bootstraps backend connection info from Electron IPC
 * or polls local Python backend in browser/dev mode.
 */
export function useBackendConnection() {
  const setInfo = useBackendStore((s) => s.setInfo)
  const setEmergencyStopped = useChatStore((s) => s.setEmergencyStopped)

  useEffect(() => {
    // 1. Electron environment
    if (window.auraAPI) {
      window.auraAPI.backend.info().then((info) => {
        setInfo({
          port: info.port,
          token: info.token,
          status: info.status,
        })
      })

      const unsubStatus = window.auraAPI.backend.onStatusChange((data) => {
        setInfo({
          status: data.status,
          port: data.port ?? undefined,
          error: data.error,
        })
      })

      const unsubStop = window.auraAPI.aura.onEmergencyStop(() => {
        setEmergencyStopped(true)
        setTimeout(() => setEmergencyStopped(false), 5000)
      })

      return () => {
        unsubStatus()
        unsubStop()
      }
    }

    // 2. Direct browser / development mode fallback
    // Polls the local backend at 127.0.0.1:49200 directly
    let isCancelled = false

    const checkDirectBackend = async () => {
      const port = 49200
      try {
        const res = await fetch(`http://127.0.0.1:${port}/auth/status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (res.ok && !isCancelled) {
          setInfo({
            port,
            token: 'dev-insecure-token',
            status: 'ready',
            error: undefined,
          })
          return
        }
      } catch (err: any) {
        if (!isCancelled) {
          setInfo({
            port,
            status: 'error',
            error: 'Backend is offline or starting...',
          })
        }
      }
    }

    checkDirectBackend()
    const timer = setInterval(checkDirectBackend, 3000)

    return () => {
      isCancelled = true
      clearInterval(timer)
    }
  }, [setInfo, setEmergencyStopped])

  return useBackendStore((s) => s.info)
}

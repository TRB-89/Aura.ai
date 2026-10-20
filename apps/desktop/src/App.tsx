import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TitleBar } from '@/components/ui/TitleBar'
import { PasswordLockScreen } from '@/components/auth/PasswordLockScreen'
import { AuraMainDashboard } from '@/pages/AuraMainDashboard'
import { useBackendConnection } from '@/hooks/useBackendConnection'
import { auraApi } from '@/services/auraApi'

const AUTO_LOCK_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

export default function App() {
  const [isLocked, setIsLocked] = useState<boolean>(true)
  const backendInfo = useBackendConnection()
  const lastActivityRef = useRef<number>(Date.now())

  // Check backend auth status on connection
  useEffect(() => {
    if (backendInfo.status === 'ready') {
      auraApi.getAuthStatus().then((status) => {
        setIsLocked(status.is_locked)
      }).catch(() => {})
    }
  }, [backendInfo.status])

  // Inactivity auto-lock listener
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
      auraApi.authHeartbeat()
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('mousedown', handleActivity)

    const timer = setInterval(() => {
      if (!isLocked && Date.now() - lastActivityRef.current > AUTO_LOCK_TIMEOUT_MS) {
        console.log('[AURA] Auto-locking due to inactivity.')
        auraApi.lock().catch(() => {})
        setIsLocked(true)
      }
    }, 15000)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('mousedown', handleActivity)
      clearInterval(timer)
    }
  }, [isLocked])

  const handleManualLock = async () => {
    try {
      await auraApi.lock()
    } catch {}
    setIsLocked(true)
  }

  return (
    <div className="flex flex-col h-screen bg-[#07080A] text-[#EDE7DE] overflow-hidden select-none">
      {/* Draggable Native Windows Frameless Title Bar */}
      <TitleBar backendStatus={backendInfo.status} />

      {/* Main Flow: Lock Screen or Single Main AURA Dashboard */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {isLocked ? (
            <motion.div
              key="lock-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-50"
            >
              <PasswordLockScreen onUnlocked={() => setIsLocked(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="aura-dashboard"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="h-full"
            >
              <AuraMainDashboard onLock={handleManualLock} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

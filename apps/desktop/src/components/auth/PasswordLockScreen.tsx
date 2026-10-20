import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, KeyRound, ShieldAlert, ShieldCheck, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react'
import { auraApi } from '@/services/auraApi'

interface PasswordLockScreenProps {
  onUnlocked: () => void
}

export function PasswordLockScreen({ onUnlocked }: PasswordLockScreenProps) {
  const [isSetupMode, setIsSetupMode] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0)
  const [isSuccessUnlocked, setIsSuccessUnlocked] = useState(false)

  // Fetch initial setup / lock status
  const checkStatus = async () => {
    try {
      const status = await auraApi.getAuthStatus()
      setIsSetupMode(!status.is_setup)
      if (status.lockout_remaining_seconds > 0) {
        setLockoutRemaining(status.lockout_remaining_seconds)
      }
      setAttemptsRemaining(status.attempts_remaining)
      // Clear offline error if connection restored
      setError((prev) => (prev === 'Unable to connect to AURA backend' ? null : prev))
    } catch {
      // Backend is offline or starting up
      setIsSetupMode(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutRemaining])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (lockoutRemaining > 0) {
      setError(`Temporary lockout active. Please wait ${lockoutRemaining}s.`)
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      if (isSetupMode) {
        if (password.length < 4) {
          setError('Passcode must be at least 4 characters.')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Passcodes do not match.')
          setLoading(false)
          return
        }
        await auraApi.setupPassword(password, confirmPassword)
        setIsSuccessUnlocked(true)
        setTimeout(() => onUnlocked(), 800)
      } else {
        await auraApi.unlock(password)
        setIsSuccessUnlocked(true)
        setTimeout(() => onUnlocked(), 800)
      }
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (
        msg.includes('Unable to connect to AURA backend') ||
        msg.includes('Failed to fetch') ||
        msg.includes('fetch failed') ||
        msg.includes('NetworkError') ||
        msg.includes('Network request failed') ||
        msg.includes('ECONNREFUSED') ||
        err?.name === 'TypeError'
      ) {
        setError('Unable to connect to AURA backend')
      } else {
        setError(msg || 'Authentication failed. Please check your password.')
      }
      // Refresh status to update attempts
      checkStatus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080A] select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-radial from-[#C59B6D]/15 via-[#8C6D48]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#C59B6D]/5 to-transparent pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={
          isSuccessUnlocked
            ? { opacity: 0, scale: 1.05, y: -20, filter: 'blur(8px)' }
            : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        className="relative w-full max-w-md mx-4 p-8 rounded-3xl bg-[#0D0F14]/90 border border-[#C59B6D]/25 shadow-2xl shadow-black/80 backdrop-blur-2xl"
      >
        {/* Glowing border highlight */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-[#F3C77C]/30 via-[#C59B6D]/10 to-transparent -z-10 pointer-events-none opacity-60" />

        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="relative mb-4 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1C1814] to-[#0D0C0A] border border-[#C59B6D]/40 flex items-center justify-center shadow-lg shadow-[#C59B6D]/10">
              <motion.div
                animate={isSuccessUnlocked ? { rotate: 360, scale: 1.2 } : {}}
                transition={{ duration: 0.6 }}
              >
                {isSuccessUnlocked ? (
                  <Unlock className="w-7 h-7 text-[#F3C77C]" />
                ) : isSetupMode ? (
                  <KeyRound className="w-7 h-7 text-[#F3C77C]" />
                ) : (
                  <Lock className="w-7 h-7 text-[#F3C77C]" />
                )}
              </motion.div>
            </div>
            {/* Subtle pulse ring */}
            <div className="absolute -inset-1 rounded-2xl border border-[#F3C77C]/20 animate-pulse pointer-events-none" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-[#FFF5E6] via-[#F3C77C] to-[#C59B6D] bg-clip-text text-transparent">
            AURA
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-[#C59B6D] font-medium mt-1">
            Personal Desktop AI
          </p>
          <p className="text-sm text-[#A0988A] mt-2 max-w-xs">
            {isSetupMode
              ? 'Create your private password to initialize your personal companion.'
              : 'Enter your private password to unlock your assistant.'}
          </p>
        </div>

        {/* Lockout Warning Banner */}
        {lockoutRemaining > 0 && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-red-300 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              Too many failed attempts. Locked for{' '}
              <strong className="text-red-200 font-mono">{lockoutRemaining}s</strong>.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-red-950/30 border border-red-500/25 flex items-center gap-2.5 text-red-300 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#C59B6D] uppercase tracking-wider mb-1.5">
              {isSetupMode ? 'New Private Password' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={lockoutRemaining > 0 || loading}
                autoFocus
                placeholder={isSetupMode ? 'Create at least 6 characters' : 'Enter unlock password'}
                className="w-full px-4 py-3 rounded-xl bg-[#141720]/80 border border-[#C59B6D]/30 text-white placeholder-[#686259] text-sm focus:outline-none focus:border-[#F3C77C] focus:ring-1 focus:ring-[#F3C77C] transition-all disabled:opacity-50 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8275] hover:text-[#C59B6D] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSetupMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1"
            >
              <label className="block text-xs font-medium text-[#C59B6D] uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl bg-[#141720]/80 border border-[#C59B6D]/30 text-white placeholder-[#686259] text-sm focus:outline-none focus:border-[#F3C77C] focus:ring-1 focus:ring-[#F3C77C] transition-all"
              />
            </motion.div>
          )}

          {/* Unlock / Set Button */}
          <button
            type="submit"
            disabled={lockoutRemaining > 0 || loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl font-semibold text-sm tracking-wide bg-gradient-to-r from-[#D4AF37] via-[#F3C77C] to-[#C59B6D] text-black shadow-lg shadow-[#F3C77C]/15 hover:shadow-[#F3C77C]/30 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : isSetupMode ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Establish Private Password & Unlock</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock AURA</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div className="mt-6 pt-5 border-t border-[#C59B6D]/15 flex items-center justify-between text-[11px] text-[#7A7268]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Argon2id Hardware Verification</span>
          </div>
          <span>100% Local AppData</span>
        </div>
      </motion.div>
    </div>
  )
}

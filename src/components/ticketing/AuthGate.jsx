import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, User, Phone, KeyRound, Loader2 } from 'lucide-react'
import { authService } from '../../services/authService'

/**
 * OTP login gate. Step 1 collects name/phone/email and sends the code,
 * step 2 verifies it. On success the parent's auth listener picks up
 * the new session and swaps this gate for the real content.
 */
export default function AuthGate({ accentColor = '#b45309' }) {
  const [step, setStep] = useState('details') // 'details' | 'otp'
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' })
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const sendCode = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await authService.sendOtp(form.email.trim(), {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      })
      setStep('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await authService.verifyOtp(form.email.trim(), otp.trim())
      // session propagates via onAuthChange — nothing else to do
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto glass rounded-2xl p-6"
    >
      <h2
        className="font-display text-2xl text-white text-center mb-1"
        style={{ color: accentColor }}
      >
        {step === 'details' ? 'Get Your Tickets' : 'Check Your Email'}
      </h2>
      <p className="text-white/50 text-sm text-center mb-6">
        {step === 'details'
          ? 'Enter your details — we\u2019ll email you a login code.'
          : `We sent a code to ${form.email}`}
      </p>

      {step === 'details' ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
            <input
              required
              className={inputClass}
              placeholder="Full name"
              value={form.fullName}
              onChange={update('fullName')}
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
            <input
              required
              type="tel"
              className={inputClass}
              placeholder="Phone number"
              value={form.phone}
              onChange={update('phone')}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
            <input
              required
              type="email"
              className={inputClass}
              placeholder="Email address"
              value={form.email}
              onChange={update('email')}
            />
          </div>
          <SubmitButton busy={busy} accentColor={accentColor}>
            Send Login Code
          </SubmitButton>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-3">
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
            <input
              required
              inputMode="numeric"
              maxLength={8}
              className={`${inputClass} tracking-[0.5em] text-center font-mono`}
              placeholder="00000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <SubmitButton busy={busy} accentColor={accentColor}>
            Verify &amp; Continue
          </SubmitButton>
          <button
            type="button"
            onClick={() => {
              setStep('details')
              setError(null)
            }}
            className="text-white/40 text-xs hover:text-white/70 transition"
          >
            Use a different email
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
      )}
    </motion.div>
  )
}

function SubmitButton({ busy, accentColor, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-2 w-full py-3 rounded-xl font-semibold text-black flex items-center justify-center gap-2 transition hover:brightness-110 disabled:opacity-50"
      style={{ backgroundColor: accentColor }}
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
// TODO: Add unit tests for this component

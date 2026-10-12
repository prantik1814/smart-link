import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, Loader2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { authService } from '../../services/authService'

const ACCENT = '#b45309'

/**
 * /admin/login — email + password for manager/staff accounts.
 */
export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await adminService.signIn(form.email.trim(), form.password)
      const role = await adminService.getMyRole()
      if (!role) {
        setError('This account has no admin access.')
        await authService.signOut()
        return
      }
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-5">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="w-full max-w-sm glass rounded-2xl p-6 flex flex-col gap-4"
      >
        <h1
          className="font-display text-2xl text-center mb-2"
          style={{ color: ACCENT }}
        >
          Admin Login
        </h1>

        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
          <input
            required
            type="email"
            className={inputClass}
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
          <input
            required
            type="password"
            className={inputClass}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl font-semibold text-black flex items-center justify-center gap-2 transition hover:brightness-110 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign In
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </motion.form>
    </div>
  )
}
// TODO: Add unit tests for this component

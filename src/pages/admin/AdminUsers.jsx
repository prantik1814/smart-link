import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, UserPlus, Trash2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { authService } from '../../services/authService'
import { useAdminRole } from './AdminLayout'

const ACCENT = '#b45309'

/**
 * /admin/users — manager only. List staff + invite new admin users.
 */
export default function AdminUsers() {
  const { role } = useAdminRole()
  const [users, setUsers] = useState(null)
  const [myId, setMyId] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [form, setForm] = useState({ email: '', password: '', role: 'staff' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = () =>
    adminService.getAdminUsers().then(setUsers).catch((err) => setError(err.message))

  useEffect(() => {
    authService.getSession().then((s) => setMyId(s?.user?.id ?? null)).catch(() => {})
  }, [])

  useEffect(() => {
    if (role === 'manager') load()
  }, [role])

  if (role && role !== 'manager') return <Navigate to="/admin" replace />

  const invite = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const res = await adminService.inviteStaff(
        form.email.trim(),
        form.role,
        form.password.trim()
      )
      setNotice(
        `Account created for ${form.email} — password: ${res.temp_password} (share it with them; they can log in at /admin/login)`
      )
      setForm({ email: '', password: '', role: 'staff' })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (userId) => {
    if (!window.confirm('Remove admin access for this user?')) return
    setRemoving(userId)
    setError(null)
    try {
      await adminService.removeStaff(userId)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl mb-6">Admin Users</h2>

      <form onSubmit={invite} className="glass rounded-2xl p-5 flex flex-wrap gap-3 mb-8">
        <input
          required
          type="email"
          className="flex-1 min-w-52 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          placeholder="staff@email.com"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />
        <input
          type="text"
          minLength={6}
          className="flex-1 min-w-40 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          placeholder="Password (blank = auto-generate)"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        />
        <select
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          value={form.role}
          onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
        >
          <option value="staff">Staff — verify + view payments</option>
          <option value="manager">Manager — full access</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-black text-sm transition hover:brightness-110 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Create
        </button>
      </form>

      {notice && <p className="text-emerald-400 text-sm mb-4">{notice}</p>}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!users ? (
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      ) : (
        <div className="glass rounded-2xl divide-y divide-white/5">
          {users.map((user) => (
            <div key={user.user_id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm">
                  {user.profiles?.full_name ?? 'Admin user'}
                </p>
                <p className="text-white/40 text-xs font-mono">{user.user_id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-3 py-1 rounded-full border ${
                    user.role === 'manager'
                      ? 'border-amber-500/40 text-amber-400'
                      : 'border-white/20 text-white/60'
                  }`}
                >
                  {user.role}
                </span>
                {user.user_id !== myId && (
                  <button
                    type="button"
                    onClick={() => remove(user.user_id)}
                    disabled={removing === user.user_id}
                    aria-label="Remove staff access"
                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400/70 flex items-center justify-center transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                  >
                    {removing === user.user_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-white/40 text-center py-6 text-sm">No admin users yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
// TODO: Add unit tests for this component

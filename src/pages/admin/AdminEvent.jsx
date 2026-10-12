import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, Save } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { ticketService } from '../../services/ticketService'
import { useAdminRole } from './AdminLayout'

const ACCENT = '#b45309'

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30'

/** ISO timestamptz → datetime-local input value. */
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * /admin/event — manager only. Edit event details: name, venue,
 * date/time, price, per-order cap, sales + active toggles.
 */
export default function AdminEvent() {
  const { role } = useAdminRole()
  const [event, setEvent] = useState(null)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    ticketService
      .getActiveEvent()
      .then((ev) => {
        setEvent(ev)
        if (ev) {
          setForm({
            name: ev.name ?? '',
            venue: ev.venue ?? '',
            event_date: toLocalInput(ev.event_date),
            ticket_price: (ev.ticket_price_paise ?? 0) / 100,
            max_per_order: ev.max_per_order ?? 5,
            sales_open: ev.sales_open ?? false,
            is_active: ev.is_active ?? true,
          })
        }
      })
      .catch((err) => setError(err.message))
  }, [])

  if (role && role !== 'manager') return <Navigate to="/admin" replace />

  const update = (key) => (e) => {
    const value =
      e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.type === 'number'
          ? Number(e.target.value)
          : e.target.value
    setForm((p) => ({ ...p, [key]: value }))
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await adminService.updateEvent(event.id, {
        name: form.name.trim(),
        venue: form.venue.trim(),
        event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
        ticket_price_paise: Math.round(form.ticket_price * 100),
        max_per_order: form.max_per_order,
        sales_open: form.sales_open,
        is_active: form.is_active,
      })
      setNotice('Event updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-display text-2xl mb-6">Event Settings</h2>

      {!form ? (
        error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <Loader2 className="w-8 h-8 animate-spin text-white/40" />
        )
      ) : (
        <form onSubmit={save} className="glass rounded-2xl p-5 flex flex-col gap-4">
          <Field label="Event name">
            <input required className={inputClass} value={form.name} onChange={update('name')} />
          </Field>

          <Field label="Venue">
            <input className={inputClass} value={form.venue} onChange={update('venue')} placeholder="Venue TBA" />
          </Field>

          <Field label="Date & time">
            <input type="datetime-local" className={inputClass} value={form.event_date} onChange={update('event_date')} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ticket price (₹)">
              <input required type="number" min="0" step="1" className={inputClass} value={form.ticket_price} onChange={update('ticket_price')} />
            </Field>
            <Field label="Max per order">
              <input required type="number" min="1" step="1" className={inputClass} value={form.max_per_order} onChange={update('max_per_order')} />
            </Field>
          </div>

          <label className="flex items-center justify-between py-1 cursor-pointer">
            <span className="text-sm text-white/70">Sales open</span>
            <input type="checkbox" checked={form.sales_open} onChange={update('sales_open')} className="w-4 h-4 accent-amber-600" />
          </label>
          <label className="flex items-center justify-between py-1 cursor-pointer">
            <span className="text-sm text-white/70">Event active</span>
            <input type="checkbox" checked={form.is_active} onChange={update('is_active')} className="w-4 h-4 accent-amber-600" />
          </label>

          {notice && <p className="text-emerald-400 text-sm">{notice}</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-black text-sm transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </form>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  )
}
// TODO: Add unit tests for this component

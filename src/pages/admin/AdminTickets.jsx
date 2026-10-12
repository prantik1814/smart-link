import { useEffect, useState } from 'react'
import { Loader2, Search, Ban, Download } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { ticketService, qrImageUrl } from '../../services/ticketService'
import { downloadTicket } from '../../components/ticketing/QrDisplay'
import { useAdminRole } from './AdminLayout'

const STATUS_STYLES = {
  valid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  used: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const STATUS_LABELS = {
  valid: 'Valid',
  used: 'Admitted',
  cancelled: 'Cancelled',
}

/**
 * /admin/tickets — search/filter tickets; managers can cancel.
 */
export default function AdminTickets() {
  const { role } = useAdminRole()
  const [event, setEvent] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [tickets, setTickets] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    ticketService
      .getActiveEvent()
      .then(setEvent)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!event?.id) return
    const timer = setTimeout(() => {
      adminService
        .getTickets(event.id, { status: status || undefined, search: search || undefined })
        .then(setTickets)
        .catch((err) => setError(err.message))
    }, 250) // debounce search
    return () => clearTimeout(timer)
  }, [event, search, status])

  const download = async (ticket) => {
    setDownloading(ticket.id)
    try {
      await downloadTicket(ticket.ticket_code, event)
    } finally {
      setDownloading(null)
    }
  }

  const cancel = async (ticketId) => {
    if (!window.confirm('Cancel this ticket? The holder will be denied entry.')) return
    setCancelling(ticketId)
    try {
      await adminService.cancelTicket(ticketId)
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: 'cancelled' } : t))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelling(null)
    }
  }

  if (error) return <p className="text-red-400">{error}</p>

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Tickets</h2>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            placeholder="Search ticket code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="valid">Valid</option>
          <option value="used">Admitted</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {!tickets ? (
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      ) : tickets.length === 0 ? (
        <p className="text-white/40 text-center py-6">No tickets found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tickets.map((ticket) => (
            <TicketAdminCard
              key={ticket.id}
              ticket={ticket}
              role={role}
              downloading={downloading === ticket.id}
              cancelling={cancelling === ticket.id}
              onDownload={() => download(ticket)}
              onCancel={() => cancel(ticket.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** One ticket card: QR, buyer details, status, download + cancel. */
function TicketAdminCard({
  ticket,
  role,
  downloading,
  cancelling,
  onDownload,
  onCancel,
}) {
  const profile = ticket.orders?.profiles
  const shortCode = ticket.ticket_code.slice(0, 8).toUpperCase()

  return (
    <div className="glass rounded-2xl p-4 flex gap-4">
      <div className="bg-white p-1.5 rounded-xl shrink-0 self-start">
        <img
          src={qrImageUrl(ticket.ticket_code)}
          alt={`QR ${shortCode}`}
          className="w-20 h-20 block"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-sm text-white/90">#{shortCode}</p>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[ticket.status]}`}
          >
            {STATUS_LABELS[ticket.status]}
          </span>
        </div>
        <p className="font-mono text-[10px] text-white/30 break-all">
          {ticket.ticket_code}
        </p>

        <div className="text-sm">
          <p className="text-white/80">{profile?.full_name ?? '—'}</p>
          <p className="text-white/50 text-xs truncate">{profile?.email ?? '—'}</p>
          <p className="text-white/50 text-xs">{profile?.phone ?? '—'}</p>
        </div>

        {ticket.used_at && (
          <p className="text-white/40 text-xs">
            Admitted {new Date(ticket.used_at).toLocaleString('en-IN')}
          </p>
        )}

        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white/70 hover:bg-white/20 hover:text-white transition disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            QR
          </button>
          {role === 'manager' && ticket.status === 'valid' && (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-xs text-red-400/80 hover:bg-red-500/20 hover:text-red-400 transition disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ban className="w-3.5 h-3.5" />
              )}
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
// TODO: Add unit tests for this component

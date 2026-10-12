import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Loader2 } from 'lucide-react'
import QrDisplay, { downloadTicket } from './QrDisplay'
import { qrImageUrl } from '../../services/ticketService'

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
 * One ticket. layout='card' → QR card grid item; layout='row' →
 * horizontal banner (QR left, details middle, download right).
 */
export default function TicketCard({ ticket, event, layout = 'card' }) {
  if (layout === 'row') return <TicketRow ticket={ticket} event={event} />
  const shortCode = ticket.ticket_code.slice(0, 8).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 flex flex-col items-center gap-4"
    >
      <QrDisplay ticketCode={ticket.ticket_code} event={event} />

      <div className="text-center">
        <p className="font-mono text-white/80 text-sm tracking-wider">
          #{shortCode}
        </p>
        <span
          className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[ticket.status]}`}
        >
          {STATUS_LABELS[ticket.status]}
        </span>
        {ticket.status === 'used' && ticket.used_at && (
          <p className="text-white/40 text-xs mt-2">
            Admitted {new Date(ticket.used_at).toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </motion.div>
  )
}
/** Horizontal banner row for the My Tickets list. */
function TicketRow({ ticket, event }) {
  const [downloading, setDownloading] = useState(false)
  const [enlarged, setEnlarged] = useState(false)
  const shortCode = ticket.ticket_code.slice(0, 8).toUpperCase()

  const onDownload = async () => {
    setDownloading(true)
    try {
      await downloadTicket(ticket.ticket_code, event)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => setEnlarged(true)}
      className="glass rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition hover:bg-white/5"
    >
      <div className="bg-white p-1.5 rounded-xl shrink-0">
        <img
          src={qrImageUrl(ticket.ticket_code)}
          alt={`Ticket QR ${shortCode}`}
          className="w-16 h-16 block"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-mono text-white/80 text-sm tracking-wider">
          #{shortCode}
        </p>
        <span
          className={`inline-block mt-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[ticket.status]}`}
        >
          {STATUS_LABELS[ticket.status]}
        </span>
        {ticket.status === 'used' && ticket.used_at && (
          <p className="text-white/40 text-xs mt-1">
            Admitted {new Date(ticket.used_at).toLocaleString('en-IN')}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDownload()
        }}
        disabled={downloading}
        aria-label="Download ticket"
        className="shrink-0 w-10 h-10 rounded-xl bg-white/10 text-white/70 flex items-center justify-center transition hover:bg-white/20 hover:text-white disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    </motion.div>

    {enlarged && (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
        onClick={() => setEnlarged(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="bg-white p-5 rounded-3xl">
            <img
              src={qrImageUrl(ticket.ticket_code)}
              alt={`Ticket QR ${shortCode}`}
              className="w-72 h-72 block"
            />
          </div>
          <p className="font-mono text-white/80 tracking-wider">#{shortCode}</p>
          <p className="text-white/40 text-xs">Tap anywhere to close</p>
        </motion.div>
      </div>
    )}
    </>
  )
}

// TODO: Add unit tests for this component

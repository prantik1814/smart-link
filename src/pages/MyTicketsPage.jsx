import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, LogOut } from 'lucide-react'
import { authService } from '../services/authService'
import { ticketService } from '../services/ticketService'
import AuthGate from '../components/ticketing/AuthGate'
import TicketCard from '../components/ticketing/TicketCard'

const ACCENT = '#b45309'

/**
 * /my-tickets — logged-in user's purchased tickets.
 */
export default function MyTicketsPage() {
  const [session, setSession] = useState(undefined)
  const [orders, setOrders] = useState(null)
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    authService.getSession().then(setSession).catch(() => setSession(null))
    return authService.onAuthChange(setSession)
  }, [])

  useEffect(() => {
    if (!session) return
    ticketService
      .getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
    ticketService.getActiveEvent().then(setEvent).catch(() => {})
  }, [session])

  const paidOrders = orders?.filter((o) => o.status === 'paid') ?? []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-5 py-10">
      <div className="w-full max-w-md flex items-center justify-between mb-10">
        <Link to="/concert" className="text-white/50 text-sm hover:text-white transition">
          ← Buy Tickets
        </Link>
        {session && (
          <button
            type="button"
            onClick={() => authService.signOut()}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        )}
      </div>

      <h1
        className="font-display text-4xl text-center mb-10"
        style={{ color: ACCENT }}
      >
        My Tickets
      </h1>

      {session === undefined || (session && orders === null && !error) ? (
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      ) : !session ? (
        <AuthGate accentColor={ACCENT} />
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : paidOrders.length === 0 ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/50">
          No tickets yet.{' '}
          <Link to="/concert" className="underline" style={{ color: ACCENT }}>
            Grab yours →
          </Link>
        </motion.p>
      ) : (
        <div className="w-full max-w-md flex flex-col gap-8">
          {paidOrders.map((order, index) => (
            <div key={order.id}>
              <p className="text-white/40 text-xs mb-3 font-mono">
                Order {index + 1} · {order.id.slice(0, 8)} ·{' '}
                {new Date(order.paid_at ?? order.created_at).toLocaleDateString('en-IN')} · ₹
                {(order.amount_paise / 100).toLocaleString('en-IN')}
              </p>
              <div className="flex flex-col gap-3">
                {order.tickets
                  ?.filter((t) => t.status !== 'cancelled')
                  .map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      event={event}
                      layout="row"
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
// TODO: Add unit tests for this component

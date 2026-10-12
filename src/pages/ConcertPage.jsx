import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Ticket, CheckCircle2, Share2, MessageCircle } from 'lucide-react'
import { authService } from '../services/authService'
import { ticketService } from '../services/ticketService'
import { paymentService } from '../services/paymentService'
import AuthGate from '../components/ticketing/AuthGate'
import QuantitySelector from '../components/ticketing/QuantitySelector'
import TicketCard from '../components/ticketing/TicketCard'

const ACCENT = '#b45309'

/**
 * /concert — Courtyard Concert purchase flow.
 * OTP gate → quantity + Pay Now → Razorpay → confirmation with QR tickets.
 */
export default function ConcertPage() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [event, setEvent] = useState(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [phase, setPhase] = useState('buy') // 'buy' | 'processing' | 'confirmed'
  const [paidOrder, setPaidOrder] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    authService.getSession().then(setSession).catch(() => setSession(null))
    return authService.onAuthChange(setSession)
  }, [])

  useEffect(() => {
    ticketService
      .getActiveEvent()
      .then(setEvent)
      .catch((err) => setError(err.message))
      .finally(() => setEventLoading(false))
  }, [])

  const payNow = async () => {
    setError(null)
    setPhase('processing')
    try {
      const order = await paymentService.createOrder(event.id, quantity)
      const payment = await paymentService.openCheckout({
        order,
        prefill: { email: session.user.email },
      })

      if (!payment) {
        setPhase('buy') // user dismissed the modal
        return
      }

      // Webhook marks the order paid + issues tickets — poll briefly.
      const paid = await ticketService.waitForOrderPaid(order.order_id)
      if (!paid) {
        setError(
          'Payment received but ticket issuance is taking a moment. Check My Tickets shortly.'
        )
        setPhase('buy')
        return
      }

      const orders = await ticketService.getMyOrders()
      setPaidOrder(orders.find((o) => o.id === order.order_id) ?? null)
      setPhase('confirmed')
    } catch (err) {
      setError(err.message)
      setPhase('buy')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-5 py-10">
      {/* Top bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-10">
        <Link to="/" className="text-white/50 text-sm hover:text-white transition">
          ← Back
        </Link>
        {session && (
          <Link
            to="/my-tickets"
            className="flex items-center gap-1.5 text-sm transition hover:brightness-125"
            style={{ color: ACCENT }}
          >
            <Ticket className="w-4 h-4" />
            My Tickets
          </Link>
        )}
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-4xl md:text-5xl text-center mb-2"
        style={{ color: ACCENT }}
      >
        {event?.name ?? 'Courtyard Concert'}
      </motion.h1>
      <p className="text-white/50 text-center mb-10">
        {event?.venue ?? 'An intimate evening of live music'}
        {event?.event_date &&
          ` · ${new Date(event.event_date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`}
      </p>

      {eventLoading || session === undefined ? (
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      ) : !event ? (
        <p className="text-white/60">Ticket sales are not open right now.</p>
      ) : !session ? (
        <AuthGate accentColor={ACCENT} />
      ) : phase === 'confirmed' && paidOrder ? (
        <Confirmation order={paidOrder} event={event} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm glass rounded-2xl overflow-hidden flex flex-col items-center gap-6"
        >
          <img
            src="/icons/band_icon.jpeg"
            alt="TLF GANG"
            className="w-full h-48 object-contain bg-black/40"
          />
          <div className="px-6 pb-6 w-full flex flex-col items-center gap-6">
          <QuantitySelector
            quantity={quantity}
            max={event.max_per_order}
            pricePaise={event.ticket_price_paise}
            onChange={setQuantity}
            accentColor={ACCENT}
          />

          <button
            type="button"
            onClick={payNow}
            disabled={phase === 'processing'}
            className="w-full py-3.5 rounded-xl font-semibold text-black flex items-center justify-center gap-2 transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            {phase === 'processing' && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {phase === 'processing' ? 'Processing…' : 'Pay Now'}
          </button>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function Confirmation({ order, event }) {
  const shareText = `I just grabbed my tickets for ${event?.name ?? 'Courtyard Concert'} — grab yours too!`
  const shareUrl = `${window.location.origin}/concert`

  const shareWhatsApp = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      '_blank'
    )

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: event?.name, text: shareText, url: shareUrl }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md flex flex-col items-center gap-6"
    >
      <div className="flex items-center gap-2 text-emerald-400">
        <CheckCircle2 className="w-6 h-6" />
        <h2 className="font-display text-2xl">Payment Successful</h2>
      </div>

      <div className="glass rounded-2xl p-5 w-full text-sm">
        <Row label="Amount paid" value={`₹${(order.amount_paise / 100).toLocaleString('en-IN')}`} />
        <Row label="Payment ID" value={order.razorpay_payment_id ?? '—'} mono />
        <Row
          label="Paid at"
          value={order.paid_at ? new Date(order.paid_at).toLocaleString('en-IN') : '—'}
        />
        <p className="text-white/40 text-xs mt-3">
          A copy of your ticket QR codes has been emailed to you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {order.tickets
          ?.filter((t) => t.status !== 'cancelled')
          .map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} event={event} />
          ))}
      </div>

      <div className="flex gap-3 w-full">
        <button
          type="button"
          onClick={shareWhatsApp}
          className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 transition"
        >
          <MessageCircle className="w-4 h-4" />
          Share on WhatsApp
        </button>
        <button
          type="button"
          onClick={shareNative}
          className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      <div className="text-center">
        <h3 className="font-display text-2xl" style={{ color: ACCENT }}>
          Till the concert, sing along with us
        </h3>
        <p className="text-white/40 text-sm mt-1">
          Warm up those vocal cords — you&apos;ll need them at the event.
        </p>
      </div>

      <iframe
        title="TLF GANG on Spotify"
        src="https://open.spotify.com/embed/artist/1rrmL1ifaJFwhFiaUIeHVF?utm_source=generator"
        width="100%"
        height="352"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-xl w-full"
      />
    </motion.div>
  )
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-white/50">{label}</span>
      <span className={mono ? 'font-mono text-xs text-white/80 break-all' : 'text-white/90'}>
        {value}
      </span>
    </div>
  )
}
// TODO: Add unit tests for this component

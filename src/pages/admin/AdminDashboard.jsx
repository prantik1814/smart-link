import { useEffect, useState } from 'react'
import { Loader2, IndianRupee, Ticket, Users, DoorOpen } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { ticketService } from '../../services/ticketService'

/**
 * /admin — sales + entry stats for the active event.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const active = await ticketService.getActiveEvent()
        setEvent(active)
        if (active) setStats(await adminService.getDashboardStats(active.id))
      } catch (err) {
        setError(err.message)
      }
    })()
  }, [])

  if (error) return <p className="text-red-400">{error}</p>
  if (!stats) return <Loader2 className="w-8 h-8 animate-spin text-white/40" />

  const cards = [
    {
      label: 'Revenue',
      value: `₹${(stats.revenuePaise / 100).toLocaleString('en-IN')}`,
      icon: IndianRupee,
    },
    { label: 'Tickets Sold', value: stats.ticketsSold, icon: Ticket },
    { label: 'Paid Orders', value: stats.orderCount, icon: Users },
    { label: 'Admitted', value: stats.admitted, icon: DoorOpen },
    { label: 'Still Valid', value: stats.validTickets, icon: Ticket },
    { label: 'Cancelled', value: stats.cancelled, icon: Ticket },
  ]

  return (
    <div>
      <h2 className="font-display text-2xl mb-1">{event?.name ?? 'Event'}</h2>
      <p className="text-white/40 text-sm mb-6">
        ₹{((event?.ticket_price_paise ?? 0) / 100).toLocaleString('en-IN')} per ticket
        {event?.sales_open ? ' · sales open' : ' · sales closed'}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-2">
              <Icon className="w-4 h-4" />
              {label}
            </div>
            <p className="font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
// TODO: Add unit tests for this component

import { useEffect, useState } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { ticketService } from '../../services/ticketService'
import { useAdminRole } from './AdminLayout'

const STATUS_STYLES = {
  paid: 'text-emerald-400',
  created: 'text-amber-400',
  failed: 'text-red-400',
  refunded: 'text-sky-400',
}

/**
 * /admin/orders — payment/invoice table. Read-only for staff;
 * managers can resend ticket emails.
 */
export default function AdminOrders() {
  const { role } = useAdminRole()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)
  const [resending, setResending] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const event = await ticketService.getActiveEvent()
        if (event) setOrders(await adminService.getOrders(event.id))
        else setOrders([])
      } catch (err) {
        setError(err.message)
      }
    })()
  }, [])

  const resend = async (orderId) => {
    setResending(orderId)
    try {
      await adminService.resendTicketEmail(orderId)
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(null)
    }
  }

  if (error) return <p className="text-red-400">{error}</p>
  if (!orders) return <Loader2 className="w-8 h-8 animate-spin text-white/40" />

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Orders &amp; Payments</h2>

      <div className="overflow-x-auto glass rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 border-b border-white/10">
              <Th>Customer</Th>
              <Th>Qty</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Razorpay Payment</Th>
              <Th>Date</Th>
              {role === 'manager' && <Th />}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-white/5 last:border-0">
                <Td>
                  <p className="text-white/90">{order.profiles?.full_name ?? '—'}</p>
                  <p className="text-white/40 text-xs">{order.profiles?.phone ?? ''}</p>
                </Td>
                <Td>{order.quantity}</Td>
                <Td>₹{(order.amount_paise / 100).toLocaleString('en-IN')}</Td>
                <Td>
                  <span className={STATUS_STYLES[order.status]}>{order.status}</span>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-white/60 break-all">
                    {order.razorpay_payment_id ?? '—'}
                  </span>
                </Td>
                <Td>
                  <span className="text-white/60 text-xs">
                    {new Date(order.created_at).toLocaleString('en-IN')}
                  </span>
                </Td>
                {role === 'manager' && (
                  <Td>
                    {order.status === 'paid' && (
                      <button
                        type="button"
                        onClick={() => resend(order.id)}
                        disabled={resending === order.id}
                        className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition disabled:opacity-50"
                      >
                        {resending === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                        Resend
                      </button>
                    )}
                  </Td>
                )}
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <Td colSpan={7}>
                  <p className="text-white/40 text-center py-6">No orders yet.</p>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Th = ({ children }) => <th className="px-4 py-3 font-medium">{children}</th>
const Td = ({ children, ...props }) => (
  <td className="px-4 py-3 align-top" {...props}>
    {children}
  </td>
)
// TODO: Add unit tests for this component

import { supabase } from './supabaseClient'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

/** Authenticated POST to a Supabase Edge Function. */
export async function callFunction(name, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
  return json
}

/** Load Razorpay checkout.js once. */
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load payment gateway'))
    document.body.appendChild(script)
  })
}

export const paymentService = {
  /** Create a pending order + Razorpay order via Edge Function. */
  createOrder(eventId, quantity) {
    return callFunction('create-order', { event_id: eventId, quantity })
  },

  /**
   * Open the Razorpay checkout modal.
   * Resolves with the payment response on success, null if dismissed.
   */
  async openCheckout({ order, prefill = {}, onDismiss }) {
    await loadRazorpayScript()

    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount_paise,
        currency: 'INR',
        name: 'Courtyard Concert',
        description: `${order.quantity} ticket(s)`,
        order_id: order.razorpay_order_id,
        prefill,
        theme: { color: '#b45309' },
        handler: (response) => resolve(response),
        modal: {
          ondismiss: () => {
            onDismiss?.()
            resolve(null)
          },
        },
      })
      rzp.on('payment.failed', (resp) =>
        reject(new Error(resp.error?.description || 'Payment failed'))
      )
      rzp.open()
    })
  },
}
// TODO: Add unit tests for this service

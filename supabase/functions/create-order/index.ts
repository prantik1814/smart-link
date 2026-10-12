import { handleOptions, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { adminClient, getCaller } from '../_shared/admin.ts'

/**
 * POST /create-order  { event_id, quantity }
 * Authenticated customer → creates a pending order + Razorpay order.
 * Returns { order_id, razorpay_order_id, amount_paise, quantity }.
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  try {
    const user = await getCaller(req)
    if (!user) return errorResponse('Sign in required', 401)

    const { event_id, quantity } = await req.json()
    if (!event_id || !Number.isInteger(quantity) || quantity < 1) {
      return errorResponse('Invalid event_id or quantity')
    }

    const db = adminClient()

    const { data: event, error: eventErr } = await db
      .from('events')
      .select('*')
      .eq('id', event_id)
      .eq('is_active', true)
      .eq('sales_open', true)
      .single()
    if (eventErr || !event) return errorResponse('Event not available', 404)
    if (quantity > event.max_per_order) {
      return errorResponse(`Max ${event.max_per_order} tickets per order`)
    }

    const amountPaise = event.ticket_price_paise * quantity

    // Razorpay order
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `cc_${Date.now()}`,
      }),
    })
    if (!rzpRes.ok) {
      console.error('Razorpay order failed:', await rzpRes.text())
      return errorResponse('Could not initiate payment', 502)
    }
    const rzpOrder = await rzpRes.json()

    const { data: order, error: orderErr } = await db
      .from('orders')
      .insert({
        user_id: user.id,
        event_id,
        quantity,
        amount_paise: amountPaise,
        razorpay_order_id: rzpOrder.id,
      })
      .select('id')
      .single()
    if (orderErr) {
      console.error('Order insert failed:', orderErr)
      return errorResponse('Could not create order', 500)
    }

    return jsonResponse({
      order_id: order.id,
      razorpay_order_id: rzpOrder.id,
      amount_paise: amountPaise,
      quantity,
    })
  } catch (err) {
    console.error(err)
    return errorResponse('Internal error', 500)
  }
})

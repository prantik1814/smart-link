import { jsonResponse, errorResponse } from '../_shared/cors.ts'
import { adminClient } from '../_shared/admin.ts'
import { hmacHex, timingSafeEqual } from '../_shared/hmac.ts'
import { signTicketCode, makeQrPng, uploadQr } from '../_shared/tickets.ts'
import { sendTicketEmail } from '../_shared/email.ts'

/**
 * POST /razorpay-webhook  (Razorpay → us, no JWT)
 * Verifies the webhook signature, marks the order paid, issues
 * signed QR tickets, uploads QR PNGs, emails them to the buyer.
 * Idempotent: re-delivery of the same event is a no-op.
 */
Deno.serve(async (req) => {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature') ?? ''
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!

    const expected = await hmacHex(secret, rawBody)
    if (!timingSafeEqual(signature, expected)) {
      return errorResponse('Bad signature', 401)
    }

    const payload = JSON.parse(rawBody)
    const payment = payload?.payload?.payment?.entity
    if (!payment?.order_id) {
      return jsonResponse({ ignored: true }) // event we don't care about
    }

    const db = adminClient()

    const { data: order } = await db
      .from('orders')
      .select('*, events(name), profiles(full_name)')
      .eq('razorpay_order_id', payment.order_id)
      .maybeSingle()
    if (!order) return jsonResponse({ ignored: true })
    if (order.status === 'paid') return jsonResponse({ ok: true, already: true })

    if (payload.event === 'payment.failed') {
      await db.from('orders').update({ status: 'failed' }).eq('id', order.id)
      return jsonResponse({ ok: true })
    }
    if (payload.event !== 'payment.captured' && payload.event !== 'order.paid') {
      return jsonResponse({ ignored: true })
    }

    // Mark paid — atomically claim the order. 'failed' is allowed because
    // Razorpay retries on the same order after a failed attempt. If no row
    // matched, the order was already paid → bail before issuing tickets
    // (payment.captured AND order.paid both fire for one payment).
    const { data: claimed, error: updateErr } = await db
      .from('orders')
      .update({
        status: 'paid',
        razorpay_payment_id: payment.id,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .in('status', ['created', 'failed'])
      .select('id')
    if (updateErr) throw updateErr
    if (!claimed?.length) return jsonResponse({ ok: true, already: true })

    // Issue tickets: signed code → QR PNG → storage → rows
    const ticketMails: { ticketCode: string; qrBase64: string }[] = []
    const rows: Record<string, unknown>[] = []

    for (let i = 0; i < order.quantity; i++) {
      const ticketCode = crypto.randomUUID()
      const qrPayload = await signTicketCode(ticketCode)
      const qr = await makeQrPng(qrPayload)
      await uploadQr(ticketCode, qr.bytes)

      rows.push({
        order_id: order.id,
        event_id: order.event_id,
        ticket_code: ticketCode,
        qr_signature: qrPayload.split('.').pop(),
      })
      ticketMails.push({ ticketCode, qrBase64: qr.base64 })
    }

    const { error: ticketErr } = await db.from('tickets').insert(rows)
    if (ticketErr) throw ticketErr

    // Email the buyer (non-fatal if it fails — tickets exist regardless)
    const { data: authUser } = await db.auth.admin.getUserById(order.user_id)
    const email = authUser?.user?.email
    if (email) {
      try {
        await sendTicketEmail({
          to: email,
          name: order.profiles?.full_name ?? 'Guest',
          eventName: order.events?.name ?? 'Courtyard Concert',
          amountPaise: order.amount_paise,
          tickets: ticketMails,
        })
      } catch (mailErr) {
        console.error('Ticket email failed:', mailErr)
      }
    }

    return jsonResponse({ ok: true })
  } catch (err) {
    console.error(err)
    return errorResponse('Webhook processing failed', 500)
  }
})

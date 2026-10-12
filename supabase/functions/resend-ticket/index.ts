import { handleOptions, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { adminClient, getCaller, getCallerRole } from '../_shared/admin.ts'
import { signTicketCode, makeQrPng } from '../_shared/tickets.ts'
import { sendTicketEmail } from '../_shared/email.ts'

/**
 * POST /resend-ticket  { order_id }
 * Admin only. Re-sends the ticket email for a paid order.
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  try {
    const user = await getCaller(req)
    if (!user) return errorResponse('Sign in required', 401)
    const role = await getCallerRole(user.id)
    if (!role) return errorResponse('Admin access required', 403)

    const { order_id } = await req.json()
    if (!order_id) return errorResponse('Missing order_id')

    const db = adminClient()
    const { data: order } = await db
      .from('orders')
      .select('*, events(name), profiles(full_name), tickets(ticket_code, status)')
      .eq('id', order_id)
      .eq('status', 'paid')
      .maybeSingle()
    if (!order) return errorResponse('Paid order not found', 404)

    const { data: authUser } = await db.auth.admin.getUserById(order.user_id)
    const email = authUser?.user?.email
    if (!email) return errorResponse('Customer email not found', 404)

    const tickets = []
    for (const t of order.tickets ?? []) {
      if (t.status === 'cancelled') continue
      const qr = await makeQrPng(await signTicketCode(t.ticket_code))
      tickets.push({ ticketCode: t.ticket_code, qrBase64: qr.base64 })
    }

    await sendTicketEmail({
      to: email,
      name: order.profiles?.full_name ?? 'Guest',
      eventName: order.events?.name ?? 'Courtyard Concert',
      amountPaise: order.amount_paise,
      tickets,
    })

    return jsonResponse({ ok: true, sent_to: email })
  } catch (err) {
    console.error(err)
    return errorResponse('Internal error', 500)
  }
})

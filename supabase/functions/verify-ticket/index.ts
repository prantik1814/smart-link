import { handleOptions, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { adminClient, getCaller, getCallerRole } from '../_shared/admin.ts'
import { verifyTicketPayload } from '../_shared/tickets.ts'

/**
 * POST /verify-ticket  { payload }
 * Admin/staff only. Verifies QR signature, then atomically flips
 * status valid → used so a ticket can never be admitted twice.
 * Returns { result: 'admitted'|'already_used'|'cancelled'|'invalid', ... }.
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  try {
    const user = await getCaller(req)
    if (!user) return errorResponse('Sign in required', 401)
    const role = await getCallerRole(user.id)
    if (!role) return errorResponse('Admin access required', 403)

    const { payload, ticket_code: manualCode } = await req.json()
    const db = adminClient()

    const logScan = (
      result: string,
      ticketId: string | null = null,
      code: string | null = null,
    ) =>
      db.from('ticket_scans').insert({
        ticket_id: ticketId,
        ticket_code: code,
        scanned_by: user.id,
        result,
      })

    let ticketCode: string | null = null

    if (typeof payload === 'string' && payload.trim()) {
      // Camera path: verify the HMAC signature inside the QR payload.
      ticketCode = await verifyTicketPayload(payload.trim())
    } else if (typeof manualCode === 'string' && manualCode.trim()) {
      // Manual path: caller is already role-gated staff, so the signature
      // is redundant. Accept the full UUID or the 8-char short code.
      ticketCode = await resolveTicketCode(db, manualCode)
    }

    if (!ticketCode) {
      await logScan('invalid')
      return jsonResponse({ result: 'invalid' })
    }

    // Atomic admit: only succeeds if the ticket is still valid.
    const { data: admitted } = await db
      .from('tickets')
      .update({ status: 'used', used_at: new Date().toISOString(), scanned_by: user.id })
      .eq('ticket_code', ticketCode)
      .eq('status', 'valid')
      .select('id, ticket_code, orders(profiles(full_name))')
      .maybeSingle()

    if (admitted) {
      await logScan('admitted', admitted.id, admitted.ticket_code)
      return jsonResponse({
        result: 'admitted',
        ticket_code: admitted.ticket_code,
        holder: admitted.orders?.profiles?.full_name ?? null,
      })
    }

    // Not admitted — figure out why for the scanner UI.
    const { data: ticket } = await db
      .from('tickets')
      .select('id, ticket_code, status, used_at')
      .eq('ticket_code', ticketCode)
      .maybeSingle()

    if (!ticket) {
      await logScan('invalid', null, ticketCode)
      return jsonResponse({ result: 'invalid' })
    }

    const result = ticket.status === 'cancelled' ? 'cancelled' : 'already_used'
    await logScan(result, ticket.id, ticket.ticket_code)
    return jsonResponse({
      result,
      ticket_code: ticket.ticket_code,
      used_at: ticket.used_at,
    })
  } catch (err) {
    console.error(err)
    return errorResponse('Internal error', 500)
  }
})

/**
 * Resolve a manually entered code to a full ticket_code.
 * Accepts the full UUID or a prefix (the 8-char short code shown to guests).
 * Prefix matching uses a UUID range scan — index-friendly, no casts.
 */
async function resolveTicketCode(
  db: ReturnType<typeof adminClient>,
  input: string,
): Promise<string | null> {
  const code = input.trim().replace(/^#/, '').toLowerCase()
  if (!/^[0-9a-f-]{4,36}$/.test(code)) return null

  const query =
    code.length === 36
      ? db.from('tickets').select('ticket_code').eq('ticket_code', code)
      : db
          .from('tickets')
          .select('ticket_code')
          .gte('ticket_code', `${code.padEnd(8, '0')}-0000-0000-0000-000000000000`)
          .lte('ticket_code', `${code.padEnd(8, 'f')}-ffff-ffff-ffff-ffffffffffff`)

  const { data: matches } = await query.limit(2)
  // Ambiguous prefix → treat as invalid rather than admit the wrong guest.
  return matches?.length === 1 ? matches[0].ticket_code : null
}

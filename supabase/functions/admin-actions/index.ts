import { handleOptions, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { adminClient, getCaller, getCallerRole } from '../_shared/admin.ts'

const EVENT_FIELDS = [
  'name',
  'venue',
  'event_date',
  'ticket_price_paise',
  'max_per_order',
  'sales_open',
  'is_active',
] as const

/**
 * POST /admin-actions  { action, ... }
 * Manager-only privileged operations:
 *   cancel_ticket { ticket_id }
 *   update_event  { event_id, fields }
 *   invite_staff  { email, role }
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  try {
    const user = await getCaller(req)
    if (!user) return errorResponse('Sign in required', 401)
    const role = await getCallerRole(user.id)
    if (role !== 'manager') return errorResponse('Manager access required', 403)

    const body = await req.json()
    const db = adminClient()

    switch (body.action) {
      case 'cancel_ticket': {
        const { data, error } = await db
          .from('tickets')
          .update({ status: 'cancelled' })
          .eq('id', body.ticket_id)
          .eq('status', 'valid') // can't un-admit or re-cancel
          .select('id')
          .maybeSingle()
        if (error) throw error
        if (!data) return errorResponse('Ticket not found or not valid', 404)
        return jsonResponse({ ok: true })
      }

      case 'update_event': {
        const fields = Object.fromEntries(
          Object.entries(body.fields ?? {}).filter(([k]) =>
            (EVENT_FIELDS as readonly string[]).includes(k),
          ),
        )
        if (Object.keys(fields).length === 0) {
          return errorResponse('No valid fields to update')
        }
        const { error } = await db
          .from('events')
          .update(fields)
          .eq('id', body.event_id)
        if (error) throw error
        return jsonResponse({ ok: true })
      }

      case 'invite_staff': {
        const { email, role: newRole, password } = body
        if (!email || !['manager', 'staff'].includes(newRole)) {
          return errorResponse('Valid email and role required')
        }
        // Manager can set the password directly; otherwise generate one.
        // No email link to expire — staff log in at /admin/login right away.
        const finalPassword =
          typeof password === 'string' && password.length >= 6
            ? password
            : crypto.randomUUID().slice(0, 12)

        const { data: created, error: createErr } =
          await db.auth.admin.createUser({
            email,
            password: finalPassword,
            email_confirm: true,
          })

        let userId = created?.user?.id
        if (createErr) {
          // Email already registered (earlier invite or ticket buyer) —
          // reuse the account and set the password on it.
          const { data: list } = await db.auth.admin.listUsers({
            perPage: 1000,
          })
          const existing = list?.users?.find((u) => u.email === email)
          if (!existing) throw createErr
          userId = existing.id
          const { error: pwErr } = await db.auth.admin.updateUserById(userId, {
            password: finalPassword,
          })
          if (pwErr) throw pwErr
        }

        // upsert so re-inviting an existing staffer just updates the role
        const { error: roleErr } = await db
          .from('admin_users')
          .upsert({ user_id: userId, role: newRole })
        if (roleErr) throw roleErr
        return jsonResponse({
          ok: true,
          user_id: userId,
          temp_password: finalPassword,
        })
      }

      case 'remove_staff': {
        const { user_id: targetId } = body
        if (!targetId) return errorResponse('user_id required')
        if (targetId === user.id) {
          return errorResponse('You cannot remove yourself')
        }
        // Revoke admin access only — their auth account stays intact
        // (they may also be a ticket buyer).
        const { error } = await db
          .from('admin_users')
          .delete()
          .eq('user_id', targetId)
        if (error) throw error
        return jsonResponse({ ok: true })
      }

      default:
        return errorResponse('Unknown action')
    }
  } catch (err) {
    console.error(err)
    return errorResponse('Internal error', 500)
  }
})

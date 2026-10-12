import { supabase } from './supabaseClient'
import { callFunction } from './paymentService'

/**
 * Admin panel data access. Role checks are enforced by RLS +
 * Edge Functions — these methods assume an authenticated admin.
 */
export const adminService = {
  // ---------- auth ----------
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  /** 'manager' | 'staff' | null */
  async getMyRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw error
    return data?.role ?? null
  },

  // ---------- dashboard ----------
  async getDashboardStats(eventId) {
    const [ordersRes, ticketsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('quantity, amount_paise, status')
        .eq('event_id', eventId)
        .eq('status', 'paid'),
      supabase
        .from('tickets')
        .select('status')
        .eq('event_id', eventId),
    ])
    if (ordersRes.error) throw ordersRes.error
    if (ticketsRes.error) throw ticketsRes.error

    const paidOrders = ordersRes.data
    const tickets = ticketsRes.data
    return {
      ticketsSold: paidOrders.reduce((sum, o) => sum + o.quantity, 0),
      revenuePaise: paidOrders.reduce((sum, o) => sum + o.amount_paise, 0),
      orderCount: paidOrders.length,
      admitted: tickets.filter((t) => t.status === 'used').length,
      validTickets: tickets.filter((t) => t.status === 'valid').length,
      cancelled: tickets.filter((t) => t.status === 'cancelled').length,
    }
  },

  // ---------- orders / payments ----------
  async getOrders(eventId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(full_name, phone), events(name)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  // ---------- tickets ----------
  async getTickets(eventId, { status, search } = {}) {
    let query = supabase
      .from('tickets')
      .select('*, orders(user_id, profiles(full_name, phone, email))')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    if (search) query = query.ilike('ticket_code', `%${search}%`)
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // ---------- manager actions (Edge Function) ----------
  cancelTicket(ticketId) {
    return callFunction('admin-actions', { action: 'cancel_ticket', ticket_id: ticketId })
  },

  resendTicketEmail(orderId) {
    return callFunction('resend-ticket', { order_id: orderId })
  },

  updateEvent(eventId, fields) {
    return callFunction('admin-actions', { action: 'update_event', event_id: eventId, fields })
  },

  inviteStaff(email, role, password) {
    return callFunction('admin-actions', {
      action: 'invite_staff',
      email,
      role,
      password: password || undefined,
    })
  },

  removeStaff(userId) {
    return callFunction('admin-actions', { action: 'remove_staff', user_id: userId })
  },

  // ---------- admin users ----------
  async getAdminUsers() {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  // ---------- events ----------
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
}
// TODO: Add unit tests for this service

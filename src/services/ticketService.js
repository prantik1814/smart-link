import { supabase } from './supabaseClient'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/** Public URL of a ticket's QR PNG in the ticket-qrs storage bucket. */
export function qrImageUrl(ticketCode) {
  return `${SUPABASE_URL}/storage/v1/object/public/ticket-qrs/${ticketCode}.png`
}

export const ticketService = {
  /** The single active event with open sales (Courtyard Concert). */
  async getActiveEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .eq('sales_open', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  },

  /** Current user's orders with their tickets, newest first. */
  async getMyOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, tickets(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  /** Poll until an order is marked paid (webhook is async). */
  async waitForOrderPaid(orderId, { attempts = 10, intervalMs = 2000 } = {}) {
    for (let i = 0; i < attempts; i++) {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()
      if (error) throw error
      if (data.status === 'paid') return true
      if (data.status === 'failed' || data.status === 'refunded') return false
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
    return false
  },
}
// TODO: Add unit tests for this service

import { supabase } from './supabaseClient'

/**
 * Customer auth — passwordless email OTP.
 * Admin auth — email + password (see adminService).
 */
export const authService = {
  /** Send a 6-digit OTP to the email. Creates the user on first login. */
  async sendOtp(email, { fullName, phone } = {}) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { full_name: fullName, phone },
      },
    })
    if (error) throw error
  },

  /** Verify the 6-digit code. Returns the session on success. */
  async verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
    return data.session
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async updateProfile({ fullName, phone }) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', user.id)
    if (error) throw error
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /** Subscribe to auth changes. Returns an unsubscribe function. */
  onAuthChange(callback) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
    return () => subscription.unsubscribe()
  },
}
// TODO: Add unit tests for this service

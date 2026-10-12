import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'

/** Service-role client — bypasses RLS. Server-side only. */
export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

/** Resolve the calling user from the request's Authorization header. */
export async function getCaller(req: Request): Promise<User | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
  } = await client.auth.getUser()
  return user
}

/** 'manager' | 'staff' | null */
export async function getCallerRole(userId: string): Promise<string | null> {
  const { data } = await adminClient()
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.role ?? null
}

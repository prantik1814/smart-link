-- ============================================================
-- Row Level Security policies
-- Regular users: read own data only. Writes go through Edge
-- Functions (service role bypasses RLS).
-- ============================================================

-- ---------- helper: role lookup (bypasses RLS, no recursion) ----------
create or replace function public.admin_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.admin_users where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- ---------- events ----------
alter table public.events enable row level security;

create policy "events_public_read"
  on public.events for select
  using (is_active = true);

create policy "events_admin_read_all"
  on public.events for select
  using (public.is_admin());

create policy "events_manager_write"
  on public.events for all
  using (public.admin_role() = 'manager')
  with check (public.admin_role() = 'manager');

-- ---------- profiles ----------
alter table public.profiles enable row level security;

create policy "profiles_own_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_admin_read"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles_own_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- admin_users ----------
alter table public.admin_users enable row level security;

create policy "admin_users_own_read"
  on public.admin_users for select
  using (auth.uid() = user_id);

create policy "admin_users_manager_all"
  on public.admin_users for all
  using (public.admin_role() = 'manager')
  with check (public.admin_role() = 'manager');

-- ---------- orders ----------
alter table public.orders enable row level security;

create policy "orders_own_read"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "orders_admin_read"
  on public.orders for select
  using (public.is_admin());
-- inserts/updates: service role only (Edge Functions)

-- ---------- tickets ----------
alter table public.tickets enable row level security;

create policy "tickets_own_read"
  on public.tickets for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = tickets.order_id
        and o.user_id = auth.uid()
    )
  );

create policy "tickets_admin_read"
  on public.tickets for select
  using (public.is_admin());
-- writes: service role only (Edge Functions)

-- ---------- ticket_scans ----------
alter table public.ticket_scans enable row level security;

create policy "ticket_scans_admin_read"
  on public.ticket_scans for select
  using (public.is_admin());
-- inserts: service role only (verify-ticket Edge Function)
-- TODO: Add unit tests for this service

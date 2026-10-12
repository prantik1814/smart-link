-- ============================================================
-- Courtyard Concert Ticketing — Initial Schema
-- Run in Supabase SQL Editor or via `supabase db push`
-- ============================================================

-- ---------- events ----------
create table if not exists public.events (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  venue              text,
  event_date         timestamptz,
  ticket_price_paise integer not null check (ticket_price_paise >= 0),
  max_per_order      integer not null default 5 check (max_per_order > 0),
  sales_open         boolean not null default true,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

-- ---------- profiles (extends auth.users) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  phone      text,
  created_at timestamptz not null default now()
);

-- ---------- admin_users (manager | staff) ----------
-- user_id references profiles (1:1 with auth.users) so PostgREST
-- can embed profile data directly.
create table if not exists public.admin_users (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  role       text not null check (role in ('manager', 'staff')),
  created_at timestamptz not null default now()
);

-- ---------- orders ----------
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  event_id            uuid not null references public.events(id),
  quantity            integer not null check (quantity > 0),
  amount_paise        integer not null check (amount_paise >= 0),
  currency            text not null default 'INR',
  razorpay_order_id   text unique,
  razorpay_payment_id text,
  status              text not null default 'created'
                      check (status in ('created', 'paid', 'failed', 'refunded')),
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);

create index if not exists orders_user_id_idx  on public.orders(user_id);
create index if not exists orders_event_id_idx on public.orders(event_id);
create index if not exists orders_status_idx   on public.orders(status);

-- ---------- tickets ----------
create table if not exists public.tickets (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  event_id     uuid not null references public.events(id),
  ticket_code  uuid not null default gen_random_uuid() unique,
  qr_signature text not null,
  status       text not null default 'valid'
               check (status in ('valid', 'used', 'cancelled')),
  used_at      timestamptz,
  scanned_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create index if not exists tickets_order_id_idx on public.tickets(order_id);
create index if not exists tickets_event_id_idx on public.tickets(event_id);
create index if not exists tickets_status_idx   on public.tickets(status);

-- ---------- ticket_scans (audit log) ----------
create table if not exists public.ticket_scans (
  id          bigint generated always as identity primary key,
  ticket_id   uuid references public.tickets(id) on delete set null,
  ticket_code uuid,
  scanned_by  uuid references auth.users(id),
  scanned_at  timestamptz not null default now(),
  result      text not null
              check (result in ('admitted', 'already_used', 'invalid', 'cancelled'))
);

create index if not exists ticket_scans_ticket_id_idx on public.ticket_scans(ticket_id);

-- ---------- auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- seed: Courtyard Concert ----------
insert into public.events (name, venue, event_date, ticket_price_paise, max_per_order)
values ('Courtyard Concert', 'Venue TBA', null, 50000, 5)
on conflict do nothing;
-- TODO: Add unit tests for this service

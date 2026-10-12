# Ticketing System — Setup Guide

Step-by-step to take the ticketing system live. ~30 minutes.

## 1. Supabase project

1. [supabase.com](https://supabase.com) → New Project (free tier).
2. **SQL Editor** → run, in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_storage.sql`
3. **Project Settings → API** → copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → needed for Edge Function secrets (step 4)
4. **Authentication → Sign In / Providers → Email**: enable **Email OTP** (disable "Confirm email" password flow if present — we use OTP only).

## 2. Local env

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID` (test key is fine for dev).

## 3. Razorpay

1. [razorpay.com](https://razorpay.com) → sign up → KYC (needed for live mode; test mode works immediately).
2. **Settings → API Keys** → generate → `VITE_RAZORPAY_KEY_ID` = `rzp_test_...` / `rzp_live_...`.
3. **Settings → Webhooks** → add webhook:
   - URL: `https://<project-ref>.supabase.co/functions/v1/razorpay-webhook`
   - Secret: generate a random string → save as `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `payment.failed`, `order.paid`

## 4. Edge Functions

```bash
npm i -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy create-order
supabase functions deploy razorpay-webhook
supabase functions deploy verify-ticket
supabase functions deploy resend-ticket
supabase functions deploy admin-actions
```

Set secrets (Supabase Dashboard → Edge Functions → Secrets, or CLI):

```bash
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_... \
  RAZORPAY_KEY_SECRET=... \
  RAZORPAY_WEBHOOK_SECRET=... \
  QR_HMAC_SECRET=$(openssl rand -hex 32) \
  BREVO_API_KEY=... \
  BREVO_SENDER_EMAIL=you@gmail.com \
  BREVO_SENDER_NAME="Courtyard Concert"
```

## 5. Brevo (ticket emails)

1. [brevo.com](https://brevo.com) → free account (300 emails/day).
2. **Senders & IP → Senders** → add your Gmail → click the verification email.
3. **SMTP & API → API Keys** → create key → `BREVO_API_KEY`.

## 6. First admin user

1. Supabase Dashboard → **Authentication → Users → Add User** → your email + password.
2. **Table Editor → admin_users → Insert** → `user_id` = the new user's UUID, `role` = `manager`.
3. Log in at `/admin/login`. Invite staff from **Admin → Users**.

## 7. Configure the event

**Table Editor → events** → set `ticket_price_paise` (₹500 = `50000`), `venue`, `event_date`, `max_per_order`, `sales_open`.

## 8. Deploy frontend (Netlify)

- Build: `npm run build`, publish `dist/`. `public/_redirects` already handles SPA routes.
- Site env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`.

## 9. Rotate the leaked GitHub secret

`oauth-proxy.js` previously had a committed `client_secret`. Now it reads `.env`, but the old secret is still in git history:

1. GitHub → **Settings → Developer settings → OAuth Apps** → your app → **Generate a new client secret**.
2. Put the new pair in `.env` (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`).

## Test checklist

- [ ] `/concert` → OTP email arrives → verify → quantity + Pay Now
- [ ] Razorpay test card `4111 1111 1111 1111` → success → QR + email
- [ ] `/my-tickets` shows ticket, QR downloads
- [ ] `/admin/scan` → scan QR → ADMIT; scan again → DENIED (already used)
- [ ] Staff role: can scan + view orders, cannot cancel/invite

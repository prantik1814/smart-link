-- Public bucket for ticket QR PNGs.
-- Public read is fine: the QR payload is HMAC-signed, so possessing
-- the image is equivalent to possessing the ticket itself.
insert into storage.buckets (id, name, public)
values ('ticket-qrs', 'ticket-qrs', true)
on conflict (id) do nothing;

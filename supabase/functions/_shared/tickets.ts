import QRCode from 'npm:qrcode@1'
import { hmacHex, timingSafeEqual } from './hmac.ts'
import { adminClient } from './admin.ts'

const QR_SECRET = () => Deno.env.get('QR_HMAC_SECRET')!

/** QR payload: "<ticket_code>.<truncated-hmac>" — compact + forgery-proof. */
export async function signTicketCode(ticketCode: string): Promise<string> {
  const sig = await hmacHex(QR_SECRET(), ticketCode)
  return `${ticketCode}.${sig.slice(0, 32)}`
}

/** Verify a scanned payload. Returns the ticket_code if valid, else null. */
export async function verifyTicketPayload(payload: string): Promise<string | null> {
  const dot = payload.lastIndexOf('.')
  if (dot === -1) {
    // Manual entry: bare ticket_code, no signature — allowed because the
    // caller is an authenticated admin; uuids are unguessable anyway.
    return /^[0-9a-f-]{36}$/i.test(payload) ? payload : null
  }
  const ticketCode = payload.slice(0, dot)
  const sig = payload.slice(dot + 1)
  const expected = (await hmacHex(QR_SECRET(), ticketCode)).slice(0, 32)
  return timingSafeEqual(sig, expected) ? ticketCode : null
}

/** Generate a QR PNG for the payload; returns raw bytes + base64. */
export async function makeQrPng(
  payload: string,
): Promise<{ bytes: Uint8Array; base64: string }> {
  const dataUrl = await QRCode.toDataURL(payload, { width: 400, margin: 1 })
  const base64 = dataUrl.split(',')[1]
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return { bytes, base64 }
}

/** Upload QR PNG to the public ticket-qrs bucket. */
export async function uploadQr(ticketCode: string, bytes: Uint8Array): Promise<void> {
  const { error } = await adminClient()
    .storage.from('ticket-qrs')
    .upload(`${ticketCode}.png`, bytes, {
      contentType: 'image/png',
      upsert: true,
    })
  if (error) throw new Error(`QR upload failed: ${error.message}`)
}

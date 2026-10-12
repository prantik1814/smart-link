interface TicketMail {
  ticketCode: string
  qrBase64: string
}

interface SendTicketEmailArgs {
  to: string
  name: string
  eventName: string
  amountPaise: number
  tickets: TicketMail[]
}

/** Send ticket email with QR PNG attachments via Brevo. */
export async function sendTicketEmail(args: SendTicketEmailArgs): Promise<void> {
  const apiKey = Deno.env.get('BREVO_API_KEY')
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')
  if (!apiKey || !senderEmail) {
    // Email not configured — log and continue rather than fail the payment flow.
    console.warn('Brevo not configured; skipping ticket email')
    return
  }
  const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'Courtyard Concert'

  const ticketList = args.tickets
    .map((t) => `<li style="font-family:monospace">#${t.ticketCode.slice(0, 8).toUpperCase()}</li>`)
    .join('')

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: args.to, name: args.name }],
      subject: `Your ${args.eventName} ticket${args.tickets.length > 1 ? 's' : ''}`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>You're in, ${args.name}!</h2>
          <p>Your payment of <strong>₹${(args.amountPaise / 100).toLocaleString('en-IN')}</strong>
          for <strong>${args.eventName}</strong> was successful.</p>
          <p>Your ticket QR codes are attached — show them at the door.</p>
          <ul>${ticketList}</ul>
          <p style="color:#888;font-size:12px">Each QR admits one person, once.</p>
        </div>`,
      attachment: args.tickets.map((t) => ({
        name: `ticket-${t.ticketCode.slice(0, 8)}.png`,
        content: t.qrBase64,
      })),
    }),
  })

  if (!res.ok) {
    throw new Error(`Brevo send failed (${res.status}): ${await res.text()}`)
  }
}

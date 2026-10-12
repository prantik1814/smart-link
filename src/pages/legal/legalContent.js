/**
 * Legal / compliance page content for Razorpay website verification.
 * Contact details here must be real, monitored channels — Razorpay may test them.
 */
export const BUSINESS = {
  name: 'TLF GANG',
  product: 'Courtyard Concert — event tickets',
  email: 'deyp1814@gmail.com',
  phone: '+91 7679313739',
  address: 'Cooch Behar, West Bengal, India',
}

const sections = (list) => list

export const TERMS = {
  title: 'Terms & Conditions',
  updated: 'Last updated: October 2026',
  sections: sections([
    {
      heading: 'About this service',
      body: [
        `${BUSINESS.name} ("we", "us") operates this website to sell tickets for live music events, currently the ${BUSINESS.product}. By purchasing a ticket or using this site you agree to these terms.`,
      ],
    },
    {
      heading: 'Tickets & payment',
      body: [
        'All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.',
        'Payment is processed securely by Razorpay. We do not store your card, UPI, or banking details on our servers.',
        'A booking is confirmed only after successful payment. You will receive ticket(s) with unique QR codes by email and in the "My Tickets" section of this site.',
      ],
    },
    {
      heading: 'Entry & conduct',
      body: [
        'Each QR code admits one person and is valid for a single entry. Duplicate or resold codes may be refused at the gate.',
        'Entry is subject to venue rules and security checks. We and the venue reserve the right to refuse entry for safety or policy reasons.',
      ],
    },
    {
      heading: 'Event changes',
      body: [
        'Event date, venue, or lineup may change for reasons beyond our control. Material changes will be communicated to the email used at purchase.',
        'If the event is cancelled, refunds are issued as per our Refund & Cancellation Policy.',
      ],
    },
    {
      heading: 'Intellectual property',
      body: [
        'All content on this site — music, artwork, logos, text — belongs to TLF GANG or its licensors and may not be reproduced without permission.',
      ],
    },
    {
      heading: 'Governing law',
      body: [
        'These terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of the courts where our business is registered.',
      ],
    },
    {
      heading: 'Contact',
      body: [`Questions about these terms: ${BUSINESS.email} · ${BUSINESS.phone}`],
    },
  ]),
}

export const PRIVACY = {
  title: 'Privacy Policy',
  updated: 'Last updated: October 2026',
  sections: sections([
    {
      heading: 'What we collect',
      body: [
        'Email address — used to sign you in (one-time code) and deliver your tickets.',
        'Name and phone number — if you provide them during checkout, used only for order support.',
        'Order details — quantity, amount paid, and ticket status.',
      ],
    },
    {
      heading: 'What we never collect',
      body: [
        'Card numbers, UPI PINs, or banking credentials — payments are handled entirely by Razorpay on their secure checkout.',
      ],
    },
    {
      heading: 'How we use it',
      body: [
        'To authenticate you and issue tickets.',
        'To send order confirmations and event updates.',
        'To verify entry at the venue via QR code scan.',
        'We do not sell or share your personal data with advertisers or third parties beyond what is needed to process your order (Supabase for data storage, Razorpay for payments, Brevo for email delivery).',
      ],
    },
    {
      heading: 'Data retention & your rights',
      body: [
        'Order records are retained for accounting and legal compliance. You may request access, correction, or deletion of your personal data by emailing us.',
      ],
    },
    {
      heading: 'Security',
      body: [
        'Data is transmitted over HTTPS and stored with row-level access controls. Access to order data is restricted to authorised event staff.',
      ],
    },
    {
      heading: 'Contact',
      body: [`Privacy questions or requests: ${BUSINESS.email} · ${BUSINESS.phone}`],
    },
  ]),
}

export const REFUNDS = {
  title: 'Refund & Cancellation Policy',
  updated: 'Last updated: October 2026',
  sections: sections([
    {
      heading: 'Ticket cancellations',
      body: [
        'Tickets are generally non-refundable once purchased, as seats are limited and reserved at the time of booking.',
      ],
    },
    {
      heading: 'Event cancellation by organiser',
      body: [
        'If the event is cancelled by us, all paid orders are refunded in full — you do not need to take any action.',
      ],
    },
    {
      heading: 'Refund timeline',
      body: [
        'Approved refunds are initiated to the original payment method within 5–7 business days via Razorpay. Bank posting times may add a few days depending on your bank.',
      ],
    },
    {
      heading: 'Failed or duplicate payments',
      body: [
        'If your account was debited but no order confirmation appears, the amount is typically auto-reversed by the payment gateway within 5–7 business days. If it is not, contact us with your payment reference and we will resolve it.',
        'Duplicate charges for the same order are refunded in full.',
      ],
    },
    {
      heading: 'How to request',
      body: [
        `Email ${BUSINESS.email} or call ${BUSINESS.phone} with your registered email and order ID. We respond within 2 business days.`,
      ],
    },
  ]),
}

export const CONTACT = {
  title: 'Contact Us',
  updated: 'Last updated: October 2026',
  sections: sections([
    {
      heading: 'Support',
      body: [
        `For ticket orders, refunds, or event questions:`,
        `Email: ${BUSINESS.email}`,
        `Phone: ${BUSINESS.phone}`,
      ],
    },
    {
      heading: 'Business address',
      body: [`${BUSINESS.name} · ${BUSINESS.address}`],
    },
    {
      heading: 'Response time',
      body: [
        'We respond to all enquiries within 2 business days. For event-day entry issues, show your QR ticket (in your email or under My Tickets) at the gate.',
      ],
    },
  ]),
}

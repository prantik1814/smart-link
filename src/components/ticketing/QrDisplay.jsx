import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { qrImageUrl } from '../../services/ticketService'

const BAND_IMAGE = '/icons/band_icon.jpeg'
const ACCENT = '#b45309'
const CANVAS_W = 800
const CANVAS_H = 1200

const TERMS = [
  'Valid for one entry only · Non-transferable',
  'No refunds or exchanges · Present this QR at the gate',
  'Organizer reserves the right of admission',
]

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Draw img cover-cropped into the target rect (like object-fit: cover). */
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

function drawHeader(ctx, bandImg, event) {
  if (bandImg) drawCover(ctx, bandImg, 0, 0, CANVAS_W, 300)
  ctx.fillStyle = 'rgba(10,10,10,0.72)'
  ctx.fillRect(0, 0, CANVAS_W, 300)

  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.9)'
  ctx.shadowBlur = 16

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 54px Georgia, serif'
  ctx.fillText(event?.name ?? 'Courtyard Concert', CANVAS_W / 2, 185)

  ctx.shadowBlur = 0
  ctx.fillStyle = ACCENT
  ctx.fillRect(CANVAS_W / 2 - 60, 205, 120, 4)

  const when = event?.event_date
    ? new Date(event.event_date).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : ''
  ctx.shadowBlur = 8
  ctx.fillStyle = '#ffffff'
  ctx.font = '26px Arial, sans-serif'
  ctx.fillText([when, event?.venue].filter(Boolean).join('  ·  '), CANVAS_W / 2, 250)
  ctx.shadowBlur = 0
}

function drawQrCard(ctx, qrImg, ticketCode) {
  const card = 420
  const cx = (CANVAS_W - card) / 2
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(cx, 360, card, card, 24)
  ctx.fill()
  if (qrImg) ctx.drawImage(qrImg, cx + 30, 390, 360, 360)

  ctx.fillStyle = '#ffffff'
  ctx.font = '26px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`#${ticketCode.slice(0, 8).toUpperCase()}`, CANVAS_W / 2, 850)
}

function drawFooter(ctx) {
  ctx.strokeStyle = '#333'
  ctx.beginPath()
  ctx.moveTo(80, 920)
  ctx.lineTo(CANVAS_W - 80, 920)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#999'
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText('Terms & Conditions', CANVAS_W / 2, 965)
  ctx.fillStyle = '#777'
  ctx.font = '17px Arial, sans-serif'
  TERMS.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, 1005 + i * 30))

  ctx.fillStyle = '#555'
  ctx.font = '15px Arial, sans-serif'
  ctx.fillText('TLF GANG', CANVAS_W / 2, 1150)
}

/** Compose the full ticket PNG: band banner, event details, QR, T&Cs. */
async function buildTicketImage(ticketCode, event) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  const [bandImg, qrImg] = await Promise.all([
    loadImage(BAND_IMAGE),
    loadImage(qrImageUrl(ticketCode)),
  ])

  drawHeader(ctx, bandImg, event)
  drawQrCard(ctx, qrImg, ticketCode)
  drawFooter(ctx)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/** Compose + download the full ticket PNG. Reused by QrDisplay and ticket rows. */
export async function downloadTicket(ticketCode, event) {
  const blob = await buildTicketImage(ticketCode, event)
  if (!blob) throw new Error('Could not render ticket')
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `ticket-${ticketCode}.png`
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

/**
 * Ticket QR image + download button.
 * Download produces a composed ticket: band banner, event details,
 * centered QR, terms & conditions.
 */
export default function QrDisplay({ ticketCode, event, size = 200 }) {
  const [downloading, setDownloading] = useState(false)
  const url = qrImageUrl(ticketCode)

  const download = async () => {
    setDownloading(true)
    try {
      await downloadTicket(ticketCode, event)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-2xl">
        <img
          src={url}
          alt={`Ticket QR ${ticketCode}`}
          width={size}
          height={size}
          className="block"
        />
      </div>
      <button
        type="button"
        onClick={download}
        disabled={downloading}
        className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Download Ticket
      </button>
    </div>
  )
}
// TODO: Add unit tests for this component

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Keyboard } from 'lucide-react'
import { callFunction } from '../../services/paymentService'

const SCANNER_ID = 'qr-reader'

/**
 * /admin/scan — venue entry verification.
 * Camera scan (or manual code entry) → verify-ticket Edge Function
 * → atomic admit/deny. Requires HTTPS for camera access.
 */
export default function AdminScanner() {
  const scannerRef = useRef(null)
  const busyRef = useRef(false) // debounce scans without re-renders
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [result, setResult] = useState(null) // { ok, title, detail }

  const verify = useCallback(async (input) => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      // input is either a scanned QR payload string or { ticket_code }
      const body = typeof input === 'string' ? { payload: input } : input
      const res = await callFunction('verify-ticket', body)
      setResult(
        res.result === 'admitted'
          ? {
              ok: true,
              title: 'ADMIT',
              detail: `${res.holder ?? 'Guest'} · ticket ${res.ticket_code?.slice(0, 8)}`,
            }
          : {
              ok: false,
              title: 'DENIED',
              detail:
                res.result === 'already_used'
                  ? `Already admitted ${res.used_at ? new Date(res.used_at).toLocaleString('en-IN') : ''}`
                  : res.result === 'cancelled'
                    ? 'Ticket was cancelled'
                    : 'Invalid ticket',
            }
      )
    } catch (err) {
      setResult({ ok: false, title: 'ERROR', detail: err.message })
    } finally {
      // brief lockout so one QR isn't scanned 10× in a second
      setTimeout(() => {
        busyRef.current = false
      }, 2000)
    }
  }, [])

  // camera lifecycle
  useEffect(() => {
    if (!cameraOn) return
    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => verify(decoded),
        () => {} // per-frame decode failures are normal
      )
      .catch((err) => {
        setCameraError(`Camera unavailable: ${err?.message ?? err}`)
        setCameraOn(false)
      })
    return () => {
      scanner.stop().catch(() => {})
      scanner.clear()
      scannerRef.current = null
    }
  }, [cameraOn, verify])

  // auto-clear the result banner
  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => setResult(null), 4000)
    return () => clearTimeout(timer)
  }, [result])

  return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-6">
      <h2 className="font-display text-2xl">Entry Scanner</h2>

      <div className="w-full glass rounded-2xl p-4">
        {cameraOn ? (
          <div id={SCANNER_ID} className="w-full rounded-xl overflow-hidden" />
        ) : (
          <button
            type="button"
            onClick={() => {
              setCameraError(null)
              setCameraOn(true)
            }}
            className="w-full py-10 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition flex flex-col items-center gap-2"
          >
            <ScanIcon />
            Enable Camera
          </button>
        )}
        {cameraError && (
          <p className="text-red-400 text-sm mt-3 text-center">{cameraError}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowManual((v) => !v)}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
      >
        <Keyboard className="w-4 h-4" />
        {showManual ? 'Hide manual entry' : 'Enter ticket code manually'}
      </button>

      {showManual && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (manualCode.trim()) verify({ ticket_code: manualCode.trim() })
            setManualCode('')
          }}
          className="w-full flex gap-2"
        >
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            placeholder="Ticket code e.g. 8F1C0893"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-white/10 text-sm hover:bg-white/20 transition"
          >
            Verify
          </button>
        </form>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`w-full rounded-2xl p-6 flex items-center gap-4 ${
              result.ok
                ? 'bg-emerald-500/15 border border-emerald-500/40'
                : 'bg-red-500/15 border border-red-500/40'
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-10 h-10 text-red-400 shrink-0" />
            )}
            <div>
              <p
                className={`font-display text-2xl ${
                  result.ok ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {result.title}
              </p>
              <p className="text-white/60 text-sm">{result.detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

function ScanIcon() {
  return (
    <svg
      className="w-10 h-10"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 12h10"
      />
    </svg>
  )
}
// TODO: Add unit tests for this component

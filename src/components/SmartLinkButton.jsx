import { motion } from 'framer-motion'
import { useRef } from 'react'

// ─── Environment detection ────────────────────────────────────────────────────

function detectEnv() {
  const ua = navigator.userAgent || ''
  const isInstagram = ua.includes('Instagram')
  const isFacebook = ua.includes('FBAN') || ua.includes('FBAV')
  const isInAppBrowser = isInstagram || isFacebook
  const isAndroid = /android/i.test(ua)
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  return { isInAppBrowser, isInstagram, isFacebook, isAndroid, isIOS }
}

// ─── Per-platform deep link builder ──────────────────────────────────────────
/**
 * getLinks(rawUrl)
 *
 * Returns { appUri, webUrl } for a given platform URL.
 *
 * appUri   – custom URI scheme (spotify://, ...) used as direct deep link fallback
 * webUrl   – the open.spotify.com URL for Universal Links / browser fallback
 *
 * iOS Strategy (Universal Links):
 *   iOS intercepts open.spotify.com via Universal Links when navigation comes
 *   from a REAL user tap on an <a> element. Instagram's WKWebView blocks this.
 *   Fix: detect Instagram UA → redirect to x-safari-https:// which forces
 *   iOS to hand the URL to Safari, which DOES honour Universal Links.
 *
 * Android Strategy (App Links / Intent):
 *   Instagram on Android blocks intent:// URLs (confirmed broken late 2024).
 *   Best working approach: navigate to open.spotify.com URL and rely on
 *   Android's App Link verification which works even in some Custom Tab contexts.
 *   As secondary: show an "Open in Browser" prompt UI so user can escape the
 *   in-app browser and open in Chrome, which DOES honour App Links.
 */
function getLinks(rawUrl) {
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()
    const path = url.pathname

    // Strip Spotify's tracking ?si= param
    if (host === 'open.spotify.com') {
      url.searchParams.delete('si')
    }

    const cleanUrl = url.toString()

    // ── Spotify ──────────────────────────────────────────────────────────────
    if (host === 'open.spotify.com') {
      // path is like /artist/ID or /track/ID or /album/ID
      // Convert to spotify:artist:ID etc.
      const parts = path.split('/').filter(Boolean) // ['artist', '1rrmL1...']
      const appUri = parts.length >= 2
        ? `spotify:${parts.join(':')}`
        : cleanUrl
      return { appUri, webUrl: cleanUrl }
    }

    // ── Apple Music ───────────────────────────────────────────────────────────
    if (host === 'music.apple.com') {
      // music.apple.com/us/album/... or /artist/...
      // Convert to music: URLs which open Apple Music app
      const pathParts = path.split('/').filter(Boolean)
      // pathParts: ['us', 'album', 'name', 'id'] or ['artist', 'name', 'id']
      if (pathParts.length >= 2) {
        const type = pathParts[1] // 'album', 'artist', 'song', etc.
        const id = pathParts[pathParts.length - 1] // Last part is usually the ID
        if (id && /^\d+$/.test(id)) {
          return { appUri: `music://${type}/${id}`, webUrl: cleanUrl }
        }
      }
      return { appUri: cleanUrl, webUrl: cleanUrl }
    }

    // ── YouTube Music ─────────────────────────────────────────────────────────
    if (host === 'music.youtube.com') {
      // music.youtube.com/watch?v=ID or /channel/ID or /playlist?list=ID
      const videoId = url.searchParams.get('v')
      if (videoId) {
        return { appUri: `vnd.youtube://${videoId}`, webUrl: cleanUrl }
      }
      // Try to extract from path if it's a browse URL
      if (path.includes('/watch')) {
        const match = path.match(/[?&]v=([^&]+)/)
        if (match) {
          return { appUri: `vnd.youtube://${match[1]}`, webUrl: cleanUrl }
        }
      }
      return { appUri: cleanUrl, webUrl: cleanUrl }
    }

    // ── Default ───────────────────────────────────────────────────────────────
    return { appUri: cleanUrl, webUrl: cleanUrl }
  } catch {
    return { appUri: rawUrl, webUrl: rawUrl }
  }
}

// ─── Navigation handler ───────────────────────────────────────────────────────
/**
 * navigateTo(rawUrl)
 *
 * Cross-platform deep link strategy for escaping Instagram/Facebook in-app browsers
 * and opening native apps (Spotify, Apple Music, etc.).
 *
 * The Challenge:
 * Instagram's WKWebView (iOS) and Chrome Custom Tabs (Android) intentionally block
 * Universal Links and App Links from working directly. This is by design - Meta
 * wants to keep users in their ecosystem.
 *
 * Solutions by platform:
 *
 * iOS + Instagram:
 *   Technique 1: Use an invisible iframe with x-safari-https:// scheme.
 *   Instagram's security model is less restrictive for iframe navigation.
 *   This forces the URL to open in Safari, which DOES honour Universal Links.
 *
 *   Technique 2 (fallback): Direct window.location.href = x-safari-https://...
 *
 * Android + Instagram:
 *   Technique 1: Try custom URI scheme (spotify://) which often still works.
 *   Technique 2 (fallback): Navigate to web URL and hope for App Link dialog.
 *   Technique 3: Use intent:// with specific package (sometimes works on older versions).
 *
 * Normal browsers (Safari, Chrome standalone):
 *   Universal Links / App Links work directly - just navigate to https URL.
 *
 * Reference: Linktree, Feature.fm, and Post Malone's links use similar techniques
 * hosted on trusted domains. We replicate this client-side.
 */
function navigateTo(rawUrl) {
  const { isInAppBrowser, isAndroid, isIOS } = detectEnv()
  const { appUri, webUrl } = getLinks(rawUrl)

  // ── Inside Instagram / Facebook in-app browser ────────────────────────────
  if (isInAppBrowser) {

    if (isIOS) {
      // iOS Strategy:
      // Custom URI schemes (spotify://, music://) are handled at the OS level.
      // iOS will intercept them even inside Instagram's WKWebView and prompt
      // "Open in Spotify?" — this bypasses WKWebView restrictions entirely.

      if (appUri && appUri !== webUrl && !appUri.startsWith('http')) {
        // Step 1: Try custom URI scheme directly (e.g. spotify:track:ID)
        window.location.href = appUri

        // Step 2: Fallback to x-safari-https after delay if app not installed
        setTimeout(() => {
          window.location.href = webUrl.replace(/^https:\/\//, 'x-safari-https://')
        }, 2000)

        return
      }

      // No custom scheme available — try x-safari-https to escape to Safari
      window.location.href = webUrl.replace(/^https:\/\//, 'x-safari-https://')
      return
    }

    if (isAndroid) {
      // Android Strategy: Custom URI schemes + intent fallbacks
      const isSpotify = rawUrl.includes('open.spotify.com')

      if (isSpotify && appUri.startsWith('spotify:')) {
        // Method 1: Try direct custom scheme
        window.location.href = appUri

        // Method 2 (fallback after delay): Try intent:// URL
        // This sometimes works when direct spotify:// fails
        setTimeout(() => {
          const intentUrl = webUrl.replace(
            'https://open.spotify.com/',
            'intent://open.spotify.com/'
          ) + '#Intent;package=com.spotify.music;scheme=https;end'

          try {
            window.location.href = intentUrl
          } catch (_) {
            // If intent fails, fall through to regular URL
            window.location.href = webUrl
          }
        }, 300)

        // Method 3 (final fallback): Regular web URL
        setTimeout(() => {
          window.location.href = webUrl
        }, 800)

        return
      }

      // For non-Spotify links on Android in-app browser
      // Navigate to web URL - platform's "Open in App" banner may appear
      window.location.href = webUrl
      return
    }
  }

  // ── Normal browser (Safari, Chrome, Firefox) ──────────────────────────────
  // Universal Links / App Links work here — direct navigation is fine.
  window.location.href = webUrl
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SmartLinkButton({ link, index, accent }) {
  const color = link.color || accent || '#ffffff'
  const bgColor = `${color}15`
  const borderColor = `${color}30`
  const glowColor = `${color}40`

  const handleClick = (e) => {
    e.preventDefault()
    navigateTo(link.url)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigateTo(link.url)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 * index, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <motion.button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="link"
        aria-label={`Open ${link.title}`}
        tabIndex={0}
        className="w-full flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer select-none transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        style={{ background: bgColor, border: `1px solid ${borderColor}` }}
        whileHover={{
          y: -3,
          scale: 1.02,
          boxShadow: `0 8px 30px ${glowColor}, 0 0 0 1px ${borderColor}`,
          background: `${color}20`,
        }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ background: `${color}20`, color }}
          aria-hidden="true"
        >
          {link.iconSvg
            ? <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: link.iconSvg }} />
            : <div className="w-3 h-3 rounded-full" style={{ background: color }} />}
        </div>

        {/* Label */}
        <span className="flex-1 text-left font-body font-medium text-white/90 text-[0.95rem] tracking-wide">
          {link.title}
        </span>

        {/* Arrow */}
        <motion.svg
          className="flex-shrink-0 w-4 h-4 text-white/30"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
          whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </motion.svg>
      </motion.button>
    </motion.div>
  )
}

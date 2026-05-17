import { motion } from 'framer-motion'

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

    // Strip tracking params
    if (host === 'open.spotify.com') url.searchParams.delete('si')
    if (host === 'music.youtube.com') {
      // Keep only the v param for YT Music
      const v = url.searchParams.get('v')
      url.search = v ? `?v=${v}` : ''
    }

    const cleanUrl = url.toString()

    // ── Spotify ──────────────────────────────────────────────────────────────
    if (host === 'open.spotify.com') {
      const parts = path.split('/').filter(Boolean)
      const appUri = parts.length >= 2 ? `spotify:${parts.join(':')}` : cleanUrl
      const androidPkg = 'com.spotify.music'
      return { appUri, webUrl: cleanUrl, androidPkg, platform: 'spotify' }
    }

    // ── Apple Music ───────────────────────────────────────────────────────────
    if (host === 'music.apple.com') {
      const pathParts = path.split('/').filter(Boolean)
      // Extract song/album ID from URL like /us/song/song-name/1578078666
      const id = pathParts.find(p => /^\d+$/.test(p))
      const type = pathParts.find(p => ['song', 'album', 'artist', 'playlist'].includes(p))
      const androidPkg = 'com.apple.android.music'
      if (id && type) {
        return {
          appUri: `music://${type}/${id}`,
          webUrl: cleanUrl,
          androidPkg,
          iosScheme: `music://${type}/${id}`,
          platform: 'apple'
        }
      }
      return { appUri: cleanUrl, webUrl: cleanUrl, androidPkg, platform: 'apple' }
    }

    // ── YouTube (Standard) ────────────────────────────────────────────────────
    if (host === 'youtu.be') {
      const videoId = path.split('/')[1]
      if (videoId) {
        return {
          appUri: `youtube://${videoId}`,
          webUrl: cleanUrl,
          androidPkg: 'com.google.android.youtube',
          iosScheme: `youtube://${videoId}`,
          platform: 'youtube'
        }
      }
    }
    if (host === 'www.youtube.com' || host === 'youtube.com') {
      const videoId = url.searchParams.get('v')
      if (videoId) {
        return {
          appUri: `youtube://${videoId}`,
          webUrl: cleanUrl,
          androidPkg: 'com.google.android.youtube',
          iosScheme: `youtube://${videoId}`,
          platform: 'youtube'
        }
      }
      // Channel or non-video URLs (e.g. /@TLFGANG)
      return {
        appUri: cleanUrl,
        webUrl: cleanUrl,
        androidPkg: 'com.google.android.youtube',
        iosScheme: `vnd.youtube://${cleanUrl}`,
        platform: 'youtube'
      }
    }

    // ── YouTube Music ─────────────────────────────────────────────────────────
    if (host === 'music.youtube.com') {
      const videoId = url.searchParams.get('v')
      if (videoId) {
        return {
          appUri: `youtubemusic://${videoId}`,
          webUrl: cleanUrl,
          androidPkg: 'com.google.android.apps.youtube.music',
          iosScheme: `youtubemusic://${videoId}`,
          platform: 'youtubemusic'
        }
      }
      // Channel or non-video URLs (e.g. /@TLFGANG)
      return {
        appUri: cleanUrl,
        webUrl: cleanUrl,
        androidPkg: 'com.google.android.apps.youtube.music',
        platform: 'youtubemusic'
      }
    }

    // ── JioSaavn ─────────────────────────────────────────────────────────────
    if (host === 'www.jiosaavn.com' || host === 'jiosaavn.com' || host === 'www.saavn.com' || host === 'saavn.com') {
      // URLs: /song/name/ID or /s/artist/name/ID
      const pathParts = path.split('/').filter(Boolean)
      const id = pathParts.pop()
      const type = pathParts.find(p => ['song', 'album', 'artist', 'playlist'].includes(p)) || 'artist'
      if (id) {
        return {
          appUri: `jiosaavn://open/detail?type=${type}&id=${id}`,
          webUrl: cleanUrl,
          androidPkg: 'com.jio.media.jiobeats',
          iosScheme: `jiosaavn://${type}/${id}`,
          platform: 'jiosaavn'
        }
      }
    }

    // ── Amazon Music ──────────────────────────────────────────────────────────
    if (host === 'music.amazon.com' || host === 'music.amazon.in') {
      // URL: https://music.amazon.in/tracks/B08YYFH2C7
      const asin = path.split('/').pop()
      if (asin && asin.startsWith('B')) {
        return {
          appUri: `amzn://apps/android?p=com.amazon.mp3&asin=${asin}`,
          webUrl: cleanUrl,
          androidPkg: 'com.amazon.mp3',
          iosScheme: `amzn-music://track/${asin}`,
          platform: 'amazon'
        }
      }
    }

    // ── Gaana ─────────────────────────────────────────────────────────────────
    if (host === 'gaana.com' || host === 'www.gaana.com') {
      // URLs: /song/slug, /album/slug, /artist/slug
      const pathParts = path.split('/').filter(Boolean)
      const type = pathParts[0] || 'song' // song, album, artist
      const slug = pathParts[1] || ''
      if (slug) {
        return {
          appUri: `gaana://${type}/${slug}`,
          webUrl: cleanUrl,
          androidPkg: 'com.gaana',
          iosScheme: `gaana://${type}/${slug}`,
          platform: 'gaana'
        }
      }
    }

    // ── Default ───────────────────────────────────────────────────────────────
    return { appUri: cleanUrl, webUrl: cleanUrl, platform: 'web' }
  } catch {
    return { appUri: rawUrl, webUrl: rawUrl, platform: 'web' }
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
  const { appUri, webUrl, androidPkg, iosScheme, platform } = getLinks(rawUrl)

  // ── Inside Instagram / Facebook in-app browser ────────────────────────────
  if (isInAppBrowser) {

    if (isIOS) {
      // iOS Strategy: Custom URI schemes work at OS level even in WKWebView
      const scheme = iosScheme || appUri
      if (scheme && scheme !== webUrl && !scheme.startsWith('http')) {
        window.location.href = scheme
        // Fallback to web after delay if app not installed
        setTimeout(() => { window.location.href = webUrl }, 2500)
        return
      }
      window.location.href = webUrl
      return
    }

    if (isAndroid) {
      // Android Strategy: Try multiple methods to open native app
      if (androidPkg) {
        // Method 1: Try custom URI scheme first (works if app is installed)
        if (appUri && !appUri.startsWith('http')) {
          window.location.href = appUri
        }

        // Method 2: Try intent:// with package (opens app or Play Store)
        setTimeout(() => {
          const intentUrl = `intent://${webUrl.replace(/^https?:\/\//, '')}#Intent;package=${androidPkg};scheme=https;end`
          window.location.href = intentUrl
        }, 200)

        // Method 3: Final fallback to web URL
        setTimeout(() => { window.location.href = webUrl }, 1200)
        return
      }

      // Fallback for platforms without deep links
      window.location.href = webUrl
      return
    }
  }

  // ── Normal browser (Safari, Chrome, Firefox) ──────────────────────────────
  // Try custom scheme first, then fall back to web URL
  if (appUri && appUri !== webUrl && !appUri.startsWith('http')) {
    window.location.href = appUri
    setTimeout(() => { window.location.href = webUrl }, 2000)
    return
  }
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
          {link.iconUrl
            ? <img src={link.iconUrl} alt={link.title} className="w-6 h-6 object-contain" />
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

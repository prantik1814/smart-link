/**
 * Config Loader
 * Fetches and validates the JSON configuration file.
 * Supports Google Drive direct download URLs.
 */

// ─── CONFIG URL ────────────────────────────────────────────────────────────────
// Option A: Local file (default for dev / GitHub Pages)
const LOCAL_CONFIG_URL = './config.json'

// Option B: GitHub Gist (paste your raw gist URL below)
// Go to gist.github.com → create public gist with config.json → click Raw → copy URL
const GIST_URL = 'https://gist.githubusercontent.com/prantik1814/b4ed94f64c0477059aa7d59c9bb4d753/raw'

// ─── ACTIVE URL ────────────────────────────────────────────────────────────────
// Switch between LOCAL_CONFIG_URL and GIST_URL here:
export const CONFIG_URL = GIST_URL === 'YOUR_GIST_RAW_URL_HERE'
  ? LOCAL_CONFIG_URL
  : GIST_URL

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
  bandName: 'Artist',
  tagline: '',
  description: '',
  heroImage: '',
  backgroundImage: '',
  theme: {
    accentColor: '#c9a96e',
    backgroundOverlay: 'rgba(4, 4, 12, 0.82)',
  },
  links: [],
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
function validateConfig(raw) {
  const cfg = { ...DEFAULTS }

  if (typeof raw.bandName === 'string' && raw.bandName.trim()) {
    cfg.bandName = raw.bandName.trim()
  }
  if (typeof raw.tagline === 'string') cfg.tagline = raw.tagline.trim()
  if (typeof raw.description === 'string') cfg.description = raw.description.trim()
  if (typeof raw.heroImage === 'string') cfg.heroImage = raw.heroImage.trim()
  if (typeof raw.backgroundImage === 'string') cfg.backgroundImage = raw.backgroundImage.trim()

  if (raw.theme && typeof raw.theme === 'object') {
    cfg.theme = {
      accentColor: raw.theme.accentColor || DEFAULTS.theme.accentColor,
      backgroundOverlay: raw.theme.backgroundOverlay || DEFAULTS.theme.backgroundOverlay,
    }
  }

  if (Array.isArray(raw.links)) {
    cfg.links = raw.links
      .filter((l) => l && typeof l.title === 'string' && typeof l.url === 'string')
      .map((l) => ({
        title: l.title.trim(),
        url: l.url.trim(),
        color: typeof l.color === 'string' ? l.color : '#ffffff',
        iconSvg: typeof l.iconSvg === 'string' ? l.iconSvg : '',
      }))
  }

  return cfg
}

// ─── FETCH ────────────────────────────────────────────────────────────────────
export async function loadConfig(url = CONFIG_URL) {
  // Cache bust to ensure fresh data on every load (useful for campaign updates)
  const bust = `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`

  const response = await fetch(bust, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load config: HTTP ${response.status} ${response.statusText}`)
  }

  const raw = await response.json()
  return validateConfig(raw)
}

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { loadConfig } from './configLoader'
import AnimatedBackground from './components/AnimatedBackground'
import LoadingScreen from './components/LoadingScreen'
import ErrorScreen from './components/ErrorScreen'
import HeroSection from './components/HeroSection'
import SmartLinkButton from './components/SmartLinkButton'
import DescriptionSection from './components/DescriptionSection'
import Footer from './components/Footer'
import SmartLinkEditor from './pages/SmartLinkEditor'

/**
 * App
 * Root component. Handles config loading, error/loading states,
 * injects dynamic meta tags, and renders the page layout.
 */
export default function App() {
  const [config, setConfig] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMsg, setErrorMsg] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [isEditorMode, setIsEditorMode] = useState(false)

  // Check URL parameter for editor mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const editorMode = urlParams.get('editor') === 'true'
    console.log('URL params:', window.location.search, 'Editor mode:', editorMode)
    setIsEditorMode(editorMode)
    if (editorMode) {
      setShowEditor(true)
    }
  }, [])

  // ─── Load config ────────────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    setStatus('loading')
    setErrorMsg(null)
    try {
      const cfg = await loadConfig()
      setConfig(cfg)
      setStatus('ready')
      injectMetaTags(cfg)
    } catch (err) {
      console.error('[SmartLink] Config load error:', err)
      setErrorMsg(err.message || 'Unknown error')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // ─── Dynamic meta / OG injection ────────────────────────────────────────────
  function injectMetaTags(cfg) {
    // Document title
    document.title = cfg.tagline
      ? `${cfg.bandName} — ${cfg.tagline}`
      : cfg.bandName

    const setMeta = (selector, attr, value) => {
      const el = document.querySelector(selector)
      if (el && value) el.setAttribute(attr, value)
    }

    setMeta('meta[name="description"]', 'content', cfg.description || cfg.tagline)
    setMeta('meta[property="og:title"]', 'content', document.title)
    setMeta('meta[property="og:description"]', 'content', cfg.description || cfg.tagline)
    setMeta('meta[property="og:image"]', 'content', cfg.heroImage)
    setMeta('meta[name="twitter:title"]', 'content', document.title)
    setMeta('meta[name="twitter:description"]', 'content', cfg.description || cfg.tagline)
    setMeta('meta[name="twitter:image"]', 'content', cfg.heroImage)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  
  // Show editor if in editor mode
  if (showEditor) {
    return <SmartLinkEditor />
  }

  return (
    <div className="relative min-h-screen grain" role="main">

      {/* Simple top banner - fixed, always on top */}
      <div style={{
        background: '#84cc16',
        color: '#000',
        textAlign: 'center',
        padding: '10px 16px',
        fontWeight: 'bold',
        fontSize: '13px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
      }}>
        Open in Browser for better experience
      </div>
      {/* Spacer so content doesn't hide under fixed banner */}
      <div style={{ height: 40 }} />

      <AnimatePresence mode="wait">
        {/* LOADING */}
        {status === 'loading' && <LoadingScreen key="loading" />}

        {/* ERROR */}
        {status === 'error' && (
          <ErrorScreen key="error" error={errorMsg} onRetry={fetchConfig} />
        )}

        {/* READY */}
        {status === 'ready' && config && (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* ── Cinematic Background ── */}
            <AnimatedBackground
              backgroundImage={config.backgroundImage}
              overlay={config.theme.backgroundOverlay}
              accentColor={config.theme.accentColor}
            />

            {/* ── Page Content ── */}
            <div
              className="relative z-10 flex flex-col items-center min-h-screen"
              style={{ '--accent-color': config.theme.accentColor }}
            >
              {/* Hero: image + name + tagline */}
              <HeroSection
                bandName={config.bandName}
                tagline={config.tagline}
                heroImage={config.heroImage}
                accentColor={config.theme.accentColor}
              />

              {/* Platform links */}
              <nav
                className="relative z-10 w-full max-w-sm mx-auto px-5 mt-4 flex flex-col gap-3"
                aria-label="Music platform links"
              >
                {config.links.map((link, i) => (
                  <SmartLinkButton
                    key={`${link.title}-${i}`}
                    link={link}
                    index={i}
                    accent={config.theme.accentColor}
                  />
                ))}
              </nav>

              {/* Description */}
              <DescriptionSection
                description={config.description}
                accentColor={config.theme.accentColor}
              />

              {/* Footer */}
              <Footer bandName={config.bandName} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * HeroSection
 * Displays the hero/album cover image, band name, and tagline.
 * The album art has a vinyl record reveal animation and subtle glow.
 */
export default function HeroSection({ bandName, tagline, heroImage, accentColor }) {
  const [imgLoaded, setImgLoaded] = useState(false)

  const accent = accentColor || '#c9a96e'

  return (
    <motion.header
      className="relative z-10 flex flex-col items-center pt-12 pb-2 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      {/* Album / Hero Image */}
      {heroImage && (
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Glow halo behind image */}
          <motion.div
            className="absolute inset-0 rounded-2xl blur-2xl scale-110"
            style={{ background: `${accent}30` }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Image frame */}
          <div
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{
              width: 'clamp(200px, 48vw, 300px)',
              height: 'clamp(200px, 48vw, 300px)',
              border: `1px solid ${accent}30`,
              boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px ${accent}15`,
            }}
          >
            {/* Placeholder shimmer */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
            )}

            <motion.img
              src={heroImage}
              alt={`${bandName} album artwork`}
              className="w-full h-full object-cover"
              style={{ opacity: imgLoaded ? 1 : 0 }}
              animate={{ opacity: imgLoaded ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              onLoad={() => setImgLoaded(true)}
              loading="eager"
            />

            {/* Subtle inner vignette on image */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.3) 100%)',
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Band Name */}
      <motion.h1
        className="font-display text-center font-bold leading-none mb-3 text-white"
        style={{
          fontSize: 'clamp(2rem, 8vw, 3.5rem)',
          letterSpacing: '-0.02em',
          textShadow: '0 2px 30px rgba(0,0,0,0.5)',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {bandName}
      </motion.h1>

      {/* Tagline */}
      {tagline && (
        <motion.p
          className="font-mono text-center uppercase tracking-[0.2em] text-sm mb-1"
          style={{ color: accent }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {tagline}
        </motion.p>
      )}

      {/* Divider line */}
      <motion.div
        className="mt-6 mb-2"
        style={{ height: 1, width: 48, background: `${accent}50` }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      />
    </motion.header>
  )
}

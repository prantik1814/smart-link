import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

/**
 * AnimatedBackground
 * Full-screen cinematic background with:
 *  - Optional background image with subtle scale animation
 *  - Dark overlay from config
 *  - Floating gradient orbs for depth
 *  - Mouse parallax on desktop
 */
export default function AnimatedBackground({ backgroundImage, overlay, accentColor }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { stiffness: 30, damping: 25, mass: 1 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  const orbX = useTransform(x, (v) => v * 0.025)
  const orbY = useTransform(y, (v) => v * 0.025)

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - window.innerWidth / 2)
      mouseY.set(e.clientY - window.innerHeight / 2)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Derive a dimmer version of the accent for orbs
  const orbColor = accentColor || '#c9a96e'

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Background image layer */}
      {backgroundImage ? (
        <motion.div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
        />
      ) : (
        /* Fallback: deep dark gradient */
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: overlay || 'rgba(4,4,12,0.82)' }}
      />

      {/* Floating gradient orbs — add depth */}
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 600,
          height: 600,
          top: '-15%',
          left: '-10%',
          background: `radial-gradient(circle, ${orbColor}18 0%, transparent 70%)`,
          x: orbX,
          y: orbY,
        }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 500,
          height: 500,
          bottom: '-10%',
          right: '-8%',
          background: `radial-gradient(circle, ${orbColor}12 0%, transparent 70%)`,
          x: useTransform(orbX, (v) => v * -1),
          y: useTransform(orbY, (v) => v * -1),
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />
    </div>
  )
}

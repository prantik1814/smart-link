import { motion } from 'framer-motion'

/**
 * LoadingScreen
 * Full-screen cinematic loading state with vinyl record animation.
 */
export default function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Vinyl record */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer glow rings */}
        <div className="absolute w-24 h-24 rounded-full border border-white/10 ring-pulse" />
        <div
          className="absolute w-24 h-24 rounded-full border border-white/5 ring-pulse"
          style={{ animationDelay: '0.8s' }}
        />

        {/* Vinyl disc */}
        <div className="vinyl-spin w-20 h-20 rounded-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl">
          {/* Grooves */}
          <div className="w-14 h-14 rounded-full border border-white/5 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center">
              {/* Label */}
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-600 to-amber-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading text */}
      <motion.p
        className="font-mono text-xs tracking-[0.3em] uppercase text-white/30"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        Loading
      </motion.p>
    </motion.div>
  )
}

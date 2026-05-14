import { motion } from 'framer-motion'

/**
 * DescriptionSection
 * Centered artist / release description below the link buttons.
 */
export default function DescriptionSection({ description, accentColor }) {
  if (!description) return null

  const accent = accentColor || '#c9a96e'

  return (
    <motion.section
      className="relative z-10 w-full max-w-sm mx-auto px-6 pt-8 pb-4"
      aria-label="Artist description"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Decorative element */}
      <div className="flex items-center gap-3 mb-5 justify-center">
        <div className="h-px flex-1" style={{ background: `${accent}25` }} />
        <div
          className="w-1 h-1 rounded-full"
          style={{ background: `${accent}60` }}
          aria-hidden="true"
        />
        <div className="h-px flex-1" style={{ background: `${accent}25` }} />
      </div>

      <p
        className="text-center text-white/50 leading-relaxed font-body"
        style={{ fontSize: 'clamp(0.8rem, 3vw, 0.9rem)' }}
      >
        {description}
      </p>
    </motion.section>
  )
}

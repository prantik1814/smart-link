import { motion } from 'framer-motion'

/**
 * Footer
 * Minimal footer with "Powered by" text and optional copyright.
 */
export default function Footer({ bandName }) {
  const year = new Date().getFullYear()

  return (
    <motion.footer
      className="relative z-10 w-full text-center pb-10 pt-4 px-6"
      role="contentinfo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 1.0 }}
    >
      <p className="text-white/20 text-xs font-mono tracking-widest uppercase">
        &copy; {year} {bandName}
      </p>
    </motion.footer>
  )
}

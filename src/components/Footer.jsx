import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

/**
 * Footer
 * Minimal footer with policy links and copyright.
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
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mb-4 text-xs text-white/40">
        <Link to="/terms" className="hover:text-white transition">Terms & Conditions</Link>
        <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
        <Link to="/refunds" className="hover:text-white transition">Refund & Cancellation</Link>
        <Link to="/contact" className="hover:text-white transition">Contact Us</Link>
      </nav>
      <p className="text-white/20 text-xs font-mono tracking-widest uppercase">
        &copy; {year} {bandName}
      </p>
    </motion.footer>
  )
}

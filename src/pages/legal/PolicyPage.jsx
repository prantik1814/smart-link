import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const ACCENT = '#b45309'

/**
 * Shared renderer for legal/compliance pages (terms, privacy, refunds, contact).
 * Content comes from ./legalContent — one structured doc per page.
 */
export default function PolicyPage({ doc }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <Link to="/" className="text-white/50 text-sm hover:text-white transition">
          ← Back
        </Link>

        <h1 className="font-display text-3xl md:text-4xl mt-8 mb-1" style={{ color: ACCENT }}>
          {doc.title}
        </h1>
        <p className="text-white/30 text-xs font-mono tracking-widest uppercase mb-10">
          {doc.updated}
        </p>

        <div className="flex flex-col gap-8">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-white/90 font-semibold mb-2">{section.heading}</h2>
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-white/60 text-sm leading-relaxed mb-2">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <nav className="mt-14 pt-6 border-t border-white/10 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/40">
          <Link to="/terms" className="hover:text-white transition">Terms & Conditions</Link>
          <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link to="/refunds" className="hover:text-white transition">Refund & Cancellation</Link>
          <Link to="/contact" className="hover:text-white transition">Contact Us</Link>
        </nav>
      </motion.div>
    </div>
  )
}

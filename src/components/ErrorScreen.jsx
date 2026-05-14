import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * ErrorScreen
 * Displayed when the config fetch fails.
 */
export default function ErrorScreen({ error, onRetry }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="glass rounded-2xl p-8 max-w-sm w-full text-center"
      >
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="font-display text-xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-white/50 text-sm mb-1 font-body">
          Could not load the page configuration.
        </p>
        {error && (
          <p className="text-white/30 text-xs font-mono mt-2 mb-6 break-all">
            {error}
          </p>
        )}
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium text-black bg-white hover:bg-white/90 transition-colors"
          aria-label="Retry loading the page"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    </motion.div>
  )
}

import { Minus, Plus } from 'lucide-react'

/**
 * Ticket quantity stepper with live total.
 * pricePaise comes from the events table (admin-managed).
 */
export default function QuantitySelector({
  quantity,
  max,
  pricePaise,
  onChange,
  accentColor = '#b45309',
}) {
  const total = quantity * pricePaise

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-5">
        <StepperButton
          onClick={() => onChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          label="Decrease quantity"
        >
          <Minus className="w-5 h-5" />
        </StepperButton>

        <span className="text-5xl font-bold text-white w-16 text-center tabular-nums">
          {quantity}
        </span>

        <StepperButton
          onClick={() => onChange(Math.min(max, quantity + 1))}
          disabled={quantity >= max}
          label="Increase quantity"
        >
          <Plus className="w-5 h-5" />
        </StepperButton>
      </div>

      <p className="text-white/40 text-xs">
        Max {max} tickets per order
      </p>

      <div className="text-center">
        <p className="text-white/50 text-sm">Total</p>
        <p className="text-5xl font-bold text-white tabular-nums">
          ₹{(total / 100).toLocaleString('en-IN')}
        </p>
        <p className="text-white/30 text-xs mt-1">
          ₹{(pricePaise / 100).toLocaleString('en-IN')} per ticket
        </p>
      </div>
    </div>
  )
}

function StepperButton({ children, label, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
      {...props}
    >
      {children}
    </button>
  )
}
// TODO: Add unit tests for this component

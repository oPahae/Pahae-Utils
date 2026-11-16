export default function ProgressBar({ value, label }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div className="w-full" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-600">
        <span>{label}</span>
        <span>{clamped} %</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-ink-800 transition-all duration-300 ease-out" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

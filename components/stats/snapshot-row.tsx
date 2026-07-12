export function SnapshotRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="bg-glass-subtle flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-sm text-slate-300">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

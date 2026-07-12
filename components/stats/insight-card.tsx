import { Card, CardContent } from '@/components/ui/card'

export function InsightCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
  accent: string
}) {
  return (
    <Card className="border-border bg-surface py-0">
      <CardContent className="relative overflow-hidden px-4 py-4 sm:px-5">
        <div className={`pointer-events-none absolute inset-0 ${accent}`} />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-xs text-text-sub">
            <Icon className="h-3.5 w-3.5 text-violet-mid" />
            {label}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-text-sub">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

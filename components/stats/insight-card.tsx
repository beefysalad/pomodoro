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
    <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
      <CardContent className="relative overflow-hidden px-4 py-4 sm:px-5">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Icon className="h-3.5 w-3.5 text-slate-200" />
            {label}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-300">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

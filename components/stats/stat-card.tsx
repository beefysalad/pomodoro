import { Card, CardContent } from '@/components/ui/card'

export function StatCard({
  id,
  icon: Icon,
  label,
  value,
}: {
  id?: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card id={id} className="py-0 backdrop-blur-xl">
      <CardContent className="flex items-center justify-between px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{value}</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-2.5">
          <Icon className="h-4 w-4 text-slate-100" />
        </div>
      </CardContent>
    </Card>
  )
}

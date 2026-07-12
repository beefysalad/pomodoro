import { Card, CardContent } from '@/components/ui/card'

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="py-0 backdrop-blur-xl">
      <CardContent className="px-4 py-4 sm:px-5">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-white">{value}</p>
      </CardContent>
    </Card>
  )
}

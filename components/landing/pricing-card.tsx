'use client'

interface PricingCardProps {
  plan: string
  price: number
  desc: string
  features: string[]
  highlighted: boolean
  currency: string
}

export function PricingCard({
  plan,
  price,
  desc,
  features,
  highlighted,
  currency,
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
        highlighted
          ? 'border-violet/40 from-violet/[0.12] bg-gradient-to-b to-indigo-500/[0.04] shadow-[0_0_60px_rgba(124,58,237,0.15)]'
          : 'border-border bg-surface hover:border-border-up'
      }`}
    >
      {highlighted && (
        <div className="from-violet absolute top-4 right-4 rounded-full bg-gradient-to-r to-indigo-400 px-3 py-1 text-[9px] font-[700] tracking-[0.12em] text-white uppercase">
          Most Popular
        </div>
      )}
      <p
        className={`mb-2 text-[10px] font-[700] tracking-[0.14em] uppercase ${highlighted ? 'text-violet-mid' : 'text-muted-foreground'}`}
      >
        {plan}
      </p>
      <div className="text-foreground mb-1 text-[40px] leading-none font-[900] tracking-[-0.04em]">
        {price === 0 ? (
          'Free'
        ) : (
          <>
            {currency}
            {price}
            <span className="text-muted-foreground text-[15px] font-[400]">
              /mo
            </span>
          </>
        )}
      </div>
      <p className="text-muted-foreground mb-6 text-[13px] leading-relaxed">
        {desc}
      </p>
      <ul className="mb-7 flex flex-col gap-2.5">
        {features.map((f, i) => (
          <li
            key={i}
            className="text-text-sub flex items-center gap-2.5 text-[13px]"
          >
            <span className={highlighted ? 'text-violet-mid' : 'text-success'}>
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>
      <button
        className={`mt-auto w-full cursor-pointer rounded-xl py-3 text-[13px] font-[700] tracking-[0.04em] transition-all hover:-translate-y-px ${
          highlighted
            ? 'border-violet bg-violet border text-white shadow-[0_0_24px_var(--color-violet-glow)] hover:shadow-[0_0_36px_var(--color-violet-glow)]'
            : 'border-border bg-surface-up text-muted-foreground hover:text-foreground border'
        }`}
      >
        {price === 0 ? 'Get started free' : 'Start free trial'}
      </button>
    </div>
  )
}

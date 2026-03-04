import React from 'react'

const FeatureCard = ({
  icon: Icon,
  accentColor,
  accentBg,
  label,
  title,
  children,
  footer,
}: {
  icon: React.ElementType
  accentColor: string
  accentBg: string
  label: string
  title: string
  children: React.ReactNode
  footer: React.ReactNode
}) => {
  return (
    <div className="group border-border bg-surface hover:border-border-up hover:bg-surface-up relative flex flex-col overflow-hidden rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${accentBg}`}
      >
        <Icon className={`h-5 w-5 ${accentColor}`} />
      </div>
      <p
        className={`mb-2 text-[10px] font-[700] tracking-[0.14em] uppercase ${accentColor}`}
      >
        {label}
      </p>
      <h3 className="text-foreground mb-2.5 text-[15px] font-[800] tracking-[-0.02em]">
        {title}
      </h3>
      <p className="text-muted-foreground mb-5 text-[12px] leading-[1.75]">
        {children}
      </p>
      <div className="mt-auto">{footer}</div>
    </div>
  )
}

export default FeatureCard

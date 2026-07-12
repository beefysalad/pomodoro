import type { UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SettingField({
  label,
  hint,
  registration,
  error,
  disabled,
}: {
  label: string
  hint: string
  registration: UseFormRegisterReturn
  error?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-white">
        {label} minutes
      </Label>
      <Input
        type="number"
        inputMode="numeric"
        placeholder={hint}
        {...registration}
        disabled={disabled}
        className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
      />
      <p className={error ? 'text-xs text-rose-300' : 'text-xs text-slate-400'}>
        {error ?? hint}
      </p>
    </div>
  )
}

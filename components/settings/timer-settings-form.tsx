import type {
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from 'react-hook-form'
import { Timer, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SettingField } from '@/components/settings/setting-field'
import type { TimerSettingsFormInput } from '@/lib/schemas/user'

export function TimerSettingsForm({
  register,
  errors,
  watch,
  isBusy,
  onSave,
}: {
  register: UseFormRegister<TimerSettingsFormInput>
  errors: FieldErrors<TimerSettingsFormInput>
  watch: UseFormWatch<TimerSettingsFormInput>
  isBusy: boolean | undefined
  onSave: () => void
}) {
  return (
    <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
      <CardContent className="space-y-5 px-4 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <SettingField
            label="Blitz"
            hint="5 to 120 min"
            registration={register('blitzMinutes')}
            error={errors.blitzMinutes?.message}
            disabled={isBusy}
          />
          <SettingField
            label="Focus"
            hint="10 to 180 min"
            registration={register('focusMinutes')}
            error={errors.focusMinutes?.message}
            disabled={isBusy}
          />
          <SettingField
            label="Deep"
            hint="15 to 240 min"
            registration={register('deepMinutes')}
            error={errors.deepMinutes?.message}
            disabled={isBusy}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingField
            label="Short break"
            hint="1 to 30 min"
            registration={register('shortBreakMinutes')}
            error={errors.shortBreakMinutes?.message}
            disabled={isBusy}
          />
          <SettingField
            label="Long break"
            hint="5 to 60 min"
            registration={register('longBreakMinutes')}
            error={errors.longBreakMinutes?.message}
            disabled={isBusy}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-200">
            <Timer className="h-3.5 w-3.5" />
            Current preview
          </span>
          <p className="mt-1">
            Blitz {String(watch('blitzMinutes') || '-')}m · Focus{' '}
            {String(watch('focusMinutes') || '-')}m · Deep{' '}
            {String(watch('deepMinutes') || '-')}m · Short break{' '}
            {String(watch('shortBreakMinutes') || '-')}m · Long break{' '}
            {String(watch('longBreakMinutes') || '-')}m
          </p>
        </div>

        <Button
          onClick={onSave}
          disabled={isBusy}
          className="bg-violet-600 text-white hover:bg-violet-500"
        >
          <Save className="h-4 w-4" />
          Save settings
        </Button>
      </CardContent>
    </Card>
  )
}

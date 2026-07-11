import { z } from 'zod'

export const UpdateUserSchemaApi = z.object({
  onboarded: z.boolean().optional(),
  timezone: z.string().optional(),
  blitzMinutes: z.number().int().min(5).max(120).optional(),
  focusMinutes: z.number().int().min(10).max(180).optional(),
  deepMinutes: z.number().int().min(15).max(240).optional(),
  shortBreakMinutes: z.number().int().min(1).max(30).optional(),
  longBreakMinutes: z.number().int().min(5).max(60).optional(),
  hasSeenTutorial: z.boolean().optional(),
})

export type TUpdateUserSchemaApi = z.infer<typeof UpdateUserSchemaApi>

export const TimerSettingsFormSchema = z
  .object({
    blitzMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(5).max(120)
    ),
    focusMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(10).max(180)
    ),
    deepMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(15).max(240)
    ),
    shortBreakMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(1).max(30)
    ),
    longBreakMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(5).max(60)
    ),
  })
  .superRefine((data, ctx) => {
    if (data.longBreakMinutes < data.shortBreakMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Long break should be greater than or equal to short break.',
        path: ['longBreakMinutes'],
      })
    }
  })

export type TimerSettingsFormInput = z.input<typeof TimerSettingsFormSchema>
export type TimerSettingsFormValues = z.output<typeof TimerSettingsFormSchema>

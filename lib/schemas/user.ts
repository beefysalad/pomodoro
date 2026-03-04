import { z } from 'zod'

export const UpdateUserSchemaApi = z.object({
  onboarded: z.boolean().optional(),
  timezone: z.string().optional(),
})

export type TUpdateUserSchemaApi = z.infer<typeof UpdateUserSchemaApi>

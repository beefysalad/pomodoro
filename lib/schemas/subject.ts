import { z } from 'zod'

export const SUBJECT_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#64748B', // Slate
] as const

export const CreateSubjectSchemaApi = z.object({
  name: z.string().min(1, {
    message: 'Name is required',
  }),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color')
    .optional(),
})

export type TCreateSubjectSchemaApi = z.infer<typeof CreateSubjectSchemaApi>

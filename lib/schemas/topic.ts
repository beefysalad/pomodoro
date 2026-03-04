import { z } from 'zod'

export const CreateTopicSchemaApi = z.object({
  name: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export type TCreateTopicSchemaApi = z.infer<typeof CreateTopicSchemaApi>

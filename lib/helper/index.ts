import prisma from '../prisma'
import slugify from 'slugify'

export const generateUniqueSlug = async (
  text: string,
  maxAttempts = 10
): Promise<string> => {
  const baseSlug = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  })

  for (let i = 0; i < maxAttempts; i++) {
    const slug = i === 0 ? baseSlug : `${baseSlug}-${i}`

    const exists = await prisma.subject.findUnique({
      where: { slug },
    })

    if (!exists) {
      return slug
    }
  }

  throw new Error('Failed to generate unique slug')
}

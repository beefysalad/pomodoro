import 'dotenv/config'
import prisma from '../lib/prisma'

// Basic slugify function
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
}

async function main() {
  console.log('Fetching subjects without slugs...')
  const subjects = await prisma.subject.findMany({
    where: {
      OR: [{ slug: null }, { slug: '' }],
    },
  })

  console.log(`Found ${subjects.length} subjects to backfill.`)

  for (const subject of subjects) {
    let baseSlug = slugify(subject.name)
    if (!baseSlug) baseSlug = 'subject'

    let slug = baseSlug
    let counter = 1
    let isUnique = false

    // Ensure uniqueness per user
    while (!isUnique) {
      const existing = await prisma.subject.findFirst({
        where: { userId: subject.userId, slug },
      })

      if (!existing || existing.id === subject.id) {
        isUnique = true
      } else {
        slug = `${baseSlug}-${counter}`
        counter++
      }
    }

    await prisma.subject.update({
      where: { id: subject.id },
      data: { slug },
    })
    console.log(`Updated subject "${subject.name}" with slug: ${slug}`)
  }

  console.log('Backfill complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

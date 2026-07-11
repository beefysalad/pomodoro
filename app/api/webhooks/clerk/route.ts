import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import * as userRepository from '@/lib/repositories/user-repository'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    )
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id: clerkUserId, email_addresses, last_name, first_name } = evt.data
    const email = email_addresses[0]?.email_address

    if (!clerkUserId || !email) {
      return new Response('Error: Missing clerk ID or email', { status: 400 })
    }

    try {
      await userRepository.createByClerkId(prisma, {
        clerkUserId,
        email,
        firstName: first_name ?? '',
        lastName: last_name ?? '',
      })
    } catch (error) {
      console.error('Error creating user in database:', error)
      return new Response('Error creating user', { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    const { id: clerkUserId, email_addresses, last_name, first_name } = evt.data
    const email = email_addresses?.[0]?.email_address

    if (!clerkUserId || !email) {
      return new Response('Error: Missing clerk ID or email', { status: 400 })
    }

    try {
      await userRepository.updateByClerkId(prisma, clerkUserId, {
        email,
        firstName: first_name ?? '',
        lastName: last_name ?? '',
      })
    } catch (error) {
      console.error('Error updating user in database:', error)
      return new Response('Error updating user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id: clerkUserId } = evt.data

    if (!clerkUserId) {
      return new Response('Error: Missing clerk ID', { status: 400 })
    }

    try {
      await userRepository.deleteByClerkId(prisma, clerkUserId)
    } catch (error) {
      console.error('Error deleting user from database:', error)
      return new Response('Error deleting user', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}

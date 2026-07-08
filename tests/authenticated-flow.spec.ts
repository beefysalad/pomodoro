import { test, expect } from '@playwright/test'
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright'

// These tests require a real Clerk test user with the "password" strategy
// enabled on this instance. To run them locally or in CI:
//   1. Create a user in the Clerk Dashboard for this dev instance.
//   2. Set E2E_CLERK_USER_USERNAME (their email) and E2E_CLERK_USER_PASSWORD.
// Without those, this whole suite is skipped (not failed) so CI stays green.
const TEST_EMAIL = process.env.E2E_CLERK_USER_USERNAME
const TEST_PASSWORD = process.env.E2E_CLERK_USER_PASSWORD

test.describe('Authenticated flow', () => {
  test.skip(
    !TEST_EMAIL || !TEST_PASSWORD,
    'Set E2E_CLERK_USER_USERNAME / E2E_CLERK_USER_PASSWORD to run this suite'
  )

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/')
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_EMAIL!,
        password: TEST_PASSWORD!,
      },
    })
  })

  test('signed-in user reaches the app instead of being redirected to sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/)
  })

  test('completes the onboarding subject/topic steps when not yet onboarded', async ({
    page,
  }) => {
    await page.goto('/onboarding')

    if (!page.url().includes('/onboarding')) {
      test.skip(true, 'Test user has already completed onboarding')
    }

    await page.getByRole('button', { name: 'Begin setup' }).click()

    const subjectName = `E2E Subject ${Date.now()}`
    await page.locator('#subject-name').fill(subjectName)
    await page.getByRole('button', { name: 'Add subject' }).click()

    await expect(
      page.getByRole('heading', { name: 'Add your first topic' })
    ).toBeVisible()

    const topicName = `E2E Topic ${Date.now()}`
    await page.locator('#topic-name').fill(topicName)
    await page.getByRole('button', { name: 'Add topic' }).click()

    await expect(
      page.getByRole('heading', { name: 'Set your timer style' })
    ).toBeVisible()
  })
})

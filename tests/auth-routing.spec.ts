import { test, expect } from '@playwright/test'

// Verifies the Clerk middleware gate (proxy.ts) actually protects routes, and
// that basic pages render, without needing a signed-in session.

const PROTECTED_ROUTES = [
  '/dashboard',
  '/onboarding',
  '/stats',
  '/leaderboard',
  '/subjects',
  '/settings',
]

test.describe('Route protection (signed out)', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects an unauthenticated visitor to sign-in`, async ({
      page,
    }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/sign-in/)
    })
  }
})

test.describe('Public pages', () => {
  test('sign-in page renders', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page).toHaveURL(/\/sign-in/)
    await expect(page.locator('body')).not.toContainText(
      'Application error'
    )
  })

  test('sign-up page renders', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page).toHaveURL(/\/sign-up/)
    await expect(page.locator('body')).not.toContainText(
      'Application error'
    )
  })

  test('unknown route shows the 404 page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expect(
      page.getByRole('heading', { name: '404 - Not Found' })
    ).toBeVisible()
    await page.getByRole('link', { name: 'Return Home' }).click()
    await expect(page).toHaveURL('/')
  })
})

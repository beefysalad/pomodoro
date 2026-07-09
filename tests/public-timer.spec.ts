import { test, expect } from '@playwright/test'

// Covers the unauthenticated demo timer on the homepage (components/public-timer.tsx).
// No Clerk auth needed — these exercise real user-visible behavior end to end.

test.describe('Public demo timer', () => {
  test('homepage renders with title and signed-out CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Tempo/)
    await expect(
      page.getByRole('navigation').getByRole('button', { name: 'Sign in' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Get started' })
    ).toBeVisible()
  })

  test('defaults to Focus mode and switches to Blitz/Deep durations', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.getByText('25:00', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: /Blitz/ }).click()
    await expect(page.getByText('10:00', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: /Deep/ }).click()
    await expect(page.getByText('50:00', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: /^Focus/ }).click()
    await expect(page.getByText('25:00', { exact: true })).toBeVisible()
  })

  test('accepts a task label', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('What are you working on?')
    await input.fill('Write essay draft')
    await expect(input).toHaveValue('Write essay draft')
  })

  test('start hides mode switcher; pause brings it back; reset restores duration', async ({
    page,
  }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
    // Homepage timer is "immersive": mode buttons unmount while running.
    await expect(page.getByRole('button', { name: /Blitz/ })).toHaveCount(0)

    // Let a couple of seconds elapse so remaining < total (deterministic "Resume" label).
    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: 'Pause' }).click()

    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Blitz/ })).toBeVisible()

    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Start', exact: true })
    ).toBeVisible()
    await expect(page.getByText('25:00', { exact: true })).toBeVisible()
  })
})

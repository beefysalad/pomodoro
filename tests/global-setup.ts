import { clerkSetup } from '@clerk/testing/playwright'

// Best-effort: fetches a Clerk testing token so tests can bypass bot detection.
// Wrapped in try/catch so environments without CLERK_SECRET_KEY (e.g. a CI job
// that only runs the unauthenticated suite) don't fail the whole run — the
// authenticated tests skip themselves individually when their own env vars
// are missing (see authenticated-flow.spec.ts).
export default async function globalSetup() {
  try {
    await clerkSetup()
  } catch (error) {
    console.warn(
      '[global-setup] Skipping Clerk testing-token setup:',
      error instanceof Error ? error.message : error
    )
  }
}

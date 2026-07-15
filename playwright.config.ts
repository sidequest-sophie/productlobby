import { defineConfig, devices } from '@playwright/test'

/**
 * ProductLobby E2E config.
 *
 * The suite talks to a real (dev/staging) server and a shared database, so:
 *  - workers is pinned to 1 — tests are not isolated from each other at the
 *    data layer (no per-test DB reset), so parallel runs would race.
 *  - retries is 0 — a flaky pass on retry would hide real bugs; we'd rather
 *    see the failure.
 *  - baseURL comes from BASE_URL so this can point at localhost, a preview
 *    deployment, or staging without editing the file.
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

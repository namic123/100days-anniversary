import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  timeout: 60_000,
  // The smoke test drives the heavy WebGL gift scene, which can init slowly on
  // CI's headless/software renderer; retry there so a one-off flake doesn't
  // fail the deploy. Locally (no retries) a real failure still surfaces.
  retries: process.env.CI ? 2 : 0,
  expect: {
    timeout: 5_000,
  },
  use: {
    trace: 'on-first-retry',
    // Allow SwiftShader if chromium chooses it, but don't force a GL backend —
    // the smoke test advances through the gift scene whether WebGL renders or
    // the CSS fallback is shown, so it must not depend on headless WebGL.
    launchOptions: {
      args: ['--enable-unsafe-swiftshader'],
    },
  },
  projects: [
    {
      name: 'mobile-chrome-390',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
})

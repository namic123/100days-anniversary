import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    trace: 'on-first-retry',
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

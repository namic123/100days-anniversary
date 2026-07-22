import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  // Generous: under headless SwiftShader (software WebGL) the scene renders at a
  // low frame rate, so the timed 3D choreography runs slower than on real GPUs.
  timeout: 120_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    trace: 'on-first-retry',
    // Enable WebGL in headless CI via SwiftShader (software ANGLE backend) so
    // the real three.js gift scene renders instead of the CSS fallback.
    launchOptions: {
      args: [
        '--enable-unsafe-swiftshader',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--ignore-gpu-blocklist',
      ],
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

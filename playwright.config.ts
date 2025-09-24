import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: 'e2e',
  testMatch: /.*\.spec\.ts$/,
  webServer: {
    command: ".tools/node/bin/node node_modules/next/dist/bin/next build && .tools/node/bin/node node_modules/next/dist/bin/next start -p 3000",
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: 'file:./dev.db',
      NEXTAUTH_SECRET: 'test-secret',
      NEXTAUTH_URL: 'http://localhost:3000'
    }
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
}

export default config

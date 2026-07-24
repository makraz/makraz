import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'ALLOW_MISSING_TURNSTILE=1 npm run build && npm run preview -- --port 4331',
    url: 'http://localhost:4331/fr',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: { baseURL: 'http://localhost:4331' },
});

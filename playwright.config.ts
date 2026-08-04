import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  // Never reuse a server that happens to be listening. Reuse skips the build step entirely, so the
  // suite would silently test whatever build that process is holding — green against stale code, or
  // red for pages that exist in the tree but not in the running server. It also collided with a
  // local `astro dev` once and failed the whole run with "webServer was not able to start".
  webServer: {
    command: 'ALLOW_MISSING_TURNSTILE=1 npm run build && npm run preview -- --port 4331',
    url: 'http://localhost:4331/fr',
    reuseExistingServer: false,
    timeout: 180_000,
  },
  // The suite runs against a wrangler dev server, which occasionally drops a request while warming
  // up — that is what the intermittent /ar/contact and /en/contact failures were. One retry keeps a
  // cold-start hiccup from failing the run, and a retried test is still reported as "flaky" rather
  // than passing silently, so a real regression stays visible.
  retries: process.env.CI ? 2 : 1,
  use: { baseURL: 'http://localhost:4331' },
});

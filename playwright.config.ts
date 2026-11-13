import { defineConfig, devices } from "@playwright/test";

// PORT lets parallel worktrees run their own preview server.
const PORT = Number(process.env.PORT ?? 4321);
const REAL_PORT = Number(process.env.REAL_PORT ?? PORT + 1);
const BASE = `http://localhost:${PORT}`;
const REAL_BASE = `http://localhost:${REAL_PORT}`;

// Specs (and the catalog.ts they import) read the fixture data, not data/.
// Set here so Playwright's worker processes inherit it.
process.env.FREESTACK_DATA = "tests/fixtures/data";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /real-data\.spec\.ts/ },
    { name: "real-data", use: { ...devices["Desktop Chrome"], baseURL: REAL_BASE }, testMatch: /real-data\.spec\.ts/ },
  ],
  webServer: {
    // Fixture build on PORT, real build on REAL_PORT (scripts/e2e-server.mjs).
    command: "node scripts/e2e-server.mjs",
    env: { PORT: String(PORT), REAL_PORT: String(REAL_PORT) },
    url: `${REAL_BASE}/__ready`,
    reuseExistingServer: !process.env.CI,
    timeout: 420_000,
  },
});

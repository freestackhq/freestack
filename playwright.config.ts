import { defineConfig, devices } from "@playwright/test";

// PORT lets parallel worktrees run their own preview server.
const PORT = Number(process.env.PORT ?? 4321);
const BASE = `http://localhost:${PORT}`;

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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && node scripts/preview-wrapper.mjs",
    env: { PORT: String(PORT) },
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
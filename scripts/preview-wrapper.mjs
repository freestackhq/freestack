#!/usr/bin/env node
/**
 * Foreground wrapper around `astro preview` for Playwright's webServer.
 *
 * `astro preview` daemonizes by default, which makes Playwright's webServer
 * think the process exited immediately. This wrapper starts the daemon, waits
 * for it to answer, then stays alive (tailing its log) until killed.
 */
import { spawnSync } from "node:child_process";

const PORT = process.env.PORT ?? "4321";
const BASE = `http://127.0.0.1:${PORT}`;

spawnSync("pnpm", ["astro", "preview", "--port", PORT], {
  stdio: "inherit",
});

const deadline = Date.now() + 90_000;
while (Date.now() < deadline) {
  try {
    const res = await fetch(`${BASE}/api/health`);
    if (res.ok) {
      console.log(`preview wrapper: healthy at ${BASE}`);
      break;
    }
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 500));
}

// Keep the process alive; on SIGTERM/INT stop the daemon.
const stop = () => {
  spawnSync("pnpm", ["astro", "preview", "stop"], {
    stdio: "inherit",
  });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

setInterval(() => {}, 1000);
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import {
  USER_AGENT,
  hashText,
  nextEntry,
  readState,
  scan,
  serializeState,
  visibleText,
} from "../../scripts/ops/pricing-scan.mjs";
import { loadTools } from "../../scripts/ops/tools.mjs";

const FIX = new URL("../fixtures/ops/", import.meta.url).pathname;
const html = readFileSync(join(FIX, "html/pricing.html"), "utf8");
const DAY = "2026-11-13";

/** A fetch stand-in that serves fixed bodies per URL; anything else 404s. */
function fakeFetch(pages: Record<string, string | Error | number>) {
  return vi.fn(async (url: string) => {
    const page = pages[url];
    if (page instanceof Error) throw page;
    if (typeof page === "number") return new Response("nope", { status: page });
    if (page === undefined) return new Response("missing", { status: 404 });
    return new Response(page, { status: 200, headers: { "content-type": "text/html" } });
  });
}

describe("visibleText", () => {
  const text = visibleText(html);

  it("keeps the prices people read", () => {
    expect(text).toContain("Pricing Free 0.5 GB storage & 190 compute hours Launch $19 / month");
  });

  it("drops head, nav, footer, scripts, styles and comments", () => {
    for (const gone of ["Home", "Docs", "color:red", "__DATA__", "Alpha Inc", "build 8c1e2f", "<"]) {
      expect(text).not.toContain(gone);
    }
  });

  it("drops dates, times, years and tokens", () => {
    expect(text).not.toMatch(/2026|10:42|Nov 13/);
    expect(text).not.toContain("q8W3e5R7t9Y1u3I5o7P9a1S3d5F7g9H2j4K6");
    expect(text).toBe("Pricing Free 0.5 GB storage & 190 compute hours Launch $19 / month Prices updated at");
  });

  it("collapses whitespace", () => {
    expect(visibleText("<p>a\n\n   b</p>\t<p>c</p>")).toBe("a b c");
  });
});

describe("hashText", () => {
  it("is a stable sha256", () => {
    expect(hashText("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("ignores volatile bits, whitespace and markup moves", () => {
    const later = html
      .replace("Nov 13, 2026 at 10:42 am", "Dec 2, 2026 at 9:03 pm")
      .replace(/zZ9xY8wV7uT6sR5qP4oN3mL2kJ1iH0gF/, "differentTokenValue0000000000000000")
      .replace("q8W3e5R7t9Y1u3I5o7P9a1S3d5F7g9H2j4K6", "m1N2b3V4c5X6z7L8k9J0h1G2f3D4s5A6p7O8")
      .replace("&copy; 2026", "&copy; 2027")
      .replace("<h1>Pricing</h1>", "<div><h1 class='big'>\n  Pricing\n</h1></div>");
    expect(hashText(visibleText(later))).toBe(hashText(visibleText(html)));
  });

  it("moves when a price moves", () => {
    expect(hashText(visibleText(html.replace("$19", "$25")))).not.toBe(hashText(visibleText(html)));
  });
});

describe("nextEntry", () => {
  it("first sighting stores the hash with changed_at null", () => {
    expect(nextEntry(undefined, "h1", DAY)).toEqual({ hash: "h1", checked_at: DAY, changed_at: null });
  });

  it("same hash only bumps checked_at and keeps an earlier change", () => {
    expect(nextEntry({ hash: "h1", checked_at: "2026-11-06", changed_at: null }, "h1", DAY)).toEqual({ hash: "h1", checked_at: DAY, changed_at: null });
    expect(nextEntry({ hash: "h1", checked_at: "2026-11-06", changed_at: "2026-10-01" }, "h1", DAY).changed_at).toBe("2026-10-01");
  });

  it("a moved hash sets changed_at to today", () => {
    expect(nextEntry({ hash: "h1", checked_at: "2026-11-06", changed_at: null }, "h2", DAY)).toEqual({ hash: "h2", checked_at: DAY, changed_at: DAY });
  });
});

describe("scan", () => {
  const tools = loadTools(join(FIX, "scan"));
  const state = readState(join(FIX, "scan/state/pricing.yaml"));

  it("reads the fixture layout", () => {
    expect(tools.map((t) => t.id)).toEqual(["alpha", "beta", "gamma", "listed"]);
    expect(state.alpha.checked_at).toBe("2026-11-06");
  });

  it("records new, changed and failed pages, and skips imported entries", async () => {
    const fetchImpl = fakeFetch({
      "https://alpha.test/pricing": html,
      "https://beta.test/pricing": "<p>Beta free forever</p>",
      "https://gamma.test/pricing": new Error("getaddrinfo ENOTFOUND gamma.test"),
    });
    const { state: next, report } = await scan({ tools, state, day: DAY, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls.map((c) => c[0])).not.toContain("https://listed.test/");
    expect(fetchImpl.mock.calls[0][1].headers["user-agent"]).toBe(USER_AGENT);

    expect(next.alpha).toEqual({ hash: hashText(visibleText(html)), checked_at: DAY, changed_at: DAY });
    expect(next.beta).toEqual({ hash: hashText("Beta free forever"), checked_at: DAY, changed_at: null });
    // A failed fetch leaves the entry exactly as it was, and is never a change.
    expect(next.gamma).toEqual(state.gamma);
    expect(next).not.toHaveProperty("removed");
    expect(next).not.toHaveProperty("listed");

    expect(report).toEqual({
      changed: ["alpha"],
      added: ["beta"],
      unchanged: [],
      failed: [{ id: "gamma", url: "https://gamma.test/pricing", error: "getaddrinfo ENOTFOUND gamma.test" }],
      dropped: ["removed"],
    });
  });

  it("treats HTTP errors, empty pages and timeouts as failures", async () => {
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      if (url.startsWith("https://alpha")) return new Response("x", { status: 503 });
      if (url.startsWith("https://beta")) return new Response("<script>app()</script>", { status: 200 });
      return new Promise<Response>((_, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)));
    });
    const { state: next, report } = await scan({ tools, state, day: DAY, fetchImpl, timeoutMs: 20 });
    expect(report.failed.map((f: { id: string; error: string }) => [f.id, f.error])).toEqual([
      ["alpha", "HTTP 503"],
      ["beta", "no visible text"],
      ["gamma", "timed out"],
    ]);
    expect(report.changed).toEqual([]);
    expect(next).toEqual({ alpha: state.alpha, gamma: state.gamma });
  });

  it("an unchanged page keeps changed_at as it was", async () => {
    const same = { alpha: { hash: hashText(visibleText(html)), checked_at: "2026-11-06", changed_at: null } };
    const { state: next, report } = await scan({ tools: [tools[0]], state: same, day: DAY, fetchImpl: fakeFetch({ "https://alpha.test/pricing": html }) });
    expect(report.unchanged).toEqual(["alpha"]);
    expect(next.alpha).toEqual({ ...same.alpha, checked_at: DAY });
  });
});

describe("serializeState", () => {
  const state = {
    zeta: { changed_at: null, hash: "z", checked_at: DAY },
    alpha: { hash: "a", checked_at: DAY, changed_at: DAY },
  };

  it("writes sorted keys in a fixed field order and round-trips", () => {
    const out = serializeState(state);
    expect(out.indexOf("alpha:")).toBeLessThan(out.indexOf("zeta:"));
    expect(out).toContain("zeta:\n  hash: z\n  checked_at: 2026-11-13\n  changed_at: null\n");
    expect(out.startsWith("# Pricing-page scan")).toBe(true);
    expect(parse(out)).toEqual({ alpha: state.alpha, zeta: { hash: "z", checked_at: DAY, changed_at: null } });
  });

  it("is deterministic and writes {} for an empty scan", () => {
    expect(serializeState({ alpha: state.alpha, zeta: state.zeta })).toBe(serializeState(state));
    expect(parse(serializeState({}))).toEqual({});
  });
});

describe("pricing-scan CLI", () => {
  it("writes the state file in the data dir; offline failures keep entries and drop removed tools", () => {
    const dir = mkdtempSync(join(tmpdir(), "fs-scan-"));
    cpSync(join(FIX, "scan"), dir, { recursive: true });
    // Point every page at a closed local port so nothing leaves the machine.
    for (const f of ["alpha", "beta", "gamma"]) {
      const p = join(dir, "tools", `${f}.yaml`);
      writeFileSync(p, readFileSync(p, "utf8").replace(/https:\/\/\w+\.test/, "http://127.0.0.1:9"));
    }
    const script = new URL("../../scripts/ops/pricing-scan.mjs", import.meta.url).pathname;
    const out = execFileSync(process.execPath, [script, "--today", DAY], {
      env: { ...process.env, FREESTACK_DATA: dir },
      encoding: "utf8",
    });
    expect(out).toContain("failed 3");
    const before = readState(join(FIX, "scan/state/pricing.yaml"));
    const written = readState(join(dir, "state/pricing.yaml"));
    expect(written).toEqual({ alpha: before.alpha, gamma: before.gamma });
  });
});

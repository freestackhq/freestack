/**
 * scripts/ops/link-check.mjs with a mocked fetch: classification, HEAD/GET
 * fallback and retry, the two-strike dead rule, state bytes and change detection.
 */
import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import {
  type FetchInit,
  type FetchResponse,
  USER_AGENT,
  checkUrl,
  classifyError,
  classifyResponse,
  meaningfulChange,
  nextEntry,
  reportMarkdown,
  run,
  serializeState,
  targets,
} from "../../scripts/ops/link-check.mjs";

const DAY = "2026-11-13";
const LATER = "2026-11-20";

/** A Response-like answer with a final URL (fetch sets res.url after redirects). */
function answer(status: number, url: string, headers: Record<string, string> = {}) {
  return { status, url, headers: new Headers(headers), body: null };
}

/** Routes "METHOD url" or "url" to an answer, an Error, or a function of the call count. */
function fakeFetch(routes: Record<string, unknown>) {
  const calls: Record<string, number> = {};
  return vi.fn(async (url: string, init: FetchInit): Promise<FetchResponse> => {
    const key = `${init.method} ${url}`;
    calls[key] = (calls[key] ?? 0) + 1;
    let r = routes[key] ?? routes[url];
    if (typeof r === "function") r = r(calls[key]);
    if (r instanceof Error) throw r;
    if (typeof r === "number") return answer(r, url);
    if (r) return r as FetchResponse;
    return answer(404, url);
  });
}

const dnsError = () => Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND", message: "getaddrinfo ENOTFOUND gone.test" } });
const timeoutError = () => Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });

describe("classifyResponse", () => {
  it("ok on the same registrable domain, subdomains included", () => {
    expect(classifyResponse(answer(200, "https://www.neon.tech/"), "https://neon.tech")).toMatchObject({ status: "ok", code: 200 });
    expect(classifyResponse(answer(200, "https://docs.neon.tech/x"), "https://neon.tech")).toMatchObject({ status: "ok" });
  });

  it("redirected when the final URL is on another registrable domain", () => {
    expect(classifyResponse(answer(200, "https://www.scalingo.com/"), "https://www.elephantsql.com/")).toEqual({
      status: "redirected",
      code: 200,
      final_url: "https://www.scalingo.com/",
    });
  });

  it("4xx, 5xx, and blocked for 401/403/429 and Cloudflare challenges", () => {
    expect(classifyResponse(answer(404, "https://a.test/x"), "https://a.test/x").status).toBe("client_error");
    expect(classifyResponse(answer(410, "https://a.test/x"), "https://a.test/x").status).toBe("client_error");
    expect(classifyResponse(answer(502, "https://a.test/"), "https://a.test/").status).toBe("server_error");
    for (const code of [401, 403, 429]) expect(classifyResponse(answer(code, "https://a.test/"), "https://a.test/").status).toBe("blocked");
    expect(classifyResponse(answer(503, "https://a.test/", { "cf-mitigated": "challenge" }), "https://a.test/").status).toBe("blocked");
  });
});

describe("classifyError", () => {
  it("timeout, dns and other network errors", () => {
    expect(classifyError(timeoutError()).status).toBe("timeout");
    expect(classifyError(dnsError()).status).toBe("dns");
    expect(classifyError(Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } }))).toMatchObject({ status: "error", error: "ECONNREFUSED" });
  });
});

describe("checkUrl", () => {
  it("sends the generic user agent and stops at a good HEAD", async () => {
    const f = fakeFetch({ "HEAD https://a.test/": 200 });
    expect(await checkUrl("https://a.test/", { fetchImpl: f, retryDelayMs: 0 })).toMatchObject({ status: "ok" });
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][1].headers["user-agent"]).toBe(USER_AGENT);
    expect(USER_AGENT).not.toMatch(/@|karlo|kaoru/i);
  });

  it("falls back to GET when HEAD is refused", async () => {
    const f = fakeFetch({ "HEAD https://a.test/": 405, "GET https://a.test/": 200 });
    expect(await checkUrl("https://a.test/", { fetchImpl: f, retryDelayMs: 0 })).toMatchObject({ status: "ok", code: 200 });
    expect(f.mock.calls.map((c) => c[1].method)).toEqual(["HEAD", "GET"]);
  });

  it("retries a transient failure once", async () => {
    const f = fakeFetch({ "https://a.test/": (n: number) => (n === 1 ? timeoutError() : answer(200, "https://a.test/")) });
    expect(await checkUrl("https://a.test/", { fetchImpl: f, retryDelayMs: 0 })).toMatchObject({ status: "ok" });
    expect(f).toHaveBeenCalledTimes(3); // HEAD timeout, GET timeout, HEAD ok
  });

  it("does not retry a 404 or a block", async () => {
    const f = fakeFetch({ "https://a.test/": 404, "https://b.test/": 403 });
    expect((await checkUrl("https://a.test/", { fetchImpl: f, retryDelayMs: 0 })).code).toBe(404);
    expect((await checkUrl("https://b.test/", { fetchImpl: f, retryDelayMs: 0 })).status).toBe("blocked");
    expect(f).toHaveBeenCalledTimes(4);
  });
});

describe("nextEntry (two-strike rule)", () => {
  const dead = { status: "client_error", code: 404, final_url: "https://a.test/" };
  const ok = { status: "ok", code: 200, final_url: "https://a.test/" };
  const timeout = { status: "timeout", code: null, final_url: null };

  it("first dead sighting sets failing_since only", () => {
    expect(nextEntry(undefined, dead, null, DAY)).toEqual({
      url_status: "client_error:404",
      pricing_status: null,
      final_url: "https://a.test/",
      checked_at: DAY,
      failing_since: DAY,
      dead_since: null,
    });
  });

  it("a second dead run on a later day sets dead_since; the same day does not", () => {
    const first = nextEntry(undefined, dead, null, DAY);
    expect(nextEntry(first, dead, null, DAY).dead_since).toBeNull();
    const second = nextEntry(first, dead, null, LATER);
    expect(second).toMatchObject({ failing_since: DAY, dead_since: LATER });
    expect(nextEntry(second, { status: "dns", code: null, final_url: null }, null, "2026-11-27")).toMatchObject({ dead_since: LATER });
  });

  it("a one-off outage clears on the next good run", () => {
    const first = nextEntry(undefined, dead, null, DAY);
    expect(nextEntry(first, ok, null, LATER)).toMatchObject({ failing_since: null, dead_since: null, url_status: "ok" });
  });

  it("unknown answers neither count as strikes nor clear them", () => {
    expect(nextEntry(undefined, timeout, null, DAY)).toMatchObject({ failing_since: null, dead_since: null });
    const first = nextEntry(undefined, dead, null, DAY);
    expect(nextEntry(first, { status: "blocked", code: 403, final_url: null }, null, LATER)).toMatchObject({ failing_since: DAY, dead_since: null });
    expect(nextEntry(undefined, { status: "server_error", code: 500, final_url: null }, null, DAY).failing_since).toBeNull();
  });

  it("only the url decides; a dead pricing_url is recorded but not a strike", () => {
    expect(nextEntry(undefined, ok, dead, DAY)).toMatchObject({ pricing_status: "client_error:404", failing_since: null });
  });
});

describe("run", () => {
  const list = targets(
    [{ id: "alpha", name: "Alpha", url: "https://alpha.test/", pricing_url: "https://alpha.test/pricing" }],
    [
      { id: "gone", name: "Gone", url: "https://gone.test/", list: "l" },
      { id: "moved", name: "Moved", url: "https://moved.test/", list: "l" },
      { id: "alpha", name: "Alpha dup", url: "https://other.test/", list: "l" },
    ],
  );

  it("checks curated url + pricing_url and imported urls once each", async () => {
    const f = fakeFetch({
      "https://alpha.test/": 200,
      "https://alpha.test/pricing": 404,
      "https://gone.test/": dnsError(),
      "https://moved.test/": answer(200, "https://acquirer.test/"),
    });
    const { state, rows } = await run({ targets: list, state: {}, day: DAY, fetchImpl: f, retryDelayMs: 0 });
    expect(list.map((t) => t.id)).toEqual(["alpha", "gone", "moved"]);
    expect(state.alpha).toMatchObject({ url_status: "ok", pricing_status: "client_error:404", failing_since: null });
    expect(state.gone).toMatchObject({ url_status: "dns", pricing_status: null, failing_since: DAY, dead_since: null });
    expect(state.moved).toMatchObject({ url_status: "redirected", final_url: "https://acquirer.test/", failing_since: null });
    const md = reportMarkdown(rows);
    expect(md).toContain("- imported url: redirected 1, dns 1");
    expect(md).toContain("`gone` (imported) since 2026-11-13: dns");
    expect(md).toContain("### Dead pricing_url");
  });
});

describe("serializeState and meaningfulChange", () => {
  const a = { url_status: "ok", pricing_status: null, final_url: "https://a.test/", checked_at: DAY, failing_since: null, dead_since: null };

  it("writes sorted ids in a fixed field order and round-trips", () => {
    const out = serializeState({ zeta: { ...a, dead_since: null, url_status: "dns" }, alpha: a });
    expect(out.indexOf("alpha:")).toBeLessThan(out.indexOf("zeta:"));
    expect(out).toContain("alpha:\n  url_status: ok\n  pricing_status: null\n  final_url: https://a.test/\n  checked_at: 2026-11-13\n  failing_since: null\n  dead_since: null\n");
    expect(parse(out).alpha).toEqual(a);
    expect(parse(serializeState({}))).toEqual({});
  });

  it("ignores checked_at and final_url churn, flags status and strike moves", () => {
    expect(meaningfulChange({ a }, { a: { ...a, checked_at: LATER, final_url: "https://a.test/?x" } })).toBe(false);
    expect(meaningfulChange({ a }, { a: { ...a, url_status: "timeout" } })).toBe(true);
    expect(meaningfulChange({ a }, { a: { ...a, failing_since: DAY } })).toBe(true);
    expect(meaningfulChange({ a }, {})).toBe(true);
    expect(meaningfulChange({}, { a })).toBe(true);
  });
});

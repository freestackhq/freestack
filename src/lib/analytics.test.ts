import { describe, expect, it } from "vitest";
import { BEACON_SRC, analyticsBeacon } from "./analytics";

describe("analytics beacon", () => {
  it("renders nothing without a token", () => {
    expect(analyticsBeacon(undefined)).toBeNull();
    expect(analyticsBeacon("")).toBeNull();
    expect(analyticsBeacon("   ")).toBeNull();
  });

  it("is unset in tests and dev builds", () => {
    expect(analyticsBeacon(import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN)).toBeNull();
  });

  it("points the Cloudflare beacon at the token", () => {
    expect(analyticsBeacon(" abc123 ")).toEqual({ src: BEACON_SRC, config: '{"token":"abc123"}' });
  });
});

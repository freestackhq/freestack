import { describe, expect, it } from "vitest";
import { partForJob, partOptions, parts, preset, situations } from "./catalog";

describe("stack parts", () => {
  it("every preset job fills a part", () => {
    for (const s of situations()) {
      for (const row of preset(s.id)) expect(partForJob(row.job), `${s.id}: ${row.job}`).toBeDefined();
    }
  });

  it("part keys are unique and URL-safe", () => {
    const keys = parts().map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k).toMatch(/^[a-z]+$/);
    expect(keys).not.toContain("as");
  });

  it("splits one aisle into jobs by kind", () => {
    const auth = parts().find((p) => p.key === "auth")!;
    const secrets = parts().find((p) => p.key === "secrets")!;
    expect(partOptions(auth).map((t) => t.id)).toContain("clerk");
    expect(partOptions(auth).map((t) => t.id)).not.toContain("doppler");
    expect(partOptions(secrets).map((t) => t.id)).toContain("doppler");
    expect(partOptions(secrets).map((t) => t.id)).not.toContain("clerk");
    for (const t of partOptions(secrets)) expect(t.kind).toBe("Secrets");
  });

  it("never offers imported entries", () => {
    for (const p of parts()) for (const t of partOptions(p)) expect(t.source).not.toBe("imported");
  });
});

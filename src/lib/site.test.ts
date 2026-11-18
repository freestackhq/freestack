import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL, GITHUB_REPO, MCP_URL, REPO_URL, SITE_URL, contactEmail, siteUrl } from "./site";

describe("site address", () => {
  it("falls back to the local preview when SITE_URL is unset", () => {
    expect(SITE_URL).toBe("http://localhost:4321");
  });
  it("builds absolute URLs from paths", () => {
    expect(siteUrl("/compare?ids=neon,turso")).toBe("http://localhost:4321/compare?ids=neon,turso");
    expect(siteUrl("databases")).toBe("http://localhost:4321/databases");
    expect(siteUrl()).toBe("http://localhost:4321/");
  });
  it("puts the MCP server at /mcp", () => {
    expect(MCP_URL).toBe("http://localhost:4321/mcp");
  });
  it("defaults the repo", () => {
    expect(GITHUB_REPO).toBe("freestackhq/freestack");
    expect(REPO_URL).toBe("https://github.com/freestackhq/freestack");
  });
});

describe("contact email", () => {
  it("is unset unless PUBLIC_CONTACT_EMAIL is set", () => {
    expect(CONTACT_EMAIL).toBeNull();
  });
  it("accepts a plain address and trims it", () => {
    expect(contactEmail("  support@example.com ")).toBe("support@example.com");
  });
  it("rejects blanks and things that are not an address", () => {
    expect(contactEmail(undefined)).toBeNull();
    expect(contactEmail("")).toBeNull();
    expect(contactEmail("support")).toBeNull();
    expect(contactEmail("a b@example.com")).toBeNull();
    expect(contactEmail("support@localhost")).toBeNull();
  });
});

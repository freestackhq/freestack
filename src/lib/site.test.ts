import { describe, expect, it } from "vitest";
import { GITHUB_REPO, MCP_URL, REPO_URL, SITE_URL, newIssueUrl, siteUrl } from "./site";

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

describe("new issue links", () => {
  it("opens a blank issue", () => {
    expect(newIssueUrl()).toBe("https://github.com/freestackhq/freestack/issues/new");
  });
});

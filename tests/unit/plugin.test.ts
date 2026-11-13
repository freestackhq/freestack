import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SITE_PLACEHOLDER, fillSkill } from "../../scripts/skill-fill.mjs";

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const source = read("skills/pick-free-stack/SKILL.md");

describe("pick-free-stack skill", () => {
  it("has the frontmatter skills installers read", () => {
    const front = /^---\n([\s\S]*?)\n---\n/.exec(source)?.[1] ?? "";
    expect(front).toMatch(/^name: pick-free-stack$/m);
    expect(front).toMatch(/^description: .*paid service.*free tiers/m);
  });

  it("names every MCP tool", () => {
    for (const t of ["search_tools", "compare", "suggest_stack", "claim_order"]) expect(source).toContain(`\`${t}\``);
  });

  it("holds no domain, only the placeholder", () => {
    expect(source).toContain(SITE_PLACEHOLDER);
    expect(source).not.toMatch(/https?:\/\//);
  });

  it("fills the address and drops the ask-for-it line", () => {
    const filled = fillSkill(source, "https://free.test/");
    expect(filled).not.toContain(SITE_PLACEHOLDER);
    expect(filled).not.toContain("still reads");
    expect(filled).toContain("https://free.test/api/entries?q=");
    expect(filled).toContain("https://free.test/llms.txt");
  });
});

describe("Claude Code plugin marketplace", () => {
  const market = JSON.parse(read(".claude-plugin/marketplace.json"));
  const entry = market.plugins[0];
  const dir = entry.source.replace(/^\.\//, "");
  const manifest = JSON.parse(read(`${dir}/.claude-plugin/plugin.json`));
  const mcp = JSON.parse(read(`${dir}/.mcp.json`));

  it("lists one plugin whose manifest name matches", () => {
    expect(market.name).toBe("freestack");
    expect(market.owner.name).toBeTruthy();
    expect(entry.name).toBe(manifest.name);
  });

  it("points the plugin's MCP server at <site>/mcp over HTTP", () => {
    expect(mcp.mcpServers.freestack.type).toBe("http");
    expect(mcp.mcpServers.freestack.url).toMatch(/^https:\/\/[^/]+\/mcp$/);
  });

  it("ships the skill as generated from skills/ (run pnpm plugin:build)", () => {
    const origin = new URL(mcp.mcpServers.freestack.url).origin;
    expect(read(`${dir}/skills/pick-free-stack/SKILL.md`)).toBe(fillSkill(source, origin));
  });
});

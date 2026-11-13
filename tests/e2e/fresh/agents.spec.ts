import { expect, test } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

const URL = "/agents";

test.describe("For coding agents (Agents.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("title and promise", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("freestack for coding agents");
    await expect(page.locator("main")).toContainText("tells you the catch");
  });

  test("install the skill and the plugin", async ({ page }) => {
    await page.goto(URL);
    const skill = page.getByRole("region", { name: "Install the skill" });
    await expect(skill.locator("code").first()).toHaveText("npx skills add https://github.com/freestackhq/freestack");
    await expect(skill).toContainText("Claude Code plugin");
    await expect(skill.locator("code").nth(1)).toHaveText("/plugin marketplace add freestackhq/freestack");
  });

  test("MCP address is this site's /mcp, with no placeholder", async ({ page }) => {
    await page.goto(URL);
    const mcp = page.getByRole("region", { name: "Or add the MCP server" });
    await expect(mcp.locator("code")).toContainText(/"url": "https?:\/\/[^"\s\[\]]+\/mcp"/);
    await expect(mcp).not.toContainText("[domain]");
    await expect(mcp).not.toContainText(/not live|not decided/i);
    await expect(mcp.locator("[data-placeholder-note]")).toHaveCount(0);
    await expect(mcp).toContainText("Read only, public, no login.");
  });

  test("example conversation is built from catalog data", async ({ page }) => {
    await page.goto(URL);
    const ex = page.getByRole("region", { name: "What it looks like" });
    await expect(ex).toContainText("You");
    await expect(ex).toContainText("Your agent, using freestack");
    // Facts come from the labels: Neon's catch and Vercel Hobby's selling rule.
    await expect(ex.locator("strong", { hasText: "Neon" })).toBeVisible();
    await expect(ex).toContainText(/Catch: Neon \S/);
    await expect(ex).toContainText("Skipped Vercel Hobby for hosting since it does not allow selling.");
  });

  test("what the agent can ask: four tools", async ({ page }) => {
    await page.goto(URL);
    const tools = page.getByRole("region", { name: "What the agent can ask" });
    await expect(tools.getByRole("heading", { level: 3 })).toHaveText(["Find tools", "Compare", "Suggest a stack", "Check a stack"]);
  });

  test("no-install links to the API and llms.txt", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("link", { name: "/api/entries" })).toHaveAttribute("href", "/api/entries");
    await expect(page.getByRole("link", { name: "/llms.txt" })).toHaveAttribute("href", "/llms.txt");
  });
});

test.describe("The skill, served with this site's address", () => {
  test("is markdown with the address filled in", async ({ request }) => {
    const res = await request.get("/skills/pick-free-stack/SKILL.md");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/markdown");
    const text = await res.text();
    expect(text).toMatch(/^---\nname: pick-free-stack\n/);
    expect(text).not.toContain("<freestack site>");
    expect(text).toMatch(/https?:\/\/[^\s`]+\/api\/entries\?q=/);
  });
});

test.describe("For coding agents on a phone", () => {
  test.use({ viewport: PHONE });

  test("code blocks wrap and the page never scrolls sideways", async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator("main code").first()).toBeVisible();
    await expectNoSideScroll(page);
  });
});

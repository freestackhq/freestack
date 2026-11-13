import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

const chips = (page: Page) => page.getByRole("list", { name: "Your stack" }).locator("li");
const verdict = (page: Page, id: string) => page.locator(`.verdict[data-tool="${id}"]`);

test.describe("Check my stack (CheckStack.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("starts empty", async ({ page }) => {
    await page.goto("/check");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check my stack");
    await expect(page.getByText("Type what you use now. We flag the catches for your situation.")).toBeVisible();
    await expect(chips(page)).toHaveCount(0);
    await expect(page.locator("[data-results]")).toBeHidden();
    await expect(page.getByText("Add a tool above to check it.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Student", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("type tools as chips and check them", async ({ page }) => {
    await page.goto("/check");
    await page.getByRole("button", { name: "Indie builder" }).click();
    const input = page.getByLabel("Your tools");
    await input.fill("Vercel");
    await input.press("Enter");
    await input.fill("Supabase, Clerk");
    await page.getByRole("button", { name: "Check it" }).click();

    await expect(chips(page)).toHaveText(["Vercel Hobby", "Supabase", "Clerk"]);
    await expect(page).toHaveURL(/\?as=indie&tools=vercel-hobby%2Csupabase%2Cclerk$/);
    await expect(page.locator("#res-h")).toBeFocused();
    await expect(page.locator("#res-h")).toHaveText("1 problem, 1 to watch");
    await expect(page.locator("[data-for]")).toHaveText("For an indie builder who may sell");

    await expect(verdict(page, "vercel-hobby")).toHaveAttribute("data-level", "problem");
    await expect(verdict(page, "vercel-hobby")).toContainText("Problem");
    await expect(verdict(page, "vercel-hobby")).toContainText("Vercel Hobby does not allow selling");
    await expect(verdict(page, "vercel-hobby").getByRole("link", { name: /^Switch to / })).toHaveAttribute(
      "href",
      /^\/hosting\//,
    );
    await expect(verdict(page, "supabase")).toHaveAttribute("data-level", "watch");
    await expect(verdict(page, "supabase")).toContainText("Watch out");
    await expect(verdict(page, "clerk")).toHaveAttribute("data-level", "fine");
    await expect(verdict(page, "clerk")).toContainText("No catch for you.");
    await expect(verdict(page, "clerk")).toContainText("Selling is allowed.");

    await expect(page.getByRole("link", { name: "Why Vercel Hobby is a problem" })).toHaveAttribute(
      "href",
      /^\/catches\//,
    );
  });

  test("reads the URL; situation changes the checks", async ({ page }) => {
    await page.goto("/check?as=indie&tools=vercel-hobby,clerk");
    await expect(page.locator("#res-h")).toHaveText("1 problem");
    await page.getByRole("button", { name: "Student", exact: true }).click();
    await expect(page.locator("#res-h")).toHaveText("Works. No problems found");
    await expect(page).toHaveURL(/\?as=student&tools=/);
  });

  test("a tool we don't list stays dashed; the rest still get checked", async ({ page }) => {
    await page.goto("/check?as=indie&tools=vercel-hobby,supabase,Fauna");
    const fauna = chips(page).filter({ hasText: "Fauna" });
    await expect(fauna).toHaveClass(/chip-dashed/);
    await expect(fauna).toContainText("(not on freestack)");
    await expect(chips(page).filter({ hasText: "Supabase" })).not.toHaveClass(/chip-dashed/);
    const notice = page.locator("[data-unknown]");
    await expect(notice).toContainText("Fauna isn't on freestack, so we checked the other 2 without it.");
    await expect(notice.getByRole("link", { name: "Add Fauna" })).toHaveAttribute("href", "/add?name=Fauna");
    await expect(page.locator(".verdict")).toHaveCount(2);
    await expect(page.locator("#res-h")).toHaveText("1 problem");
  });

  test("only unknown tools: nothing to check", async ({ page }) => {
    await page.goto("/check?tools=Fauna");
    await expect(page.locator("[data-unknown]")).toContainText("so there is nothing to check yet.");
    await expect(page.locator("[data-results]")).toBeHidden();
  });

  test("an imported tool has no label yet", async ({ page }) => {
    await page.goto("/check?tools=xata-lite,neon");
    await expect(chips(page).filter({ hasText: "Xata Lite" })).toHaveClass(/chip-dashed/);
    await expect(page.locator("[data-unknown]").getByRole("link", { name: "Write its label" })).toHaveAttribute(
      "href",
      /^\/add\?/,
    );
    await expect(page.locator(".verdict")).toHaveCount(1);
  });

  test("remove chips by button or Backspace", async ({ page }) => {
    await page.goto("/check?as=indie&tools=vercel-hobby,clerk");
    await page.getByRole("button", { name: "Remove Vercel Hobby" }).click();
    await expect(chips(page)).toHaveText(["Clerk"]);
    await expect(page.getByRole("button", { name: "Remove Clerk" })).toBeFocused();
    await expect(page.locator("#res-h")).toHaveText("Works. No problems found");
    await page.getByLabel("Your tools").click();
    await page.keyboard.press("Backspace");
    await expect(chips(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\?as=indie$/);
  });

  test("copy the fixed stack swaps out the problem", async ({ page }) => {
    await page.goto("/check?as=indie&tools=vercel-hobby,clerk");
    await page.getByRole("button", { name: "Copy the fixed stack" }).click();
    const text = page.getByRole("dialog", { name: "Copy your stack" }).locator("pre");
    await expect(text).not.toContainText("Vercel Hobby");
    await expect(text).toContainText("- Sign-in: Clerk");
    await expect(text).toContainText("- Hosting: ");
  });

  test("one yellow action", async ({ page }) => {
    await page.goto("/check?as=indie&tools=vercel-hobby,clerk");
    expect(await page.locator(".btn-promo:visible").count()).toBe(1);
  });
});

test.describe("Check my stack on a phone", () => {
  test.use({ viewport: PHONE });

  test("reflows without side scroll; targets are 44px", async ({ page }) => {
    await page.goto("/check?as=indie&tools=vercel-hobby,supabase,Fauna");
    await expectNoSideScroll(page);
    const box = await page.getByRole("button", { name: "Remove Supabase" }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    const check = await page.getByRole("button", { name: "Check it" }).boundingBox();
    expect(check!.height).toBeGreaterThanOrEqual(44);
  });
});

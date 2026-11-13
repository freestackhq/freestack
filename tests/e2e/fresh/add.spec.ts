import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

async function pickAisle(page: Page, typed: string, name: string) {
  const box = page.getByRole("combobox", { name: "Aisle" });
  await box.fill(typed);
  await expect(page.getByRole("listbox", { name: "Matching aisles" })).toBeVisible();
  await page.getByRole("option", { name: new RegExp(name) }).click();
  await expect(box).toHaveValue(name);
}

async function fillValid(page: Page) {
  await page.getByLabel("Tool name").fill("Fresh Base");
  await page.getByLabel("Website").fill("https://freshbase.example");
  await page.getByLabel("What it is").fill("Serverless SQLite");
  await pickAisle(page, "data", "Databases");
  await page.getByLabel("Free storage").fill("512 MB");
  await page.getByLabel("Pricing page").fill("https://freshbase.example/pricing");
  await page.getByLabel("Other limits").fill("1 database\n100 writes a second");
  await page.getByRole("textbox", { name: "Catch 1" }).fill("Deletes idle databases");
}

test.describe("add a tool (AddTool.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("shows the form with its sections", async ({ page }) => {
    await page.goto("/add");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Add a tool");
    for (const h of ["The basics", "The numbers", "The bottom line", "The catch, and when to skip it"]) {
      await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Send for review" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Can you sell with it?" }).getByLabel("Not sure")).toBeChecked();
    await expect(page.getByRole("group", { name: "Credit card at signup?" }).getByLabel("Not sure")).toBeChecked();
  });

  test("prefills from the URL (Write its label, Add it)", async ({ page }) => {
    await page.goto("/add?name=Xata%20Lite&url=https%3A%2F%2Fxata.io&aisle=databases");
    await expect(page.getByLabel("Tool name")).toHaveValue("Xata Lite");
    await expect(page.getByLabel("Website")).toHaveValue("https://xata.io");
    await expect(page.getByRole("combobox", { name: "Aisle" })).toHaveValue("Databases");
    await expect(page.locator("form")).toContainText("free-for-dev");
    // An imported entry is not "already listed": writing its label is the point.
    await expect(page.getByText("is already on freestack")).toHaveCount(0);

    await page.goto("/add?name=pocketbse");
    await expect(page.getByLabel("Tool name")).toHaveValue("pocketbse");
  });

  test("tool already listed: links to its label", async ({ page }) => {
    await page.goto("/add?name=Neon");
    const note = page.getByRole("status").filter({ hasText: "already on freestack" });
    await expect(note).toContainText("Neon is already on freestack.");
    await expect(note.getByRole("link", { name: "Check its label instead" })).toHaveAttribute("href", "/databases/neon/check");

    // Typing a listed website finds it too.
    await page.goto("/add");
    await page.getByLabel("Website").fill("https://www.supabase.com/");
    await page.getByLabel("Website").blur();
    await expect(page.getByRole("status").filter({ hasText: "already on freestack" })).toContainText("Supabase");

    // And sending is refused.
    await page.getByRole("button", { name: "Send for review" }).click();
    await expect(page).toHaveURL(/\/add\/?$/);
  });

  test("aisle combobox: type, arrow, Enter; the aisle names the big number", async ({ page }) => {
    await page.goto("/add");
    const box = page.getByRole("combobox", { name: "Aisle" });
    await box.fill("host");
    const opt = page.getByRole("option", { name: /Hosting/ });
    await expect(opt).toHaveAttribute("aria-selected", "true");
    await expect(box).toHaveAttribute("aria-expanded", "true");
    await expect(box).toHaveAttribute("aria-activedescendant", (await opt.getAttribute("id"))!);
    await box.press("Enter");
    await expect(box).toHaveValue("Hosting");
    await expect(box).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByLabel("Requests")).toBeVisible();
    await page.getByLabel("Requests").fill("100,000");
    await expect(page.getByText("Shows on the label as")).toContainText("100k requests a day");
  });

  test("a number that isn't a number asks for the vendor's figure or Not listed", async ({ page }) => {
    await page.goto("/add?aisle=databases");
    const field = page.getByLabel("Free storage");
    await field.fill("lots");
    await field.blur();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(`Write the vendor's number, like 0.5 GB. Or pick "Not listed".`)).toBeVisible();

    await page.getByRole("button", { name: "Not listed" }).click();
    await expect(field).toHaveValue("Not listed");
    await expect(field).not.toHaveAttribute("aria-invalid", "true");

    await field.fill("512 MB");
    await expect(page.getByText("Shows on the label as")).toContainText("0.5 GB");
  });

  test("missing answers are named and nothing is sent", async ({ page }) => {
    await page.goto("/add");
    await page.getByRole("button", { name: "Send for review" }).click();
    await expect(page).toHaveURL(/\/add\/?$/);
    await expect(page.getByLabel("Tool name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Tool name")).toBeFocused();
    await expect(page.getByText("Write the tool's name.")).toBeVisible();
    await expect(page.getByText("Pick the closest aisle.")).toBeVisible();
    await expect(page.getByText("Add the link where you read the numbers", { exact: false })).toBeVisible();
  });

  test("add a catch adds a field", async ({ page }) => {
    await page.goto("/add");
    await page.getByRole("button", { name: "+ Add a catch" }).click();
    await expect(page.getByRole("textbox", { name: "Catch 3" })).toBeFocused();
    await page.getByRole("button", { name: "+ Add a reason" }).last().click();
    await expect(page.getByRole("textbox", { name: "Skip it if, reason 3" })).toBeFocused();
    await expect(page.getByRole("textbox", { name: "Use instead, for reason 3" })).toBeVisible();
  });

  test("sending shows the pending label and a placeholder PR link", async ({ page }) => {
    await page.goto("/add");
    await fillValid(page);
    await page.getByLabel("Your name for credit").fill("Ada");
    await page.getByRole("button", { name: "Send for review" }).click();

    await expect(page).toHaveURL(/\/add\/sent\/?$/);
    const status = page.getByRole("status").filter({ hasText: "Sent. Thanks." });
    await expect(status.getByRole("heading", { level: 1 })).toHaveText("Sent. Thanks.");
    await expect(status).toContainText("Your label for Fresh Base is waiting for review.");
    await expect(status).toContainText("A maintainer compares it with freshbase.example/pricing.");
    await expect(status).toContainText("It goes live in the Databases aisle.");
    await expect(status).toContainText("You left a name, so it shows.");
    await expect(status.getByRole("link", { name: "Add another tool" })).toHaveAttribute("href", "/add");
    await expect(status.getByRole("link", { name: "Back to Databases" })).toHaveAttribute("href", "/databases");
    const pr = status.getByRole("link", { name: /Follow it on GitHub/ });
    await expect(pr).toHaveAttribute("data-placeholder", "true");
    await expect(status).toContainText("Placeholder");

    const label = page.locator('article[data-tool="fresh-base"]');
    await expect(label).toContainText("Fresh Base");
    await expect(label).toContainText("Serverless SQLite");
    await expect(label).toContainText("0.5 GB");
    await expect(label).toContainText("100 writes a second");
    await expect(label).toContainText("Deletes idle databases");
    await expect(label.locator(".strip")).toContainText("waiting for review");
    await expect(label.getByRole("link")).toHaveCount(0);
  });

  test("no name for credit stays anonymous", async ({ page }) => {
    await page.goto("/add");
    await fillValid(page);
    await page.getByRole("button", { name: "Send for review" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Sent. Thanks." })).toContainText("It stays anonymous.");
  });

  test("opening the sent page directly goes back to the form", async ({ page }) => {
    await page.goto("/add/sent");
    await expect(page).toHaveURL(/\/add\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Add a tool");
  });
});

test.describe("add a tool on a phone", () => {
  test.use({ viewport: PHONE });

  test("reflows without side scroll; targets are 44px", async ({ page }) => {
    await page.goto("/add?aisle=databases");
    await expectNoSideScroll(page);
    const targets = page.locator("main form button, main form input[type=text], main form input:not([type]), main form .chip");
    for (let i = 0; i < (await targets.count()); i++) {
      const b = await targets.nth(i).boundingBox();
      if (b) expect(b.height, `target ${i}`).toBeGreaterThanOrEqual(44);
    }
  });

  test("sent page reflows", async ({ page }) => {
    await page.goto("/add");
    await fillValid(page);
    await page.getByRole("button", { name: "Send for review" }).click();
    await expect(page).toHaveURL(/\/add\/sent\/?$/);
    await expectNoSideScroll(page);
  });
});

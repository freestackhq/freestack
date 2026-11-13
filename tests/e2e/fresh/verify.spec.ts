import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

const NEON = "/databases/neon/check/";

function line(page: Page, label: string, nth = 0) {
  return page.getByRole("group", { name: label }).nth(nth);
}

test.describe("check a label (Verify.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("lists every line with Still true and Changed", async ({ page }) => {
    await page.goto(NEON);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check Neon's label");
    await expect(page.getByRole("link", { name: "Neon", exact: true })).toHaveAttribute("href", "/databases/neon");
    const pricing = page.getByRole("link", { name: /Open neon\.tech\/pricing/ });
    await expect(pricing).toHaveAttribute("href", "https://neon.tech/pricing");
    await expect(pricing).toHaveAttribute("target", "_blank");

    const storage = line(page, "Free storage");
    await expect(storage).toContainText("0.5 GB");
    await expect(storage.getByRole("button", { name: "Still true" })).toHaveAttribute("aria-pressed", "false");
    await expect(storage.getByRole("button", { name: "Changed" })).toHaveAttribute("aria-pressed", "false");
    await expect(line(page, "Limit")).toContainText("5 GB transfer a month");
    await expect(line(page, "Selling allowed")).toContainText("Yes");
    await expect(line(page, "Credit card at signup")).toContainText("Not listed");
    await expect(page.getByText(/^0 of \d+ answered\. Unanswered lines stay as they are\.$/)).toBeVisible();
  });

  test("Changed asks for the new value; summary counts answers", async ({ page }) => {
    await page.goto(NEON);
    const storage = line(page, "Free storage");
    await expect(storage.getByLabel("What does it say now?")).toBeHidden();
    await storage.getByRole("button", { name: "Changed" }).click();
    await expect(storage.getByRole("button", { name: "Changed" })).toHaveAttribute("aria-pressed", "true");
    await expect(storage.getByLabel("What does it say now?")).toBeVisible();
    await expect(storage.getByLabel("What does it say now?")).toBeFocused();
    await expect(page.getByText(/^1 of \d+ answered/)).toBeVisible();

    await storage.getByRole("button", { name: "Still true" }).click();
    await expect(storage.getByRole("button", { name: "Changed" })).toHaveAttribute("aria-pressed", "false");
    await expect(storage.getByLabel("What does it say now?")).toBeHidden();
    await expect(page.getByText(/^1 of \d+ answered/)).toBeVisible();
  });

  test("all still true: the label will show Checked today", async ({ page }) => {
    await page.goto(NEON);
    const buttons = page.getByRole("button", { name: "Still true" });
    for (let i = 0; i < (await buttons.count()); i++) await buttons.nth(i).click();
    await page.getByLabel("Your name for credit").fill("Ada");
    await page.getByRole("button", { name: "Send check" }).click();

    const done = page.getByRole("status").filter({ hasText: "Thanks." });
    await expect(done.getByRole("heading", { level: 1 })).toHaveText("Thanks. Neon is checked.");
    await expect(done).toContainText("The label now shows it was checked today.");
    await expect(done.locator('[data-state="checked"]')).toContainText("Checked today");
    await expect(done.locator('[data-state="review"]')).toHaveCount(0);
    await expect(done.getByRole("link", { name: "Check another label" })).toHaveAttribute("href", "/databases");
  });

  test("any changed: a change is waiting for review", async ({ page }) => {
    await page.goto(NEON);
    await line(page, "Limit").getByRole("button", { name: "Still true" }).click();
    const storage = line(page, "Free storage");
    await storage.getByRole("button", { name: "Changed" }).click();
    await storage.getByLabel("What does it say now?").fill("1 GB");
    await page.getByRole("button", { name: "Send check" }).click();

    const done = page.getByRole("status").filter({ hasText: "Thanks." });
    await expect(done.getByRole("heading", { level: 1 })).toHaveText("Thanks. We will review it.");
    await expect(done).toContainText("1 change sent.");
    await expect(done.locator('[data-state="review"]')).toContainText("A change is waiting for review");
    await expect(done.locator('[data-state="checked"]')).toHaveCount(0);

    // Back to the form keeps the answers.
    await done.getByRole("button", { name: "Back to the form" }).click();
    await expect(storage.getByRole("button", { name: "Changed" })).toHaveAttribute("aria-pressed", "true");
    await expect(storage.getByLabel("What does it say now?")).toHaveValue("1 GB");
  });

  test("Changed with no new value is not sent", async ({ page }) => {
    await page.goto(NEON);
    const storage = line(page, "Free storage");
    await storage.getByRole("button", { name: "Changed" }).click();
    await page.getByRole("button", { name: "Send check" }).click();
    const field = storage.getByLabel("What does it say now?");
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toBeFocused();
    await expect(storage).toContainText("Write what the page says now");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check Neon's label");
  });

  test("nothing answered is not sent", async ({ page }) => {
    await page.goto(NEON);
    await page.getByRole("button", { name: "Send check" }).click();
    await expect(page.getByText("Answer at least one line first.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check Neon's label");
  });

  test("failed send keeps the answers and offers to try again", async ({ page }) => {
    await page.goto(`${NEON}?fail=1`);
    const storage = line(page, "Free storage");
    await storage.getByRole("button", { name: "Changed" }).click();
    await storage.getByLabel("What does it say now?").fill("1 GB");
    await line(page, "Limit").getByRole("button", { name: "Still true" }).click();
    await page.getByRole("button", { name: "Send check" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toContainText("Your check did not send");
    await expect(alert).toContainText("We could not confirm you are a person. Your answers are still here.");
    await expect(storage.getByLabel("What does it say now?")).toHaveValue("1 GB");
    await expect(line(page, "Limit").getByRole("button", { name: "Still true" })).toHaveAttribute("aria-pressed", "true");
    // One yellow action at a time: Send check steps aside for Try sending again.
    await expect(page.getByRole("button", { name: "Send check" })).toBeHidden();

    await alert.getByRole("button", { name: "Try sending again" }).click();
    await expect(page.getByRole("alert")).toContainText("Your check did not send");
  });

  test("try again succeeds after one failure", async ({ page }) => {
    await page.goto(`${NEON}?fail=once`);
    await line(page, "Free storage").getByRole("button", { name: "Still true" }).click();
    await page.getByRole("button", { name: "Send check" }).click();
    await page.getByRole("alert").getByRole("button", { name: "Try sending again" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thanks. Neon is checked.");
  });

  test("every labeled tool has a check page; imported ones do not", async ({ page }) => {
    const ok = await page.goto("/databases/convex/check/");
    expect(ok!.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check Convex's label");
    const missing = await page.goto("/databases/xata-lite/check/");
    expect(missing!.status()).toBe(404);
  });

  test("a program is checked on its own lines", async ({ page }) => {
    await page.goto("/student-programs/github-student-pack/check/");
    await expect(line(page, "How long it lasts")).toBeVisible();
    await expect(line(page, "What you need")).toBeVisible();
  });
});

test.describe("check a label on a phone (PhoneVerify.dc.html)", () => {
  test.use({ viewport: PHONE });

  test("no side scroll, 44px buttons, send stays in reach", async ({ page }) => {
    await page.goto(NEON);
    await expectNoSideScroll(page);
    const btns = page.locator("form button");
    for (let i = 0; i < (await btns.count()); i++) {
      const b = await btns.nth(i).boundingBox();
      if (b) expect(b.height).toBeGreaterThanOrEqual(44);
    }
    const send = page.getByRole("button", { name: "Send check" });
    await expect(send).toBeInViewport();
    await line(page, "Free storage").getByRole("button", { name: "Changed" }).click();
    await expectNoSideScroll(page);
  });
});

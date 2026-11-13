import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

const NEON = "/databases/neon/check/";
const REPO = process.env.PUBLIC_GITHUB_REPO || "freestackhq/freestack";

/** Clicks Send on GitHub and returns the opened issue form's query. GitHub itself is stubbed. */
async function sendOnGitHub(page: Page): Promise<URLSearchParams> {
  await page.context().route("https://github.com/**", (r) => r.fulfill({ body: "GitHub" }));
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Send on GitHub" }).click();
  const url = new URL((await popup).url());
  expect(`${url.origin}${url.pathname}`).toBe(`https://github.com/${REPO}/issues/new`);
  return url.searchParams;
}

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

  test("all still true: Send on GitHub opens the prefilled issue form", async ({ page }) => {
    await page.goto(NEON);
    const buttons = page.getByRole("button", { name: "Still true" });
    const total = await buttons.count();
    for (let i = 0; i < total; i++) await buttons.nth(i).click();
    await page.getByLabel("Anything else").fill("Looks right");
    const q = await sendOnGitHub(page);

    expect(q.get("template")).toBe("label-check.yml");
    expect(q.get("title")).toBe("Check: Neon");
    expect(q.get("tool")).toBe("neon");
    expect(q.get("source")).toBe("https://neon.tech/pricing");
    expect(q.get("note")).toBe("Looks right");
    const answers = q.get("answers")!.split("\n");
    expect(answers).toHaveLength(total);
    expect(answers[0]).toBe("- metric | Free storage: 0.5 GB | Still true");
    expect(answers.every((l) => l.endsWith("| Still true"))).toBe(true);

    const done = page.getByRole("status").filter({ hasText: "Thanks." });
    await expect(done.getByRole("heading", { level: 1 })).toHaveText("Thanks. Now submit it on GitHub.");
    await expect(done).toContainText("Once it is processed, Neon's label shows it was checked today");
    await expect(done.locator('[data-state="checked"]')).toContainText("Checked today");
    await expect(done.locator('[data-state="review"]')).toHaveCount(0);
    await expect(done.getByRole("link", { name: /GitHub did not open/ })).toHaveAttribute("href", /^https:\/\/github\.com\//);
    await expect(done.getByRole("link", { name: "Check another label" })).toHaveAttribute("href", "/databases");
  });

  test("any changed: a change is waiting for review", async ({ page }) => {
    await page.goto(NEON);
    await line(page, "Limit").getByRole("button", { name: "Still true" }).click();
    const storage = line(page, "Free storage");
    await storage.getByRole("button", { name: "Changed" }).click();
    await storage.getByLabel("What does it say now?").fill("1 GB");
    const q = await sendOnGitHub(page);
    const [storageLine, limitLine] = q.get("answers")!.split("\n");
    expect(storageLine).toBe("- metric | Free storage: 0.5 GB | Changed: 1 GB");
    expect(limitLine).toMatch(/^- limits\.0 \| Limit: .+ \| Still true$/);

    const done = page.getByRole("status").filter({ hasText: "Thanks." });
    await expect(done).toContainText('the label shows "A change is waiting for review" until a maintainer confirms your 1 change');
    await expect(done.locator('[data-state="review"]')).toContainText("A change is waiting for review");
    await expect(done.locator('[data-state="checked"]')).toHaveCount(0);

    // Back to the form keeps the answers.
    await done.getByRole("button", { name: "Back to the form" }).click();
    await expect(storage.getByRole("button", { name: "Changed" })).toHaveAttribute("aria-pressed", "true");
    await expect(storage.getByLabel("What does it say now?")).toHaveValue("1 GB");
  });

  test("Changed with no new value is not sent", async ({ page }) => {
    await page.goto(NEON);
    let opened = false;
    page.on("popup", () => (opened = true));
    const storage = line(page, "Free storage");
    await storage.getByRole("button", { name: "Changed" }).click();
    await page.getByRole("button", { name: "Send on GitHub" }).click();
    const field = storage.getByLabel("What does it say now?");
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toBeFocused();
    await expect(storage).toContainText("Write what the page says now");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check Neon's label");
    expect(opened).toBe(false);
  });

  test("nothing answered is not sent", async ({ page }) => {
    await page.goto(NEON);
    let opened = false;
    page.on("popup", () => (opened = true));
    await page.getByRole("button", { name: "Send on GitHub" }).click();
    await expect(page.getByText("Answer at least one line first.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check Neon's label");
    expect(opened).toBe(false);
  });

  test("too long for a GitHub link: the body to copy and a plain new-issue link", async ({ page }) => {
    await page.goto(NEON);
    let opened = false;
    page.on("popup", () => (opened = true));
    const storage = line(page, "Free storage");
    await storage.getByRole("button", { name: "Changed" }).click();
    await storage.getByLabel("What does it say now?").fill("1 GB");
    await page.getByLabel("Anything else").fill("long ".repeat(2000));
    await page.getByRole("button", { name: "Send on GitHub" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toContainText("Too long for a GitHub link");
    await expect(alert).toContainText("Your answers are still here.");
    const body = alert.getByLabel("Issue description");
    await expect(body).toBeFocused();
    await expect(body).toHaveValue(/^<!-- freestack:label-check -->\n\n### Tool id\n\nneon\n\n### Answers\n\n- metric \| Free storage: 0\.5 GB \| Changed: 1 GB/);
    const issue = alert.getByRole("link", { name: /Open a new issue/ });
    const href = new URL((await issue.getAttribute("href"))!);
    expect(href.pathname).toBe(`/${REPO}/issues/new`);
    expect(href.searchParams.get("labels")).toBe("label-check");
    expect(href.searchParams.get("title")).toBe("Check: Neon");
    // One yellow action at a time, and nothing opened.
    await expect(page.getByRole("button", { name: "Send on GitHub" })).toBeHidden();
    expect(opened).toBe(false);
    await expect(storage.getByLabel("What does it say now?")).toHaveValue("1 GB");

    // A shorter note brings the send button back.
    await page.getByLabel("Anything else").fill("short");
    await expect(page.getByRole("alert")).toBeHidden();
    await expect(page.getByRole("button", { name: "Send on GitHub" })).toBeVisible();
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
    const send = page.getByRole("button", { name: "Send on GitHub" });
    await expect(send).toBeInViewport();
    await line(page, "Free storage").getByRole("button", { name: "Changed" }).click();
    await expectNoSideScroll(page);
  });
});

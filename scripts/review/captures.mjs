/**
 * What screenshots.mjs captures: every route and state in docs/SCREENS.md,
 * with the board each one is compared against. `path` can depend on the build
 * ("fixture" or "real") when the two catalogs need different examples.
 * `overlay: true` shoots the viewport only (menus, dialogs, sheets).
 */

const byBuild = (fixture, real) => (site) => (site === "real" ? real : fixture);

const openSearch = (query) => async (page, vp) => {
  if (vp === "phone") await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Search", exact: true }).click();
  else await page.locator("body").press("Control+k");
  const input = page.getByRole("dialog", { name: "Search" }).getByRole("combobox");
  await input.waitFor();
  if (query) await input.fill(query);
  await page.waitForTimeout(300);
};

const openMenu = async (page, vp) => {
  await page.getByRole("button", { name: vp === "phone" ? "Menu" : "Aisles", exact: true }).click();
  await page.locator("#aisles-menu").waitFor();
};

const openCopy = async (page) => {
  await page.getByRole("button", { name: "Copy this stack" }).first().click();
  await page.getByRole("dialog", { name: "Copy your stack" }).waitFor();
};

export const CAPTURES = [
  // Main pages
  { id: "home", title: "Home", path: "/", boards: { desktop: "Home", phone: "PhoneHome" } },
  { id: "home-indie", title: "Home, Indie builder", path: "/?as=indie", boards: { desktop: "Home", phone: "PhoneHome" } },
  {
    id: "home-no-preset",
    title: "Home, no valid preset (aisle list)",
    path: "/?as=startup",
    boards: { desktop: "Home", phone: "PhoneHome" },
    note: "Fixture startup has no valid preset; real data may have one.",
  },
  { id: "copy-dialog", title: "Copy this stack dialog", path: "/?as=indie", act: openCopy, overlay: true, boards: { desktop: "CopyStack", phone: "CopyStack" } },
  { id: "aisle", title: "Aisle", path: "/databases", boards: { desktop: "Aisle", phone: "Phone" } },
  { id: "aisle-big", title: "Aisle with the most tools", path: "/inference", boards: { desktop: "Aisle", phone: "Phone" } },
  { id: "aisle-tray", title: "Aisle, compare tray with two", path: "/databases?compare=neon,turso", boards: { desktop: "Aisle", phone: "Phone" } },
  {
    id: "aisle-sheet",
    title: "Aisle, phone filter sheet",
    path: "/databases",
    viewports: ["phone"],
    overlay: true,
    act: async (page) => {
      await page.getByRole("button", { name: /^Must allow/ }).click();
      await page.getByRole("dialog", { name: "Must allow" }).waitFor();
    },
    boards: { phone: "PhoneSheet" },
  },
  {
    id: "aisle-no-matches",
    title: "Aisle, no matches",
    path: "/cache?must=sell,no-card,student&type=documents",
    boards: { desktop: "States", phone: "Phone" },
  },
  { id: "aisle-cross", title: "Aisle, compare across aisles", path: "/databases?compare=neon,vercel-hobby", boards: { desktop: "States", phone: "Phone" } },
  {
    id: "aisle-could-not-load",
    title: "Aisle, could not load",
    path: "/databases?type=postgres",
    waitUntil: "domcontentloaded",
    before: async (page) => {
      await page.clock.install();
      await page.route(/\/_astro\/.*\.js$/, (r) => r.abort());
    },
    act: async (page) => page.clock.runFor(11_000),
    boards: { desktop: "States", phone: "Phone" },
  },
  { id: "programs", title: "Claim Once aisle", path: "/student-programs", boards: { desktop: "Programs", phone: "Programs" } },
  { id: "tool", title: "Tool", path: "/databases/neon/", boards: { desktop: "Tool", phone: "PhoneTool" } },
  {
    id: "tool-long-name",
    title: "Tool, long name",
    path: byBuild("/student-programs/github-student-pack/", "/embeddings/workers-ai-embeddings/"),
    boards: { desktop: "Tool", phone: "PhoneTool" },
  },
  {
    id: "tool-unknown-metric",
    title: "Tool, metric not listed",
    path: byBuild("/databases/appwrite/", "/team/loom-screen-studio-lite-paths/"),
    boards: { desktop: "Tool", phone: "PhoneTool" },
  },
  {
    id: "tool-imported",
    title: "Tool from an awesome list",
    path: byBuild("/databases/xata-lite/", "/auth/visual-studio-mobile-center/"),
    boards: { desktop: "Edges", phone: "PhoneTool" },
  },
  { id: "compare", title: "Compare", path: "/compare?ids=neon,turso,supabase", boards: { desktop: "Compare", phone: "PhoneCompare" } },
  { id: "compare-four", title: "Compare, four", path: "/compare?ids=neon,turso,supabase,d1", boards: { desktop: "Compare", phone: "PhoneCompare" } },
  { id: "compare-one", title: "Compare, one tool", path: "/compare?ids=neon", boards: { desktop: "States", phone: "PhoneCompare" } },
  { id: "compare-gone", title: "Compare, a tool no longer exists", path: "/compare?ids=neon,fauna,turso", boards: { desktop: "States", phone: "PhoneCompare" } },
  { id: "compare-cross", title: "Compare, two aisles", path: "/compare?ids=neon,turso,vercel-hobby", boards: { desktop: "States", phone: "PhoneCompare" } },
  { id: "build", title: "Build a stack", path: "/build?as=indie&hosting=cf-workers&database=neon&auth=clerk", boards: { desktop: "Builder", phone: "PhoneBuilder" } },
  { id: "build-empty", title: "Build a stack, no parts yet", path: "/build", boards: { desktop: "Builder", phone: "PhoneBuilder" } },
  {
    id: "build-problems",
    title: "Build a stack, problems",
    path: "/build?as=indie&hosting=vercel-hobby&database=supabase&auth=clerk",
    boards: { desktop: "Builder", phone: "PhoneBuilder" },
  },
  { id: "build-missing-part", title: "Build a stack, D1 without Workers", path: "/build?as=student&database=d1", boards: { desktop: "Builder", phone: "PhoneBuilder" } },
  { id: "search", title: "Search overlay", path: "/", act: openSearch("vercel"), overlay: true, boards: { desktop: "Search", phone: "PhoneSearch" } },
  { id: "search-empty", title: "Search, nothing typed", path: "/", act: openSearch(""), overlay: true, boards: { desktop: "Search", phone: "PhoneSearch" } },
  { id: "search-broad", title: "Search, many results", path: "/", act: openSearch("cloud"), overlay: true, boards: { desktop: "Search", phone: "PhoneSearch" } },
  { id: "search-none", title: "Search, no results", path: "/", act: openSearch("zzqxv"), overlay: true, boards: { desktop: "Edges", phone: "PhoneSearch" } },
  { id: "search-typo", title: "Search, did you mean", path: "/", act: openSearch("pocketbse"), overlay: true, boards: { desktop: "Edges", phone: "PhoneSearch" } },
  { id: "menu", title: "Aisles menu", path: "/", act: openMenu, overlay: true, boards: { desktop: "AislesMenu", phone: "PhoneMenu" } },

  // Side pages
  { id: "check", title: "Check my stack", path: "/check?as=indie&tools=vercel-hobby,supabase,Fauna", boards: { desktop: "CheckStack", phone: "CheckStack" } },
  { id: "check-empty", title: "Check my stack, empty", path: "/check", boards: { desktop: "CheckStack", phone: "CheckStack" } },
  { id: "catch", title: "Catch page", path: "/catches/can-i-sell-on-vercel-hobby/", boards: { desktop: "Trap", phone: "Trap" } },
  { id: "agents", title: "For coding agents", path: "/agents", boards: { desktop: "Agents", phone: "Agents" } },

  // Supplemental
  { id: "verify", title: "Check a label", path: "/databases/neon/check", boards: { desktop: "Verify", phone: "PhoneVerify" } },
  { id: "add", title: "Add a tool", path: "/add", boards: { desktop: "AddTool", phone: "AddTool" } },
  {
    id: "add-sent",
    title: "Add a tool: sent",
    path: "/add?name=Fresh%20Base&url=https%3A%2F%2Ffreshbase.example&aisle=databases",
    act: async (page) => {
      await page.getByLabel("Free storage").fill("512 MB");
      await page.getByLabel("Pricing page").fill("https://freshbase.example/pricing");
      await page.getByRole("button", { name: "Send for review" }).click();
      await page.getByRole("heading", { level: 1 }).waitFor();
    },
    boards: { desktop: "AddToolSent", phone: "AddToolSent" },
  },
  { id: "states", title: "Label states", path: "/dev/states/", boards: { desktop: "States", phone: "States" } },

  // Misc
  { id: "not-found", title: "Not found", path: "/no-such-page-here", boards: { desktop: "NotFound", phone: "NotFound" } },
  { id: "site-error", title: "Site error", path: "/dev/throw", boards: { desktop: "Edges", phone: "Edges" } },
];

/** Boards to shoot: [name, viewport]. Desktop boards at 1440, phone boards at 390. */
export const BOARDS = [
  ...[
    "Home", "Aisle", "Tool", "Compare", "Builder", "Search", "AislesMenu", "CheckStack", "Trap", "Programs", "Agents",
    "CopyStack", "Verify", "AddTool", "AddToolSent", "States", "NotFound", "Edges", "Brand",
  ].map((b) => [b, "desktop"]),
  ...["PhoneHome", "Phone", "PhoneSheet", "PhoneTool", "PhoneCompare", "PhoneBuilder", "PhoneSearch", "PhoneMenu", "PhoneVerify"].map((b) => [b, "phone"]),
];

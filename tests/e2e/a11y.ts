import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/*
 * Shared accessibility checks (issue 7.1, DESIGN.md "Accessibility floor").
 * Used by real-data-a11y.spec.ts (real catalog, prerendered pages) and
 * fresh/a11y.spec.ts (fixture build: on-demand pages, dialogs, menus).
 */

export const DESKTOP = { width: 1440, height: 900 };
export const PHONE = { width: 390, height: 844 };

/** Third-party Scalar reference on /docs: not ours to fix. */
export const SCALAR = "#scalar-root";

/**
 * axe on WCAG 2.2 A/AA plus best practices. Serious and critical findings
 * fail the test; moderate and minor ones are attached as annotations
 * (print them with A11Y_REPORT=1).
 */
export async function audit(page: Page, label: string, opts: { exclude?: string[]; include?: string } = {}) {
  let axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]);
  if (opts.include) axe = axe.include(opts.include);
  for (const sel of opts.exclude ?? []) axe = axe.exclude(sel);
  const { violations } = await axe.analyze();
  const fmt = (v: (typeof violations)[number]) =>
    `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(", ")}`;
  const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of violations.filter((x) => !bad.includes(x))) {
    test.info().annotations.push({ type: "a11y-minor", description: `${label}: ${fmt(v)}` });
    if (process.env.A11Y_REPORT) console.log(`[a11y-minor] ${label}: ${fmt(v)}`);
  }
  expect(bad.map(fmt), label).toEqual([]);
}

const INTERACTIVE =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="switch"], [role="option"], [tabindex]:not([tabindex="-1"])';

/**
 * Tab through the page and report anything that takes focus without a
 * visible ring: an outline, a box shadow, or (for a field) its wrapper's
 * focus-colored outline or rule. Light areas use Focus blue, navy yellow.
 */
export async function missingFocusRings(page: Page, max = 60): Promise<string[]> {
  const missing: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const FOCUS = ["rgb(47, 69, 224)", "rgb(255, 210, 63)"];
      const ringed = (node: Element, own: boolean) => {
        const cs = getComputedStyle(node);
        const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 && FOCUS.includes(cs.outlineColor);
        const shadow = cs.boxShadow !== "none" && FOCUS.some((c) => cs.boxShadow.includes(c));
        const rule = !own && FOCUS.includes(cs.borderBottomColor) && parseFloat(cs.borderBottomWidth) >= 2;
        return outline || shadow || rule;
      };
      // A field may show focus on its wrapper (:focus-within) instead.
      const wrap = el.matches("input, textarea") ? [el.parentElement, el.parentElement?.parentElement] : [];
      const ring = ringed(el, true) || wrap.some((n) => n && ringed(n, false));
      // The ring must contrast with what is around it: blue on light, yellow on navy.
      let bg = "";
      const inset = parseFloat(getComputedStyle(el).outlineOffset) < 0;
      for (let n = inset ? el : el.parentElement; n && !bg; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor;
        if (c !== "rgba(0, 0, 0, 0)" && c !== "transparent") bg = c;
      }
      const oc = getComputedStyle(el).outlineColor;
      const clash = (bg === "rgb(28, 35, 64)" && oc === FOCUS[0]) || (bg !== "rgb(28, 35, 64)" && bg !== "" && oc === FOCUS[1] && getComputedStyle(el).outlineStyle !== "none");
      const id = el.outerHTML.slice(0, 80);
      const name = `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}"`;
      return { ring, clash, name, id };
    });
    if (!info) break;
    if (seen.has(info.id) && i > 2) break; // wrapped around (or a focus trap)
    seen.add(info.id);
    if (!info.ring) missing.push(info.name);
    else if (info.clash) missing.push(`${info.name} (wrong ring color for its background)`);
  }
  return missing;
}

/**
 * Visible interactive elements smaller than 44px on either side. Links
 * inside running text are exempt (WCAG 2.5.8 inline exception).
 */
export async function smallTargets(page: Page, scope = "body"): Promise<string[]> {
  return page.evaluate(
    ([sel, scopeSel]) => {
      const out: string[] = [];
      const root = document.querySelector(scopeSel) ?? document.body;
      for (const el of Array.from(root.querySelectorAll<HTMLElement>(sel))) {
        if (el.closest("#scalar-root, [inert]")) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden") continue;
        // Visually hidden (skip link until focused) or a native control
        // wrapped in a 44px label.
        if (r.width <= 1 && r.height <= 1) continue;
        if (el.matches("input") && el.closest("label")) {
          const lr = el.closest("label")!.getBoundingClientRect();
          if (lr.height >= 44 && lr.width >= 44) continue;
        }
        const inline = cs.display === "inline" && (el.parentElement?.textContent ?? "").trim().length > (el.textContent ?? "").trim().length;
        if (inline) continue;
        if (r.height < 43.5 || r.width < 43.5) {
          out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      return out;
    },
    [INTERACTIVE, scope] as const,
  );
}

/**
 * Structure: one h1 (Scalar's own excepted), banner, main and nav landmarks,
 * alt on every image, every svg either hidden or named, and every control
 * with a name that is more than a symbol (icon-only buttons need a label).
 */
export async function structureProblems(page: Page): Promise<string[]> {
  return page.evaluate((sel) => {
    const out: string[] = [];
    const outside = (el: Element) => !el.closest("#scalar-root");
    const h1s = Array.from(document.querySelectorAll("h1")).filter((h) => outside(h) && h.getClientRects().length > 0);
    if (h1s.length !== 1) out.push(`h1 count ${h1s.length}`);
    if (!document.querySelector("header")) out.push("no banner");
    if (!document.querySelector("main#main")) out.push("no main#main");
    if (!document.querySelector("nav")) out.push("no nav");
    for (const img of Array.from(document.querySelectorAll("img")).filter(outside)) {
      if (!img.hasAttribute("alt")) out.push(`img without alt: ${img.getAttribute("src")}`);
    }
    for (const svg of Array.from(document.querySelectorAll("svg")).filter(outside)) {
      if (svg.closest('[aria-hidden="true"]')) continue;
      if (svg.getAttribute("role") === "img" && (svg.getAttribute("aria-label") || svg.querySelector("title"))) continue;
      out.push(`unnamed svg in ${svg.parentElement?.outerHTML.slice(0, 80)}`);
    }

    // Accessible name: aria-label, aria-labelledby, a <label>, or text that
    // is not aria-hidden (sr-only text counts).
    const text = (n: Node): string => {
      if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? "";
      if (n instanceof Element && n.getAttribute("aria-hidden") === "true") return "";
      return Array.from(n.childNodes).map(text).join("");
    };
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel)).filter(outside)) {
      if (el.getClientRects().length === 0 && !el.closest("dialog")) continue;
      if ((el as HTMLInputElement).type === "hidden") continue;
      const by = el.getAttribute("aria-labelledby");
      const name =
        el.getAttribute("aria-label") ||
        (by ? by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ") : "") ||
        ("labels" in el && (el as HTMLInputElement).labels?.length ? Array.from((el as HTMLInputElement).labels!).map(text).join(" ") : "") ||
        text(el) ||
        el.getAttribute("title") ||
        "";
      const clean = name.trim();
      if (!/[\p{L}\p{N}]/u.test(clean)) out.push(`no name: ${el.outerHTML.slice(0, 100)}`);
    }
    return out;
  }, INTERACTIVE);
}

/** Every page starts with a skip link to #main that shows when focused. */
export async function expectSkipLink(page: Page) {
  await page.keyboard.press("Tab");
  const skip = page.locator(":focus");
  await expect(skip).toHaveAttribute("href", "#main");
  await expect(skip).toHaveText("Skip to content");
  const box = (await skip.boundingBox())!;
  expect(box.width).toBeGreaterThan(40);
  expect(box.height).toBeGreaterThanOrEqual(44);
}

/** With reduced motion, nothing animates or transitions. */
export async function movingElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const secs = (v: string) => Math.max(...v.split(",").map((s) => parseFloat(s) * (s.trim().endsWith("ms") ? 0.001 : 1)));
    if (getComputedStyle(document.documentElement).scrollBehavior === "smooth") out.push("html scroll-behavior smooth");
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const cs = getComputedStyle(el);
      if (cs.animationName !== "none" && secs(cs.animationDuration) > 0.01) out.push(`animation on ${el.tagName}`);
      if (secs(cs.transitionDuration) > 0.01) out.push(`transition on ${el.tagName}.${el.className}`);
    }
    return out;
  });
}

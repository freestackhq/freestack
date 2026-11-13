/**
 * Add a tool (AddTool.dc.html): read the headline figure, spot a tool that is
 * already listed, and turn the form into a pending Tool. Pure and
 * client-safe (no catalog import): callers pass the aisles and tools.
 */
import { compactNumber, slugify } from "./label";
import type { Aisle, SkipIf, Tool, Who, YesNoUnknown } from "./types";

export type Figure =
  | { kind: "number"; value: number; display: string; note?: string }
  | { kind: "none"; display: "?" }
  | { kind: "unlimited"; display: "No limit" }
  | { kind: "text"; display: string }
  | { kind: "empty" }
  | { kind: "invalid" };

const STORAGE: Record<string, number> = { kb: 1 / (1024 * 1024), mb: 1 / 1024, gb: 1, tb: 1024 };
const SCALE: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 };

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** How the figure shows on the label: "0.5 GB" or "100k requests a day". */
export function figureDisplay(value: number, aisle: Aisle): string {
  const n = compactNumber(value);
  if (aisle.unit === "GB") return `${n} GB`;
  return [n, aisle.label, aisle.unit].filter(Boolean).join(" ");
}

/**
 * Reads the vendor's figure as written. Storage aisles convert KB, MB and TB
 * to GB; count aisles take commas and k / M / B. Anything that does not start
 * with a number is invalid: ask for the vendor's number or "Not listed".
 */
export function parseFigure(raw: string, aisle: Aisle | undefined): Figure {
  const text = raw.trim().replace(/\s+/g, " ");
  if (!text) return { kind: "empty" };
  if (/^not listed\.?$/i.test(text)) return { kind: "none", display: "?" };
  if (/^no limit\b/i.test(text)) return { kind: "unlimited", display: "No limit" };
  if (aisle?.metric === "duration") return { kind: "text", display: text };

  const m = /^(?:up to )?(\d[\d,]*(?:\.\d+)?|\.\d+)\s*(.*)$/i.exec(text);
  if (!m) return { kind: "invalid" };
  let value = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(value)) return { kind: "invalid" };
  let rest = m[2].trim();

  if (aisle?.unit === "GB") {
    const u = /^(kb|mb|gb|tb)\b\s*(.*)$/i.exec(rest);
    if (u) {
      value *= STORAGE[u[1].toLowerCase()];
      rest = u[2].trim();
    } else if (rest && !/^per\b/i.test(rest)) {
      return { kind: "invalid" };
    }
  } else {
    const s = /^(thousand|million|billion|k|m|b)\b\s*(.*)$/i.exec(rest);
    if (s) {
      value *= SCALE[s[1].toLowerCase()];
      rest = s[2].trim();
    }
  }

  const per = /\bper [a-z ]+$/i.exec(rest)?.[0].toLowerCase();
  const v = round(value);
  const display = aisle ? figureDisplay(v, aisle) : compactNumber(v);
  return per ? { kind: "number", value: v, display, note: per } : { kind: "number", value: v, display };
}

function normName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function site(u: string): string | null {
  const s = u.trim();
  if (!s) return null;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(s) ? s : `https://${s}`);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return null;
  }
}

/** Same website: host (without www) and path (without trailing slash). */
export function sameSite(a: string, b: string): boolean {
  const x = site(a);
  return x !== null && x === site(b);
}

/**
 * A labeled tool with the same name or website. Imported entries don't count:
 * "Write its label" sends people here on purpose.
 */
export function findListed(tools: Pick<Tool, "id" | "name" | "url" | "source">[], q: { name?: string; url?: string }) {
  const name = normName(q.name ?? "");
  return tools.find(
    (t) => t.source !== "imported" && ((name && normName(t.name) === name) || (q.url && sameSite(t.url, q.url))),
  );
}

function looksLikeUrl(s: string): boolean {
  if (!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(s.trim())) return false;
  try {
    new URL(s.trim());
    return true;
  } catch {
    return false;
  }
}

export interface ToolDraft {
  tool: Tool;
  figure: string;
  credit: string;
}

export type DraftErrors = Partial<Record<"name" | "url" | "aisle" | "figure" | "pricing_url" | "who", string>>;

export function figureError(f: Figure, aisle: Aisle | undefined): string | null {
  if (f.kind === "empty") return 'Write the vendor\'s number, or pick "Not listed".';
  if (f.kind === "invalid") {
    const like = aisle?.unit === "GB" ? "like 0.5 GB" : "with digits, like 10,000";
    return `Write the vendor's number, ${like}. Or pick "Not listed".`;
  }
  return null;
}

const WHO: Who[] = ["anyone", "student_any_id", "student_school_email", "startup_proof"];
const YNU: YesNoUnknown[] = ["yes", "no", "unknown"];

export function resolveAisle(aisles: Aisle[], id: string, text = ""): Aisle | undefined {
  return (
    aisles.find((a) => a.id === id.trim()) ??
    aisles.find((a) => a.name.toLowerCase() === text.trim().toLowerCase() || a.id === text.trim().toLowerCase())
  );
}

/** Turns the Add a tool form into a pending Tool, or says what is missing. */
export function readDraft(
  fd: FormData,
  aisles: Aisle[],
  tools: Pick<Tool, "id" | "name" | "url" | "source" | "aisle">[],
): { draft: ToolDraft | null; errors: DraftErrors; listed?: (typeof tools)[number] } {
  const str = (k: string) => String(fd.get(k) ?? "").trim();
  const list = (k: string) => fd.getAll(k).map((v) => String(v).trim());
  const errors: DraftErrors = {};

  const name = str("name");
  const url = str("url");
  const aisle = resolveAisle(aisles, str("aisle"), str("aisle_text"));
  const figureRaw = str("figure");
  const figure = parseFigure(figureRaw, aisle);
  const pricing = str("pricing_url");
  const who = list("who").filter((w): w is Who => (WHO as string[]).includes(w));

  if (!name) errors.name = "Write the tool's name.";
  if (!looksLikeUrl(url)) errors.url = "Write its website, starting with https://";
  if (!aisle) errors.aisle = "Pick the closest aisle.";
  const fe = figureError(figure, aisle);
  if (fe) errors.figure = fe;
  if (!looksLikeUrl(pricing)) errors.pricing_url = "Add the link where you read the numbers, starting with https://";
  if (who.length === 0) errors.who = "Pick who can claim it.";

  const listed = findListed(tools, { name, url });
  if (listed) errors.name = `${listed.name} is already on freestack.`;

  if (Object.keys(errors).length || !aisle) return { draft: null, errors, listed };

  const pick = (k: string): YesNoUnknown => {
    const v = str(k) as YesNoUnknown;
    return YNU.includes(v) ? v : "unknown";
  };
  const reasons = list("skip_if");
  const instead = list("use_instead");
  const skip_if: SkipIf[] = reasons.flatMap((reason, i) => {
    if (!reason) return [];
    const other = instead[i] ?? "";
    const match = other ? tools.find((t) => normName(t.name) === normName(other) || t.id === other) : undefined;
    return [other ? { reason, use: match?.id ?? slugify(other) } : { reason }];
  });

  const tool: Tool = {
    id: slugify(name),
    name,
    kind: str("kind"),
    url,
    aisle: aisle.id,
    metric: figure.kind === "number" ? figure.value : null,
    ...(figure.kind === "none" ? { metric_note: "Not listed" } : {}),
    ...(figure.kind === "unlimited" ? { metric_note: "No limit" } : {}),
    ...(figure.kind === "number" && figure.note ? { metric_note: figure.note } : {}),
    limits: str("limits")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    who,
    region: str("region") || null,
    sell: pick("sell"),
    card: pick("card"),
    catches: list("catch").filter(Boolean),
    use_if: list("use_if").filter(Boolean),
    skip_if,
    pricing_url: pricing,
    verified_at: null,
    verified_by: null,
    source: "submitted",
    review_pending: true,
  };
  if (aisle.metric === "duration" && figure.kind === "text") tool.metric_note = figure.display;

  return { draft: { tool, figure: figureRaw, credit: str("credit") }, errors };
}

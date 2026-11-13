/**
 * Check a label (Verify.dc.html): the lines a person confirms against the
 * vendor's pricing page, and what their answers mean for the label.
 * Pure and client-safe.
 */
import { headline } from "./label";
import { WHO_LABELS } from "../trust/forms.mjs";
import type { Aisle, Tool, Who } from "./types";

export interface CheckLine {
  id: string;
  /** Where the line lives in data/tools/<id>.yaml ("metric", "limits.0"). The issue form carries it. */
  field: string;
  label: string;
  value: string;
}

export interface CheckAnswer {
  id: string;
  verdict: "holds" | "changed";
  /** What the vendor's page says now. Only for "changed". */
  now?: string;
}

const WHO: Record<Who, string> = WHO_LABELS;

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function checkLines(tool: Tool, aisle: Aisle): CheckLine[] {
  const lines: Omit<CheckLine, "id">[] = [];

  if (tool.program) {
    const p = tool.program;
    lines.push({ field: "program.lasts", label: "How long it lasts", value: p.lasts_sub ? `${p.lasts_big}, ${p.lasts_sub}` : p.lasts_big });
    p.perks.forEach((perk, i) => lines.push({ field: `program.perks.${i}`, label: "Perk", value: perk }));
    if (p.needs) lines.push({ field: "program.needs", label: "What you need", value: p.needs });
  } else {
    const h = headline(tool, aisle);
    const value = !h.known ? "Not listed" : [h.big, h.sub].filter(Boolean).join(" ");
    lines.push({ field: "metric", label: capFirst(aisle.label), value });
  }

  tool.limits.forEach((l, i) => lines.push({ field: `limits.${i}`, label: "Limit", value: l }));
  tool.catches.forEach((c, i) => {
    if (!tool.limits.includes(c)) lines.push({ field: `catches.${i}`, label: "The catch", value: c });
  });
  lines.push({ field: "who", label: "Who can claim it", value: tool.who.map((w) => WHO[w]).join(", ") || "Not listed" });
  lines.push({ field: "sell", label: "Selling allowed", value: tool.sell === "yes" ? "Yes" : tool.sell === "no" ? "No" : "Not listed" });
  lines.push({
    field: "card",
    label: "Credit card at signup",
    value: tool.card === "yes" ? "Needed" : tool.card === "no" ? "Not needed" : "Not listed",
  });

  return lines.map((l, i) => ({ ...l, id: `line-${i + 1}` }));
}

export type CheckOutcome = { kind: "checked" | "review" | "empty"; changed: number };

/**
 * All answered lines still true: the label shows "Checked today" once the
 * issue is processed. Any line changed: "A change is waiting for review"
 * until a maintainer applies it.
 */
export function checkOutcome(answers: CheckAnswer[]): CheckOutcome {
  if (answers.length === 0) return { kind: "empty", changed: 0 };
  const changed = answers.filter((a) => a.verdict === "changed").length;
  return { kind: changed > 0 ? "review" : "checked", changed };
}

export function checkSummary(answered: number, total: number): string {
  return `${answered} of ${total} answered. Unanswered lines stay as they are.`;
}

/**
 * Check a label (Verify.dc.html): the lines a person confirms against the
 * vendor's pricing page, and what their answers mean for the label.
 * Pure and client-safe.
 */
import { headline } from "./label";
import type { Aisle, Tool, Who } from "./types";

export interface CheckLine {
  id: string;
  label: string;
  value: string;
}

export interface CheckAnswer {
  id: string;
  verdict: "holds" | "changed";
  /** What the vendor's page says now. Only for "changed". */
  now?: string;
}

const WHO: Record<Who, string> = {
  anyone: "Anyone",
  student_any_id: "Students with any student ID",
  student_school_email: "Students with a school email",
  startup_proof: "Startups with proof",
};

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function checkLines(tool: Tool, aisle: Aisle): CheckLine[] {
  const lines: Omit<CheckLine, "id">[] = [];

  if (tool.program) {
    const p = tool.program;
    lines.push({ label: "How long it lasts", value: p.lasts_sub ? `${p.lasts_big}, ${p.lasts_sub}` : p.lasts_big });
    for (const perk of p.perks) lines.push({ label: "Perk", value: perk });
    if (p.needs) lines.push({ label: "What you need", value: p.needs });
  } else {
    const h = headline(tool, aisle);
    const value = !h.known ? "Not listed" : [h.big, h.sub].filter(Boolean).join(" ");
    lines.push({ label: capFirst(aisle.label), value });
  }

  for (const l of tool.limits) lines.push({ label: "Limit", value: l });
  for (const c of tool.catches) {
    if (!tool.limits.includes(c)) lines.push({ label: "The catch", value: c });
  }
  lines.push({ label: "Who can claim it", value: tool.who.map((w) => WHO[w]).join(", ") || "Not listed" });
  lines.push({ label: "Selling allowed", value: tool.sell === "yes" ? "Yes" : tool.sell === "no" ? "No" : "Not listed" });
  lines.push({
    label: "Credit card at signup",
    value: tool.card === "yes" ? "Needed" : tool.card === "no" ? "Not needed" : "Not listed",
  });

  return lines.map((l, i) => ({ ...l, id: `line-${i + 1}` }));
}

export type CheckOutcome = { kind: "checked" | "review" | "empty"; changed: number };

/**
 * All answered lines still true: the label shows "Checked today".
 * Any line changed: "A change is waiting for review" until a maintainer applies it.
 */
export function checkOutcome(answers: CheckAnswer[]): CheckOutcome {
  if (answers.length === 0) return { kind: "empty", changed: 0 };
  const changed = answers.filter((a) => a.verdict === "changed").length;
  return { kind: changed > 0 ? "review" : "checked", changed };
}

export function checkSummary(answered: number, total: number): string {
  return `${answered} of ${total} answered. Unanswered lines stay as they are.`;
}

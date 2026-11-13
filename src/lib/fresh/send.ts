/**
 * Sending checks and new tools: both become GitHub issues (ARCHITECTURE.md
 * "Trust loop"). The site sends nothing itself. It builds the prefilled
 * issue-form link, or, when that link would be too long for GitHub, the body
 * to paste into a plain new issue. Pure and client-safe: callers pass the
 * repo (GITHUB_REPO from src/lib/site.ts).
 */
import { ADD_TOOL, LABEL_CHECK, answerLine, issueLink } from "../trust/forms.mjs";
import type { ToolDraft } from "./addtool";
import type { CheckAnswer, CheckLine } from "./checks";
import type { Tool } from "./types";

export type IssueLink = { kind: "url"; url: string } | { kind: "copy"; url: string; body: string };

export interface LabelCheck {
  tool: Pick<Tool, "id" | "name" | "pricing_url">;
  lines: CheckLine[];
  answers: CheckAnswer[];
  note?: string;
}

/** The Answers field: one line per answered label line, in label order. */
export function answersText(lines: CheckLine[], answers: CheckAnswer[]): string {
  const byId = new Map(answers.map((a) => [a.id, a]));
  return lines
    .flatMap((l) => {
      const a = byId.get(l.id);
      return a ? [answerLine({ field: l.field, label: l.label, value: l.value, verdict: a.verdict, now: a.now })] : [];
    })
    .join("\n");
}

/** "Send on GitHub" for Check a label. */
export function labelCheckLink(repo: string, check: LabelCheck, max?: number): IssueLink {
  return issueLink(
    repo,
    LABEL_CHECK,
    `Check: ${check.tool.name}`,
    {
      tool: check.tool.id,
      answers: answersText(check.lines, check.answers),
      source: check.tool.pricing_url,
      note: check.note ?? "",
    },
    max,
  ) as IssueLink;
}

/** The add-tool form's values for a draft, one field per schema field. */
export function addToolValues(draft: ToolDraft): Record<string, string> {
  const t = draft.tool;
  return {
    name: t.name,
    id: t.id,
    url: t.url,
    kind: t.kind,
    aisle: t.aisle,
    figure: draft.figure,
    metric: t.metric === null ? "" : String(t.metric),
    metric_note: t.metric_note ?? "",
    pricing_url: t.pricing_url,
    limits: t.limits.join("\n"),
    who: t.who.join(", "),
    region: t.region ?? "",
    sell: t.sell,
    card: t.card,
    catches: t.catches.join("\n"),
    use_if: t.use_if.join("\n"),
    skip_if: t.skip_if.map((s) => (s.use ? `${s.reason} -> ${s.use}` : s.reason)).join("\n"),
  };
}

/** "Send on GitHub" for Add a tool. */
export function addToolLink(repo: string, draft: ToolDraft, max?: number): IssueLink {
  return issueLink(repo, ADD_TOOL, `Add: ${draft.tool.name}`, addToolValues(draft), max) as IssueLink;
}

/** Open pull requests that add tools, for "Follow it on GitHub". */
export function openAdditionsUrl(repo: string): string {
  return `https://github.com/${repo}/pulls?q=${encodeURIComponent(`is:pr is:open label:${ADD_TOOL.label}`)}`;
}

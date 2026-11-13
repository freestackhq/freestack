import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ADD_TOOL, LABEL_CHECK, MAX_URL, answerLine, issueBody, parseAnswers, parseIssueForm } from "../trust/forms.mjs";
import { addToolLink, addToolValues, answersText, labelCheckLink, openAdditionsUrl } from "./send";
import type { CheckLine } from "./checks";
import type { ToolDraft } from "./addtool";

const REPO = "acme/shelf";
const neon = { id: "neon", name: "Neon", pricing_url: "https://neon.tech/pricing" };
const lines: CheckLine[] = [
  { id: "line-1", field: "metric", label: "Free storage", value: "0.5 GB" },
  { id: "line-2", field: "limits.0", label: "Limit", value: "5 GB data sent out a month" },
  { id: "line-3", field: "sell", label: "Selling allowed", value: "Yes" },
];

describe("labelCheckLink", () => {
  it("prefills the label-check form, answered lines only, in label order", () => {
    const link = labelCheckLink(REPO, {
      tool: neon,
      lines,
      answers: [
        { id: "line-3", verdict: "holds" },
        { id: "line-1", verdict: "changed", now: " 1  GB " },
      ],
      note: "Pricing page moved",
    });
    expect(link.kind).toBe("url");
    const u = new URL(link.url);
    expect(`${u.origin}${u.pathname}`).toBe("https://github.com/acme/shelf/issues/new");
    const q = u.searchParams;
    expect(q.get("template")).toBe("label-check.yml");
    expect(q.get("title")).toBe("Check: Neon");
    expect(q.get("tool")).toBe("neon");
    expect(q.get("source")).toBe("https://neon.tech/pricing");
    expect(q.get("note")).toBe("Pricing page moved");
    expect(q.get("answers")).toBe(
      "- metric | Free storage: 0.5 GB | Changed: 1 GB\n- sell | Selling allowed: Yes | Still true",
    );
  });

  it("leaves empty fields out of the link", () => {
    const link = labelCheckLink(REPO, { tool: neon, lines, answers: [{ id: "line-1", verdict: "holds" }] });
    expect(new URL(link.url).searchParams.has("note")).toBe(false);
  });

  it("too long for GitHub: the body to paste and a plain new-issue link", () => {
    const note = "x".repeat(MAX_URL);
    const link = labelCheckLink(REPO, { tool: neon, lines, answers: [{ id: "line-1", verdict: "holds" }], note });
    expect(link.kind).toBe("copy");
    if (link.kind !== "copy") return;
    const u = new URL(link.url);
    expect(u.searchParams.get("template")).toBeNull();
    expect(u.searchParams.get("title")).toBe("Check: Neon");
    expect(u.searchParams.get("labels")).toBe("label-check");
    expect(link.body.startsWith(LABEL_CHECK.marker)).toBe(true);
    // The pasted body reads back exactly like a submitted form.
    expect(parseIssueForm(link.body, LABEL_CHECK)).toEqual({
      tool: "neon",
      answers: "- metric | Free storage: 0.5 GB | Still true",
      source: "https://neon.tech/pricing",
      note,
    });
  });

  it("carries the answers as the body too, for when the form is missing on GitHub", () => {
    const link = labelCheckLink(REPO, { tool: neon, lines, answers: [{ id: "line-1", verdict: "holds" }] });
    const q = new URL(link.url).searchParams;
    expect(q.get("labels")).toBe("label-check");
    const body = q.get("body") ?? "";
    expect(body.startsWith(LABEL_CHECK.marker)).toBe(true);
    // The workflow reads the blank-issue body exactly like a submitted form.
    expect(parseIssueForm(body, LABEL_CHECK)).toEqual({
      tool: "neon",
      answers: "- metric | Free storage: 0.5 GB | Still true",
      source: "https://neon.tech/pricing",
      note: "",
    });
  });

  it("the limit is on the whole link: drops the body first, then falls back to copy", () => {
    const args = { tool: neon, lines, answers: [{ id: "line-1", verdict: "holds" as const }] };
    const full = labelCheckLink(REPO, args).url;
    expect(labelCheckLink(REPO, args, full.length).url).toBe(full);
    const formOnly = labelCheckLink(REPO, args, full.length - 1);
    expect(formOnly.kind).toBe("url");
    expect(new URL(formOnly.url).searchParams.has("body")).toBe(false);
    expect(new URL(formOnly.url).searchParams.get("answers")).toBe("- metric | Free storage: 0.5 GB | Still true");
    expect(labelCheckLink(REPO, args, formOnly.url.length - 1).kind).toBe("copy");
  });
});

describe("answersText and parseAnswers", () => {
  it("round-trips through the Answers field", () => {
    const text = answersText(lines, [
      { id: "line-1", verdict: "holds" },
      { id: "line-2", verdict: "changed", now: "10 GB | a month" },
    ]);
    expect(parseAnswers(text)).toEqual({
      answers: [
        { field: "metric", verdict: "holds", line: "- metric | Free storage: 0.5 GB | Still true" },
        {
          field: "limits.0",
          verdict: "changed",
          now: "10 GB | a month",
          line: "- limits.0 | Limit: 5 GB data sent out a month | Changed: 10 GB | a month",
        },
      ],
      errors: [],
    });
  });

  it("keeps a new value on one line", () => {
    expect(answerLine({ field: "who", label: "Who", value: "Anyone", verdict: "changed", now: "Students\nonly" })).toBe(
      "- who | Who: Anyone | Changed: Students only",
    );
  });

  it("names lines it cannot read and Changed without a value", () => {
    const r = parseAnswers("- metric | x | Changed:\n- bogus | x | Still true\nhello\n\n- sell | x | still true\n- sell | x | Still true");
    expect(r.answers.map((a) => a.field)).toEqual(["sell"]);
    expect(r.errors).toEqual([
      '"metric" says Changed but not what it says now.',
      'Could not read this line: "- bogus | x | Still true"',
      'Could not read this line: "hello"',
      '"sell" is answered twice.',
    ]);
  });
});

describe("parseIssueForm", () => {
  it("reads GitHub's rendering, with _No response_ as empty", () => {
    const body = issueBody(LABEL_CHECK, { tool: "neon", answers: "- sell | S: Yes | Still true", source: "https://neon.tech/pricing" });
    expect(body).toContain("### Anything else\n\n_No response_");
    expect(parseIssueForm(body, LABEL_CHECK).note).toBe("");
  });

  it("keeps a ### line typed inside an answer, and unwraps a fenced block", () => {
    const body = "### Tool id\n\nneon\n\n### Answers\n\n```text\n- sell | S: Yes | Still true\n```\n\n### Anything else\n\n### not a heading\nmore";
    const r = parseIssueForm(body, LABEL_CHECK);
    expect(r.answers).toBe("- sell | S: Yes | Still true");
    expect(r.note).toBe("### not a heading\nmore");
    expect(r.source).toBe("");
  });
});

describe("addToolLink", () => {
  const draft: ToolDraft = {
    figure: "512 MB",
    tool: {
      id: "fresh-base",
      name: "Fresh Base",
      kind: "Serverless SQLite",
      url: "https://freshbase.example",
      aisle: "databases",
      metric: 0.5,
      limits: ["1 database", "100 writes a second"],
      who: ["anyone", "student_any_id"],
      region: null,
      sell: "unknown",
      card: "no",
      catches: ["Deletes idle databases"],
      use_if: [],
      skip_if: [{ reason: "You need logins", use: "supabase" }, { reason: "You need SQL Server" }],
      pricing_url: "https://freshbase.example/pricing",
      verified_at: null,
      verified_by: null,
      source: "submitted",
    },
  };

  it("maps every schema field the form asks for", () => {
    expect(addToolValues(draft)).toEqual({
      name: "Fresh Base",
      id: "fresh-base",
      url: "https://freshbase.example",
      kind: "Serverless SQLite",
      aisle: "databases",
      figure: "512 MB",
      metric: "0.5",
      metric_note: "",
      pricing_url: "https://freshbase.example/pricing",
      limits: "1 database\n100 writes a second",
      who: "anyone, student_any_id",
      region: "",
      sell: "unknown",
      card: "no",
      catches: "Deletes idle databases",
      use_if: "",
      skip_if: "You need logins -> supabase\nYou need SQL Server",
    });
  });

  it("prefills the add-tool form", () => {
    const link = addToolLink(REPO, draft);
    expect(link.kind).toBe("url");
    const q = new URL(link.url).searchParams;
    expect(q.get("template")).toBe("add-tool.yml");
    expect(q.get("title")).toBe("Add: Fresh Base");
    expect(q.get("metric")).toBe("0.5");
    expect(q.get("limits")).toBe("1 database\n100 writes a second");
  });

  it("falls back to a body to paste when too long", () => {
    const long = { ...draft, tool: { ...draft.tool, limits: ["y".repeat(MAX_URL)] } };
    const link = addToolLink(REPO, long);
    expect(link.kind).toBe("copy");
    if (link.kind === "copy") expect(parseIssueForm(link.body, ADD_TOOL).limits).toBe("y".repeat(MAX_URL));
  });

  it("links to the open additions", () => {
    expect(openAdditionsUrl(REPO)).toBe("https://github.com/acme/shelf/pulls?q=is%3Apr%20is%3Aopen%20label%3Aadd-tool");
  });
});

describe("issue templates match the forms", () => {
  for (const form of [LABEL_CHECK, ADD_TOOL]) {
    it(form.template, () => {
      const yml = readFileSync(`.github/ISSUE_TEMPLATE/${form.template}`, "utf8");
      expect(yml).toMatch(new RegExp(`^labels: \\[${form.label}\\]$`, "m"));
      const fields = [...yml.matchAll(/^ {4}id: (\S+)\n {4}attributes:\n {6}label: (.+)$/gm)].map((m) => ({
        id: m[1],
        label: m[2].replace(/^"|"$/g, ""),
      }));
      expect(fields).toEqual(form.fields);
    });
  }
});

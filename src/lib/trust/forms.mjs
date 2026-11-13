/**
 * The two GitHub issue forms of the trust loop (ARCHITECTURE.md "Trust loop").
 *
 * Shared by the site (which builds the prefilled "new issue" links) and by
 * scripts/trust (which parse the submitted issues in GitHub Actions), so the
 * field ids, labels and the answer-line format live in one place. Plain JS
 * with no imports: Node runs it in the workflows without a build step.
 * .github/ISSUE_TEMPLATE/*.yml must use the same ids and labels (a test checks).
 */

/** GitHub refuses or truncates longer "new issue" links. */
export const MAX_URL = 8000;

/** What GitHub writes for an optional field left empty. */
export const NO_RESPONSE = "_No response_";

/**
 * @typedef {{ id: string, label: string }} Field
 * @typedef {{ template: string, label: string, marker: string, fields: Field[] }} IssueForm
 */

/** @type {IssueForm} */
export const LABEL_CHECK = {
  template: "label-check.yml",
  label: "label-check",
  marker: "<!-- freestack:label-check -->",
  fields: [
    { id: "tool", label: "Tool id" },
    { id: "answers", label: "Answers" },
    { id: "source", label: "Where you checked" },
    { id: "note", label: "Anything else" },
  ],
};

/** @type {IssueForm} */
export const ADD_TOOL = {
  template: "add-tool.yml",
  label: "add-tool",
  marker: "<!-- freestack:add-tool -->",
  fields: [
    { id: "name", label: "Tool name" },
    { id: "id", label: "Tool id" },
    { id: "url", label: "Website" },
    { id: "kind", label: "What it is" },
    { id: "aisle", label: "Aisle id" },
    { id: "figure", label: "The big number, as the vendor writes it" },
    { id: "metric", label: "The big number in the aisle's unit" },
    { id: "metric_note", label: "Note on the big number" },
    { id: "pricing_url", label: "Pricing page" },
    { id: "limits", label: "Other limits" },
    { id: "who", label: "Who can claim it" },
    { id: "region", label: "Region lock" },
    { id: "sell", label: "Can you sell with it" },
    { id: "card", label: "Credit card at signup" },
    { id: "catches", label: "Catches" },
    { id: "use_if", label: "Use it if" },
    { id: "skip_if", label: "Skip it if" },
    { id: "note", label: "Anything else" },
  ],
};

/** How each `who` value reads on a Check a label line. */
export const WHO_LABELS = {
  anyone: "Anyone",
  student_any_id: "Students with any student ID",
  student_school_email: "Students with a school email",
  startup_proof: "Startups with proof",
};

// ---------- Building an issue (site side) ----------

const oneLine = (/** @type {string} */ s) => String(s ?? "").replace(/\s+/g, " ").trim();

/**
 * One Check a label answer as a line of the Answers field:
 * "- limits.0 | Limit: 5 GB a month | Changed: 10 GB a month".
 * @param {{ field: string, label: string, value: string, verdict: "holds" | "changed", now?: string }} a
 */
export function answerLine(a) {
  const said = a.verdict === "changed" ? `Changed: ${oneLine(a.now ?? "")}` : "Still true";
  return `- ${a.field} | ${oneLine(a.label)}: ${oneLine(a.value)} | ${said}`;
}

/**
 * The issue body as GitHub renders a submitted form: "### <label>\n\n<value>".
 * @param {IssueForm} form
 * @param {Record<string, string>} values
 */
export function issueBody(form, values) {
  return form.fields
    .map((f) => {
      const v = String(values[f.id] ?? "").trim();
      return `### ${f.label}\n\n${v || NO_RESPONSE}`;
    })
    .join("\n\n");
}

/**
 * The prefilled issue-form link, or, when it would be too long for GitHub,
 * the body to copy plus a plain "new issue" link.
 * @param {string} repo owner/name
 * @param {IssueForm} form
 * @param {string} title
 * @param {Record<string, string>} values
 * @returns {{ kind: "url", url: string } | { kind: "copy", url: string, body: string }}
 */
export function issueLink(repo, form, title, values, max = MAX_URL) {
  const base = `https://github.com/${repo}/issues/new`;
  const q = new URLSearchParams({ template: form.template, title });
  for (const f of form.fields) {
    const v = String(values[f.id] ?? "").trim();
    if (v) q.set(f.id, v);
  }
  const url = `${base}?${q}`;
  if (url.length <= max) return { kind: "url", url };
  const plain = `${base}?${new URLSearchParams({ title, labels: form.label })}`;
  return { kind: "copy", url: plain, body: `${form.marker}\n\n${issueBody(form, values)}\n` };
}

// ---------- Reading an issue (workflow side) ----------

/**
 * Reads a submitted issue form back into { field id: value }. Only the
 * form's own "### <label>" headings start a section, so a "###" typed inside
 * an answer stays part of it. "_No response_" and missing fields read as "".
 * @param {string} body
 * @param {IssueForm} form
 * @returns {Record<string, string>}
 */
export function parseIssueForm(body, form) {
  const byLabel = new Map(form.fields.map((f) => [f.label.toLowerCase(), f.id]));
  /** @type {Record<string, string[]>} */
  const parts = {};
  let current = null;
  for (const line of String(body ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    const h = /^###\s+(.+?)\s*$/.exec(line);
    const id = h ? byLabel.get(h[1].toLowerCase()) : undefined;
    if (id) {
      current = id;
      parts[id] = [];
    } else if (current) {
      parts[current].push(line);
    }
  }
  /** @type {Record<string, string>} */
  const out = {};
  for (const f of form.fields) {
    let v = (parts[f.id] ?? []).join("\n").trim();
    // A textarea with `render:` comes back fenced.
    const fenced = /^```[a-z]*\n([\s\S]*?)\n```$/.exec(v);
    if (fenced) v = fenced[1].trim();
    out[f.id] = v === NO_RESPONSE ? "" : v;
  }
  return out;
}

/** Fields a Check a label line can point at. */
export const ANSWER_FIELD = /^(metric|who|sell|card|limits\.\d+|catches\.\d+|program\.(?:lasts|needs|perks\.\d+))$/;

/**
 * @typedef {{ field: string, verdict: "holds" | "changed", now?: string, line: string }} ParsedAnswer
 */

/**
 * Reads the Answers field. Blank lines are skipped; any other line that does
 * not follow the format is an error, and so is "Changed" with no new value.
 * @param {string} text
 * @returns {{ answers: ParsedAnswer[], errors: string[] }}
 */
export function parseAnswers(text) {
  /** @type {ParsedAnswer[]} */
  const answers = [];
  /** @type {string[]} */
  const errors = [];
  const seen = new Set();
  for (const raw of String(text ?? "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^[-*]\s+(\S+)\s*\|(.*?)\|\s*(Still true|Changed\s*:?\s*(.*))\s*$/i.exec(line);
    if (!m || !ANSWER_FIELD.test(m[1])) {
      errors.push(`Could not read this line: "${line}"`);
      continue;
    }
    const field = m[1];
    if (seen.has(field)) {
      errors.push(`"${field}" is answered twice.`);
      continue;
    }
    seen.add(field);
    if (/^still true$/i.test(m[3])) {
      answers.push({ field, verdict: "holds", line });
    } else {
      const now = oneLine(m[4] ?? "");
      if (!now) errors.push(`"${field}" says Changed but not what it says now.`);
      else answers.push({ field, verdict: "changed", now, line });
    }
  }
  return { answers, errors };
}

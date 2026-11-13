#!/usr/bin/env node
/**
 * label-check workflow (ARCHITECTURE.md "Trust loop"). Reads a Check a label
 * issue and:
 * - every answer "Still true": sets verified_at (today, UTC) and verified_by
 *   (the issue author) in data/tools/<id>.yaml on the default branch, then
 *   comments and closes the issue;
 * - any "Changed": adds { tool, issue, opened } to data/state/reviews.yaml
 *   and opens a PR (branch label-check/<issue>) that applies the new values
 *   and removes that entry, with "Closes #<issue>";
 * - issue closed without that PR merging: removes the entry, closes the PR;
 * - unknown tool or unreadable answers: comments and labels it `invalid`.
 * The decisions are pure functions below; main() carries them out.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { LABEL_CHECK, WHO_LABELS, parseAnswers, parseIssueForm } from "../../src/lib/trust/forms.mjs";
import { createGitHub, readEvent, readText } from "./github.mjs";
import {
  readAisles,
  readReviews,
  readScalar,
  removeScalar,
  scalar,
  setFlowList,
  setListItem,
  setScalar,
  writeReviews,
} from "./yaml.mjs";

/** @typedef {import("../../src/lib/trust/forms.mjs").ParsedAnswer} ParsedAnswer */

export const REVIEWS_PATH = "data/state/reviews.yaml";
export const toolPath = (id) => `data/tools/${id}.yaml`;
export const branchFor = (issue) => `label-check/${issue}`;

const STORAGE = { kb: 1 / (1024 * 1024), mb: 1 / 1024, gb: 1, tb: 1024 };
const SCALE = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 };

/**
 * A new headline figure in the aisle's unit, the way Add a tool reads one
 * ("1 GB", "512 MB", "200k requests a day", "Not listed", "No limit").
 * Null when it isn't a figure: a person sets it instead of a guess.
 */
export function parseMetric(raw, unit) {
  const text = raw.trim().replace(/\s+/g, " ");
  if (/^not listed\.?$/i.test(text)) return { metric: null, note: "Not listed" };
  if (/^no limit\b/i.test(text)) return { metric: null, note: "No limit" };
  const m = /^(?:up to )?(\d[\d,]*(?:\.\d+)?|\.\d+)\s*(.*)$/i.exec(text);
  if (!m) return null;
  let value = Number(m[1].replace(/,/g, ""));
  let rest = m[2].trim();
  if (unit === "GB") {
    const u = /^(kb|mb|gb|tb)\b\s*(.*)$/i.exec(rest);
    if (u) {
      value *= STORAGE[u[1].toLowerCase()];
      rest = u[2].trim();
    }
    if (rest && !/^per\b/i.test(rest)) return null;
  } else {
    const s = /^(thousand|million|billion|k|m|b)\b\s*(.*)$/i.exec(rest);
    if (s) {
      value *= SCALE[s[1].toLowerCase()];
      rest = s[2].trim();
    }
  }
  if (!Number.isFinite(value)) return null;
  const per = /\bper [a-z ]+$/i.exec(rest)?.[0].toLowerCase();
  return { metric: Math.round(value * 1000) / 1000, note: per };
}

const SELL = { yes: "yes", no: "no", "not listed": "unknown", unknown: "unknown", "not sure": "unknown" };
const CARD = { ...SELL, needed: "yes", "not needed": "no" };

function whoIds(text) {
  const byLabel = Object.fromEntries(Object.entries(WHO_LABELS).map(([id, l]) => [l.toLowerCase(), id]));
  const parts = text
    .split(/,| and /)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const ids = parts.map((p) => byLabel[p] ?? (p in WHO_LABELS ? p : null));
  return ids.length && ids.every(Boolean) ? [...new Set(ids)] : null;
}

/** Applies one Changed answer to the tool file text. Null when a person has to. */
export function applyChange(text, answer, unit) {
  const { field, now } = answer;
  if (field === "metric") {
    const f = parseMetric(now, unit);
    if (!f) return null;
    const next = setScalar(text, "metric", scalar(f.metric));
    return f.note ? setScalar(next, "metric_note", scalar(f.note), { after: "metric" }) : removeScalar(next, "metric_note");
  }
  const item = /^(limits|catches)\.(\d+)$/.exec(field);
  if (item) return setListItem(text, item[1], Number(item[2]), scalar(now));
  if (field === "who") {
    const ids = whoIds(now);
    return ids ? setFlowList(text, "who", ids) : null;
  }
  if (field === "sell" || field === "card") {
    const v = (field === "sell" ? SELL : CARD)[now.trim().toLowerCase().replace(/\.$/, "")];
    return v ? setScalar(text, field, v) : null;
  }
  // Claim Once program lines have no field in the tool file yet.
  return null;
}

/** Marks the tool checked: verified_at today and verified_by the GitHub login. */
export function markChecked(text, today, login) {
  const at = setScalar(text, "verified_at", scalar(today), { after: "pricing_url" });
  return setScalar(at, "verified_by", scalar(login), { after: "verified_at" });
}

/**
 * Decides what a Check a label issue means.
 * @returns {{ kind: "reject", reasons: string[] }
 *   | { kind: "verify", tool: string, toolText: string }
 *   | { kind: "review", tool: string, toolText: string, applied: ParsedAnswer[], manual: ParsedAnswer[] }}
 */
export function planLabelCheck({ body, author, today, readTool, aislesText }) {
  const form = parseIssueForm(body, LABEL_CHECK);
  const id = form.tool.trim().replace(/^`|`$/g, "");
  const reasons = [];
  const toolText = /^[a-z0-9-]+$/.test(id) ? readTool(id) : null;
  if (!id) reasons.push("The tool id is empty.");
  else if (toolText === null) reasons.push(`There is no tool with the id \`${id}\` (looked for ${toolPath(id)}).`);
  const { answers, errors } = parseAnswers(form.answers);
  reasons.push(...errors);
  if (!answers.length && !errors.length) reasons.push("No line is answered.");
  if (reasons.length) return { kind: "reject", reasons };

  const checked = markChecked(toolText, today, author);
  const changed = answers.filter((a) => a.verdict === "changed");
  if (!changed.length) return { kind: "verify", tool: id, toolText: checked };

  const unit = readAisles(aislesText ?? "").find((a) => a.id === readScalar(toolText, "aisle"))?.unit ?? "";
  let next = checked;
  const applied = [];
  const manual = [];
  for (const a of changed) {
    const out = applyChange(next, a, unit);
    if (out === null) manual.push(a);
    else {
      next = out;
      applied.push(a);
    }
  }
  return { kind: "review", tool: id, toolText: next, applied, manual };
}

/** Adds the issue's entry to reviews.yaml (once). */
export function addReview(text, entry) {
  const list = readReviews(text);
  if (list.some((e) => e.issue === entry.issue)) return writeReviews(list);
  return writeReviews([...list, entry]);
}

export function removeReview(text, issue) {
  return writeReviews(readReviews(text).filter((e) => e.issue !== issue));
}

export const hasReview = (text, issue) => readReviews(text).some((e) => e.issue === issue);

// ---------- Messages ----------

export function rejectComment(reasons) {
  return [
    "Thanks for checking. We could not read this check:",
    "",
    ...reasons.map((r) => `- ${r}`),
    "",
    "Edit the issue to fix it and it is read again. Answers look like `- limits.0 | Limit: 5 GB a month | Still true` or `| Changed: 10 GB a month`.",
  ].join("\n");
}

export function verifyComment(id, login, today) {
  return `Thanks @${login}. Every line still holds, so \`${id}\` is marked checked on ${today}, by ${login}. The label updates with the next deploy.`;
}

export function prBody(plan, issue) {
  const line = (a) => `- \`${a.field}\`: ${a.now}`;
  return [
    `Changes reported in #${issue} for \`${plan.tool}\`.`,
    "",
    "Compare each value with the vendor's page before merging. Merging also marks the label checked and clears its review entry.",
    "",
    ...(plan.applied.length ? ["Applied:", ...plan.applied.map(line), ""] : []),
    ...(plan.manual.length ? ["Set by hand before merging (not applied automatically):", ...plan.manual.map(line), ""] : []),
    `Closes #${issue}`,
  ].join("\n");
}

// ---------- Running in the workflow ----------

const write = (path, text) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

async function main() {
  const event = readEvent();
  const issue = event.issue;
  const n = issue.number;
  const defaultBranch = event.repository.default_branch;
  const gh = createGitHub({ defaultBranch });
  gh.syncDefault();

  // Closed, or checked after all: drop the review entry and any open PR.
  const cleanup = (why) => {
    const reviews = readText(REVIEWS_PATH);
    if (reviews !== null && hasReview(reviews, n)) {
      write(REVIEWS_PATH, removeReview(reviews, n));
      gh.commitToDefault([REVIEWS_PATH], `chore(data): drop the review for #${n}`);
    }
    gh.closePrs(branchFor(n), why);
  };

  if (event.action === "closed") {
    cleanup(`#${n} was closed without this change, so it is dropped.`);
    return;
  }
  if (issue.state !== "open") return;

  const today = new Date().toISOString().slice(0, 10);
  const plan = () =>
    planLabelCheck({
      body: issue.body ?? "",
      author: issue.user.login,
      today,
      readTool: (id) => readText(toolPath(id)),
      aislesText: readText("data/aisles.yaml"),
    });
  const first = plan();

  if (first.kind === "reject") {
    gh.comment(n, rejectComment(first.reasons));
    gh.addLabel(n, "invalid");
    return;
  }
  gh.removeLabel(n, "invalid");

  if (first.kind === "verify") {
    write(toolPath(first.tool), first.toolText);
    gh.commitToDefault([toolPath(first.tool)], `chore(data): ${first.tool} checked by ${issue.user.login} (#${n})`);
    cleanup(`#${n} was edited: every line now holds, so the label is marked checked instead.`);
    gh.comment(n, verifyComment(first.tool, issue.user.login, today));
    gh.close(n, "completed");
    return;
  }

  // Changed: record the review on the default branch, then a PR that applies and clears it.
  const reviews = readText(REVIEWS_PATH) ?? "";
  if (!hasReview(reviews, n)) {
    write(REVIEWS_PATH, addReview(reviews, { tool: first.tool, issue: n, opened: today }));
    gh.commitToDefault([REVIEWS_PATH], `chore(data): ${first.tool} change waiting for review (#${n})`);
  }
  const branch = branchFor(n);
  gh.commitToBranch(
    branch,
    () => {
      const p = plan(); // re-read: the default branch may have moved
      if (p.kind !== "review") throw new Error(`#${n} no longer reads as a change`);
      write(toolPath(p.tool), p.toolText);
      write(REVIEWS_PATH, removeReview(readText(REVIEWS_PATH) ?? "", n));
    },
    [toolPath(first.tool), REVIEWS_PATH],
    `fix(data): update ${first.tool} from #${n}`,
  );
  const pr = gh.ensurePr(branch, `fix(data): update ${first.tool} label (#${n})`, prBody(first, n), LABEL_CHECK.label);
  if (pr.created) {
    gh.comment(
      n,
      `Thanks @${issue.user.login}. The label now shows "A change is waiting for review". A maintainer compares it with the vendor's page in ${pr.url}.`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

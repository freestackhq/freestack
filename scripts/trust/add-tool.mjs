#!/usr/bin/env node
/**
 * add-tool workflow (ARCHITECTURE.md "Trust loop"). Reads an Add a tool
 * issue and:
 * - builds data/tools/<id>.yaml from the form (source: submitted,
 *   verified_at null, unknowns as `unknown` / null, never a guess),
 *   validates it against schema/tool.schema.json and opens a PR
 *   (branch add-tool/<issue>) with "Closes #<issue>";
 * - the id is already listed: comments with the link to its label and closes;
 * - a form it can't read or a tool that fails the schema: comments, labels `invalid`;
 * - issue closed without the PR merging: closes the PR.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { ADD_TOOL, parseIssueForm } from "../../src/lib/trust/forms.mjs";
import { createGitHub, readEvent, readText } from "./github.mjs";
import { validate } from "./schema.mjs";
import { readAisles, readScalar, toolYaml } from "./yaml.mjs";

export const toolPath = (id) => `data/tools/${id}.yaml`;
export const branchFor = (issue) => `add-tool/${issue}`;

const WHO = ["anyone", "student_any_id", "student_school_email", "startup_proof"];
const YNU = { yes: "yes", no: "no", unknown: "unknown", "": "unknown", "not sure": "unknown", "not listed": "unknown" };

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const lines = (s) =>
  s
    .split("\n")
    .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean);

/**
 * Builds the tool from the form, or says what is wrong with it.
 * @returns {{ tool: object, errors: string[] }}
 */
export function buildTool(form, aisles) {
  const errors = [];
  const name = form.name.trim();
  const id = form.id.trim() || slugify(name);
  if (!name) errors.push("The tool name is empty.");

  const aisle = form.aisle.trim().toLowerCase();
  if (!aisles.some((a) => a.id === aisle))
    errors.push(`There is no aisle \`${aisle || "(empty)"}\`. Use one of: ${aisles.map((a) => a.id).join(", ")}.`);

  // The big number: a number in the aisle's unit, or null with the reason.
  const rawMetric = form.metric.trim().replace(/,/g, "");
  let metric = null;
  if (rawMetric) {
    metric = Number(rawMetric);
    if (!Number.isFinite(metric) || metric < 0) {
      errors.push(`"${form.metric}" is not a number. Write the number in the aisle's unit, or leave it empty.`);
      metric = null;
    }
  }
  let metric_note = form.metric_note.trim() || undefined;
  if (metric === null && !metric_note) metric_note = /^no limit\b/i.test(form.figure.trim()) ? "No limit" : "Not listed";

  const who = form.who
    .split(/[,\s]+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  const badWho = who.filter((w) => !WHO.includes(w));
  if (badWho.length) errors.push(`Who can claim it: \`${badWho.join(", ")}\` is not one of ${WHO.join(", ")}.`);

  const pick = (label, v) => {
    const out = YNU[v.trim().toLowerCase()];
    if (!out) errors.push(`${label}: write yes, no or unknown.`);
    return out ?? "unknown";
  };

  const skip_if = lines(form.skip_if).map((l) => {
    const [reason, use] = l.split(/\s*(?:->|→)\s*/);
    return use?.trim() ? { reason: reason.trim(), use: slugify(use) } : { reason: reason.trim() };
  });

  const tool = {
    id,
    name,
    kind: form.kind.trim(),
    url: form.url.trim(),
    aisle,
    metric,
    ...(metric_note !== undefined ? { metric_note } : {}),
    limits: lines(form.limits),
    who: [...new Set(who.filter((w) => WHO.includes(w)))],
    region: form.region.trim() || null,
    sell: pick("Can you sell with it", form.sell),
    card: pick("Credit card at signup", form.card),
    catches: lines(form.catches),
    use_if: lines(form.use_if),
    skip_if,
    pricing_url: form.pricing_url.trim(),
    verified_at: null,
    verified_by: null,
    source: "submitted",
  };
  return { tool, errors };
}

/**
 * Decides what an Add a tool issue means.
 * @returns {{ kind: "reject", reasons: string[] }
 *   | { kind: "listed", id: string, aisle: string }
 *   | { kind: "add", tool: object, yaml: string }}
 */
export function planAddTool({ body, aislesText, schema, readTool }) {
  const form = parseIssueForm(body, ADD_TOOL);
  const { tool, errors } = buildTool(form, readAisles(aislesText ?? ""));
  if (/^[a-z0-9-]+$/.test(tool.id)) {
    const existing = readTool(tool.id);
    if (existing !== null) return { kind: "listed", id: tool.id, aisle: readScalar(existing, "aisle") ?? "" };
  }
  const reasons = [...errors, ...validate(schema, tool)];
  if (reasons.length) return { kind: "reject", reasons: [...new Set(reasons)] };
  return { kind: "add", tool, yaml: toolYaml(tool) };
}

// ---------- Messages ----------

/** Where a listed tool's label lives: the site when SITE_URL is set, else its data file. */
export function labelUrl({ siteUrl, repo, branch, id, aisle }) {
  if (siteUrl && aisle) return `${siteUrl.replace(/\/+$/, "")}/${aisle}/${id}`;
  return `https://github.com/${repo}/blob/${branch}/${toolPath(id)}`;
}

export function rejectComment(reasons) {
  return [
    "Thanks for adding a tool. We could not turn this into a label yet:",
    "",
    ...reasons.map((r) => `- ${r}`),
    "",
    "Edit the issue to fix it and it is read again.",
  ].join("\n");
}

export function prBody(tool, issue) {
  return [
    `Adds \`${tool.id}\` (${tool.name}) to the ${tool.aisle} aisle, from #${issue}.`,
    "",
    `Compare every number with ${tool.pricing_url} before merging. It goes live as "Not checked yet".`,
    "",
    `Closes #${issue}`,
  ].join("\n");
}

// ---------- Running in the workflow ----------

async function main() {
  const event = readEvent();
  const issue = event.issue;
  const n = issue.number;
  const defaultBranch = event.repository.default_branch;
  const gh = createGitHub({ defaultBranch });
  gh.syncDefault();

  if (event.action === "closed") {
    gh.closePrs(branchFor(n), `#${n} was closed, so this tool is not added.`);
    return;
  }
  if (issue.state !== "open") return;

  const plan = planAddTool({
    body: issue.body ?? "",
    aislesText: readText("data/aisles.yaml"),
    schema: JSON.parse(readFileSync("schema/tool.schema.json", "utf8")),
    readTool: (id) => readText(toolPath(id)),
  });

  if (plan.kind === "reject") {
    gh.comment(n, rejectComment(plan.reasons));
    gh.addLabel(n, "invalid");
    return;
  }
  gh.removeLabel(n, "invalid");

  if (plan.kind === "listed") {
    const url = labelUrl({ siteUrl: process.env.SITE_URL, repo: event.repository.full_name, branch: defaultBranch, ...plan });
    gh.comment(n, `Thanks. \`${plan.id}\` is already on freestack: ${url}\n\nIf its label is wrong, check it from that page instead.`);
    gh.close(n, "not planned");
    return;
  }

  const path = toolPath(plan.tool.id);
  const branch = branchFor(n);
  gh.commitToBranch(
    branch,
    () => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, plan.yaml);
    },
    [path],
    `feat(data): add ${plan.tool.id} from #${n}`,
  );
  const pr = gh.ensurePr(branch, `feat(data): add ${plan.tool.name} (#${n})`, prBody(plan.tool, n), ADD_TOOL.label);
  if (pr.created) gh.comment(n, `Thanks @${issue.user.login}. Your label is in ${pr.url}. A maintainer compares it with the vendor's page.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

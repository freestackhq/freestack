/**
 * Small YAML helpers for the trust-loop workflows. No dependencies, so the
 * workflows run on plain Node without `pnpm install`.
 *
 * Edits are line-based on purpose: changing verified_at or one limit touches
 * just that line, so comments and formatting in data/tools/<id>.yaml survive
 * and the diff stays one line. Only the shapes our data files use are
 * handled (top-level `key: value`, block lists of one-line items, flow lists
 * of ids); anything else returns null and the caller leaves it to a person.
 */

const RESERVED = /^(?:y|n|yes|no|true|false|on|off|null|~)$/i;
const NUMBERISH = /^[-+]?(?:\d[\d_]*)?(?:\.\d+)?(?:e[-+]?\d+)?$/i;

/** A string as a YAML scalar: plain when that is safe, double-quoted otherwise. */
export function scalar(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  const s = String(v);
  const plain =
    /^[A-Za-z0-9][\w .,'()/%+&?=:#-]*$/.test(s) &&
    !/\s$|:$|:\s|\s#/.test(s) &&
    !RESERVED.test(s) &&
    !NUMBERISH.test(s) &&
    !/^\d{4}-\d\d-\d\d/.test(s) &&
    !/^0[xo]/i.test(s) &&
    !/^\d+(?::\d+)+$/.test(s);
  return plain ? s : JSON.stringify(s);
}

/** Splits "value   # comment" without cutting a quoted value. */
function splitComment(rest) {
  const t = rest.trimStart();
  let end = t.length;
  if (t.startsWith('"') || t.startsWith("'")) {
    const close = t.indexOf(t[0], 1);
    const tail = close < 0 ? "" : t.slice(close + 1);
    const hash = tail.search(/\s+#/);
    end = hash < 0 ? t.length : close + 1 + hash;
  } else {
    const hash = t.search(/\s+#/);
    if (hash >= 0) end = hash;
  }
  // The comment keeps its leading spaces, so aligned comments stay aligned.
  return { value: t.slice(0, end).trim(), comment: t.slice(end).trimEnd() };
}

/** Unquotes a plain or quoted scalar as our files write it. */
export function unquote(raw) {
  const v = raw.trim();
  if (v.startsWith('"') && v.endsWith('"') && v.length > 1) {
    try {
      return JSON.parse(v);
    } catch {
      return v.slice(1, -1);
    }
  }
  if (v.startsWith("'") && v.endsWith("'") && v.length > 1) return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

const keyLine = (key) => new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:(.*)$`);

function findKey(lines, key) {
  const re = keyLine(key);
  return lines.findIndex((l) => re.test(l));
}

/** The raw value of a top-level `key: value` line, unquoted, or undefined. */
export function readScalar(text, key) {
  const lines = text.split("\n");
  const i = findKey(lines, key);
  if (i < 0) return undefined;
  return unquote(splitComment(keyLine(key).exec(lines[i])[1]).value);
}

/**
 * Sets a top-level `key: <raw>` line, keeping its trailing comment. A missing
 * key goes after `after` when given, else at the end.
 */
export function setScalar(text, key, raw, { after } = {}) {
  const lines = text.split("\n");
  const i = findKey(lines, key);
  if (i >= 0) {
    const { comment } = splitComment(keyLine(key).exec(lines[i])[1]);
    lines[i] = `${key}: ${raw}${comment}`;
    return lines.join("\n");
  }
  const at = after ? findKey(lines, after) : -1;
  if (at >= 0) {
    lines.splice(at + 1, 0, `${key}: ${raw}`);
    return lines.join("\n");
  }
  const body = text.replace(/\n*$/, "");
  return `${body}\n${key}: ${raw}\n`;
}

/** Drops a top-level `key: value` line if there is one. */
export function removeScalar(text, key) {
  const lines = text.split("\n");
  const i = findKey(lines, key);
  if (i >= 0) lines.splice(i, 1);
  return lines.join("\n");
}

/** Line indexes of a block list's items under a top-level key, or null for any other shape. */
function blockItems(lines, key) {
  const i = findKey(lines, key);
  if (i < 0) return null;
  if (splitComment(keyLine(key).exec(lines[i])[1]).value !== "") return null;
  const items = [];
  for (let j = i + 1; j < lines.length; j++) {
    const l = lines[j];
    if (/^\s+-\s/.test(l) || /^\s+-$/.test(l)) items.push(j);
    else if (/^\s*(#.*)?$/.test(l) || /^\s{2,}\S/.test(l)) continue;
    else break;
  }
  return { at: i, items };
}

/** Replaces item `index` of a block list with `raw`, keeping its comment. Null when it can't. */
export function setListItem(text, key, index, raw) {
  const lines = text.split("\n");
  const found = blockItems(lines, key);
  if (!found || index >= found.items.length) return null;
  const j = found.items[index];
  const m = /^(\s+-\s*)(.*)$/.exec(lines[j]);
  // Items that are maps or span lines are not ours to rewrite.
  if (/^\{|^[\w-]+:\s/.test(m[2]) || (lines[j + 1] && /^\s{4,}\S/.test(lines[j + 1]) && !/^\s+-/.test(lines[j + 1])))
    return null;
  const { comment } = splitComment(m[2]);
  lines[j] = `${m[1]}${raw}${comment}`;
  return lines.join("\n");
}

/** Sets a list of plain ids as one flow line (`who: [anyone, startup_proof]`), whatever shape it had. */
export function setFlowList(text, key, ids) {
  const raw = `[${ids.map(scalar).join(", ")}]`;
  const lines = text.split("\n");
  const found = blockItems(lines, key);
  if (found && found.items.length) {
    const last = found.items[found.items.length - 1];
    lines.splice(found.at, last - found.at + 1, `${key}: ${raw}`);
    return lines.join("\n");
  }
  return setScalar(text, key, raw);
}

/** Aisles from data/aisles.yaml: [{ id, unit }]. Reads the `- id:` list shape. */
export function readAisles(text) {
  const out = [];
  let cur = null;
  for (const l of text.split("\n")) {
    const id = /^-\s+id:\s*(.*)$/.exec(l);
    if (id) {
      cur = { id: unquote(splitComment(id[1]).value), unit: "" };
      out.push(cur);
      continue;
    }
    const unit = /^\s+unit:\s*(.*)$/.exec(l);
    if (cur && unit) cur.unit = unquote(splitComment(unit[1]).value);
  }
  return out;
}

// ---------- data/state/reviews.yaml ----------

export const REVIEWS_HEADER =
  '# Open "Changed" reports from Check a label: the label shows\n' +
  '# "A change is waiting for review" while its tool is listed here.\n' +
  "# Written by the label-check workflow (scripts/trust/label-check.mjs).\n";

/** Reads [{ tool, issue, opened }] from flow (`- { tool: x, ... }`) or block items. */
export function readReviews(text) {
  const items = [];
  let cur = null;
  for (const l of String(text ?? "").split("\n")) {
    if (/^\s*(#.*)?$/.test(l) || /^\[\]\s*$/.test(l.trim())) continue;
    const start = /^-\s*(.*)$/.exec(l);
    const body = start ? start[1] : l;
    if (start) {
      cur = {};
      items.push(cur);
    }
    if (!cur) continue;
    for (const m of body.replace(/^\{|\}\s*$/g, "").matchAll(/([a-z_]+):\s*("[^"]*"|'[^']*'|[^,}#]+)/g)) {
      cur[m[1]] = unquote(m[2]);
    }
  }
  return items
    .filter((e) => e.tool && e.issue)
    .map((e) => ({ tool: e.tool, issue: Number(e.issue), opened: e.opened ?? null }));
}

/** Writes the reviews file: a YAML list, one flow map per line. */
export function writeReviews(entries) {
  if (!entries.length) return `${REVIEWS_HEADER}[]\n`;
  const rows = entries.map((e) => `- { tool: ${scalar(e.tool)}, issue: ${Number(e.issue)}, opened: ${scalar(e.opened)} }`);
  return `${REVIEWS_HEADER}${rows.join("\n")}\n`;
}

// ---------- a new data/tools/<id>.yaml ----------

function list(key, items) {
  if (!items.length) return [`${key}: []`];
  return [`${key}:`, ...items.map((i) => `  - ${scalar(i)}`)];
}

/** A whole tool file, in the field order of data/tools/neon.yaml. */
export function toolYaml(t) {
  const lines = [
    `id: ${t.id}`,
    `name: ${scalar(t.name)}`,
    `kind: ${scalar(t.kind)}`,
    `url: ${scalar(t.url)}`,
    `aisle: ${t.aisle}`,
    `metric: ${scalar(t.metric)}`,
    ...(t.metric_note !== undefined ? [`metric_note: ${scalar(t.metric_note)}`] : []),
    ...list("limits", t.limits),
    `who: [${t.who.join(", ")}]`,
    `region: ${scalar(t.region)}`,
    `sell: ${t.sell}`,
    `card: ${t.card}`,
    ...list("catches", t.catches),
    ...list("use_if", t.use_if),
    ...(t.skip_if.length
      ? ["skip_if:", ...t.skip_if.flatMap((s) => [`  - reason: ${scalar(s.reason)}`, ...(s.use ? [`    use: ${s.use}`] : [])])]
      : ["skip_if: []"]),
    `pricing_url: ${scalar(t.pricing_url)}`,
    `verified_at: ${scalar(t.verified_at)}`,
    `verified_by: ${scalar(t.verified_by)}`,
    `source: ${t.source}`,
  ];
  return `${lines.join("\n")}\n`;
}

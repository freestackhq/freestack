/**
 * Markdown catalog parser (dependency-free).
 *
 * Parses a category file into structured data. Handles the format shared by
 * the freestack catalog repos (see catalogs.config.mjs):
 *
 *   ---
 *   category: Databases & Management
 *   description: One-line description
 *   ---
 *   # Title
 *
 *   ## Comparison Matrix
 *   | Service | Deploy | ... |
 *   |---------|--------|-----|
 *   | [PostgreSQL](#postgresql) | docker | ... |
 *
 *   ## PostgreSQL
 *   | Field | Value |
 *   |-------|-------|
 *   | URL | https://... |
 *   | Deploy | docker, binary |
 *
 *   prose paragraph
 *   **Pick this if** you want X.
 *   **vs MariaDB** — Different layer.
 */

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function splitFrontmatter(md) {
  if (!md.startsWith("---")) return { data: {}, body: md };
  const end = md.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: md };
  const data = parseYaml(md.slice(3, end));
  return { data, body: md.slice(end + 4) };
}

export function parseYaml(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/** Parse a markdown table into rows of cells. Returns [] on no table. */
export function parseTable(lines) {
  const rows = [];
  let inTable = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith("|")) {
      if (inTable && line === "") break;
      continue;
    }
    const cells = line
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) {
      inTable = true; // separator row
      continue;
    }
    if (inTable) rows.push(cells);
    else rows.push(cells);
  }
  return rows;
}

/** Parse the `| Field | Value |` info table into an object. */
export function parseInfoTable(lines) {
  const rows = parseTable(lines);
  const fields = {};
  for (const cells of rows) {
    if (cells.length >= 2 && cells[0] && cells[0] !== "Field") {
      fields[cells[0]] = cells.slice(1).join(", ").trim();
    }
  }
  return fields;
}

function isHeading(line, level) {
  return /^#{2,6}\s/.test(line) && (!level || /^#{2}/.test(line));
}

/**
 * Parse a category markdown file into a category object.
 * @param {string} md raw file content
 * @param {string} file filename used as category id base
 */
export function parseCategoryFile(md, file) {
  const { data, body } = splitFrontmatter(md);
  const lines = body.split("\n");
  const category = {
    id: slugify(file.replace(/\.md$/, "")),
    label: data.category || slugify(file.replace(/\.md$/, "")),
    description: data.description || "",
    file,
    matrix: [],
    entries: [],
  };

  let section = null;
  let current = null;
  const pending = [];
  let matrixHeaders = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{2,6})\s+(.*)$/);

    if (h) {
      const level = h[1].length;
      const title = h[2].trim();
      if (level === 2 && title === "Comparison Matrix") {
        section = "matrix";
        current = null;
        continue;
      }
      if (level === 2) {
        section = "entry";
        current = { name: title, fields: {}, prose: [], pick: "", alternatives: [], matrixCells: {} };
        category.entries.push(current);
        continue;
      }
      // deeper headings inside an entry
      continue;
    }

    if (!section) continue;

    if (section === "matrix") {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length) {
        const sep = cells.every((c) => /^:?-{2,}:?$/.test(c));
        if (sep) continue;
        const name = cells[0].replace(/\[([^\]]+)\]\([^)]*\)/, "$1");
        if (!matrixHeaders.length) {
          matrixHeaders = cells.map((c) => c.toLowerCase());
          continue;
        }
        const row = { service: name, cells: {} };
        matrixHeaders.forEach((h2, i) => {
          if (i > 0 && cells[i] !== undefined) row.cells[h2] = cells[i];
        });
        category.matrix.push(row);
      }
      continue;
    }

    if (section === "entry" && current) {
      if (/^\|/.test(line)) {
        pending.push(line);
        continue;
      }
      if (pending.length) {
        // flush the table once we leave it
        const fields = parseInfoTable(pending);
        Object.assign(current.fields, fields);
        if (fields.URL && !current.url) current.url = fields.URL;
        pending.length = 0;
      }
      const text = line.trim();
      if (!text) continue;
      const pick = text.match(/^\*\*Pick this if\*\*(?:\s*[:—-])?\s*(.*)$/i);
      if (pick) {
        current.pick = pick[1].trim();
        continue;
      }
      const vs = text.match(/^\*\*vs\s+([^*]+?)\*\*\s*(?:—|-|–)?\s*(.*)$/i);
      if (vs) {
        current.alternatives.push({ name: vs[1].trim(), text: vs[2].trim() });
        continue;
      }
      if (text.startsWith("#") || text.startsWith("---")) continue;
      current.prose.push(text);
    }
  }

  // flush trailing table
  if (pending.length && current) {
    const fields = parseInfoTable(pending);
    Object.assign(current.fields, fields);
    if (fields.URL && !current.url) current.url = fields.URL;
  }

  // slug + drop entries with no discernible content
  const seen = new Set();
  for (const e of category.entries) {
    let base = slugify(e.name);
    if (!base) base = "entry";
    let slug = base;
    let n = 2;
    while (seen.has(slug)) slug = `${base}-${n++}`;
    seen.add(slug);
    e.slug = slug;
    e.name = e.name.replace(/^#+\s*/, "");
    e.matrixCells = category.matrix.find((m) => m.service === e.name)?.cells ?? {};
  }

  if (category.entries.length === 0 && category.matrix.length === 0) return null;
  return category;
}
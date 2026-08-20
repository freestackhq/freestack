import { describe, expect, it } from "vitest";

import {
  parseCategoryFile,
  parseInfoTable,
  parseTable,
  parseYaml,
  slugify,
  splitFrontmatter,
} from "./parse.mjs";

describe("slugify", () => {
  it("lowercases and collapses separators", () => {
    expect(slugify("Redis / Valkey")).toBe("redis-valkey");
    expect(slugify("PostgreSQL")).toBe("postgresql");
    expect(slugify("GitHub Student Developer Pack")).toBe("github-student-developer-pack");
  });

  it("treats & as and", () => {
    expect(slugify("Stirling-PDF")).toBe("stirling-pdf");
  });

  it("strips surrounding dashes", () => {
    expect(slugify(" -Foo- ")).toBe("foo");
  });
});

describe("frontmatter", () => {
  it("parses yaml key: value lines", () => {
    expect(parseYaml('category: Databases\norder: 1\n"quoted": "value"')).toEqual({
      category: "Databases",
      order: "1",
      quoted: "value",
    });
  });

  it("splits frontmatter from body", () => {
    const { data, body } = splitFrontmatter("---\ncategory: X\n---\n# X\n\ncontent");
    expect(data).toEqual({ category: "X" });
    expect(body).toContain("content");
  });

  it("handles files without frontmatter", () => {
    const { data, body } = splitFrontmatter("# No frontmatter");
    expect(data).toEqual({});
    expect(body).toContain("No frontmatter");
  });
});

describe("tables", () => {
  it("parses a field/value table", () => {
    const lines = [
      "| Field | Value |",
      "|-------|-------|",
      "| URL | https://x.dev |",
      "| Deploy | docker, binary |",
    ];
    expect(parseInfoTable(lines)).toEqual({
      URL: "https://x.dev",
      Deploy: "docker, binary",
    });
  });

  it("parses generic tables with a separator row", () => {
    const lines = [
      "| Service | Deploy |",
      "|---------|--------|",
      "| [Neon](#neon) | docker |",
    ];
    const rows = parseTable(lines);
    expect(rows).toHaveLength(1);
    expect(rows[0][0]).toBe("[Neon](#neon)");
  });

  it("handles empty input", () => {
    expect(parseTable([])).toEqual([]);
    expect(parseInfoTable([])).toEqual({});
  });
});

describe("parseCategoryFile", () => {
  const md = `---
category: Databases & Management
description: Database servers and admin interfaces
order: 1
---

# Databases & Management

## Comparison Matrix

| Service | Deploy | Maintained |
|---------|--------|------------|
| [PostgreSQL](#postgresql) | docker, binary | active |
| [MariaDB](#mariadb) | docker | active |

---

## PostgreSQL

| Field | Value |
|-------|-------|
| URL | https://www.postgresql.org |
| Deploy | docker, binary |
| License | PostgreSQL |

The most advanced open-source relational database.

**Pick this if** you want a battle-tested relational database.

**vs MariaDB** — PostgreSQL is stronger on extensions.

**vs Redis** — Different layer entirely.

---

## MariaDB

| Field | Value |
|-------|-------|
| URL | https://mariadb.org |
| Deploy | docker |
| License | GPL-2.0 |

Community fork of MySQL.
`;

  it("parses category metadata", () => {
    const cat = parseCategoryFile(md, "databases.md");
    expect(cat?.id).toBe("databases");
    expect(cat?.label).toBe("Databases & Management");
    expect(cat?.description).toBe("Database servers and admin interfaces");
    expect(cat?.order).toBe(1);
    expect(cat?.file).toBe("databases.md");
  });

  it("parses the comparison matrix", () => {
    const cat = parseCategoryFile(md, "databases.md")!;
    expect(cat.matrix).toHaveLength(2);
    expect(cat.matrix[0].service).toBe("PostgreSQL");
    expect(cat.matrix[0].cells.deploy).toBe("docker, binary");
    expect(cat.matrix[0].cells.maintained).toBe("active");
  });

  it("parses entries with fields, prose, pick, and alternatives", () => {
    const cat = parseCategoryFile(md, "databases.md")!;
    expect(cat.entries).toHaveLength(2);

    const pg = cat.entries.find((e) => e.slug === "postgresql")!;
    expect(pg.name).toBe("PostgreSQL");
    expect(pg.fields.URL).toBe("https://www.postgresql.org");
    expect(pg.fields.Deploy).toBe("docker, binary");
    expect(pg.prose[0]).toContain("advanced open-source relational database");
    expect(pg.pick).toContain("battle-tested relational database");
    expect(pg.alternatives).toHaveLength(2);
    expect(pg.alternatives[0]).toEqual({
      name: "MariaDB",
      text: "PostgreSQL is stronger on extensions.",
    });
  });

  it("returns null for files with no entries or matrix", () => {
    expect(parseCategoryFile("# Just a title\n\nnothing here", "empty.md")).toBeNull();
  });

  it("dedupes identical slugs", () => {
    const md2 = md.replace("## MariaDB", "## PostgreSQL");
    const cat = parseCategoryFile(md2, "databases.md")!;
    const slugs = cat.entries.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("postgresql-2");
  });
});
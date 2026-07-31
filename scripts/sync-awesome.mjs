#!/usr/bin/env node
/** Sync src/data/tools.ts → ../awesome-freestack/README.md */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const toolsMod = await import(pathToFileURL(join(root, "src/data/tools.ts")).href);
const { tools, CATEGORIES } = toolsMod;

const cost = {
  free: "free forever",
  credits: "credits",
  student_free: "student free",
  discount: "discount",
};
const who = {
  no: "anyone",
  required: "student required",
  helps: "student helps",
};
const comm = {
  yes: "commercial ok",
  hobby: "hobby only",
  edu: "edu only",
  check: "check ToS",
};

const toc = CATEGORIES.map(
  (c) =>
    `- [${c.label}](#${c.label.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")})`,
).join("\n");

let body = "";
for (const cat of CATEGORIES) {
  const items = tools.filter((t) => t.category === cat.id);
  if (!items.length) continue;
  body += `\n## ${cat.label}\n\n`;
  for (const t of items) {
    const v = t.verified ? ` Verified: ${t.verified}.` : "";
    body += `- **[${t.name}](${t.url})**: ${t.blurb} Limits: ${t.limits}. Who: ${who[t.student]}. Cost: ${cost[t.cost]}. ${comm[t.commercial]}.${v}\n`;
  }
}

const readme = `# Awesome Freestack [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

Curated free developer tools, student unlocks, startup-lean / AI / security / PH campus options — with **limits**, who can claim them, and commercial notes.

Companion site: [freestack.kuyacarlo.dev](https://freestack.kuyacarlo.dev) · repo [\`freestack\`](https://github.com/kuyacarlo/freestack). Offers rotate; re-check vendor pages.

## Contents

${toc}

${body}
---

## Contributing

See [contributing.md](contributing.md). Only add tools you'd actually recommend. Always include a limit string.

## License

[![CC0](https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/cc-zero.svg)](https://creativecommons.org/publicdomain/zero/1.0/)

To the extent possible under law, the contributors have waived all copyright and related rights to this work.
`;

const out = join(root, "..", "awesome-freestack", "README.md");
writeFileSync(out, readme);
console.log(`wrote ${tools.length} tools → ${out}`);

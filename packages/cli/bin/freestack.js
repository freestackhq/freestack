#!/usr/bin/env node
/**
 * freestack CLI — claim checklist + tools lookup via API
 *
 *   npx @kuyacarlo/freestack claim --student --commercial
 *   npx @kuyacarlo/freestack tools --category ai --commercial yes
 *   npx @kuyacarlo/freestack tool neon
 */

const DEFAULT_API = process.env.FREESTACK_API ?? "https://freestack.kuyacarlo.dev";

function usage() {
  console.log(`freestack — claim checklists & tool lookup

Usage:
  freestack claim [--student] [--commercial] [--ph] [--no-ai] [--json]
  freestack tools [--category <id>] [--cost <free|credits|student_free|discount>]
                  [--commercial <yes|hobby|edu|check>] [--student <no|required|helps>]
                  [--q <search>] [--limit <n>] [--json]
  freestack tool <id> [--json]
  freestack health

Env:
  FREESTACK_API   API base (default ${DEFAULT_API})
`);
}

function flag(args, name) {
  return args.includes(`--${name}`);
}

function opt(args, name) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1];
}

async function get(path) {
  const url = `${DEFAULT_API.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${url}\n${text}`);
  }
  return res.json();
}

function printClaim(data) {
  console.log(`\nfreestack claim plan`);
  console.log(`profile  student=${data.profile.student} commercial=${data.profile.commercial} ph=${Boolean(data.profile.ph)} ai=${data.profile.ai !== false}`);
  console.log(`hint     ${data.stackHint}\n`);
  if (data.warnings?.length) {
    for (const w of data.warnings) console.log(`!  ${w}`);
    console.log();
  }
  for (const s of data.steps) {
    console.log(`${s.n}  ${s.title}`);
    console.log(`    ${s.why}`);
    console.log(`    ${s.href}`);
    for (const t of s.tools) {
      console.log(`    - ${t.name}  [${t.limits}]`);
      console.log(`      ${t.url}`);
    }
    console.log();
  }
}

function printTools(data) {
  console.log(`\n${data.count} tools\n`);
  for (const t of data.tools) {
    console.log(`${t.name}  (${t.id})`);
    console.log(`  ${t.blurb}`);
    console.log(`  limits · ${t.limits}`);
    console.log(`  ${t.cost} · student:${t.student} · ${t.commercial}`);
    console.log(`  ${t.url}\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || cmd === "-h" || cmd === "--help") {
    usage();
    process.exit(cmd ? 0 : 1);
  }

  const asJson = flag(args, "json");

  if (cmd === "health") {
    const data = await get("/api/health");
    if (asJson) console.log(JSON.stringify(data, null, 2));
    else console.log(`ok · ${data.tools} tools · ${data.site}`);
    return;
  }

  if (cmd === "claim") {
    const qs = new URLSearchParams();
    if (flag(args, "student")) qs.set("student", "1");
    if (flag(args, "commercial")) qs.set("commercial", "1");
    if (flag(args, "ph")) qs.set("ph", "1");
    if (flag(args, "no-ai")) qs.set("ai", "0");
    const data = await get(`/api/claim?${qs}`);
    if (asJson) console.log(JSON.stringify(data, null, 2));
    else printClaim(data);
    return;
  }

  if (cmd === "tools") {
    const qs = new URLSearchParams();
    for (const k of ["category", "cost", "commercial", "student", "q", "limit"]) {
      const v = opt(args, k);
      if (v) qs.set(k, v);
    }
    const data = await get(`/api/tools?${qs}`);
    if (asJson) console.log(JSON.stringify(data, null, 2));
    else printTools(data);
    return;
  }

  if (cmd === "tool") {
    const id = args[1];
    if (!id) {
      console.error("usage: freestack tool <id>");
      process.exit(1);
    }
    const data = await get(`/api/tools/${encodeURIComponent(id)}`);
    if (asJson) console.log(JSON.stringify(data, null, 2));
    else {
      const t = data.tool;
      console.log(`\n${t.name}\n${t.blurb}\nlimits · ${t.limits}\n${t.url}\n`);
    }
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

#!/usr/bin/env node
/** commit-msg: the subject must be a conventional commit ("fix(ui): ...") or a merge. */
import { readFileSync } from "node:fs";

const TYPES = "feat|fix|chore|docs|test|ci|style|refactor|perf|build|revert";
const CONVENTIONAL = new RegExp(`^(${TYPES})(\\([\\w./-]+\\))?!?: \\S`);
// Git writes these subjects itself (merge, revert, autosquash).
const GIT_MADE = /^(Merge |Revert "|fixup! |squash! |amend! )/;

const subject =
  readFileSync(process.argv[2], "utf8")
    .split("\n")
    .find((l) => l.trim() && !l.startsWith("#")) ?? "";

if (!CONVENTIONAL.test(subject) && !GIT_MADE.test(subject)) {
  console.error(`commit-msg: "${subject}" is not a conventional commit.`);
  console.error(`Start with <type>[(scope)][!]: <summary>, where type is one of ${TYPES.split("|").join(", ")}.`);
  console.error('Example: "fix(label): show Not listed when the metric is null"');
  process.exit(1);
}

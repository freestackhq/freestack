/**
 * The side effects of the trust-loop workflows: git and the gh CLI, both
 * already on GitHub's runners and authenticated by GITHUB_TOKEN (GH_TOKEN).
 * Arguments go to spawnSync as a list, never through a shell, because
 * issue text is untrusted. The pure decisions live in label-check.mjs and
 * add-tool.mjs; this file only carries them out.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

/** The issues event GitHub Actions hands the job. */
export function readEvent() {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path || !existsSync(path)) throw new Error("GITHUB_EVENT_PATH is not set: run this from the workflow.");
  return JSON.parse(readFileSync(path, "utf8"));
}

export function readText(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

/**
 * Runs a command and returns its stdout. stderr is echoed to the log and, on
 * failure, kept in the error message so callers can tell failures apart.
 */
function run(cmd, args, input) {
  const r = spawnSync(cmd, args, { encoding: "utf8", input, maxBuffer: 16 * 1024 * 1024 });
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (exit ${r.status}): ${(r.stderr ?? "").trim()}`);
  return (r.stdout ?? "").trim();
}

const git = (...args) => run("git", args);
const gh = (args, input) => run("gh", args, input);

export const SNAPSHOT = "src/data/catalog.generated.json";
export const touchesData = (paths) => paths.some((p) => p.startsWith("data/"));

/** A failure with a message meant for the maintainer, printed without a stack. */
export class TrustLoopError extends Error {}

/** Repo or org setting "Allow GitHub Actions to create and approve pull requests" is off. */
export const isPrNotPermitted = (message) => /not permitted to create or approve pull requests/i.test(message ?? "");

/** "https://github.com/o/r/pull/12" -> 12, or null. */
export function prNumber(url) {
  const m = /\/pull\/(\d+)/.exec(url ?? "");
  return m ? Number(m[1]) : null;
}

/** The issue comment when the branch is pushed but Actions may not open the PR. */
export function prBlockedComment({ repo, base, branch }) {
  return [
    `The change is pushed to \`${branch}\`, but GitHub Actions is not allowed to open pull requests in this repo, so no PR was opened.`,
    "",
    `A maintainer can open it by hand: https://github.com/${repo}/compare/${base}...${branch}?expand=1`,
    "",
    'Or turn on "Allow GitHub Actions to create and approve pull requests" (repo and org Settings > Actions > General), then edit this issue to run the check again.',
  ].join("\n");
}

/** Ends a workflow script: known failures as one ::error:: line, the rest with their stack. */
export function exitWithError(e) {
  if (e instanceof TrustLoopError) console.log(`::error::${e.message}`);
  else console.error(e);
  process.exit(1);
}

export function createGitHub({ defaultBranch }) {
  git("config", "user.name", "github-actions[bot]");
  git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com");

  /**
   * True when the commit had changes. A change under data/ also rebuilds the
   * committed snapshot (CI rejects a stale one, and the site reads it).
   */
  function commit(paths, message) {
    if (touchesData(paths)) {
      run("node", ["scripts/generate.mjs"]);
      paths = [...paths, SNAPSHOT];
    }
    git("add", "--", ...paths);
    if (!git("status", "--porcelain", "--", ...paths)) return false;
    git("commit", "-m", message);
    return true;
  }

  return {
    comment: (n, body) => gh(["issue", "comment", String(n), "--body-file", "-"], body),
    close: (n, reason) => gh(["issue", "close", String(n), "--reason", reason]),
    addLabel: (n, label) => gh(["issue", "edit", String(n), "--add-label", label]),
    removeLabel(n, label) {
      try {
        gh(["issue", "edit", String(n), "--remove-label", label]);
      } catch {
        // Not there: nothing to remove.
      }
    },

    /** Starts from the latest default branch. */
    syncDefault() {
      git("fetch", "origin", defaultBranch);
      git("checkout", "-B", defaultBranch, `origin/${defaultBranch}`);
    },

    /** Commits on the default branch and pushes, rebasing on a race with another run. */
    commitToDefault(paths, message) {
      if (!commit(paths, message)) return false;
      for (let tries = 1; ; tries++) {
        try {
          git("push", "origin", `HEAD:${defaultBranch}`);
          // Pushes made with GITHUB_TOKEN start no workflows, except a dispatch:
          // ask the deploy workflow to ship the new data.
          if (touchesData(paths)) {
            try {
              gh(["workflow", "run", "deploy.yml", "--ref", defaultBranch]);
            } catch {
              console.warn("deploy.yml could not be dispatched; the daily deploy will pick this up.");
            }
          }
          return true;
        } catch (e) {
          if (tries >= 4) throw e;
          git("pull", "--rebase", "origin", defaultBranch);
        }
      }
    },

    /** A fresh branch off the default branch with one commit, force-pushed. */
    commitToBranch(branch, write, paths, message) {
      git("checkout", "-B", branch, `origin/${defaultBranch}`);
      try {
        write();
        commit(paths, message);
        git("push", "--force", "origin", `HEAD:refs/heads/${branch}`);
      } finally {
        git("checkout", defaultBranch);
      }
    },

    /** Open PRs from a branch: [{ number, url }]. */
    openPrs: (branch) =>
      JSON.parse(gh(["pr", "list", "--head", branch, "--state", "open", "--json", "number,url"]) || "[]"),

    /**
     * Opens a PR unless one is open for the branch, then dispatches CI and
     * Preview on the branch. Returns { url, created }. When Actions may not
     * open PRs, comments on the issue and throws a TrustLoopError.
     */
    ensurePr(branch, title, body, label, issue) {
      const open = this.openPrs(branch);
      let pr = open.length ? { url: open[0].url, created: false } : null;
      if (!pr) {
        const args = ["pr", "create", "--base", defaultBranch, "--head", branch, "--title", title, "--body-file", "-"];
        if (label) args.push("--label", label);
        try {
          pr = { url: gh(args, body), created: true };
        } catch (e) {
          if (!isPrNotPermitted(e.message)) throw e;
          const repo = process.env.GH_REPO ?? "";
          if (issue) this.comment(issue, prBlockedComment({ repo, base: defaultBranch, branch }));
          throw new TrustLoopError(
            `Pushed ${branch}, but GitHub Actions is not permitted to create pull requests. ` +
              'Enable "Allow GitHub Actions to create and approve pull requests" (repo and org settings) or open the PR by hand.',
          );
        }
      }
      this.dispatchChecks(branch, prNumber(pr.url));
      return pr;
    },

    /**
     * A PR opened or pushed with GITHUB_TOKEN starts no pull_request workflows;
     * a dispatch is the exception. The runs land on the branch head, so their
     * checks show on the PR. Failure only warns: a maintainer can still run CI.
     */
    dispatchChecks(branch, number) {
      const runs = [["ci.yml"]];
      if (number) runs.push(["preview.yml", "-f", `pr=${number}`]);
      for (const [file, ...inputs] of runs) {
        try {
          gh(["workflow", "run", file, "--ref", branch, ...inputs]);
        } catch {
          console.log(`::warning::${file} could not be dispatched on ${branch}; run it from the Actions tab.`);
        }
      }
    },

    closePrs(branch, comment) {
      for (const pr of this.openPrs(branch)) {
        gh(["pr", "close", String(pr.number), "--delete-branch", "--comment", comment]);
      }
    },
  };
}

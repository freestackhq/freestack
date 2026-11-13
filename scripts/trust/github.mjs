/**
 * The side effects of the trust-loop workflows: git and the gh CLI, both
 * already on GitHub's runners and authenticated by GITHUB_TOKEN (GH_TOKEN).
 * Arguments go to execFileSync as a list, never through a shell, because
 * issue text is untrusted. The pure decisions live in label-check.mjs and
 * add-tool.mjs; this file only carries them out.
 */
import { execFileSync } from "node:child_process";
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

function run(cmd, args, input) {
  return execFileSync(cmd, args, { encoding: "utf8", input, stdio: ["pipe", "pipe", "inherit"] }).trim();
}

const git = (...args) => run("git", args);
const gh = (args, input) => run("gh", args, input);

export const SNAPSHOT = "src/data/catalog.generated.json";
export const touchesData = (paths) => paths.some((p) => p.startsWith("data/"));

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

    /** Opens a PR unless one is open for the branch. Returns { url, created }. */
    ensurePr(branch, title, body, label) {
      const open = this.openPrs(branch);
      if (open.length) return { url: open[0].url, created: false };
      const args = ["pr", "create", "--base", defaultBranch, "--head", branch, "--title", title, "--body-file", "-"];
      if (label) args.push("--label", label);
      return { url: gh(args, body), created: true };
    },

    closePrs(branch, comment) {
      for (const pr of this.openPrs(branch)) {
        gh(["pr", "close", String(pr.number), "--delete-branch", "--comment", comment]);
      }
    },
  };
}

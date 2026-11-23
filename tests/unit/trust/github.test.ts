import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Every git/gh call goes through spawnSync; the fake answers per command.
const calls: string[][] = [];
let answer: (args: string[]) => { status: number; stdout?: string; stderr?: string } = () => ({ status: 0 });
vi.mock("node:child_process", () => ({
  spawnSync: (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    const r = answer([cmd, ...args]);
    return { stdout: "", stderr: "", ...r };
  },
}));

const { TrustLoopError, createGitHub, isPrNotPermitted, prBlockedComment, prNumber } =
  await import("../../../scripts/trust/github.mjs");

const NOT_PERMITTED =
  "pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)";
const ghCalls = (sub: string) => calls.filter((c) => c[0] === "gh" && c[1] === sub);

beforeEach(() => {
  calls.length = 0;
  answer = () => ({ status: 0 });
  vi.stubEnv("GH_REPO", "freestackhq/freestack");
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("helpers", () => {
  it("spots the Actions PR setting error", () => {
    expect(isPrNotPermitted(NOT_PERMITTED)).toBe(true);
    expect(isPrNotPermitted("HTTP 422: Validation Failed")).toBe(false);
    expect(isPrNotPermitted(undefined)).toBe(false);
  });

  it("reads the PR number from its URL", () => {
    expect(prNumber("https://github.com/o/r/pull/42")).toBe(42);
    expect(prNumber("not a url")).toBeNull();
  });

  it("links the compare page in the blocked comment", () => {
    const body = prBlockedComment({ repo: "o/r", base: "main", branch: "trust/label-check-7" });
    expect(body).toContain("https://github.com/o/r/compare/main...trust/label-check-7?expand=1");
    expect(body).toContain("Allow GitHub Actions to create and approve pull requests");
  });
});

describe("ensurePr", () => {
  it("opens the PR, then dispatches CI and Preview on the branch", () => {
    answer = ([, sub, action]) =>
      sub === "pr" && action === "list"
        ? { status: 0, stdout: "[]" }
        : sub === "pr" && action === "create"
          ? { status: 0, stdout: "https://github.com/o/r/pull/9\n" }
          : { status: 0 };
    const gh = createGitHub({ defaultBranch: "main" });
    expect(gh.ensurePr("trust/x", "t", "b", "label-check", 7)).toEqual({
      url: "https://github.com/o/r/pull/9",
      created: true,
    });
    expect(ghCalls("workflow")).toEqual([
      ["gh", "workflow", "run", "ci.yml", "--ref", "trust/x"],
      ["gh", "workflow", "run", "preview.yml", "--ref", "trust/x", "-f", "pr=9"],
    ]);
  });

  it("reuses an open PR and still dispatches for the new push", () => {
    answer = ([, sub, action]) =>
      sub === "pr" && action === "list"
        ? { status: 0, stdout: JSON.stringify([{ number: 3, url: "https://github.com/o/r/pull/3" }]) }
        : { status: 0 };
    const gh = createGitHub({ defaultBranch: "main" });
    expect(gh.ensurePr("trust/x", "t", "b", "label-check", 7).created).toBe(false);
    expect(ghCalls("pr").some((c) => c[2] === "create")).toBe(false);
    expect(ghCalls("workflow")).toHaveLength(2);
  });

  it("only warns when a dispatch fails", () => {
    answer = ([, sub, action]) =>
      sub === "workflow"
        ? { status: 1, stderr: "HTTP 403" }
        : sub === "pr" && action === "list"
          ? { status: 0, stdout: "[]" }
          : { status: 0, stdout: "https://github.com/o/r/pull/9" };
    const gh = createGitHub({ defaultBranch: "main" });
    expect(gh.ensurePr("trust/x", "t", "b", undefined, 7).created).toBe(true);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("::warning::ci.yml could not be dispatched"));
  });

  it("comments on the issue and fails clearly when Actions may not open PRs", () => {
    answer = ([, sub, action]) =>
      sub === "pr" && action === "list"
        ? { status: 0, stdout: "[]" }
        : sub === "pr" && action === "create"
          ? { status: 1, stderr: NOT_PERMITTED }
          : { status: 0 };
    const gh = createGitHub({ defaultBranch: "main" });
    expect(() => gh.ensurePr("trust/x", "t", "b", "label-check", 7)).toThrow(TrustLoopError);
    const comment = ghCalls("issue").find((c) => c[2] === "comment");
    expect(comment?.slice(0, 4)).toEqual(["gh", "issue", "comment", "7"]);
    expect(ghCalls("workflow")).toEqual([]);
  });

  it("rethrows other PR failures untouched", () => {
    answer = ([, sub, action]) =>
      sub === "pr" && action === "list"
        ? { status: 0, stdout: "[]" }
        : sub === "pr" && action === "create"
          ? { status: 1, stderr: "HTTP 422: Validation Failed" }
          : { status: 0 };
    const gh = createGitHub({ defaultBranch: "main" });
    let error: unknown;
    try {
      gh.ensurePr("trust/x", "t", "b", "label-check", 7);
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeInstanceOf(TrustLoopError);
    expect(String(error)).toContain("Validation Failed");
    expect(ghCalls("issue")).toEqual([]);
  });
});

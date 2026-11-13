/**
 * TRUST-LOOP STUBS. Nothing here sends anything anywhere.
 *
 * The trust-loop phase (ARCHITECTURE.md "Trust loop") replaces these two
 * functions: sendLabelCheck posts to a Worker that checks Turnstile and
 * stores the check in D1; sendNewTool posts to a Worker whose GitHub App
 * opens a pull request. Until then they return canned answers.
 */
import type { ToolDraft } from "./addtool";
import type { CheckAnswer } from "./checks";

/** How a stubbed send should fail, for testing (the page maps `?fail=1` / `?fail=once`). */
export type StubFail = "always" | "once";

export interface LabelCheck {
  tool: string;
  answers: CheckAnswer[];
  /** Name for credit. Empty stays anonymous. */
  name: string;
}

export type SendResult = { ok: true } | { ok: false; reason: "person" | "network" };

/** STUB. Sends one label check. `attempt` counts from 1. */
export async function sendLabelCheck(
  check: LabelCheck,
  opts: { fail?: StubFail; attempt?: number } = {},
): Promise<SendResult> {
  void check;
  const attempt = opts.attempt ?? 1;
  if (opts.fail === "always" || (opts.fail === "once" && attempt === 1)) return { ok: false, reason: "person" };
  return { ok: true };
}

/** Placeholder: no pull request is opened yet. */
export const PLACEHOLDER_PR_URL = "#pull-request-placeholder";

export interface SendToolResult {
  ok: true;
  prUrl: string;
  /** True while this is a stub: the link goes nowhere. */
  placeholder: boolean;
}

/** STUB. Sends a new tool for review. Called by /add/sent on the server. */
export async function sendNewTool(draft: ToolDraft): Promise<SendToolResult> {
  void draft;
  return { ok: true, prUrl: PLACEHOLDER_PR_URL, placeholder: true };
}

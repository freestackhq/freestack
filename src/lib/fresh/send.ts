/**
 * TRUST-LOOP STUBS. Nothing here sends anything anywhere.
 *
 * The trust-loop phase (ARCHITECTURE.md "Trust loop") replaces these two
 * functions: sendLabelCheck posts to a Worker that checks Turnstile and
 * stores the check in D1; sendNewTool posts to a Worker whose GitHub App
 * opens a pull request. Until then they return canned answers.
 */
import type { CheckAnswer } from "./checks";
import type { Tool } from "./types";

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

export interface NewToolDraft {
  tool: Tool;
  /** The headline figure as the person wrote it ("512 MB"). */
  figure: string;
  /** Name for credit. Empty stays anonymous. */
  credit: string;
}

export type SendToolResult = { ok: true; prUrl: string; placeholder: boolean } | { ok: false; reason: "network" };

/** STUB. Sends a new tool for review. */
export async function sendNewTool(draft: NewToolDraft, opts: { fail?: StubFail } = {}): Promise<SendToolResult> {
  void draft;
  if (opts.fail) return { ok: false, reason: "network" };
  return { ok: true, prUrl: PLACEHOLDER_PR_URL, placeholder: true };
}

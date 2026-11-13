/**
 * Browser API for the Copy this stack dialog (src/components/fresh/CopyStack.astro).
 * Pages call these; the component listens. Any page that calls them must
 * render <CopyStack /> once.
 */
import type { CopyStackData } from "./stack";

export const OPEN_EVENT = "copy-stack:open";
export const SHARE_EVENT = "copy-stack:share";

export type CopyFormat = "md" | "link" | "agent";

/** Open the dialog with this stack and copy it in that format right away. */
export function openCopyStack(data: CopyStackData, format: CopyFormat = "md"): void {
  document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { data, format } }));
}

/** Copy the share link right away and show the "Link copied" toast. */
export function shareStack(data: CopyStackData): void {
  document.dispatchEvent(new CustomEvent(SHARE_EVENT, { detail: { data } }));
}

/** Write to the clipboard. Resolves false instead of throwing. */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

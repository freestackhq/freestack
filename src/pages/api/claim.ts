import type { APIRoute } from "astro";
import { buildClaimPlan, parseClaimQuery, type ClaimProfile } from "../../lib/catalog";
import { json, options } from "../../lib/http";
import { SITE_URL } from "../../lib/site";

export const prerender = false;

export const OPTIONS: APIRoute = () => options();

/** Claim plan for the published CLI (`freestack claim`), built from the Claim Once aisles. */
export const GET: APIRoute = ({ url }) => json({ ok: true, ...buildClaimPlan(parseClaimQuery(url.searchParams), SITE_URL) });

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as Partial<ClaimProfile> | null;
  if (!body || typeof body !== "object") return json({ ok: false, error: "JSON body expected" }, { status: 400 });
  const profile: ClaimProfile = {
    student: Boolean(body.student),
    commercial: Boolean(body.commercial),
    ph: Boolean(body.ph),
    ai: body.ai === undefined ? true : Boolean(body.ai),
  };
  return json({ ok: true, ...buildClaimPlan(profile, SITE_URL) });
};

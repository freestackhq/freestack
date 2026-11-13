/**
 * Fill the pick-free-stack skill with this deploy's address. The source copy
 * in skills/ says `<freestack site>` because SITE_URL is an env var; the
 * served copy (/skills/pick-free-stack/SKILL.md) and the plugin copy
 * (scripts/build-plugin.mjs) put the real origin in its place.
 */
export const SITE_PLACEHOLDER = "<freestack site>";

/** @param {string} skill SKILL.md source  @param {string} siteUrl origin, no trailing slash */
export function fillSkill(skill, siteUrl) {
  const origin = siteUrl.replace(/\/+$/, "");
  return skill.replace(/^If the address above still reads .*\n\n?/m, "").replaceAll(SITE_PLACEHOLDER, origin);
}

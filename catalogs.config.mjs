/**
 * Catalog sources for the freestack generator.
 *
 * The site is a template: point it at any set of GitHub repos that keep
 * their catalog as Markdown (one category file per category), run
 * `pnpm catalog:fetch && pnpm catalog:generate`, and the pages/API
 * rebuild from the committed snapshot in src/data/catalog.generated.json.
 *
 * Category file shape (see freestackhq/selfhosted):
 *   - YAML frontmatter: category, description
 *   - `## Comparison Matrix` table: quick-scan row per service
 *   - `## <Service>` sections: Field/Value table + prose
 *   - `**Pick this if**` paragraph + `**vs X**` alternative lines
 */

export const catalogs = [
  {
    id: "selfhosted",
    label: "Self-hosted",
    description:
      "Self-hosted software — deployment, resource, auth, and alternatives compared.",
    owner: "freestackhq",
    repo: "selfhosted",
    branch: "main",
    filters: [
      { key: "deploy", label: "Deploy", kind: "multiselect" },
      { key: "license", label: "License", kind: "multiselect" },
      { key: "maintained", label: "Maintained", kind: "single" },
    ],
  },
  {
    id: "free-tools",
    label: "Free tools",
    description:
      "Free developer tools and student unlocks — hard limits, eligibility, commercial notes.",
    owner: "freestackhq",
    repo: "free-tools",
    branch: "main",
    filters: [
      { key: "cost", label: "Cost", kind: "single" },
      { key: "student", label: "Eligibility", kind: "single" },
      { key: "commercial", label: "Commercial", kind: "single" },
    ],
  },
];
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
    id: "saas",
    label: "SaaS",
    description:
      "Free developer SaaS tools and student unlocks — hard limits, eligibility, commercial notes.",
    owner: "freestackhq",
    repo: "saas",
    branch: "main",
    filters: [
      { key: "cost", label: "Cost", kind: "single" },
      { key: "student", label: "Eligibility", kind: "single" },
      { key: "commercial", label: "Commercial", kind: "single" },
    ],
  },
  {
    id: "apis",
    label: "APIs",
    description:
      "Free APIs for weather, crypto, geo, news, finance, and reference data — with rate limits and auth details.",
    owner: "freestackhq",
    repo: "apis",
    branch: "main",
    filters: [
      { key: "auth", label: "Auth", kind: "single" },
      { key: "cors", label: "CORS", kind: "single" },
      { key: "status", label: "Status", kind: "single" },
    ],
  },
  {
    id: "llm-ai",
    label: "LLM & AI",
    description:
      "Free LLM inference, embeddings, local models, and AI developer tooling — models, limits, and compatibility.",
    owner: "freestackhq",
    repo: "llm-ai",
    branch: "main",
    filters: [
      { key: "openai-compatible", label: "OpenAI-compatible", kind: "single" },
      { key: "self-host", label: "Self-host", kind: "single" },
      { key: "status", label: "Status", kind: "single" },
    ],
  },
];
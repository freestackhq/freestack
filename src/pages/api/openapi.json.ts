import type { APIRoute } from "astro";
import { SITE_URL } from "../../lib/site";
import { CATALOGS } from "../../lib/catalog";
import { snapshot } from "../../lib/fresh/catalog";
import { json, options } from "../../lib/http";

export const prerender = false;

const catalogEnum = CATALOGS.map((c) => c.id);
const aisleEnum = snapshot().aisles.map((a) => a.id);

const openapi = {
  openapi: "3.1.0",
  info: {
    title: "freestack API",
    version: "0.3.0",
    description:
      "Public JSON API for freestack: free developer tools as shelf labels, grouped into aisles. The old catalog ids (saas, apis, llm-ai) still work as aliases for the aisle groups. CORS open.",
    license: { name: "MIT" },
  },
  servers: [
    { url: SITE_URL, description: "Production" },
  ],
  tags: [{ name: "health" }, { name: "catalogs" }, { name: "entries" }],
  paths: {
    "/api/health": {
      get: {
        tags: ["health"],
        summary: "Service ping",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalogs": {
      get: {
        tags: ["catalogs"],
        summary: "List all catalogs with category counts",
        operationId: "listCatalogs",
        responses: {
          "200": {
            description: "Catalog list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CatalogsResponse" },
              },
            },
          },
        },
      },
    },
    "/api/entries": {
      get: {
        tags: ["entries"],
        summary: "Search and filter entries across catalogs",
        operationId: "listEntries",
        parameters: [
          {
            name: "catalog",
            in: "query",
            schema: { type: "string", enum: catalogEnum },
            description: "Old catalog id, an alias for aisle groups: saas = Build + Claim Once, apis = Free and Open Data, llm-ai = AI",
          },
          {
            name: "category",
            in: "query",
            schema: { type: "string" },
            description: "Aisle id, or an old category id (mapped to its aisle)",
          },
          {
            name: "aisle",
            in: "query",
            schema: { type: "string", enum: aisleEnum },
            description: "Filter to one aisle",
          },
          {
            name: "group",
            in: "query",
            schema: { type: "string", enum: ["Build", "AI", "Free and Open Data", "Claim Once"] },
            description: "Filter to one aisle group",
          },
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Free-text search across names, fields, and prose",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 200 },
          },
        ],
        responses: {
          "200": {
            description: "Entry list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EntriesResponse" },
              },
            },
          },
        },
      },
    },
    "/api/tools": {
      get: {
        tags: ["entries"],
        summary: "Flat tool list (used by the freestack CLI)",
        operationId: "listTools",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" }, description: "Aisle id or old category id" },
          { name: "cost", in: "query", schema: { type: "string", enum: ["free", "credits", "student_free", "discount"] } },
          { name: "commercial", in: "query", schema: { type: "string", enum: ["yes", "hobby", "edu", "check"] } },
          { name: "student", in: "query", schema: { type: "string", enum: ["no", "required", "helps"] } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1 } },
        ],
        responses: { "200": { description: "Tool list", content: { "application/json": { schema: { type: "object" } } } } },
      },
    },
    "/api/tools/{id}": {
      get: {
        tags: ["entries"],
        summary: "One tool by id",
        operationId: "getTool",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "The tool", content: { "application/json": { schema: { type: "object" } } } },
          "404": { description: "No such tool", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/api/claim": {
      get: {
        tags: ["entries"],
        summary: "Claim plan from the Claim Once aisles (used by the freestack CLI)",
        operationId: "getClaimPlan",
        parameters: [
          { name: "student", in: "query", schema: { type: "string", enum: ["1", "0"] } },
          { name: "commercial", in: "query", schema: { type: "string", enum: ["1", "0"] } },
          { name: "ph", in: "query", schema: { type: "string", enum: ["1", "0"] } },
          { name: "ai", in: "query", schema: { type: "string", enum: ["1", "0"] } },
        ],
        responses: { "200": { description: "Claim plan", content: { "application/json": { schema: { type: "object" } } } } },
      },
    },
    "/api/openapi.json": {
      get: {
        tags: ["health"],
        summary: "This OpenAPI document",
        operationId: "getOpenApi",
        responses: {
          "200": {
            description: "OpenAPI 3.1 JSON",
            content: {
              "application/json": { schema: { type: "object" } },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          service: { type: "string" },
          version: { type: "string" },
          catalogs: { type: "integer" },
          entries: { type: "integer" },
          endpoints: { type: "object", additionalProperties: { type: "string" } },
          site: { type: "string" },
        },
      },
      CatalogsResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          catalogs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                description: { type: "string" },
                categories: { type: "integer" },
                entries: { type: "integer" },
              },
            },
          },
        },
      },
      Entry: {
        type: "object",
        properties: {
          id: { type: "string", description: "Old id: catalog/category/slug" },
          tool: { type: "string", description: "Tool id; the page is /<aisle>/<tool>" },
          aisle: { type: "string" },
          group: { type: "string" },
          href: { type: "string" },
          kind: { type: "string" },
          tagline: { type: ["string", "null"] },
          metric: { type: ["number", "null"], description: "Headline value in the aisle's unit; null = not listed" },
          metric_key: { type: ["string", "null"] },
          metric_unit: { type: ["string", "null"] },
          metric_label: { type: ["string", "null"] },
          metric_note: { type: ["string", "null"] },
          limits: { type: "array", items: { type: "string" } },
          who: { type: "array", items: { type: "string" } },
          sell: { enum: ["yes", "no", "unknown"] },
          card: { enum: ["yes", "no", "unknown"] },
          cost: { type: ["string", "null"] },
          catches: { type: "array", items: { type: "string" } },
          verified_at: { type: ["string", "null"] },
          verified_by: { type: ["string", "null"] },
          label_state: { enum: ["checked", "unchecked", "overdue", "review", "vendor-changed", "imported"] },
          source: { enum: ["catalog", "submitted", "imported"] },
          imported_from: { type: ["string", "null"] },
          catalog: { type: "string" },
          category: { type: "string" },
          categoryLabel: { type: "string" },
          name: { type: "string" },
          url: { type: "string", format: "uri" },
          fields: { type: "object", additionalProperties: { type: "string" } },
          pick: { type: "string" },
          prose: { type: "array", items: { type: "string" } },
          alternatives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                text: { type: "string" },
              },
            },
          },
        },
      },
      EntriesResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          count: { type: "integer" },
          entries: {
            type: "array",
            items: { $ref: "#/components/schemas/Entry" },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          error: { type: "string" },
        },
      },
    },
  },
};

export const OPTIONS: APIRoute = () => options();

export const GET: APIRoute = () => json(openapi);

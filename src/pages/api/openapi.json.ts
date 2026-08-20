import type { APIRoute } from "astro";
import { CATALOGS } from "../../lib/catalog";
import { json, options } from "../../lib/http";

export const prerender = false;

const catalogEnum = CATALOGS.map((c) => c.id);

const openapi = {
  openapi: "3.1.0",
  info: {
    title: "freestack API",
    version: "0.2.0",
    description:
      "Public JSON API for the freestack catalog directory — multi-catalog search, filtering, and health. CORS open.",
    license: { name: "MIT" },
  },
  servers: [
    { url: "https://freestack.kuyacarlo.dev", description: "Production" },
    { url: "http://localhost:4321", description: "Local Astro" },
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
            description: "Filter to a single catalog",
          },
          {
            name: "category",
            in: "query",
            schema: { type: "string" },
            description: "Filter to a single category (slug)",
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
          id: { type: "string", description: "catalog/category/slug" },
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

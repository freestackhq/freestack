/**
 * Remote MCP server (Streamable HTTP, stateless, read-only). Protocol and
 * tools live in src/lib/mcp/.
 */
import type { APIRoute } from "astro";
import { handleHttp } from "../lib/mcp/protocol";
import { freestackServer } from "../lib/mcp/server";

export const prerender = false;

export const ALL: APIRoute = ({ request }) => handleHttp(request, freestackServer);

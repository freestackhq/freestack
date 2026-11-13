/**
 * A tiny, stateless MCP server over Streamable HTTP. Hand-written instead of
 * the SDK: the server only lists and calls read-only tools, so a few hundred
 * lines with no dependencies run as-is on Workers.
 *
 * Dual era (see the 2026-07-28 versioning page):
 * - Modern requests carry `_meta["io.modelcontextprotocol/protocolVersion"]`
 *   and the mirrored MCP-Protocol-Version / Mcp-Method / Mcp-Name headers.
 *   They are served per request; `server/discover` answers who we are.
 * - Legacy clients (2025-11-25 and earlier) open with `initialize`. There is
 *   no session to keep: every later request is answered on its own.
 *
 * POST only (GET/DELETE get 405), application/json responses, no SSE, no
 * sessions, no auth. CORS is open and every Origin is accepted: the data is
 * public, read-only and served without cookies, so a rebinding page gains
 * nothing it couldn't fetch directly.
 */
import { validate, type Schema } from "./schema";

export const MODERN_VERSIONS = ["2026-07-28"] as const;
export const LEGACY_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"] as const;
export const SUPPORTED_VERSIONS: string[] = [...MODERN_VERSIONS, ...LEGACY_VERSIONS];
/** Assumed when a legacy request has no MCP-Protocol-Version header (spec allows this). */
const HEADERLESS_VERSION = "2025-03-26";
const VERSION_META = "io.modelcontextprotocol/protocolVersion";
const MAX_BODY = 64 * 1024;

export const ERR = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
  HEADER_MISMATCH: -32020,
  UNSUPPORTED_VERSION: -32022,
} as const;

export interface McpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Schema;
  /** Returns the structured result. Throw InvalidParams for bad input the schema can't express. */
  run(args: Record<string, unknown>): unknown;
}

export interface McpServer {
  name: string;
  title?: string;
  version: string;
  instructions?: string;
  /** Called per request so tool enums follow the current catalog. */
  tools(): McpTool[];
}

/** Thrown by a tool for input that passes the schema but still can't be used. */
export class InvalidParams extends Error {}

type Id = string | number | null;
interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}
type RpcResponse = { jsonrpc: "2.0"; id: Id; result: unknown } | { jsonrpc: "2.0"; id: Id; error: RpcError };

/** One message's outcome: the response (null for notifications) and the HTTP status it implies. */
interface Outcome {
  status: number;
  response: RpcResponse | null;
}

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Max-Age": "86400",
};

function reply(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  const headers = new Headers({ ...CORS, "Cache-Control": "no-store", ...extra });
  if (body === null) return new Response(null, { status, headers });
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

function error(id: Id, code: number, message: string, data?: unknown): RpcResponse {
  return { jsonrpc: "2.0", id, error: data === undefined ? { code, message } : { code, message, data } };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Header values may use the `=?base64?…?=` sentinel for non-ASCII text. */
export function decodeHeader(value: string | null): string | null {
  if (value === null) return null;
  const m = /^=\?base64\?(.*)\?=$/.exec(value);
  if (!m) return value;
  try {
    const bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

// ---------- HTTP ----------

/** Handle one HTTP request to the MCP endpoint. */
export async function handleHttp(request: Request, server: McpServer): Promise<Response> {
  if (request.method === "OPTIONS") return reply(204, null);
  if (request.method !== "POST") {
    return reply(
      405,
      error(null, ERR.INVALID_REQUEST, "Method not allowed. POST JSON-RPC messages to this endpoint."),
      {
        Allow: "POST, OPTIONS",
      },
    );
  }

  const text = await request.text();
  if (text.length > MAX_BODY) return reply(413, error(null, ERR.INVALID_REQUEST, "Request body too large"));
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return reply(400, error(null, ERR.PARSE, "Parse error: body is not valid JSON"));
  }

  // Batches (2025-03-26 clients). Header checks only make sense for one message.
  if (Array.isArray(body)) {
    if (body.length === 0) return reply(400, error(null, ERR.INVALID_REQUEST, "Invalid request: empty batch"));
    const responses = body
      .map((m) => handleMessage(m, server, null).response)
      .filter((r): r is RpcResponse => r !== null);
    return responses.length ? reply(200, responses) : reply(202, null);
  }
  const out = handleMessage(body, server, request.headers);
  return out.response ? reply(out.status, out.response) : reply(out.status, null);
}

// ---------- JSON-RPC ----------

/**
 * Handle one JSON-RPC message. `headers` is null inside a batch, where the
 * mirrored-header checks are skipped.
 */
export function handleMessage(msg: unknown, server: McpServer, headers: Headers | null): Outcome {
  if (!isObject(msg))
    return { status: 400, response: error(null, ERR.INVALID_REQUEST, "Invalid request: expected a JSON-RPC object") };

  const hasId = "id" in msg;
  const rawId = msg.id;
  const idOk = typeof rawId === "string" || (typeof rawId === "number" && Number.isFinite(rawId));
  const id: Id = idOk ? (rawId as string | number) : null;

  // A client-sent response (legacy clients answering a server request): accept and ignore.
  if (msg.jsonrpc === "2.0" && hasId && !("method" in msg) && ("result" in msg || "error" in msg))
    return { status: 202, response: null };

  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string" || (hasId && !idOk)) {
    return {
      status: 400,
      response: error(
        id,
        ERR.INVALID_REQUEST,
        'Invalid request: needs jsonrpc "2.0", a method, and a string or number id',
      ),
    };
  }
  const method = msg.method;
  if ("params" in msg && !isObject(msg.params)) {
    return hasId
      ? { status: 200, response: error(id, ERR.INVALID_PARAMS, "Invalid params: params must be an object") }
      : { status: 202, response: null };
  }
  const params = (msg.params ?? {}) as Record<string, unknown>;
  const meta = isObject(params._meta) ? params._meta : {};
  const modernVersion = typeof meta[VERSION_META] === "string" ? (meta[VERSION_META] as string) : null;

  // Version and header checks, before anything runs.
  const check =
    modernVersion !== null ? checkModern(modernVersion, method, params, headers) : checkLegacy(method, headers);
  if (check) return { status: check.status, response: error(id, check.code, check.message, check.data) };

  if (!hasId) return { status: 202, response: null }; // notifications/initialized and friends

  const modern = modernVersion !== null;
  try {
    const result = dispatch(method, params, server, modern);
    if (result === undefined) {
      return { status: modern ? 404 : 200, response: error(id, ERR.METHOD_NOT_FOUND, `Method not found: ${method}`) };
    }
    return {
      status: 200,
      response: { jsonrpc: "2.0", id, result: modern ? { resultType: "complete", ...result } : result },
    };
  } catch (e) {
    if (e instanceof RpcFailure) return { status: 200, response: error(id, e.code, e.message, e.data) };
    return { status: 200, response: error(id, ERR.INTERNAL, "Internal error") };
  }
}

interface Check {
  status: number;
  code: number;
  message: string;
  data?: unknown;
}

function unsupported(requested: string): Check {
  return {
    status: 400,
    code: ERR.UNSUPPORTED_VERSION,
    message: "Unsupported protocol version",
    data: { supported: SUPPORTED_VERSIONS, requested },
  };
}

function mismatch(message: string): Check {
  return { status: 400, code: ERR.HEADER_MISMATCH, message: `Header mismatch: ${message}` };
}

function checkModern(
  version: string,
  method: string,
  params: Record<string, unknown>,
  headers: Headers | null,
): Check | null {
  if (!(MODERN_VERSIONS as readonly string[]).includes(version)) return unsupported(version);
  if (!headers) return null;
  const hv = headers.get("mcp-protocol-version");
  if (hv === null) return mismatch("MCP-Protocol-Version header is missing");
  if (hv !== version) return mismatch(`MCP-Protocol-Version header '${hv}' does not match body value '${version}'`);
  const hm = headers.get("mcp-method");
  if (hm === null) return mismatch("Mcp-Method header is missing");
  if (hm !== method) return mismatch(`Mcp-Method header '${hm}' does not match body value '${method}'`);
  if (method === "tools/call") {
    const raw = headers.get("mcp-name");
    if (raw === null) return mismatch("Mcp-Name header is missing");
    const hn = decodeHeader(raw);
    if (hn !== params.name) return mismatch(`Mcp-Name header does not match body value`);
  }
  return null;
}

function checkLegacy(method: string, headers: Headers | null): Check | null {
  // initialize negotiates in its body; the header only exists after it.
  if (!headers || method === "initialize") return null;
  const hv = headers.get("mcp-protocol-version") ?? HEADERLESS_VERSION;
  return SUPPORTED_VERSIONS.includes(hv) ? null : unsupported(hv);
}

class RpcFailure extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
  }
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

/** Run a method. Returns undefined when the method doesn't exist. */
function dispatch(
  method: string,
  params: Record<string, unknown>,
  server: McpServer,
  modern: boolean,
): Record<string, unknown> | undefined {
  const capabilities = { tools: { listChanged: false } };
  const serverInfo = { name: server.name, ...(server.title ? { title: server.title } : {}), version: server.version };

  switch (method) {
    case "initialize": {
      const asked = params.protocolVersion;
      if (typeof asked !== "string")
        throw new RpcFailure(ERR.INVALID_PARAMS, "Invalid params: protocolVersion is required");
      const legacy = LEGACY_VERSIONS as readonly string[];
      return {
        protocolVersion: legacy.includes(asked) ? asked : legacy[0],
        capabilities,
        serverInfo,
        ...(server.instructions ? { instructions: server.instructions } : {}),
      };
    }
    case "server/discover":
      return {
        supportedVersions: SUPPORTED_VERSIONS,
        capabilities,
        _meta: { "io.modelcontextprotocol/serverInfo": serverInfo },
        ...(server.instructions ? { instructions: server.instructions } : {}),
        ...(modern ? { ttlMs: 3_600_000, cacheScope: "public" } : {}),
      };
    case "ping":
      return {};
    case "tools/list":
      return {
        tools: server.tools().map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { title: t.title, ...READ_ONLY },
        })),
      };
    case "tools/call":
      return callTool(params, server);
    default:
      return undefined;
  }
}

function callTool(params: Record<string, unknown>, server: McpServer): Record<string, unknown> {
  const name = params.name;
  if (typeof name !== "string") throw new RpcFailure(ERR.INVALID_PARAMS, "Invalid params: name is required");
  const tool = server.tools().find((t) => t.name === name);
  if (!tool) throw new RpcFailure(ERR.INVALID_PARAMS, `Unknown tool: ${name}`);
  const args = params.arguments ?? {};
  const problems = validate(args, tool.inputSchema);
  if (problems.length)
    throw new RpcFailure(ERR.INVALID_PARAMS, `Invalid arguments for ${name}: ${problems.join("; ")}`, {
      errors: problems,
    });

  let structured: unknown;
  try {
    structured = tool.run(args as Record<string, unknown>);
  } catch (e) {
    if (e instanceof InvalidParams)
      throw new RpcFailure(ERR.INVALID_PARAMS, `Invalid arguments for ${name}: ${e.message}`);
    throw e;
  }
  return {
    content: [{ type: "text", text: JSON.stringify(structured, null, 2) }],
    structuredContent: structured,
    isError: false,
  };
}

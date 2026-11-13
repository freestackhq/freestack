import { describe, expect, it } from "vitest";
import { ERR, InvalidParams, SUPPORTED_VERSIONS, decodeHeader, handleHttp, type McpServer } from "./protocol";
import { validate } from "./schema";

// A one-tool server so the protocol is tested apart from the catalog.
const server: McpServer = {
  name: "freestack",
  version: "1.0.0",
  instructions: "Say unknown, never guess.",
  tools: () => [
    {
      name: "echo",
      title: "Echo",
      description: "Echo back",
      inputSchema: {
        type: "object",
        properties: { word: { type: "string", enum: ["a", "b"] }, n: { type: "integer", minimum: 1, maximum: 3 } },
        required: ["word"],
        additionalProperties: false,
      },
      run: (args) => {
        if (args.n === 3) throw new InvalidParams("n=3 is not allowed with this word");
        return { word: args.word };
      },
    },
  ],
};

const MODERN = "2026-07-28";

function post(body: unknown, headers: Record<string, string> = {}) {
  return handleHttp(
    new Request("http://x/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    server,
  );
}

const meta = { _meta: { "io.modelcontextprotocol/protocolVersion": MODERN } };
function modernHeaders(method: string, name?: string) {
  return { "MCP-Protocol-Version": MODERN, "Mcp-Method": method, ...(name ? { "Mcp-Name": name } : {}) };
}

describe("legacy handshake", () => {
  it("initialize echoes a supported version and advertises tools", async () => {
    const res = await post({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const body = await res.json();
    expect(body.id).toBe(1);
    expect(body.result.protocolVersion).toBe("2025-06-18");
    expect(body.result.capabilities.tools).toBeDefined();
    expect(body.result.serverInfo.name).toBe("freestack");
    expect(body.result.instructions).toBe("Say unknown, never guess.");
  });

  it("initialize with an unknown version answers with the newest handshake version", async () => {
    const body = await (
      await post({ jsonrpc: "2.0", id: "a", method: "initialize", params: { protocolVersion: "1999-01-01" } })
    ).json();
    expect(body.result.protocolVersion).toBe("2025-11-25");
  });

  it("initialize without protocolVersion is invalid params", async () => {
    const body = await (await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })).json();
    expect(body.error.code).toBe(ERR.INVALID_PARAMS);
  });

  it("notifications/initialized gets 202 and no body", async () => {
    const res = await post(
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { "MCP-Protocol-Version": "2025-06-18" },
    );
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("ping returns an empty result", async () => {
    const body = await (await post({ jsonrpc: "2.0", id: 2, method: "ping" })).json();
    expect(body.result).toEqual({});
  });

  it("an unsupported MCP-Protocol-Version header is rejected with 400", async () => {
    const res = await post({ jsonrpc: "2.0", id: 2, method: "ping" }, { "MCP-Protocol-Version": "2020-01-01" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(ERR.UNSUPPORTED_VERSION);
    expect(body.error.data.supported).toEqual(SUPPORTED_VERSIONS);
  });
});

describe("modern per-request metadata", () => {
  it("server/discover lists versions and server info", async () => {
    const body = await (
      await post({ jsonrpc: "2.0", id: 1, method: "server/discover", params: meta }, modernHeaders("server/discover"))
    ).json();
    expect(body.result.resultType).toBe("complete");
    expect(body.result.supportedVersions).toContain(MODERN);
    expect(body.result.supportedVersions).toContain("2025-11-25");
    expect(body.result._meta["io.modelcontextprotocol/serverInfo"].name).toBe("freestack");
  });

  it("tools/call works with matching headers", async () => {
    const res = await post(
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { ...meta, name: "echo", arguments: { word: "a" } } },
      modernHeaders("tools/call", "echo"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.resultType).toBe("complete");
    expect(body.result.structuredContent).toEqual({ word: "a" });
  });

  it("accepts a base64 sentinel Mcp-Name", async () => {
    const res = await post(
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { ...meta, name: "echo", arguments: { word: "a" } } },
      modernHeaders("tools/call", `=?base64?${btoa("echo")}?=`),
    );
    expect(res.status).toBe(200);
  });

  it("missing or mismatched headers are HeaderMismatch with 400", async () => {
    const missing = await post({ jsonrpc: "2.0", id: 1, method: "tools/list", params: meta });
    expect(missing.status).toBe(400);
    expect((await missing.json()).error.code).toBe(ERR.HEADER_MISMATCH);
    const wrong = await post({ jsonrpc: "2.0", id: 1, method: "tools/list", params: meta }, modernHeaders("ping"));
    expect(wrong.status).toBe(400);
    expect((await wrong.json()).error.code).toBe(ERR.HEADER_MISMATCH);
    const name = await post(
      { jsonrpc: "2.0", id: 1, method: "tools/call", params: { ...meta, name: "echo", arguments: { word: "a" } } },
      modernHeaders("tools/call", "other"),
    );
    expect((await name.json()).error.code).toBe(ERR.HEADER_MISMATCH);
  });

  it("an unknown modern version is UnsupportedProtocolVersion with the list", async () => {
    const res = await post(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2099-01-01" } },
      },
      { "MCP-Protocol-Version": "2099-01-01", "Mcp-Method": "tools/list" },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(ERR.UNSUPPORTED_VERSION);
    expect(body.error.data).toEqual({ supported: SUPPORTED_VERSIONS, requested: "2099-01-01" });
  });

  it("an unknown modern method is 404 with -32601", async () => {
    const res = await post(
      { jsonrpc: "2.0", id: 1, method: "resources/list", params: meta },
      modernHeaders("resources/list"),
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe(ERR.METHOD_NOT_FOUND);
  });
});

describe("tools", () => {
  it("tools/list publishes the input schema and read-only hints", async () => {
    const body = await (await post({ jsonrpc: "2.0", id: 1, method: "tools/list" })).json();
    expect(body.result.tools).toHaveLength(1);
    expect(body.result.tools[0].inputSchema.required).toEqual(["word"]);
    expect(body.result.tools[0].annotations.readOnlyHint).toBe(true);
  });

  it("tools/call returns structuredContent and the same JSON as text", async () => {
    const body = await (
      await post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "echo", arguments: { word: "b" } } })
    ).json();
    expect(body.result.structuredContent).toEqual({ word: "b" });
    expect(body.result.content[0].type).toBe("text");
    expect(JSON.parse(body.result.content[0].text)).toEqual({ word: "b" });
    expect(body.result.isError).toBe(false);
  });

  it("unknown tool, bad arguments and tool-level refusals are -32602", async () => {
    const call = async (params: unknown) =>
      (await (await post({ jsonrpc: "2.0", id: 9, method: "tools/call", params })).json()).error;
    expect((await call({ name: "nope" })).message).toContain("Unknown tool");
    expect((await call({ name: "echo", arguments: {} })).code).toBe(ERR.INVALID_PARAMS);
    expect((await call({ name: "echo", arguments: { word: "z" } })).data.errors[0]).toContain("must be one of");
    expect((await call({ name: "echo", arguments: { word: "a", extra: 1 } })).data.errors[0]).toContain(
      "unknown argument",
    );
    expect((await call({ name: "echo", arguments: { word: "a", n: 3 } })).message).toContain("not allowed");
    expect((await call({ name: "echo", arguments: "word" })).code).toBe(ERR.INVALID_PARAMS);
    expect((await call({})).code).toBe(ERR.INVALID_PARAMS);
  });
});

describe("JSON-RPC edge cases", () => {
  it("bad JSON is a -32700 parse error with null id", async () => {
    const res = await post("{not json");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ jsonrpc: "2.0", id: null, error: { code: ERR.PARSE, message: expect.any(String) } });
  });

  it("invalid requests are -32600", async () => {
    for (const bad of [
      { id: 1, method: "ping" },
      { jsonrpc: "2.0", id: 1 },
      { jsonrpc: "2.0", id: true, method: "ping" },
      42,
      `"x"`,
    ]) {
      const res = await post(bad);
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe(ERR.INVALID_REQUEST);
    }
  });

  it("unknown legacy methods are -32601", async () => {
    const res = await post({ jsonrpc: "2.0", id: 1, method: "prompts/list" });
    expect(res.status).toBe(200);
    expect((await res.json()).error.code).toBe(ERR.METHOD_NOT_FOUND);
  });

  it("non-object params are -32602", async () => {
    expect((await (await post({ jsonrpc: "2.0", id: 1, method: "ping", params: [1] })).json()).error.code).toBe(
      ERR.INVALID_PARAMS,
    );
  });

  it("a batch gets an array of responses, notifications left out", async () => {
    const res = await post([
      { jsonrpc: "2.0", id: 1, method: "ping" },
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", id: 2, method: "nope" },
    ]);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((r: { id: number }) => r.id)).toEqual([1, 2]);
    expect(body[1].error.code).toBe(ERR.METHOD_NOT_FOUND);
  });

  it("a batch of only notifications is 202; an empty batch is invalid", async () => {
    expect((await post([{ jsonrpc: "2.0", method: "notifications/initialized" }])).status).toBe(202);
    const empty = await post([]);
    expect(empty.status).toBe(400);
    expect((await empty.json()).error.code).toBe(ERR.INVALID_REQUEST);
  });

  it("client-sent responses are accepted and ignored", async () => {
    expect((await post({ jsonrpc: "2.0", id: 5, result: {} })).status).toBe(202);
  });

  it("a huge body is refused", async () => {
    expect((await post({ jsonrpc: "2.0", id: 1, method: "ping", params: { pad: "x".repeat(70_000) } })).status).toBe(
      413,
    );
  });
});

describe("HTTP methods", () => {
  it("GET and DELETE are 405, OPTIONS is an open CORS preflight", async () => {
    for (const method of ["GET", "DELETE"]) {
      const res = await handleHttp(new Request("http://x/mcp", { method }), server);
      expect(res.status).toBe(405);
      expect(res.headers.get("allow")).toContain("POST");
    }
    const pre = await handleHttp(new Request("http://x/mcp", { method: "OPTIONS" }), server);
    expect(pre.status).toBe(204);
    expect(pre.headers.get("access-control-allow-origin")).toBe("*");
    expect(pre.headers.get("access-control-allow-headers")).toContain("MCP-Protocol-Version");
  });
});

describe("helpers", () => {
  it("decodes base64 header sentinels", () => {
    expect(decodeHeader("plain")).toBe("plain");
    expect(decodeHeader("=?base64?SGVsbG8sIOS4lueVjA==?=")).toBe("Hello, 世界");
    expect(decodeHeader(null)).toBeNull();
  });

  it("validates arrays and nested types", () => {
    const schema = { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 } as const;
    expect(validate(["a", "b"], schema)).toEqual([]);
    expect(validate(["a"], schema)[0]).toContain("at least 2");
    expect(validate(["a", "b", "c", "d", "e"], schema)[0]).toContain("at most 4");
    expect(validate(["a", 1], schema)[0]).toContain("expected string");
    expect(validate(1.5, { type: "integer" })[0]).toContain("expected integer");
  });
});

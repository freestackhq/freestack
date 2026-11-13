import { expect, test } from "@playwright/test";

// The remote MCP server on the preview Worker. Asserts shapes, not sample values.

const HEADERS = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
const LEGACY = "2025-11-25";

test.describe("MCP server at /mcp", () => {
  test("initialize, tools/list and tools/call", async ({ request }) => {
    const init = await request.post("/mcp", {
      headers: HEADERS,
      data: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: LEGACY, capabilities: {}, clientInfo: { name: "e2e", version: "1" } } },
    });
    expect(init.status()).toBe(200);
    expect(init.headers()["access-control-allow-origin"]).toBe("*");
    const hello = await init.json();
    expect(hello.result.protocolVersion).toBe(LEGACY);
    expect(hello.result.serverInfo.name).toBe("freestack");
    expect(hello.result.capabilities.tools).toBeTruthy();

    const ready = await request.post("/mcp", {
      headers: { ...HEADERS, "MCP-Protocol-Version": LEGACY },
      data: { jsonrpc: "2.0", method: "notifications/initialized" },
    });
    expect(ready.status()).toBe(202);

    const list = await (
      await request.post("/mcp", { headers: { ...HEADERS, "MCP-Protocol-Version": LEGACY }, data: { jsonrpc: "2.0", id: 2, method: "tools/list" } })
    ).json();
    const names = list.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual(["search_tools", "compare", "suggest_stack", "claim_order"]);
    for (const t of list.result.tools) expect(t.inputSchema.type).toBe("object");

    const call = await request.post("/mcp", {
      headers: { ...HEADERS, "MCP-Protocol-Version": LEGACY },
      data: { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_tools", arguments: { limit: 3 } } },
    });
    expect(call.status()).toBe(200);
    const { result } = await call.json();
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(result.structuredContent);
    expect(result.structuredContent.tools.length).toBeGreaterThan(0);
    expect(result.structuredContent.tools.length).toBeLessThanOrEqual(3);
    for (const t of result.structuredContent.tools) {
      expect(typeof t.id).toBe("string");
      expect(t.label_url).toMatch(/^https?:\/\/[^/]+\/[^/]+\/[^/]+$/);
      if (t.source !== "imported") expect(t.metric === null || typeof t.metric === "number").toBe(true);
    }
  });

  test("modern per-request metadata works without initialize", async ({ request }) => {
    const res = await request.post("/mcp", {
      headers: { ...HEADERS, "MCP-Protocol-Version": "2026-07-28", "Mcp-Method": "tools/call", "Mcp-Name": "suggest_stack" },
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" }, name: "suggest_stack", arguments: { situation: "indie" } },
      },
    });
    expect(res.status()).toBe(200);
    const { result } = await res.json();
    expect(result.resultType).toBe("complete");
    expect(result.structuredContent.build_url).toContain("/build?as=indie");
    expect(Array.isArray(result.structuredContent.problems)).toBe(true);
  });

  test("GET is 405 and bad JSON is a parse error", async ({ request }) => {
    expect((await request.get("/mcp")).status()).toBe(405);
    const bad = await request.post("/mcp", { headers: HEADERS, data: Buffer.from("{nope") });
    expect(bad.status()).toBe(400);
    expect((await bad.json()).error.code).toBe(-32700);
  });
});

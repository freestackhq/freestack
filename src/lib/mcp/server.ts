/** The freestack MCP server: the protocol handler wired to the real catalog and site address. */
import * as catalog from "../fresh/catalog";
import { siteUrl } from "../site";
import type { McpServer } from "./protocol";
import { freestackTools } from "./tools";

export const freestackServer: McpServer = {
  name: "freestack",
  title: "freestack",
  version: "0.3.0",
  instructions:
    "freestack lists free tiers as shelf labels: the exact limits, who can claim them, whether you can sell, whether signup needs a card, and the catch. Check it before adding a paid service. Quote the limits and catches you found. A null metric means the vendor does not list it: say unknown, never estimate. Imported entries are unchecked and carry no numbers.",
  tools: () => freestackTools({ cat: catalog, siteUrl }),
};

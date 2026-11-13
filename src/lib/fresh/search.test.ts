import { describe, expect, it } from "vitest";
import { didYouMean, distance, searchLocal, type SearchEntry } from "./search";

const index: SearchEntry[] = [
  { group: "catches", title: "Can I sell things on Vercel Hobby?", sub: "No.", href: "/catches/x", terms: "vercel hobby sell" },
  { group: "catches", title: "Neon sleeps after 5 minutes idle", sub: "Slow first visit.", href: "/databases/neon", terms: "neon" },
  { group: "tools", title: "Vercel Hobby", sub: "Hosting. Not listed", href: "/hosting/vercel-hobby", terms: "frontend hosting" },
  { group: "tools", title: "Neon", sub: "Databases. 0.5 GB", href: "/databases/neon", terms: "serverless postgres sleeps" },
  { group: "tools", title: "PocketBase", sub: "Databases. No limit", href: "/databases/pocketbase", terms: "self-hosted sqlite" },
  { group: "aisles", title: "Hosting", sub: "4 labels", href: "/hosting", terms: "" },
  { group: "aisles", title: "Databases", sub: "8 labels", href: "/databases", terms: "" },
];

describe("searchLocal", () => {
  it("groups results as catches, tools, aisles and skips empty groups", () => {
    const groups = searchLocal(index, "vercel");
    expect(groups.map((g) => g.group)).toEqual(["catches", "tools"]);
    expect(groups[1].items[0].title).toBe("Vercel Hobby");
  });

  it("matches every word, in any field", () => {
    expect(searchLocal(index, "sleeps").flatMap((g) => g.items.map((i) => i.title))).toEqual([
      "Neon sleeps after 5 minutes idle",
      "Neon",
    ]);
    expect(searchLocal(index, "neon postgres")[0].items.map((i) => i.title)).toEqual(["Neon"]);
  });

  it("ranks name matches first", () => {
    const tools = searchLocal(index, "hosting").find((g) => g.group === "tools")!;
    expect(tools.items[0].title).toBe("Vercel Hobby");
    const aisles = searchLocal(index, "hosting").find((g) => g.group === "aisles")!;
    expect(aisles.items.map((i) => i.title)).toEqual(["Hosting"]);
  });

  it("returns nothing for an empty or blank query", () => {
    expect(searchLocal(index, "")).toEqual([]);
    expect(searchLocal(index, "   ")).toEqual([]);
  });

  it("returns nothing when no entry matches", () => {
    expect(searchLocal(index, "pocketbse")).toEqual([]);
  });
});

describe("didYouMean", () => {
  it("suggests the closest tool or aisle name", () => {
    expect(didYouMean(index, "pocketbse")?.title).toBe("PocketBase");
    expect(didYouMean(index, "databse")?.title).toBe("Databases");
    expect(didYouMean(index, "nein")?.title).toBe("Neon");
  });

  it("matches a word inside a longer name", () => {
    expect(didYouMean(index, "vercell")?.title).toBe("Vercel Hobby");
  });

  it("gives up when nothing is close", () => {
    expect(didYouMean(index, "kubernetes")).toBeNull();
    expect(didYouMean(index, "")).toBeNull();
  });

  it("never suggests a catch", () => {
    expect(didYouMean(index, "can i sel things")?.group).not.toBe("catches");
  });
});

describe("distance", () => {
  it("is the edit distance", () => {
    expect(distance("kitten", "sitting")).toBe(3);
    expect(distance("", "abc")).toBe(3);
    expect(distance("same", "same")).toBe(0);
  });
});

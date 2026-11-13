import { describe, expect, it } from "vitest";
import { canClaim, parseHave } from "./programs";
import { catchAlternatives, catches, programsInAisle } from "./catalog";

describe("parseHave", () => {
  it("accepts the three answers", () => {
    expect(parseHave("school")).toBe("school");
    expect(parseHave("id")).toBe("id");
    expect(parseHave("none")).toBe("none");
  });
  it("falls back to a school email for anything else", () => {
    expect(parseHave(null)).toBe("school");
    expect(parseHave("")).toBe("school");
    expect(parseHave("banana")).toBe("school");
  });
});

describe("canClaim", () => {
  it("a school email covers school-email and student-ID programs", () => {
    expect(canClaim(["student_school_email"], "school")).toBe(true);
    expect(canClaim(["student_any_id"], "school")).toBe(true);
  });
  it("a student ID only does not cover school-email programs", () => {
    expect(canClaim(["student_school_email"], "id")).toBe(false);
    expect(canClaim(["student_any_id"], "id")).toBe(true);
    expect(canClaim(["student_school_email", "student_any_id"], "id")).toBe(true);
  });
  it("neither covers only programs open to anyone", () => {
    expect(canClaim(["student_any_id"], "none")).toBe(false);
    expect(canClaim(["anyone"], "none")).toBe(true);
  });
  it("startup programs are never matched by student answers", () => {
    expect(canClaim(["startup_proof"], "school")).toBe(false);
  });
});

describe("catalog helpers", () => {
  it("programs come back in claim order", () => {
    const orders = programsInAisle("student-programs").map((t) => t.program!.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(orders[0]).toBe(1);
  });
  it("catch alternatives skip ids missing from the catalog", () => {
    const c = { ...catches()[0], avoid_with: ["cf-workers", "no-such-tool"] };
    expect(catchAlternatives(c).map((t) => t.id)).toEqual(["cf-workers"]);
  });
});

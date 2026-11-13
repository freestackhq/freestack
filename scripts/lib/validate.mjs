/**
 * Schema validation for data/tools/*.yaml. Shared by the generator (which
 * refuses to build bad data) and the unit tests.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const schema = JSON.parse(readFileSync(join(root, "schema/tool.schema.json"), "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const check = ajv.compile(schema);

/** Errors for one tool object, as "path message" strings. Empty when valid. */
export function validateTool(tool) {
  if (check(tool)) return [];
  return check.errors.map(
    (e) =>
      `${e.instancePath || "/"} ${e.message}${e.params?.additionalProperty ? `: ${e.params.additionalProperty}` : ""}`,
  );
}

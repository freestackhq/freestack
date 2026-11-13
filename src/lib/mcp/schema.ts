/**
 * The small slice of JSON Schema the MCP tools use for their inputs, and a
 * validator for it. Tools publish the same object in tools/list, so what an
 * agent reads is exactly what the server checks.
 */

export interface Schema {
  type: "object" | "string" | "integer" | "boolean" | "array";
  description?: string;
  enum?: readonly (string | number | boolean)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  items?: Schema;
  properties?: Record<string, Schema>;
  /** Object values: a schema for every key, or false to forbid unknown keys. */
  additionalProperties?: boolean | Schema;
  required?: readonly string[];
}

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  return typeof v;
}

/** Problems with `value` against `schema`, as "path: message" lines. Empty when valid. */
export function validate(value: unknown, schema: Schema, path = "arguments"): string[] {
  const t = typeOf(value);
  if (t !== schema.type) return [`${path}: expected ${schema.type}, got ${t}`];
  const errors: string[] = [];

  if (schema.enum && !schema.enum.includes(value as string)) {
    errors.push(`${path}: must be one of ${schema.enum.map((e) => JSON.stringify(e)).join(", ")}`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: must be at least ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: must be at most ${schema.maximum}`);
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path}: must be at least ${schema.minLength} characters`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path}: must be at most ${schema.maxLength} characters`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: needs at least ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path}: takes at most ${schema.maxItems} items`);
    if (schema.items) value.forEach((v, i) => errors.push(...validate(v, schema.items!, `${path}[${i}]`)));
  }
  if (t === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!(key in obj)) errors.push(`${path}.${key}: is required`);
    for (const [key, v] of Object.entries(obj)) {
      const prop = schema.properties?.[key];
      if (prop) errors.push(...validate(v, prop, `${path}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${path}.${key}: unknown argument`);
      else if (typeof schema.additionalProperties === "object") errors.push(...validate(v, schema.additionalProperties, `${path}.${key}`));
    }
  }
  return errors;
}

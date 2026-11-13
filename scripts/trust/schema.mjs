/**
 * Checks a value against schema/tool.schema.json. Covers the keywords that
 * schema uses (type, enum, required, properties, additionalProperties,
 * items, minItems, maxLength, pattern, format uri/date) and nothing more,
 * so the workflows need no dependencies. Returns readable errors.
 */

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  return typeof v;
}

function typeOk(want, v) {
  const t = typeOf(v);
  return want === t || (want === "number" && t === "integer");
}

function formatOk(format, v) {
  if (format === "date") return /^\d{4}-\d\d-\d\d$/.test(v) && !Number.isNaN(Date.parse(v));
  if (format === "uri") {
    try {
      return /^https?:$/.test(new URL(v).protocol);
    } catch {
      return false;
    }
  }
  return true;
}

/** @returns {string[]} errors, empty when the value fits */
export function validate(schema, value, path = "") {
  const at = path || "the tool";
  const errors = [];
  if (schema.type) {
    const types = [schema.type].flat();
    if (!types.some((t) => typeOk(t, value))) return [`${at} should be ${types.join(" or ")}.`];
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at} should be one of: ${schema.enum.join(", ")}.`);
  if (typeof value === "string") {
    if (schema.maxLength !== undefined && value.length > schema.maxLength)
      errors.push(`${at} should be ${schema.maxLength} characters at most.`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at} has characters it can't have.`);
    if (schema.format && !formatOk(schema.format, value))
      errors.push(
        `${at} should be ${schema.format === "uri" ? "a link starting with https://" : "a date like 2026-01-31"}.`,
      );
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      errors.push(`${at} needs at least ${schema.minItems}.`);
    if (schema.items) value.forEach((v, i) => errors.push(...validate(schema.items, v, `${path}[${i}]`)));
  }
  if (typeOf(value) === "object") {
    for (const k of schema.required ?? []) if (!(k in value)) errors.push(`${path ? `${path}.` : ""}${k} is missing.`);
    for (const [k, v] of Object.entries(value)) {
      const sub = schema.properties?.[k];
      if (sub) errors.push(...validate(sub, v, path ? `${path}.${k}` : k));
      else if (schema.additionalProperties === false) errors.push(`${path ? `${path}.` : ""}${k} is not a tool field.`);
    }
  }
  return errors;
}

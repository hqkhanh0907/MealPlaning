import type { z } from 'zod';

interface GeminiSchema {
  type: string;
  nullable?: boolean;
  enum?: readonly unknown[];
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  required?: string[];
}

export function geminiResponseSchema(schema: z.ZodType): GeminiSchema {
  return encode(schema.toJSONSchema({ target: 'openapi-3.0' }));
}

function encode(node: z.core.JSONSchema.BaseSchema | boolean): GeminiSchema {
  if (typeof node === 'boolean' || typeof node.type !== 'string')
    throw new Error('Unsupported Gemini response schema');
  const encoded: GeminiSchema = { type: node.type.toUpperCase() };
  if (node.nullable) encoded.nullable = true;
  if (node.enum) encoded.enum = node.enum;
  if (node.properties) {
    encoded.properties = Object.fromEntries(
      Object.entries(node.properties).map(([name, field]) => [name, encode(field)]),
    );
  }
  if (node.required) encoded.required = node.required;
  if (node.items && !Array.isArray(node.items)) encoded.items = encode(node.items);
  return encoded;
}

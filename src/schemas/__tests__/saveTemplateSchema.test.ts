import { describe, it, expect } from 'vitest';
import { saveTemplateSchema, saveTemplateDefaults } from '../saveTemplateSchema';

describe('saveTemplateSchema', () => {
  it('validates correct data', () => {
    const data = { ...saveTemplateDefaults, name: 'My Template' };
    const result = saveTemplateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = saveTemplateSchema.safeParse(saveTemplateDefaults);
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only name', () => {
    const data = { ...saveTemplateDefaults, name: '   ' };
    const result = saveTemplateSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 characters', () => {
    const data = { ...saveTemplateDefaults, name: 'a'.repeat(101) };
    const result = saveTemplateSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts name at exactly 100 characters', () => {
    const data = { ...saveTemplateDefaults, name: 'a'.repeat(100) };
    const result = saveTemplateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('allows empty tags array', () => {
    const data = { name: 'Template', tags: [] };
    const result = saveTemplateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('validates tags with content', () => {
    const data = { name: 'Template', tags: ['High Protein', 'Quick'] };
    const result = saveTemplateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('defaults tags to empty array when omitted', () => {
    const data = { name: 'Template' };
    const result = saveTemplateSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it('trims name on parse', () => {
    const data = { name: '  My Template  ', tags: [] };
    const result = saveTemplateSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Template');
    }
  });
});

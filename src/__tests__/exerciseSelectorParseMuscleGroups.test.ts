import { describe, expect, it } from 'vitest';

import { parseMuscleGroups } from '../features/fitness/utils/exerciseSelector';

describe('parseMuscleGroups (exerciseSelector)', () => {
  it('parses JSON array format', () => {
    expect(parseMuscleGroups('["chest","back"]')).toEqual(['chest', 'back']);
  });

  it('parses legacy comma-separated format', () => {
    expect(parseMuscleGroups('chest,back')).toEqual(['chest', 'back']);
  });

  it('returns empty array for undefined', () => {
    expect(parseMuscleGroups(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseMuscleGroups('')).toEqual([]);
  });

  it('filters out invalid muscle groups from JSON input', () => {
    expect(parseMuscleGroups('["chest","invalidMuscle","back"]')).toEqual(['chest', 'back']);
  });

  it('filters out invalid muscle groups from CSV input', () => {
    expect(parseMuscleGroups('chest,invalidMuscle,back')).toEqual(['chest', 'back']);
  });

  it('handles whitespace in CSV format', () => {
    expect(parseMuscleGroups(' chest , back ')).toEqual(['chest', 'back']);
  });

  it('handles single muscle group in JSON format', () => {
    expect(parseMuscleGroups('["legs"]')).toEqual(['legs']);
  });

  it('handles single muscle group as plain string', () => {
    expect(parseMuscleGroups('legs')).toEqual(['legs']);
  });

  it('returns all 7 valid muscle groups', () => {
    const all = '["chest","back","shoulders","legs","arms","core","glutes"]';
    expect(parseMuscleGroups(all)).toHaveLength(7);
  });

  it('falls back to CSV when JSON parse fails on bracket-starting malformed string', () => {
    // '[chest' is not a valid muscle group after CSV split, only 'back' passes validation
    expect(parseMuscleGroups('[chest,back')).toEqual(['back']);
  });

  it('returns empty array for JSON empty array', () => {
    expect(parseMuscleGroups('[]')).toEqual([]);
  });

  it('round-trip: JSON.stringify then parseMuscleGroups returns original', () => {
    const original = ['chest', 'shoulders', 'arms'];
    const stored = JSON.stringify(original);
    expect(parseMuscleGroups(stored)).toEqual(original);
  });
});

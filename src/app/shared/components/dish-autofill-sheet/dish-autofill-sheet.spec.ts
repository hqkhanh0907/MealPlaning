import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishAutofillSheet, type DishAutofillAppliedPayload } from './dish-autofill-sheet';
import type { DishAutofillResult, DishAutofillRow } from '../../../core/services/ai/nutrition-ai';
import type { FuzzyConfirmDecision } from '../../../core/services/ai/dish-autofill-applier';

const VALID_UUID_1 = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '550e8400-e29b-41d4-a716-446655440001';

const sampleResult: DishAutofillResult = {
  dishName: 'Phở bò',
  rows: [
    {
      kind: 'existing',
      name: 'Thịt bò',
      gramWeight: 120,
      matchedIngredientId: VALID_UUID_1,
      confidence: 'high',
    },
    {
      kind: 'new',
      name: 'Bánh phở',
      gramWeight: 200,
      category: 'Ngũ cốc & Tinh bột',
      caloriesPer100g: 110,
      proteinPer100g: 2,
      carbsPer100g: 25,
      fatPer100g: 0.2,
      fiberPer100g: 1,
      confidence: 'high',
    },
    {
      kind: 'fuzzyConfirm',
      name: 'Hành Lá',
      gramWeight: 10,
      suggestedMatchId: VALID_UUID_2,
      suggestedMatchName: 'Hành lá',
      distance: 0,
      pendingNew: {
        name: 'Hành Lá',
        gramWeight: 10,
        category: 'Rau củ',
        caloriesPer100g: 32,
        proteinPer100g: 1.8,
        carbsPer100g: 7.3,
        fatPer100g: 0.2,
        fiberPer100g: 2.6,
        confidence: 'medium',
      },
    },
  ] as readonly DishAutofillRow[],
  raw: {
    ingredients: [],
  } as unknown as DishAutofillResult['raw'],
};

interface ProtectedMembers {
  rows: () => readonly { row: DishAutofillRow; index: number }[];
  counts: () => { existing: number; created: number; needsConfirm: number };
  unresolvedCount: () => number;
  decisionFor: (i: number) => FuzzyConfirmDecision | undefined;
  acceptSuggestion: (i: number) => void;
  rejectAndCreate: (i: number) => void;
  onApply: () => void;
  onCancel: () => void;
  badgeLabel: (row: DishAutofillRow) => string;
  badgeClass: (row: DishAutofillRow) => string;
}

const ts = (c: DishAutofillSheet): ProtectedMembers => c as unknown as ProtectedMembers;

describe('DishAutofillSheet', () => {
  let fixture: ComponentFixture<DishAutofillSheet>;
  let component: DishAutofillSheet;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DishAutofillSheet] }).compileComponents();
    fixture = TestBed.createComponent(DishAutofillSheet);
    component = fixture.componentInstance;
  });

  it('khởi tạo: counts đếm đúng từng kind', () => {
    component.result = sampleResult;
    fixture.detectChanges();
    expect(ts(component).counts()).toEqual({ existing: 1, created: 1, needsConfirm: 1 });
    expect(ts(component).rows().length).toBe(3);
  });

  it('badgeLabel + badgeClass map đúng theo kind', () => {
    component.result = sampleResult;
    const t = ts(component);
    const [existing, created, fuzzy] = sampleResult.rows;
    expect(t.badgeLabel(existing)).toBe('Đã có');
    expect(t.badgeLabel(created)).toBe('Mới');
    expect(t.badgeLabel(fuzzy)).toBe('Cần xác nhận');
    expect(t.badgeClass(fuzzy)).toContain('dasf-badge--fuzzyConfirm');
  });

  it('unresolvedCount mặc định = số row fuzzyConfirm chưa resolve', () => {
    component.result = sampleResult;
    expect(ts(component).unresolvedCount()).toBe(1);
  });

  it('acceptSuggestion ghi decision và giảm unresolvedCount', () => {
    component.result = sampleResult;
    const t = ts(component);
    t.acceptSuggestion(2);
    expect(t.decisionFor(2)).toBe('accept-suggestion');
    expect(t.unresolvedCount()).toBe(0);
  });

  it('rejectAndCreate ghi decision đúng', () => {
    component.result = sampleResult;
    const t = ts(component);
    t.rejectAndCreate(2);
    expect(t.decisionFor(2)).toBe('reject-create-new');
  });

  it('reset decisions khi set result mới', () => {
    component.result = sampleResult;
    ts(component).acceptSuggestion(2);
    expect(ts(component).decisionFor(2)).toBe('accept-suggestion');

    component.result = sampleResult;
    expect(ts(component).decisionFor(2)).toBeUndefined();
  });

  it('onApply: row đã resolve giữ nguyên user choice', () => {
    component.result = sampleResult;
    const t = ts(component);
    t.acceptSuggestion(2);

    let payload: DishAutofillAppliedPayload | undefined;
    component.applied.subscribe((p) => (payload = p));

    t.onApply();

    expect(payload).toBeDefined();
    expect(payload!.fuzzyDecisions.size).toBe(1);
    expect(payload!.fuzzyDecisions.get(2)).toBe('accept-suggestion');
    expect(payload!.result).toBe(sampleResult);
  });

  it('onApply (Option B): row fuzzyConfirm chưa resolve → default reject-create-new', () => {
    component.result = sampleResult;

    let payload: DishAutofillAppliedPayload | undefined;
    component.applied.subscribe((p) => (payload = p));

    ts(component).onApply();

    expect(payload).toBeDefined();
    expect(payload!.fuzzyDecisions.size).toBe(1);
    expect(payload!.fuzzyDecisions.get(2)).toBe('reject-create-new');
  });

  it('onApply: KHÔNG sinh decision cho row existing/new', () => {
    component.result = sampleResult;
    let payload: DishAutofillAppliedPayload | undefined;
    component.applied.subscribe((p) => (payload = p));

    ts(component).onApply();

    expect(payload!.fuzzyDecisions.has(0)).toBeFalse();
    expect(payload!.fuzzyDecisions.has(1)).toBeFalse();
  });

  it('onApply đóng sheet (isOpen → false)', () => {
    component.isOpen = true;
    component.result = sampleResult;
    ts(component).onApply();
    expect(component.isOpen).toBeFalse();
  });

  it('onCancel emit dismissed và đóng sheet, KHÔNG emit applied', () => {
    component.isOpen = true;
    component.result = sampleResult;

    let dismissed = false;
    let appliedFired = false;
    component.dismissed.subscribe(() => (dismissed = true));
    component.applied.subscribe(() => (appliedFired = true));

    ts(component).onCancel();

    expect(dismissed).toBeTrue();
    expect(appliedFired).toBeFalse();
    expect(component.isOpen).toBeFalse();
  });
});

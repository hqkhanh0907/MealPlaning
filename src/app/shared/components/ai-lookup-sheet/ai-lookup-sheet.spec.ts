import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiLookupSheet, type AiLookupSavePayload } from './ai-lookup-sheet';
import type { IngredientLookupResult } from '../../../core/services/ai/nutrition-ai';

describe('AiLookupSheet', () => {
  let fixture: ComponentFixture<AiLookupSheet>;
  let component: AiLookupSheet;

  const sample: IngredientLookupResult = {
    name: 'Ức gà luộc',
    category: 'Thịt',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    confidence: 'high',
    raw: {
      name: 'Ức gà luộc',
      category: 'Thịt',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      confidence: 'high',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AiLookupSheet] }).compileComponents();
    fixture = TestBed.createComponent(AiLookupSheet);
    component = fixture.componentInstance;
  });

  // Cast helper to access protected members in tests without `any`.
  const ts = (
    c: AiLookupSheet,
  ): {
    form: () => {
      name: string;
      category: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    showErrors: () => boolean;
    canSave: () => boolean;
    nameInvalid: () => boolean;
    confidenceLabel: () => string;
    confidenceClass: () => string;
    updateField: (key: string, value: unknown) => void;
    onSave: () => void;
    onCancel: () => void;
  } =>
    c as unknown as {
      form: () => {
        name: string;
        category: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      };
      showErrors: () => boolean;
      canSave: () => boolean;
      nameInvalid: () => boolean;
      confidenceLabel: () => string;
      confidenceClass: () => string;
      updateField: (key: string, value: unknown) => void;
      onSave: () => void;
      onCancel: () => void;
    };

  // -------------------------------------------------------------------------
  // Pre-fill behavior (Decision #4)
  // -------------------------------------------------------------------------

  it('pre-fills form when result is set', () => {
    component.result = sample;
    expect(ts(component).form().name).toBe('Ức gà luộc');
    expect(ts(component).form().category).toBe('Thịt');
    expect(ts(component).form().calories).toBe(165);
  });

  it('resets showErrors when a new result arrives', () => {
    component.result = sample;
    ts(component).updateField('name', '');
    ts(component).onSave(); // triggers showErrors=true
    expect(ts(component).showErrors()).toBeTrue();

    component.result = sample; // new result clears
    expect(ts(component).showErrors()).toBeFalse();
  });

  // -------------------------------------------------------------------------
  // Confidence display (Decision #11)
  // -------------------------------------------------------------------------

  it('exposes Vietnamese confidence label per level', () => {
    component.result = { ...sample, confidence: 'high' };
    expect(ts(component).confidenceLabel()).toBe('Độ tin cậy cao');

    component.result = { ...sample, confidence: 'medium' };
    expect(ts(component).confidenceLabel()).toBe('Trung bình');

    component.result = { ...sample, confidence: 'low' };
    expect(ts(component).confidenceLabel()).toBe('Thấp');
  });

  it('exposes confidence CSS modifier class', () => {
    component.result = { ...sample, confidence: 'low' };
    expect(ts(component).confidenceClass()).toBe('als-confidence--low');
  });

  // -------------------------------------------------------------------------
  // Save flow
  // -------------------------------------------------------------------------

  it('refuses save when name is empty and surfaces errors', () => {
    let emitted: AiLookupSavePayload | null = null;
    component.saved.subscribe((p: AiLookupSavePayload) => (emitted = p));

    component.result = sample;
    ts(component).updateField('name', '   ');
    ts(component).onSave();

    expect(emitted).toBeNull();
    expect(ts(component).showErrors()).toBeTrue();
  });

  it('emits save payload with mode=create by default', () => {
    let emitted: AiLookupSavePayload | null = null;
    component.saved.subscribe((p: AiLookupSavePayload) => (emitted = p));

    component.result = sample;
    ts(component).onSave();

    expect(emitted).not.toBeNull();
    expect(emitted!.mode).toBe('create');
    expect(emitted!.existingIngredientId).toBeUndefined();
    expect(emitted!.name).toBe('Ức gà luộc');
    expect(emitted!.category).toBe('Thịt');
    expect(emitted!.calories).toBe(165);
  });

  it('emits save payload with mode=update + existingIngredientId', () => {
    let emitted: AiLookupSavePayload | null = null;
    component.saved.subscribe((p: AiLookupSavePayload) => (emitted = p));

    component.result = sample;
    component.mode = 'update';
    component.existingIngredientId = 'ingr-123';
    ts(component).onSave();

    expect(emitted!.mode).toBe('update');
    expect(emitted!.existingIngredientId).toBe('ingr-123');
  });

  it('trims and collapses whitespace in name on save', () => {
    let emitted: AiLookupSavePayload | null = null;
    component.saved.subscribe((p: AiLookupSavePayload) => (emitted = p));

    component.result = sample;
    ts(component).updateField('name', '  Ức   gà  ');
    ts(component).onSave();

    expect(emitted!.name).toBe('Ức gà');
  });

  // -------------------------------------------------------------------------
  // Cancel / dismiss
  // -------------------------------------------------------------------------

  it('emits dismissed on cancel', () => {
    let dismissedCount = 0;
    component.dismissed.subscribe(() => dismissedCount++);

    component.result = sample;
    ts(component).onCancel();

    expect(dismissedCount).toBe(1);
    expect(component.isOpen).toBeFalse();
  });
});

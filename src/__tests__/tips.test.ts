import { getDynamicTips } from '../utils/tips';
import { DayNutritionSummary, SlotInfo } from '../types';
import i18n from '../i18n';
import {
  ClipboardList,
  AlertTriangle,
  TrendingDown,
  Dumbbell,
  Beef,
  Leaf,
  Droplets,
  FileText,
  CheckCircle2,
} from 'lucide-react';

const t = i18n.t.bind(i18n);

// --- Helpers ---

const emptySlot: SlotInfo = { dishIds: [], calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

const makeSlot = (overrides: Partial<SlotInfo> = {}): SlotInfo => ({
  ...emptySlot,
  dishIds: ['d1'],
  ...overrides,
});

const makeDay = (
  breakfast: Partial<SlotInfo> = {},
  lunch: Partial<SlotInfo> = {},
  dinner: Partial<SlotInfo> = {},
): DayNutritionSummary => ({
  breakfast: Object.keys(breakfast).length > 0 ? makeSlot(breakfast) : emptySlot,
  lunch: Object.keys(lunch).length > 0 ? makeSlot(lunch) : emptySlot,
  dinner: Object.keys(dinner).length > 0 ? makeSlot(dinner) : emptySlot,
});

// --- Tests ---

describe('getDynamicTips', () => {
  const TARGET_CAL = 2000;
  const TARGET_PROT = 100;

  it('returns info tip when no meals planned', () => {
    const tips = getDynamicTips(makeDay(), TARGET_CAL, TARGET_PROT, t);
    expect(tips).toHaveLength(1);
    expect(tips[0].type).toBe('info');
    expect(tips[0].icon).toBe(ClipboardList);
    expect(tips[0].text).toContain('Bắt đầu lên kế hoạch');
  });

  it('returns calorie over-target warning when >115%', () => {
    // 2000 * 1.15 = 2300 → set totalCalories = 2400
    const tips = getDynamicTips(
      makeDay(
        { calories: 800 },
        { calories: 800 },
        { calories: 800 }, // total=2400
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    const warn = tips.find(t => t.icon === AlertTriangle);
    expect(warn).toBeDefined();
    expect(warn?.type).toBe('warning');
    expect(warn?.text).toContain('vượt');
  });

  it('returns low calorie warning when complete and <70%', () => {
    // 2000 * 0.7 = 1400 → set totalCalories = 1000
    const tips = getDynamicTips(
      makeDay(
        { calories: 300 },
        { calories: 300 },
        { calories: 400 }, // total=1000
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    const warn = tips.find(t => t.icon === TrendingDown);
    expect(warn).toBeDefined();
    expect(warn?.type).toBe('warning');
    expect(warn?.text).toContain('calo hôm nay thấp');
  });

  it('returns protein success when meeting target', () => {
    const tips = getDynamicTips(
      makeDay(
        { calories: 700, protein: 40 },
        { calories: 700, protein: 40 },
        { calories: 600, protein: 30 }, // total protein=110 >= 100
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    const success = tips.find(t => t.icon === Dumbbell);
    expect(success).toBeDefined();
    expect(success?.type).toBe('success');
    expect(success?.text).toContain('protein');
  });

  it('returns low protein warning when complete and <80%', () => {
    // 100 * 0.8 = 80 → set totalProtein = 60
    const tips = getDynamicTips(
      makeDay(
        { calories: 700, protein: 20 },
        { calories: 700, protein: 20 },
        { calories: 600, protein: 20 }, // total protein=60 < 80
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    const warn = tips.find(t => t.icon === Beef);
    expect(warn).toBeDefined();
    expect(warn?.type).toBe('warning');
  });

  it('returns fiber tip when complete and fiber <15', () => {
    const tips = getDynamicTips(
      makeDay(
        { calories: 700, protein: 40, fiber: 3 },
        { calories: 700, protein: 40, fiber: 3 },
        { calories: 600, protein: 30, fiber: 3 }, // total fiber=9 <15
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    const fiberTip = tips.find(t => t.icon === Leaf);
    expect(fiberTip).toBeDefined();
    expect(fiberTip?.type).toBe('info');
  });

  it('returns fat percentage tip when >40% of calories', () => {
    // fat=100 → 900 fatCal / 1800 totalCal = 50%
    const tips = getDynamicTips(
      makeDay(
        { calories: 600, fat: 40 },
        { calories: 600, fat: 30 },
        { calories: 600, fat: 30 }, // totalFat=100, fatCalPercent=50%
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    const fatTip = tips.find(t => t.icon === Droplets);
    expect(fatTip).toBeDefined();
    expect(fatTip?.type).toBe('info');
    expect(fatTip?.text).toContain('chất béo cao');
  });

  it('returns all-good success when complete with no issues', () => {
    // Perfectly balanced: calories within range, protein NOT met (so no 💪 tip), fiber ok, fat ok
    const tips = getDynamicTips(
      makeDay(
        { calories: 600, protein: 30, fiber: 8, fat: 15 },
        { calories: 700, protein: 30, fiber: 8, fat: 15 },
        { calories: 600, protein: 30, fiber: 8, fat: 15 }, // totals: 1900cal, 90prot (<100 but >=80), 24fib, 45fat
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    expect(tips).toHaveLength(1);
    expect(tips[0].icon).toBe(CheckCircle2);
    expect(tips[0].type).toBe('success');
    expect(tips[0].text).toContain('cân đối');
  });

  it('returns missing meals tip when incomplete', () => {
    // Only breakfast planned
    const tips = getDynamicTips(
      makeDay(
        { calories: 600, protein: 30 },
        {}, // no lunch
        {}, // no dinner
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    const missingTip = tips.find(t => t.icon === FileText);
    expect(missingTip).toBeDefined();
    expect(missingTip?.type).toBe('info');
    expect(missingTip?.text).toContain('bữa trưa');
    expect(missingTip?.text).toContain('bữa tối');
  });

  it('returns missing meals tip listing only missing meals', () => {
    // Only lunch planned
    const tips = getDynamicTips(
      makeDay(
        {}, // no breakfast
        { calories: 600, protein: 30 },
        {}, // no dinner
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    const missingTip = tips.find(t => t.icon === FileText);
    expect(missingTip).toBeDefined();
    expect(missingTip?.text).toContain('bữa sáng');
    expect(missingTip?.text).not.toContain('bữa trưa');
    expect(missingTip?.text).toContain('bữa tối');
  });

  it('returns max 2 tips even when multiple issues exist', () => {
    // Over calories, low protein, low fiber, high fat → many tips possible
    const tips = getDynamicTips(
      makeDay(
        { calories: 1000, protein: 10, fiber: 1, fat: 50 },
        { calories: 1000, protein: 10, fiber: 1, fat: 50 },
        { calories: 1000, protein: 10, fiber: 1, fat: 50 },
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    expect(tips.length).toBeLessThanOrEqual(2);
  });

  it('handles zero calories gracefully (no calorie tip)', () => {
    const tips = getDynamicTips(
      makeDay(
        { calories: 0, protein: 0 },
        {}, {},
      ),
      TARGET_CAL,
      TARGET_PROT,
      t,
    );
    // Should not crash, should have missing meals tip
    const calorieTip = tips.find(t => t.icon === AlertTriangle || t.icon === TrendingDown);
    expect(calorieTip).toBeUndefined();
  });
});

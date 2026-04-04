import { act, renderHook, waitFor } from '@testing-library/react';

import {
  getTipOfTheDay,
  type InsightInput,
  selectInsight,
  TIPS_POOL,
  useInsightEngine,
} from '../features/dashboard/hooks/useInsightEngine';
import type { DatabaseService } from '../services/databaseService';

/* ------------------------------------------------------------------ */
/* Mock DatabaseContext for hook tests */
/* ------------------------------------------------------------------ */
let mockSettingsStore: Record<string, string> = {};

const mockDb: DatabaseService = {
  initialize: vi.fn(),
  execute: vi.fn(),
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockImplementation((_sql: string, params: string[]) => {
    const key = params[0];
    const value = mockSettingsStore[key];
    return Promise.resolve(value !== undefined ? { value } : null);
  }),
  transaction: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined),
  exportToJSON: vi.fn(),
  importFromJSON: vi.fn(),
};

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('../services/appSettings', () => ({
  getSetting: (_db: DatabaseService, key: string) => {
    const value = mockSettingsStore[key];
    return Promise.resolve(value !== undefined ? value : null);
  },
  setSetting: (_db: DatabaseService, key: string, value: string) => {
    mockSettingsStore[key] = value;
    return Promise.resolve();
  },
}));

describe('selectInsight', () => {
  describe('P1: Auto-adjust triggered', () => {
    it('returns alert insight when auto-adjust triggered', () => {
      const input: InsightInput = { hasAutoAdjustment: true };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(1);
      expect(result.type).toBe('alert');
      expect(result.color).toBe('dark-amber');
      expect(result.id).toBe('p1-auto-adjust');
      expect(result.dismissable).toBe(false);
      expect(result.actionLabel).toBe('Xem chi tiết');
      expect(result.actionType).toBe('navigate');
    });

    it('includes adjustment details in message when provided', () => {
      const input: InsightInput = {
        hasAutoAdjustment: true,
        adjustmentDetails: {
          oldCal: 2000,
          newCal: 1800,
          reason: 'Weight stall',
        },
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.message).toContain('2000');
      expect(result.message).toContain('1800');
      expect(result.message).toContain('Weight stall');
    });

    it('uses default message when no adjustment details', () => {
      const input: InsightInput = { hasAutoAdjustment: true };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.message).toContain('14 ngày');
    });
  });

  describe('P2: Low protein after evening', () => {
    it('returns action insight when protein < 70% after 18:00', () => {
      const input: InsightInput = {
        proteinRatio: 0.5,
        isAfterEvening: true,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(2);
      expect(result.type).toBe('action');
      expect(result.color).toBe('amber');
      expect(result.id).toBe('p2-low-protein');
      expect(result.message).toContain('50%');
    });

    it('does not trigger before evening', () => {
      const input: InsightInput = {
        proteinRatio: 0.5,
        isAfterEvening: false,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(2);
    });

    it('does not trigger when protein >= 70%', () => {
      const input: InsightInput = {
        proteinRatio: 0.7,
        isAfterEvening: true,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(2);
    });

    it('does not trigger when proteinRatio is undefined', () => {
      const input: InsightInput = { isAfterEvening: true };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(2);
    });
  });

  describe('P3: Weight not logged 3+ days', () => {
    it('returns remind insight when weight not logged 3+ days', () => {
      const input: InsightInput = { daysSinceWeightLog: 3 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(3);
      expect(result.type).toBe('remind');
      expect(result.color).toBe('amber');
      expect(result.id).toBe('p3-weight-log');
      expect(result.message).toContain('3 ngày');
    });

    it('does not trigger when less than 3 days', () => {
      const input: InsightInput = { daysSinceWeightLog: 2 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(3);
    });

    it('does not trigger when daysSinceWeightLog is undefined', () => {
      const result = selectInsight({}, [], '2024-01-01');
      expect(result.priority).not.toBe(3);
    });
  });

  describe('P4: Streak near record', () => {
    it('returns motivate insight when streak within 2 days of record', () => {
      const input: InsightInput = { currentStreak: 8, longestStreak: 10 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(4);
      expect(result.type).toBe('motivate');
      expect(result.color).toBe('blue');
      expect(result.id).toBe('p4-streak-near-record');
      expect(result.message).toContain('2 ngày');
    });

    it('triggers when streak is 1 day from record', () => {
      const input: InsightInput = { currentStreak: 9, longestStreak: 10 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(4);
      expect(result.message).toContain('1 ngày');
    });

    it('does not trigger when streak too far from record', () => {
      const input: InsightInput = { currentStreak: 5, longestStreak: 10 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(4);
    });

    it('does not trigger when streak equals record', () => {
      const input: InsightInput = { currentStreak: 10, longestStreak: 10 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(4);
    });

    it('does not trigger when currentStreak is undefined', () => {
      const input: InsightInput = { longestStreak: 10 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(4);
    });

    it('does not trigger when longestStreak is undefined', () => {
      const input: InsightInput = { currentStreak: 8 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(4);
    });
  });

  describe('P5: PR achieved today', () => {
    it('returns celebrate insight when PR today', () => {
      const input: InsightInput = { hasPRToday: true };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(5);
      expect(result.type).toBe('celebrate');
      expect(result.color).toBe('blue');
      expect(result.id).toBe('p5-pr-today');
    });

    it('does not trigger when no PR today', () => {
      const input: InsightInput = { hasPRToday: false };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(5);
    });
  });

  describe('P6: Weekly adherence >= 85%', () => {
    it('returns praise insight when adherence >= 85%', () => {
      const input: InsightInput = { weeklyAdherence: 90 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(6);
      expect(result.type).toBe('praise');
      expect(result.color).toBe('green');
      expect(result.id).toBe('p6-weekly-adherence');
      expect(result.message).toContain('90%');
    });

    it('triggers at exactly 85%', () => {
      const input: InsightInput = { weeklyAdherence: 85 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(6);
    });

    it('does not trigger when adherence < 85%', () => {
      const input: InsightInput = { weeklyAdherence: 84 };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(6);
    });

    it('does not trigger when weeklyAdherence is undefined', () => {
      const result = selectInsight({}, [], '2024-01-01');
      expect(result.priority).not.toBe(6);
    });
  });

  describe('P7: Weight trend correct direction >= 2 weeks', () => {
    it('returns progress insight when trend correct >= 2 weeks', () => {
      const input: InsightInput = {
        weightTrendCorrect: true,
        weightTrendWeeks: 3,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(7);
      expect(result.type).toBe('progress');
      expect(result.color).toBe('green');
      expect(result.id).toBe('p7-weight-trend');
      expect(result.message).toContain('3 tuần');
    });

    it('triggers at exactly 2 weeks', () => {
      const input: InsightInput = {
        weightTrendCorrect: true,
        weightTrendWeeks: 2,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(7);
    });

    it('does not trigger when trend < 2 weeks', () => {
      const input: InsightInput = {
        weightTrendCorrect: true,
        weightTrendWeeks: 1,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(7);
    });

    it('does not trigger when trend not correct', () => {
      const input: InsightInput = {
        weightTrendCorrect: false,
        weightTrendWeeks: 3,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(7);
    });

    it('does not trigger when weightTrendWeeks is undefined', () => {
      const input: InsightInput = { weightTrendCorrect: true };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).not.toBe(7);
    });
  });

  describe('P8: Default tip', () => {
    it('returns tip when no conditions met', () => {
      const result = selectInsight({}, [], '2024-01-01');
      expect(result.priority).toBe(8);
      expect(result.type).toBe('tip');
      expect(result.color).toBe('gray');
      expect(result.id).toMatch(/^p8-tip-\d+$/);
      expect(result.dismissable).toBe(true);
    });
  });

  describe('Priority ordering', () => {
    it('P1 overrides P2', () => {
      const input: InsightInput = {
        hasAutoAdjustment: true,
        proteinRatio: 0.5,
        isAfterEvening: true,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(1);
    });

    it('P2 overrides P3', () => {
      const input: InsightInput = {
        proteinRatio: 0.5,
        isAfterEvening: true,
        daysSinceWeightLog: 5,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(2);
    });

    it('P3 overrides P4', () => {
      const input: InsightInput = {
        daysSinceWeightLog: 5,
        currentStreak: 9,
        longestStreak: 10,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(3);
    });

    it('P4 overrides P5', () => {
      const input: InsightInput = {
        currentStreak: 9,
        longestStreak: 10,
        hasPRToday: true,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(4);
    });

    it('P5 overrides P6', () => {
      const input: InsightInput = {
        hasPRToday: true,
        weeklyAdherence: 90,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(5);
    });

    it('P6 overrides P7', () => {
      const input: InsightInput = {
        weeklyAdherence: 90,
        weightTrendCorrect: true,
        weightTrendWeeks: 3,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(6);
    });

    it('P7 overrides P8', () => {
      const input: InsightInput = {
        weightTrendCorrect: true,
        weightTrendWeeks: 3,
      };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.priority).toBe(7);
    });
  });

  describe('Dismissed insights skipped', () => {
    it('shows next priority when higher priority is dismissed', () => {
      const input: InsightInput = {
        hasAutoAdjustment: true,
        proteinRatio: 0.5,
        isAfterEvening: true,
      };
      const result = selectInsight(input, ['p1-auto-adjust'], '2024-01-01');
      expect(result.priority).toBe(2);
    });

    it('shows P3 when both P1 and P2 are dismissed', () => {
      const input: InsightInput = {
        hasAutoAdjustment: true,
        proteinRatio: 0.5,
        isAfterEvening: true,
        daysSinceWeightLog: 5,
      };
      const result = selectInsight(input, ['p1-auto-adjust', 'p2-low-protein'], '2024-01-01');
      expect(result.priority).toBe(3);
    });

    it('falls through to tip when all high-priority dismissed', () => {
      const input: InsightInput = {
        hasAutoAdjustment: true,
        proteinRatio: 0.5,
        isAfterEvening: true,
      };
      const result = selectInsight(input, ['p1-auto-adjust', 'p2-low-protein'], '2024-01-01');
      expect(result.priority).toBe(8);
    });

    it('filters tip-related dismissed IDs for getTipOfTheDay', () => {
      const firstTip = selectInsight({}, [], '2024-01-01');
      const secondTip = selectInsight({}, [firstTip.id], '2024-01-01');
      expect(secondTip.id).not.toBe(firstTip.id);
      expect(secondTip.priority).toBe(8);
    });
  });

  describe('Insight properties', () => {
    it('P1 is not dismissable (persist until user acts)', () => {
      const input: InsightInput = { hasAutoAdjustment: true };
      const result = selectInsight(input, [], '2024-01-01');
      expect(result.dismissable).toBe(false);
    });

    it('P2-P3 are dismissable', () => {
      const p2 = selectInsight({ proteinRatio: 0.5, isAfterEvening: true }, [], '2024-01-01');
      expect(p2.dismissable).toBe(true);

      const p3 = selectInsight({ daysSinceWeightLog: 5 }, [], '2024-01-01');
      expect(p3.dismissable).toBe(true);
    });

    it('P4-P7 have autoDismissHours = 24', () => {
      const p4 = selectInsight({ currentStreak: 9, longestStreak: 10 }, [], '2024-01-01');
      expect(p4.autoDismissHours).toBe(24);

      const p5 = selectInsight({ hasPRToday: true }, [], '2024-01-01');
      expect(p5.autoDismissHours).toBe(24);

      const p6 = selectInsight({ weeklyAdherence: 90 }, [], '2024-01-01');
      expect(p6.autoDismissHours).toBe(24);

      const p7 = selectInsight({ weightTrendCorrect: true, weightTrendWeeks: 3 }, [], '2024-01-01');
      expect(p7.autoDismissHours).toBe(24);
    });

    it('P2-P3 do not have autoDismissHours', () => {
      const p2 = selectInsight({ proteinRatio: 0.5, isAfterEvening: true }, [], '2024-01-01');
      expect(p2.autoDismissHours).toBeUndefined();

      const p3 = selectInsight({ daysSinceWeightLog: 5 }, [], '2024-01-01');
      expect(p3.autoDismissHours).toBeUndefined();
    });
  });
});

describe('getTipOfTheDay', () => {
  it('returns a tip insight with correct structure', () => {
    const tip = getTipOfTheDay('2024-01-01');
    expect(tip.priority).toBe(8);
    expect(tip.type).toBe('tip');
    expect(tip.color).toBe('gray');
    expect(tip.dismissable).toBe(true);
    expect(tip.id).toMatch(/^p8-tip-\d+$/);
    expect(tip.title).toBeTruthy();
    expect(tip.message).toBeTruthy();
  });

  it('tip message comes from TIPS_POOL', () => {
    const tip = getTipOfTheDay('2024-01-01');
    const poolMessages = TIPS_POOL.map(t => t.message);
    expect(poolMessages).toContain(tip.message);
  });

  it('no repeat within 7 days - avoids recent tip IDs', () => {
    const firstTip = getTipOfTheDay('2024-01-01');
    const secondTip = getTipOfTheDay('2024-01-01', [firstTip.id]);
    expect(secondTip.id).not.toBe(firstTip.id);
  });

  it('avoids multiple recent tip IDs', () => {
    const recentIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const tip = getTipOfTheDay('2024-01-01', recentIds);
      expect(recentIds).not.toContain(tip.id);
      recentIds.push(tip.id);
    }
    expect(recentIds.length).toBe(5);
    expect(new Set(recentIds).size).toBe(5);
  });

  it('returns different tip each day', () => {
    const tips = new Set<string>();
    for (let i = 1; i <= 10; i++) {
      const day = `2024-01-${String(i).padStart(2, '0')}`;
      tips.add(getTipOfTheDay(day).id);
    }
    expect(tips.size).toBeGreaterThan(1);
  });

  it('uses current date when today param is not provided', () => {
    const tip = getTipOfTheDay();
    expect(tip.priority).toBe(8);
    expect(tip.type).toBe('tip');
  });

  it('handles all tips being recent (fallback)', () => {
    const allTipIds = Array.from({ length: 20 }, (_, i) => `p8-tip-${i}`);
    const tip = getTipOfTheDay('2024-01-01', allTipIds);
    expect(tip.priority).toBe(8);
    expect(tip.type).toBe('tip');
    expect(tip.id).toMatch(/^p8-tip-\d+$/);
  });
});

describe('TIPS_POOL', () => {
  it('contains exactly 20 tips', () => {
    expect(TIPS_POOL.length).toBe(20);
  });

  it('each tip has title and message', () => {
    for (const tip of TIPS_POOL) {
      expect(tip.title).toBeTruthy();
      expect(tip.message).toBeTruthy();
    }
  });
});

describe('useInsightEngine', () => {
  beforeEach(() => {
    mockSettingsStore = {};
  });

  it('returns currentInsight as a tip by default', async () => {
    const { result } = renderHook(() => useInsightEngine());
    await waitFor(() => {
      expect(result.current.currentInsight).not.toBeNull();
    });
    expect(result.current.currentInsight?.priority).toBe(8);
    expect(result.current.currentInsight?.type).toBe('tip');
  });

  it('dismissInsight changes the current insight', async () => {
    const { result } = renderHook(() => useInsightEngine());
    await waitFor(() => {
      expect(result.current.currentInsight).not.toBeNull();
    });
    const initialId = result.current.currentInsight!.id;

    act(() => {
      result.current.dismissInsight(initialId);
    });

    expect(result.current.currentInsight?.id).not.toBe(initialId);
  });

  it('handleAction dismisses the insight', async () => {
    const { result } = renderHook(() => useInsightEngine());
    await waitFor(() => {
      expect(result.current.currentInsight).not.toBeNull();
    });
    const initialInsight = result.current.currentInsight!;

    act(() => {
      result.current.handleAction(initialInsight);
    });

    expect(result.current.currentInsight?.id).not.toBe(initialInsight.id);
  });

  it('persists dismissed IDs to SQLite', async () => {
    const { result } = renderHook(() => useInsightEngine());
    await waitFor(() => {
      expect(result.current.currentInsight).not.toBeNull();
    });
    const insight = result.current.currentInsight!;

    act(() => {
      result.current.dismissInsight(insight.id);
    });

    const stored = JSON.parse(mockSettingsStore['insight_dismissed'] ?? '[]');
    expect(stored).toContain(insight.id);
  });

  it('loads dismissed IDs from SQLite on mount', async () => {
    const firstTip = getTipOfTheDay();
    mockSettingsStore['insight_dismissed'] = JSON.stringify([firstTip.id]);

    const { result } = renderHook(() => useInsightEngine());
    await waitFor(() => {
      expect(result.current.currentInsight?.id).not.toBe(firstTip.id);
    });
  });

  it('handles corrupted SQLite data gracefully', async () => {
    mockSettingsStore['insight_dismissed'] = 'not-valid-json';

    const { result } = renderHook(() => useInsightEngine());
    await waitFor(() => {
      expect(result.current.currentInsight).not.toBeNull();
    });
    expect(result.current.currentInsight?.priority).toBe(8);
  });

  it('handles empty SQLite store gracefully', async () => {
    const { result } = renderHook(() => useInsightEngine());
    await waitFor(() => {
      expect(result.current.currentInsight).not.toBeNull();
    });
  });

  it('multiple dismissals accumulate', async () => {
    const { result } = renderHook(() => useInsightEngine());
    await waitFor(() => {
      expect(result.current.currentInsight).not.toBeNull();
    });
    const ids: string[] = [];

    for (let i = 0; i < 3; i++) {
      const currentId = result.current.currentInsight!.id;
      ids.push(currentId);
      act(() => {
        result.current.dismissInsight(currentId);
      });
    }

    expect(new Set(ids).size).toBe(3);
    const stored = JSON.parse(mockSettingsStore['insight_dismissed'] ?? '[]');
    expect(stored.length).toBe(3);
  });
});

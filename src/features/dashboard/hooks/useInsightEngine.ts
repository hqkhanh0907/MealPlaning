import i18n from 'i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDatabase } from '../../../contexts/DatabaseContext';
import { getSetting, setSetting } from '../../../services/appSettings';
import type { DatabaseService } from '../../../services/databaseService';

export type InsightType = 'alert' | 'action' | 'remind' | 'motivate' | 'celebrate' | 'praise' | 'progress' | 'tip';

export type InsightColor = 'dark-amber' | 'amber' | 'blue' | 'green' | 'gray';

const PROTEIN_RATIO_MIN = 0.7;
const WEIGHT_LOG_STALE_DAYS = 3;
const STREAK_RECORD_DAYS_DIFF = 2;
const ADHERENCE_THRESHOLD_PCT = 85;
const WEIGHT_TREND_MIN_WEEKS = 2;

export interface Insight {
  id: string;
  priority: number;
  type: InsightType;
  color: InsightColor;
  title: string;
  message: string;
  actionLabel?: string;
  actionType?: 'navigate' | 'dismiss';
  dismissable: boolean;
  autoDismissHours?: number;
}

export interface InsightInput {
  hasAutoAdjustment?: boolean;
  adjustmentDetails?: { oldCal: number; newCal: number; reason: string };
  proteinRatio?: number;
  isAfterEvening?: boolean;
  daysSinceWeightLog?: number;
  currentStreak?: number;
  longestStreak?: number;
  hasPRToday?: boolean;
  weeklyAdherence?: number;
  weightTrendCorrect?: boolean;
  weightTrendWeeks?: number;
}

export const TIPS_POOL_SIZE = 20;

export const TIPS_POOL: ReadonlyArray<{ title: string; message: string }> = Array.from(
  { length: TIPS_POOL_SIZE },
  (_, i) => ({
    title: i18n.t(`insightCard.tip.${i}.title`),
    message: i18n.t(`insightCard.tip.${i}.message`),
  }),
);

function hashDateToIndex(dateStr: string, poolSize: number): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.codePointAt(i)!;
    hash = Math.trunc(hash);
  }
  return Math.abs(hash) % poolSize;
}

function createP1(input: InsightInput): Insight | null {
  if (!input.hasAutoAdjustment) return null;
  const details = input.adjustmentDetails;
  return {
    id: 'p1-auto-adjust',
    priority: 1,
    type: 'alert',
    color: 'dark-amber',
    title: i18n.t('insightCard.autoAdjust.title'),
    message: details
      ? i18n.t('insightCard.autoAdjust.message', {
          oldCal: details.oldCal,
          newCal: details.newCal,
          reason: details.reason,
        })
      : i18n.t('insightCard.autoAdjust.messageDefault'),
    actionLabel: i18n.t('insightCard.autoAdjust.actionLabel'),
    actionType: 'navigate',
    dismissable: false,
  };
}

function createP2(input: InsightInput): Insight | null {
  if (input.proteinRatio === undefined || input.proteinRatio >= PROTEIN_RATIO_MIN || !input.isAfterEvening) {
    return null;
  }
  return {
    id: 'p2-low-protein',
    priority: 2,
    type: 'action',
    color: 'amber',
    title: i18n.t('insightCard.lowProtein.title'),
    message: i18n.t('insightCard.lowProtein.message', { pct: Math.round(input.proteinRatio * 100) }),
    actionLabel: i18n.t('insightCard.lowProtein.actionLabel'),
    actionType: 'navigate',
    dismissable: true,
  };
}

function createP3(input: InsightInput): Insight | null {
  if (input.daysSinceWeightLog === undefined || input.daysSinceWeightLog < WEIGHT_LOG_STALE_DAYS) {
    return null;
  }
  return {
    id: 'p3-weight-log',
    priority: 3,
    type: 'remind',
    color: 'amber',
    title: i18n.t('insightCard.weightLog.title'),
    message: i18n.t('insightCard.weightLog.message', { days: input.daysSinceWeightLog }),
    actionLabel: i18n.t('insightCard.weightLog.actionLabel'),
    actionType: 'navigate',
    dismissable: true,
  };
}

function createP4(input: InsightInput): Insight | null {
  if (
    input.currentStreak === undefined ||
    input.longestStreak === undefined ||
    input.currentStreak >= input.longestStreak ||
    input.longestStreak - input.currentStreak > STREAK_RECORD_DAYS_DIFF
  ) {
    return null;
  }
  return {
    id: 'p4-streak-near-record',
    priority: 4,
    type: 'motivate',
    color: 'blue',
    title: i18n.t('insightCard.streakNearRecord.title'),
    message: i18n.t('insightCard.streakNearRecord.message', {
      remaining: input.longestStreak - input.currentStreak,
      longest: input.longestStreak,
    }),
    dismissable: true,
    autoDismissHours: 24,
  };
}

function createP5(input: InsightInput): Insight | null {
  if (!input.hasPRToday) return null;
  return {
    id: 'p5-pr-today',
    priority: 5,
    type: 'celebrate',
    color: 'blue',
    title: i18n.t('insightCard.prToday.title'),
    message: i18n.t('insightCard.prToday.message'),
    dismissable: true,
    autoDismissHours: 24,
  };
}

function createP6(input: InsightInput): Insight | null {
  if (input.weeklyAdherence === undefined || input.weeklyAdherence < ADHERENCE_THRESHOLD_PCT) {
    return null;
  }
  return {
    id: 'p6-weekly-adherence',
    priority: 6,
    type: 'praise',
    color: 'green',
    title: i18n.t('insightCard.weeklyAdherence.title'),
    message: i18n.t('insightCard.weeklyAdherence.message', { pct: Math.round(input.weeklyAdherence) }),
    dismissable: true,
    autoDismissHours: 24,
  };
}

function createP7(input: InsightInput): Insight | null {
  if (
    !input.weightTrendCorrect ||
    input.weightTrendWeeks === undefined ||
    input.weightTrendWeeks < WEIGHT_TREND_MIN_WEEKS
  ) {
    return null;
  }
  return {
    id: 'p7-weight-trend',
    priority: 7,
    type: 'progress',
    color: 'green',
    title: i18n.t('insightCard.weightTrend.title'),
    message: i18n.t('insightCard.weightTrend.message', { weeks: input.weightTrendWeeks }),
    dismissable: true,
    autoDismissHours: 24,
  };
}

const INSIGHT_GENERATORS: ReadonlyArray<(input: InsightInput) => Insight | null> = [
  createP1,
  createP2,
  createP3,
  createP4,
  createP5,
  createP6,
  createP7,
];

export function getTipOfTheDay(today?: string, recentTipIds?: string[]): Insight {
  const dateStr = today ?? new Date().toISOString().split('T')[0];
  const recent = recentTipIds ?? [];
  const poolSize = TIPS_POOL.length;
  const startIndex = hashDateToIndex(dateStr, poolSize);

  for (let i = 0; i < poolSize; i++) {
    const index = (startIndex + i) % poolSize;
    const tipId = `p8-tip-${index}`;
    if (!recent.includes(tipId)) {
      return {
        id: tipId,
        priority: 8,
        type: 'tip',
        color: 'gray',
        title: TIPS_POOL[index].title,
        message: TIPS_POOL[index].message,
        dismissable: true,
      };
    }
  }

  return {
    id: `p8-tip-${startIndex}`,
    priority: 8,
    type: 'tip',
    color: 'gray',
    title: TIPS_POOL[startIndex].title,
    message: TIPS_POOL[startIndex].message,
    dismissable: true,
  };
}

export function selectInsight(input: InsightInput, dismissedIds: string[], today?: string): Insight {
  for (const generator of INSIGHT_GENERATORS) {
    const insight = generator(input);
    if (insight && !dismissedIds.includes(insight.id)) {
      return insight;
    }
  }
  return getTipOfTheDay(
    today,
    dismissedIds.filter(id => id.startsWith('p8-tip-')),
  );
}

async function loadDismissedIds(db: DatabaseService): Promise<string[]> {
  try {
    const stored = await getSetting(db, 'insight_dismissed');
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

function persistDismissedIds(db: DatabaseService, ids: string[]): void {
  setSetting(db, 'insight_dismissed', JSON.stringify(ids)).catch(() => {
    /* db write error */
  });
}

export function useInsightEngine(): {
  currentInsight: Insight | null;
  dismissInsight: (id: string) => void;
  handleAction: (insight: Insight) => void;
} {
  const db = useDatabase();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    loadDismissedIds(db)
      .then(setDismissedIds)
      .catch(() => {
        /* db read error */
      });
  }, [db]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const input: InsightInput = useMemo(() => ({}), []);

  const currentInsight = useMemo(() => selectInsight(input, dismissedIds, today), [input, dismissedIds, today]);

  const dismissInsight = useCallback(
    (id: string) => {
      setDismissedIds(prev => {
        const next = [...prev, id];
        persistDismissedIds(db, next);
        return next;
      });
    },
    [db],
  );

  const handleAction = useCallback(
    (insight: Insight) => {
      setDismissedIds(prev => {
        const next = [...prev, insight.id];
        persistDismissedIds(db, next);
        return next;
      });
    },
    [db],
  );

  return { currentInsight, dismissInsight, handleAction };
}

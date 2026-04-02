import { TFunction } from 'i18next';

export type MainTab = 'calendar' | 'library' | 'ai-analysis' | 'fitness' | 'dashboard';

/** i18n-aware tab labels factory — callers pass `t` from useTranslation(). */
export const getTabLabels = (t: TFunction): Record<MainTab, string> => ({
  calendar: t('nav.calendar'),
  library: t('nav.library'),
  'ai-analysis': t('nav.aiAnalysis'),
  fitness: t('nav.fitness'),
  dashboard: t('nav.dashboard'),
});

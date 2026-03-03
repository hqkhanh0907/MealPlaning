import { TFunction } from 'i18next';

export type MainTab = 'calendar' | 'management' | 'ai-analysis' | 'grocery' | 'settings';

/** i18n-aware tab labels factory — callers pass `t` from useTranslation(). */
export const getTabLabels = (t: TFunction): Record<MainTab, string> => ({
  'calendar': t('nav.calendar'),
  'management': t('nav.management'),
  'ai-analysis': t('nav.aiAnalysis'),
  'grocery': t('nav.grocery'),
  'settings': t('nav.settings'),
});

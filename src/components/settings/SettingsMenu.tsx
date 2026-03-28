import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Heart, Target, Dumbbell, Sun, Moon, Monitor, Clock,
  Database, ChevronRight, Search, SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHealthProfileStore } from '../../features/health-profile/store/healthProfileStore';
import { useFitnessStore } from '../../store/fitnessStore';
import { calculateBMR, calculateTDEE } from '../../services/nutritionEngine';
import { DataBackup } from '../DataBackup';
import { GoogleDriveSync } from '../GoogleDriveSync';

type Theme = 'light' | 'dark' | 'system' | 'schedule';
type SettingsSection = 'health-profile' | 'goal' | 'training-profile';

interface SettingsMenuProps {
  onNavigate: (section: SettingsSection) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const THEME_OPTIONS = [
  { value: 'light', labelKey: 'settings.themeLight', icon: Sun },
  { value: 'dark', labelKey: 'settings.themeDark', icon: Moon },
  { value: 'system', labelKey: 'settings.themeSystem', icon: Monitor },
  { value: 'schedule', labelKey: 'settings.themeSchedule', icon: Clock },
] as const;

export function SettingsMenu({ onNavigate, theme, setTheme }: SettingsMenuProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');

  const profile = useHealthProfileStore((s) => s.profile);
  const activeGoal = useHealthProfileStore((s) => s.activeGoal);
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);

  const bmr = useMemo(
    () => calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender),
    [profile.weightKg, profile.heightCm, profile.age, profile.gender],
  );
  const tdee = useMemo(() => calculateTDEE(bmr, profile.activityLevel), [bmr, profile.activityLevel]);

  const goalSummary = useMemo(() => {
    if (!activeGoal) return t('settings.goalNotSet');
    return t(`goal.${activeGoal.type}`);
  }, [activeGoal, t]);

  const trainingSummary = useMemo(() => {
    if (!trainingProfile) return t('settings.notConfigured');
    return `${trainingProfile.daysPerWeek} ${t('fitness.onboarding.daysUnit')} • ${trainingProfile.sessionDurationMin} ${t('fitness.onboarding.minutesUnit')}`;
  }, [trainingProfile, t]);

  const MENU_ITEMS: {
    id: SettingsSection;
    icon: React.ReactNode;
    titleKey: string;
    summary: string;
    keywords: string[];
  }[] = useMemo(() => [
    {
      id: 'health-profile',
      icon: <Heart className="w-5 h-5 text-rose-500 dark:text-rose-400" />,
      titleKey: 'settings.healthProfileSection',
      summary: `BMR: ${bmr} • TDEE: ${tdee}`,
      keywords: [t('settings.healthProfileSection'), t('healthProfile.title'), 'BMR', 'TDEE'],
    },
    {
      id: 'goal',
      icon: <Target className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      titleKey: 'settings.goalSection',
      summary: goalSummary,
      keywords: [t('settings.goalSection'), t('goal.title'), t('goal.cut'), t('goal.bulk'), t('goal.maintain')],
    },
    {
      id: 'training-profile',
      icon: <Dumbbell className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
      titleKey: 'settings.trainingProfileSection',
      summary: trainingSummary,
      keywords: [t('settings.trainingProfileSection'), t('fitness.onboarding.goal'), t('fitness.onboarding.equipment')],
    },
  ], [bmr, tdee, goalSummary, trainingSummary, t]);

  const INLINE_SECTIONS = useMemo(() => [
    { id: 'theme', keywords: [t('settings.theme'), t('settings.themeDesc'), ...THEME_OPTIONS.map(o => t(o.labelKey))] },
    { id: 'cloud', keywords: [t('cloudSync.title'), t('cloudSync.description'), 'Google Drive'] },
    { id: 'data', keywords: [t('settings.data'), t('settings.dataDesc'), t('backup.export'), t('backup.import')] },
  ], [t]);

  const visibleMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return MENU_ITEMS;
    const q = searchQuery.toLowerCase();
    return MENU_ITEMS.filter(item => item.keywords.some(k => k.toLowerCase().includes(q)));
  }, [searchQuery, MENU_ITEMS]);

  const visibleInlineSections = useMemo(() => {
    if (!searchQuery.trim()) return new Set(INLINE_SECTIONS.map(s => s.id));
    const q = searchQuery.toLowerCase();
    return new Set(INLINE_SECTIONS.filter(s => s.keywords.some(k => k.toLowerCase().includes(q))).map(s => s.id));
  }, [searchQuery, INLINE_SECTIONS]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
        <SlidersHorizontal className="w-6 h-6 text-emerald-500" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('settings.title')}</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          data-testid="settings-search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('settings.searchPlaceholder')}
          aria-label={t('settings.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Navigable Section Cards */}
      {visibleMenuItems.length > 0 && (
        <div className="space-y-3">
          {visibleMenuItems.map(item => (
            <Button
              key={item.id}
              variant="ghost"
              data-testid={`settings-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className="w-full h-auto flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t(item.titleKey)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {item.summary}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            </Button>
          ))}
        </div>
      )}

      {/* Theme Section (inline) */}
      {visibleInlineSections.has('theme') && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('settings.theme')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.themeDesc')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => (
              <Button
                key={value}
                variant="ghost"
                onClick={() => setTheme(value)}
                data-testid={`btn-theme-${value}`}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all min-h-12 h-auto',
                  theme === value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-bold text-sm">{t(labelKey)}</span>
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Cloud Sync Section (inline) */}
      {visibleInlineSections.has('cloud') && (
        <section>
          <GoogleDriveSync />
        </section>
      )}

      {/* Data Section (inline) */}
      {visibleInlineSections.has('data') && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-violet-500 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('settings.data')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.dataDesc')}</p>
            </div>
          </div>
          <DataBackup />
        </section>
      )}
    </div>
  );
}

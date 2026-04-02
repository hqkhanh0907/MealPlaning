import { ChevronRight, Clock, Database, Dumbbell, Heart, Monitor, Moon, Search, Sun, Target } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { useHealthProfileStore } from '../../features/health-profile/store/healthProfileStore';
import { getAge } from '../../features/health-profile/types';
import { calculateBMR, calculateTDEE } from '../../services/nutritionEngine';
import { useFitnessStore } from '../../store/fitnessStore';
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

export function SettingsMenu({ onNavigate, theme, setTheme }: Readonly<SettingsMenuProps>) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');

  const profile = useHealthProfileStore(s => s.profile);
  const activeGoal = useHealthProfileStore(s => s.activeGoal);
  const trainingProfile = useFitnessStore(s => s.trainingProfile);

  const computedAge = useMemo(() => (profile ? getAge(profile) : 0), [profile]);

  const bmr = useMemo(
    () => (profile ? calculateBMR(profile.weightKg, profile.heightCm, computedAge, profile.gender) : 0),
    [profile, computedAge],
  );
  const tdee = useMemo(() => (profile ? calculateTDEE(bmr, profile.activityLevel) : 0), [profile, bmr]);

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
  }[] = useMemo(
    () => [
      {
        id: 'health-profile',
        icon: <Heart className="h-5 w-5 text-rose-500 dark:text-rose-400" />,
        titleKey: 'settings.healthProfileSection',
        summary: `BMR: ${bmr} • TDEE: ${tdee}`,
        keywords: [t('settings.healthProfileSection'), t('healthProfile.title'), 'BMR', 'TDEE'],
      },
      {
        id: 'goal',
        icon: <Target className="text-primary h-5 w-5" />,
        titleKey: 'settings.goalSection',
        summary: goalSummary,
        keywords: [t('settings.goalSection'), t('goal.title'), t('goal.cut'), t('goal.bulk'), t('goal.maintain')],
      },
      {
        id: 'training-profile',
        icon: <Dumbbell className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
        titleKey: 'settings.trainingProfileSection',
        summary: trainingSummary,
        keywords: [
          t('settings.trainingProfileSection'),
          t('fitness.onboarding.goal'),
          t('fitness.onboarding.equipment'),
        ],
      },
    ],
    [bmr, tdee, goalSummary, trainingSummary, t],
  );

  const INLINE_SECTIONS = useMemo(
    () => [
      {
        id: 'theme',
        keywords: [t('settings.theme'), t('settings.themeDesc'), ...THEME_OPTIONS.map(o => t(o.labelKey))],
      },
      { id: 'cloud', keywords: [t('cloudSync.title'), t('cloudSync.description'), 'Google Drive'] },
      { id: 'data', keywords: [t('settings.data'), t('settings.dataDesc'), t('backup.export'), t('backup.import')] },
    ],
    [t],
  );

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
      {/* Search */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          data-testid="settings-search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('settings.searchPlaceholder')}
          aria-label={t('settings.searchPlaceholder')}
          className="w-full pr-4 pl-10 text-slate-800"
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
              className="bg-card border-border-subtle flex h-auto w-full items-center gap-4 rounded-2xl border p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.99] dark:hover:border-slate-500"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-700/50">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t(item.titleKey)}</p>
                <p className="text-foreground-secondary truncate text-xs">{item.summary}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
            </Button>
          ))}
        </div>
      )}

      {/* Theme Section (inline) */}
      {visibleInlineSections.has('theme') && (
        <section className="bg-card border-border-subtle rounded-2xl border p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
              <Sun className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('settings.theme')}</h3>
              <p className="text-muted-foreground text-xs">{t('settings.themeDesc')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => (
              <Button
                key={value}
                variant="ghost"
                onClick={() => setTheme(value)}
                data-testid={`btn-theme-${value}`}
                className={cn(
                  'flex h-auto min-h-12 flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all sm:p-4',
                  theme === value
                    ? 'border-primary bg-primary-subtle text-primary-emphasis'
                    : 'border-border text-slate-700 hover:border-slate-300 dark:text-slate-300 dark:hover:border-slate-500',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-semibold">{t(labelKey)}</span>
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
        <section className="bg-card border-border-subtle rounded-2xl border p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
              <Database className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('settings.data')}</h3>
              <p className="text-muted-foreground text-xs">{t('settings.dataDesc')}</p>
            </div>
          </div>
          <DataBackup />
        </section>
      )}
    </div>
  );
}

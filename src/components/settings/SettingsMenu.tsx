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
import { getGoalSetupContract, getHealthProfileSetupContract, getTrainingProfileSetupContract } from './readiness';

type Theme = 'light' | 'dark' | 'system' | 'schedule';
type SettingsSection = 'health-profile' | 'goal' | 'training-profile';

interface SettingsMenuProps {
  onNavigate: (section: SettingsSection) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const THEME_OPTIONS = [
  { value: 'light', labelKey: 'settings.themeLight', icon: Sun, color: 'text-energy' },
  { value: 'dark', labelKey: 'settings.themeDark', icon: Moon, color: 'text-info' },
  { value: 'system', labelKey: 'settings.themeSystem', icon: Monitor, color: 'text-muted-foreground' },
  { value: 'schedule', labelKey: 'settings.themeSchedule', icon: Clock, color: 'text-muted-foreground' },
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

  const healthContract = useMemo(() => getHealthProfileSetupContract(profile, activeGoal, t), [profile, activeGoal, t]);
  const goalContract = useMemo(() => getGoalSetupContract(activeGoal, profile, t), [activeGoal, profile, t]);
  const trainingContract = useMemo(() => getTrainingProfileSetupContract(trainingProfile, t), [trainingProfile, t]);

  const MENU_ITEMS: {
    id: SettingsSection;
    icon: React.ReactNode;
    titleKey: string;
    summary: string;
    nextStep: string;
    badgeLabel: string;
    surfaceState: string;
    meta?: string;
    keywords: string[];
  }[] = useMemo(
    () => [
      {
        id: 'health-profile',
        icon: <Heart className="text-rose h-5 w-5" />,
        titleKey: 'settings.healthProfileSection',
        summary: healthContract.summary,
        nextStep: healthContract.nextStep,
        badgeLabel: healthContract.badgeLabel,
        surfaceState: healthContract.surfaceState,
        meta: healthContract.status === 'configured' ? `BMR ${bmr} • TDEE ${tdee}` : undefined,
        keywords: [t('settings.healthProfileSection'), t('healthProfile.title'), 'BMR', 'TDEE'],
      },
      {
        id: 'goal',
        icon: <Target className="text-primary h-5 w-5" />,
        titleKey: 'settings.goalSection',
        summary: goalContract.summary,
        nextStep: goalContract.nextStep,
        badgeLabel: goalContract.badgeLabel,
        surfaceState: goalContract.surfaceState,
        keywords: [t('settings.goalSection'), t('goal.title'), t('goal.cut'), t('goal.bulk'), t('goal.maintain')],
      },
      {
        id: 'training-profile',
        icon: <Dumbbell className="text-info h-5 w-5" />,
        titleKey: 'settings.trainingProfileSection',
        summary: trainingContract.summary,
        nextStep: trainingContract.nextStep,
        badgeLabel: trainingContract.badgeLabel,
        surfaceState: trainingContract.surfaceState,
        keywords: [
          t('settings.trainingProfileSection'),
          t('fitness.onboarding.goal'),
          t('fitness.onboarding.equipment'),
        ],
      },
    ],
    [bmr, tdee, goalContract, healthContract, t, trainingContract],
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
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          data-testid="settings-search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('settings.searchPlaceholder')}
          aria-label={t('settings.searchPlaceholder')}
          className="text-foreground w-full pr-4 pl-10"
          maxLength={100}
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
              className="bg-card border-border-subtle hover:border-border dark:hover:border-border flex h-auto w-full items-center gap-4 rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
            >
              <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">{item.icon}</div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground text-sm font-semibold">{t(item.titleKey)}</p>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      item.surfaceState === 'success' && 'bg-success/15 text-success',
                      item.surfaceState === 'setup' && 'bg-muted text-muted-foreground',
                      item.surfaceState === 'warning' && 'bg-warning/15 text-warning',
                    )}
                  >
                    {item.badgeLabel}
                  </span>
                </div>
                <p className="text-foreground-secondary line-clamp-2 text-xs">{item.summary}</p>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-[11px]">{item.nextStep}</p>
                {item.meta && <p className="text-muted-foreground mt-1 text-[11px] font-medium">{item.meta}</p>}
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
            </Button>
          ))}
        </div>
      )}

      {/* Theme Section (inline) */}
      {visibleInlineSections.has('theme') && (
        <section className="bg-card border-border-subtle rounded-2xl border p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-warning/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <Sun className="text-warning h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold">{t('settings.theme')}</h3>
              <p className="text-muted-foreground text-xs">{t('settings.themeDesc')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {THEME_OPTIONS.map(({ value, labelKey, icon: Icon, color }) => (
              <Button
                key={value}
                variant="ghost"
                onClick={() => setTheme(value)}
                data-testid={`btn-theme-${value}`}
                className={cn(
                  'flex h-auto min-h-12 flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all sm:p-4',
                  theme === value
                    ? 'border-primary bg-primary-subtle text-primary-emphasis'
                    : 'border-border text-foreground hover:border-border dark:hover:border-border',
                )}
              >
                <Icon className={cn('h-5 w-5', theme !== value && color)} />
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
            <div className="bg-ai-subtle flex h-10 w-10 items-center justify-center rounded-xl">
              <Database className="text-ai h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold">{t('settings.data')}</h3>
              <p className="text-muted-foreground text-xs">{t('settings.dataDesc')}</p>
            </div>
          </div>
          <DataBackup />
        </section>
      )}
    </div>
  );
}

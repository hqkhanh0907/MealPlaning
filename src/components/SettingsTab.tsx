import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Sun, Moon, Monitor, Database, Clock, Search, Heart, Target, Dumbbell } from 'lucide-react';
import { DataBackup } from './DataBackup';
import { GoogleDriveSync } from './GoogleDriveSync';
import { HealthProfileForm } from '../features/health-profile/components/HealthProfileForm';
import { GoalPhaseSelector } from '../features/health-profile/components/GoalPhaseSelector';
import { TrainingProfileSection } from '../features/fitness/components/TrainingProfileSection';

type Theme = 'light' | 'dark' | 'system' | 'schedule';

interface SettingsTabProps {
  onImportData: (data: Record<string, unknown>) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const THEME_OPTIONS = [
  { value: 'light', labelKey: 'settings.themeLight', icon: Sun },
  { value: 'dark', labelKey: 'settings.themeDark', icon: Moon },
  { value: 'system', labelKey: 'settings.themeSystem', icon: Monitor },
  { value: 'schedule', labelKey: 'settings.themeSchedule', icon: Clock },
] as const;

export const SettingsTab: React.FC<SettingsTabProps> = ({ onImportData, theme, setTheme }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const SECTION_KEYS = useMemo(() => [
    { id: 'health-profile', keywords: [t('settings.healthProfileSection'), t('healthProfile.title'), 'BMR', 'TDEE', t('healthProfile.activityLevel')] },
    { id: 'goal', keywords: [t('settings.goalSection'), t('goal.title'), t('goal.cut'), t('goal.bulk'), t('goal.maintain')] },
    { id: 'training-profile', keywords: [t('settings.trainingProfileSection'), t('fitness.onboarding.goal'), t('fitness.onboarding.equipment')] },
    { id: 'theme', keywords: [t('settings.theme'), t('settings.themeDesc'), ...THEME_OPTIONS.map(o => t(o.labelKey))] },
    { id: 'cloud', keywords: [t('cloudSync.title'), t('cloudSync.description'), 'Google Drive'] },
    { id: 'data', keywords: [t('settings.data'), t('settings.dataDesc'), t('backup.export'), t('backup.import')] },
  ], [t]);

  const visibleSections = useMemo(() => {
    if (!searchQuery.trim()) return new Set(['health-profile', 'goal', 'training-profile', 'theme', 'cloud', 'data']);
    const q = searchQuery.toLowerCase();
    return new Set(
      SECTION_KEYS
        .filter(s => s.keywords.some(k => k.toLowerCase().includes(q)))
        .map(s => s.id)
    );
  }, [searchQuery, SECTION_KEYS]);

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

      {/* Health Profile Section */}
      {visibleSections.has('health-profile') && (
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('settings.healthProfileSection')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.healthProfileDesc')}</p>
          </div>
        </div>
        <HealthProfileForm />
      </section>
      )}

      {/* Goal Phase Section */}
      {visibleSections.has('goal') && (
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('settings.goalSection')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.goalDesc')}</p>
          </div>
        </div>
        <GoalPhaseSelector />
      </section>
      )}

      {/* Training Profile Section */}
      {visibleSections.has('training-profile') && (
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('settings.trainingProfileSection')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.trainingProfileDesc')}</p>
          </div>
        </div>
        <TrainingProfileSection />
      </section>
      )}

      {/* Theme Section */}
      {visibleSections.has('theme') && (
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
            <button
              key={value}
              onClick={() => setTheme(value)}
              data-testid={`btn-theme-${value}`}
              className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all min-h-12 ${
                theme === value
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-bold text-sm">{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </section>
      )}

      {/* Cloud Sync Section */}
      {visibleSections.has('cloud') && (
      <section>
        <GoogleDriveSync onImportData={onImportData} />
      </section>
      )}

      {/* Data Section */}
      {visibleSections.has('data') && (
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
        <DataBackup onImport={onImportData} />
      </section>
      )}
    </div>
  );
};

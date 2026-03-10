import React from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Globe, Sun, Moon, Monitor, Database } from 'lucide-react';
import { DataBackup } from './DataBackup';
import { GoogleDriveSync } from './GoogleDriveSync';
import { useTranslateQueue } from '../services/translateQueueService';
import type { Ingredient, Dish } from '../types';

type Theme = 'light' | 'dark' | 'system';

interface SettingsTabProps {
  onImportData: (data: Record<string, unknown>) => void;
  dishes: Dish[];
  ingredients: Ingredient[];
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'vi', labelKey: 'settings.langVi', flag: '🇻🇳' },
  { code: 'en', labelKey: 'settings.langEn', flag: '🇬🇧' },
] as const;

const THEME_OPTIONS = [
  { value: 'light', labelKey: 'settings.themeLight', icon: Sun },
  { value: 'dark', labelKey: 'settings.themeDark', icon: Moon },
  { value: 'system', labelKey: 'settings.themeSystem', icon: Monitor },
] as const;

export const SettingsTab: React.FC<SettingsTabProps> = ({ onImportData, dishes, ingredients, theme, setTheme }) => {
  const { t, i18n } = useTranslation();
  const scanMissing = useTranslateQueue((s) => s.scanMissing);

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    scanMissing(dishes, ingredients, lng as 'vi' | 'en');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
        <SlidersHorizontal className="w-6 h-6 text-emerald-500" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('settings.title')}</h2>
      </div>

      {/* Language Section */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('settings.language')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.languageDesc')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGE_OPTIONS.map(({ code, labelKey, flag }) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              data-testid={`btn-lang-${code}`}
              className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all min-h-12 ${
                i18n.language === code
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="text-xl">{flag}</span>
              <span className="font-bold text-sm">{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Theme Section */}
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
        <div className="grid grid-cols-3 gap-3">
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

      {/* Cloud Sync Section */}
      <section>
        <GoogleDriveSync onImportData={onImportData} />
      </section>

      {/* Data Section */}
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
    </div>
  );
};

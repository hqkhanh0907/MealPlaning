import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  ClipboardList,
  Bot,
  Dumbbell,
  LayoutDashboard,
} from 'lucide-react';
import type { MainTab } from './types';

// Icon-only config — labels resolved at render via i18n
interface NavItemConfig {
  tab: MainTab;
  mobileIcon: React.ReactNode;
  desktopIcon: React.ReactNode;
  labelKey: string;       // i18n key for label
}

const NAV_CONFIG: NavItemConfig[] = [
  { tab: 'calendar', mobileIcon: <Calendar className="w-6 h-6" />, desktopIcon: <Calendar className="w-4 h-4" />, labelKey: 'nav.calendar' },
  { tab: 'library', mobileIcon: <ClipboardList className="w-6 h-6" />, desktopIcon: <ClipboardList className="w-4 h-4" />, labelKey: 'nav.library' },
  { tab: 'ai-analysis', mobileIcon: <Bot className="w-6 h-6" />, desktopIcon: <Bot className="w-4 h-4" />, labelKey: 'nav.aiAnalysis' },
  { tab: 'fitness', mobileIcon: <Dumbbell className="w-6 h-6" />, desktopIcon: <Dumbbell className="w-4 h-4" />, labelKey: 'nav.fitness' },
  { tab: 'dashboard', mobileIcon: <LayoutDashboard className="w-6 h-6" />, desktopIcon: <LayoutDashboard className="w-4 h-4" />, labelKey: 'nav.dashboard' },
];

export const BottomNavBar: React.FC<{ activeTab: MainTab; onTabChange: (tab: MainTab) => void; showAIBadge?: boolean }> = ({ activeTab, onTabChange, showAIBadge }) => {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-30 sm:hidden" aria-label={t('nav.mainNav')}>
      <div className="flex items-center justify-around px-2 py-1" role="tablist">
        {NAV_CONFIG.map(({ tab, mobileIcon, labelKey }) => {
          const label = t(labelKey);
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-label={label}
              data-testid={`nav-${tab}`}
              onClick={() => onTabChange(tab)}
              className={`flex flex-col items-center justify-center py-2.5 px-4 min-h-12 rounded-xl transition-all relative ${activeTab === tab ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 active:text-slate-600'}`}
            >
              <div className="relative">
                {mobileIcon}
                {tab === 'ai-analysis' && showAIBadge && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
                )}
              </div>
              {activeTab === tab && <div className="absolute -bottom-0.5 w-5 h-0.5 bg-emerald-500 rounded-full" />}
            </button>
          );
        })}
      </div>
      <div className="pb-safe" />
    </nav>
  );
};

export const DesktopNav: React.FC<{ activeTab: MainTab; onTabChange: (tab: MainTab) => void }> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  return (
    <nav className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" aria-label={t('nav.mainNav')}>
      {NAV_CONFIG.map(({ tab, desktopIcon, labelKey }) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onTabChange(tab)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          {desktopIcon}<span>{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
};

export const TabLoadingFallback: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
        <div className="w-8 h-8 border-3 border-emerald-200 dark:border-emerald-800 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">{t('common.loading')}</p>
      </div>
    </div>
  );
};

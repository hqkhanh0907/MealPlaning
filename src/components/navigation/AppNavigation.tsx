import { Bot, Calendar, ClipboardList, Dumbbell, LayoutDashboard } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { MainTab } from './types';

// Icon-only config — labels resolved at render via i18n
interface NavItemConfig {
  tab: MainTab;
  mobileIcon: React.ReactNode;
  desktopIcon: React.ReactNode;
  labelKey: string; // i18n key for label
}

const NAV_CONFIG: NavItemConfig[] = [
  {
    tab: 'calendar',
    mobileIcon: <Calendar className="h-5 w-5" />,
    desktopIcon: <Calendar className="h-4 w-4" />,
    labelKey: 'nav.calendar',
  },
  {
    tab: 'library',
    mobileIcon: <ClipboardList className="h-5 w-5" />,
    desktopIcon: <ClipboardList className="h-4 w-4" />,
    labelKey: 'nav.library',
  },
  {
    tab: 'ai-analysis',
    mobileIcon: <Bot className="h-5 w-5" />,
    desktopIcon: <Bot className="h-4 w-4" />,
    labelKey: 'nav.aiAnalysis',
  },
  {
    tab: 'fitness',
    mobileIcon: <Dumbbell className="h-5 w-5" />,
    desktopIcon: <Dumbbell className="h-4 w-4" />,
    labelKey: 'nav.fitness',
  },
  {
    tab: 'dashboard',
    mobileIcon: <LayoutDashboard className="h-5 w-5" />,
    desktopIcon: <LayoutDashboard className="h-4 w-4" />,
    labelKey: 'nav.dashboard',
  },
];

export const BottomNavBar = ({
  activeTab,
  onTabChange,
  showAIBadge,
}: {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  showAIBadge?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white sm:hidden dark:border-slate-700 dark:bg-slate-900"
      aria-label={t('nav.mainNav')}
    >
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
              className={`relative flex min-h-12 flex-col items-center justify-center rounded-xl px-1 py-2.5 transition-all ${activeTab === tab ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 active:text-slate-600 dark:text-slate-500'}`}
            >
              <div className="relative">
                {mobileIcon}
                {tab === 'ai-analysis' && showAIBadge && (
                  <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500 dark:border-slate-900" />
                )}
              </div>
              <span className="mt-0.5 max-w-[60px] truncate text-[10px] leading-tight font-medium">{label}</span>
              {activeTab === tab && <div className="absolute -bottom-0.5 h-0.5 w-5 rounded-full bg-emerald-500" />}
            </button>
          );
        })}
      </div>
      <div className="pb-safe" />
    </nav>
  );
};

export const DesktopNav = ({ activeTab, onTabChange }: { activeTab: MainTab; onTabChange: (tab: MainTab) => void }) => {
  const { t } = useTranslation();
  return (
    <nav className="hidden rounded-xl bg-slate-100 p-1 sm:flex dark:bg-slate-800" aria-label={t('nav.mainNav')}>
      {NAV_CONFIG.map(({ tab, desktopIcon, labelKey }) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onTabChange(tab)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          {desktopIcon}
          <span>{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
};

export const TabLoadingFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-500 dark:border-emerald-800" />
        <p className="text-sm font-medium">{t('common.loading')}</p>
      </div>
    </div>
  );
};

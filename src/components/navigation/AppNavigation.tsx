import { Bot, Calendar, ClipboardList, Dumbbell, LayoutDashboard, Loader2 } from 'lucide-react';
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
      className="border-border bg-card fixed inset-x-0 bottom-0 z-30 border-t sm:hidden"
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
              className={`relative flex min-h-12 flex-col items-center justify-center rounded-xl px-1 py-2.5 transition-all ${activeTab === tab ? 'text-primary-emphasis' : 'active:text-foreground-secondary text-muted-foreground'}`}
            >
              <div className="relative">
                {mobileIcon}
                {tab === 'ai-analysis' && showAIBadge && (
                  <div className="bg-color-rose absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white" />
                )}
              </div>
              <span className="mt-0.5 max-w-[72px] truncate text-xs leading-normal font-medium">{label}</span>
              {activeTab === tab && <div className="bg-primary absolute -bottom-0.5 h-0.5 w-5 rounded-full" />}
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
    <nav className="bg-muted hidden rounded-xl p-1 sm:flex" aria-label={t('nav.mainNav')}>
      {NAV_CONFIG.map(({ tab, desktopIcon, labelKey }) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onTabChange(tab)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab ? 'text-primary-emphasis bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
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
      <div className="text-muted-foreground flex flex-col items-center gap-3">
        <Loader2 className="text-primary h-8 w-8 animate-spin" aria-hidden="true" />
        <p className="text-sm font-medium">{t('common.loading')}</p>
      </div>
    </div>
  );
};

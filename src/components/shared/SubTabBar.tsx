import React from 'react';

export interface SubTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SubTabBarProps {
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const SubTabBar = React.memo(function SubTabBar({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: SubTabBarProps) {
  return (
    <div role="tablist" className={`bg-muted flex rounded-xl p-1 ${className}`} data-testid="subtab-bar">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${id}`}
            onClick={() => onTabChange(id)}
            data-testid={`subtab-${id}`}
            className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all md:flex-initial ${
              isActive
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700'
                : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
});

SubTabBar.displayName = 'SubTabBar';

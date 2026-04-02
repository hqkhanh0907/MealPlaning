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
              isActive ? 'text-primary-emphasis bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'
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

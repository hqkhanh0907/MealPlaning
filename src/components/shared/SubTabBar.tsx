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

export const SubTabBar = React.memo(
  function SubTabBar({ tabs, activeTab, onTabChange, className = '' }: SubTabBarProps) {
    return (
      <div
        role="tablist"
        className={`flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl ${className}`}
        data-testid="subtab-bar"
      >
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
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-11 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </button>
          );
        })}
      </div>
    );
  },
);

SubTabBar.displayName = 'SubTabBar';

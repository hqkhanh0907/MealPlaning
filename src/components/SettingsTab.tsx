import React, { lazy, Suspense, useState, useCallback } from 'react';
import { SettingsMenu } from './settings/SettingsMenu';

type Theme = 'light' | 'dark' | 'system' | 'schedule';
type SettingsView = 'menu' | 'health-profile' | 'goal' | 'training-profile';

interface SettingsTabProps {
  onImportData: (data: Record<string, unknown>) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const HealthProfileDetailPage = lazy(() => import('./settings/HealthProfileDetailPage'));
const GoalDetailPage = lazy(() => import('./settings/GoalDetailPage'));
const TrainingProfileDetailPage = lazy(() => import('./settings/TrainingProfileDetailPage'));

function DetailLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onImportData, theme, setTheme }) => {
  const [currentView, setCurrentView] = useState<SettingsView>('menu');

  const handleNavigate = useCallback((section: 'health-profile' | 'goal' | 'training-profile') => {
    setCurrentView(section);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentView('menu');
  }, []);

  if (currentView === 'health-profile') {
    return (
      <Suspense fallback={<DetailLoadingFallback />}>
        <HealthProfileDetailPage onBack={handleBack} />
      </Suspense>
    );
  }

  if (currentView === 'goal') {
    return (
      <Suspense fallback={<DetailLoadingFallback />}>
        <GoalDetailPage onBack={handleBack} />
      </Suspense>
    );
  }

  if (currentView === 'training-profile') {
    return (
      <Suspense fallback={<DetailLoadingFallback />}>
        <TrainingProfileDetailPage onBack={handleBack} />
      </Suspense>
    );
  }

  return (
    <SettingsMenu
      onNavigate={handleNavigate}
      onImportData={onImportData}
      theme={theme}
      setTheme={setTheme}
    />
  );
};


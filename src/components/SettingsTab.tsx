import { lazy, Suspense, useCallback, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { SettingsMenu } from './settings/SettingsMenu';

type Theme = 'light' | 'dark' | 'system' | 'schedule';
type SettingsView = 'menu' | 'health-profile' | 'goal' | 'training-profile';

interface SettingsTabProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const HealthProfileDetailPage = lazy(() => import('./settings/HealthProfileDetailPage'));
const GoalDetailPage = lazy(() => import('./settings/GoalDetailPage'));
const TrainingProfileDetailPage = lazy(() => import('./settings/TrainingProfileDetailPage'));

function DetailLoadingFallback() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export const SettingsTab = ({ theme, setTheme }: SettingsTabProps) => {
  const [currentView, setCurrentView] = useState<SettingsView>('menu');

  const handleNavigate = useCallback((section: 'health-profile' | 'goal' | 'training-profile') => {
    setCurrentView(section);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentView('menu');
  }, []);

  useModalBackHandler(currentView !== 'menu', handleBack);

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

  return <SettingsMenu onNavigate={handleNavigate} theme={theme} setTheme={setTheme} />;
};

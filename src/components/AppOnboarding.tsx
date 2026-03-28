import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UtensilsCrossed,
  BarChart3,
  Dumbbell,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HealthProfileForm } from '../features/health-profile/components/HealthProfileForm';
import { useAppOnboardingStore } from '../store/appOnboardingStore';
import { cn } from '../lib/utils';

const TOTAL_SLIDES = 3;

interface SlideProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function WelcomeSlide({ icon, title, description }: SlideProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        {icon}
      </div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
        {title}
      </h1>
      <p className="max-w-sm text-base leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function DotIndicator({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Slide indicator">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          role="tab"
          aria-selected={i === current}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            i === current
              ? 'w-6 bg-emerald-500'
              : 'w-2 bg-slate-300 dark:bg-slate-600',
          )}
        />
      ))}
    </div>
  );
}

export function AppOnboarding() {
  const { t } = useTranslation();
  const setAppOnboarded = useAppOnboardingStore((s) => s.setAppOnboarded);
  const [step, setStep] = useState(0);
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);
  const [saving, setSaving] = useState(false);

  const isProfileStep = step === TOTAL_SLIDES;

  const handleNext = useCallback(() => {
    if (step < TOTAL_SLIDES) {
      setStep((s) => s + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleSkipToProfile = useCallback(() => {
    setStep(TOTAL_SLIDES);
  }, []);

  const handleComplete = useCallback(async () => {
    if (saveRef.current) {
      setSaving(true);
      const ok = await saveRef.current();
      setSaving(false);
      if (!ok) return;
    }
    setAppOnboarded(true);
  }, [setAppOnboarded]);

  const slides: SlideProps[] = [
    {
      icon: <UtensilsCrossed className="h-12 w-12" aria-hidden="true" />,
      title: t('welcome.slide1Title'),
      description: t('welcome.slide1Desc'),
    },
    {
      icon: <BarChart3 className="h-12 w-12" aria-hidden="true" />,
      title: t('welcome.slide2Title'),
      description: t('welcome.slide2Desc'),
    },
    {
      icon: <Dumbbell className="h-12 w-12" aria-hidden="true" />,
      title: t('welcome.slide3Title'),
      description: t('welcome.slide3Desc'),
    },
  ];

  return (
    <div
      className="flex min-h-dvh flex-col bg-white dark:bg-slate-900"
      data-testid="app-onboarding"
    >
      {isProfileStep ? (
        <div className="flex flex-1 flex-col">
          <div className="px-6 pb-4 pt-12">
            <button
              type="button"
              onClick={handleBack}
              className="mb-4 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400"
              aria-label={t('common.back')}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('common.back')}
            </button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t('welcome.setupTitle')}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('welcome.setupDesc')}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-32">
            <HealthProfileForm embedded saveRef={saveRef} />
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="w-full rounded-xl bg-emerald-500 py-6 text-lg font-bold text-white hover:bg-emerald-600"
              data-testid="onboarding-complete-btn"
            >
              {saving ? '...' : t('welcome.letsGo')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col pt-safe-top">
            <div className="flex items-center justify-end px-6 pt-4">
              <button
                type="button"
                onClick={handleSkipToProfile}
                className="text-sm font-medium text-slate-400 dark:text-slate-500"
                data-testid="onboarding-skip-btn"
              >
                {t('welcome.skip')}
              </button>
            </div>

            <WelcomeSlide {...slides[step]} />
          </div>

          <div className="flex items-center justify-between px-8 pb-12">
            <DotIndicator total={TOTAL_SLIDES} current={step} />

            <Button
              onClick={handleNext}
              className="rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600"
              data-testid="onboarding-next-btn"
            >
              {t('welcome.next')}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

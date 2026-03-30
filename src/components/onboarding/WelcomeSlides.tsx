import { useTranslation } from 'react-i18next';
import {
  UtensilsCrossed,
  BarChart3,
  Dumbbell,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UseFormReturn } from 'react-hook-form';
import type { OnboardingFormData } from './onboardingSchema';

interface WelcomeSlidesProps {
  step: number;
  goNext: () => void;
  goBack: () => void;
  goToSection: (section: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
  form: UseFormReturn<OnboardingFormData>;
}

interface SlideContent {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

const SLIDES: SlideContent[] = [
  {
    icon: <UtensilsCrossed className="h-12 w-12" aria-hidden="true" />,
    titleKey: 'welcome.slide1Title',
    descKey: 'welcome.slide1Desc',
  },
  {
    icon: <BarChart3 className="h-12 w-12" aria-hidden="true" />,
    titleKey: 'welcome.slide2Title',
    descKey: 'welcome.slide2Desc',
  },
  {
    icon: <Dumbbell className="h-12 w-12" aria-hidden="true" />,
    titleKey: 'welcome.slide3Title',
    descKey: 'welcome.slide3Desc',
  },
];

function DotIndicator({ total, current, ariaLabel }: { total: number; current: number; ariaLabel: string }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={ariaLabel}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          aria-current={i === current ? 'step' : undefined}
          className={cn(
            'h-2 rounded-full motion-safe:transition-[width] motion-safe:duration-300',
            i === current
              ? 'w-6 bg-emerald-500'
              : 'w-2 bg-slate-300 dark:bg-slate-600',
          )}
        />
      ))}
    </div>
  );
}

export function WelcomeSlides({ step, goNext, goToSection }: WelcomeSlidesProps) {
  const { t } = useTranslation();
  const slide = SLIDES[step];

  const handleSkip = () => {
    goToSection(2);
  };

  return (
    <div className="flex flex-1 flex-col" data-testid="welcome-slides">
      <div className="flex items-center justify-end px-6 pt-4">
        <button
          type="button"
          onClick={handleSkip}
          className="min-h-[44px] px-3 text-sm font-medium text-slate-400 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-slate-500"
          data-testid="onboarding-skip-btn"
        >
          {t('welcome.skip')}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          {slide.icon}
        </div>
        <h1 className="mb-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
          {t(slide.titleKey)}
        </h1>
        <p className="max-w-sm text-base leading-relaxed text-slate-500 dark:text-slate-400">
          {t(slide.descKey)}
        </p>
      </div>

      <div className="flex items-center justify-between px-8 pb-12">
        <DotIndicator total={SLIDES.length} current={step} ariaLabel={t('welcome.slideIndicator')} />

        <Button
          onClick={goNext}
          className="min-h-[44px] rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          data-testid="onboarding-next-btn"
        >
          {step === SLIDES.length - 1 ? (
            t('onboarding.nav.start')
          ) : (
            <>
              {t('welcome.next')}
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

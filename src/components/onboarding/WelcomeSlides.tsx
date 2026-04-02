import { BarChart3, ChevronRight, Dumbbell, UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WelcomeSlidesProps {
  step: number;
  goNext: () => void;
  goToSection: (section: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
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

function DotIndicator({ total, current, ariaLabel }: Readonly<{ total: number; current: number; ariaLabel: string }>) {
  return (
    <fieldset className="m-0 flex items-center gap-2 border-0 p-0" aria-label={ariaLabel}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          aria-current={i === current ? 'step' : undefined}
          className={cn(
            'h-2 rounded-full motion-safe:transition-[width] motion-safe:duration-300',
            i === current ? 'bg-primary w-6' : 'w-2 bg-slate-300 dark:bg-slate-600',
          )}
        />
      ))}
    </fieldset>
  );
}

export function WelcomeSlides({ step, goNext, goToSection }: Readonly<WelcomeSlidesProps>) {
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
          className="focus-visible:ring-ring text-muted-foreground min-h-[44px] px-3 text-sm font-medium focus-visible:rounded-lg focus-visible:ring-2 focus-visible:outline-none"
          data-testid="onboarding-skip-btn"
        >
          {t('welcome.skip')}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="bg-primary/10 text-primary mb-8 flex h-24 w-24 items-center justify-center rounded-2xl">
          {slide.icon}
        </div>
        <h1 className="text-foreground mb-4 text-2xl font-bold">{t(slide.titleKey)}</h1>
        <p className="text-muted-foreground max-w-sm text-base leading-relaxed">{t(slide.descKey)}</p>
      </div>

      <div className="flex items-center justify-between px-8 pb-12">
        <DotIndicator total={SLIDES.length} current={step} ariaLabel={t('welcome.slideIndicator')} />

        <Button
          onClick={goNext}
          className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring min-h-[44px] rounded-full px-6 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2"
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

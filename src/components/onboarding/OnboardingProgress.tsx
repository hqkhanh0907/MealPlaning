import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentSection: number;
  totalSections: number;
  stepInSection: number;
  totalStepsInSection: number;
}

function getSegmentRadius(index: number, total: number): React.CSSProperties | undefined {
  if (index === 0) return { borderRadius: '2px 0 0 2px' };
  if (index === total - 1) return { borderRadius: '0 2px 2px 0' };
  return undefined;
}

export const OnboardingProgress = React.memo(function OnboardingProgress({
  currentSection,
  totalSections,
  stepInSection,
  totalStepsInSection,
}: OnboardingProgressProps) {
  const { t } = useTranslation();

  const sectionLabel = t(`onboarding.progress.section${currentSection}`);

  const segments = useMemo(() => {
    return Array.from({ length: totalSections }, (_, i) => {
      const sectionIndex = i + 1;
      let fillPercent = 0;
      const isActive = sectionIndex === currentSection;

      if (sectionIndex < currentSection) {
        fillPercent = 100;
      } else if (isActive) {
        fillPercent = totalStepsInSection <= 1 ? 100 : (stepInSection / (totalStepsInSection - 1)) * 100;
      }

      return { sectionIndex, fillPercent, isActive };
    });
  }, [totalSections, currentSection, stepInSection, totalStepsInSection]);

  const overallProgress = Math.min(
    100,
    Math.round(segments.reduce((sum, s) => sum + s.fillPercent, 0) / totalSections),
  );

  return (
    <div className="w-full px-4 py-2">
      <div
        role="progressbar"
        aria-valuenow={overallProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={sectionLabel}
        className="flex h-1 w-full gap-[1px] overflow-hidden rounded-sm"
      >
        {segments.map(({ sectionIndex, fillPercent, isActive }, i) => (
          <div
            key={sectionIndex}
            className={cn('flex-1 overflow-hidden', isActive ? 'bg-primary/15' : 'bg-muted')}
            style={getSegmentRadius(i, totalSections)}
          >
            <div
              className="bg-primary h-full motion-safe:transition-[width] motion-safe:duration-300"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-1.5 text-center text-xs font-medium">{sectionLabel}</p>
    </div>
  );
});

OnboardingProgress.displayName = 'OnboardingProgress';

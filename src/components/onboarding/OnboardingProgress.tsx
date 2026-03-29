import React from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingProgressProps {
  currentSection: number;
  totalSections: number;
  stepInSection: number;
  totalStepsInSection: number;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = React.memo(({
  currentSection,
  totalSections,
  stepInSection,
  totalStepsInSection,
}) => {
  const { t } = useTranslation();

  const overallProgress = Math.round(
    ((currentSection - 1 + (totalStepsInSection > 0 ? stepInSection / totalStepsInSection : 0))
      / totalSections) * 100
  );

  const sectionLabel = t(`onboarding.progress.section${currentSection}`);

  return (
    <div className="w-full px-4 py-2">
      <div
        role="progressbar"
        aria-label={sectionLabel}
        aria-valuenow={overallProgress}
        aria-valuemax={100}
        className="flex gap-[1px] w-full h-1 rounded-sm overflow-hidden"
      >
        {Array.from({ length: totalSections }, (_, i) => {
          const sectionIndex = i + 1;
          let fillPercent = 0;
          if (sectionIndex < currentSection) {
            fillPercent = 100;
          } else if (sectionIndex === currentSection && totalStepsInSection > 0) {
            fillPercent = (stepInSection / totalStepsInSection) * 100;
          }

          return (
            <div
              key={sectionIndex}
              className="flex-1 bg-gray-200 dark:bg-slate-700 overflow-hidden"
              style={i === 0 ? { borderRadius: '2px 0 0 2px' } : i === totalSections - 1 ? { borderRadius: '0 2px 2px 0' } : undefined}
            >
              <div
                className="h-full bg-emerald-500 motion-safe:transition-[width] motion-safe:duration-300"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-center text-slate-500 dark:text-slate-400 font-medium">
        {sectionLabel}
      </p>
    </div>
  );
});

OnboardingProgress.displayName = 'OnboardingProgress';

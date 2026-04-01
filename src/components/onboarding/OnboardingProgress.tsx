import React from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingProgressProps {
  currentSection: number;
  totalSections: number;
  stepInSection: number;
  totalStepsInSection: number;
}

export const OnboardingProgress = React.memo(function OnboardingProgress({
  currentSection,
  totalSections,
  stepInSection,
  totalStepsInSection,
}: OnboardingProgressProps) {
  const { t } = useTranslation();

  const overallProgress = Math.round(
    ((currentSection - 1 + (totalStepsInSection > 0 ? stepInSection / totalStepsInSection : 0))
      / totalSections) * 100
  );

  const sectionLabel = t(`onboarding.progress.section${currentSection}`);

  return (
    <div className="w-full px-4 py-2">
      <progress
        value={overallProgress}
        max={100}
        aria-label={sectionLabel}
        aria-valuenow={overallProgress}
        aria-valuemax={100}
        className="flex gap-[1px] w-full h-1 rounded-sm overflow-hidden appearance-none [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-transparent"
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
              style={(() => {
                if (i === 0) return { borderRadius: '2px 0 0 2px' };
                if (i === totalSections - 1) return { borderRadius: '0 2px 2px 0' };
                return undefined;
              })()}
            >
              <div
                className="h-full bg-emerald-500 motion-safe:transition-[width] motion-safe:duration-300"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          );
        })}
      </progress>
      <p className="mt-1.5 text-xs text-center text-slate-500 dark:text-slate-400 font-medium">
        {sectionLabel}
      </p>
    </div>
  );
});

OnboardingProgress.displayName = 'OnboardingProgress';

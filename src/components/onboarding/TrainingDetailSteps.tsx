import { useTranslation } from 'react-i18next';
import { useController, useWatch, type UseFormReturn } from 'react-hook-form';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFitnessStore } from '@/store/fitnessStore';
import { EQUIPMENT_DISPLAY } from '@/features/fitness/constants';
import type { EquipmentType, PeriodizationModel, TrainingExperience, TrainingGoal } from '@/features/fitness/types';
import type { OnboardingFormData } from './onboardingSchema';

interface TrainingDetailStepsProps {
  step: number;
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
  setOnboardingSection: (section: number | null) => void;
}

const DURATIONS = [30, 45, 60, 75, 90] as const;

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'cable', 'machine',
  'bodyweight', 'resistance_band', 'kettlebell',
] as const;

export function TrainingDetailSteps({ step, form, goNext, goBack, setOnboardingSection }: TrainingDetailStepsProps) {
  const experience = useWatch({ control: form.control, name: 'experience' });
  const setTrainingProfile = useFitnessStore((s) => s.setTrainingProfile);

  const handleConfirmTraining = () => {
    const values = form.getValues();
    setTrainingProfile({
      id: crypto.randomUUID(),
      trainingGoal: values.trainingGoal as TrainingGoal,
      trainingExperience: values.experience as TrainingExperience,
      daysPerWeek: values.daysPerWeek,
      sessionDurationMin: values.sessionDuration ?? 60,
      availableEquipment: (values.equipment ?? []) as EquipmentType[],
      cardioSessionsWeek: values.cardioSessions ?? 0,
      periodizationModel: (values.periodization ?? 'linear') as PeriodizationModel,
      planCycleWeeks: 4,
      injuryRestrictions: [],
      priorityMuscles: [],
      cardioTypePref: 'mixed',
      cardioDurationMin: 30,
      updatedAt: new Date().toISOString(),
    });
    setOnboardingSection(5);
    goNext();
  };

  switch (step) {
    case 0:
      return <DurationStep form={form} goNext={goNext} goBack={goBack} />;
    case 1:
      return <EquipmentStep form={form} goNext={goNext} goBack={goBack} />;
    case 2:
      return <CardioStep form={form} goNext={goNext} goBack={goBack} />;
    case 3:
      if (experience === 'beginner') {
        return <TrainingConfirmStep form={form} goNext={handleConfirmTraining} goBack={goBack} />;
      }
      return <PeriodizationStep form={form} goNext={goNext} goBack={goBack} />;
    default:
      return <TrainingConfirmStep form={form} goNext={handleConfirmTraining} goBack={goBack} />;
  }
}

function DurationStep({ form, goNext, goBack }: { form: UseFormReturn<OnboardingFormData>; goNext: () => void; goBack: () => void }) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'sessionDuration' });

  return (
    <StepLayout
      title={t('fitness.onboarding.sessionDuration')}
      subtitle={t('fitness.onboarding.sessionDurationDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.sessionDuration')}>
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={field.field.value === d}
            onClick={() => field.field.onChange(d)}
            className={cn(
              'min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              field.field.value === d
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
            )}
          >
            {d} {t('fitness.onboarding.minutes')}
          </button>
        ))}
      </div>
    </StepLayout>
  );
}

function EquipmentStep({ form, goNext, goBack }: { form: UseFormReturn<OnboardingFormData>; goNext: () => void; goBack: () => void }) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'equipment' });
  const selected = field.field.value ?? [];

  const toggle = (item: string) => {
    const current = selected as string[];
    if (current.includes(item)) {
      field.field.onChange(current.filter((i) => i !== item));
    } else {
      field.field.onChange([...current, item]);
    }
  };

  return (
    <StepLayout
      title={t('fitness.onboarding.equipment')}
      subtitle={t('fitness.onboarding.equipmentDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('fitness.onboarding.equipment')}>
        {EQUIPMENT_OPTIONS.map((eq) => (
          <button
            key={eq}
            type="button"
            role="checkbox"
            aria-checked={(selected as string[]).includes(eq)}
            onClick={() => toggle(eq)}
            className={cn(
              'min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              (selected as string[]).includes(eq)
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
            )}
          >
            {EQUIPMENT_DISPLAY[eq] ?? eq}
          </button>
        ))}
      </div>
    </StepLayout>
  );
}

function CardioStep({ form, goNext, goBack }: { form: UseFormReturn<OnboardingFormData>; goNext: () => void; goBack: () => void }) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'cardioSessions' });

  return (
    <StepLayout
      title={t('fitness.onboarding.cardioSessions')}
      subtitle={t('fitness.onboarding.cardioSessionsDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="flex gap-2" role="radiogroup" aria-label={t('fitness.onboarding.cardioSessions')}>
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={field.field.value === n}
            onClick={() => field.field.onChange(n)}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              field.field.value === n
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </StepLayout>
  );
}

function PeriodizationStep({ form, goNext, goBack }: { form: UseFormReturn<OnboardingFormData>; goNext: () => void; goBack: () => void }) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'periodization' });
  const options = ['linear', 'undulating', 'block'] as const;

  return (
    <StepLayout
      title={t('fitness.onboarding.periodization')}
      subtitle={t('fitness.onboarding.periodizationDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="space-y-3" role="radiogroup" aria-label={t('fitness.onboarding.periodization')}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={field.field.value === opt}
            onClick={() => field.field.onChange(opt)}
            className={cn(
              'flex w-full min-h-[56px] items-center rounded-xl border-2 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              field.field.value === opt
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-slate-200 dark:border-slate-700',
            )}
          >
            <span className={cn(
              'text-sm font-medium',
              field.field.value === opt
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-slate-700 dark:text-slate-300',
            )}>
              {t(`fitness.onboarding.period_${opt}`)}
            </span>
          </button>
        ))}
      </div>
    </StepLayout>
  );
}

function TrainingConfirmStep({ form, goNext, goBack }: { form: UseFormReturn<OnboardingFormData>; goNext: () => void; goBack: () => void }) {
  const { t } = useTranslation();
  const values = form.getValues();

  return (
    <div className="flex flex-1 flex-col" data-testid="training-confirm-step">
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">
        <h2 className="mb-6 text-xl font-bold text-slate-800 dark:text-slate-100">
          {t('onboarding.confirm.trainingTitle')}
        </h2>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          <SummaryRow label={t('fitness.onboarding.goal')} value={t(`fitness.onboarding.${values.trainingGoal}`)} />
          <SummaryRow label={t('fitness.onboarding.experience')} value={t(`fitness.onboarding.${values.experience}`)} />
          <SummaryRow label={t('fitness.onboarding.daysPerWeek')} value={`${values.daysPerWeek}`} />
          {values.sessionDuration && <SummaryRow label={t('fitness.onboarding.sessionDuration')} value={`${values.sessionDuration} ${t('fitness.onboarding.minutes')}`} />}
          {values.cardioSessions != null && <SummaryRow label={t('fitness.onboarding.cardioSessions')} value={`${values.cardioSessions}`} />}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 flex items-center justify-between border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
        <button
          type="button"
          onClick={goBack}
          className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-500 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-slate-400"
        >
          {t('onboarding.nav.back')}
        </button>
        <Button
          onClick={goNext}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          {t('onboarding.nav.next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

function StepLayout({ title, subtitle, goNext, goBack, children }: {
  title: string; subtitle: string;
  goNext: () => void; goBack: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">
        <h2 className="mb-1 text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        {children}
      </div>
      <div className="fixed inset-x-0 bottom-0 flex items-center justify-between border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
        <button
          type="button"
          onClick={goBack}
          className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-500 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-slate-400"
        >
          {t('onboarding.nav.back')}
        </button>
        <Button
          onClick={goNext}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          {t('onboarding.nav.next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

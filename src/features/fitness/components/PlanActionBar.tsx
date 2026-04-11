import { ArrowRightLeft, BookOpen, CalendarCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface PlanActionBarProps {
  readonly onEditSchedule: () => void;
  readonly onChangeSplit: () => void;
  readonly onBrowseTemplates: () => void;
  readonly isDisabled?: boolean;
}

const BUTTON_CLASS =
  'bg-card border-border text-foreground-secondary hover:bg-accent flex min-h-12 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-[colors,transform] active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50';

export function PlanActionBar({ onEditSchedule, onChangeSplit, onBrowseTemplates, isDisabled }: PlanActionBarProps) {
  const { t } = useTranslation();

  return (
    <div data-testid="plan-action-bar" className="flex gap-2">
      <button
        data-testid="action-edit-schedule"
        type="button"
        onClick={onEditSchedule}
        disabled={isDisabled}
        aria-label={t('fitness.planActions.editSchedule')}
        className={BUTTON_CLASS}
      >
        <CalendarCog className="h-4 w-4" aria-hidden="true" />
        {t('fitness.planActions.editSchedule')}
      </button>
      <button
        data-testid="action-change-split"
        type="button"
        onClick={onChangeSplit}
        disabled={isDisabled}
        aria-label={t('fitness.planActions.changeSplit')}
        className={BUTTON_CLASS}
      >
        <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
        {t('fitness.planActions.changeSplit')}
      </button>
      <button
        data-testid="action-templates"
        type="button"
        onClick={onBrowseTemplates}
        disabled={isDisabled}
        aria-label={t('fitness.planActions.templates')}
        className={BUTTON_CLASS}
      >
        <BookOpen className="h-4 w-4" aria-hidden="true" />
        {t('fitness.planActions.templates')}
      </button>
    </div>
  );
}

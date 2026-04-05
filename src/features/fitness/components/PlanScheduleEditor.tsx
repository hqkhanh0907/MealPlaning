import { AlertCircle, ArrowLeft, CalendarDays, Dumbbell, RotateCcw, Save, Wand2 } from 'lucide-react';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DisabledReason } from '../../../components/shared/DisabledReason';
import { UnsavedChangesDialog } from '../../../components/shared/UnsavedChangesDialog';
import { useNotification } from '../../../contexts/NotificationContext';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useNavigationStore } from '../../../store/navigationStore';
import { DayAssignmentSheet } from './DayAssignmentSheet';
import { WeeklyCalendarStrip } from './WeeklyCalendarStrip';
import { WorkoutAssignmentList } from './WorkoutAssignmentList';

interface PlanScheduleEditorProps {
  planId: string;
}

const MIN_TRAINING_DAYS = 2;
const MAX_TRAINING_DAYS = 6;

export const PlanScheduleEditor = memo(function PlanScheduleEditor({
  planId,
}: PlanScheduleEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const popPage = useNavigationStore(s => s.popPage);
  const notify = useNotification();

  const plan = useFitnessStore(useCallback(s => s.trainingPlans.find(p => p.id === planId), [planId]));
  const allPlanDays = useFitnessStore(s => s.trainingPlanDays);
  const planDays = useMemo(() => allPlanDays.filter(d => d.planId === planId), [allPlanDays, planId]);

  const [localTrainingDays, setLocalTrainingDays] = useState<number[]>(() => plan?.trainingDays ?? []);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [reassignDayId, setReassignDayId] = useState<string | null>(null);

  const initialTrainingDaysSnapshot = useMemo(() => JSON.stringify(plan?.trainingDays ?? []), [plan?.trainingDays]);

  const hasChanges = useMemo(
    () => isDirty || JSON.stringify(localTrainingDays) !== initialTrainingDaysSnapshot,
    [isDirty, localTrainingDays, initialTrainingDaysSnapshot],
  );

  const dayCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const d of planDays) {
      counts[d.dayOfWeek] = (counts[d.dayOfWeek] ?? 0) + 1;
    }
    return counts;
  }, [planDays]);

  const unassignedExists = useMemo(() => {
    const trainingSet = new Set(localTrainingDays);
    return planDays.some(d => !trainingSet.has(d.dayOfWeek));
  }, [planDays, localTrainingDays]);

  const reassignTarget = useMemo(
    () => (reassignDayId ? planDays.find(d => d.id === reassignDayId) : null),
    [reassignDayId, planDays],
  );

  const handleDayToggle = useCallback(
    (day: number) => {
      setLocalTrainingDays(prev => {
        const isCurrentlyTraining = prev.includes(day);
        if (isCurrentlyTraining) {
          if (prev.length <= MIN_TRAINING_DAYS) {
            notify.warning(t('fitness.scheduleEditor.minDaysError'));
            return prev;
          }
          return prev.filter(d => d !== day);
        } else {
          if (prev.length >= MAX_TRAINING_DAYS) {
            notify.warning(t('fitness.scheduleEditor.maxDaysError'));
            return prev;
          }
          return [...prev, day].sort((a, b) => a - b);
        }
      });
      setIsDirty(true);
    },
    [notify, t],
  );

  const handleReorder = useCallback((_fromIndex: number, _toIndex: number) => {
    setIsDirty(true);
  }, []);

  const handleReassign = useCallback((dayId: string) => {
    setReassignDayId(dayId);
  }, []);

  const handleReassignSelect = useCallback(
    (day: number) => {
      if (!reassignDayId) return;
      useFitnessStore.getState().reassignWorkoutToDay(reassignDayId, day);
      setReassignDayId(null);
      setIsDirty(true);
    },
    [reassignDayId],
  );

  const handleAutoAssign = useCallback(() => {
    useFitnessStore.getState().autoAssignWorkouts(planId);
    setIsDirty(true);
  }, [planId]);

  const handleRestore = useCallback(() => {
    useFitnessStore.getState().restoreOriginalSchedule(planId);
    const restored = useFitnessStore.getState().trainingPlans.find(p => p.id === planId);
    if (restored) {
      setLocalTrainingDays(restored.trainingDays);
    }
    setIsDirty(false);
  }, [planId]);

  const handleSave = useCallback(() => {
    if (unassignedExists) {
      notify.warning(t('fitness.scheduleEditor.unassignedWarning'));
      return;
    }
    useFitnessStore.getState().updateTrainingDays(planId, localTrainingDays);
    notify.success(t('fitness.scheduleEditor.saved'));
    popPage();
  }, [planId, localTrainingDays, unassignedExists, notify, t, popPage]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      popPage();
    }
  }, [hasChanges, popPage]);

  const handleSaveAndBack = useCallback(() => {
    setShowConfirmDialog(false);
    handleSave();
  }, [handleSave]);

  const handleDiscardAndBack = useCallback(() => {
    setShowConfirmDialog(false);
    popPage();
  }, [popPage]);

  const handleCancelDiscard = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // Empty state: no active plan
  if (!plan) {
    return (
      <div className="bg-muted dark:bg-background flex h-full min-h-dvh flex-col">
        <header className="bg-primary text-primary-foreground sticky top-0 z-10 flex items-center gap-3 px-4 py-3 shadow-md">
          <button
            type="button"
            data-testid="back-button"
            aria-label={t('common.back')}
            onClick={() => popPage()}
            className="hover:bg-primary flex h-11 w-11 touch-manipulation items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none motion-reduce:transition-none"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">{t('fitness.scheduleEditor.title')}</h1>
        </header>

        <div
          data-testid="empty-plan-state"
          className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <CalendarDays className="text-muted-foreground h-16 w-16" />
          <p className="text-foreground-secondary text-lg font-semibold">{t('fitness.scheduleEditor.emptyPlan')}</p>
          <button
            type="button"
            data-testid="create-plan-cta"
            className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring dark:bg-primary touch-manipulation rounded-xl px-6 py-3 text-sm font-semibold shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none"
          >
            {t('fitness.scheduleEditor.emptyPlanCta')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted dark:bg-background flex h-full min-h-dvh flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-10 flex items-center gap-3 px-4 py-3 shadow-md">
        <button
          type="button"
          data-testid="back-button"
          aria-label={t('common.back')}
          onClick={handleBack}
          className="hover:bg-primary flex h-11 w-11 touch-manipulation items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none motion-reduce:transition-none"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-lg font-semibold">{t('fitness.scheduleEditor.title')}</h1>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Step 1: Day Selection */}
        <section className="mt-4" aria-labelledby="step-days-heading">
          <h2 id="step-days-heading" className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="text-primary h-4 w-4" />
            {t('fitness.scheduleEditor.stepDays')}
          </h2>
          <div className="bg-card border-border rounded-xl border p-4 shadow-sm">
            <WeeklyCalendarStrip trainingDays={localTrainingDays} onDayToggle={handleDayToggle} interactive />
          </div>
        </section>

        {/* Step 2: Workout Assignment */}
        <section className="mt-6" aria-labelledby="step-assignment-heading">
          <h2
            id="step-assignment-heading"
            className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold"
          >
            <Dumbbell className="text-primary h-4 w-4" />
            {t('fitness.scheduleEditor.stepAssignment')}
          </h2>

          {/* Action buttons */}
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              data-testid="auto-assign-button"
              onClick={handleAutoAssign}
              className="focus-visible:ring-ring bg-muted text-foreground hover:bg-accent flex touch-manipulation items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none"
            >
              <Wand2 className="h-3.5 w-3.5" />
              {t('fitness.scheduleEditor.autoAssign')}
            </button>
            <button
              type="button"
              data-testid="restore-button"
              onClick={handleRestore}
              className="focus-visible:ring-ring bg-muted text-foreground hover:bg-accent flex touch-manipulation items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('fitness.scheduleEditor.restoreOriginal')}
            </button>
          </div>

          {/* Validation warning */}
          {unassignedExists && (
            <div
              data-testid="unassigned-warning"
              className="border-warning/20 bg-warning/10 text-warning mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {t('fitness.scheduleEditor.unassignedWarning')}
            </div>
          )}

          <WorkoutAssignmentList
            planDays={planDays}
            trainingDays={localTrainingDays}
            onReorder={handleReorder}
            onReassign={handleReassign}
          />
        </section>
      </div>

      {/* Sticky footer: Save button */}
      <div className="pb-safe border-border bg-card/95 fixed inset-x-0 bottom-0 z-10 border-t px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          data-testid="save-button"
          disabled={!hasChanges}
          aria-describedby={!hasChanges ? 'schedule-save-disabled-reason' : undefined}
          onClick={handleSave}
          className={[
            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-md',
            'touch-manipulation transition-colors motion-reduce:transition-none',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            hasChanges
              ? 'bg-primary text-primary-foreground hover:bg-primary dark:bg-primary'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Save className="h-4 w-4" />
          {t('fitness.scheduleEditor.save')}
        </button>
        <DisabledReason
          id="schedule-save-disabled-reason"
          reason={t('disabledReason.noChanges')}
          show={!hasChanges}
          className="text-center"
        />
      </div>

      {/* Day Assignment Sheet */}
      <DayAssignmentSheet
        open={reassignDayId !== null}
        onClose={() => setReassignDayId(null)}
        trainingDays={localTrainingDays}
        currentDay={reassignTarget?.dayOfWeek ?? 1}
        onSelectDay={handleReassignSelect}
        existingDayCounts={dayCounts}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <UnsavedChangesDialog
        isOpen={showConfirmDialog}
        onSave={handleSaveAndBack}
        onDiscard={handleDiscardAndBack}
        onCancel={handleCancelDiscard}
      />
    </div>
  );
});

export default PlanScheduleEditor;

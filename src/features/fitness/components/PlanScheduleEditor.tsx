import { AlertCircle, ArrowLeft, CalendarDays, Dumbbell, RotateCcw, Save, Wand2 } from 'lucide-react';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { popPage } = useNavigationStore();
  const notify = useNotification();

  const plan = useFitnessStore(useCallback(s => s.trainingPlans.find(p => p.id === planId), [planId]));
  const allPlanDays = useFitnessStore(s => s.trainingPlanDays);
  const planDays = useMemo(() => allPlanDays.filter(d => d.planId === planId), [allPlanDays, planId]);

  const [localTrainingDays, setLocalTrainingDays] = useState<number[]>(() => plan?.trainingDays ?? []);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [reassignDayId, setReassignDayId] = useState<string | null>(null);

  const confirmDialogTitleId = 'schedule-confirm-dialog-title';

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

  const handleConfirmDiscard = useCallback(() => {
    setShowConfirmDialog(false);
    popPage();
  }, [popPage]);

  const handleCancelDiscard = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // Empty state: no active plan
  if (!plan) {
    return (
      <div className="flex h-full min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-10 flex items-center gap-3 bg-emerald-600 px-4 py-3 text-white shadow-md dark:bg-emerald-700">
          <button
            type="button"
            data-testid="back-button"
            aria-label={t('common.back')}
            onClick={() => popPage()}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none motion-reduce:transition-none"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">{t('fitness.scheduleEditor.title')}</h1>
        </header>

        <div
          data-testid="empty-plan-state"
          className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <CalendarDays className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
            {t('fitness.scheduleEditor.emptyPlan')}
          </p>
          <button
            type="button"
            data-testid="create-plan-cta"
            className="touch-manipulation rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            {t('fitness.scheduleEditor.emptyPlanCta')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-emerald-600 px-4 py-3 text-white shadow-md dark:bg-emerald-700">
        <button
          type="button"
          data-testid="back-button"
          aria-label={t('common.back')}
          onClick={handleBack}
          className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none motion-reduce:transition-none"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-lg font-bold">{t('fitness.scheduleEditor.title')}</h1>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {/* Step 1: Day Selection */}
        <section className="mt-4" aria-labelledby="step-days-heading">
          <h2
            id="step-days-heading"
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            <CalendarDays className="h-4 w-4 text-emerald-500" />
            {t('fitness.scheduleEditor.stepDays')}
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <WeeklyCalendarStrip trainingDays={localTrainingDays} onDayToggle={handleDayToggle} interactive />
          </div>
        </section>

        {/* Step 2: Workout Assignment */}
        <section className="mt-6" aria-labelledby="step-assignment-heading">
          <h2
            id="step-assignment-heading"
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            <Dumbbell className="h-4 w-4 text-emerald-500" />
            {t('fitness.scheduleEditor.stepAssignment')}
          </h2>

          {/* Action buttons */}
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              data-testid="auto-assign-button"
              onClick={handleAutoAssign}
              className="flex touch-manipulation items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <Wand2 className="h-3.5 w-3.5" />
              {t('fitness.scheduleEditor.autoAssign')}
            </button>
            <button
              type="button"
              data-testid="restore-button"
              onClick={handleRestore}
              className="flex touch-manipulation items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('fitness.scheduleEditor.restoreOriginal')}
            </button>
          </div>

          {/* Validation warning */}
          {unassignedExists && (
            <div
              data-testid="unassigned-warning"
              className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
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
      <div className="pb-safe fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
        <button
          type="button"
          data-testid="save-button"
          disabled={!hasChanges}
          onClick={handleSave}
          className={[
            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold shadow-md',
            'touch-manipulation transition-colors motion-reduce:transition-none',
            'focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none',
            hasChanges
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400'
              : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Save className="h-4 w-4" />
          {t('fitness.scheduleEditor.save')}
        </button>
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
      {showConfirmDialog && (
        <dialog
          open
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          aria-modal="true"
          aria-labelledby={confirmDialogTitleId}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <p id={confirmDialogTitleId} className="mb-6 text-center text-sm text-slate-700 dark:text-slate-300">
              {t('fitness.scheduleEditor.unsavedWarning')}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                data-testid="cancel-discard"
                onClick={handleCancelDiscard}
                className="flex-1 touch-manipulation rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                data-testid="confirm-discard"
                onClick={handleConfirmDiscard}
                className="flex-1 touch-manipulation rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none dark:bg-rose-500 dark:hover:bg-rose-400"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
});

export default PlanScheduleEditor;

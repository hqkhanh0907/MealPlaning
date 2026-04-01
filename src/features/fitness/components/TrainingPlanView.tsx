import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Dumbbell, Moon, ChevronRight, Calendar, CalendarPlus, RefreshCw, ClipboardList, Pencil, RotateCcw, Plus, Trash2, X, CalendarCog, ArrowRightLeft, BookOpen } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useNavigationStore } from '../../../store/navigationStore';
import { ConfirmationModal } from '../../../components/modals/ConfirmationModal';
import { DailyWeightInput } from './DailyWeightInput';
import { StreakCounter } from './StreakCounter';
import { SessionTabs } from './SessionTabs';
import { AddSessionModal } from './AddSessionModal';
import { EnergyBalanceCard } from '../../../components/nutrition/EnergyBalanceCard';
import { useNutritionTargets } from '../../health-profile/hooks/useNutritionTargets';
import { useTodayNutrition } from '../../../hooks/useTodayNutrition';
import type { SelectedExercise, TrainingPlanDay } from '../types';
import { DAY_LABELS } from '../constants';
import { safeJsonParse } from '../utils/safeJsonParse';
import { translateWorkoutType } from '../utils/translateWorkoutType';

const DAY_FULL_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'] as const;

interface TrainingPlanViewProps {
  onGeneratePlan: () => void;
  onCreateManualPlan?: () => void;
  planStrategy?: 'auto' | 'manual' | null;
  isGenerating?: boolean;
}

function parseExercises(exercises?: string): SelectedExercise[] {
  if (!exercises) return [];
  return safeJsonParse<SelectedExercise[]>(exercises, []);
}

function estimateDuration(exercises: SelectedExercise[]): number {
  if (exercises.length === 0) return 0;
  const WARM_UP_MIN = 5;
  const SET_DURATION_SEC = 40;
  const SETUP_SEC = 30;
  const totalSeconds = exercises.reduce(
    (sum, ex) => sum + ex.sets * (SET_DURATION_SEC + ex.restSeconds) + SETUP_SEC,
    0,
  );
  return Math.round(totalSeconds / 60) + WARM_UP_MIN;
}

function getTodayDow(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function getTomorrowDow(todayDow: number): number {
  return todayDow === 7 ? 1 : todayDow + 1;
}

function isPlanExpired(endDate?: string): boolean {
  if (!endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return today > end;
}

function TrainingPlanViewInner({
  onGeneratePlan,
  onCreateManualPlan,
  planStrategy,
  isGenerating = false,
}: TrainingPlanViewProps): React.JSX.Element {
  const { t } = useTranslation();
  const { trainingPlans, trainingPlanDays, workouts, workoutSets } = useFitnessStore(
    useShallow((s) => ({
      trainingPlans: s.trainingPlans,
      trainingPlanDays: s.trainingPlanDays,
      workouts: s.workouts,
      workoutSets: s.workoutSets,
    })),
  );
  const pushPage = useNavigationStore((s) => s.pushPage);
  const { targetCalories, targetProtein } = useNutritionTargets();
  const { eaten, protein } = useTodayNutrition();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeSessionIds, setActiveSessionIds] = useState<Record<number, string>>({});
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [addSessionDow, setAddSessionDow] = useState<number>(0);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [dayContextMenu, setDayContextMenu] = useState<{ dayNum: number; x: number; y: number } | null>(null);
  const [showConvertToRestConfirm, setShowConvertToRestConfirm] = useState<number | null>(null);
  const [coachingDismissed, setCoachingDismissed] = useState(() => {
    try {
      return localStorage.getItem('planCoachingDismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const todayCaloriesOut = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayWorkoutIds = new Set(
      workouts.filter((w) => w.date === todayStr).map((w) => w.id),
    );
    if (todayWorkoutIds.size === 0) return 0;
    const cardioCalories = workoutSets
      .filter((s) => todayWorkoutIds.has(s.workoutId) && s.estimatedCalories)
      .reduce((sum, s) => sum + (s.estimatedCalories ?? 0), 0);
    const strengthSets = workoutSets.filter(
      (s) => todayWorkoutIds.has(s.workoutId) && !s.estimatedCalories && s.weightKg > 0,
    );
    const strengthCalories = strengthSets.length * 8;
    return Math.round(cardioCalories + strengthCalories);
  }, [workouts, workoutSets]);

  const activePlan = useMemo(
    () => trainingPlans.find((p) => p.status === 'active'),
    [trainingPlans],
  );

  const planExpired = useMemo(
    () => (activePlan ? isPlanExpired(activePlan.endDate) : false),
    [activePlan],
  );

  const planDays = useMemo(
    () =>
      activePlan
        ? trainingPlanDays.filter((d) => d.planId === activePlan.id)
        : [],
    [activePlan, trainingPlanDays],
  );

  const daySessionsMap = useMemo(() => {
    const map = new Map<number, TrainingPlanDay[]>();
    for (const day of planDays) {
      const existing = map.get(day.dayOfWeek) ?? [];
      existing.push(day);
      map.set(day.dayOfWeek, existing.sort((a, b) => (a.sessionOrder ?? 1) - (b.sessionOrder ?? 1)));
    }
    return map;
  }, [planDays]);

  const todayDow = getTodayDow();
  const viewedDay = selectedDay ?? todayDow;
  const isViewingToday = viewedDay === todayDow;

  const viewedDaySessions = useMemo(
    () => daySessionsMap.get(viewedDay) ?? [],
    [daySessionsMap, viewedDay],
  );

  const viewedPlanDay = useMemo(() => {
    if (viewedDaySessions.length === 0) return undefined;
    const activeId = activeSessionIds[viewedDay];
    if (activeId) {
      return viewedDaySessions.find((s) => s.id === activeId) ?? viewedDaySessions[0];
    }
    return viewedDaySessions[0];
  }, [viewedDaySessions, activeSessionIds, viewedDay]);

  const viewedExercises = useMemo(
    () => parseExercises(viewedPlanDay?.exercises),
    [viewedPlanDay],
  );

  const estimatedMinutes = useMemo(
    () => estimateDuration(viewedExercises),
    [viewedExercises],
  );

  const tomorrowDow = getTomorrowDow(todayDow);

  const tomorrowPlanDay = useMemo(
    () => planDays.find((d) => d.dayOfWeek === tomorrowDow),
    [planDays, tomorrowDow],
  );

  const tomorrowExercises = useMemo(
    () => parseExercises(tomorrowPlanDay?.exercises),
    [tomorrowPlanDay],
  );

  const handleStartWorkout = useCallback(
    (planDay: TrainingPlanDay) => {
      pushPage({
        id: 'workout-logger',
        component: 'WorkoutLogger',
        props: { planDay },
      });
    },
    [pushPage],
  );

  const handleLogCardio = useCallback(() => {
    pushPage({
      id: 'cardio-logger',
      component: 'CardioLogger',
      props: {},
    });
  }, [pushPage]);

  const handleDaySelect = useCallback((dayNum: number) => {
    setSelectedDay((prev) => (prev === dayNum ? null : dayNum));
  }, []);

  const handleDayContextMenu = useCallback((e: React.MouseEvent, dayNum: number) => {
    e.preventDefault();
    setDayContextMenu({ dayNum, x: e.clientX, y: e.clientY });
  }, []);

  const handleAddWorkoutToDay = useCallback((dayNum: number) => {
    setDayContextMenu(null);
    setAddSessionDow(dayNum);
    setShowAddSessionModal(true);
  }, []);

  const handleConvertToRest = useCallback((dayNum: number) => {
    setDayContextMenu(null);
    setShowConvertToRestConfirm(dayNum);
  }, []);

  const confirmConvertToRest = useCallback((dayNum: number) => {
    const sessions = daySessionsMap.get(dayNum) ?? [];
    for (const session of sessions) {
      useFitnessStore.getState().removePlanDaySession(session.id);
    }
    setShowConvertToRestConfirm(null);
  }, [daySessionsMap]);

  const handleRegeneratePlan = useCallback(() => {
    setShowRegenerateConfirm(false);
    onGeneratePlan();
  }, [onGeneratePlan]);

  const handleDismissCoaching = useCallback(() => {
    setCoachingDismissed(true);
    try {
      localStorage.setItem('planCoachingDismissed', 'true');
    } catch { /* ignore */ }
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionIds((prev) => ({ ...prev, [viewedDay]: id }));
  }, [viewedDay]);

  const handleOpenAddSession = useCallback(() => {
    setAddSessionDow(viewedDay);
    setShowAddSessionModal(true);
  }, [viewedDay]);

  useEffect(() => {
    if (!dayContextMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setDayContextMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dayContextMenu]);

  useEffect(() => {
    if (!dayContextMenu) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDayContextMenu(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dayContextMenu]);

  useEffect(() => {
    if (dayContextMenu && contextMenuRef.current) {
      contextMenuRef.current.focus();
    }
  }, [dayContextMenu]);

  if (activePlan && planExpired) {
    return (
      <div
        data-testid="training-plan-view"
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div
          data-testid="plan-expired-cta"
          className="flex flex-col items-center gap-4"
        >
          <RefreshCw className="h-12 w-12 text-amber-400 dark:text-amber-500" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t('fitness.plan.planExpired')}
          </h3>
          <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
            {t('fitness.plan.planExpiredMessage')}
          </p>
          <button
            data-testid="create-new-cycle-btn"
            type="button"
            onClick={onGeneratePlan}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-[colors,transform] hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('fitness.plan.createNewCycle')}
          </button>
        </div>
      </div>
    );
  }

  if (!activePlan) {
    if (planStrategy === 'manual' && onCreateManualPlan) {
      return (
        <div
          data-testid="training-plan-view"
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div
            data-testid="manual-plan-cta"
            className="flex flex-col items-center gap-4"
          >
            <CalendarPlus className="h-12 w-12 text-emerald-400 dark:text-emerald-500" aria-hidden="true" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {t('fitness.plan.manualEmpty')}
            </h3>
            <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
              {t('fitness.plan.manualEmptyDesc')}
            </p>
            <button
              data-testid="create-manual-plan-btn"
              type="button"
              onClick={onCreateManualPlan}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-[colors,transform] hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              {t('fitness.plan.createFirstWorkout')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        data-testid="training-plan-view"
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div
          data-testid="no-plan-cta"
          className="flex flex-col items-center gap-4"
        >
          <Dumbbell className="h-12 w-12 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <p className="text-slate-500 dark:text-slate-400">
            {t('fitness.plan.noPlan')}
          </p>
          <button
            data-testid="create-plan-btn"
            type="button"
            onClick={onGeneratePlan}
            disabled={isGenerating}
            className="flex min-h-[44px] items-center gap-1 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-[colors,transform] hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none active:scale-95 motion-reduce:transform-none disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t('fitness.plan.generating')}
              </>
            ) : (
              <>
                {t('fitness.plan.createPlan')}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="training-plan-view" className="flex flex-col gap-4">
      <StreakCounter />

      <EnergyBalanceCard
        caloriesIn={eaten}
        caloriesOut={todayCaloriesOut}
        targetCalories={targetCalories}
        proteinCurrent={protein}
        proteinTarget={targetProtein}
        isCollapsible
      />

      <div data-testid="calendar-strip" className="flex gap-1.5">
        {Array.from({ length: 7 }, (_, i) => {
          const dayNum = i + 1;
          const daySessions = daySessionsMap.get(dayNum) ?? [];
          const planDay = daySessions[0];
          const isToday = dayNum === todayDow;
          const isSelected = dayNum === viewedDay && !isToday;
          const isCardio =
            planDay?.workoutType.toLowerCase().includes('cardio') ?? false;

          let colorClass =
            'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
          if (planDay) {
            colorClass = isCardio
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
          }

          const ringClass = isToday
            ? 'ring-2 ring-emerald-500'
            : isSelected
              ? 'ring-2 ring-slate-400'
              : '';

          return (
            <button
              key={dayNum}
              data-testid={`day-pill-${dayNum}`}
              type="button"
              onClick={() => handleDaySelect(dayNum)}
              onContextMenu={(e) => handleDayContextMenu(e, dayNum)}
              className={`flex min-h-[44px] flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${colorClass} ${ringClass}`}
              aria-current={isToday ? 'date' : undefined}
              aria-label={DAY_FULL_LABELS[i]}
            >
              <span>{DAY_LABELS[i]}</span>
            </button>
          );
        })}
      </div>

      {/* Plan action buttons */}
      <div data-testid="plan-action-bar" className="flex gap-2">
        <button
          data-testid="action-edit-schedule"
          type="button"
          onClick={() => pushPage({
            id: 'plan-schedule-editor',
            component: 'PlanScheduleEditor',
            props: { planId: activePlan.id },
          })}
          aria-label={t('fitness.planActions.editSchedule')}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          style={{ touchAction: 'manipulation' }}
        >
          <CalendarCog className="h-4 w-4" aria-hidden="true" />
          {t('fitness.planActions.editSchedule')}
        </button>
        <button
          data-testid="action-change-split"
          type="button"
          onClick={() => pushPage({
            id: 'split-changer',
            component: 'SplitChanger',
            props: { planId: activePlan.id, currentSplit: activePlan.splitType },
          })}
          aria-label={t('fitness.planActions.changeSplit')}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          style={{ touchAction: 'manipulation' }}
        >
          <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
          {t('fitness.planActions.changeSplit')}
        </button>
        <button
          data-testid="action-templates"
          type="button"
          onClick={() => pushPage({
            id: 'plan-template-gallery',
            component: 'PlanTemplateGallery',
            props: { planId: activePlan.id },
          })}
          aria-label={t('fitness.planActions.templates')}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          style={{ touchAction: 'manipulation' }}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {t('fitness.planActions.templates')}
        </button>
      </div>

      {dayContextMenu && (
        <div
          ref={contextMenuRef}
          data-testid="day-context-menu"
          role="menu"
          tabIndex={-1}
          aria-label={t('fitness.plan.dayContextMenu')}
          className="fixed z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
          style={{
            left: Math.min(dayContextMenu.x, window.innerWidth - 200),
            top: Math.min(dayContextMenu.y, window.innerHeight - 100),
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDayContextMenu(null);
          }}
        >
          {(daySessionsMap.get(dayContextMenu.dayNum) ?? []).length > 0 ? (
            <button
              data-testid="ctx-convert-rest"
              type="button"
              role="menuitem"
              onClick={() => handleConvertToRest(dayContextMenu.dayNum)}
              className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-rose-400 dark:hover:bg-slate-700"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('fitness.plan.convertToRest')}
            </button>
          ) : (
            <button
              data-testid="ctx-add-workout"
              type="button"
              role="menuitem"
              onClick={() => handleAddWorkoutToDay(dayContextMenu.dayNum)}
              className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-sm text-emerald-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-emerald-400 dark:hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('fitness.plan.addWorkout')}
            </button>
          )}
        </div>
      )}

      {!coachingDismissed && (
        <div
          data-testid="plan-coaching-hint"
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20"
        >
          <span className="flex-1 text-sm text-emerald-700 dark:text-emerald-300">
            {t('fitness.plan.coachingHint')}
          </span>
          <button
            type="button"
            onClick={handleDismissCoaching}
            aria-label={t('common.dismiss')}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-emerald-400 dark:hover:bg-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        data-testid="regenerate-plan-btn"
        type="button"
        onClick={() => setShowRegenerateConfirm(true)}
        disabled={isGenerating}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
      >
        <RefreshCw className={`h-4 w-4${isGenerating ? ' animate-spin' : ''}`} aria-hidden="true" />
        {t('fitness.plan.regenerate')}
      </button>

      {viewedPlanDay ? (
        <div
          data-testid="today-workout-card"
          className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
        >
          {viewedDaySessions.length >= 1 && (
            <SessionTabs
              sessions={viewedDaySessions}
              activeSessionId={activeSessionIds[viewedDay] ?? viewedDaySessions[0].id}
              completedSessionIds={[]}
              onSelectSession={handleSelectSession}
              onAddSession={handleOpenAddSession}
              onDeleteSession={(dayId) => useFitnessStore.getState().removePlanDaySession(dayId)}
            />
          )}

          <div
            data-testid="workout-card-header"
            className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {isViewingToday
              ? t('fitness.plan.todayWorkout')
              : DAY_LABELS[viewedDay - 1]}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {translateWorkoutType(t, viewedPlanDay.workoutType)}
              </h3>
              {viewedPlanDay.originalExercises != null && viewedPlanDay.exercises !== viewedPlanDay.originalExercises && (
                <span
                  data-testid="modified-badge"
                  className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  {t('fitness.plan.modified')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {viewedPlanDay.originalExercises != null && viewedPlanDay.exercises !== viewedPlanDay.originalExercises && (
                <button
                  data-testid="restore-original-btn"
                  type="button"
                  onClick={() => useFitnessStore.getState().restorePlanDayOriginal(viewedPlanDay.id)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full p-2.5 text-xs text-emerald-600 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-emerald-400 dark:hover:bg-slate-700"
                  aria-label={t('fitness.plan.restore')}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                data-testid="edit-exercises-btn"
                type="button"
                aria-label={t('fitness.plan.editExercises')}
                onClick={() => pushPage({
                  id: 'plan-day-editor',
                  component: 'PlanDayEditor',
                  props: { planDay: viewedPlanDay },
                })}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:hover:bg-slate-700"
              >
                <Pencil className="h-4 w-4 text-slate-500" aria-hidden="true" />
              </button>
            </div>
          </div>

          {viewedPlanDay.muscleGroups && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {(viewedPlanDay.muscleGroups.startsWith('[')
                ? safeJsonParse<string[]>(viewedPlanDay.muscleGroups, [])
                : viewedPlanDay.muscleGroups.split(',').map((g) => g.trim()).filter(Boolean)
              )
                .map((g) => t(`fitness.onboarding.muscle_${g}`, g))
                .join(', ')}
            </p>
          )}
          <div
            data-testid="workout-stats"
            className="mt-2 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
          >
            <span>
              {viewedExercises.length} {t('fitness.plan.exercises')}
            </span>
            <span>
              ~{estimatedMinutes} {t('fitness.plan.minutes')}
            </span>
          </div>

          {viewedExercises.length > 0 && (() => {
            const COLLAPSE_THRESHOLD = 3;
            const shouldCollapse = viewedExercises.length > COLLAPSE_THRESHOLD;
            const displayedExercises = shouldCollapse && !exercisesExpanded
              ? viewedExercises.slice(0, COLLAPSE_THRESHOLD)
              : viewedExercises;
            const hiddenCount = viewedExercises.length - COLLAPSE_THRESHOLD;

            return (
              <>
                <ul data-testid="exercise-list" className="mt-3 space-y-1.5">
                  {displayedExercises.map((ex) => (
                    <li
                      key={ex.exercise.id}
                      className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300"
                    >
                      <span>{ex.exercise.nameVi}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {ex.sets} {t('fitness.plan.setsLabel')} × {ex.repsMin}-{ex.repsMax} {t('fitness.plan.repsLabel')}
                      </span>
                    </li>
                  ))}
                </ul>
                {shouldCollapse && (
                  <button
                    type="button"
                    data-testid="exercise-collapse-toggle"
                    onClick={() => setExercisesExpanded(prev => !prev)}
                    className="mt-1.5 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-emerald-400 dark:hover:text-emerald-300"
                    aria-label={exercisesExpanded ? t('fitness.plan.showLess') : t('fitness.plan.moreExercises', { remaining: hiddenCount })}
                  >
                    {exercisesExpanded
                      ? t('fitness.plan.showLess')
                      : t('fitness.plan.moreExercises', { remaining: hiddenCount })}
                  </button>
                )}
              </>
            );
          })()}

          {isViewingToday && (
            <button
              data-testid="start-workout-btn"
              type="button"
              onClick={() => handleStartWorkout(viewedPlanDay)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-lg font-bold text-white transition-[colors,transform] hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              {t('fitness.plan.startWorkout')}
            </button>
          )}

          {/* Day actions - visible alternative to context menu */}
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
            <button
              data-testid="day-convert-rest-btn"
              type="button"
              onClick={() => handleConvertToRest(viewedDay)}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              {t('fitness.plan.convertToRest')}
            </button>
          </div>
        </div>
      ) : (
        <div
          data-testid="rest-day-card"
          className="rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 p-5 text-white"
        >
          <div className="mb-3 flex items-center gap-2">
            <Moon className="h-5 w-5" aria-hidden="true" />
            <h3 className="text-lg font-bold">{t('fitness.plan.restDay')}</h3>
          </div>
          <ul className="space-y-2 text-sm text-white/90">
            <li>{t('fitness.plan.restDayTip1')}</li>
            <li>{t('fitness.plan.restDayTip2')}</li>
            <li>{t('fitness.plan.restDayTip3')}</li>
          </ul>

          {/* Rest day action - visible alternative to context menu */}
          <button
            data-testid="rest-add-workout-btn"
            type="button"
            onClick={() => handleAddWorkoutToDay(viewedDay)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('fitness.plan.convertToWorkout')}
          </button>

          {isViewingToday && tomorrowPlanDay && (
            <p
              data-testid="tomorrow-preview"
              className="mt-3 text-sm text-white/80"
            >
              <ClipboardList className="size-4 inline-block" aria-hidden="true" /> {t('fitness.plan.tomorrow')}: {translateWorkoutType(t, tomorrowPlanDay.workoutType)} —{' '}
              {tomorrowExercises.length} {t('fitness.plan.exercises')}
            </p>
          )}

          {isViewingToday && (
            <div data-testid="quick-actions" className="mt-3 flex gap-2">
              <button
                data-testid="quick-log-weight"
                type="button"
                onClick={() => {
                  const el = document.querySelector('[data-testid="daily-weight-input"]');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="min-h-[44px] rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                {t('fitness.plan.logWeight')}
              </button>
              <button
                data-testid="quick-log-cardio"
                type="button"
                onClick={handleLogCardio}
                className="min-h-[44px] rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                {t('fitness.plan.logLightCardio')}
              </button>
            </div>
          )}
        </div>
      )}

      <DailyWeightInput />

      <AddSessionModal
        isOpen={showAddSessionModal}
        onClose={() => setShowAddSessionModal(false)}
        onSelectStrength={(groups) => {
          const plan = useFitnessStore.getState().getActivePlan();
          if (plan) {
            const existingSessions = daySessionsMap.get(addSessionDow) ?? [];
            useFitnessStore.getState().addPlanDaySession(plan.id, addSessionDow, {
              planId: plan.id,
              dayOfWeek: addSessionDow,
              sessionOrder: existingSessions.length + 1,
              workoutType: 'Strength',
              muscleGroups: groups.join(','),
              exercises: '[]',
              originalExercises: '[]',
              isUserAssigned: true,
              originalDayOfWeek: addSessionDow,
            });
          }
          setShowAddSessionModal(false);
        }}
        onSelectCardio={() => {
          const plan = useFitnessStore.getState().getActivePlan();
          if (plan) {
            const existingSessions = daySessionsMap.get(addSessionDow) ?? [];
            useFitnessStore.getState().addPlanDaySession(plan.id, addSessionDow, {
              planId: plan.id,
              dayOfWeek: addSessionDow,
              sessionOrder: existingSessions.length + 1,
              workoutType: 'Cardio',
              muscleGroups: '',
              exercises: '[]',
              originalExercises: '[]',
              isUserAssigned: true,
              originalDayOfWeek: addSessionDow,
            });
          }
          setShowAddSessionModal(false);
        }}
        onSelectFreestyle={() => {
          pushPage({
            id: 'workout-logger',
            component: 'WorkoutLogger',
            props: {},
          });
          setShowAddSessionModal(false);
        }}
        currentSessionCount={(daySessionsMap.get(addSessionDow) ?? []).length}
      />

      <ConfirmationModal
        isOpen={showRegenerateConfirm}
        variant="warning"
        icon={<RefreshCw className="h-8 w-8" />}
        title={t('fitness.plan.regenerate')}
        message={t('fitness.plan.regenerateConfirm')}
        confirmLabel={t('fitness.plan.regenerate')}
        onConfirm={handleRegeneratePlan}
        onCancel={() => setShowRegenerateConfirm(false)}
      />

      <ConfirmationModal
        isOpen={showConvertToRestConfirm !== null}
        variant="danger"
        title={t('fitness.plan.convertToRest')}
        message={t('fitness.plan.convertToRestConfirm')}
        confirmLabel={t('fitness.plan.convertToRest')}
        onConfirm={() => {
          if (showConvertToRestConfirm !== null) {
            confirmConvertToRest(showConvertToRestConfirm);
          }
        }}
        onCancel={() => setShowConvertToRestConfirm(null)}
      />
    </div>
  );
}

export const TrainingPlanView = React.memo(TrainingPlanViewInner);
TrainingPlanView.displayName = 'TrainingPlanView';

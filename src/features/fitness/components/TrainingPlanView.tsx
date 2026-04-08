import {
  ArrowRightLeft,
  BookOpen,
  Calendar,
  CalendarCog,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Moon,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { ConfirmationModal } from '../../../components/modals/ConfirmationModal';
import { EnergyBalanceCard } from '../../../components/nutrition/EnergyBalanceCard';
import { useTodayCaloriesOut } from '../../../hooks/useTodayCaloriesOut';
import { useTodayNutrition } from '../../../hooks/useTodayNutrition';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useNavigationStore } from '../../../store/navigationStore';
import { useNutritionTargets } from '../../health-profile/hooks/useNutritionTargets';
import { DAY_LABELS } from '../constants';
import type { SelectedExercise, TrainingPlanDay } from '../types';
import { safeParseJsonArray } from '../types';
import { estimateDuration } from '../utils/durationEstimator';
import { safeJsonParse } from '../utils/safeJsonParse';
import { translateWorkoutType } from '../utils/translateWorkoutType';
import { AddSessionModal } from './AddSessionModal';
import { DailyWeightInput } from './DailyWeightInput';
import { SessionTabs } from './SessionTabs';
import { StreakCounter } from './StreakCounter';

const DAY_FULL_LABEL_KEYS = [
  'fitness.dayFull.0',
  'fitness.dayFull.1',
  'fitness.dayFull.2',
  'fitness.dayFull.3',
  'fitness.dayFull.4',
  'fitness.dayFull.5',
  'fitness.dayFull.6',
] as const;

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

function useContextMenuDismiss(
  contextMenu: { dayNum: number; x: number; y: number } | null,
  ref: React.RefObject<HTMLDivElement | null>,
  setContextMenu: React.Dispatch<React.SetStateAction<{ dayNum: number; x: number; y: number } | null>>,
): void {
  useEffect(() => {
    if (!contextMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu, ref, setContextMenu]);

  useEffect(() => {
    if (!contextMenu) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu, setContextMenu]);

  useEffect(() => {
    if (contextMenu && ref.current) {
      ref.current.focus();
    }
  }, [contextMenu, ref]);
}

function WorkoutStatsContent({
  workoutType,
  exerciseCount,
  minutes,
}: Readonly<{
  workoutType: string;
  exerciseCount: number;
  minutes: number;
}>): React.JSX.Element {
  const { t } = useTranslation();
  const normalizedType = workoutType.toLowerCase();

  if (normalizedType.includes('cardio')) {
    return <span className="text-muted-foreground">{t('fitness.plan.cardioDay')}</span>;
  }
  if (normalizedType === 'rest') {
    return <span className="text-muted-foreground">{t('fitness.plan.restDay')}</span>;
  }
  return (
    <>
      <span>
        {exerciseCount} {t('fitness.plan.exercises')}
      </span>
      <span>
        ~{minutes} {t('fitness.plan.minutes')}
      </span>
    </>
  );
}

function TrainingPlanViewInner({
  onGeneratePlan,
  onCreateManualPlan,
  planStrategy,
  isGenerating = false,
}: Readonly<TrainingPlanViewProps>): React.JSX.Element {
  const { t } = useTranslation();
  const { trainingPlans, trainingPlanDays } = useFitnessStore(
    useShallow(s => ({
      trainingPlans: s.trainingPlans,
      trainingPlanDays: s.trainingPlanDays,
    })),
  );
  const pushPage = useNavigationStore(s => s.pushPage);
  const { targetCalories, targetProtein } = useNutritionTargets();
  const { eaten: rawEaten, protein: rawProtein } = useTodayNutrition();
  const eaten = rawEaten ?? 0;
  const protein = rawProtein ?? 0;

  const [expandedDays, setExpandedDays] = useState<Set<number>>(() => new Set([getTodayDow()]));
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
  const [exercisesExpandedMap, setExercisesExpandedMap] = useState<Record<string, boolean>>({});
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const todayCaloriesOut = useTodayCaloriesOut();

  const activePlan = useMemo(() => trainingPlans.find(p => p.status === 'active'), [trainingPlans]);

  const planExpired = useMemo(() => (activePlan ? isPlanExpired(activePlan.endDate) : false), [activePlan]);

  const planDays = useMemo(
    () => (activePlan ? trainingPlanDays.filter(d => d.planId === activePlan.id) : []),
    [activePlan, trainingPlanDays],
  );

  const daySessionsMap = useMemo(() => {
    const map = new Map<number, TrainingPlanDay[]>();
    for (const day of planDays) {
      const existing = map.get(day.dayOfWeek) ?? [];
      existing.push(day);
      map.set(
        day.dayOfWeek,
        [...existing].sort((a, b) => (a.sessionOrder ?? 1) - (b.sessionOrder ?? 1)),
      );
    }
    return map;
  }, [planDays]);

  const todayDow = getTodayDow();

  const getActivePlanDay = (dayNum: number) => {
    const sessions = daySessionsMap.get(dayNum) ?? [];
    if (sessions.length === 0) return undefined;
    const activeId = activeSessionIds[dayNum];
    if (activeId) return sessions.find(s => s.id === activeId) ?? sessions[0];
    return sessions[0];
  };

  const tomorrowDow = getTomorrowDow(todayDow);

  const tomorrowPlanDay = useMemo(() => planDays.find(d => d.dayOfWeek === tomorrowDow), [planDays, tomorrowDow]);

  const tomorrowExercises = useMemo(() => parseExercises(tomorrowPlanDay?.exercises), [tomorrowPlanDay]);

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

  const handleDaySelect = useCallback(
    (dayNum: number) => {
      if (dayNum === todayDow) return;
      setExpandedDays(prev => {
        const next = new Set(prev);
        if (next.has(dayNum)) {
          next.delete(dayNum);
        } else {
          next.add(dayNum);
        }
        return next;
      });
    },
    [todayDow],
  );

  const handleDayContextMenu = useCallback((e: React.MouseEvent, dayNum: number) => {
    e.preventDefault();
    setDayContextMenu({ dayNum, x: e.clientX, y: e.clientY });
  }, []);

  const handleAddWorkoutToDay = useCallback((dayNum: number) => {
    setDayContextMenu(null);
    setAddSessionDow(dayNum);
    setShowAddSessionModal(true);
  }, []);

  const toggleExerciseExpand = (key: string, current: boolean) => {
    setExercisesExpandedMap(prev => ({ ...prev, [key]: !current }));
  };

  const handleConvertToRest = useCallback((dayNum: number) => {
    setDayContextMenu(null);
    setShowConvertToRestConfirm(dayNum);
  }, []);

  const confirmConvertToRest = useCallback(
    (dayNum: number) => {
      const sessions = daySessionsMap.get(dayNum) ?? [];
      for (const session of sessions) {
        useFitnessStore.getState().removePlanDaySession(session.id);
      }
      setShowConvertToRestConfirm(null);
    },
    [daySessionsMap],
  );

  const handleRegeneratePlan = useCallback(() => {
    setShowRegenerateConfirm(false);
    onGeneratePlan();
  }, [onGeneratePlan]);

  const handleDismissCoaching = useCallback(() => {
    setCoachingDismissed(true);
    try {
      localStorage.setItem('planCoachingDismissed', 'true');
    } catch {
      /* ignore */
    }
  }, []);

  const handleSelectSession = useCallback((dayNum: number, id: string) => {
    setActiveSessionIds(prev => ({ ...prev, [dayNum]: id }));
  }, []);

  const handleOpenAddSession = useCallback((dayNum: number) => {
    setAddSessionDow(dayNum);
    setShowAddSessionModal(true);
  }, []);

  useContextMenuDismiss(dayContextMenu, contextMenuRef, setDayContextMenu);

  if (activePlan && planExpired) {
    return (
      <div data-testid="training-plan-view" className="flex flex-col items-center justify-center py-12 text-center">
        <div data-testid="plan-expired-cta" className="flex flex-col items-center gap-4">
          <RefreshCw className="text-warning h-12 w-12" aria-hidden="true" />
          <h3 className="text-foreground text-lg font-semibold">{t('fitness.plan.planExpired')}</h3>
          <p className="text-muted-foreground max-w-xs text-sm">{t('fitness.plan.planExpiredMessage')}</p>
          <button
            data-testid="create-new-cycle-btn"
            type="button"
            onClick={onGeneratePlan}
            className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
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
        <div data-testid="training-plan-view" className="flex flex-col items-center justify-center py-12 text-center">
          <div data-testid="manual-plan-cta" className="flex flex-col items-center gap-4">
            <CalendarPlus className="dark:text-primary text-primary h-12 w-12" aria-hidden="true" />
            <h3 className="text-foreground text-lg font-semibold">{t('fitness.plan.manualEmpty')}</h3>
            <p className="text-muted-foreground max-w-xs text-sm">{t('fitness.plan.manualEmptyDesc')}</p>
            <button
              data-testid="create-manual-plan-btn"
              type="button"
              onClick={onCreateManualPlan}
              className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring flex min-h-[44px] items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              {t('fitness.plan.createFirstWorkout')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div data-testid="training-plan-view" className="flex flex-col items-center justify-center py-12 text-center">
        <div data-testid="no-plan-cta" className="flex flex-col items-center gap-4">
          <Dumbbell className="text-muted-foreground h-12 w-12" aria-hidden="true" />
          <p className="text-muted-foreground">{t('fitness.plan.noPlan')}</p>
          <button
            data-testid="create-plan-btn"
            type="button"
            onClick={onGeneratePlan}
            disabled={isGenerating}
            className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring flex min-h-[44px] items-center gap-1 rounded-xl px-6 py-3 font-semibold transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-95 disabled:opacity-50 motion-reduce:transform-none"
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
          const isExpanded = expandedDays.has(dayNum);
          const isCardio = planDay?.workoutType.toLowerCase().includes('cardio') ?? false;

          let colorClass = 'bg-muted text-muted-foreground';
          if (planDay) {
            colorClass = isCardio ? 'bg-info/15 text-info' : 'bg-primary/10 text-primary-emphasis';
          }

          let ringClass: string;
          if (isToday) {
            ringClass = 'ring-2 ring-accent-highlight';
          } else if (isExpanded) {
            ringClass = 'ring-2 ring-ring';
          } else {
            ringClass = '';
          }

          return (
            <button
              key={dayNum}
              data-testid={`day-pill-${dayNum}`}
              type="button"
              onClick={() => handleDaySelect(dayNum)}
              onContextMenu={e => handleDayContextMenu(e, dayNum)}
              className={`focus-visible:ring-ring flex min-h-[44px] flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none ${colorClass} ${ringClass}`}
              aria-current={isToday ? 'date' : undefined}
              aria-label={t(DAY_FULL_LABEL_KEYS[i])}
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
          onClick={() =>
            pushPage({
              id: 'plan-schedule-editor',
              component: 'PlanScheduleEditor',
              props: { planId: activePlan.id },
            })
          }
          aria-label={t('fitness.planActions.editSchedule')}
          className="bg-card focus-visible:ring-ring border-border text-foreground-secondary hover:bg-accent flex min-h-[44px] flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <CalendarCog className="h-4 w-4" aria-hidden="true" />
          {t('fitness.planActions.editSchedule')}
        </button>
        <button
          data-testid="action-change-split"
          type="button"
          onClick={() =>
            pushPage({
              id: 'split-changer',
              component: 'SplitChanger',
              props: { planId: activePlan.id, currentSplit: activePlan.splitType },
            })
          }
          aria-label={t('fitness.planActions.changeSplit')}
          className="bg-card focus-visible:ring-ring border-border text-foreground-secondary hover:bg-accent flex min-h-[44px] flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
          {t('fitness.planActions.changeSplit')}
        </button>
        <button
          data-testid="action-templates"
          type="button"
          onClick={() =>
            pushPage({
              id: 'plan-template-gallery',
              component: 'PlanTemplateGallery',
              props: { planId: activePlan.id },
            })
          }
          aria-label={t('fitness.planActions.templates')}
          className="bg-card focus-visible:ring-ring border-border text-foreground-secondary hover:bg-accent flex min-h-[44px] flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
          className="bg-card border-border fixed z-50 min-w-[180px] rounded-xl border py-1 shadow-lg"
          style={{
            left: Math.min(dayContextMenu.x, window.innerWidth - 200),
            top: Math.min(dayContextMenu.y, window.innerHeight - 100),
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') setDayContextMenu(null);
          }}
        >
          {(daySessionsMap.get(dayContextMenu.dayNum) ?? []).length > 0 ? (
            <button
              data-testid="ctx-convert-rest"
              type="button"
              role="menuitem"
              onClick={() => handleConvertToRest(dayContextMenu.dayNum)}
              className="focus-visible:ring-ring hover:bg-accent text-rose flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
              className="text-primary focus-visible:ring-ring hover:bg-accent flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('fitness.plan.addWorkout')}
            </button>
          )}
        </div>
      )}

      {!coachingDismissed && (
        <output
          data-testid="plan-coaching-hint"
          className="bg-accent-subtle border-accent-highlight/20 block flex items-center gap-3 rounded-xl border p-3"
        >
          <span className="text-accent-emphasis flex-1 text-sm">{t('fitness.plan.coachingHint')}</span>
          <button
            type="button"
            onClick={handleDismissCoaching}
            aria-label={t('common.dismiss')}
            className="text-accent-emphasis focus-visible:ring-ring hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </output>
      )}

      <button
        data-testid="regenerate-plan-btn"
        type="button"
        onClick={() => setShowRegenerateConfirm(true)}
        disabled={isGenerating}
        className="bg-card focus-visible:ring-ring border-border text-foreground-secondary hover:bg-accent flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4${isGenerating ? 'animate-spin' : ''}`} aria-hidden="true" />
        {t('fitness.plan.regenerate')}
      </button>

      {/* --- 7-Day Accordion --- */}
      <div data-testid="day-accordion" className="space-y-2">
        {Array.from({ length: 7 }, (_, i) => {
          const dayNum = i + 1;
          const isToday = dayNum === todayDow;
          const isExpanded = expandedDays.has(dayNum);
          const daySessions = daySessionsMap.get(dayNum) ?? [];
          const planDay = getActivePlanDay(dayNum);
          const isRestDay = !planDay;
          const dayExercises = planDay ? parseExercises(planDay.exercises) : [];
          const dayMinutes = estimateDuration(dayExercises);
          const exerciseKey = planDay?.id ?? `rest-${dayNum}`;
          const exExpanded = exercisesExpandedMap[exerciseKey] ?? false;

          if (isToday && planDay) {
            // --- Today workout: always expanded ---
            return (
              <div key={dayNum} data-testid="today-workout-card">
                <div className="bg-card border-border border-l-accent-highlight rounded-2xl border border-l-4 p-4">
                  <button
                    data-testid={`day-accordion-toggle-${dayNum}`}
                    type="button"
                    disabled
                    className="text-foreground-secondary mb-1 flex min-h-[44px] w-full items-center gap-1.5 text-left text-xs font-medium tracking-wider uppercase"
                  >
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('fitness.plan.todayWorkout')}
                  </button>

                  {daySessions.length >= 1 && (
                    <SessionTabs
                      sessions={daySessions}
                      activeSessionId={activeSessionIds[dayNum] ?? daySessions[0].id}
                      completedSessionIds={[]}
                      onSelectSession={id => handleSelectSession(dayNum, id)}
                      onAddSession={() => handleOpenAddSession(dayNum)}
                      onDeleteSession={dayId => useFitnessStore.getState().removePlanDaySession(dayId)}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-foreground text-xl font-semibold">
                        {translateWorkoutType(t, planDay.workoutType)}
                      </h3>
                      {planDay.originalExercises != null && planDay.exercises !== planDay.originalExercises && (
                        <span
                          data-testid="modified-badge"
                          className="bg-warning/10 text-warning inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        >
                          {t('fitness.plan.modified')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {planDay.originalExercises != null && planDay.exercises !== planDay.originalExercises && (
                        <button
                          data-testid="restore-original-btn"
                          type="button"
                          onClick={() => useFitnessStore.getState().restorePlanDayOriginal(planDay.id)}
                          className="text-primary focus-visible:ring-ring hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full p-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          aria-label={t('fitness.plan.restore')}
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        data-testid="edit-exercises-btn"
                        type="button"
                        aria-label={t('fitness.plan.editExercises')}
                        onClick={() =>
                          pushPage({
                            id: 'plan-day-editor',
                            component: 'PlanDayEditor',
                            props: { planDay },
                          })
                        }
                        className="focus-visible:ring-ring hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <Pencil className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {planDay.muscleGroups && (
                    <p className="text-muted-foreground text-sm">
                      {safeParseJsonArray<string>(planDay.muscleGroups)
                        .map(g => t(`fitness.onboarding.muscle_${g}`, g))
                        .join(', ')}
                    </p>
                  )}
                  <div
                    data-testid="workout-stats"
                    className="text-foreground-secondary mt-2 flex items-center gap-3 text-sm"
                  >
                    <WorkoutStatsContent
                      workoutType={planDay.workoutType}
                      exerciseCount={dayExercises.length}
                      minutes={dayMinutes}
                    />
                  </div>

                  {dayExercises.length > 0 &&
                    (() => {
                      const COLLAPSE_THRESHOLD = 3;
                      const shouldCollapse = dayExercises.length > COLLAPSE_THRESHOLD;
                      const displayedExercises =
                        shouldCollapse && !exExpanded ? dayExercises.slice(0, COLLAPSE_THRESHOLD) : dayExercises;
                      const hiddenCount = dayExercises.length - COLLAPSE_THRESHOLD;

                      return (
                        <>
                          <ul data-testid="exercise-list" className="mt-3 space-y-1.5">
                            {displayedExercises.map(ex => (
                              <li
                                key={ex.exercise.id}
                                className="text-foreground-secondary flex min-w-0 items-center justify-between text-sm"
                              >
                                <span className="min-w-0 truncate">{ex.exercise.nameVi}</span>
                                <span className="text-muted-foreground shrink-0 text-xs">
                                  {ex.sets} {t('fitness.plan.setsLabel')} × {ex.repsMin}-{ex.repsMax}{' '}
                                  {t('fitness.plan.repsLabel')}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {shouldCollapse && (
                            <button
                              type="button"
                              data-testid="exercise-collapse-toggle"
                              onClick={() => toggleExerciseExpand(exerciseKey, exExpanded)}
                              className="text-primary focus-visible:ring-ring hover:text-primary-emphasis mt-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                              aria-label={
                                exExpanded
                                  ? t('fitness.plan.showLess')
                                  : t('fitness.plan.moreExercises', { remaining: hiddenCount })
                              }
                            >
                              {exExpanded
                                ? t('fitness.plan.showLess')
                                : t('fitness.plan.moreExercises', { remaining: hiddenCount })}
                            </button>
                          )}
                        </>
                      );
                    })()}

                  <button
                    data-testid="start-workout-btn"
                    type="button"
                    onClick={() => handleStartWorkout(planDay)}
                    className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-lg font-semibold transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
                  >
                    <Play className="h-5 w-5" aria-hidden="true" />
                    {t('fitness.plan.startWorkout')}
                  </button>

                  <div className="border-border-subtle mt-3 flex gap-2 border-t pt-3">
                    <button
                      data-testid="day-convert-rest-btn"
                      type="button"
                      onClick={() => handleConvertToRest(dayNum)}
                      className="focus-visible:ring-ring border-rose/20 bg-rose/10 text-rose hover:bg-rose/15 flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Moon className="text-info h-4 w-4" aria-hidden="true" />
                      {t('fitness.plan.convertToRest')}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (isToday && isRestDay) {
            // --- Today rest: always expanded ---
            return (
              <div key={dayNum}>
                <button
                  data-testid={`day-accordion-toggle-${dayNum}`}
                  type="button"
                  disabled
                  className="text-foreground-secondary mb-1 flex min-h-[44px] w-full items-center gap-1.5 text-left text-xs font-medium tracking-wider uppercase"
                >
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('fitness.plan.todayWorkout')}
                </button>
                <div
                  data-testid="rest-day-card"
                  className="from-muted to-muted/80 text-foreground rounded-2xl bg-gradient-to-br p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Moon className="h-5 w-5" aria-hidden="true" />
                    <h3 className="text-lg font-semibold">{t('fitness.plan.restDay')}</h3>
                  </div>
                  <ul className="text-primary-foreground/90 space-y-2 text-sm">
                    <li>{t('fitness.plan.restDayTip1')}</li>
                    <li>{t('fitness.plan.restDayTip2')}</li>
                    <li>{t('fitness.plan.restDayTip3')}</li>
                  </ul>

                  <button
                    data-testid="rest-add-workout-btn"
                    type="button"
                    onClick={() => handleAddWorkoutToDay(dayNum)}
                    className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground focus-visible:ring-primary-foreground/60 mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t('fitness.plan.convertToWorkout')}
                  </button>

                  {tomorrowPlanDay && (
                    <p data-testid="tomorrow-preview" className="text-primary-foreground/80 mt-3 text-sm">
                      <ClipboardList className="inline-block size-4" aria-hidden="true" /> {t('fitness.plan.tomorrow')}:{' '}
                      {translateWorkoutType(t, tomorrowPlanDay.workoutType)} — {tomorrowExercises.length}{' '}
                      {t('fitness.plan.exercises')}
                    </p>
                  )}

                  <div data-testid="quick-actions" className="mt-3 flex gap-2">
                    <button
                      data-testid="quick-log-weight"
                      type="button"
                      onClick={() => {
                        const el = document.querySelector('[data-testid="daily-weight-input"]');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground focus-visible:ring-primary-foreground/60 min-h-[44px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {t('fitness.plan.logWeight')}
                    </button>
                    <button
                      data-testid="quick-log-cardio"
                      type="button"
                      onClick={handleLogCardio}
                      className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground focus-visible:ring-primary-foreground/60 min-h-[44px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {t('fitness.plan.logLightCardio')}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // --- Non-today days ---
          if (!isExpanded) {
            // Collapsed compact row
            const muscleText = planDay?.muscleGroups
              ? safeParseJsonArray<string>(planDay.muscleGroups)
                  .map(g => t(`fitness.onboarding.muscle_${g}`, g))
                  .join(', ')
              : '';
            return (
              <div key={dayNum} data-testid={`day-row-${dayNum}`}>
                <button
                  data-testid={`day-accordion-toggle-${dayNum}`}
                  type="button"
                  onClick={() => handleDaySelect(dayNum)}
                  className="bg-card border-border flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
                >
                  <span className="text-foreground w-7 text-sm font-semibold">{DAY_LABELS[i]}</span>
                  <span className="text-foreground-secondary min-w-0 flex-1 truncate text-sm">
                    {isRestDay ? t('fitness.plan.restDay') : muscleText}
                  </span>
                  {!isRestDay && (
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {dayExercises.length} {t('fitness.plan.exercises')}
                    </span>
                  )}
                  <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            );
          }

          // Expanded non-today workout
          if (planDay) {
            return (
              <div key={dayNum} data-testid={`day-row-${dayNum}`}>
                <div className="bg-card border-border rounded-2xl border p-4">
                  <button
                    data-testid={`day-accordion-toggle-${dayNum}`}
                    type="button"
                    onClick={() => handleDaySelect(dayNum)}
                    className="text-muted-foreground mb-1 flex min-h-[44px] w-full items-center gap-1.5 text-left text-xs font-medium tracking-wider uppercase"
                  >
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    <span data-testid={`workout-card-header-${dayNum}`}>{DAY_LABELS[i]}</span>
                    <ChevronDown className="ml-auto h-4 w-4 rotate-180" aria-hidden="true" />
                  </button>

                  {daySessions.length >= 1 && (
                    <SessionTabs
                      sessions={daySessions}
                      activeSessionId={activeSessionIds[dayNum] ?? daySessions[0].id}
                      completedSessionIds={[]}
                      onSelectSession={id => handleSelectSession(dayNum, id)}
                      onAddSession={() => handleOpenAddSession(dayNum)}
                      onDeleteSession={dayId => useFitnessStore.getState().removePlanDaySession(dayId)}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="text-foreground text-xl font-semibold">
                      {translateWorkoutType(t, planDay.workoutType)}
                    </h3>
                    <button
                      type="button"
                      aria-label={t('fitness.plan.editExercises')}
                      onClick={() =>
                        pushPage({
                          id: 'plan-day-editor',
                          component: 'PlanDayEditor',
                          props: { planDay },
                        })
                      }
                      className="focus-visible:ring-ring hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Pencil className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  {planDay.muscleGroups && (
                    <p className="text-muted-foreground text-sm">
                      {safeParseJsonArray<string>(planDay.muscleGroups)
                        .map(g => t(`fitness.onboarding.muscle_${g}`, g))
                        .join(', ')}
                    </p>
                  )}
                  <div className="text-foreground-secondary mt-2 flex items-center gap-3 text-sm">
                    <WorkoutStatsContent
                      workoutType={planDay.workoutType}
                      exerciseCount={dayExercises.length}
                      minutes={dayMinutes}
                    />
                  </div>

                  {dayExercises.length > 0 &&
                    (() => {
                      const COLLAPSE_THRESHOLD = 3;
                      const shouldCollapse = dayExercises.length > COLLAPSE_THRESHOLD;
                      const displayedExercises =
                        shouldCollapse && !exExpanded ? dayExercises.slice(0, COLLAPSE_THRESHOLD) : dayExercises;
                      const hiddenCount = dayExercises.length - COLLAPSE_THRESHOLD;

                      return (
                        <>
                          <ul className="mt-3 space-y-1.5">
                            {displayedExercises.map(ex => (
                              <li
                                key={ex.exercise.id}
                                className="text-foreground-secondary flex min-w-0 items-center justify-between text-sm"
                              >
                                <span className="min-w-0 truncate">{ex.exercise.nameVi}</span>
                                <span className="text-muted-foreground shrink-0 text-xs">
                                  {ex.sets} {t('fitness.plan.setsLabel')} × {ex.repsMin}-{ex.repsMax}{' '}
                                  {t('fitness.plan.repsLabel')}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {shouldCollapse && (
                            <button
                              type="button"
                              onClick={() => toggleExerciseExpand(exerciseKey, exExpanded)}
                              className="text-primary focus-visible:ring-ring hover:text-primary-emphasis mt-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                              {exExpanded
                                ? t('fitness.plan.showLess')
                                : t('fitness.plan.moreExercises', { remaining: hiddenCount })}
                            </button>
                          )}
                        </>
                      );
                    })()}
                </div>
              </div>
            );
          }

          // Expanded non-today rest day
          return (
            <div key={dayNum} data-testid={`day-row-${dayNum}`}>
              <div className="from-muted to-muted/80 text-foreground rounded-2xl bg-gradient-to-br p-4">
                <button
                  data-testid={`day-accordion-toggle-${dayNum}`}
                  type="button"
                  onClick={() => handleDaySelect(dayNum)}
                  className="text-muted-foreground mb-1 flex min-h-[44px] w-full items-center gap-1.5 text-left text-xs font-medium tracking-wider uppercase"
                >
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{DAY_LABELS[i]}</span>
                  <ChevronDown className="ml-auto h-4 w-4 rotate-180" aria-hidden="true" />
                </button>
                <div className="mb-3 flex items-center gap-2">
                  <Moon className="h-5 w-5" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">{t('fitness.plan.restDay')}</h3>
                </div>
                <ul className="text-primary-foreground/90 space-y-2 text-sm">
                  <li>{t('fitness.plan.restDayTip1')}</li>
                  <li>{t('fitness.plan.restDayTip2')}</li>
                  <li>{t('fitness.plan.restDayTip3')}</li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleAddWorkoutToDay(dayNum)}
                  className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground focus-visible:ring-primary-foreground/60 mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('fitness.plan.convertToWorkout')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DailyWeightInput />

      <AddSessionModal
        isOpen={showAddSessionModal}
        onClose={() => setShowAddSessionModal(false)}
        onSelectStrength={groups => {
          const plan = useFitnessStore.getState().getActivePlan();
          if (plan) {
            const existingSessions = daySessionsMap.get(addSessionDow) ?? [];
            useFitnessStore.getState().addPlanDaySession(plan.id, addSessionDow, {
              planId: plan.id,
              dayOfWeek: addSessionDow,
              sessionOrder: existingSessions.length + 1,
              workoutType: 'Strength',
              muscleGroups: JSON.stringify(groups),
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
        icon={<RefreshCw className="h-6 w-6" />}
        title={t('fitness.plan.regenerate')}
        message={t('fitness.plan.regenerateConfirm')}
        confirmLabel={t('fitness.plan.confirmRegenerate')}
        onConfirm={handleRegeneratePlan}
        onCancel={() => setShowRegenerateConfirm(false)}
      />

      <ConfirmationModal
        isOpen={showConvertToRestConfirm !== null}
        variant="danger"
        title={t('fitness.plan.convertToRest')}
        message={t('fitness.plan.convertToRestConfirm')}
        confirmLabel={t('fitness.plan.confirmConvertToRest')}
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

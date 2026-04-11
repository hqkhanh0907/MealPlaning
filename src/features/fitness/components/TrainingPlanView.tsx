import { Calendar, ChevronDown, Moon, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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
import { estimateDuration } from '../utils/durationEstimator';
import { safeJsonParse } from '../utils/safeJsonParse';
import { AddSessionModal } from './AddSessionModal';
import { DailyWeightInput } from './DailyWeightInput';
import { PlanActionBar } from './PlanActionBar';
import { PlanDayAccordion } from './PlanDayAccordion';
import { PlanEmptyState } from './PlanEmptyState';
import { StreakCounter } from './StreakCounter';
import { TodayRestCard } from './TodayRestCard';
import { TodayWorkoutCard } from './TodayWorkoutCard';
import { WeekCalendarStrip } from './WeekCalendarStrip';

function parseExercises(exercises?: string): SelectedExercise[] {
  return exercises ? safeJsonParse<SelectedExercise[]>(exercises, []) : [];
}
function getTodayDow(): number {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}
function getTomorrowDow(today: number): number {
  return today === 7 ? 1 : today + 1;
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
  menu: { dayNum: number; x: number; y: number } | null,
  ref: React.RefObject<HTMLDivElement | null>,
  dismiss: () => void,
): void {
  useEffect(() => {
    if (!menu) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) dismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu, ref, dismiss]);
}

interface TrainingPlanViewProps {
  onGeneratePlan: () => void;
  onCreateManualPlan?: () => void;
  planStrategy?: 'auto' | 'manual' | null;
  isGenerating?: boolean;
}

function TrainingPlanViewInner({
  onGeneratePlan,
  onCreateManualPlan,
  planStrategy,
  isGenerating = false,
}: Readonly<TrainingPlanViewProps>): React.JSX.Element {
  const { t } = useTranslation();
  const { trainingPlans, trainingPlanDays } = useFitnessStore(
    useShallow(s => ({ trainingPlans: s.trainingPlans, trainingPlanDays: s.trainingPlanDays })),
  );
  const pushPage = useNavigationStore(s => s.pushPage);
  const { targetCalories, targetProtein } = useNutritionTargets();
  const { eaten: rawEaten, protein: rawProtein } = useTodayNutrition();
  const eaten = rawEaten ?? 0;
  const protein = rawProtein ?? 0;
  const todayCaloriesOut = useTodayCaloriesOut();

  const [expandedDays, setExpandedDays] = useState<Set<number>>(() => new Set([getTodayDow()]));
  const [selectedDay, setSelectedDay] = useState(getTodayDow);
  const [activeSessionIds, setActiveSessionIds] = useState<Record<number, string>>({});
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [addSessionDow, setAddSessionDow] = useState(0);
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

  const todayDow = getTodayDow();
  const activePlan = trainingPlans.find(p => p.status === 'active');
  const planExpired = activePlan ? isPlanExpired(activePlan.endDate) : false;
  const planDays = activePlan ? trainingPlanDays.filter(d => d.planId === activePlan.id) : [];

  const daySessionsMap = new Map<number, TrainingPlanDay[]>();
  for (const d of planDays) {
    const arr = daySessionsMap.get(d.dayOfWeek) ?? [];
    arr.push(d);
    daySessionsMap.set(d.dayOfWeek, arr);
  }
  for (const [, arr] of daySessionsMap) arr.sort((a, b) => (a.sessionOrder ?? 1) - (b.sessionOrder ?? 1));

  const getActivePlanDay = (dayNum: number) => {
    const sessions = daySessionsMap.get(dayNum) ?? [];
    return sessions.find(s => s.id === activeSessionIds[dayNum]) ?? sessions[0];
  };
  const tomorrowDow = getTomorrowDow(todayDow);
  const tomorrowPlanDay = planDays.find(d => d.dayOfWeek === tomorrowDow);
  const tomorrowExercises = parseExercises(tomorrowPlanDay?.exercises);

  const handleStartWorkout = (p: TrainingPlanDay) =>
    pushPage({ id: 'workout-logger', component: 'WorkoutLogger', props: { planDay: p } });
  const handleLogCardio = () => pushPage({ id: 'cardio-logger', component: 'CardioLogger', props: {} });
  const handleLogWeight = () =>
    document
      .querySelector('[data-testid="daily-weight-input"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const handleDaySelect = (dayNum: number) => {
    setSelectedDay(dayNum);
    if (dayNum === todayDow) return;
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNum)) next.delete(dayNum);
      else next.add(dayNum);
      return next;
    });
  };
  const handleAddWorkoutToDay = (d: number) => {
    setDayContextMenu(null);
    setAddSessionDow(d);
    setShowAddSessionModal(true);
  };
  const toggleExerciseExpand = (key: string, current: boolean) =>
    setExercisesExpandedMap(prev => ({ ...prev, [key]: !current }));
  const handleConvertToRest = (d: number) => {
    setDayContextMenu(null);
    setShowConvertToRestConfirm(d);
  };
  const confirmConvertToRest = (d: number) => {
    for (const s of daySessionsMap.get(d) ?? []) useFitnessStore.getState().removePlanDaySession(s.id);
    setShowConvertToRestConfirm(null);
  };
  const handleRegeneratePlan = () => {
    setShowRegenerateConfirm(false);
    onGeneratePlan();
  };
  const handleDismissCoaching = () => {
    setCoachingDismissed(true);
    try {
      localStorage.setItem('planCoachingDismissed', 'true');
    } catch {
      /* noop */
    }
  };
  const handleSelectSession = (d: number, id: string) => setActiveSessionIds(prev => ({ ...prev, [d]: id }));
  const handleOpenAddSession = (d: number) => {
    setAddSessionDow(d);
    setShowAddSessionModal(true);
  };
  const addSession = (type: string, groups?: string[]) => {
    const plan = useFitnessStore.getState().getActivePlan();
    if (!plan) return;
    const existing = daySessionsMap.get(addSessionDow) ?? [];
    useFitnessStore.getState().addPlanDaySession(plan.id, addSessionDow, {
      planId: plan.id,
      dayOfWeek: addSessionDow,
      sessionOrder: existing.length + 1,
      workoutType: type,
      muscleGroups: groups ? JSON.stringify(groups) : '',
      exercises: '[]',
      originalExercises: '[]',
      isUserAssigned: true,
      originalDayOfWeek: addSessionDow,
    });
    setShowAddSessionModal(false);
  };

  useContextMenuDismiss(dayContextMenu, contextMenuRef, () => setDayContextMenu(null));

  if (activePlan && planExpired) return <PlanEmptyState context="no-plan" onAction={onGeneratePlan} />;
  if (!activePlan) {
    if (planStrategy === 'manual' && onCreateManualPlan)
      return <PlanEmptyState context="no-plan" onAction={onCreateManualPlan} />;
    return <PlanEmptyState context="no-plan" onAction={onGeneratePlan} />;
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

      <div data-testid="calendar-strip">
        <WeekCalendarStrip
          selectedDay={selectedDay}
          todayDow={todayDow}
          planDays={planDays}
          completedDays={new Set<number>()}
          onDaySelect={handleDaySelect}
          onDayContextMenu={(dayNum, e) => {
            e.preventDefault();
            setDayContextMenu({ dayNum, x: e.clientX, y: e.clientY });
          }}
        />
      </div>

      <PlanActionBar
        onEditSchedule={() =>
          pushPage({ id: 'plan-schedule-editor', component: 'PlanScheduleEditor', props: { planId: activePlan.id } })
        }
        onChangeSplit={() =>
          pushPage({
            id: 'split-changer',
            component: 'SplitChanger',
            props: { planId: activePlan.id, currentSplit: activePlan.splitType },
          })
        }
        onBrowseTemplates={() =>
          pushPage({ id: 'plan-template-gallery', component: 'PlanTemplateGallery', props: { planId: activePlan.id } })
        }
      />

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

      <div data-testid="day-accordion" className="space-y-2">
        {Array.from({ length: 7 }, (_, i) => {
          const dayNum = i + 1;
          const isToday = dayNum === todayDow;
          const isExpanded = expandedDays.has(dayNum);
          const daySessions = daySessionsMap.get(dayNum) ?? [];
          const planDay = getActivePlanDay(dayNum);
          const exercises = planDay ? parseExercises(planDay.exercises) : [];
          const exKey = planDay?.id ?? `rest-${dayNum}`;

          if (isToday && planDay) {
            return (
              <TodayWorkoutCard
                key={dayNum}
                planDay={planDay}
                daySessions={daySessions}
                activeSessionId={activeSessionIds[dayNum] ?? daySessions[0]?.id ?? ''}
                completedSessionIds={[]}
                exercises={exercises}
                estimatedMinutes={estimateDuration(exercises)}
                exercisesExpanded={exercisesExpandedMap[exKey] ?? false}
                onStartWorkout={handleStartWorkout}
                onEditExercises={p =>
                  pushPage({ id: 'plan-day-editor', component: 'PlanDayEditor', props: { planDay: p } })
                }
                onConvertToRest={() => handleConvertToRest(dayNum)}
                onRestoreOriginal={id => useFitnessStore.getState().restorePlanDayOriginal(id)}
                onSelectSession={id => handleSelectSession(dayNum, id)}
                onAddSession={() => handleOpenAddSession(dayNum)}
                onDeleteSession={dayId => useFitnessStore.getState().removePlanDaySession(dayId)}
                onToggleExerciseExpand={() => toggleExerciseExpand(exKey, exercisesExpandedMap[exKey] ?? false)}
              />
            );
          }

          if (isToday) {
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
                <TodayRestCard
                  tomorrowPlanDay={tomorrowPlanDay}
                  tomorrowExerciseCount={tomorrowExercises.length}
                  onConvertToWorkout={() => handleAddWorkoutToDay(dayNum)}
                  onLogWeight={handleLogWeight}
                  onLogCardio={handleLogCardio}
                />
              </div>
            );
          }

          if (planDay) {
            return (
              <PlanDayAccordion
                key={dayNum}
                planDay={planDay}
                dayOfWeek={dayNum}
                isExpanded={isExpanded}
                isCompleted={false}
                onToggle={() => handleDaySelect(dayNum)}
                onStartWorkout={() => handleStartWorkout(planDay)}
                onEditExercises={() =>
                  pushPage({ id: 'plan-day-editor', component: 'PlanDayEditor', props: { planDay } })
                }
              />
            );
          }

          if (!isExpanded) {
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
                    {t('fitness.plan.restDay')}
                  </span>
                  <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            );
          }

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
        onSelectStrength={groups => addSession('Strength', groups)}
        onSelectCardio={() => addSession('Cardio')}
        onSelectFreestyle={() => {
          pushPage({ id: 'workout-logger', component: 'WorkoutLogger', props: {} });
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
          if (showConvertToRestConfirm !== null) confirmConvertToRest(showConvertToRestConfirm);
        }}
        onCancel={() => setShowConvertToRestConfirm(null)}
      />
    </div>
  );
}

export const TrainingPlanView = React.memo(TrainingPlanViewInner);
TrainingPlanView.displayName = 'TrainingPlanView';

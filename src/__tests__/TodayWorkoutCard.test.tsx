import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { TodayWorkoutCard } from '../features/fitness/components/TodayWorkoutCard';
import type { SelectedExercise, TrainingPlanDay } from '../features/fitness/types';

// --- Mocks ---

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, optionsOrFallback?: string | Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'fitness.plan.todayWorkout': 'Buổi tập hôm nay',
        'fitness.plan.startWorkout': 'Bắt đầu tập',
        'fitness.plan.convertToRest': 'Chuyển thành ngày nghỉ',
        'fitness.plan.editExercises': 'Chỉnh sửa bài tập',
        'fitness.plan.restore': 'Khôi phục',
        'fitness.plan.modified': 'Đã chỉnh sửa',
        'fitness.plan.setsLabel': 'hiệp',
        'fitness.plan.repsLabel': 'lần',
        'fitness.plan.exercises': 'bài tập',
        'fitness.plan.minutes': 'phút',
        'fitness.plan.moreExercises': '+{{remaining}} bài tập nữa',
        'fitness.plan.showLess': 'Thu gọn',
        'fitness.plan.cardioDay': 'Cardio',
        'fitness.plan.restDay': 'Ngày nghỉ',
        'fitness.plan.todayLabel': 'Hôm nay',
        'fitness.plan.completed': 'Hoàn thành',
        'fitness.plan.tomorrowPreview': 'Ngày mai',
        'fitness.plan.restDayTip': 'Nghỉ ngơi để cơ thể phục hồi',
        'fitness.plan.restDayRegion': 'Khu vực ngày nghỉ',
        'fitness.plan.logWeight': 'Ghi cân nặng',
        'fitness.plan.quickCardio': 'Cardio nhanh',
        'fitness.plan.viewSummary': 'Xem tổng kết',
        'fitness.onboarding.muscle_chest': 'Ngực',
        'fitness.onboarding.muscle_shoulders': 'Vai',
        'fitness.onboarding.muscle_core': 'Cơ trung tâm',
        'fitness.workoutType.Upper Body A': 'Thân trên A',
        'fitness.workoutType.Lower Body A': 'Hạ thể A',
      };
      const template = translations[key];
      if (template && typeof optionsOrFallback === 'object' && optionsOrFallback !== null) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
          String((optionsOrFallback as Record<string, unknown>)[k] ?? ''),
        );
      }
      if (template) return template;
      if (typeof optionsOrFallback === 'string') return optionsOrFallback;
      if (typeof optionsOrFallback === 'object' && optionsOrFallback !== null && 'defaultValue' in optionsOrFallback) {
        return String((optionsOrFallback as Record<string, unknown>).defaultValue);
      }
      return key;
    },
    i18n: { language: 'vi' },
  }),
}));

interface MockSessionTabsProps {
  sessions: TrainingPlanDay[];
  activeSessionId: string;
  completedSessionIds: string[];
  onSelectSession: (id: string) => void;
  onAddSession: () => void;
  onDeleteSession?: (id: string) => void;
}

vi.mock('../features/fitness/components/SessionTabs', () => ({
  SessionTabs: (props: MockSessionTabsProps) => (
    <div data-testid="session-tabs" role="tablist">
      {props.sessions.map((s, i) => (
        <button key={s.id} role="tab" data-testid={`session-tab-${i}`} onClick={() => props.onSelectSession(s.id)}>
          Session {i + 1}
        </button>
      ))}
      <button data-testid="add-session-tab" onClick={props.onAddSession}>
        +
      </button>
      {props.onDeleteSession && (
        <button data-testid="delete-session-tab" onClick={() => props.onDeleteSession!(props.sessions[0]?.id)}>
          Delete
        </button>
      )}
    </div>
  ),
}));

// --- Test data fixtures ---

const makeExercise = (id: string, nameVi: string): SelectedExercise['exercise'] => ({
  id,
  nameVi,
  muscleGroup: 'chest',
  secondaryMuscles: [],
  category: 'compound',
  equipment: ['barbell'],
  contraindicated: [],
  exerciseType: 'strength',
  defaultRepsMin: 8,
  defaultRepsMax: 12,
  isCustom: false,
  updatedAt: '2025-01-01',
});

const EXERCISES_3: SelectedExercise[] = [
  { exercise: makeExercise('e1', 'Bench Press'), sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { exercise: makeExercise('e2', 'Shoulder Press'), sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { exercise: makeExercise('e3', 'Fly'), sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60 },
];

const EXERCISES_6: SelectedExercise[] = [
  ...EXERCISES_3,
  { exercise: makeExercise('e4', 'Dips'), sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { exercise: makeExercise('e5', 'Cable Fly'), sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
  { exercise: makeExercise('e6', 'Tricep Push'), sets: 2, repsMin: 12, repsMax: 15, restSeconds: 60 },
];

const basePlanDay: TrainingPlanDay = {
  id: 'd1',
  planId: 'plan1',
  dayOfWeek: 1,
  sessionOrder: 1,
  workoutType: 'Upper Body A',
  muscleGroups: 'chest,shoulders',
  exercises: JSON.stringify(EXERCISES_3),
  isUserAssigned: false,
  originalDayOfWeek: 1,
};

const modifiedPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  exercises: JSON.stringify([EXERCISES_3[0]]),
  originalExercises: JSON.stringify(EXERCISES_3),
};

const cardioPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  id: 'd-cardio',
  workoutType: 'Cardio',
  muscleGroups: undefined,
  exercises: '[]',
};

const noMuscleGroupsPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  muscleGroups: undefined,
};

const restPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  id: 'd-rest',
  workoutType: 'rest',
  muscleGroups: undefined,
  exercises: '[]',
};

const tomorrowPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  id: 'd-tomorrow',
  dayOfWeek: 2,
  workoutType: 'Lower Body A',
  muscleGroups: 'legs,glutes',
};

const completedStats = { durationMin: 45, totalVolume: 2340, totalSets: 18 };

const session1: TrainingPlanDay = { ...basePlanDay, id: 'ms1', sessionOrder: 1 };
const session2: TrainingPlanDay = {
  ...basePlanDay,
  id: 'ms2',
  sessionOrder: 2,
  workoutType: 'Cardio',
  muscleGroups: '',
  exercises: '[]',
};
const session3: TrainingPlanDay = {
  ...basePlanDay,
  id: 'ms3',
  sessionOrder: 3,
  workoutType: 'Core',
  muscleGroups: 'core',
  exercises: JSON.stringify([EXERCISES_3[0]]),
};

const defaultCallbacks = {
  onStartWorkout: vi.fn(),
  onEditExercises: vi.fn(),
  onConvertToRest: vi.fn(),
  onRestoreOriginal: vi.fn(),
  onSelectSession: vi.fn(),
  onAddSession: vi.fn(),
  onDeleteSession: vi.fn(),
  onToggleExerciseExpand: vi.fn(),
  onLogWeight: vi.fn(),
  onQuickCardio: vi.fn(),
  onViewSummary: vi.fn(),
};

function renderCard(overrides: Record<string, unknown> = {}) {
  const props = {
    planDay: basePlanDay,
    daySessions: [basePlanDay],
    activeSessionId: basePlanDay.id,
    completedSessionIds: [] as string[],
    exercises: EXERCISES_3,
    estimatedMinutes: 23,
    exercisesExpanded: false,
    ...defaultCallbacks,
    ...overrides,
  };
  return render(<TodayWorkoutCard {...props} />);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// --- Tests ---

describe('TodayWorkoutCard', () => {
  // TC_W201_01: Hero card renders with gradient container
  it('renders gradient hero card as section with correct classes', () => {
    renderCard();
    const hero = screen.getByTestId('today-hero-card');
    expect(hero.tagName).toBe('SECTION');
    expect(hero.className).toContain('bg-gradient-to-br');
    expect(hero.className).toContain('from-primary-subtle');
    expect(hero.className).toContain('to-card');
    expect(hero.className).toContain('rounded-2xl');
    expect(hero.className).toContain('border-border/60');
    expect(hero.className).toContain('p-5');
    expect(hero.className).toContain('shadow-sm');
    expect(hero).toHaveAttribute('aria-label', 'Buổi tập hôm nay');
  });

  // TC_W201_02: animate-slide-up applied on mount
  it('has animate-slide-up class on hero card', () => {
    renderCard();
    expect(screen.getByTestId('today-hero-card').className).toContain('animate-slide-up');
  });

  // TC_W201_03: Eyebrow shows "Hôm nay" label
  it('shows Hôm nay eyebrow label without badge when no completions', () => {
    renderCard({ completedSessionIds: [] });
    expect(screen.getByText('Hôm nay')).toBeInTheDocument();
    const eyebrow = screen.getByText('Hôm nay');
    expect(eyebrow.className).toContain('text-xs');
    expect(eyebrow.className).toContain('font-medium');
    expect(eyebrow.className).toContain('uppercase');
    expect(eyebrow.className).toContain('tracking-wide');
    expect(screen.queryByText('Hoàn thành')).not.toBeInTheDocument();
  });

  // TC_W201_04: Completed badge shows when all sessions done
  it('shows completed badge with Check icon when all sessions done', () => {
    renderCard({ completedSessionIds: [basePlanDay.id] });
    const badge = screen.getByText('Hoàn thành');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-success/10');
    expect(badge.className).toContain('text-success');
    expect(badge.querySelector('svg')).toBeInTheDocument();
  });

  // TC_W201_05: Multi-session progress badge "2/3"
  it('shows multi-session progress badge 2/3', () => {
    renderCard({
      daySessions: [session1, session2, session3],
      completedSessionIds: ['ms1', 'ms2'],
    });
    const badge = screen.getByText('2/3');
    expect(badge.className).toContain('bg-primary/10');
    expect(badge.className).toContain('text-primary');
    expect(screen.queryByText('Hoàn thành')).not.toBeInTheDocument();
  });

  // TC_W201_06: Workout title as h2 with info line
  it('renders h2 title with dot-separated info line', () => {
    renderCard();
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2).toHaveTextContent('Thân trên A');
    expect(h2.className).toContain('text-lg');
    expect(h2.className).toContain('font-bold');
    const infoLine = screen.getByTestId('hero-info-line');
    expect(infoLine).toHaveTextContent('Ngực · Vai · 3 bài tập · ~23 phút');
  });

  // TC_W201_07: Exercise list numbered with border separator
  it('shows numbered exercises with border-top separator', () => {
    renderCard();
    const list = screen.getByTestId('exercise-list');
    const container = list.parentElement!;
    expect(container.className).toContain('border-t');
    expect(container.className).toContain('border-border/60');
    expect(list.children).toHaveLength(3);
    const first = list.children[0];
    expect(first).toHaveTextContent('1');
    expect(first).toHaveTextContent('Bench Press');
    const nameSpans = list.querySelectorAll('.truncate');
    expect(nameSpans.length).toBeGreaterThanOrEqual(3);
    const numSpans = list.querySelectorAll('.tabular-nums');
    expect(numSpans.length).toBeGreaterThanOrEqual(3);
  });

  // TC_W201_08: Exercise sets×reps compact format
  it('shows compact sets×reps format for exercises', () => {
    renderCard();
    const list = screen.getByTestId('exercise-list');
    expect(list.children[0]).toHaveTextContent('3×8-12');
    expect(list.children[2]).toHaveTextContent('2×10-15');
  });

  // TC_W201_09: Collapse at >3 exercises
  it('collapses to 3 items with toggle when >3 exercises', () => {
    renderCard({ exercises: EXERCISES_6, exercisesExpanded: false });
    expect(screen.getByTestId('exercise-list').children).toHaveLength(3);
    const toggle = screen.getByTestId('exercise-collapse-toggle');
    expect(toggle).toHaveTextContent('+3 bài tập nữa');
    fireEvent.click(toggle);
    expect(defaultCallbacks.onToggleExerciseExpand).toHaveBeenCalledTimes(1);
  });

  // TC_W201_10: Expand shows all exercises
  it('shows all 6 exercises when expanded', () => {
    renderCard({ exercises: EXERCISES_6, exercisesExpanded: true });
    expect(screen.getByTestId('exercise-list').children).toHaveLength(6);
    const toggle = screen.getByTestId('exercise-collapse-toggle');
    expect(toggle).toHaveTextContent('Thu gọn');
    fireEvent.click(toggle);
    expect(defaultCallbacks.onToggleExerciseExpand).toHaveBeenCalledTimes(1);
  });

  // TC_W201_11: Primary CTA classes
  it('renders primary CTA with correct classes', () => {
    renderCard();
    const cta = screen.getByTestId('btn-start-workout-hero');
    expect(cta).toHaveTextContent('Bắt đầu tập');
    expect(cta.className).toContain('min-h-12');
    expect(cta.className).toContain('rounded-xl');
    expect(cta.className).toContain('bg-primary');
    expect(cta.className).toContain('text-lg');
    expect(cta.className).toContain('font-semibold');
    expect(cta.className).toContain('shadow-sm');
    expect(cta.className).toContain('active:scale-[0.98]');
    expect(cta.className).toContain('motion-reduce:transform-none');
    expect(cta.className).toContain('focus-visible:ring-2');
    expect(cta.querySelector('svg')).toBeInTheDocument();
  });

  // TC_W201_12: CTA click fires onStartWorkout
  it('calls onStartWorkout with planDay when clicking CTA', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('btn-start-workout-hero'));
    expect(defaultCallbacks.onStartWorkout).toHaveBeenCalledTimes(1);
    expect(defaultCallbacks.onStartWorkout).toHaveBeenCalledWith(basePlanDay);
  });

  // TC_W201_13: Convert to rest button
  it('renders convert to rest with Moon icon and fires callback', () => {
    renderCard();
    const btn = screen.getByTestId('day-convert-rest-btn');
    expect(btn).toHaveTextContent('Chuyển thành ngày nghỉ');
    expect(btn.querySelector('svg')).toBeInTheDocument();
    expect(btn.className).toContain('min-h-11');
    expect(btn.className).toContain('active:scale-[0.98]');
    fireEvent.click(btn);
    expect(defaultCallbacks.onConvertToRest).toHaveBeenCalledTimes(1);
  });

  // TC_W201_14: Edit exercises button
  it('fires onEditExercises with planDay when clicking edit', () => {
    renderCard();
    const btn = screen.getByTestId('edit-exercises-btn');
    expect(btn).toHaveAttribute('aria-label', 'Chỉnh sửa bài tập');
    fireEvent.click(btn);
    expect(defaultCallbacks.onEditExercises).toHaveBeenCalledTimes(1);
    expect(defaultCallbacks.onEditExercises).toHaveBeenCalledWith(basePlanDay);
  });

  // TC_W201_15: SessionTabs delegation for multi-session
  it('delegates SessionTabs with correct props for multi-session', () => {
    renderCard({ daySessions: [session1, session2], activeSessionId: session1.id });
    const tabs = screen.getByTestId('session-tabs');
    expect(tabs).toBeInTheDocument();
    expect(tabs.querySelectorAll('[role="tab"]')).toHaveLength(2);
    fireEvent.click(screen.getByTestId('session-tab-1'));
    expect(defaultCallbacks.onSelectSession).toHaveBeenCalledWith('ms2');
    fireEvent.click(screen.getByTestId('add-session-tab'));
    expect(defaultCallbacks.onAddSession).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('delete-session-tab'));
    expect(defaultCallbacks.onDeleteSession).toHaveBeenCalledWith('ms1');
  });

  // TC_W201_16: 3 sessions max boundary (BR-13)
  it('renders 3 session tabs with multi-session badge', () => {
    renderCard({
      daySessions: [session1, session2, session3],
      completedSessionIds: ['ms1'],
    });
    const tabs = screen.getByTestId('session-tabs');
    expect(tabs.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(screen.getByTestId('today-hero-card')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  // TC_W201_17: Rest Day Hero renders with Moon icon
  it('renders rest day hero with Moon icon and correct gradient', () => {
    renderCard({ planDay: restPlanDay, exercises: [], estimatedMinutes: 0 });
    const rest = screen.getByTestId('today-hero-rest');
    expect(rest.tagName).toBe('SECTION');
    expect(rest.className).toContain('bg-gradient-to-br');
    expect(rest.className).toContain('from-info/5');
    expect(rest.className).toContain('to-card');
    expect(rest.className).toContain('animate-slide-up');
    expect(rest.className).toContain('rounded-2xl');
    expect(rest.className).toContain('border-border/60');
    expect(rest.className).toContain('p-5');
    expect(rest.className).toContain('shadow-sm');
    expect(rest).toHaveAttribute('aria-label', 'Khu vực ngày nghỉ');
    expect(screen.getByText('Ngày nghỉ')).toBeInTheDocument();
    expect(screen.getByText('Nghỉ ngơi để cơ thể phục hồi')).toBeInTheDocument();
    const moonContainer = rest.querySelector('.bg-info\\/10');
    expect(moonContainer).toBeInTheDocument();
    expect(moonContainer!.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-start-workout-hero')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exercise-list')).not.toBeInTheDocument();
  });

  // TC_W201_18: Rest Day Hero tomorrow preview
  it('shows tomorrow preview when tomorrowPlanDay provided', () => {
    renderCard({
      planDay: restPlanDay,
      exercises: [],
      estimatedMinutes: 0,
      tomorrowPlanDay,
    });
    expect(screen.getByTestId('tomorrow-preview')).toBeInTheDocument();
    expect(screen.getByText('Ngày mai')).toBeInTheDocument();
    expect(screen.getByText('Hạ thể A')).toBeInTheDocument();
    const preview = screen.getByTestId('tomorrow-preview');
    expect(preview.className).toContain('rounded-xl');
    expect(preview.className).toContain('border');
  });

  // TC_W201_19: Rest Day Hero no tomorrow preview
  it('renders rest hero without tomorrow preview when tomorrowPlanDay undefined', () => {
    renderCard({ planDay: restPlanDay, exercises: [], estimatedMinutes: 0 });
    expect(screen.getByTestId('today-hero-rest')).toBeInTheDocument();
    expect(screen.queryByText('Ngày mai')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tomorrow-preview')).not.toBeInTheDocument();
  });

  // TC_W201_20: Rest Day quick actions
  it('renders rest day quick actions with callbacks and touch targets', () => {
    renderCard({ planDay: restPlanDay, exercises: [], estimatedMinutes: 0 });
    const logWeightBtn = screen.getByText('Ghi cân nặng').closest('button')!;
    const quickCardioBtn = screen.getByText('Cardio nhanh').closest('button')!;

    expect(logWeightBtn.className).toContain('min-h-11');
    expect(logWeightBtn.className).toContain('active:scale-[0.98]');
    expect(logWeightBtn.className).toContain('motion-reduce:transform-none');
    expect(quickCardioBtn.className).toContain('min-h-11');
    expect(quickCardioBtn.className).toContain('active:scale-[0.98]');

    fireEvent.click(logWeightBtn);
    expect(defaultCallbacks.onLogWeight).toHaveBeenCalledTimes(1);
    fireEvent.click(quickCardioBtn);
    expect(defaultCallbacks.onQuickCardio).toHaveBeenCalledTimes(1);
  });

  // TC_W201_21: Completed Hero — stats row and CTA change
  it('shows completed stats row and outline CTA when all sessions done with stats', () => {
    renderCard({
      completedSessionIds: [basePlanDay.id],
      completedWorkoutStats: completedStats,
    });
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();

    const stats = screen.getByTestId('completed-stats');
    expect(stats).toHaveTextContent('45m');
    expect(stats).toHaveTextContent('2340kg');
    expect(stats).toHaveTextContent('18 sets');
    const icons = stats.querySelectorAll('svg');
    expect(icons).toHaveLength(3);

    const cta = screen.getByTestId('btn-start-workout-hero');
    expect(cta).toHaveTextContent('Xem tổng kết');
    expect(cta.className).toContain('border-primary');
    expect(cta.className).toContain('text-primary');
    const classes = cta.className.split(' ');
    expect(classes).not.toContain('bg-primary');

    fireEvent.click(cta);
    expect(defaultCallbacks.onViewSummary).toHaveBeenCalledTimes(1);
  });

  // TC_W201_22: All 3 sessions completed
  it('shows completed badge and summary CTA when all 3 sessions done', () => {
    renderCard({
      daySessions: [session1, session2, session3],
      completedSessionIds: ['ms1', 'ms2', 'ms3'],
      completedWorkoutStats: completedStats,
    });
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    const cta = screen.getByTestId('btn-start-workout-hero');
    expect(cta).toHaveTextContent('Xem tổng kết');
    expect(screen.getByTestId('session-tabs')).toBeInTheDocument();
  });

  // TC_W201_23: Empty exercises still renders hero
  it('renders hero card without exercise list when exercises empty', () => {
    renderCard({ exercises: [], estimatedMinutes: 0 });
    expect(screen.getByTestId('today-hero-card')).toBeInTheDocument();
    expect(screen.queryByTestId('exercise-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('hero-info-line')).toHaveTextContent('0 bài tập');
    expect(screen.getByTestId('btn-start-workout-hero')).toBeInTheDocument();
    expect(screen.getByTestId('edit-exercises-btn')).toBeInTheDocument();
  });

  // TC_W201_24: Modified badge and restore (regression)
  it('shows modified badge and restore button for modified plan', () => {
    renderCard({ planDay: modifiedPlanDay });
    expect(screen.getByTestId('modified-badge')).toHaveTextContent('Đã chỉnh sửa');
    expect(screen.getByTestId('restore-original-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('restore-original-btn'));
    expect(defaultCallbacks.onRestoreOriginal).toHaveBeenCalledWith('d1');
  });

  // TC_W201_25: Not modified — no badge
  it('does not show modified badge when plan is unmodified', () => {
    renderCard();
    expect(screen.queryByTestId('modified-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('restore-original-btn')).not.toBeInTheDocument();
  });

  // TC_W201_26: Cardio workout type
  it('renders cardio workout type without muscle groups', () => {
    renderCard({ planDay: cardioPlanDay, exercises: [], estimatedMinutes: 0 });
    expect(screen.getByTestId('today-hero-card')).toBeInTheDocument();
    expect(screen.getByText('Cardio')).toBeInTheDocument();
    const infoLine = screen.getByTestId('hero-info-line');
    expect(infoLine).not.toHaveTextContent('Ngực');
    expect(infoLine).toHaveTextContent('0 bài tập');
    expect(screen.getByTestId('btn-start-workout-hero')).toBeInTheDocument();
  });

  // TC_W201_27: Touch targets on all buttons (BR-37)
  it('has correct touch target sizes on all buttons', () => {
    renderCard({ planDay: modifiedPlanDay, exercises: EXERCISES_6, exercisesExpanded: false });
    const cta = screen.getByTestId('btn-start-workout-hero');
    expect(cta.className).toContain('min-h-12');

    const edit = screen.getByTestId('edit-exercises-btn');
    expect(edit.className).toContain('min-h-[44px]');
    expect(edit.className).toContain('min-w-[44px]');

    const convert = screen.getByTestId('day-convert-rest-btn');
    expect(convert.className).toContain('min-h-11');

    const restore = screen.getByTestId('restore-original-btn');
    expect(restore.className).toContain('min-h-[44px]');
    expect(restore.className).toContain('min-w-[44px]');
  });

  // TC_W201_28: Press feedback on all buttons (BR-42)
  it('has press feedback classes on all interactive buttons', () => {
    renderCard();
    const cta = screen.getByTestId('btn-start-workout-hero');
    expect(cta.className).toContain('active:scale-[0.98]');
    expect(cta.className).toContain('motion-reduce:transform-none');

    const convert = screen.getByTestId('day-convert-rest-btn');
    expect(convert.className).toContain('active:scale-[0.98]');
    expect(convert.className).toContain('motion-reduce:transform-none');

    const edit = screen.getByTestId('edit-exercises-btn');
    expect(edit.className).toContain('active:scale-[0.98]');
    expect(edit.className).toContain('motion-reduce:transform-none');
  });

  // TC_W201_29: Focus visibility on all buttons
  it('has focus-visible ring classes on all interactive buttons', () => {
    renderCard({
      planDay: modifiedPlanDay,
      exercises: EXERCISES_6,
      exercisesExpanded: false,
    });
    const testIds = [
      'btn-start-workout-hero',
      'edit-exercises-btn',
      'day-convert-rest-btn',
      'restore-original-btn',
      'exercise-collapse-toggle',
    ];
    for (const testId of testIds) {
      const btn = screen.getByTestId(testId);
      expect(btn.className).toContain('focus-visible:ring-2');
      expect(btn.className).toContain('focus-visible:outline-none');
    }
  });

  // TC_W201_30: No muscle groups renders cleanly
  it('renders info line without muscle groups when undefined', () => {
    renderCard({ planDay: noMuscleGroupsPlanDay });
    const infoLine = screen.getByTestId('hero-info-line');
    expect(infoLine).toHaveTextContent('3 bài tập · ~23 phút');
    expect(infoLine).not.toHaveTextContent('Ngực');
    expect(screen.getByText('Thân trên A')).toBeInTheDocument();
  });

  // TC_W201_31: Single exercise — no collapse
  it('shows single exercise without collapse toggle', () => {
    renderCard({ exercises: [EXERCISES_3[0]], estimatedMinutes: 8 });
    expect(screen.getByTestId('exercise-list').children).toHaveLength(1);
    expect(screen.queryByTestId('exercise-collapse-toggle')).not.toBeInTheDocument();
    expect(screen.getByTestId('exercise-list').children[0]).toHaveTextContent('1');
  });

  // TC_W201_32: onDeleteSession undefined
  it('renders SessionTabs without delete when onDeleteSession undefined', () => {
    renderCard({ onDeleteSession: undefined });
    expect(screen.getByTestId('session-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-session-tab')).not.toBeInTheDocument();
  });

  // TC_W201_33: Rest workout type renders rest hero (regression)
  it('renders rest hero for rest workout type', () => {
    renderCard({
      planDay: { ...basePlanDay, workoutType: 'rest' },
      exercises: [],
      estimatedMinutes: 0,
    });
    expect(screen.getByTestId('today-hero-rest')).toBeInTheDocument();
    expect(screen.getByText('Ngày nghỉ')).toBeInTheDocument();
    expect(screen.queryByTestId('today-hero-card')).not.toBeInTheDocument();
  });

  // TC_W201_34: Exactly 4 exercises — collapse shows "+1"
  it('shows +1 collapse toggle with 4 exercises', () => {
    const fourExercises = EXERCISES_6.slice(0, 4);
    renderCard({ exercises: fourExercises, exercisesExpanded: false });
    expect(screen.getByTestId('exercise-list').children).toHaveLength(3);
    expect(screen.getByTestId('exercise-collapse-toggle')).toHaveTextContent('+1 bài tập nữa');
  });

  // TC_W201_35: Completed CTA fallback to onStartWorkout when onViewSummary undefined
  it('falls back to onStartWorkout when onViewSummary undefined and all completed', () => {
    renderCard({
      completedSessionIds: [basePlanDay.id],
      onViewSummary: undefined,
    });
    fireEvent.click(screen.getByTestId('btn-start-workout-hero'));
    expect(defaultCallbacks.onStartWorkout).toHaveBeenCalledWith(basePlanDay);
  });

  // TC_W201_36: No completed stats when not all sessions done
  it('does not show completed stats when not all sessions done', () => {
    renderCard({
      daySessions: [session1, session2],
      completedSessionIds: ['ms1'],
      completedWorkoutStats: completedStats,
    });
    expect(screen.queryByTestId('completed-stats')).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-start-workout-hero')).toHaveTextContent('Bắt đầu tập');
  });

  // TC_W201_37: exercises equal originalExercises — no modified badge
  it('does not show modified badge when exercises equal original', () => {
    const sameExercises = JSON.stringify(EXERCISES_3);
    renderCard({
      planDay: { ...basePlanDay, exercises: sameExercises, originalExercises: sameExercises },
    });
    expect(screen.queryByTestId('modified-badge')).not.toBeInTheDocument();
  });
});

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
        'fitness.onboarding.muscle_chest': 'Ngực',
        'fitness.onboarding.muscle_shoulders': 'Vai',
        'fitness.onboarding.muscle_core': 'Cơ trung tâm',
        'fitness.workoutType.Upper Body A': 'Thân trên A',
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
  // TC_W1_01_01: Happy path — standard workout with exercises
  it('renders complete workout card with exercises', () => {
    renderCard();
    expect(screen.getByTestId('today-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Buổi tập hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Thân trên A')).toBeInTheDocument();
    expect(screen.getByText('Ngực, Vai')).toBeInTheDocument();
    expect(screen.getByTestId('workout-stats')).toHaveTextContent('3 bài tập');
    expect(screen.getByTestId('workout-stats')).toHaveTextContent('~23 phút');
    expect(screen.getByTestId('exercise-list').children).toHaveLength(3);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Shoulder Press')).toBeInTheDocument();
    expect(screen.getByText('Fly')).toBeInTheDocument();
    expect(screen.getByTestId('start-workout-btn')).toBeInTheDocument();
    expect(screen.getByTestId('edit-exercises-btn')).toBeInTheDocument();
    expect(screen.getByTestId('day-convert-rest-btn')).toBeInTheDocument();
  });

  // TC_W1_01_02: No modified badge when originalExercises is undefined
  it('does not show modified badge when originalExercises is undefined', () => {
    renderCard();
    expect(screen.queryByTestId('modified-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('restore-original-btn')).not.toBeInTheDocument();
  });

  // TC_W1_01_03: Shows modified badge when exercises differ from original
  it('shows modified badge when exercises differ from original', () => {
    renderCard({ planDay: modifiedPlanDay });
    expect(screen.getByTestId('modified-badge')).toHaveTextContent('Đã chỉnh sửa');
    expect(screen.getByTestId('restore-original-btn')).toBeInTheDocument();
  });

  // TC_W1_01_04: No modified badge when exercises equal original
  it('does not show modified badge when exercises equal original', () => {
    const sameExercises = JSON.stringify(EXERCISES_3);
    const planDay: TrainingPlanDay = {
      ...basePlanDay,
      exercises: sameExercises,
      originalExercises: sameExercises,
    };
    renderCard({ planDay });
    expect(screen.queryByTestId('modified-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('restore-original-btn')).not.toBeInTheDocument();
  });

  // TC_W1_01_05: Clicking restore calls onRestoreOriginal with planDay.id
  it('calls onRestoreOriginal with planDay.id when clicking restore', () => {
    renderCard({ planDay: modifiedPlanDay });
    fireEvent.click(screen.getByTestId('restore-original-btn'));
    expect(defaultCallbacks.onRestoreOriginal).toHaveBeenCalledTimes(1);
    expect(defaultCallbacks.onRestoreOriginal).toHaveBeenCalledWith('d1');
  });

  // TC_W1_01_06: Start workout CTA calls onStartWorkout
  it('calls onStartWorkout with planDay when clicking CTA', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('start-workout-btn'));
    expect(defaultCallbacks.onStartWorkout).toHaveBeenCalledTimes(1);
    expect(defaultCallbacks.onStartWorkout).toHaveBeenCalledWith(basePlanDay);
  });

  // TC_W1_01_07: Edit exercises calls onEditExercises
  it('calls onEditExercises with planDay when clicking edit', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('edit-exercises-btn'));
    expect(defaultCallbacks.onEditExercises).toHaveBeenCalledTimes(1);
    expect(defaultCallbacks.onEditExercises).toHaveBeenCalledWith(basePlanDay);
  });

  // TC_W1_01_08: Convert to rest calls onConvertToRest
  it('calls onConvertToRest when clicking convert button', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('day-convert-rest-btn'));
    expect(defaultCallbacks.onConvertToRest).toHaveBeenCalledTimes(1);
  });

  // TC_W1_01_09: No exercise list when exercises prop is empty array
  it('does not render exercise list when exercises is empty array', () => {
    renderCard({ exercises: [], estimatedMinutes: 0 });
    expect(screen.queryByTestId('exercise-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exercise-collapse-toggle')).not.toBeInTheDocument();
    expect(screen.getByTestId('start-workout-btn')).toBeInTheDocument();
  });

  // TC_W1_01_10: No exercise list when exercises field undefined (0 parsed)
  it('shows zero stats when exercises prop is empty and planDay has no exercises', () => {
    renderCard({
      planDay: { ...basePlanDay, exercises: undefined },
      exercises: [],
      estimatedMinutes: 0,
    });
    expect(screen.queryByTestId('exercise-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('workout-stats')).toHaveTextContent('0 bài tập');
    expect(screen.getByTestId('workout-stats')).toHaveTextContent('~0 phút');
  });

  // TC_W1_01_11: Exercise list shows 3 items without collapse when exactly 3
  it('shows all 3 exercises without collapse toggle at threshold', () => {
    renderCard({ exercises: EXERCISES_3 });
    expect(screen.getByTestId('exercise-list').children).toHaveLength(3);
    expect(screen.queryByTestId('exercise-collapse-toggle')).not.toBeInTheDocument();
  });

  // TC_W1_01_12: Collapses to 3 with toggle when >3 exercises (collapsed state)
  it('collapses to 3 items with toggle when >3 exercises', () => {
    renderCard({ exercises: EXERCISES_6, exercisesExpanded: false });
    expect(screen.getByTestId('exercise-list').children).toHaveLength(3);
    const toggle = screen.getByTestId('exercise-collapse-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveTextContent('+3 bài tập nữa');
    expect(toggle).toHaveAttribute('aria-label', '+3 bài tập nữa');
  });

  // TC_W1_01_13: Shows all exercises when expanded state
  it('shows all exercises when exercisesExpanded is true', () => {
    renderCard({ exercises: EXERCISES_6, exercisesExpanded: true });
    expect(screen.getByTestId('exercise-list').children).toHaveLength(6);
    const toggle = screen.getByTestId('exercise-collapse-toggle');
    expect(toggle).toHaveTextContent('Thu gọn');
  });

  // TC_W1_01_14: Clicking collapse toggle calls onToggleExerciseExpand
  it('calls onToggleExerciseExpand when clicking collapse toggle', () => {
    renderCard({ exercises: EXERCISES_6, exercisesExpanded: false });
    fireEvent.click(screen.getByTestId('exercise-collapse-toggle'));
    expect(defaultCallbacks.onToggleExerciseExpand).toHaveBeenCalledTimes(1);
  });

  // TC_W1_01_15: SessionTabs rendered when daySessions has 1+ session
  it('renders SessionTabs when daySessions has 1 session', () => {
    renderCard({ daySessions: [session1] });
    expect(screen.getByTestId('session-tabs')).toBeInTheDocument();
  });

  // TC_W1_01_16: SessionTabs receives correct props for multi-session
  it('renders SessionTabs with correct props for multi-session', () => {
    renderCard({
      daySessions: [session1, session2],
      activeSessionId: session1.id,
    });
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

  // TC_W1_01_17: SessionTabs renders for 3 sessions (BR-13 max)
  it('renders SessionTabs for 3 sessions at max boundary', () => {
    renderCard({ daySessions: [session1, session2, session3] });
    const tabs = screen.getByTestId('session-tabs');
    expect(tabs.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(screen.getByTestId('today-workout-card')).toBeInTheDocument();
  });

  // TC_W1_01_18: Cardio workout type shows "Cardio" in stats
  it('shows Cardio label in stats for cardio workout type', () => {
    renderCard({
      planDay: cardioPlanDay,
      exercises: [],
      estimatedMinutes: 0,
    });
    expect(screen.getByTestId('workout-stats')).toHaveTextContent('Cardio');
    expect(screen.queryByText('Ngực, Vai')).not.toBeInTheDocument();
  });

  // TC_W1_01_19: Workout type without muscleGroups renders cleanly
  it('renders without muscle groups paragraph when muscleGroups is undefined', () => {
    renderCard({ planDay: noMuscleGroupsPlanDay });
    expect(screen.queryByText('Ngực, Vai')).not.toBeInTheDocument();
    expect(screen.getByTestId('today-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Thân trên A')).toBeInTheDocument();
  });

  // TC_W1_01_20: Start workout CTA has active:scale and motion-reduce
  it('has press feedback classes on start workout CTA', () => {
    renderCard();
    const btn = screen.getByTestId('start-workout-btn');
    expect(btn.className).toContain('active:scale-[0.98]');
    expect(btn.className).toContain('motion-reduce:transform-none');
  });

  // TC_W1_01_21: All interactive elements have focus-visible ring
  it('has focus-visible ring classes on all interactive buttons', () => {
    renderCard({
      planDay: modifiedPlanDay,
      exercises: EXERCISES_6,
      exercisesExpanded: false,
    });
    const buttonTestIds = [
      'start-workout-btn',
      'edit-exercises-btn',
      'day-convert-rest-btn',
      'restore-original-btn',
      'exercise-collapse-toggle',
    ];
    for (const testId of buttonTestIds) {
      const btn = screen.getByTestId(testId);
      expect(btn.className).toContain('focus-visible:ring-2');
      expect(btn.className).toContain('focus-visible:outline-none');
    }
  });

  // TC_W1_01_22: Touch targets — all buttons ≥44px min size
  it('has minimum touch target sizes on all action buttons', () => {
    renderCard({ planDay: modifiedPlanDay });
    const startBtn = screen.getByTestId('start-workout-btn');
    expect(startBtn.className).toMatch(/py-3\.5/);

    const editBtn = screen.getByTestId('edit-exercises-btn');
    expect(editBtn.className).toContain('min-h-[44px]');
    expect(editBtn.className).toContain('min-w-[44px]');

    const convertBtn = screen.getByTestId('day-convert-rest-btn');
    expect(convertBtn.className).toContain('min-h-[44px]');

    const restoreBtn = screen.getByTestId('restore-original-btn');
    expect(restoreBtn.className).toContain('min-h-[44px]');
    expect(restoreBtn.className).toContain('min-w-[44px]');
  });

  // TC_W1_01_23: Exercise item shows set/rep format correctly
  it('shows correct set/rep format for exercises', () => {
    renderCard({ exercises: EXERCISES_3 });
    const items = screen.getByTestId('exercise-list').children;
    expect(items[0]).toHaveTextContent('3 hiệp × 8-12 lần');
    expect(items[2]).toHaveTextContent('2 hiệp × 10-15 lần');
  });

  // TC_W1_01_24: Exercise names are truncated (CSS class)
  it('applies truncate CSS class to exercise name spans', () => {
    renderCard();
    const list = screen.getByTestId('exercise-list');
    const nameSpans = list.querySelectorAll('.truncate');
    expect(nameSpans.length).toBeGreaterThanOrEqual(3);
  });

  // TC_W1_01_25: Header shows disabled toggle with correct label
  it('renders disabled header toggle with correct label and icon', () => {
    renderCard();
    const toggle = screen.getByTestId('day-accordion-toggle');
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveTextContent('Buổi tập hôm nay');
  });

  // EC_W1_01_02: Single exercise — no collapse
  it('handles single exercise without collapse', () => {
    renderCard({ exercises: [EXERCISES_3[0]], estimatedMinutes: 8 });
    expect(screen.getByTestId('exercise-list').children).toHaveLength(1);
    expect(screen.queryByTestId('exercise-collapse-toggle')).not.toBeInTheDocument();
  });

  // EC_W1_01_01: Exactly at threshold + 1
  it('shows collapse toggle with +1 when exercises = 4', () => {
    const fourExercises = EXERCISES_6.slice(0, 4);
    renderCard({ exercises: fourExercises, exercisesExpanded: false });
    expect(screen.getByTestId('exercise-list').children).toHaveLength(3);
    expect(screen.getByTestId('exercise-collapse-toggle')).toHaveTextContent('+1 bài tập nữa');
  });

  // EC_W1_01_06: onDeleteSession undefined
  it('renders SessionTabs without delete when onDeleteSession is undefined', () => {
    renderCard({ onDeleteSession: undefined });
    expect(screen.getByTestId('session-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-session-tab')).not.toBeInTheDocument();
  });

  // WorkoutStatsContent rest type branch
  it('shows rest day label for rest workout type', () => {
    renderCard({
      planDay: { ...basePlanDay, workoutType: 'rest' },
      exercises: [],
      estimatedMinutes: 0,
    });
    expect(screen.getByTestId('workout-stats')).toHaveTextContent('Ngày nghỉ');
  });
});

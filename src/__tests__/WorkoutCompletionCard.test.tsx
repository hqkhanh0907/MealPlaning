import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import {
  WorkoutCompletionCard,
  type WorkoutCompletionCardProps,
  type WorkoutStats,
} from '../features/fitness/components/WorkoutCompletionCard';
import type { PRDetection } from '../features/fitness/utils/gamification';

const T: Record<string, string> = {
  'fitness.logger.workoutComplete': 'Hoàn thành buổi tập!',
  'fitness.logger.firstWorkoutMessage': 'Chúc mừng buổi tập đầu tiên!',
  'fitness.logger.newPRs': 'Kỷ lục mới',
  'fitness.logger.saveAndClose': 'Lưu & đóng',
  'fitness.logger.discardWorkout': 'Hủy buổi tập',
  'fitness.logger.emptyWorkout': 'Buổi tập trống',
  'fitness.logger.discardEmpty': 'Bỏ qua',
  'fitness.stats.duration': 'Thời gian',
  'fitness.stats.volume': 'Khối lượng',
  'fitness.stats.sets': 'Tổng set',
  'fitness.stats.exercises': 'Bài tập',
  'fitness.streak.milestone': '🔥 Chuỗi {{count}} ngày liên tiếp!',
  'fitness.session.milestone': '🎯 Buổi tập thứ {{count}}!',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      let result = T[key] ?? key;
      if (opts) {
        for (const [k, v] of Object.entries(opts)) {
          result = result.replace(`{{${k}}}`, String(v));
        }
      }
      return result;
    },
    i18n: { language: 'vi' },
  }),
}));

afterEach(cleanup);

const baseStats: WorkoutStats = {
  duration: 45,
  totalVolume: 2400,
  totalSets: 12,
  exerciseCount: 5,
};

const samplePR: PRDetection = {
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  newWeight: 80,
  previousWeight: 75,
  reps: 5,
  improvement: 5,
};

const defaultProps: WorkoutCompletionCardProps = {
  stats: baseStats,
  onSave: vi.fn(),
  onDiscard: vi.fn(),
};

function renderCard(overrides: Partial<WorkoutCompletionCardProps> = {}) {
  return render(<WorkoutCompletionCard {...defaultProps} {...overrides} />);
}

// ========== TC_W304_01-05: Stats Grid ==========

describe('Stats grid', () => {
  it('TC_W304_01: renders workout-completion-card container', () => {
    renderCard();
    expect(screen.getByTestId('workout-completion-card')).toBeInTheDocument();
  });

  it('TC_W304_02: renders stats-grid with 4 stat cells', () => {
    renderCard();
    expect(screen.getByTestId('stats-grid')).toBeInTheDocument();
    expect(screen.getByTestId('stat-duration')).toBeInTheDocument();
    expect(screen.getByTestId('stat-volume')).toBeInTheDocument();
    expect(screen.getByTestId('stat-sets')).toBeInTheDocument();
    expect(screen.getByTestId('stat-exercises')).toBeInTheDocument();
  });

  it('TC_W304_03: displays duration value with "m" suffix', () => {
    renderCard();
    expect(screen.getByTestId('stat-duration')).toHaveTextContent('45m');
    expect(screen.getByTestId('stat-duration')).toHaveTextContent('Thời gian');
  });

  it('TC_W304_04: displays volume in kg', () => {
    renderCard();
    expect(screen.getByTestId('stat-volume')).toHaveTextContent('2400kg');
    expect(screen.getByTestId('stat-volume')).toHaveTextContent('Khối lượng');
  });

  it('TC_W304_05: displays totalSets and exerciseCount', () => {
    renderCard();
    expect(screen.getByTestId('stat-sets')).toHaveTextContent('12');
    expect(screen.getByTestId('stat-sets')).toHaveTextContent('Tổng set');
    expect(screen.getByTestId('stat-exercises')).toHaveTextContent('5');
    expect(screen.getByTestId('stat-exercises')).toHaveTextContent('Bài tập');
  });
});

// ========== TC_W304_06: Volume zero ==========

describe('Volume zero', () => {
  it('TC_W304_06: displays "—" when totalVolume is 0 (bodyweight)', () => {
    renderCard({ stats: { ...baseStats, totalVolume: 0 } });
    expect(screen.getByTestId('stat-volume')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-volume')).not.toHaveTextContent('0kg');
  });
});

// ========== TC_W304_07-09: PR Section ==========

describe('PR section', () => {
  it('TC_W304_07: hides PR section when no personalRecords', () => {
    renderCard();
    expect(screen.queryByTestId('pr-section')).not.toBeInTheDocument();
  });

  it('TC_W304_08: hides PR section when personalRecords is empty array', () => {
    renderCard({ personalRecords: [] });
    expect(screen.queryByTestId('pr-section')).not.toBeInTheDocument();
  });

  it('TC_W304_09: renders single PR with text-energy class and correct format', () => {
    renderCard({ personalRecords: [samplePR] });
    const section = screen.getByTestId('pr-section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveTextContent('Kỷ lục mới');

    const item = screen.getByTestId('pr-item');
    expect(item).toHaveTextContent('Bench Press');
    expect(item).toHaveTextContent('+5kg @ 5rep');
  });

  it('TC_W304_09b: renders multiple PRs', () => {
    const prs: PRDetection[] = [
      samplePR,
      {
        exerciseId: 'squat',
        exerciseName: 'Squat',
        newWeight: 120,
        previousWeight: 115,
        reps: 3,
        improvement: 5,
      },
    ];
    renderCard({ personalRecords: prs });
    const items = screen.getAllByTestId('pr-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Bench Press');
    expect(items[1]).toHaveTextContent('Squat');
    expect(items[1]).toHaveTextContent('+5kg @ 3rep');
  });
});

// ========== TC_W304_10-12: Streak Milestones ==========

describe('Streak milestones', () => {
  it('TC_W304_10: hides streak milestone when not provided', () => {
    renderCard();
    expect(screen.queryByTestId('streak-milestone')).not.toBeInTheDocument();
  });

  it('TC_W304_11: renders streak milestone for 7 days with 🏆 emoji', () => {
    renderCard({ streakMilestone: 7 });
    const el = screen.getByTestId('streak-milestone');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('🏆');
    expect(el).toHaveTextContent('🔥 Chuỗi 7 ngày liên tiếp!');
  });

  it('TC_W304_12: renders streak milestones for 14, 30, 60, 90', () => {
    for (const days of [14, 30, 60, 90]) {
      const { unmount } = renderCard({ streakMilestone: days });
      expect(screen.getByTestId('streak-milestone')).toHaveTextContent(`Chuỗi ${days} ngày liên tiếp!`);
      unmount();
    }
  });
});

// ========== TC_W304_13-15: Session Milestones ==========

describe('Session milestones', () => {
  it('TC_W304_13: hides session milestone when not provided', () => {
    renderCard();
    expect(screen.queryByTestId('session-milestone')).not.toBeInTheDocument();
  });

  it('TC_W304_14: renders session milestone for 1st workout with 🎯 emoji', () => {
    renderCard({ sessionMilestone: 1 });
    const el = screen.getByTestId('session-milestone');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('🎯');
    expect(el).toHaveTextContent('🎯 Buổi tập thứ 1!');
  });

  it('TC_W304_15: renders session milestones for 10, 25, 50, 100', () => {
    for (const count of [10, 25, 50, 100]) {
      const { unmount } = renderCard({ sessionMilestone: count });
      expect(screen.getByTestId('session-milestone')).toHaveTextContent(`Buổi tập thứ ${count}!`);
      unmount();
    }
  });
});

// ========== TC_W304_16-17: First Workout ==========

describe('First workout', () => {
  it('TC_W304_16: shows first workout message when isFirstWorkout is true', () => {
    renderCard({ isFirstWorkout: true });
    expect(screen.getByText('Chúc mừng buổi tập đầu tiên!')).toBeInTheDocument();
  });

  it('TC_W304_17: combined first workout + PRs + streak renders all', () => {
    renderCard({
      isFirstWorkout: true,
      personalRecords: [samplePR],
      streakMilestone: 7,
      sessionMilestone: 1,
    });
    expect(screen.getByText('Chúc mừng buổi tập đầu tiên!')).toBeInTheDocument();
    expect(screen.getByTestId('pr-section')).toBeInTheDocument();
    expect(screen.getByTestId('streak-milestone')).toBeInTheDocument();
    expect(screen.getByTestId('session-milestone')).toBeInTheDocument();
  });

  it('TC_W304_16b: hides first workout message when isFirstWorkout is false', () => {
    renderCard({ isFirstWorkout: false });
    expect(screen.queryByText('Chúc mừng buổi tập đầu tiên!')).not.toBeInTheDocument();
  });
});

// ========== TC_W304_18-20: Empty State ==========

describe('Empty state (0 totalSets)', () => {
  const emptyStats: WorkoutStats = { duration: 0, totalVolume: 0, totalSets: 0, exerciseCount: 0 };

  it('TC_W304_18: renders empty-workout container', () => {
    renderCard({ stats: emptyStats });
    expect(screen.getByTestId('empty-workout')).toBeInTheDocument();
    expect(screen.getByText('Buổi tập trống')).toBeInTheDocument();
  });

  it('TC_W304_19: empty state has NO save button and NO stats-grid', () => {
    renderCard({ stats: emptyStats });
    expect(screen.queryByTestId('btn-save-workout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stats-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('workout-completion-card')).not.toBeInTheDocument();
  });

  it('TC_W304_20: empty state has only discard button', () => {
    renderCard({ stats: emptyStats });
    const btn = screen.getByTestId('btn-discard-empty');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Bỏ qua');
  });

  it('TC_W304_20b: empty state discard button calls onDiscard', () => {
    const onDiscard = vi.fn();
    renderCard({ stats: emptyStats, onDiscard });
    fireEvent.click(screen.getByTestId('btn-discard-empty'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

// ========== TC_W304_21-22: Callbacks ==========

describe('Callbacks', () => {
  it('TC_W304_21: onSave is called when save button clicked', () => {
    const onSave = vi.fn();
    renderCard({ onSave });
    fireEvent.click(screen.getByTestId('btn-save-workout'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('TC_W304_22: onDiscard is called when discard button clicked', () => {
    const onDiscard = vi.fn();
    renderCard({ onDiscard });
    fireEvent.click(screen.getByTestId('btn-discard-workout'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

// ========== TC_W304_23: Animation ==========

describe('Animation', () => {
  it('TC_W304_23: container has animate-scale-in class', () => {
    renderCard();
    expect(screen.getByTestId('workout-completion-card').className).toContain('animate-scale-in');
  });
});

// ========== TC_W304_24-25: Button Styling ==========

describe('Button styling', () => {
  it('TC_W304_24: save button has min-h-12 bg-primary rounded-xl text-lg font-semibold', () => {
    renderCard();
    const btn = screen.getByTestId('btn-save-workout');
    const cls = btn.className;
    expect(cls).toContain('min-h-12');
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('rounded-xl');
    expect(cls).toContain('text-lg');
    expect(cls).toContain('font-semibold');
  });

  it('TC_W304_25: discard button has text-destructive class', () => {
    renderCard();
    expect(screen.getByTestId('btn-discard-workout').className).toContain('text-destructive');
  });
});

// ========== TC_W304_26-27: Layout ==========

describe('Layout', () => {
  it('TC_W304_26: container has max-w-sm class', () => {
    renderCard();
    expect(screen.getByTestId('workout-completion-card').className).toContain('max-w-sm');
  });

  it('TC_W304_27: stats grid has grid-cols-2 class', () => {
    renderCard();
    expect(screen.getByTestId('stats-grid').className).toContain('grid-cols-2');
  });
});

// ========== Additional edge cases ==========

describe('Edge cases', () => {
  it('renders trophy icon heading', () => {
    renderCard();
    expect(screen.getByText('Hoàn thành buổi tập!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Hoàn thành buổi tập!');
  });

  it('save button includes Save icon text', () => {
    renderCard();
    expect(screen.getByTestId('btn-save-workout')).toHaveTextContent('Lưu & đóng');
  });

  it('streak milestone has animate-scale-in', () => {
    renderCard({ streakMilestone: 30 });
    expect(screen.getByTestId('streak-milestone').className).toContain('animate-scale-in');
  });

  it('session milestone has animate-scale-in', () => {
    renderCard({ sessionMilestone: 50 });
    expect(screen.getByTestId('session-milestone').className).toContain('animate-scale-in');
  });
});

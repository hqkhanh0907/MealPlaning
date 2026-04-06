import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TrainingProfileSection } from '../features/fitness/components/TrainingProfileSection';
import type { TrainingProfile } from '../features/fitness/types';
import { useFitnessStore } from '../store/fitnessStore';

// ---------- helpers ----------

function buildProfile(overrides: Partial<TrainingProfile> = {}): TrainingProfile {
  return {
    id: 'profile-1',
    trainingGoal: 'strength',
    trainingExperience: 'beginner',
    daysPerWeek: 4,
    sessionDurationMin: 60,
    availableEquipment: ['barbell', 'dumbbell'],
    injuryRestrictions: [],
    periodizationModel: 'linear',
    planCycleWeeks: 8,
    priorityMuscles: [],
    cardioSessionsWeek: 2,
    cardioTypePref: 'mixed',
    cardioDurationMin: 30,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function seedBeginner(overrides: Partial<TrainingProfile> = {}): void {
  useFitnessStore.setState({ trainingProfile: buildProfile(overrides) });
}

function seedIntermediate(overrides: Partial<TrainingProfile> = {}): void {
  useFitnessStore.setState({
    trainingProfile: buildProfile({
      trainingExperience: 'intermediate',
      priorityMuscles: ['chest', 'back'],
      ...overrides,
    }),
  });
}

function seedAdvanced(overrides: Partial<TrainingProfile> = {}): void {
  useFitnessStore.setState({
    trainingProfile: buildProfile({
      trainingExperience: 'advanced',
      priorityMuscles: ['chest', 'back'],
      avgSleepHours: 7,
      ...overrides,
    }),
  });
}

afterEach(() => {
  cleanup();
  useFitnessStore.setState({ trainingProfile: null });
});

// ---------- 1. No profile ----------

describe('TrainingProfileSection – no profile', () => {
  it('shows "Chưa thiết lập" when profile is null', () => {
    render(<TrainingProfileSection />);
    expect(screen.getByText('Chưa thiết lập')).toBeInTheDocument();
  });
});

// ---------- 2. Beginner profile ----------

describe('TrainingProfileSection – beginner', () => {
  it('shows basic fields (goal, experience, days, duration, equipment, cardio)', () => {
    seedBeginner();
    render(<TrainingProfileSection />);

    expect(screen.getByText('Mục tiêu tập luyện')).toBeInTheDocument();
    expect(screen.getByText('Sức mạnh')).toBeInTheDocument();
    expect(screen.getByText('Trình độ')).toBeInTheDocument();
    expect(screen.getByText('Mới bắt đầu')).toBeInTheDocument();
    expect(screen.getByText('Số ngày tập/tuần')).toBeInTheDocument();
    expect(screen.getByText(/4\s*ngày\/tuần/)).toBeInTheDocument();
    expect(screen.getByText('Thời lượng buổi tập (phút)')).toBeInTheDocument();
    expect(screen.getByText(/60\s*phút/)).toBeInTheDocument();
    expect(screen.getByText('Thiết bị tập')).toBeInTheDocument();
    expect(screen.getByText('Tạ đòn, Tạ tay')).toBeInTheDocument();
    expect(screen.getByText('Số buổi cardio/tuần')).toBeInTheDocument();
    expect(screen.getByText(/2\s*buổi\/tuần/)).toBeInTheDocument();
  });

  it('does NOT show periodization field', () => {
    seedBeginner();
    render(<TrainingProfileSection />);
    expect(screen.queryByText('Mô hình phân kỳ')).not.toBeInTheDocument();
  });

  it('does NOT show cycle weeks field', () => {
    seedBeginner();
    render(<TrainingProfileSection />);
    expect(screen.queryByText('Số tuần một chu kỳ')).not.toBeInTheDocument();
  });

  it('does NOT show priority muscles field', () => {
    seedBeginner();
    render(<TrainingProfileSection />);
    expect(screen.queryByText('Nhóm cơ ưu tiên')).not.toBeInTheDocument();
  });

  it('does NOT show sleep hours field', () => {
    seedBeginner();
    render(<TrainingProfileSection />);
    expect(screen.queryByText('Giờ ngủ trung bình')).not.toBeInTheDocument();
  });
});

// ---------- 3. Intermediate profile ----------

describe('TrainingProfileSection – intermediate', () => {
  it('shows beginner fields + periodization + cycleWeeks + priorityMuscles', () => {
    seedIntermediate();
    render(<TrainingProfileSection />);

    // Basic fields still present
    expect(screen.getByText('Mục tiêu tập luyện')).toBeInTheDocument();
    expect(screen.getByText('Trình độ')).toBeInTheDocument();
    expect(screen.getByText('Trung cấp')).toBeInTheDocument();
    expect(screen.getByText('Số ngày tập/tuần')).toBeInTheDocument();
    expect(screen.getByText('Thời lượng buổi tập (phút)')).toBeInTheDocument();
    expect(screen.getByText('Thiết bị tập')).toBeInTheDocument();
    expect(screen.getByText('Số buổi cardio/tuần')).toBeInTheDocument();

    // Intermediate-level fields
    expect(screen.getByText('Mô hình phân kỳ')).toBeInTheDocument();
    expect(screen.getByText('Tuyến tính')).toBeInTheDocument();
    expect(screen.getByText('Số tuần một chu kỳ')).toBeInTheDocument();
    expect(screen.getByText(/8\s*tuần/)).toBeInTheDocument();
    expect(screen.getByText('Nhóm cơ ưu tiên')).toBeInTheDocument();
    expect(screen.getByText('Ngực, Lưng')).toBeInTheDocument();
  });

  it('does NOT show sleep hours', () => {
    seedIntermediate();
    render(<TrainingProfileSection />);
    expect(screen.queryByText('Giờ ngủ trung bình')).not.toBeInTheDocument();
  });
});

// ---------- 4. Advanced profile ----------

describe('TrainingProfileSection – advanced', () => {
  it('shows all fields including sleep hours', () => {
    seedAdvanced();
    render(<TrainingProfileSection />);

    // Basic fields
    expect(screen.getByText('Mục tiêu tập luyện')).toBeInTheDocument();
    expect(screen.getByText('Trình độ')).toBeInTheDocument();
    expect(screen.getByText('Nâng cao')).toBeInTheDocument();
    expect(screen.getByText('Số ngày tập/tuần')).toBeInTheDocument();
    expect(screen.getByText('Thời lượng buổi tập (phút)')).toBeInTheDocument();
    expect(screen.getByText('Thiết bị tập')).toBeInTheDocument();
    expect(screen.getByText('Số buổi cardio/tuần')).toBeInTheDocument();

    // Intermediate-level fields
    expect(screen.getByText('Mô hình phân kỳ')).toBeInTheDocument();
    expect(screen.getByText('Số tuần một chu kỳ')).toBeInTheDocument();
    expect(screen.getByText('Nhóm cơ ưu tiên')).toBeInTheDocument();

    // Advanced-only field
    expect(screen.getByText('Giờ ngủ trung bình')).toBeInTheDocument();
    expect(screen.getByText('7h')).toBeInTheDocument();
  });
});

// ---------- 5. Conditional display ----------

describe('TrainingProfileSection – conditional display', () => {
  it('shows injury restrictions when array is non-empty', () => {
    seedBeginner({ injuryRestrictions: ['knees', 'lower_back'] });
    render(<TrainingProfileSection />);
    expect(screen.getByText('Vùng chấn thương')).toBeInTheDocument();
    expect(screen.getByText('Đầu gối, Lưng dưới')).toBeInTheDocument();
  });

  it('does NOT show injury field when array is empty', () => {
    seedBeginner({ injuryRestrictions: [] });
    render(<TrainingProfileSection />);
    expect(screen.queryByText('Vùng chấn thương')).not.toBeInTheDocument();
  });

  it('shows priority muscles only when visible AND non-empty', () => {
    seedIntermediate({ priorityMuscles: ['shoulders', 'legs'] });
    render(<TrainingProfileSection />);
    expect(screen.getByText('Nhóm cơ ưu tiên')).toBeInTheDocument();
    expect(screen.getByText('Vai, Chân')).toBeInTheDocument();
  });

  it('hides priority muscles when visible but empty', () => {
    seedIntermediate({ priorityMuscles: [] });
    render(<TrainingProfileSection />);
    expect(screen.queryByText('Nhóm cơ ưu tiên')).not.toBeInTheDocument();
  });

  it('shows sleep hours only when visible AND value exists', () => {
    seedAdvanced({ avgSleepHours: 8 });
    render(<TrainingProfileSection />);
    expect(screen.getByText('Giờ ngủ trung bình')).toBeInTheDocument();
    expect(screen.getByText('8h')).toBeInTheDocument();
  });

  it('hides sleep hours when visible but value is undefined', () => {
    seedAdvanced({ avgSleepHours: undefined });
    render(<TrainingProfileSection />);
    expect(screen.queryByText('Giờ ngủ trung bình')).not.toBeInTheDocument();
  });
});

// ---------- 6. Vietnamese labels ----------

describe('TrainingProfileSection – Vietnamese labels', () => {
  it('displays Vietnamese goal label', () => {
    seedBeginner({ trainingGoal: 'strength' });
    render(<TrainingProfileSection />);
    expect(screen.getByText('Sức mạnh')).toBeInTheDocument();
  });

  it('displays Vietnamese experience label', () => {
    seedAdvanced();
    render(<TrainingProfileSection />);
    expect(screen.getByText('Nâng cao')).toBeInTheDocument();
  });

  it('displays Vietnamese periodization label', () => {
    seedIntermediate({ periodizationModel: 'linear' });
    render(<TrainingProfileSection />);
    expect(screen.getByText('Tuyến tính')).toBeInTheDocument();
  });
});

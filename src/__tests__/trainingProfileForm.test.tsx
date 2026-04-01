import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import React, { createRef } from 'react';
import { TrainingProfileForm } from '../features/fitness/components/TrainingProfileForm';
import { useFitnessStore } from '../store/fitnessStore';
import type { TrainingProfile } from '../features/fitness/types';

// ---------- helpers ----------

/** Build a full TrainingProfile object for store seeding. */
function buildProfile(overrides: Partial<TrainingProfile> = {}): TrainingProfile {
  return {
    id: 'profile-1',
    trainingGoal: 'strength',
    trainingExperience: 'advanced',
    daysPerWeek: 5,
    sessionDurationMin: 90,
    availableEquipment: ['barbell', 'cable'],
    injuryRestrictions: ['knees'],
    cardioSessionsWeek: 1,
    periodizationModel: 'block',
    planCycleWeeks: 12,
    priorityMuscles: ['chest', 'back'],
    avgSleepHours: 7,
    cardioTypePref: 'hiit',
    cardioDurationMin: 25,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  // Reset zustand store to initial state between tests
  useFitnessStore.setState({ trainingProfile: null });
});

// ---------- 1. Rendering ----------

describe('TrainingProfileForm – rendering', () => {
  it('renders the form container with data-testid', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('training-profile-form')).toBeInTheDocument();
  });

  it('renders all form section labels', () => {
    render(<TrainingProfileForm />);

    // Section labels (Vietnamese from i18n)
    expect(screen.getByText('Mục tiêu tập luyện')).toBeInTheDocument();
    expect(screen.getByText('Trình độ')).toBeInTheDocument();
    expect(screen.getByText('Số ngày tập/tuần')).toBeInTheDocument();
    expect(screen.getByText('Thời lượng buổi tập (phút)')).toBeInTheDocument();
    expect(screen.getByText('Thiết bị tập')).toBeInTheDocument();
    expect(screen.getByText('Vùng chấn thương')).toBeInTheDocument();
    expect(screen.getByText('Số buổi cardio/tuần')).toBeInTheDocument();
    expect(screen.getByText('Mô hình phân kỳ')).toBeInTheDocument();
    expect(screen.getByText('Số tuần một chu kỳ')).toBeInTheDocument();
    expect(screen.getByText('Giờ ngủ trung bình')).toBeInTheDocument();
  });

  it('renders priority muscles label with max-items count', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByText(/Nhóm cơ ưu tiên.*tối đa 3/)).toBeInTheDocument();
  });

  it('renders all training goal options', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('goal-strength')).toBeInTheDocument();
    expect(screen.getByTestId('goal-hypertrophy')).toBeInTheDocument();
    expect(screen.getByTestId('goal-endurance')).toBeInTheDocument();
    expect(screen.getByTestId('goal-general')).toBeInTheDocument();
  });

  it('renders all experience options', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('experience-beginner')).toBeInTheDocument();
    expect(screen.getByTestId('experience-intermediate')).toBeInTheDocument();
    expect(screen.getByTestId('experience-advanced')).toBeInTheDocument();
  });

  it('renders days-per-week options (2–6)', () => {
    render(<TrainingProfileForm />);
    [2, 3, 4, 5, 6].forEach((d) => {
      expect(screen.getByTestId(`days-${d}`)).toBeInTheDocument();
    });
  });

  it('renders session duration options', () => {
    render(<TrainingProfileForm />);
    [30, 45, 60, 90].forEach((d) => {
      expect(screen.getByTestId(`duration-${d}`)).toBeInTheDocument();
    });
  });

  it('renders equipment chip options', () => {
    render(<TrainingProfileForm />);
    ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands'].forEach((eq) => {
      expect(screen.getByTestId(`equipment-${eq}`)).toBeInTheDocument();
    });
  });

  it('renders injury chip options', () => {
    render(<TrainingProfileForm />);
    ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'].forEach((inj) => {
      expect(screen.getByTestId(`injury-${inj}`)).toBeInTheDocument();
    });
  });

  it('renders cardio session options (0–5)', () => {
    render(<TrainingProfileForm />);
    [0, 1, 2, 3, 4, 5].forEach((c) => {
      expect(screen.getByTestId(`cardio-${c}`)).toBeInTheDocument();
    });
  });

  it('renders periodization options', () => {
    render(<TrainingProfileForm />);
    ['linear', 'undulating', 'block'].forEach((p) => {
      expect(screen.getByTestId(`periodization-${p}`)).toBeInTheDocument();
    });
  });

  it('renders cycle weeks options', () => {
    render(<TrainingProfileForm />);
    [4, 6, 8, 12].forEach((w) => {
      expect(screen.getByTestId(`cycle-weeks-${w}`)).toBeInTheDocument();
    });
  });

  it('renders priority muscles chip options', () => {
    render(<TrainingProfileForm />);
    ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'].forEach((m) => {
      expect(screen.getByTestId(`priority-muscles-${m}`)).toBeInTheDocument();
    });
  });

  it('renders sleep hours input', () => {
    render(<TrainingProfileForm />);
    const input = screen.getByTestId('sleep-hours-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '3');
    expect(input).toHaveAttribute('max', '12');
    expect(input).toHaveAttribute('step', '0.5');
  });
});

// ---------- 2. Default values ----------

describe('TrainingProfileForm – default values (no store profile)', () => {
  it('selects hypertrophy as default goal', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('goal-hypertrophy')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('goal-strength')).toHaveAttribute('aria-checked', 'false');
  });

  it('selects beginner as default experience', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('experience-beginner')).toHaveAttribute('aria-checked', 'true');
  });

  it('selects 3 days per week by default', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('days-3')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('days-5')).toHaveAttribute('aria-checked', 'false');
  });

  it('selects 60 min session duration by default', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('duration-60')).toHaveAttribute('aria-checked', 'true');
  });

  it('selects bodyweight and dumbbell equipment by default', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('equipment-bodyweight')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('equipment-dumbbell')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('equipment-barbell')).toHaveAttribute('aria-checked', 'false');
  });

  it('has no injury restrictions by default', () => {
    render(<TrainingProfileForm />);
    ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'].forEach((inj) => {
      expect(screen.getByTestId(`injury-${inj}`)).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('selects 2 cardio sessions by default', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('cardio-2')).toHaveAttribute('aria-checked', 'true');
  });

  it('selects linear periodization by default', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('periodization-linear')).toHaveAttribute('aria-checked', 'true');
  });

  it('selects 8 week cycle by default', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('cycle-weeks-8')).toHaveAttribute('aria-checked', 'true');
  });

  it('has no priority muscles selected by default', () => {
    render(<TrainingProfileForm />);
    ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'].forEach((m) => {
      expect(screen.getByTestId(`priority-muscles-${m}`)).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('has empty sleep hours input by default', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('sleep-hours-input')).toHaveValue(null);
  });
});

// ---------- 3. Pre-fill from store ----------

describe('TrainingProfileForm – pre-fill from store profile', () => {
  beforeEach(() => {
    useFitnessStore.setState({ trainingProfile: buildProfile() });
  });

  it('pre-fills training goal from store', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('goal-strength')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('goal-hypertrophy')).toHaveAttribute('aria-checked', 'false');
  });

  it('pre-fills experience from store', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('experience-advanced')).toHaveAttribute('aria-checked', 'true');
  });

  it('pre-fills days per week from store (numeric → string)', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('days-5')).toHaveAttribute('aria-checked', 'true');
  });

  it('pre-fills session duration from store (numeric → string)', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('duration-90')).toHaveAttribute('aria-checked', 'true');
  });

  it('pre-fills equipment from store', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('equipment-barbell')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('equipment-cable')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('equipment-dumbbell')).toHaveAttribute('aria-checked', 'false');
  });

  it('pre-fills injury restrictions from store', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('injury-knees')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('injury-shoulders')).toHaveAttribute('aria-checked', 'false');
  });

  it('pre-fills cardio sessions from store', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('cardio-1')).toHaveAttribute('aria-checked', 'true');
  });

  it('pre-fills periodization model from store', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('periodization-block')).toHaveAttribute('aria-checked', 'true');
  });

  it('pre-fills cycle weeks from store', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('cycle-weeks-12')).toHaveAttribute('aria-checked', 'true');
  });

  it('pre-fills priority muscles from store', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('priority-muscles-chest')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('priority-muscles-back')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('priority-muscles-legs')).toHaveAttribute('aria-checked', 'false');
  });

  it('pre-fills sleep hours from store', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('sleep-hours-input')).toHaveValue(7);
  });
});

// ---------- 4. RadioPills interaction ----------

describe('TrainingProfileForm – RadioPills interactions', () => {
  it('changes training goal when a different pill is clicked', async () => {
    render(<TrainingProfileForm />);
    expect(screen.getByTestId('goal-hypertrophy')).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByTestId('goal-strength'));

    await waitFor(() => {
      expect(screen.getByTestId('goal-strength')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('goal-hypertrophy')).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('changes experience level', async () => {
    render(<TrainingProfileForm />);
    fireEvent.click(screen.getByTestId('experience-advanced'));

    await waitFor(() => {
      expect(screen.getByTestId('experience-advanced')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('experience-beginner')).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('changes days per week', async () => {
    render(<TrainingProfileForm />);
    fireEvent.click(screen.getByTestId('days-6'));

    await waitFor(() => {
      expect(screen.getByTestId('days-6')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('days-3')).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('changes session duration', async () => {
    render(<TrainingProfileForm />);
    fireEvent.click(screen.getByTestId('duration-45'));

    await waitFor(() => {
      expect(screen.getByTestId('duration-45')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('duration-60')).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('changes cardio sessions', async () => {
    render(<TrainingProfileForm />);
    fireEvent.click(screen.getByTestId('cardio-4'));

    await waitFor(() => {
      expect(screen.getByTestId('cardio-4')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('cardio-2')).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('changes periodization model', async () => {
    render(<TrainingProfileForm />);
    fireEvent.click(screen.getByTestId('periodization-undulating'));

    await waitFor(() => {
      expect(screen.getByTestId('periodization-undulating')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('periodization-linear')).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('changes plan cycle weeks', async () => {
    render(<TrainingProfileForm />);
    fireEvent.click(screen.getByTestId('cycle-weeks-4'));

    await waitFor(() => {
      expect(screen.getByTestId('cycle-weeks-4')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('cycle-weeks-8')).toHaveAttribute('aria-checked', 'false');
    });
  });
});

// ---------- 5. ChipSelect interactions ----------

describe('TrainingProfileForm – ChipSelect interactions', () => {
  it('toggles equipment chip on and off', async () => {
    render(<TrainingProfileForm />);
    const barbellChip = screen.getByTestId('equipment-barbell');
    expect(barbellChip).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(barbellChip);
    await waitFor(() => {
      expect(barbellChip).toHaveAttribute('aria-checked', 'true');
    });

    fireEvent.click(barbellChip);
    await waitFor(() => {
      expect(barbellChip).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('toggles injury restrictions', async () => {
    render(<TrainingProfileForm />);
    const shouldersChip = screen.getByTestId('injury-shoulders');
    expect(shouldersChip).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(shouldersChip);
    await waitFor(() => {
      expect(shouldersChip).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('allows selecting multiple priority muscles up to max 3', async () => {
    render(<TrainingProfileForm />);

    fireEvent.click(screen.getByTestId('priority-muscles-chest'));
    fireEvent.click(screen.getByTestId('priority-muscles-back'));
    fireEvent.click(screen.getByTestId('priority-muscles-legs'));

    await waitFor(() => {
      expect(screen.getByTestId('priority-muscles-chest')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('priority-muscles-back')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('priority-muscles-legs')).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('blocks 4th priority muscle selection (max 3)', async () => {
    render(<TrainingProfileForm />);

    fireEvent.click(screen.getByTestId('priority-muscles-chest'));
    fireEvent.click(screen.getByTestId('priority-muscles-back'));
    fireEvent.click(screen.getByTestId('priority-muscles-legs'));

    await waitFor(() => {
      expect(screen.getByTestId('priority-muscles-legs')).toHaveAttribute('aria-checked', 'true');
    });

    // Try selecting a 4th muscle — should be blocked by ChipSelect maxItems
    fireEvent.click(screen.getByTestId('priority-muscles-arms'));
    await waitFor(() => {
      expect(screen.getByTestId('priority-muscles-arms')).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('allows deselecting a muscle after hitting max and selecting a new one', async () => {
    render(<TrainingProfileForm />);

    fireEvent.click(screen.getByTestId('priority-muscles-chest'));
    fireEvent.click(screen.getByTestId('priority-muscles-back'));
    fireEvent.click(screen.getByTestId('priority-muscles-legs'));

    await waitFor(() => {
      expect(screen.getByTestId('priority-muscles-legs')).toHaveAttribute('aria-checked', 'true');
    });

    // Deselect one
    fireEvent.click(screen.getByTestId('priority-muscles-chest'));
    await waitFor(() => {
      expect(screen.getByTestId('priority-muscles-chest')).toHaveAttribute('aria-checked', 'false');
    });

    // Now a 4th (actually 3rd) should be allowed
    fireEvent.click(screen.getByTestId('priority-muscles-arms'));
    await waitFor(() => {
      expect(screen.getByTestId('priority-muscles-arms')).toHaveAttribute('aria-checked', 'true');
    });
  });
});

// ---------- 6. Sleep hours input ----------

describe('TrainingProfileForm – sleep hours input', () => {
  it('accepts a valid number', () => {
    render(<TrainingProfileForm />);
    const input = screen.getByTestId('sleep-hours-input');
    fireEvent.change(input, { target: { value: '8' } });
    expect(input).toHaveValue(8);
  });

  it('accepts decimal values', () => {
    render(<TrainingProfileForm />);
    const input = screen.getByTestId('sleep-hours-input');
    fireEvent.change(input, { target: { value: '7.5' } });
    expect(input).toHaveValue(7.5);
  });
});

// ---------- 7. saveRef & embedded mode ----------

describe('TrainingProfileForm – embedded mode & saveRef', () => {
  it('applies embedded CSS class (no p-4)', () => {
    render(<TrainingProfileForm embedded />);
    const form = screen.getByTestId('training-profile-form');
    expect(form.className).toContain('space-y-6');
    expect(form.className).not.toContain('p-4');
  });

  it('applies non-embedded CSS class (with p-4)', () => {
    render(<TrainingProfileForm />);
    const form = screen.getByTestId('training-profile-form');
    expect(form.className).toContain('p-4');
  });

  it('assigns handleSave to saveRef.current', () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);
    expect(saveRef.current).toBeInstanceOf(Function);
  });

  it('saveRef.current() returns true on valid default form', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    const result = await saveRef.current!();
    expect(result).toBe(true);
  });

  it('saveRef.current() persists profile to zustand store', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    await saveRef.current!();

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored).not.toBeNull();
    expect(stored!.trainingGoal).toBe('hypertrophy');
    expect(stored!.trainingExperience).toBe('beginner');
    expect(stored!.daysPerWeek).toBe(3);
    expect(stored!.sessionDurationMin).toBe(60);
    expect(stored!.periodizationModel).toBe('linear');
    expect(stored!.planCycleWeeks).toBe(8);
    expect(stored!.cardioSessionsWeek).toBe(2);
  });

  it('saveRef.current() coerces string RadioPills values to numbers', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    // Change some values
    fireEvent.click(screen.getByTestId('days-6'));
    fireEvent.click(screen.getByTestId('duration-30'));
    fireEvent.click(screen.getByTestId('cardio-5'));
    fireEvent.click(screen.getByTestId('cycle-weeks-4'));

    await waitFor(() => {
      expect(screen.getByTestId('days-6')).toHaveAttribute('aria-checked', 'true');
    });

    await saveRef.current!();

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored).not.toBeNull();
    // All coerced to number
    expect(stored!.daysPerWeek).toBe(6);
    expect(typeof stored!.daysPerWeek).toBe('number');
    expect(stored!.sessionDurationMin).toBe(30);
    expect(typeof stored!.sessionDurationMin).toBe('number');
    expect(stored!.cardioSessionsWeek).toBe(5);
    expect(typeof stored!.cardioSessionsWeek).toBe('number');
    expect(stored!.planCycleWeeks).toBe(4);
    expect(typeof stored!.planCycleWeeks).toBe('number');
  });

  it('saveRef.current() saves sleep hours as number', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);
    fireEvent.change(screen.getByTestId('sleep-hours-input'), { target: { value: '8.5' } });

    await saveRef.current!();

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored!.avgSleepHours).toBe(8.5);
  });

  it('saveRef.current() saves equipment and muscle arrays', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    // Select extra equipment
    fireEvent.click(screen.getByTestId('equipment-barbell'));
    // Select priority muscles
    fireEvent.click(screen.getByTestId('priority-muscles-chest'));
    fireEvent.click(screen.getByTestId('priority-muscles-back'));

    await waitFor(() => {
      expect(screen.getByTestId('equipment-barbell')).toHaveAttribute('aria-checked', 'true');
    });

    await saveRef.current!();

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored!.availableEquipment).toContain('barbell');
    expect(stored!.availableEquipment).toContain('bodyweight');
    expect(stored!.availableEquipment).toContain('dumbbell');
    expect(stored!.priorityMuscles).toEqual(['chest', 'back']);
  });

  it('preserves existing profile id on re-save', async () => {
    useFitnessStore.setState({ trainingProfile: buildProfile({ id: 'existing-id' }) });

    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    await saveRef.current!();

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored!.id).toBe('existing-id');
  });

  it('preserves non-form fields (cardioTypePref, cardioDurationMin, known1rm)', async () => {
    useFitnessStore.setState({
      trainingProfile: buildProfile({
        cardioTypePref: 'liss',
        cardioDurationMin: 30,
        known1rm: { squat: 120 },
      }),
    });

    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);
    await saveRef.current!();

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored!.cardioTypePref).toBe('liss');
    expect(stored!.cardioDurationMin).toBe(30);
    expect(stored!.known1rm).toEqual({ squat: 120 });
  });

  it('generates new UUID when no existing profile', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);
    await saveRef.current!();

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored!.id).toBeTruthy();
    expect(typeof stored!.id).toBe('string');
    expect(stored!.id.length).toBeGreaterThan(0);
  });

  it('sets updatedAt timestamp on save', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    const before = new Date().toISOString();
    render(<TrainingProfileForm embedded saveRef={saveRef} />);
    await saveRef.current!();
    const after = new Date().toISOString();

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored!.updatedAt >= before).toBe(true);
    expect(stored!.updatedAt <= after).toBe(true);
  });
});

// ---------- 8. Validation errors ----------

describe('TrainingProfileForm – validation via saveRef', () => {
  it('saveRef.current() returns false when sleep hours is out of range (too low)', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    fireEvent.change(screen.getByTestId('sleep-hours-input'), { target: { value: '1' } });
    // Trigger blur to activate onBlur validation
    fireEvent.blur(screen.getByTestId('sleep-hours-input'));

    const result = await saveRef.current!();
    expect(result).toBe(false);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('saveRef.current() returns false when sleep hours is too high', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    fireEvent.change(screen.getByTestId('sleep-hours-input'), { target: { value: '15' } });
    fireEvent.blur(screen.getByTestId('sleep-hours-input'));

    const result = await saveRef.current!();
    expect(result).toBe(false);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('displays Vietnamese error message for sleep hours below minimum', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    fireEvent.change(screen.getByTestId('sleep-hours-input'), { target: { value: '2' } });

    await saveRef.current!();

    await waitFor(() => {
      expect(screen.getByText('Giờ ngủ tối thiểu là 3')).toBeInTheDocument();
    });
  });

  it('displays Vietnamese error message for sleep hours above maximum', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    fireEvent.change(screen.getByTestId('sleep-hours-input'), { target: { value: '13' } });

    await saveRef.current!();

    await waitFor(() => {
      expect(screen.getByText('Giờ ngủ tối đa là 12')).toBeInTheDocument();
    });
  });

  it('succeeds when sleep hours is left empty (optional field)', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    const result = await saveRef.current!();
    expect(result).toBe(true);

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored!.avgSleepHours).toBeUndefined();
  });

  it('succeeds with sleep hours at minimum boundary (3)', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    fireEvent.change(screen.getByTestId('sleep-hours-input'), { target: { value: '3' } });

    const result = await saveRef.current!();
    expect(result).toBe(true);
  });

  it('succeeds with sleep hours at maximum boundary (12)', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    fireEvent.change(screen.getByTestId('sleep-hours-input'), { target: { value: '12' } });

    const result = await saveRef.current!();
    expect(result).toBe(true);
  });
});

// ---------- 9. Full save flow with custom selections ----------

describe('TrainingProfileForm – full save flow', () => {
  it('saves a fully customized form via saveRef', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    // Goal
    fireEvent.click(screen.getByTestId('goal-endurance'));
    // Experience
    fireEvent.click(screen.getByTestId('experience-intermediate'));
    // Days
    fireEvent.click(screen.getByTestId('days-4'));
    // Duration
    fireEvent.click(screen.getByTestId('duration-45'));
    // Equipment: deselect defaults, select new ones
    fireEvent.click(screen.getByTestId('equipment-bodyweight')); // deselect
    fireEvent.click(screen.getByTestId('equipment-dumbbell'));   // deselect
    fireEvent.click(screen.getByTestId('equipment-machine'));
    fireEvent.click(screen.getByTestId('equipment-cable'));
    // Injuries
    fireEvent.click(screen.getByTestId('injury-lower_back'));
    fireEvent.click(screen.getByTestId('injury-wrists'));
    // Cardio
    fireEvent.click(screen.getByTestId('cardio-3'));
    // Periodization
    fireEvent.click(screen.getByTestId('periodization-undulating'));
    // Cycle weeks
    fireEvent.click(screen.getByTestId('cycle-weeks-6'));
    // Priority muscles
    fireEvent.click(screen.getByTestId('priority-muscles-legs'));
    fireEvent.click(screen.getByTestId('priority-muscles-glutes'));
    fireEvent.click(screen.getByTestId('priority-muscles-core'));
    // Sleep
    fireEvent.change(screen.getByTestId('sleep-hours-input'), { target: { value: '7' } });

    await waitFor(() => {
      expect(screen.getByTestId('goal-endurance')).toHaveAttribute('aria-checked', 'true');
    });

    const result = await saveRef.current!();
    expect(result).toBe(true);

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored).not.toBeNull();
    expect(stored!.trainingGoal).toBe('endurance');
    expect(stored!.trainingExperience).toBe('intermediate');
    expect(stored!.daysPerWeek).toBe(4);
    expect(stored!.sessionDurationMin).toBe(45);
    expect(stored!.availableEquipment).toEqual(['machine', 'cable']);
    expect(stored!.injuryRestrictions).toEqual(['lower_back', 'wrists']);
    expect(stored!.cardioSessionsWeek).toBe(3);
    expect(stored!.periodizationModel).toBe('undulating');
    expect(stored!.planCycleWeeks).toBe(6);
    expect(stored!.priorityMuscles).toEqual(['legs', 'glutes', 'core']);
    expect(stored!.avgSleepHours).toBe(7);
  });

  it('sets default non-form fields when no previous profile exists', async () => {
    const saveRef = createRef<(() => Promise<boolean>) | null>() as React.MutableRefObject<
      (() => Promise<boolean>) | null
    >;
    saveRef.current = null;

    render(<TrainingProfileForm embedded saveRef={saveRef} />);
    await saveRef.current!();

    const stored = useFitnessStore.getState().trainingProfile;
    expect(stored!.cardioTypePref).toBe('mixed');
    expect(stored!.cardioDurationMin).toBe(20);
    expect(stored!.known1rm).toBeUndefined();
  });
});

// ---------- 10. Equipment display labels ----------

describe('TrainingProfileForm – equipment display labels', () => {
  it('shows English equipment names from EQUIPMENT_DISPLAY constant', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByText('Barbell')).toBeInTheDocument();
    expect(screen.getByText('Dumbbell')).toBeInTheDocument();
    expect(screen.getByText('Machine')).toBeInTheDocument();
    expect(screen.getByText('Cable')).toBeInTheDocument();
    expect(screen.getByText('Bodyweight')).toBeInTheDocument();
    expect(screen.getByText('Bands')).toBeInTheDocument();
  });
});

// ---------- 11. i18n labels for RadioPills options ----------

describe('TrainingProfileForm – i18n option labels', () => {
  it('renders Vietnamese goal labels', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByText('Sức mạnh')).toBeInTheDocument();
    expect(screen.getByText('Phát triển cơ')).toBeInTheDocument();
    expect(screen.getByText('Sức bền')).toBeInTheDocument();
    expect(screen.getByText('Tổng hợp')).toBeInTheDocument();
  });

  it('renders Vietnamese experience labels', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByText('Mới bắt đầu')).toBeInTheDocument();
    expect(screen.getByText('Trung cấp')).toBeInTheDocument();
    expect(screen.getByText('Nâng cao')).toBeInTheDocument();
  });

  it('renders Vietnamese injury labels', () => {
    render(<TrainingProfileForm />);
    // "Vai" appears in both injury and priority-muscles sections
    const injuryGroup = screen.getByTestId('injury-shoulders');
    expect(injuryGroup).toHaveTextContent('Vai');
    expect(screen.getByText('Lưng dưới')).toBeInTheDocument();
    expect(screen.getByText('Đầu gối')).toBeInTheDocument();
    expect(screen.getByText('Cổ tay')).toBeInTheDocument();
    expect(screen.getByText('Hông')).toBeInTheDocument();
  });

  it('renders Vietnamese periodization labels', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByText('Tuyến tính')).toBeInTheDocument();
    expect(screen.getByText('Dao động')).toBeInTheDocument();
    expect(screen.getByText('Theo khối')).toBeInTheDocument();
  });

  it('renders Vietnamese muscle labels', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByText('Ngực')).toBeInTheDocument();
    expect(screen.getByText('Lưng')).toBeInTheDocument();
    expect(screen.getByText('Chân')).toBeInTheDocument();
    expect(screen.getByText('Tay')).toBeInTheDocument();
    expect(screen.getByText('Bụng')).toBeInTheDocument();
    expect(screen.getByText('Mông')).toBeInTheDocument();
  });

  it('renders duration labels with "phút" unit', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByText('30 phút')).toBeInTheDocument();
    expect(screen.getByText('45 phút')).toBeInTheDocument();
    expect(screen.getByText('60 phút')).toBeInTheDocument();
    expect(screen.getByText('90 phút')).toBeInTheDocument();
  });

  it('renders cycle weeks labels with "tuần" unit', () => {
    render(<TrainingProfileForm />);
    expect(screen.getByText('4 tuần')).toBeInTheDocument();
    expect(screen.getByText('6 tuần')).toBeInTheDocument();
    expect(screen.getByText('8 tuần')).toBeInTheDocument();
    expect(screen.getByText('12 tuần')).toBeInTheDocument();
  });
});

// ---------- 12. Radiogroup/group accessibility roles ----------

describe('TrainingProfileForm – accessibility roles', () => {
  it('renders groups for all fieldset-based fields', () => {
    render(<TrainingProfileForm />);
    const groups = screen.getAllByRole('group');
    // RadioPills fieldsets (7) + ChipSelect fieldsets (3) = 10
    expect(groups.length).toBe(10);
  });

  it('RadioPills options have role=radio', () => {
    render(<TrainingProfileForm />);
    const radios = screen.getAllByRole('radio');
    // goals(4) + exp(3) + days(5) + duration(4) + cardio(6) + periodization(3) + cycleWeeks(4) = 29
    expect(radios.length).toBe(29);
  });

  it('ChipSelect options have role=checkbox', () => {
    render(<TrainingProfileForm />);
    const checkboxes = screen.getAllByRole('checkbox');
    // equipment(7) + injuries(6) + muscles(7) = 20
    expect(checkboxes.length).toBe(20);
  });
});

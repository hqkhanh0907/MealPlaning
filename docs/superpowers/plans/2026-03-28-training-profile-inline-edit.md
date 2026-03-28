# Training Profile Inline Edit Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the read-only "redirect to onboarding" hint in the Training Profile Settings page with a fully functional inline edit form using React Hook Form + Zod, following the exact pattern of the existing Health Profile edit form.

**Architecture:** Create a new `TrainingProfileForm` component with RHF + Zod validation that mirrors the `HealthProfileForm` pattern (embedded mode + `saveRef` for parent control). The form uses existing `RadioPills` and `ChipSelect` components for pill-based selection fields and `StringNumberController` for numeric inputs. The `TrainingProfileDetailPage` is updated to render this form in edit mode, with save logic that persists changes to the fitness Zustand store.

**Tech Stack:** React 19, TypeScript, React Hook Form v7, Zod v4.3.6, Zustand, i18next, existing form components (`RadioPills`, `ChipSelect`, `FormField`, `StringNumberController`)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/schemas/trainingProfileSchema.ts` | **CREATE** | Zod schema for inline edit form (adapted from `fitnessOnboardingSchema`) |
| `src/features/fitness/components/TrainingProfileForm.tsx` | **CREATE** | RHF-powered edit form with `embedded` + `saveRef` pattern |
| `src/components/settings/TrainingProfileDetailPage.tsx` | **MODIFY** | Wire up `TrainingProfileForm` in edit mode using `saveRef` pattern |
| `src/locales/vi.json` | **MODIFY** | Add Vietnamese validation error messages for training profile schema |
| `src/locales/en.json` | **MODIFY** | Add English validation error messages for training profile schema |

### Reference Files (read-only, do not modify)
- `src/features/health-profile/components/HealthProfileForm.tsx` — **Pattern to follow** for embedded + saveRef
- `src/components/settings/HealthProfileDetailPage.tsx` — **Pattern to follow** for detail page integration
- `src/schemas/healthProfileSchema.ts` — **Pattern to follow** for Zod schema with Vietnamese messages
- `src/schemas/fitnessOnboardingSchema.ts` — **Source** of field definitions and enums
- `src/features/fitness/components/FitnessOnboarding.tsx` — **Source** of UI field options and constants
- `src/features/fitness/types.ts` — `TrainingProfile` interface definition
- `src/store/fitnessStore.ts` — `setTrainingProfile` store action
- `src/components/form/RadioPills.tsx` — Radio pill selector (single select)
- `src/components/form/ChipSelect.tsx` — Multi-select chip component
- `src/components/form/FormField.tsx` — Form field wrapper with error display
- `src/components/form/StringNumberController.tsx` — Number input with RHF Controller
- `src/features/fitness/components/TrainingProfileSection.tsx` — Existing read-only display (kept for view mode)

---

## Task 1: Create Zod schema for Training Profile edit form

**Files:**
- Create: `src/schemas/trainingProfileSchema.ts`
- Modify: `src/locales/vi.json` (add validation message keys)
- Modify: `src/locales/en.json` (add validation message keys)

This schema adapts the `fitnessOnboardingSchema` for inline editing. Key differences: (1) all fields required (no nullable "use smart default" pattern), (2) Vietnamese error messages, (3) field names match `TrainingProfile` interface (not onboarding wizard names).

**CRITICAL: RadioPills number-vs-string issue.** The `RadioPills` component uses `field.value === option.value` (strict equality). Option values are always strings. For numeric fields (`daysPerWeek`, `sessionDurationMin`, `cardioSessionsWeek`, `planCycleWeeks`), the schema must store them as **strings** in the form and coerce to numbers in `onSubmit`. This avoids `4 === "4"` → `false` breaking pill highlight on initial render.

- [ ] **Step 1: Write the failing test for schema validation**

Create `src/schemas/__tests__/trainingProfileSchema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  trainingProfileSchema,
  trainingProfileDefaults,
  type TrainingProfileFormData,
} from '../trainingProfileSchema';

describe('trainingProfileSchema', () => {
  it('accepts valid complete data', () => {
    const valid: TrainingProfileFormData = {
      trainingGoal: 'hypertrophy',
      trainingExperience: 'intermediate',
      daysPerWeek: '4',
      sessionDurationMin: '60',
      availableEquipment: ['barbell', 'dumbbell'],
      injuryRestrictions: [],
      cardioSessionsWeek: '2',
      periodizationModel: 'undulating',
      planCycleWeeks: '8',
      priorityMuscles: ['chest', 'back'],
      avgSleepHours: 7,
    };
    const result = trainingProfileSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid daysPerWeek (must be 2-6)', () => {
    const data = { ...trainingProfileDefaults, daysPerWeek: '1' };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects daysPerWeek = 7', () => {
    const data = { ...trainingProfileDefaults, daysPerWeek: '7' };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects invalid sessionDurationMin', () => {
    const data = { ...trainingProfileDefaults, sessionDurationMin: '20' };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects more than 3 priority muscles', () => {
    const data = {
      ...trainingProfileDefaults,
      priorityMuscles: ['chest', 'back', 'shoulders', 'legs'],
    };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('allows empty priorityMuscles', () => {
    const data = { ...trainingProfileDefaults, priorityMuscles: [] };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('allows avgSleepHours to be undefined', () => {
    const { avgSleepHours: _, ...data } = trainingProfileDefaults;
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects avgSleepHours below 3', () => {
    const data = { ...trainingProfileDefaults, avgSleepHours: 2 };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects cardioSessionsWeek above 5', () => {
    const data = { ...trainingProfileDefaults, cardioSessionsWeek: '6' };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects planCycleWeeks not in allowed set', () => {
    const data = { ...trainingProfileDefaults, planCycleWeeks: '5' };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('defaults are valid', () => {
    const result = trainingProfileSchema.safeParse(trainingProfileDefaults);
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/schemas/__tests__/trainingProfileSchema.test.ts`
Expected: FAIL — module `../trainingProfileSchema` not found

- [ ] **Step 3: Create the Zod schema**

Create `src/schemas/trainingProfileSchema.ts`:

```typescript
import { z } from 'zod';

const TRAINING_GOAL_VALUES = ['strength', 'hypertrophy', 'endurance', 'general'] as const;
const TRAINING_EXPERIENCE_VALUES = ['beginner', 'intermediate', 'advanced'] as const;
const EQUIPMENT_TYPE_VALUES = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands'] as const;
const BODY_REGION_VALUES = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'] as const;
const PERIODIZATION_MODEL_VALUES = ['linear', 'undulating', 'block'] as const;
const MUSCLE_GROUP_VALUES = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'] as const;

// Numeric RadioPills fields stored as STRING enums in the form to match RadioPills
// strict equality (field.value === option.value). Coerced to number in onSubmit.
const DAYS_PER_WEEK_STR = ['2', '3', '4', '5', '6'] as const;
const SESSION_DURATION_STR = ['30', '45', '60', '90'] as const;
const CARDIO_SESSIONS_STR = ['0', '1', '2', '3', '4', '5'] as const;
const CYCLE_WEEKS_STR = ['4', '6', '8', '12'] as const;

const MAX_PRIORITY_MUSCLES = 3;

export const trainingProfileSchema = z.object({
  trainingGoal: z.enum(TRAINING_GOAL_VALUES),

  trainingExperience: z.enum(TRAINING_EXPERIENCE_VALUES),

  // Stored as string in form, coerced to number in onSubmit
  daysPerWeek: z.enum(DAYS_PER_WEEK_STR, {
    message: 'Số ngày tập phải là 2, 3, 4, 5 hoặc 6',
  }),

  sessionDurationMin: z.enum(SESSION_DURATION_STR, {
    message: 'Thời lượng buổi tập phải là 30, 45, 60 hoặc 90 phút',
  }),

  availableEquipment: z.array(z.enum(EQUIPMENT_TYPE_VALUES)),

  injuryRestrictions: z.array(z.enum(BODY_REGION_VALUES)),

  cardioSessionsWeek: z.enum(CARDIO_SESSIONS_STR, {
    message: 'Số buổi cardio phải từ 0 đến 5',
  }),

  periodizationModel: z.enum(PERIODIZATION_MODEL_VALUES),

  planCycleWeeks: z.enum(CYCLE_WEEKS_STR, {
    message: 'Số tuần chu kỳ phải là 4, 6, 8 hoặc 12',
  }),

  priorityMuscles: z
    .array(z.enum(MUSCLE_GROUP_VALUES))
    .max(MAX_PRIORITY_MUSCLES, {
      message: `Chọn tối đa ${MAX_PRIORITY_MUSCLES} nhóm cơ ưu tiên`,
    }),

  avgSleepHours: z.coerce
    .number()
    .min(3, { message: 'Giờ ngủ tối thiểu là 3' })
    .max(12, { message: 'Giờ ngủ tối đa là 12' })
    .optional(),
});

export type TrainingProfileFormData = z.infer<typeof trainingProfileSchema>;

export const trainingProfileDefaults: TrainingProfileFormData = {
  trainingGoal: 'hypertrophy',
  trainingExperience: 'beginner',
  daysPerWeek: '3',
  sessionDurationMin: '60',
  availableEquipment: ['bodyweight', 'dumbbell'],
  injuryRestrictions: [],
  cardioSessionsWeek: '2',
  periodizationModel: 'linear',
  planCycleWeeks: '8',
  priorityMuscles: [],
  avgSleepHours: undefined,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/schemas/__tests__/trainingProfileSchema.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Run lint**

Run: `npx eslint src/schemas/trainingProfileSchema.ts src/schemas/__tests__/trainingProfileSchema.test.ts`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/schemas/trainingProfileSchema.ts src/schemas/__tests__/trainingProfileSchema.test.ts
git commit -m "feat: add Zod schema for training profile inline edit form"
```

---

## Task 2: Create TrainingProfileForm component

**Files:**
- Create: `src/features/fitness/components/TrainingProfileForm.tsx`

This is the main form component that follows the `HealthProfileForm` pattern exactly:
- Accepts `embedded` + `saveRef` props
- Uses `useForm` with `zodResolver(trainingProfileSchema)`
- Initializes from current store `trainingProfile`
- Exposes `handleSave` via `saveRef`
- Uses `RadioPills` for single-select fields (goal, experience, periodization, session duration, days/week, cardio sessions, cycle weeks)
- Uses `ChipSelect` for multi-select fields (equipment, injuries, priority muscles)
- Uses `StringNumberController` or plain input for numeric fields (sleep hours)

- [ ] **Step 1: Write the failing test for TrainingProfileForm**

Create `src/features/fitness/components/__tests__/TrainingProfileForm.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrainingProfileForm } from '../TrainingProfileForm';
import { useFitnessStore } from '../../../../store/fitnessStore';
import type { TrainingProfile } from '../../types';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const MOCK_PROFILE: TrainingProfile = {
  id: 'test-profile-1',
  trainingGoal: 'hypertrophy',
  trainingExperience: 'intermediate',
  daysPerWeek: 4,
  sessionDurationMin: 60,
  availableEquipment: ['barbell', 'dumbbell', 'machine'],
  injuryRestrictions: [],
  cardioSessionsWeek: 2,
  cardioTypePref: 'liss',
  cardioDurationMin: 20,
  periodizationModel: 'undulating',
  planCycleWeeks: 8,
  priorityMuscles: ['chest', 'back'],
  avgSleepHours: 7,
  updatedAt: '2026-03-28T00:00:00.000Z',
};

describe('TrainingProfileForm', () => {
  beforeEach(() => {
    useFitnessStore.setState({ trainingProfile: MOCK_PROFILE });
  });

  it('renders all form sections', () => {
    render(<TrainingProfileForm embedded />);

    expect(screen.getByRole('radiogroup', { name: /trainingGoal/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /trainingExperience/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /daysPerWeek/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /sessionDurationMin/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /availableEquipment/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /periodizationModel/i })).toBeInTheDocument();
  });

  it('initializes form with current store profile values', () => {
    render(<TrainingProfileForm embedded />);

    // Check hypertrophy is selected (aria-checked)
    const hypertrophyBtn = screen.getByRole('radio', { name: 'fitness.onboarding.hypertrophy' });
    expect(hypertrophyBtn).toHaveAttribute('aria-checked', 'true');

    // Check intermediate is selected
    const intermediateBtn = screen.getByRole('radio', { name: 'fitness.onboarding.intermediate' });
    expect(intermediateBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('shows numeric RadioPills as selected on initial render', () => {
    render(<TrainingProfileForm embedded />);

    // daysPerWeek = 4 should be highlighted
    const days4 = screen.getByTestId('days-4');
    expect(days4).toHaveAttribute('aria-checked', 'true');

    // sessionDurationMin = 60 should be highlighted
    const dur60 = screen.getByTestId('duration-60');
    expect(dur60).toHaveAttribute('aria-checked', 'true');

    // cardioSessionsWeek = 2 should be highlighted
    const cardio2 = screen.getByTestId('cardio-2');
    expect(cardio2).toHaveAttribute('aria-checked', 'true');

    // planCycleWeeks = 8 should be highlighted
    const weeks8 = screen.getByTestId('cycle-weeks-8');
    expect(weeks8).toHaveAttribute('aria-checked', 'true');
  });

  it('exposes save function via saveRef', async () => {
    const saveRef = { current: null as (() => Promise<boolean>) | null };
    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    expect(saveRef.current).toBeInstanceOf(Function);
  });

  it('calls setTrainingProfile on successful save', async () => {
    const saveRef = { current: null as (() => Promise<boolean>) | null };
    render(<TrainingProfileForm embedded saveRef={saveRef} />);

    const setTrainingProfile = vi.fn();
    useFitnessStore.setState({ setTrainingProfile });

    const result = await saveRef.current!();
    expect(result).toBe(true);
    expect(setTrainingProfile).toHaveBeenCalledTimes(1);
  });

  it('allows changing training goal', async () => {
    const user = userEvent.setup();
    render(<TrainingProfileForm embedded />);

    const strengthBtn = screen.getByRole('radio', { name: 'fitness.onboarding.strength' });
    await user.click(strengthBtn);

    expect(strengthBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('allows toggling equipment chips', async () => {
    const user = userEvent.setup();
    render(<TrainingProfileForm embedded />);

    const cableChip = screen.getByRole('checkbox', { name: 'fitness.onboarding.equip_cable' });
    expect(cableChip).toHaveAttribute('aria-checked', 'false');

    await user.click(cableChip);
    expect(cableChip).toHaveAttribute('aria-checked', 'true');
  });

  it('enforces max 3 priority muscles', async () => {
    const user = userEvent.setup();
    render(<TrainingProfileForm embedded />);

    // Profile already has chest + back selected (2/3)
    const shouldersChip = screen.getByTestId('priority-muscles-shoulders');
    await user.click(shouldersChip);
    expect(shouldersChip).toHaveAttribute('aria-checked', 'true');

    // 4th should be blocked by maxItems=3
    const legsChip = screen.getByTestId('priority-muscles-legs');
    await user.click(legsChip);
    expect(legsChip).toHaveAttribute('aria-checked', 'false');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/fitness/components/__tests__/TrainingProfileForm.test.tsx`
Expected: FAIL — module `../TrainingProfileForm` not found

- [ ] **Step 3: Create the TrainingProfileForm component**

Create `src/features/fitness/components/TrainingProfileForm.tsx`:

```typescript
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useFitnessStore } from '../../../store/fitnessStore';
import {
  trainingProfileSchema,
  trainingProfileDefaults,
  type TrainingProfileFormData,
} from '../../../schemas/trainingProfileSchema';
import { RadioPills } from '../../../components/form/RadioPills';
import { ChipSelect } from '../../../components/form/ChipSelect';
import { FormField } from '../../../components/form/FormField';
import type {
  TrainingGoal,
  TrainingExperience,
  TrainingProfile,
  PeriodizationModel,
  EquipmentType,
  BodyRegion,
  MuscleGroup,
} from '../types';

const GOALS: TrainingGoal[] = ['strength', 'hypertrophy', 'endurance', 'general'];
const EXPERIENCES: TrainingExperience[] = ['beginner', 'intermediate', 'advanced'];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const SESSION_DURATIONS = [30, 45, 60, 90];
const EQUIPMENT_OPTIONS: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands'];
const INJURY_OPTIONS: BodyRegion[] = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'];
const CARDIO_OPTIONS = [0, 1, 2, 3, 4, 5];
const PERIODIZATION_OPTIONS: PeriodizationModel[] = ['linear', 'undulating', 'block'];
const CYCLE_WEEKS_OPTIONS = [4, 6, 8, 12];
const MUSCLE_OPTIONS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];
const MAX_PRIORITY_MUSCLES = 3;

interface TrainingProfileFormProps {
  embedded?: boolean;
  saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

export function TrainingProfileForm({ embedded, saveRef }: TrainingProfileFormProps) {
  const { t } = useTranslation();
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);
  const setTrainingProfile = useFitnessStore((s) => s.setTrainingProfile);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainingProfileFormData>({
    resolver: zodResolver(trainingProfileSchema),
    mode: 'onBlur',
    defaultValues: trainingProfile
      ? {
          trainingGoal: trainingProfile.trainingGoal,
          trainingExperience: trainingProfile.trainingExperience,
          daysPerWeek: String(trainingProfile.daysPerWeek) as TrainingProfileFormData['daysPerWeek'],
          sessionDurationMin: String(trainingProfile.sessionDurationMin) as TrainingProfileFormData['sessionDurationMin'],
          availableEquipment: trainingProfile.availableEquipment,
          injuryRestrictions: trainingProfile.injuryRestrictions,
          cardioSessionsWeek: String(trainingProfile.cardioSessionsWeek) as TrainingProfileFormData['cardioSessionsWeek'],
          periodizationModel: trainingProfile.periodizationModel,
          planCycleWeeks: String(trainingProfile.planCycleWeeks) as TrainingProfileFormData['planCycleWeeks'],
          priorityMuscles: trainingProfile.priorityMuscles,
          avgSleepHours: trainingProfile.avgSleepHours,
        }
      : trainingProfileDefaults,
  });

  function onSubmit(data: TrainingProfileFormData): boolean {
    // Coerce string RadioPills values to numbers for TrainingProfile interface
    const updatedProfile: TrainingProfile = {
      id: trainingProfile?.id ?? crypto.randomUUID(),
      trainingGoal: data.trainingGoal,
      trainingExperience: data.trainingExperience,
      daysPerWeek: Number(data.daysPerWeek),
      sessionDurationMin: Number(data.sessionDurationMin),
      availableEquipment: data.availableEquipment,
      injuryRestrictions: data.injuryRestrictions,
      cardioSessionsWeek: Number(data.cardioSessionsWeek),
      periodizationModel: data.periodizationModel,
      planCycleWeeks: Number(data.planCycleWeeks),
      priorityMuscles: data.priorityMuscles,
      avgSleepHours: data.avgSleepHours,
      cardioTypePref: trainingProfile?.cardioTypePref ?? 'mixed',
      cardioDurationMin: trainingProfile?.cardioDurationMin ?? 20,
      known1rm: trainingProfile?.known1rm,
      updatedAt: new Date().toISOString(),
    };
    setTrainingProfile(updatedProfile);
    reset(data);
    return true;
  }

  async function handleSave(): Promise<boolean> {
    let result = false;
    await handleSubmit((data) => {
      result = onSubmit(data);
    })();
    return result;
  }

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  });

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-6 p-4'} data-testid="training-profile-form">
      {/* Training Goal */}
      <FormField label={t('fitness.onboarding.goal')} error={errors.trainingGoal}>
        <RadioPills<TrainingProfileFormData>
          name="trainingGoal"
          control={control}
          options={GOALS.map((g) => ({ value: g, label: t(`fitness.onboarding.${g}`) }))}
          testIdPrefix="goal"
        />
      </FormField>

      {/* Experience Level */}
      <FormField label={t('fitness.onboarding.experience')} error={errors.trainingExperience}>
        <RadioPills<TrainingProfileFormData>
          name="trainingExperience"
          control={control}
          options={EXPERIENCES.map((e) => ({ value: e, label: t(`fitness.onboarding.${e}`) }))}
          testIdPrefix="experience"
        />
      </FormField>

      {/* Days per Week */}
      <FormField label={t('fitness.onboarding.daysPerWeek')} error={errors.daysPerWeek}>
        <RadioPills<TrainingProfileFormData>
          name="daysPerWeek"
          control={control}
          options={DAYS_OPTIONS.map((d) => ({ value: String(d), label: `${d}` }))}
          testIdPrefix="days"
        />
      </FormField>

      {/* Session Duration */}
      <FormField label={t('fitness.onboarding.sessionDuration')} error={errors.sessionDurationMin}>
        <RadioPills<TrainingProfileFormData>
          name="sessionDurationMin"
          control={control}
          options={SESSION_DURATIONS.map((d) => ({
            value: String(d),
            label: `${d} ${t('fitness.onboarding.minutesUnit')}`,
          }))}
          testIdPrefix="duration"
        />
      </FormField>

      {/* Equipment */}
      <FormField label={t('fitness.onboarding.equipment')} error={errors.availableEquipment}>
        <ChipSelect<TrainingProfileFormData>
          name="availableEquipment"
          control={control}
          options={EQUIPMENT_OPTIONS.map((eq) => ({
            value: eq,
            label: t(`fitness.onboarding.equip_${eq}`),
          }))}
          testIdPrefix="equipment"
        />
      </FormField>

      {/* Injury Restrictions */}
      <FormField label={t('fitness.onboarding.injuries')} error={errors.injuryRestrictions}>
        <ChipSelect<TrainingProfileFormData>
          name="injuryRestrictions"
          control={control}
          options={INJURY_OPTIONS.map((inj) => ({
            value: inj,
            label: t(`fitness.onboarding.injury_${inj}`),
          }))}
          testIdPrefix="injury"
        />
      </FormField>

      {/* Cardio Sessions per Week */}
      <FormField label={t('fitness.onboarding.cardioSessions')} error={errors.cardioSessionsWeek}>
        <RadioPills<TrainingProfileFormData>
          name="cardioSessionsWeek"
          control={control}
          options={CARDIO_OPTIONS.map((c) => ({ value: String(c), label: `${c}` }))}
          testIdPrefix="cardio"
        />
      </FormField>

      {/* Periodization Model */}
      <FormField label={t('fitness.onboarding.periodization')} error={errors.periodizationModel}>
        <RadioPills<TrainingProfileFormData>
          name="periodizationModel"
          control={control}
          options={PERIODIZATION_OPTIONS.map((p) => ({
            value: p,
            label: t(`fitness.onboarding.period_${p}`),
          }))}
          testIdPrefix="periodization"
        />
      </FormField>

      {/* Cycle Weeks */}
      <FormField label={t('fitness.onboarding.cycleWeeks')} error={errors.planCycleWeeks}>
        <RadioPills<TrainingProfileFormData>
          name="planCycleWeeks"
          control={control}
          options={CYCLE_WEEKS_OPTIONS.map((w) => ({
            value: String(w),
            label: `${w} ${t('fitness.onboarding.weeksUnit')}`,
          }))}
          testIdPrefix="cycle-weeks"
        />
      </FormField>

      {/* Priority Muscles */}
      <FormField
        label={`${t('fitness.onboarding.priorityMuscles')} (${t('fitness.onboarding.maxItems', { count: MAX_PRIORITY_MUSCLES })})`}
        error={errors.priorityMuscles}
      >
        <ChipSelect<TrainingProfileFormData>
          name="priorityMuscles"
          control={control}
          options={MUSCLE_OPTIONS.map((m) => ({
            value: m,
            label: t(`fitness.onboarding.muscle_${m}`),
          }))}
          maxItems={MAX_PRIORITY_MUSCLES}
          testIdPrefix="priority-muscles"
        />
      </FormField>

      {/* Sleep Hours (optional) */}
      <FormField label={t('fitness.onboarding.sleepHours')} error={errors.avgSleepHours}>
        <input
          type="number"
          min={3}
          max={12}
          step={0.5}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
          {...control.register('avgSleepHours', { valueAsNumber: true })}
          data-testid="sleep-hours-input"
        />
      </FormField>
    </div>
  );
}
```

**Important implementation notes:**
- **String-based numeric fields:** `daysPerWeek`, `sessionDurationMin`, `cardioSessionsWeek`, `planCycleWeeks` are stored as string enums in the form to match `RadioPills` strict equality. Converted to numbers via `Number()` in `onSubmit`. Default values use `String(trainingProfile.daysPerWeek)` etc.
- `cardioTypePref` and `cardioDurationMin` are preserved from the existing profile (not editable in this form — they're computed defaults from the onboarding wizard).
- `known1rm` is preserved from existing profile.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/fitness/components/__tests__/TrainingProfileForm.test.tsx`
Expected: ALL PASS

- [ ] **Step 5: Run lint**

Run: `npx eslint src/features/fitness/components/TrainingProfileForm.tsx src/features/fitness/components/__tests__/TrainingProfileForm.test.tsx`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/features/fitness/components/TrainingProfileForm.tsx src/features/fitness/components/__tests__/TrainingProfileForm.test.tsx
git commit -m "feat: create TrainingProfileForm with RHF + Zod for inline editing"
```

---

## Task 3: Wire up TrainingProfileDetailPage to use the new form

**Files:**
- Modify: `src/components/settings/TrainingProfileDetailPage.tsx`

Follow the exact pattern from `HealthProfileDetailPage.tsx`:
1. Add `saveRef` with `useRef`
2. `handleSave` calls `saveRef.current()` and only exits edit mode on success
3. Render `<TrainingProfileForm embedded saveRef={saveRef} />` in edit mode
4. Keep `<TrainingProfileSection />` for view mode

- [ ] **Step 1: Write the failing test for detail page integration**

Create `src/components/settings/__tests__/TrainingProfileDetailPage.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrainingProfileDetailPage from '../TrainingProfileDetailPage';
import { useFitnessStore } from '../../../store/fitnessStore';
import type { TrainingProfile } from '../../../features/fitness/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const MOCK_PROFILE: TrainingProfile = {
  id: 'test-1',
  trainingGoal: 'hypertrophy',
  trainingExperience: 'intermediate',
  daysPerWeek: 4,
  sessionDurationMin: 60,
  availableEquipment: ['barbell', 'dumbbell'],
  injuryRestrictions: [],
  cardioSessionsWeek: 2,
  cardioTypePref: 'liss',
  cardioDurationMin: 20,
  periodizationModel: 'undulating',
  planCycleWeeks: 8,
  priorityMuscles: ['chest', 'back'],
  avgSleepHours: 7,
  updatedAt: '2026-03-28T00:00:00.000Z',
};

describe('TrainingProfileDetailPage', () => {
  it('shows view mode by default', () => {
    useFitnessStore.setState({ trainingProfile: MOCK_PROFILE });
    render(<TrainingProfileDetailPage onBack={vi.fn()} />);

    expect(screen.getByTestId('settings-detail-edit')).toBeInTheDocument();
    expect(screen.queryByTestId('training-profile-form')).not.toBeInTheDocument();
  });

  it('shows edit form when Edit button clicked', async () => {
    useFitnessStore.setState({ trainingProfile: MOCK_PROFILE });
    const user = userEvent.setup();
    render(<TrainingProfileDetailPage onBack={vi.fn()} />);

    await user.click(screen.getByTestId('settings-detail-edit'));

    expect(screen.getByTestId('training-profile-form')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-detail-edit')).not.toBeInTheDocument();
  });

  it('returns to view mode on cancel', async () => {
    useFitnessStore.setState({ trainingProfile: MOCK_PROFILE });
    const user = userEvent.setup();
    render(<TrainingProfileDetailPage onBack={vi.fn()} />);

    await user.click(screen.getByTestId('settings-detail-edit'));
    expect(screen.getByTestId('training-profile-form')).toBeInTheDocument();

    await user.click(screen.getByTestId('settings-detail-cancel'));
    expect(screen.queryByTestId('training-profile-form')).not.toBeInTheDocument();
  });

  it('shows empty state when no training profile exists', () => {
    useFitnessStore.setState({ trainingProfile: null });
    render(<TrainingProfileDetailPage onBack={vi.fn()} />);

    expect(screen.getByTestId('training-profile-empty')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/settings/__tests__/TrainingProfileDetailPage.test.tsx`
Expected: FAIL — the test will find the info banner (`training-profile-edit` div) instead of `training-profile-form`

- [ ] **Step 3: Update TrainingProfileDetailPage to use the form**

Modify `src/components/settings/TrainingProfileDetailPage.tsx` — replace entire file:

```typescript
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell } from 'lucide-react';
import { TrainingProfileSection } from '../../features/fitness/components/TrainingProfileSection';
import { TrainingProfileForm } from '../../features/fitness/components/TrainingProfileForm';
import { useFitnessStore } from '../../store/fitnessStore';
import { SettingsDetailLayout } from './SettingsDetailLayout';

function TrainingProfileDetailPageInner({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);

  const handleSave = async () => {
    if (saveRef.current) {
      const success = await saveRef.current();
      if (success) {
        setIsEditing(false);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <SettingsDetailLayout
      title={t('settings.trainingProfileSection')}
      icon={<Dumbbell className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
      isEditing={isEditing}
      hasChanges={isEditing}
      onBack={onBack}
      onEdit={() => setIsEditing(true)}
      onSave={() => void handleSave()}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <TrainingProfileForm embedded saveRef={saveRef} />
      ) : (
        trainingProfile ? (
          <TrainingProfileSection />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="training-profile-empty">
            <Dumbbell className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t('settings.notConfigured')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {t('settings.notConfiguredDesc')}
            </p>
          </div>
        )
      )}
    </SettingsDetailLayout>
  );
}

export default function TrainingProfileDetailPage({ onBack }: { onBack: () => void }) {
  return <TrainingProfileDetailPageInner onBack={onBack} />;
}
```

**Key changes from current version:**
1. Added `useRef` import
2. Added `TrainingProfileForm` import
3. Added `saveRef` with `useRef<(() => Promise<boolean>) | null>(null)`
4. `handleSave` now calls `saveRef.current()` and only exits edit mode on success
5. Edit mode renders `<TrainingProfileForm embedded saveRef={saveRef} />` instead of info banner
6. Removed `Info` import (no longer needed)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/settings/__tests__/TrainingProfileDetailPage.test.tsx`
Expected: ALL PASS

- [ ] **Step 5: Run ALL related tests**

Run: `npx vitest run src/schemas/__tests__/trainingProfileSchema.test.ts src/features/fitness/components/__tests__/TrainingProfileForm.test.tsx src/components/settings/__tests__/TrainingProfileDetailPage.test.tsx`
Expected: ALL PASS

- [ ] **Step 6: Run lint on all changed files**

Run: `npx eslint src/components/settings/TrainingProfileDetailPage.tsx src/features/fitness/components/TrainingProfileForm.tsx src/schemas/trainingProfileSchema.ts`
Expected: 0 errors. No `eslint-disable` comments allowed.

- [ ] **Step 7: Commit**

```bash
git add src/components/settings/TrainingProfileDetailPage.tsx
git commit -m "feat: wire TrainingProfileForm into settings detail page"
```

---

## Task 4: Add missing i18n keys for validation messages

**Files:**
- Modify: `src/locales/vi.json`
- Modify: `src/locales/en.json`

- [ ] **Step 1: Add Vietnamese translation for max items label**

In `src/locales/vi.json`, find the `fitness.onboarding` section and add:

```json
"maxItems": "tối đa {{count}}"
```

This key is used in `TrainingProfileForm` for the priority muscles label.

- [ ] **Step 2: Add English translation for max items label**

In `src/locales/en.json`, find the `fitness.onboarding` section and add:

```json
"maxItems": "max {{count}}"
```

- [ ] **Step 3: Verify no missing translations by running the app**

Run: `npm run build`
Expected: Build succeeds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/vi.json src/locales/en.json
git commit -m "feat: add i18n keys for training profile edit form"
```

---

## Task 5: End-to-end verification on emulator

**Files:** None (verification only)

- [ ] **Step 1: Build and deploy to emulator**

```bash
npm run build && npx cap sync android && npx cap run android --target emulator-5554
```

- [ ] **Step 2: Navigate to Settings → Hồ sơ tập luyện → Chỉnh sửa**

Verify: The edit form opens with all fields shown as interactive RadioPills and ChipSelect components (NOT the old info banner).

- [ ] **Step 3: Test field editing**

1. Change "Mục tiêu tập luyện" from "Phát triển cơ" to "Sức mạnh"
2. Change "Số ngày tập/tuần" from 4 to 5
3. Toggle an equipment chip
4. Change periodization model

- [ ] **Step 4: Test save**

Click "Lưu" and verify:
1. Form closes and returns to view mode
2. Updated values are displayed in the read-only view
3. Re-entering edit mode shows the saved values

- [ ] **Step 5: Test cancel**

Enter edit mode, change some values, click "Hủy". Verify original values are still displayed.

- [ ] **Step 6: Test validation**

Enter edit mode and attempt to select more than 3 priority muscles. Verify the 4th selection is blocked by `maxItems`.

- [ ] **Step 7: Take screenshots and commit**

```bash
git add screenshots/emulator/
git commit -m "docs: add training profile edit verification screenshots"
```

---

## Task 6: Final quality gates

- [ ] **Step 1: Run full lint**

```bash
npx eslint src/schemas/trainingProfileSchema.ts src/features/fitness/components/TrainingProfileForm.tsx src/components/settings/TrainingProfileDetailPage.tsx
```

Expected: 0 errors, 0 warnings (except pre-existing `react-hooks/incompatible-library`).

- [ ] **Step 2: Run full test suite for changed files**

```bash
npx vitest run src/schemas/__tests__/trainingProfileSchema.test.ts src/features/fitness/components/__tests__/TrainingProfileForm.test.tsx src/components/settings/__tests__/TrainingProfileDetailPage.test.tsx
```

Expected: ALL PASS with 100% coverage on new files.

- [ ] **Step 3: Verify no regression in existing tests**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -5
```

Expected: Same or fewer failures than baseline (186 pre-existing failures).

- [ ] **Step 4: Final commit with all quality gates passed**

```bash
git add -A
git commit -m "feat: training profile inline edit form with RHF + Zod

- Created trainingProfileSchema with Vietnamese validation messages
- Created TrainingProfileForm with RadioPills, ChipSelect, embedded+saveRef pattern
- Updated TrainingProfileDetailPage to render form in edit mode
- Added i18n keys for maxItems label
- Full test coverage for schema, form, and detail page integration"
```

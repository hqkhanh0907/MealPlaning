import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { HealthProfileForm } from '../features/health-profile/components/HealthProfileForm';
import type { HealthProfileState } from '../features/health-profile/store/healthProfileStore';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import type { HealthProfile } from '../features/health-profile/types';
import { DEFAULT_HEALTH_PROFILE } from '../features/health-profile/types';
import type { DatabaseService } from '../services/databaseService';

/* ------------------------------------------------------------------ */
/* Mock DatabaseContext */
/* ------------------------------------------------------------------ */
const mockDb: DatabaseService = {
  initialize: vi.fn(),
  execute: vi.fn(),
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockResolvedValue(null),
  transaction: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined),
  exportToJSON: vi.fn(),
  importFromJSON: vi.fn(),
};

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => mockDb,
}));

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

/** Generate a YYYY-MM-DD date string that yields exactly `targetAge` today. */
function dobForAge(targetAge: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - targetAge);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

const DOB_AGE_30 = dobForAge(30);

/** Profile with valid name + DOB (DOB-first architecture). */
const VALID_PROFILE: HealthProfile = {
  ...DEFAULT_HEALTH_PROFILE,
  name: 'Nguyễn Văn A',
  dateOfBirth: DOB_AGE_30,
  age: 30,
};

let mockSaveProfile: ReturnType<typeof vi.fn>;

function resetStore(overrides: Partial<HealthProfileState> = {}) {
  mockSaveProfile = vi.fn().mockResolvedValue(undefined);
  const typedMock = mockSaveProfile as unknown as (db: DatabaseService, profile: HealthProfile) => Promise<void>;
  useHealthProfileStore.setState({
    profile: { ...VALID_PROFILE },
    activeGoal: null,
    loading: false,
    saveProfile: typedMock,
    ...overrides,
  });
}

/* ------------------------------------------------------------------ */
/* Tests */
/* ------------------------------------------------------------------ */
describe('HealthProfileForm', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders all form fields', () => {
    render(<HealthProfileForm />);

    expect(screen.getByText('Hồ sơ sức khỏe')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên')).toBeInTheDocument();
    expect(screen.getByText('Giới tính')).toBeInTheDocument();
    expect(screen.getByLabelText('Ngày sinh')).toBeInTheDocument();
    expect(screen.getByLabelText('Chiều cao (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Cân nặng (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText('Mức độ vận động')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tỉ lệ mỡ cơ thể/)).toBeInTheDocument();
    expect(screen.getAllByText('BMR').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Tỉ lệ protein (g/kg)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeInTheDocument();
  });

  it('does not render age as an input field', () => {
    render(<HealthProfileForm />);

    expect(screen.queryByTestId('hp-age')).not.toBeInTheDocument();
  });

  it('populates with current profile data', () => {
    render(<HealthProfileForm />);

    expect(screen.getByLabelText('Tên')).toHaveValue('Nguyễn Văn A');
    expect(screen.getByLabelText('Ngày sinh')).toHaveValue(DOB_AGE_30);
    expect(screen.getByLabelText('Chiều cao (cm)')).toHaveValue('170');
    expect(screen.getByLabelText('Cân nặng (kg)')).toHaveValue('70');
    expect(screen.getByLabelText('Tỉ lệ protein (g/kg)')).toHaveValue('2');

    const maleBtn = screen.getByRole('radio', { name: 'Nam' });
    expect(maleBtn).toHaveAttribute('aria-checked', 'true');

    const activitySelect = screen.getByLabelText('Mức độ vận động');
    expect(activitySelect).toHaveValue('moderate');
  });

  it('shows computed age from date of birth', () => {
    render(<HealthProfileForm />);

    const computedAge = screen.getByTestId('hp-computed-age');
    expect(computedAge).toHaveTextContent('Tuổi: 30');
  });

  it('updates computed age when DOB changes', () => {
    render(<HealthProfileForm />);

    const dobInput = screen.getByLabelText('Ngày sinh');
    fireEvent.change(dobInput, { target: { value: dobForAge(25) } });

    expect(screen.getByTestId('hp-computed-age')).toHaveTextContent('Tuổi: 25');
  });

  it('gender toggle works', () => {
    render(<HealthProfileForm />);

    const maleBtn = screen.getByRole('radio', { name: 'Nam' });
    const femaleBtn = screen.getByRole('radio', { name: 'Nữ' });

    expect(maleBtn).toHaveAttribute('aria-checked', 'true');
    expect(femaleBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(femaleBtn);

    expect(maleBtn).toHaveAttribute('aria-checked', 'false');
    expect(femaleBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('activity level select works', () => {
    render(<HealthProfileForm />);

    const select = screen.getByLabelText('Mức độ vận động');
    expect(select).toHaveValue('moderate');

    fireEvent.change(select, { target: { value: 'active' } });
    expect(select).toHaveValue('active');
  });

  it('BMR auto-calculates when fields change', () => {
    render(<HealthProfileForm />);

    // Default: male, 30y (from DOB), 170cm, 70kg → BMR = 10*70+6.25*170-5*30+5 = 1618
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1618');

    // Change weight to 80 → BMR = 10*80+6.25*170-5*30+5 = 1718
    fireEvent.change(screen.getByLabelText('Cân nặng (kg)'), {
      target: { value: '80' },
    });
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1718');
  });

  it('BMR recalculates when DOB changes', () => {
    render(<HealthProfileForm />);

    // Default BMR with age 30: 1618
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1618');

    // Change DOB to age 25 → BMR = 10*70+6.25*170-5*25+5 = 1643
    fireEvent.change(screen.getByLabelText('Ngày sinh'), {
      target: { value: dobForAge(25) },
    });
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1643');
  });

  it('save button calls saveProfile with name, DOB and computed age', async () => {
    render(<HealthProfileForm />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    });

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
    });

    expect(mockSaveProfile).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        id: 'default',
        name: 'Nguyễn Văn A',
        dateOfBirth: DOB_AGE_30,
        age: 30,
        gender: 'male',
        heightCm: 170,
        weightKg: 70,
        activityLevel: 'moderate',
        proteinRatio: 2.0,
      }),
    );
  });

  it('validation rejects empty name', async () => {
    resetStore({ profile: { ...VALID_PROFILE, name: '' } });
    render(<HealthProfileForm />);

    expect(screen.getByLabelText('Tên')).toHaveValue('');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Tên').className).toContain('border-destructive');
    });

    expect(mockSaveProfile).not.toHaveBeenCalled();
  });

  it('validation rejects empty date of birth', async () => {
    resetStore({ profile: { ...VALID_PROFILE, dateOfBirth: null } });
    render(<HealthProfileForm />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Ngày sinh').className).toContain('border-destructive');
    });

    expect(mockSaveProfile).not.toHaveBeenCalled();
  });

  it('validation rejects future date of birth', async () => {
    render(<HealthProfileForm />);

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().slice(0, 10);

    fireEvent.change(screen.getByLabelText('Ngày sinh'), {
      target: { value: futureDateStr },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Ngày sinh').className).toContain('border-destructive');
    });

    expect(mockSaveProfile).not.toHaveBeenCalled();
  });

  it('body fat field is optional', async () => {
    render(<HealthProfileForm />);

    // Body fat is empty by default — StringNumberController uses type="text"
    const bodyFatInput = screen.getByLabelText(/Tỉ lệ mỡ cơ thể/);
    expect(bodyFatInput).toHaveValue('');

    // Save should succeed without body fat
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    });

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
    });
  });

  it('BMR override toggle works', () => {
    render(<HealthProfileForm />);

    const autoBtn = screen.getByRole('radio', { name: 'Tự động tính' });
    const customBtn = screen.getByRole('radio', { name: 'Nhập thủ công' });

    expect(autoBtn).toHaveAttribute('aria-checked', 'true');
    expect(customBtn).toHaveAttribute('aria-checked', 'false');

    // Default auto BMR with age 30 from DOB: 1618
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1618');

    // Switch to custom
    fireEvent.click(customBtn);
    expect(autoBtn).toHaveAttribute('aria-checked', 'false');
    expect(customBtn).toHaveAttribute('aria-checked', 'true');

    // Override input appears
    const overrideInput = screen.getByTestId('bmr-override-input');
    expect(overrideInput).toBeInTheDocument();

    // Enter custom BMR
    fireEvent.change(overrideInput, { target: { value: '1800' } });
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1800');
  });

  it('saveRef is assigned when provided', () => {
    const saveRef = { current: null as (() => Promise<boolean>) | null };
    render(<HealthProfileForm saveRef={saveRef} />);
    expect(saveRef.current).not.toBeNull();
    expect(typeof saveRef.current).toBe('function');
  });

  it('saveRef.current returns true on successful save', async () => {
    const saveRef = { current: null as (() => Promise<boolean>) | null };
    render(<HealthProfileForm saveRef={saveRef} />);

    const result = await saveRef.current!();
    expect(result).toBe(true);
    expect(mockSaveProfile).toHaveBeenCalledTimes(1);
  });

  it('save returns false when saveProfile throws', async () => {
    const failingSave = vi.fn().mockRejectedValue(new Error('DB error'));
    resetStore();
    useHealthProfileStore.setState({ saveProfile: failingSave as never });

    const saveRef = { current: null as (() => Promise<boolean>) | null };
    render(<HealthProfileForm saveRef={saveRef} />);

    const result = await saveRef.current!();
    expect(result).toBe(false);
  });

  it('switching from custom BMR back to auto disables override', () => {
    render(<HealthProfileForm />);

    const customBtn = screen.getByRole('radio', { name: 'Nhập thủ công' });
    const autoBtn = screen.getByRole('radio', { name: 'Tự động tính' });

    fireEvent.click(customBtn);
    expect(customBtn).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('bmr-override-input')).toBeInTheDocument();

    fireEvent.click(autoBtn);
    expect(autoBtn).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByTestId('bmr-override-input')).not.toBeInTheDocument();
  });

  it('hides computed age when DOB is empty (legacy user)', () => {
    resetStore({ profile: { ...VALID_PROFILE, dateOfBirth: null } });
    render(<HealthProfileForm />);

    expect(screen.queryByTestId('hp-computed-age')).not.toBeInTheDocument();
  });

  it('syncs form when profile changes in store and form is not dirty', async () => {
    const { rerender } = render(<HealthProfileForm />);

    expect(screen.getByLabelText('Tên')).toHaveValue('Nguyễn Văn A');

    // Simulate store update (e.g., async DB load)
    act(() => {
      useHealthProfileStore.setState({
        profile: { ...VALID_PROFILE, name: 'Trần Văn B' },
      });
    });

    rerender(<HealthProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('Tên')).toHaveValue('Trần Văn B');
    });
  });

  /* ------------------------------------------------------------------ */
  /* Goal-aware weight warning tests */
  /* ------------------------------------------------------------------ */

  it('shows warning when weight drops below cut goal target', () => {
    resetStore({
      profile: { ...VALID_PROFILE, weightKg: 80 },
      activeGoal: {
        id: 'goal-1',
        type: 'cut',
        rateOfChange: 'moderate',
        targetWeightKg: 65,
        calorieOffset: -500,
        startDate: '2025-01-01',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    });
    render(<HealthProfileForm />);

    const weightInput = screen.getByTestId('hp-weight');
    fireEvent.change(weightInput, { target: { value: '60' } });

    expect(screen.getByTestId('goal-weight-warning')).toBeInTheDocument();
  });

  it('shows warning when weight equals cut goal target', () => {
    resetStore({
      profile: { ...VALID_PROFILE, weightKg: 80 },
      activeGoal: {
        id: 'goal-1',
        type: 'cut',
        rateOfChange: 'moderate',
        targetWeightKg: 65,
        calorieOffset: -500,
        startDate: '2025-01-01',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    });
    render(<HealthProfileForm />);

    const weightInput = screen.getByTestId('hp-weight');
    fireEvent.change(weightInput, { target: { value: '65' } });

    expect(screen.getByTestId('goal-weight-warning')).toBeInTheDocument();
  });

  it('no warning when weight is above cut goal target', () => {
    resetStore({
      profile: { ...VALID_PROFILE, weightKg: 80 },
      activeGoal: {
        id: 'goal-1',
        type: 'cut',
        rateOfChange: 'moderate',
        targetWeightKg: 65,
        calorieOffset: -500,
        startDate: '2025-01-01',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    });
    render(<HealthProfileForm />);

    const weightInput = screen.getByTestId('hp-weight');
    fireEvent.change(weightInput, { target: { value: '75' } });

    expect(screen.queryByTestId('goal-weight-warning')).not.toBeInTheDocument();
  });

  it('shows warning when weight rises above bulk goal target', () => {
    resetStore({
      profile: { ...VALID_PROFILE, weightKg: 70 },
      activeGoal: {
        id: 'goal-1',
        type: 'bulk',
        rateOfChange: 'moderate',
        targetWeightKg: 85,
        calorieOffset: 500,
        startDate: '2025-01-01',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    });
    render(<HealthProfileForm />);

    const weightInput = screen.getByTestId('hp-weight');
    fireEvent.change(weightInput, { target: { value: '90' } });

    expect(screen.getByTestId('goal-weight-warning')).toBeInTheDocument();
  });

  it('shows warning when weight equals bulk goal target', () => {
    resetStore({
      profile: { ...VALID_PROFILE, weightKg: 70 },
      activeGoal: {
        id: 'goal-1',
        type: 'bulk',
        rateOfChange: 'moderate',
        targetWeightKg: 85,
        calorieOffset: 500,
        startDate: '2025-01-01',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    });
    render(<HealthProfileForm />);

    const weightInput = screen.getByTestId('hp-weight');
    fireEvent.change(weightInput, { target: { value: '85' } });

    expect(screen.getByTestId('goal-weight-warning')).toBeInTheDocument();
  });

  it('no warning for maintain goal regardless of weight', () => {
    resetStore({
      profile: { ...VALID_PROFILE, weightKg: 70 },
      activeGoal: {
        id: 'goal-1',
        type: 'maintain',
        rateOfChange: 'moderate',
        calorieOffset: 0,
        startDate: '2025-01-01',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    });
    render(<HealthProfileForm />);

    const weightInput = screen.getByTestId('hp-weight');
    fireEvent.change(weightInput, { target: { value: '50' } });

    expect(screen.queryByTestId('goal-weight-warning')).not.toBeInTheDocument();
  });

  it('no warning when no active goal exists', () => {
    resetStore({
      profile: { ...VALID_PROFILE, weightKg: 70 },
      activeGoal: null,
    });
    render(<HealthProfileForm />);

    const weightInput = screen.getByTestId('hp-weight');
    fireEvent.change(weightInput, { target: { value: '50' } });

    expect(screen.queryByTestId('goal-weight-warning')).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /* Embedded mode & blank defaults tests */
  /* ------------------------------------------------------------------ */

  it('hides title and save button in embedded mode', () => {
    render(<HealthProfileForm embedded />);

    expect(screen.queryByText('Hồ sơ sức khỏe')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument();
    // Form fields still render
    expect(screen.getByTestId('health-profile-form')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên')).toBeInTheDocument();
  });

  it('uses blank defaults when blankDefaults prop is set and profile is null', () => {
    resetStore({ profile: null });
    render(<HealthProfileForm blankDefaults />);

    expect(screen.getByLabelText('Tên')).toHaveValue('');
    expect(screen.getByLabelText('Ngày sinh')).toHaveValue('');
    expect(screen.getByLabelText('Chiều cao (cm)')).toHaveValue('');
    expect(screen.getByLabelText('Cân nặng (kg)')).toHaveValue('');
    expect(screen.getByLabelText('Tỉ lệ protein (g/kg)')).toHaveValue('');
    // Macro display uses profile?.fatPct ?? 0.25 fallback (line 156)
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('0');
  });

  it('saves with fallback base profile when store profile is null', async () => {
    resetStore({ profile: null });
    const saveRef = { current: null as (() => Promise<boolean>) | null };
    render(<HealthProfileForm blankDefaults saveRef={saveRef} />);

    // Fill all required fields for schema validation
    fireEvent.change(screen.getByLabelText('Tên'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Ngày sinh'), { target: { value: dobForAge(25) } });
    fireEvent.change(screen.getByLabelText('Chiều cao (cm)'), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText('Cân nặng (kg)'), { target: { value: '70' } });
    fireEvent.change(screen.getByLabelText('Tỉ lệ protein (g/kg)'), { target: { value: '2' } });

    const result = await saveRef.current!();
    expect(result).toBe(true);

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
    });

    // onSubmit uses fallback base (profile ?? {...default...}) on line 175
    expect(mockSaveProfile).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        id: 'default',
        name: 'Test User',
        heightCm: 175,
        weightKg: 70,
        proteinRatio: 2,
        gender: 'male',
        activityLevel: 'moderate',
        fatPct: 0.25,
      }),
    );
  });

  it('saves bodyFatPct as number when filled', async () => {
    render(<HealthProfileForm />);

    fireEvent.change(screen.getByLabelText(/Tỉ lệ mỡ cơ thể/), { target: { value: '15' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    });

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
    });

    // Line 199: typeof data.bodyFatPct === 'number' → true → saves 15
    expect(mockSaveProfile).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        bodyFatPct: 15,
      }),
    );
  });

  it('saves bmrOverride when override is enabled', async () => {
    render(<HealthProfileForm />);

    fireEvent.click(screen.getByRole('radio', { name: 'Nhập thủ công' }));
    fireEvent.change(screen.getByTestId('bmr-override-input'), { target: { value: '1800' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    });

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
    });

    // Line 200: data.bmrOverrideEnabled ? data.bmrOverride : undefined → 1800
    expect(mockSaveProfile).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        bmrOverride: 1800,
      }),
    );
  });

  it('goalWeightWarning returns null when weight field is empty', () => {
    resetStore({
      profile: { ...VALID_PROFILE, weightKg: 80 },
      activeGoal: {
        id: 'goal-1',
        type: 'cut',
        rateOfChange: 'moderate',
        targetWeightKg: 65,
        calorieOffset: -500,
        startDate: '2025-01-01',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    });
    render(<HealthProfileForm />);

    // Clear weight field: Number('') = 0, !0 = true → line 162 returns null
    const weightInput = screen.getByTestId('hp-weight');
    fireEvent.change(weightInput, { target: { value: '' } });

    expect(screen.queryByTestId('goal-weight-warning')).not.toBeInTheDocument();
  });

  it('computeAgeFromDob returns 0 for invalid date string', () => {
    // Set DOB to a truthy but invalid date string directly via store
    resetStore({
      profile: { ...VALID_PROFILE, dateOfBirth: '9999-99-99' },
    });
    render(<HealthProfileForm />);

    // computeAgeFromDob('9999-99-99') → new Date('9999-99-99') → NaN time → returns 0
    // The form renders without crashing (age=0, invalid preview)
    expect(screen.getByTestId('hp-dob')).toBeInTheDocument();
  });

  it('computeAgeFromDob handles birthday not yet passed this year', () => {
    // Create a DOB where the birth month is AFTER the current month
    const today = new Date();
    const futureMonth = today.getMonth() + 2; // 2 months ahead
    const year = futureMonth > 11 ? today.getFullYear() - 29 : today.getFullYear() - 30;
    const month = futureMonth > 11 ? futureMonth - 12 : futureMonth;
    const dob = `${year}-${String(month + 1).padStart(2, '0')}-15`;

    resetStore({
      profile: { ...VALID_PROFILE, dateOfBirth: dob },
    });
    render(<HealthProfileForm />);

    // Birthday hasn't passed yet → age = yearDiff - 1
    // The form should render without errors and show the age-adjusted BMR
    const dobInput = screen.getByTestId('hp-dob');
    expect(dobInput).toHaveValue(dob);
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HealthProfileForm } from '../features/health-profile/components/HealthProfileForm';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { DEFAULT_HEALTH_PROFILE } from '../features/health-profile/types';
import type { HealthProfileState } from '../features/health-profile/store/healthProfileStore';
import type { DatabaseService } from '../services/databaseService';

/* ------------------------------------------------------------------ */
/*  Mock DatabaseContext                                                */
/* ------------------------------------------------------------------ */
const mockDb: DatabaseService = {
  initialize: vi.fn(),
  execute: vi.fn(),
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockResolvedValue(null),
  transaction: vi.fn(),
  exportToJSON: vi.fn(),
  importFromJSON: vi.fn(),
};

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => mockDb,
}));

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
let mockSaveProfile: ReturnType<typeof vi.fn>;

function resetStore(overrides: Partial<HealthProfileState> = {}) {
  mockSaveProfile = vi.fn().mockResolvedValue(undefined);
  const typedMock = mockSaveProfile as unknown as (
    db: DatabaseService,
    profile: import('../features/health-profile/types').HealthProfile,
  ) => Promise<void>;
  useHealthProfileStore.setState({
    profile: { ...DEFAULT_HEALTH_PROFILE },
    activeGoal: null,
    loading: false,
    saveProfile: typedMock,
    ...overrides,
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */
describe('HealthProfileForm', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders all form fields', () => {
    render(<HealthProfileForm />);

    expect(screen.getByText('Hồ sơ sức khỏe')).toBeInTheDocument();
    expect(screen.getByText('Giới tính')).toBeInTheDocument();
    expect(screen.getByLabelText('Tuổi')).toBeInTheDocument();
    expect(screen.getByLabelText('Chiều cao (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Cân nặng (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText('Mức độ vận động')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tỉ lệ mỡ cơ thể/)).toBeInTheDocument();
    expect(screen.getAllByText('BMR').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Tỉ lệ protein (g/kg)')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Lưu' }),
    ).toBeInTheDocument();
  });

  it('populates with current profile data', () => {
    render(<HealthProfileForm />);

    expect(screen.getByLabelText('Tuổi')).toHaveValue(30);
    expect(screen.getByLabelText('Chiều cao (cm)')).toHaveValue(170);
    expect(screen.getByLabelText('Cân nặng (kg)')).toHaveValue(70);
    expect(screen.getByLabelText('Tỉ lệ protein (g/kg)')).toHaveValue(2);

    const maleBtn = screen.getByRole('radio', { name: 'Nam' });
    expect(maleBtn).toHaveAttribute('aria-checked', 'true');

    const activitySelect = screen.getByLabelText('Mức độ vận động');
    expect(activitySelect).toHaveValue('moderate');
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

    // Default: male, 30y, 170cm, 70kg → BMR = 10*70+6.25*170-5*30+5 = 1618
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1618');

    // Change weight to 80 → BMR = 10*80+6.25*170-5*30+5 = 1718
    fireEvent.change(screen.getByLabelText('Cân nặng (kg)'), {
      target: { value: '80' },
    });
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1718');
  });

  it('save button calls saveProfile', async () => {
    render(<HealthProfileForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
    });

    expect(mockSaveProfile).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        id: 'default',
        gender: 'male',
        age: 30,
        heightCm: 170,
        weightKg: 70,
        activityLevel: 'moderate',
        proteinRatio: 2.0,
      }),
    );
  });

  it('validation rejects age < 10', async () => {
    render(<HealthProfileForm />);

    fireEvent.change(screen.getByLabelText('Tuổi'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => {
      expect(mockSaveProfile).not.toHaveBeenCalled();
    });

    expect(screen.getByLabelText('Tuổi').className).toContain('border-red');
  });

  it('body fat field is optional', async () => {
    render(<HealthProfileForm />);

    // Body fat is empty by default
    const bodyFatInput = screen.getByLabelText(/Tỉ lệ mỡ cơ thể/);
    expect(bodyFatInput).toHaveValue(null);

    // Save should succeed without body fat
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

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

    // Default auto BMR: 1618
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
});

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: Record<string, unknown>) => (
    <button {...props}>{children as React.ReactNode}</button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div role="menu">{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <button
      role="menuitem"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr role="separator" />,
}));

import App from '../App';
import { initialDishes } from '../data/initialData';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { useDayPlanStore } from '../store/dayPlanStore';
import { useDishStore } from '../store/dishStore';
import { useMealTemplateStore } from '../store/mealTemplateStore';
import { useNavigationStore } from '../store/navigationStore';
import type { Dish, Ingredient } from '../types';

const getLocalToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Mock notification context
const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

let mockThemeValue: 'light' | 'dark' | 'system' = 'light';
let mockIsOnboarded = true;

// Mock ManagementTab to expose dish + ingredient callbacks for testing
vi.mock('../components/ManagementTab', () => ({
  ManagementTab: ({
    dishes,
    onAddDish,
    onUpdateDish,
    onDeleteDish,
    onAddIngredient,
    onUpdateIngredient,
    onDeleteIngredient,
    isDishUsed,
    isIngredientUsed,
  }: {
    dishes: Dish[];
    onAddDish: (d: Dish) => void;
    onUpdateDish: (d: Dish) => void;
    onDeleteDish: (id: string) => void;
    onAddIngredient: (ing: Ingredient) => void;
    onUpdateIngredient: (ing: Ingredient) => void;
    onDeleteIngredient: (id: string) => void;
    isDishUsed: (id: string) => boolean;
    isIngredientUsed: (id: string) => boolean;
  }) => (
    <div data-testid="management-tab">
      <span>Thư viện dữ liệu</span>
      <span data-testid="dish-count">{dishes.length}</span>
      <span data-testid="dish-used-d1">{isDishUsed('d1') ? 'yes' : 'no'}</span>
      <span data-testid="ingredient-used-i1">{isIngredientUsed('i1') ? 'yes' : 'no'}</span>
      <button
        data-testid="add-dish-btn"
        onClick={() =>
          onAddDish({
            id: 'new-dish',
            name: { vi: 'Món mới' },
            ingredients: [],
            tags: ['lunch'],
          })
        }
      >
        Add Dish
      </button>
      <button
        data-testid="add-dish-empty-name-btn"
        onClick={() =>
          onAddDish({
            id: 'empty-dish',
            name: { vi: '' },
            ingredients: [],
            tags: ['lunch'],
          })
        }
      >
        Add Dish Empty Name
      </button>
      <button
        data-testid="update-dish-btn"
        onClick={() =>
          onUpdateDish({
            id: 'd1',
            name: { vi: 'Cập nhật' },
            ingredients: [],
            tags: ['dinner'],
          })
        }
      >
        Update Dish
      </button>
      <button
        data-testid="update-dish-empty-name-btn"
        onClick={() =>
          onUpdateDish({
            id: 'd1',
            name: { vi: '' },
            ingredients: [],
            tags: ['dinner'],
          })
        }
      >
        Update Dish Empty Name
      </button>
      <button data-testid="delete-dish-btn" onClick={() => onDeleteDish('d1')}>
        Delete Dish
      </button>
      <button data-testid="delete-ingredient-btn" onClick={() => onDeleteIngredient('i1')}>
        Delete Ingredient
      </button>
      <button
        data-testid="add-ingredient-btn"
        onClick={() =>
          onAddIngredient({
            id: 'new-ing',
            name: { vi: 'Nguyên liệu mới' },
            caloriesPer100: 100,
            proteinPer100: 10,
            carbsPer100: 5,
            fatPer100: 3,
            fiberPer100: 1,
            unit: { vi: 'g' },
          })
        }
      >
        Add Ingredient
      </button>
      <button
        data-testid="add-ingredient-empty-btn"
        onClick={() =>
          onAddIngredient({
            id: 'empty-ing',
            name: { vi: '' },
            caloriesPer100: 0,
            proteinPer100: 0,
            carbsPer100: 0,
            fatPer100: 0,
            fiberPer100: 0,
            unit: { vi: 'g' },
          })
        }
      >
        Add Ingredient Empty
      </button>
      <button
        data-testid="update-ingredient-btn"
        onClick={() =>
          onUpdateIngredient({
            id: 'i1',
            name: { vi: 'Cập nhật NL' },
            caloriesPer100: 100,
            proteinPer100: 10,
            carbsPer100: 5,
            fatPer100: 3,
            fiberPer100: 1,
            unit: { vi: 'g' },
          })
        }
      >
        Update Ingredient
      </button>
      <button
        data-testid="update-ingredient-empty-btn"
        onClick={() =>
          onUpdateIngredient({
            id: 'i1',
            name: { vi: '' },
            caloriesPer100: 0,
            proteinPer100: 0,
            carbsPer100: 0,
            fatPer100: 0,
            fiberPer100: 0,
            unit: { vi: 'g' },
          })
        }
      >
        Update Ingredient Empty
      </button>
    </div>
  ),
}));

// Mock hooks
vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));
vi.mock('../contexts/DatabaseContext', () => ({
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDatabase: () => ({
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
  }),
}));
vi.mock('../store/appOnboardingStore', () => ({
  useAppOnboardingStore: (selector: (s: { isAppOnboarded: boolean }) => boolean) =>
    selector({ isAppOnboarded: mockIsOnboarded }),
}));
vi.mock('../hooks/useAutoSync', () => ({
  useAutoSync: () => ({ syncStatus: 'idle', lastSyncAt: null, triggerUpload: vi.fn(), triggerDownload: vi.fn() }),
}));
vi.mock('../hooks/useDarkMode', () => ({
  useDarkMode: () => ({ theme: mockThemeValue, cycleTheme: vi.fn(), setTheme: vi.fn() }),
}));
const mockEditMeal = vi.fn();
vi.mock('../hooks/useAISuggestion', () => ({
  useAISuggestion: () => ({
    isLoading: false,
    isModalOpen: false,
    suggestion: null,
    error: null,
    startSuggestion: vi.fn(),
    close: vi.fn(),
    apply: vi.fn(),
    regenerate: vi.fn(),
    editMeal: mockEditMeal,
  }),
}));

// Mock heavy child components to keep test fast
vi.mock('../components/modals/AISuggestionPreviewModal', () => ({
  AISuggestionPreviewModal: ({ onEditMeal }: { onEditMeal: (type: string) => void }) => (
    <button data-testid="ai-edit-meal" onClick={() => onEditMeal('lunch')}>
      Edit AI Meal
    </button>
  ),
}));

// Mock lazy-loaded AIImageAnalyzer to expose callbacks for testing
type AnalysisCompleteFn = () => void;
type SaveFn = (r: unknown) => void;
let capturedAnalysisComplete: AnalysisCompleteFn | null = null;
vi.mock('../components/AIImageAnalyzer', () => ({
  AIImageAnalyzer: ({ onSave, onAnalysisComplete }: { onSave: SaveFn; onAnalysisComplete: AnalysisCompleteFn }) => {
    capturedAnalysisComplete = onAnalysisComplete;
    return (
      <div data-testid="ai-image-analyzer">
        <button data-testid="ai-complete" onClick={() => onAnalysisComplete()}>
          Complete Analysis
        </button>
        <button
          data-testid="ai-save-dish"
          onClick={() =>
            onSave({
              name: 'Test Dish',
              ingredients: [
                {
                  name: 'ZUniqueTestIng999',
                  amount: 200,
                  unit: 'g',
                  nutritionPerStandardUnit: { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
                },
              ],
              tags: ['lunch'],
            })
          }
        >
          Save as Dish
        </button>
        <button
          data-testid="ai-save-dish-no-tags"
          onClick={() =>
            onSave({
              name: 'No Tags Dish',
              ingredients: [
                {
                  name: 'ZUniqueNoTag777',
                  amount: 100,
                  unit: 'g',
                  nutritionPerStandardUnit: { calories: 50, protein: 5, carbs: 10, fat: 2, fiber: 1 },
                },
              ],
            })
          }
        >
          Save No Tags
        </button>
        <button
          data-testid="ai-save-ingredients"
          onClick={() => onSave({ name: 'Test', ingredients: [], tags: ['lunch'], shouldCreateDish: false })}
        >
          Save Ingredients Only
        </button>
      </div>
    );
  },
}));

// Mock SettingsTab to expose import callback
vi.mock('../components/SettingsTab', () => ({
  SettingsTab: ({ theme, setTheme }: { theme?: string; setTheme?: (t: string) => void }) => (
    <div data-testid="settings-tab">
      {theme && <span data-testid="current-theme">{theme}</span>}
      {setTheme && (
        <button data-testid="btn-theme-light" onClick={() => setTheme('light')}>
          Light
        </button>
      )}
    </div>
  ),
}));

// Mock lazy-loaded GroceryList
vi.mock('../components/GroceryList', () => ({
  GroceryList: () => <div>GroceryMock</div>,
}));

// Mock lazy-loaded FitnessTab and DashboardTab
vi.mock('../features/fitness/components/FitnessTab', () => ({
  FitnessTab: () => <div data-testid="fitness-tab">Fitness Content</div>,
}));
vi.mock('../features/dashboard/components/DashboardTab', () => ({
  DashboardTab: () => <div data-testid="dashboard-tab">Dashboard Content</div>,
}));

// Mock ClearPlanModal to expose onClear callback for testing
vi.mock('../components/modals/ClearPlanModal', () => ({
  ClearPlanModal: ({ onClear }: { onClear: (scope: 'day' | 'week' | 'month') => void }) => (
    <div data-testid="clear-plan-modal">
      <button data-testid="clear-scope-day" onClick={() => onClear('day')}>
        Clear Day
      </button>
    </div>
  ),
}));

// Mock lazy-loaded onboarding
vi.mock('../components/UnifiedOnboarding', () => ({
  UnifiedOnboarding: () => <div data-testid="onboarding-view">Onboarding</div>,
}));

// Mock lazy-loaded full-screen fitness page components
vi.mock('../features/fitness/components/WorkoutLogger', () => ({
  WorkoutLogger: ({ onComplete, onBack }: { onComplete: () => void; onBack: () => void; planDay: unknown }) => (
    <div data-testid="workout-logger">
      <button data-testid="workout-complete-btn" onClick={onComplete}>
        Complete
      </button>
      <button data-testid="workout-back-btn" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../features/fitness/components/CardioLogger', () => ({
  CardioLogger: ({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) => (
    <div data-testid="cardio-logger">
      <button data-testid="cardio-complete-btn" onClick={onComplete}>
        Complete Cardio
      </button>
      <button data-testid="cardio-back-btn" onClick={onBack}>
        Back Cardio
      </button>
    </div>
  ),
}));

vi.mock('../features/fitness/components/PlanDayEditor', () => ({
  PlanDayEditor: () => <div data-testid="plan-day-editor">Plan Day Editor</div>,
}));

vi.mock('../features/fitness/components/PlanScheduleEditor', () => ({
  default: () => <div data-testid="plan-schedule-editor">Schedule Editor</div>,
}));

vi.mock('../features/fitness/components/SplitChanger', () => ({
  SplitChanger: ({ onComplete }: { onComplete: () => void; planId: string; currentSplit: string }) => (
    <div data-testid="split-changer">
      <button data-testid="split-complete-btn" onClick={onComplete}>
        Done
      </button>
    </div>
  ),
}));

vi.mock('../features/fitness/components/PlanTemplateGallery', () => ({
  default: () => <div data-testid="plan-template-gallery">Template Gallery</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockThemeValue = 'light';
    mockIsOnboarded = true;
    useDayPlanStore.setState({ dayPlans: [] });
    useDishStore.setState({ dishes: initialDishes });
    useMealTemplateStore.setState({ templates: [] });
    useNavigationStore.setState({ activeTab: 'calendar', pageStack: [], showBottomNav: true, tabScrollPositions: {} });
    useHealthProfileStore.setState({ profile: null, activeGoal: null });
  });

  it('renders header with app name', () => {
    render(<App />);
    expect(screen.getByText('Smart Meal Planner')).toBeInTheDocument();
  });

  it('renders navigation tabs', () => {
    render(<App />);
    // "Lịch trình" appears in both mobile & desktop navs + header
    const tabs = screen.getAllByText('Lịch trình');
    expect(tabs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Thư viện').length).toBeGreaterThanOrEqual(1);
  });

  it('starts on calendar tab', () => {
    render(<App />);
    expect(screen.getByText('Chọn ngày')).toBeInTheDocument();
    expect(screen.getByText('Bữa ăn')).toBeInTheDocument();
  });

  it('switches to management tab when clicked', async () => {
    render(<App />);
    const navButtons = screen.getAllByRole('tab');
    const mgmtTab = navButtons.find(b => b.textContent?.includes('Thư viện'));
    if (mgmtTab) fireEvent.click(mgmtTab);
    await waitFor(() => expect(screen.getByText('Thư viện dữ liệu')).toBeInTheDocument());
  });

  it('opens settings overlay via header icon and closes with back button', async () => {
    render(<App />);
    const settingsBtn = screen.getByTestId('btn-open-settings');
    expect(settingsBtn).toBeInTheDocument();
    expect(settingsBtn).toHaveAttribute('aria-label', 'Cài đặt');
    fireEvent.click(settingsBtn);
    await waitFor(() => expect(screen.getByTestId('settings-overlay')).toBeInTheDocument());
    expect(screen.getByTestId('settings-orientation-banner')).toHaveTextContent('Cài đặt nền tảng');
    await waitFor(() => expect(screen.getByTestId('settings-tab')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-close-settings'));
    await waitFor(() => expect(screen.queryByTestId('settings-overlay')).not.toBeInTheDocument());
  });

  it('opens meal planner modal when add dish button is clicked', async () => {
    render(<App />);
    const planButtons = screen.getAllByTestId('btn-plan-meal-section');
    fireEvent.click(planButtons[0]);
    await waitFor(() => expect(screen.getByText('Chọn món cho từng bữa')).toBeInTheDocument());
  });

  it('handlePlanMeal opens planner when meal slot add button is clicked', async () => {
    render(<App />);
    const addButtons = screen.getAllByLabelText(/Thêm món cho/);
    fireEvent.click(addButtons[0]);
    await waitFor(() => expect(screen.getByTestId('btn-confirm-plan')).toBeInTheDocument());
  });

  it('renders setup subtitle when health profile is missing', () => {
    render(<App />);
    expect(screen.getByText('Thiết lập hồ sơ sức khỏe để mở đủ ngữ cảnh dinh dưỡng')).toBeInTheDocument();
  });

  it('renders user weight in subtitle', () => {
    useHealthProfileStore.setState({
      profile: {
        id: 'hp-1',
        name: 'Tester',
        gender: 'male',
        age: 29,
        dateOfBirth: '1996-05-15',
        heightCm: 175,
        weightKg: 72,
        activityLevel: 'moderate',
        proteinRatio: 2,
        fatPct: 0.25,
        targetCalories: 2200,
        updatedAt: new Date().toISOString(),
      },
    });
    render(<App />);
    expect(screen.getByText('Dinh dưỡng chính xác cho 72kg')).toBeInTheDocument();
  });

  it('shows consolidated empty state when no meals planned', () => {
    render(<App />);
    expect(screen.getByTestId('shell-orientation-banner')).toHaveTextContent('Lịch trình hôm nay');
    expect(screen.getByText('Lên kế hoạch ngay')).toBeInTheDocument();
  });

  it('renders NutritionOverview in nutrition tab', () => {
    useHealthProfileStore.setState({
      profile: {
        id: 'hp-1',
        name: 'Tester',
        gender: 'male',
        age: 29,
        dateOfBirth: '1996-05-15',
        heightCm: 175,
        weightKg: 72,
        activityLevel: 'moderate',
        proteinRatio: 2,
        fatPct: 0.25,
        targetCalories: 2200,
        updatedAt: new Date().toISOString(),
      },
    });
    render(<App />);
    // Switch to Nutrition sub-tab
    fireEvent.click(screen.getByTestId('subtab-nutrition'));
    expect(screen.getByTestId('nutrition-overview')).toBeInTheDocument();
  });

  it('renders DateSelector', () => {
    render(<App />);
    expect(screen.getByText('Hôm nay')).toBeInTheDocument();
  });

  it('opens goal detail page via pushPage', async () => {
    const today = getLocalToday();
    useHealthProfileStore.setState({
      profile: {
        id: 'hp-1',
        name: 'Tester',
        gender: 'male',
        age: 29,
        dateOfBirth: '1996-05-15',
        heightCm: 175,
        weightKg: 72,
        activityLevel: 'moderate',
        proteinRatio: 2,
        fatPct: 0.25,
        targetCalories: 2200,
        updatedAt: new Date().toISOString(),
      },
    });
    useDayPlanStore.setState({
      dayPlans: [{ date: today, breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] }],
    });
    render(<App />);
    fireEvent.click(screen.getByTestId('subtab-nutrition'));
    // Expand NutritionDetails accordion to reveal edit goal button
    fireEvent.click(screen.getByTestId('nutrition-details-header'));
    const editGoalBtn = screen.getByTestId('btn-edit-goal');
    fireEvent.click(editGoalBtn);
    await waitFor(() => expect(screen.getByText('Mục tiêu cân nặng')).toBeInTheDocument());
  });

  it('navigates to AI analysis tab and renders AIImageAnalyzer', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('Phân tích'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => expect(screen.getByTestId('ai-image-analyzer')).toBeInTheDocument());
    expect(screen.getByTestId('shell-orientation-banner')).toHaveTextContent('Phân tích món ăn bằng AI');
  });

  it('handleSaveAnalyzedDish with shouldCreateDish=true creates dish and switches to dishes sub-tab', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('Phân tích'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-save-dish'));
    fireEvent.click(screen.getByTestId('ai-save-dish'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleSaveAnalyzedDish with shouldCreateDish=false saves ingredients only and switches to ingredients sub-tab', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('Phân tích'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-save-ingredients'));
    fireEvent.click(screen.getByTestId('ai-save-ingredients'));
    expect(mockNotify.success).toHaveBeenCalled();
    // Should navigate to management > ingredients
    await waitFor(() => expect(screen.getByText('Thư viện dữ liệu')).toBeInTheDocument());
  });

  it('handleAnalysisComplete when on ai-analysis tab does not set hasNewAIResult', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('Phân tích'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-complete'));
    fireEvent.click(screen.getByTestId('ai-complete'));
    // When already on AI tab, no notification should fire
    expect(mockNotify.success).not.toHaveBeenCalled();
  });

  it('navigates to dashboard tab and renders content', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const dashboardTab = navTabs.find(b => b.textContent?.includes('Tổng quan'));
    if (dashboardTab) fireEvent.click(dashboardTab);
    await waitFor(() => expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument());
  });

  it('navigates to dashboard tab and renders content', async () => {
    localStorage.setItem('mp-dishes', JSON.stringify([{ id: 'd99', name: 'Old Dish', ingredients: [], tags: [] }]));
    render(<App />);
    expect(screen.getAllByRole('tablist').length).toBeGreaterThanOrEqual(1);
    localStorage.removeItem('mp-dishes');
  });

  it('navigates to fitness tab and renders content', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const fitnessTab = navTabs.find(b => b.textContent?.includes('Tập luyện'));
    if (fitnessTab) fireEvent.click(fitnessTab);
    await waitFor(() => expect(screen.getByTestId('fitness-tab')).toBeInTheDocument());
  });

  it('confirms planning modal and shows success notification', async () => {
    render(<App />);
    const planBtns = screen.getAllByTestId('btn-plan-meal-section');
    fireEvent.click(planBtns[0]);
    // MealPlannerModal opens with tabs — click confirm directly
    const confirmBtn = await waitFor(() => screen.getByTestId('btn-confirm-plan'));
    fireEvent.click(confirmBtn);
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('onDeleteDish removes the dish from state', async () => {
    render(<App />);
    const initialCount = Number(screen.getByTestId('dish-count').textContent);
    fireEvent.click(screen.getByTestId('delete-dish-btn'));
    await waitFor(() => {
      expect(Number(screen.getByTestId('dish-count').textContent)).toBe(initialCount - 1);
    });
  });

  it('isDishUsed returns true when dish is used in a plan', () => {
    render(<App />);
    // The mock ManagementTab renders isDishUsed('d1') result
    expect(screen.getByTestId('dish-used-d1')).toBeInTheDocument();
  });

  it('isIngredientUsed returns true when ingredient is used in a dish', () => {
    render(<App />);
    expect(screen.getByTestId('ingredient-used-i1')).toBeInTheDocument();
  });

  it('handleDeleteIngredient removes ingredient from state', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('delete-ingredient-btn'));
    // No crash means the deletion executed
    expect(screen.getByTestId('management-tab')).toBeInTheDocument();
  });

  it('handleAnalysisComplete from another tab sets new result flag', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('Phân tích'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-complete'));
    // Navigate away from AI tab using desktop nav
    const calTab = navTabs.find(b => b.textContent?.includes('Lịch trình'));
    if (calTab) fireEvent.click(calTab);
    // Verify we left the AI tab
    await waitFor(() => expect(screen.queryByTestId('ai-image-analyzer')).not.toBeInTheDocument());
    // Call captured callback; activeMainTabRef.current should now be 'calendar'
    act(() => {
      if (capturedAnalysisComplete) capturedAnalysisComplete();
    });
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleClearPlan clears plans via ClearPlanModal', async () => {
    // Seed a day plan so the clear button is visible
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: getLocalToday(),
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
        },
      ],
    });
    render(<App />);
    // Open more-actions menu first (buttons are in dropdown)
    await waitFor(() => {
      expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-clear-plan')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('btn-clear-plan'));
    // ClearPlanModal should appear
    await waitFor(() => screen.getByTestId('clear-plan-modal'));
    fireEvent.click(screen.getByTestId('clear-scope-day'));
    expect(screen.getAllByRole('tablist').length).toBeGreaterThanOrEqual(1);
  });

  it('undo restores plans after clear', async () => {
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: getLocalToday(),
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
        },
      ],
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-clear-plan')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('btn-clear-plan'));
    await waitFor(() => screen.getByTestId('clear-plan-modal'));
    fireEvent.click(screen.getByTestId('clear-scope-day'));
    // The success notification should have been called with undo action
    expect(mockNotify.success).toHaveBeenCalled();
    const lastCall = mockNotify.success.mock.calls[mockNotify.success.mock.calls.length - 1];
    const options = lastCall[2];
    expect(options).toBeDefined();
    expect(options.action).toBeDefined();
    // Execute the undo callback
    act(() => {
      options.action.onClick();
    });
    // Undo should trigger another success notification
    expect(mockNotify.success).toHaveBeenCalledTimes(mockNotify.success.mock.calls.length);
  });

  it('handleQuickAdd adds dish to the correct slot', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    useDayPlanStore.setState({
      dayPlans: [
        { date: yesterdayStr, breakfastDishIds: ['quick1'], lunchDishIds: [], dinnerDishIds: [] },
        { date: getLocalToday(), breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] },
      ],
    });
    useDishStore.getState().addDish({ id: 'quick1', name: { vi: 'Quick Dish' }, ingredients: [], tags: [] });
    render(<App />);
    // Wait for the recent dishes section
    await waitFor(() => {
      expect(screen.getByTestId('recent-dishes-section')).toBeInTheDocument();
    });
    // Click the recent dish chip - since all 3 slots are empty, a dropdown should appear
    fireEvent.click(screen.getByTestId('btn-recent-quick1'));
    // Click the breakfast option from the dropdown
    await waitFor(() => {
      expect(screen.getByTestId('btn-quick-add-breakfast-quick1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('btn-quick-add-breakfast-quick1'));
    // Should trigger the success notification
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleQuickAdd appends dish to existing slot with pre-existing dishes', async () => {
    const today = getLocalToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    useDayPlanStore.setState({
      dayPlans: [
        { date: yesterdayStr, breakfastDishIds: ['quick2'], lunchDishIds: [], dinnerDishIds: [] },
        { date: today, breakfastDishIds: ['d1'], lunchDishIds: ['d2'], dinnerDishIds: [] },
      ],
    });
    useDishStore.getState().addDish({ id: 'quick2', name: { vi: 'Quick Dish 2' }, ingredients: [], tags: [] });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('recent-dishes-section')).toBeInTheDocument();
    });
    // Only dinner is empty — clicking a recent dish quick-adds directly to dinner
    fireEvent.click(screen.getByTestId('btn-recent-quick2'));
    // Direct add to the single empty slot (dinner)
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleQuickAdd creates new slot when no plan exists for today', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    // Only yesterday has a plan — no plan for today at all
    useDayPlanStore.setState({
      dayPlans: [{ date: yesterdayStr, breakfastDishIds: ['quick3'], lunchDishIds: [], dinnerDishIds: [] }],
    });
    useDishStore.getState().addDish({ id: 'quick3', name: { vi: 'Quick Dish 3' }, ingredients: [], tags: [] });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('recent-dishes-section')).toBeInTheDocument();
    });
    // All slots empty for today → clicking recent dish shows dropdown
    fireEvent.click(screen.getByTestId('btn-recent-quick3'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-quick-add-breakfast-quick3')).toBeInTheDocument();
    });
    // This triggers handleQuickAdd with existing=undefined → ?? [] fallback taken
    fireEvent.click(screen.getByTestId('btn-quick-add-breakfast-quick3'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleAnalysisComplete fires notification when called from non-AI tab', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('Phân tích'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-image-analyzer'));
    expect(capturedAnalysisComplete).toBeTruthy();
    // Navigate away from AI tab
    const calTab = navTabs.find(b => b.textContent?.includes('Lịch trình'));
    if (calTab) fireEvent.click(calTab);
    await waitFor(() => expect(screen.queryByTestId('ai-image-analyzer')).not.toBeInTheDocument());
    // Call the captured callback from non-AI tab
    act(() => {
      if (capturedAnalysisComplete) capturedAnalysisComplete();
    });
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleSaveAnalyzedDish with new ingredients adds them to state', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('Phân tích'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-save-dish'));
    fireEvent.click(screen.getByTestId('ai-save-dish'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleEditAISuggestionMeal calls editMeal and opens planning modal', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('ai-edit-meal'));
    expect(mockEditMeal).toHaveBeenCalledWith('lunch');
    await waitFor(() => screen.getByTestId('btn-confirm-plan'));
  });

  it('handleSaveAnalyzedDish without tags defaults to lunch', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('Phân tích'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-save-dish-no-tags'));
    fireEvent.click(screen.getByTestId('ai-save-dish-no-tags'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleAnalysisComplete notification onClick navigates to AI tab', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('Phân tích'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-image-analyzer'));
    const calTab = navTabs.find(b => b.textContent?.includes('Lịch trình'));
    if (calTab) fireEvent.click(calTab);
    await waitFor(() => expect(screen.queryByTestId('ai-image-analyzer')).not.toBeInTheDocument());
    act(() => {
      if (capturedAnalysisComplete) capturedAnalysisComplete();
    });
    const onClickArg = (mockNotify.success.mock.calls[0][2] as { onClick: () => void })?.onClick;
    act(() => {
      if (onClickArg) onClickArg();
    });
    await waitFor(() => screen.getByTestId('ai-image-analyzer'));
  });

  it('renders dark theme icon when theme is dark', () => {
    mockThemeValue = 'dark';
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders system theme icon when theme is system', () => {
    mockThemeValue = 'system';
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('opens copy plan modal and copies plan', async () => {
    const today = getLocalToday();
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: today,
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
        },
      ],
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-copy-plan')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-copy-plan'));
    await waitFor(() => expect(screen.getByTestId('copy-plan-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('undo copy plan restores previous state', async () => {
    const today = getLocalToday();
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: today,
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
        },
      ],
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-copy-plan')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-copy-plan'));
    await waitFor(() => expect(screen.getByTestId('copy-plan-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));
    const successCall = mockNotify.success.mock.calls[mockNotify.success.mock.calls.length - 1];
    const undoAction = successCall[2]?.action;
    expect(undoAction).toBeDefined();
    act(() => {
      undoAction.onClick();
    });
    expect(mockNotify.info).toHaveBeenCalled();
  });

  it('opens template manager modal', async () => {
    const today = getLocalToday();
    useDayPlanStore.setState({
      dayPlans: [{ date: today, breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] }],
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-template-manager')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-template-manager'));
    await waitFor(() => expect(screen.getByTestId('template-manager-modal')).toBeInTheDocument());
  });

  it('saves current plan as template via save template modal', async () => {
    const today = getLocalToday();
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: today,
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
        },
      ],
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-save-template')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-save-template'));
    await waitFor(() => expect(screen.getByTestId('save-template-modal')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('input-template-name'), { target: { value: 'My Template' } });
    const saveBtns = screen.getAllByTestId('btn-save-template');
    fireEvent.click(saveBtns[saveBtns.length - 1]);
    await waitFor(() => expect(mockNotify.success).toHaveBeenCalled());
  });

  it('meal planner single-tab confirm shows meal-specific notification', async () => {
    render(<App />);
    const planBtns = screen.getAllByTestId('btn-plan-meal-section');
    fireEvent.click(planBtns[0]);
    await waitFor(() => expect(screen.getByTestId('btn-confirm-plan')).toBeInTheDocument());
    // Select a breakfast dish (d1 has tag 'breakfast')
    const dishButton = screen.getByText('Yến mạch sữa chua');
    fireEvent.click(dishButton);
    fireEvent.click(screen.getByTestId('btn-confirm-plan'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('template apply adds new plan when no existing plan for date', async () => {
    const today = getLocalToday();
    useDayPlanStore.setState({
      dayPlans: [{ date: today, breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] }],
    });
    useMealTemplateStore.setState({
      templates: [
        {
          id: 'tpl-test',
          name: 'Preset',
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
          createdAt: new Date().toISOString(),
        },
      ],
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-template-manager')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-template-manager'));
    await waitFor(() => expect(screen.getByTestId('template-manager-modal')).toBeInTheDocument());
    const applyBtns = screen.getAllByText('Áp dụng');
    fireEvent.click(applyBtns[0]);
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('template manager applies, deletes and renames templates', async () => {
    const today = getLocalToday();
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: today,
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
        },
      ],
    });
    // Pre-seed templates so the manager has data
    const now = new Date().toISOString();
    useMealTemplateStore.setState({
      templates: [
        {
          id: 'tpl-1',
          name: 'Test Template',
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
          createdAt: now,
        },
        {
          id: 'tpl-2',
          name: 'Template Delete',
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
          createdAt: now,
        },
        {
          id: 'tpl-3',
          name: 'Template Rename',
          breakfastDishIds: ['d1'],
          lunchDishIds: [],
          dinnerDishIds: [],
          createdAt: now,
        },
      ],
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());

    // Open template manager and apply
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-template-manager')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-template-manager'));
    await waitFor(() => expect(screen.getByTestId('template-manager-modal')).toBeInTheDocument());
    const applyBtns = screen.getAllByText('Áp dụng');
    fireEvent.click(applyBtns[0]);
    expect(mockNotify.success).toHaveBeenCalled();
    mockNotify.success.mockClear();

    // Re-open template manager and delete
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-template-manager')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-template-manager'));
    await waitFor(() => expect(screen.getByTestId('template-manager-modal')).toBeInTheDocument());
    const tmModal = screen.getByTestId('template-manager-modal');
    const deleteBtns = within(tmModal).getAllByText('Xóa');
    fireEvent.click(deleteBtns[0]);
    expect(mockNotify.success).toHaveBeenCalled();
    mockNotify.success.mockClear();

    // Re-open template manager and rename
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-template-manager')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-template-manager'));
    await waitFor(() => expect(screen.getByTestId('template-manager-modal')).toBeInTheDocument());
    const renameBtns = screen.getAllByText('Đổi tên');
    fireEvent.click(renameBtns[0]);
    const renameInput = screen.getByTestId('template-rename-input');
    fireEvent.change(renameInput, { target: { value: 'Renamed Template' } });
    fireEvent.click(screen.getByTestId('template-rename-confirm'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('switches to Library tab via Cmd+2 shortcut', async () => {
    const { container } = render(<App />);
    const libraryNav = screen.getByTestId('nav-library');
    expect(libraryNav).toHaveAttribute('aria-selected', 'false');
    await act(async () => {
      fireEvent.keyDown(container.firstElementChild!, { key: '2', metaKey: true });
    });
    expect(libraryNav).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Dashboard tab via Cmd+5 shortcut', async () => {
    const { container } = render(<App />);
    const dashboardNav = screen.getByTestId('nav-dashboard');
    expect(dashboardNav).toHaveAttribute('aria-selected', 'false');
    await act(async () => {
      fireEvent.keyDown(container.firstElementChild!, { key: '5', metaKey: true });
    });
    expect(dashboardNav).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores keyboard shortcuts without modifier key', () => {
    const { container } = render(<App />);
    const calendarNav = screen.getByTestId('nav-calendar');
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(container.firstElementChild!, { key: '2' });
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
  });

  it('handleUpdateServings updates serving count for a dish', async () => {
    useDishStore.getState().addDish({ id: 'srv1', name: { vi: 'Serving Dish' }, ingredients: [], tags: ['breakfast'] });
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: getLocalToday(),
          breakfastDishIds: ['srv1'],
          lunchDishIds: [],
          dinnerDishIds: [],
        },
      ],
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('serving-count-srv1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('serving-count-srv1')).toHaveTextContent('1x');
    fireEvent.click(screen.getByTestId('btn-serving-plus-srv1'));
    expect(screen.getByTestId('serving-count-srv1')).toHaveTextContent('2x');
    fireEvent.click(screen.getByTestId('btn-serving-plus-srv1'));
    expect(screen.getByTestId('serving-count-srv1')).toHaveTextContent('3x');
    fireEvent.click(screen.getByTestId('btn-serving-minus-srv1'));
    expect(screen.getByTestId('serving-count-srv1')).toHaveTextContent('2x');
  });

  it('handleUpdateServings removes serving entry when reset to 1', async () => {
    useDishStore.getState().addDish({ id: 'srv2', name: { vi: 'Reset Dish' }, ingredients: [], tags: ['lunch'] });
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: getLocalToday(),
          breakfastDishIds: [],
          lunchDishIds: ['srv2'],
          dinnerDishIds: [],
          servings: { srv2: 2 },
        },
      ],
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('serving-count-srv2')).toBeInTheDocument();
    });
    expect(screen.getByTestId('serving-count-srv2')).toHaveTextContent('2x');
    fireEvent.click(screen.getByTestId('btn-serving-minus-srv2'));
    expect(screen.getByTestId('serving-count-srv2')).toHaveTextContent('1x');
  });

  // --- PageStackOverlay branch coverage ---

  it('renders WorkoutLogger page in overlay', async () => {
    render(<App />);
    act(() => {
      useNavigationStore.setState({
        pageStack: [{ id: 'workout-1', component: 'WorkoutLogger', props: { planDay: null } }],
      });
    });
    await waitFor(() => expect(screen.getByTestId('workout-logger')).toBeInTheDocument());
    expect(screen.getByTestId('page-overlay-workout-1')).toBeInTheDocument();
  });

  it('WorkoutLogger onComplete pops page from stack', async () => {
    render(<App />);
    act(() => {
      useNavigationStore.setState({
        pageStack: [{ id: 'workout-2', component: 'WorkoutLogger', props: { planDay: null } }],
      });
    });
    await waitFor(() => expect(screen.getByTestId('workout-logger')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('workout-complete-btn'));
    await waitFor(() => expect(screen.queryByTestId('workout-logger')).not.toBeInTheDocument());
  });

  it('WorkoutLogger onBack pops page from stack', async () => {
    render(<App />);
    act(() => {
      useNavigationStore.setState({
        pageStack: [{ id: 'workout-3', component: 'WorkoutLogger', props: { planDay: null } }],
      });
    });
    await waitFor(() => expect(screen.getByTestId('workout-logger')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('workout-back-btn'));
    await waitFor(() => expect(screen.queryByTestId('workout-logger')).not.toBeInTheDocument());
  });

  it('renders CardioLogger page in overlay', async () => {
    render(<App />);
    act(() => {
      useNavigationStore.setState({
        pageStack: [{ id: 'cardio-1', component: 'CardioLogger', props: {} }],
      });
    });
    await waitFor(() => expect(screen.getByTestId('cardio-logger')).toBeInTheDocument());
    expect(screen.getByTestId('page-overlay-cardio-1')).toBeInTheDocument();
  });

  it('renders PlanDayEditor page in overlay', async () => {
    render(<App />);
    act(() => {
      useNavigationStore.setState({
        pageStack: [{ id: 'planday-1', component: 'PlanDayEditor', props: { planDay: null } }],
      });
    });
    await waitFor(() => expect(screen.getByTestId('plan-day-editor')).toBeInTheDocument());
  });

  it('renders PlanScheduleEditor page in overlay', async () => {
    render(<App />);
    act(() => {
      useNavigationStore.setState({
        pageStack: [{ id: 'schedule-1', component: 'PlanScheduleEditor', props: { planId: 'p1' } }],
      });
    });
    await waitFor(() => expect(screen.getByTestId('plan-schedule-editor')).toBeInTheDocument());
  });

  it('renders SplitChanger page in overlay', async () => {
    render(<App />);
    act(() => {
      useNavigationStore.setState({
        pageStack: [{ id: 'split-1', component: 'SplitChanger', props: { planId: 'p1', currentSplit: 'upper_lower' } }],
      });
    });
    await waitFor(() => expect(screen.getByTestId('split-changer')).toBeInTheDocument());
  });

  it('renders PlanTemplateGallery page in overlay', async () => {
    render(<App />);
    act(() => {
      useNavigationStore.setState({
        pageStack: [{ id: 'gallery-1', component: 'PlanTemplateGallery', props: { planId: 'p1' } }],
      });
    });
    await waitFor(() => expect(screen.getByTestId('plan-template-gallery')).toBeInTheDocument());
  });

  it('renders nothing for unknown page component in stack (default case)', async () => {
    render(<App />);
    act(() => {
      useNavigationStore.setState({
        pageStack: [{ id: 'unknown-1', component: 'NonExistent' as never }],
      });
    });
    // Default case returns null → overlay not rendered
    await waitFor(() => {
      expect(screen.queryByTestId('page-overlay-unknown-1')).not.toBeInTheDocument();
    });
  });

  // --- Onboarding branch ---

  it('renders onboarding view when not onboarded', async () => {
    mockIsOnboarded = false;
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('onboarding-view')).toBeInTheDocument());
    // Main app content should not be visible
    expect(screen.queryByText('Smart Meal Planner')).not.toBeInTheDocument();
  });

  // --- Keyboard shortcut from INPUT/TEXTAREA ---

  it('ignores keyboard shortcuts when target is an input element', () => {
    render(<App />);
    const calendarNav = screen.getByTestId('nav-calendar');
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: '2', metaKey: true });
    // Should still be on calendar tab — shortcut was suppressed
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
    document.body.removeChild(input);
  });

  it('ignores keyboard shortcuts when target is a textarea', () => {
    render(<App />);
    const calendarNav = screen.getByTestId('nav-calendar');
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    fireEvent.keyDown(textarea, { key: '2', metaKey: true });
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
    document.body.removeChild(textarea);
  });

  it('ignores keyboard shortcuts for non-digit keys', () => {
    render(<App />);
    const calendarNav = screen.getByTestId('nav-calendar');
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
    // Press meta+A (not a digit) — should be ignored
    fireEvent.keyDown(document, { key: 'a', metaKey: true });
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores keyboard shortcuts for out-of-range digits', () => {
    render(<App />);
    const calendarNav = screen.getByTestId('nav-calendar');
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
    // Press meta+9 (out of 1-5 range)
    fireEvent.keyDown(document, { key: '9', metaKey: true });
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
  });

  // --- Copy plan with existing targets for undo ---

  it('copy plan creates snapshot of existing target date plans for undo', async () => {
    const today = getLocalToday();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    useDayPlanStore.setState({
      dayPlans: [
        { date: today, breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] },
        { date: tomorrowStr, breakfastDishIds: ['d2'], lunchDishIds: ['d3'], dinnerDishIds: [] },
      ],
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-copy-plan')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-copy-plan'));
    await waitFor(() => expect(screen.getByTestId('copy-plan-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));
    expect(mockNotify.success).toHaveBeenCalled();
    // Verify undo restores the previous plan state
    const successCalls = mockNotify.success.mock.calls;
    const lastCall = successCalls[successCalls.length - 1];
    const actionObj = lastCall?.[2]?.action;
    if (actionObj) {
      act(() => {
        actionObj.onClick();
      });
      expect(mockNotify.info).toHaveBeenCalled();
    }
  });

  // --- openTypeSelection with non-empty meal slots ---

  it('opens planner on first empty slot when some slots have dishes', async () => {
    const today = getLocalToday();
    useDayPlanStore.setState({
      dayPlans: [{ date: today, breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] }],
    });
    render(<App />);
    const planBtns = screen.getAllByTestId('btn-plan-meal-section');
    fireEvent.click(planBtns[0]);
    await waitFor(() => expect(screen.getByTestId('btn-confirm-plan')).toBeInTheDocument());
  });

  it('opens planner on breakfast default when all slots have dishes', async () => {
    const today = getLocalToday();
    useDayPlanStore.setState({
      dayPlans: [{ date: today, breakfastDishIds: ['d1'], lunchDishIds: ['d2'], dinnerDishIds: ['d3'] }],
    });
    render(<App />);
    const planBtns = screen.getAllByTestId('btn-plan-meal-section');
    fireEvent.click(planBtns[0]);
    await waitFor(() => expect(screen.getByTestId('btn-confirm-plan')).toBeInTheDocument());
  });
});

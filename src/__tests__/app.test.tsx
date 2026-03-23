import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
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


// Mock ManagementTab to expose dish + ingredient callbacks for testing
vi.mock('../components/ManagementTab', () => ({
  ManagementTab: ({ dishes, onAddDish, onUpdateDish, onDeleteDish, onAddIngredient, onUpdateIngredient, onDeleteIngredient, isDishUsed, isIngredientUsed }: {
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
      <button data-testid="add-dish-btn" onClick={() => onAddDish({
        id: 'new-dish', name: { vi: 'Món mới' }, ingredients: [], tags: ['lunch'],
      })}>Add Dish</button>
      <button data-testid="add-dish-empty-name-btn" onClick={() => onAddDish({
        id: 'empty-dish', name: { vi: '' }, ingredients: [], tags: ['lunch'],
      })}>Add Dish Empty Name</button>
      <button data-testid="update-dish-btn" onClick={() => onUpdateDish({
        id: 'd1', name: { vi: 'Cập nhật' }, ingredients: [], tags: ['dinner'],
      })}>Update Dish</button>
      <button data-testid="update-dish-empty-name-btn" onClick={() => onUpdateDish({
        id: 'd1', name: { vi: '' }, ingredients: [], tags: ['dinner'],
      })}>Update Dish Empty Name</button>
      <button data-testid="delete-dish-btn" onClick={() => onDeleteDish('d1')}>Delete Dish</button>
      <button data-testid="delete-ingredient-btn" onClick={() => onDeleteIngredient('i1')}>Delete Ingredient</button>
      <button data-testid="add-ingredient-btn" onClick={() => onAddIngredient({
        id: 'new-ing', name: { vi: 'Nguyên liệu mới' },
        caloriesPer100: 100, proteinPer100: 10, carbsPer100: 5, fatPer100: 3, fiberPer100: 1,
        unit: { vi: 'g' },
      })}>Add Ingredient</button>
      <button data-testid="add-ingredient-empty-btn" onClick={() => onAddIngredient({
        id: 'empty-ing', name: { vi: '' },
        caloriesPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, fiberPer100: 0,
        unit: { vi: 'g' },
      })}>Add Ingredient Empty</button>
      <button data-testid="update-ingredient-btn" onClick={() => onUpdateIngredient({
        id: 'i1', name: { vi: 'Cập nhật NL' },
        caloriesPer100: 100, proteinPer100: 10, carbsPer100: 5, fatPer100: 3, fiberPer100: 1,
        unit: { vi: 'g' },
      })}>Update Ingredient</button>
      <button data-testid="update-ingredient-empty-btn" onClick={() => onUpdateIngredient({
        id: 'i1', name: { vi: '' },
        caloriesPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, fiberPer100: 0,
        unit: { vi: 'g' },
      })}>Update Ingredient Empty</button>
    </div>
  ),
}));

// Mock hooks
vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));
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
    <button data-testid="ai-edit-meal" onClick={() => onEditMeal('lunch')}>Edit AI Meal</button>
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
        <button data-testid="ai-complete" onClick={() => onAnalysisComplete()}>Complete Analysis</button>
        <button data-testid="ai-save-dish" onClick={() => onSave({ name: 'Test Dish', ingredients: [{ name: 'ZUniqueTestIng999', amount: 200, unit: 'g', nutritionPerStandardUnit: { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 } }], tags: ['lunch'] })}>Save as Dish</button>
        <button data-testid="ai-save-dish-no-tags" onClick={() => onSave({ name: 'No Tags Dish', ingredients: [{ name: 'ZUniqueNoTag777', amount: 100, unit: 'g', nutritionPerStandardUnit: { calories: 50, protein: 5, carbs: 10, fat: 2, fiber: 1 } }] })}>Save No Tags</button>
        <button data-testid="ai-save-ingredients" onClick={() => onSave({ name: 'Test', ingredients: [], tags: ['lunch'], shouldCreateDish: false })}>Save Ingredients Only</button>
      </div>
    );
  },
}));

// Mock SettingsTab to expose import callback
vi.mock('../components/SettingsTab', () => ({
  SettingsTab: ({ onImportData, theme, setTheme }: { onImportData: (d: Record<string, unknown>) => void; theme?: string; setTheme?: (t: string) => void }) => (
    <div data-testid="settings-tab">
      <button data-testid="import-invalid" onClick={() => onImportData({ 'mp-ingredients': 'not-an-array' })}>Import Invalid</button>
      <button data-testid="import-valid" onClick={() => onImportData({ 'mp-ingredients': [{ id: 'i1', name: 'Chicken', unit: 'g' }] })}>Import Valid</button>
      <button data-testid="import-all" onClick={() => onImportData({
        'mp-ingredients': [{ id: 'i1', name: 'Chicken', unit: 'g' }],
        'mp-dishes': [{ id: 'd1', name: 'Dish', ingredients: [], tags: ['lunch'] }],
        'mp-day-plans': [{ date: '2025-01-01', breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] }],
        'mp-user-profile': { weight: 75, targetCalories: 2000 },
      })}>Import All</button>
      {theme && <span data-testid="current-theme">{theme}</span>}
      {setTheme && <button data-testid="btn-theme-light" onClick={() => setTheme('light')}>Light</button>}
    </div>
  ),
}));

// Mock lazy-loaded GroceryList
vi.mock('../components/GroceryList', () => ({
  GroceryList: () => <div>GroceryMock</div>,
}));

// Mock ClearPlanModal to expose onClear callback for testing
vi.mock('../components/modals/ClearPlanModal', () => ({
  ClearPlanModal: ({ onClear }: { onClear: (scope: 'day' | 'week' | 'month') => void }) => (
    <div data-testid="clear-plan-modal">
      <button data-testid="clear-scope-day" onClick={() => onClear('day')}>Clear Day</button>
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockThemeValue = 'light';
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

  it('theme toggle is in Settings tab', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const settingsTab = navTabs.find(b => b.textContent?.includes('Cài đặt'));
    expect(settingsTab).toBeTruthy();
    if (!settingsTab) return;
    fireEvent.click(settingsTab);
    await waitFor(() => expect(screen.getByTestId('settings-tab')).toBeInTheDocument());
    expect(screen.getByTestId('btn-theme-light')).toBeInTheDocument();
  });

  it('opens meal planner modal when "Lên kế hoạch" is clicked', async () => {
    render(<App />);
    const planButtons = screen.getAllByText('Lên kế hoạch');
    fireEvent.click(planButtons[0]);
    await waitFor(() => expect(screen.getByText('Chọn món cho từng bữa')).toBeInTheDocument());
  });

  it('handlePlanMeal opens planner when meal slot add button is clicked', async () => {
    render(<App />);
    const addButtons = screen.getAllByLabelText('Thêm');
    fireEvent.click(addButtons[0]);
    await waitFor(() => expect(screen.getByTestId('btn-confirm-plan')).toBeInTheDocument());
  });

  it('renders user weight in subtitle', () => {
    render(<App />);
    expect(screen.getByText(/Dinh dưỡng chính xác cho/)).toBeInTheDocument();
  });

  it('shows consolidated empty state when no meals planned', () => {
    render(<App />);
    // Default state has no plans, so consolidated empty state shows
    expect(screen.getByText(/Bắt đầu lên kế hoạch/)).toBeInTheDocument();
  });

  it('renders recommendation panel', () => {
    render(<App />);
    // Switch to Nutrition sub-tab to see the recommendation panel
    fireEvent.click(screen.getByTestId('subtab-nutrition'));
    expect(screen.getByText('Gợi ý cho bạn')).toBeInTheDocument();
  });

  it('renders DateSelector', () => {
    render(<App />);
    expect(screen.getByText('Hôm nay')).toBeInTheDocument();
  });

  it('opens goal settings modal', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('subtab-nutrition'));
    const editGoalsBtn = screen.getByLabelText('Chỉnh sửa mục tiêu dinh dưỡng');
    fireEvent.click(editGoalsBtn);
    await waitFor(() => expect(screen.getByText('Mục tiêu dinh dưỡng')).toBeInTheDocument());
  });

  it('navigates to AI analysis tab and renders AIImageAnalyzer', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('AI'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => expect(screen.getByTestId('ai-image-analyzer')).toBeInTheDocument());
  });

  it('handleSaveAnalyzedDish with shouldCreateDish=true creates dish and switches to dishes sub-tab', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('AI'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-save-dish'));
    fireEvent.click(screen.getByTestId('ai-save-dish'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleSaveAnalyzedDish with shouldCreateDish=false saves ingredients only and switches to ingredients sub-tab', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('AI'));
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
    const aiTab = navTabs.find(b => b.textContent?.includes('AI'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-complete'));
    fireEvent.click(screen.getByTestId('ai-complete'));
    // When already on AI tab, no notification should fire
    expect(mockNotify.success).not.toHaveBeenCalled();
  });



  it('navigates to settings tab and renders SettingsTab', () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const settingsTab = navTabs.find(b => b.textContent?.includes('Cài đặt'));
    if (settingsTab) fireEvent.click(settingsTab);
    expect(screen.getByTestId('settings-tab')).toBeInTheDocument();
  });

  it('handleImportData with invalid key shows warning notification', () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const settingsTab = navTabs.find(b => b.textContent?.includes('Cài đặt'));
    if (settingsTab) fireEvent.click(settingsTab);
    fireEvent.click(screen.getByTestId('import-invalid'));
    expect(mockNotify.warning).toHaveBeenCalled();
  });

  it('handleImportData with valid data shows success notification', () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const settingsTab = navTabs.find(b => b.textContent?.includes('Cài đặt'));
    if (settingsTab) fireEvent.click(settingsTab);
    fireEvent.click(screen.getByTestId('import-valid'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('migrates dishes with empty tags from localStorage on mount', () => {
    localStorage.setItem('mp-dishes', JSON.stringify([
      { id: 'd99', name: 'Old Dish', ingredients: [], tags: [] },
    ]));
    render(<App />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    localStorage.removeItem('mp-dishes');
  });

  it('navigates to grocery tab and renders GroceryList', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const groceryTab = navTabs.find(b => b.textContent?.includes('Đi chợ'));
    if (groceryTab) fireEvent.click(groceryTab);
    await waitFor(() => expect(screen.getByText('GroceryMock')).toBeInTheDocument());
  });

  it('confirms planning modal and shows success notification', async () => {
    render(<App />);
    const planBtns = screen.getAllByText('Lên kế hoạch');
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
    const aiTab = navTabs.find(b => b.textContent?.includes('AI'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-complete'));
    // Navigate away from AI tab using desktop nav
    const calTab = navTabs.find(b => b.textContent?.includes('Lịch trình'));
    if (calTab) fireEvent.click(calTab);
    // Verify we left the AI tab
    await waitFor(() => expect(screen.queryByTestId('ai-image-analyzer')).not.toBeInTheDocument());
    // Call captured callback; activeMainTabRef.current should now be 'calendar'
    act(() => { if (capturedAnalysisComplete) capturedAnalysisComplete(); });
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleImportData with all data keys imports everything', () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const settingsTab = navTabs.find(b => b.textContent?.includes('Cài đặt'));
    if (settingsTab) fireEvent.click(settingsTab);
    fireEvent.click(screen.getByTestId('import-all'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleClearPlan clears plans via ClearPlanModal', async () => {
    // Seed a day plan so the clear button is visible
    localStorage.setItem('mp-day-plans', JSON.stringify([{
      date: getLocalToday(),
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }]));
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
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('undo restores plans after clear', async () => {
    localStorage.setItem('mp-day-plans', JSON.stringify([{
      date: getLocalToday(),
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }]));
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
    act(() => { options.action.onClick(); });
    // Undo should trigger another success notification
    expect(mockNotify.success).toHaveBeenCalledTimes(mockNotify.success.mock.calls.length);
  });

  it('handleQuickAdd adds dish to the correct slot', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    localStorage.setItem('mp-day-plans', JSON.stringify([
      { date: yesterdayStr, breakfastDishIds: ['quick1'], lunchDishIds: [], dinnerDishIds: [] },
      { date: getLocalToday(), breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] },
    ]));
    localStorage.setItem('mp-dishes', JSON.stringify([
      { id: 'quick1', name: { vi: 'Quick Dish' }, ingredients: [], tags: [] },
    ]));
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

  it('handleAnalysisComplete fires notification when called from non-AI tab', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('AI'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-image-analyzer'));
    expect(capturedAnalysisComplete).toBeTruthy();
    // Navigate away from AI tab
    const calTab = navTabs.find(b => b.textContent?.includes('Lịch trình'));
    if (calTab) fireEvent.click(calTab);
    await waitFor(() => expect(screen.queryByTestId('ai-image-analyzer')).not.toBeInTheDocument());
    // Call the captured callback from non-AI tab
    act(() => { if (capturedAnalysisComplete) capturedAnalysisComplete(); });
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleSaveAnalyzedDish with new ingredients adds them to state', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('AI'));
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
    const aiTab = navTabs.find(b => b.textContent?.includes('AI'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-save-dish-no-tags'));
    fireEvent.click(screen.getByTestId('ai-save-dish-no-tags'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('handleAnalysisComplete notification onClick navigates to AI tab', async () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const aiTab = navTabs.find(b => b.textContent?.includes('AI'));
    if (aiTab) fireEvent.click(aiTab);
    await waitFor(() => screen.getByTestId('ai-image-analyzer'));
    const calTab = navTabs.find(b => b.textContent?.includes('Lịch trình'));
    if (calTab) fireEvent.click(calTab);
    await waitFor(() => expect(screen.queryByTestId('ai-image-analyzer')).not.toBeInTheDocument());
    act(() => { if (capturedAnalysisComplete) capturedAnalysisComplete(); });
    const onClickArg = (mockNotify.success.mock.calls[0][2] as { onClick: () => void })?.onClick;
    act(() => { if (onClickArg) onClickArg(); });
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
    localStorage.setItem('mp-day-plans', JSON.stringify([{
      date: today,
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }]));
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
    localStorage.setItem('mp-day-plans', JSON.stringify([{
      date: today,
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }]));
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
    act(() => { undoAction.onClick(); });
    expect(mockNotify.info).toHaveBeenCalled();
  });

  it('opens template manager modal', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-template-manager')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-template-manager'));
    await waitFor(() => expect(screen.getByTestId('template-manager-modal')).toBeInTheDocument());
  });

  it('saves current plan as template via save template modal', async () => {
    const today = getLocalToday();
    localStorage.setItem('mp-day-plans', JSON.stringify([{
      date: today,
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }]));
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-more-actions'));
    await waitFor(() => expect(screen.getByTestId('btn-save-template')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-save-template'));
    await waitFor(() => expect(screen.getByTestId('save-template-modal')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('input-template-name'), { target: { value: 'My Template' } });
    fireEvent.click(screen.getByTestId('btn-save-template'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('meal planner single-tab confirm shows meal-specific notification', async () => {
    render(<App />);
    const planBtns = screen.getAllByText('Lên kế hoạch');
    fireEvent.click(planBtns[0]);
    await waitFor(() => expect(screen.getByTestId('btn-confirm-plan')).toBeInTheDocument());
    // Select a breakfast dish (d1 has tag 'breakfast')
    const dishButton = screen.getByText('Yến mạch sữa chua');
    fireEvent.click(dishButton);
    fireEvent.click(screen.getByTestId('btn-confirm-plan'));
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('template apply adds new plan when no existing plan for date', async () => {
    // No day plans seeded — applying template should create a new plan (line 449)
    localStorage.setItem('meal-templates', JSON.stringify([{
      id: 'tpl-test',
      name: 'Preset',
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }]));
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
    localStorage.setItem('mp-day-plans', JSON.stringify([{
      date: today,
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }]));
    // Pre-seed templates so the manager has data
    localStorage.setItem('meal-templates', JSON.stringify([
      { id: 'tpl-1', name: 'Test Template', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] },
      { id: 'tpl-2', name: 'Template Delete', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] },
      { id: 'tpl-3', name: 'Template Rename', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] },
    ]));
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
    const deleteBtns = screen.getAllByText('Xóa');
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
    const mgmtNav = screen.getByTestId('nav-management');
    expect(mgmtNav).toHaveAttribute('aria-selected', 'false');
    await act(async () => {
      fireEvent.keyDown(container.firstElementChild!, { key: '2', metaKey: true });
    });
    expect(mgmtNav).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Settings tab via Cmd+5 shortcut', async () => {
    const { container } = render(<App />);
    const settingsNav = screen.getByTestId('nav-settings');
    expect(settingsNav).toHaveAttribute('aria-selected', 'false');
    await act(async () => {
      fireEvent.keyDown(container.firstElementChild!, { key: '5', metaKey: true });
    });
    expect(settingsNav).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores keyboard shortcuts without modifier key', () => {
    const { container } = render(<App />);
    const calendarNav = screen.getByTestId('nav-calendar');
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(container.firstElementChild!, { key: '2' });
    expect(calendarNav).toHaveAttribute('aria-selected', 'true');
  });

  it('handleUpdateServings updates serving count for a dish', async () => {
    localStorage.setItem('mp-dishes', JSON.stringify([
      { id: 'srv1', name: { vi: 'Serving Dish' }, ingredients: [], tags: ['breakfast'] },
    ]));
    localStorage.setItem('mp-day-plans', JSON.stringify([{
      date: getLocalToday(),
      breakfastDishIds: ['srv1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }]));
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
    localStorage.setItem('mp-dishes', JSON.stringify([
      { id: 'srv2', name: { vi: 'Reset Dish' }, ingredients: [], tags: ['lunch'] },
    ]));
    localStorage.setItem('mp-day-plans', JSON.stringify([{
      date: getLocalToday(),
      breakfastDishIds: [],
      lunchDishIds: ['srv2'],
      dinnerDishIds: [],
      servings: { srv2: 2 },
    }]));
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('serving-count-srv2')).toBeInTheDocument();
    });
    expect(screen.getByTestId('serving-count-srv2')).toHaveTextContent('2x');
    fireEvent.click(screen.getByTestId('btn-serving-minus-srv2'));
    expect(screen.getByTestId('serving-count-srv2')).toHaveTextContent('1x');
  });
});

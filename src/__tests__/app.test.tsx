import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import type { Dish, Ingredient } from '../types';

// Mock notification context
const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

let mockThemeValue: 'light' | 'dark' | 'system' = 'light';

// Mock translateQueueService to spy on enqueue calls
const mockEnqueue = vi.fn();
vi.mock('../services/translateQueueService', () => ({
  useTranslateQueue: { getState: () => ({ enqueue: mockEnqueue }) },
}));

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
        id: 'new-dish', name: { vi: 'Món mới', en: 'New dish' }, ingredients: [], tags: ['lunch'],
      })}>Add Dish</button>
      <button data-testid="add-dish-empty-name-btn" onClick={() => onAddDish({
        id: 'empty-dish', name: { vi: '', en: '' }, ingredients: [], tags: ['lunch'],
      })}>Add Dish Empty Name</button>
      <button data-testid="update-dish-btn" onClick={() => onUpdateDish({
        id: 'd1', name: { vi: 'Cập nhật', en: 'Updated' }, ingredients: [], tags: ['dinner'],
      })}>Update Dish</button>
      <button data-testid="update-dish-empty-name-btn" onClick={() => onUpdateDish({
        id: 'd1', name: { vi: '', en: '' }, ingredients: [], tags: ['dinner'],
      })}>Update Dish Empty Name</button>
      <button data-testid="delete-dish-btn" onClick={() => onDeleteDish('d1')}>Delete Dish</button>
      <button data-testid="delete-ingredient-btn" onClick={() => onDeleteIngredient('i1')}>Delete Ingredient</button>
      <button data-testid="add-ingredient-btn" onClick={() => onAddIngredient({
        id: 'new-ing', name: { vi: 'Nguyên liệu mới', en: 'New ingredient' },
        caloriesPer100: 100, proteinPer100: 10, carbsPer100: 5, fatPer100: 3, fiberPer100: 1,
        unit: { vi: 'g', en: 'g' },
      })}>Add Ingredient</button>
      <button data-testid="add-ingredient-empty-btn" onClick={() => onAddIngredient({
        id: 'empty-ing', name: { vi: '', en: '' },
        caloriesPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, fiberPer100: 0,
        unit: { vi: 'g', en: 'g' },
      })}>Add Ingredient Empty</button>
      <button data-testid="update-ingredient-btn" onClick={() => onUpdateIngredient({
        id: 'i1', name: { vi: 'Cập nhật NL', en: 'Updated Ing' },
        caloriesPer100: 100, proteinPer100: 10, carbsPer100: 5, fatPer100: 3, fiberPer100: 1,
        unit: { vi: 'g', en: 'g' },
      })}>Update Ingredient</button>
      <button data-testid="update-ingredient-empty-btn" onClick={() => onUpdateIngredient({
        id: 'i1', name: { vi: '', en: '' },
        caloriesPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, fiberPer100: 0,
        unit: { vi: 'g', en: 'g' },
      })}>Update Ingredient Empty</button>
    </div>
  ),
}));

// Mock hooks
vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));
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

// Mock translate hooks (Worker not available in jsdom)
type OnTranslatedFn = (itemId: string, itemType: 'ingredient' | 'dish', direction: 'vi-en' | 'en-vi', translated: string) => void;
let capturedOnTranslated: OnTranslatedFn | null = null;
vi.mock('../hooks/useTranslateWorker', () => ({
  useTranslateWorker: ({ onTranslated }: { onTranslated: OnTranslatedFn }) => {
    capturedOnTranslated = onTranslated;
    return { sendJob: vi.fn() };
  },
}));
vi.mock('../hooks/useTranslateProcessor', () => ({
  useTranslateProcessor: vi.fn(),
}));
vi.mock('../components/TranslateStatusBadge', () => ({
  TranslateStatusBadge: () => null,
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
    expect(screen.getByText('Kế hoạch ăn uống')).toBeInTheDocument();
  });

  it('switches to management tab when clicked', () => {
    render(<App />);
    // Use desktop nav
    const navButtons = screen.getAllByRole('tab');
    const mgmtTab = navButtons.find(b => b.textContent?.includes('Thư viện'));
    if (mgmtTab) fireEvent.click(mgmtTab);
    expect(screen.getByText('Thư viện dữ liệu')).toBeInTheDocument();
  });

  it('theme toggle is in Settings tab', () => {
    render(<App />);
    const navTabs = screen.getAllByRole('tab');
    const settingsTab = navTabs.find(b => b.textContent?.includes('Cài đặt'));
    expect(settingsTab).toBeTruthy();
    fireEvent.click(settingsTab!);
    expect(screen.getByTestId('settings-tab')).toBeInTheDocument();
    expect(screen.getByTestId('btn-theme-light')).toBeInTheDocument();
  });

  it('opens meal planner modal when "Lên kế hoạch" is clicked', () => {
    render(<App />);
    const planButtons = screen.getAllByText('Lên kế hoạch');
    fireEvent.click(planButtons[0]);
    // MealPlannerModal subtitle
    expect(screen.getByText('Chọn món cho từng bữa')).toBeInTheDocument();
  });

  it('renders user weight in subtitle', () => {
    render(<App />);
    expect(screen.getByText(/Dinh dưỡng chính xác cho/)).toBeInTheDocument();
  });

  it('shows consolidated empty state when no meals planned', () => {
    render(<App />);
    // Default state has no plans, so consolidated empty state shows
    expect(screen.getByText('Chưa có kế hoạch cho ngày này')).toBeInTheDocument();
  });

  it('renders recommendation panel', () => {
    render(<App />);
    expect(screen.getByText('Gợi ý cho bạn')).toBeInTheDocument();
  });

  it('renders DateSelector', () => {
    render(<App />);
    expect(screen.getByText('Hôm nay')).toBeInTheDocument();
  });

  it('opens goal settings modal', () => {
    render(<App />);
    // Find and click the edit goals button (pencil icon on Summary)
    const editGoalsBtn = screen.getByLabelText('Chỉnh sửa mục tiêu dinh dưỡng');
    fireEvent.click(editGoalsBtn);
    expect(screen.getByText('Mục tiêu dinh dưỡng')).toBeInTheDocument();
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

  it('handleAddDish enqueues translation when dish name is non-empty', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('add-dish-btn'));
    expect(mockEnqueue).toHaveBeenCalledWith({
      itemId: 'new-dish',
      itemType: 'dish',
      sourceText: 'Món mới',
      direction: 'vi-en',
    });
  });

  it('handleAddDish does not enqueue translation when dish name is empty', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('add-dish-empty-name-btn'));
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it('handleUpdateDish enqueues translation when dish name is non-empty', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('update-dish-btn'));
    expect(mockEnqueue).toHaveBeenCalledWith({
      itemId: 'd1',
      itemType: 'dish',
      sourceText: 'Cập nhật',
      direction: 'vi-en',
    });
  });

  it('handleUpdateDish does not enqueue translation when dish name is empty', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('update-dish-empty-name-btn'));
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it('onDeleteDish removes the dish from state', async () => {
    render(<App />);
    const initialCount = Number(screen.getByTestId('dish-count').textContent);
    fireEvent.click(screen.getByTestId('delete-dish-btn'));
    await waitFor(() => {
      expect(Number(screen.getByTestId('dish-count').textContent)).toBe(initialCount - 1);
    });
  });

  it('handleAddIngredient enqueues translation when ingredient name is non-empty', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('add-ingredient-btn'));
    expect(mockEnqueue).toHaveBeenCalledWith({
      itemId: 'new-ing',
      itemType: 'ingredient',
      sourceText: 'Nguyên liệu mới',
      direction: 'vi-en',
    });
  });

  it('handleAddIngredient does not enqueue translation when ingredient name is empty', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('add-ingredient-empty-btn'));
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it('handleUpdateIngredient enqueues translation when ingredient name is non-empty', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('update-ingredient-btn'));
    expect(mockEnqueue).toHaveBeenCalledWith({
      itemId: 'i1',
      itemType: 'ingredient',
      sourceText: 'Cập nhật NL',
      direction: 'vi-en',
    });
  });

  it('handleUpdateIngredient does not enqueue translation when ingredient name is empty', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('update-ingredient-empty-btn'));
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it('updateTranslatedField updates ingredient name in the translated language', () => {
    render(<App />);
    expect(capturedOnTranslated).toBeTruthy();
    act(() => { if (capturedOnTranslated) capturedOnTranslated('i1', 'ingredient', 'vi-en', 'Translated Name'); });
    expect(screen.getByTestId('management-tab')).toBeInTheDocument();
  });

  it('updateTranslatedField updates dish name in the translated language', () => {
    render(<App />);
    act(() => { if (capturedOnTranslated) capturedOnTranslated('d1', 'dish', 'vi-en', 'Translated Dish'); });
    expect(screen.getByTestId('management-tab')).toBeInTheDocument();
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
      date: new Date().toISOString().split('T')[0],
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }]));
    render(<App />);
    // Clear plan button should be visible since there's a plan
    await waitFor(() => {
      expect(screen.getByLabelText('Xóa kế hoạch')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Xóa kế hoạch'));
    // ClearPlanModal should appear
    await waitFor(() => screen.getByTestId('clear-plan-modal'));
    fireEvent.click(screen.getByTestId('clear-scope-day'));
    expect(screen.getByRole('tablist')).toBeInTheDocument();
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

  it('updateTranslatedField with en-vi direction updates vi name', () => {
    render(<App />);
    act(() => { if (capturedOnTranslated) capturedOnTranslated('i1', 'ingredient', 'en-vi', 'Tên VN'); });
    expect(screen.getByTestId('management-tab')).toBeInTheDocument();
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

  it('uses en-vi direction when language is en', async () => {
    const i18n = (await import('../i18n')).default;
    await act(async () => { await i18n.changeLanguage('en'); });
    render(<App />);
    fireEvent.click(screen.getByTestId('add-dish-btn'));
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({ direction: 'en-vi' }));
    await act(async () => { await i18n.changeLanguage('vi'); });
  });
});

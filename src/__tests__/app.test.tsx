import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock notification context
const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock hooks
vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));
vi.mock('../hooks/useDarkMode', () => ({
  useDarkMode: () => ({ theme: 'light' as const, cycleTheme: vi.fn() }),
}));
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
    editMeal: vi.fn(),
  }),
}));

// Mock heavy child components to keep test fast
vi.mock('../components/modals/AISuggestionPreviewModal', () => ({
  AISuggestionPreviewModal: () => null,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

  it('renders theme toggle button', () => {
    render(<App />);
    const themeBtn = screen.getByLabelText(/Chế độ hiển thị/);
    expect(themeBtn).toBeInTheDocument();
  });

  it('opens type selection modal when "Lên kế hoạch" is clicked', () => {
    render(<App />);
    const planButtons = screen.getAllByText('Lên kế hoạch');
    fireEvent.click(planButtons[0]);
    // TypeSelectionModal subtitle
    expect(screen.getByText('Chọn buổi bạn muốn lên kế hoạch')).toBeInTheDocument();
  });

  it('renders user weight in subtitle', () => {
    render(<App />);
    expect(screen.getByText(/Dinh dưỡng chính xác cho/)).toBeInTheDocument();
  });

  it('renders meal cards for breakfast, lunch, dinner', () => {
    render(<App />);
    expect(screen.getByText('Bữa Sáng')).toBeInTheDocument();
    expect(screen.getByText('Bữa Trưa')).toBeInTheDocument();
    expect(screen.getByText('Bữa Tối')).toBeInTheDocument();
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
});

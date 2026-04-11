import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockIsNativePlatform = vi.fn(() => false);

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mockIsNativePlatform() },
}));

let mockCalendarViewMode: string | null = null;
const mockSetSetting = vi.fn().mockResolvedValue(undefined);
const mockGetSetting = vi.fn((_db: unknown, key: string) => {
  if (key === 'calendar_view_mode') return Promise.resolve(mockCalendarViewMode);
  if (key === 'date_hint_dismissed') return Promise.resolve('1');
  return Promise.resolve(null);
});

vi.mock('../contexts/DatabaseContext', () => ({
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDatabase: () => ({
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
  }),
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../services/appSettings', () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(args[0], args[1] as string),
  setSetting: (...args: unknown[]) => mockSetSetting(args[0], args[1], args[2]),
  deleteSetting: vi.fn().mockResolvedValue(undefined),
}));

import { DateSelector } from '../components/DateSelector';

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

describe('getDefaultViewMode (via component rendering)', () => {
  afterEach(() => {
    mockIsNativePlatform.mockReset().mockReturnValue(false);
    mockCalendarViewMode = null;
    mockSetSetting.mockClear();
    mockGetSetting.mockClear();
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 1024 });
  });

  it('defaults to "week" when Capacitor.isNativePlatform() is true (AC1, EC-17)', () => {
    mockIsNativePlatform.mockReturnValue(true);
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    // Week view shows dd/mm - dd/mm format
    expect(screen.getByText(/\d{2}\/\d{2} - \d{2}\/\d{2}/)).toBeInTheDocument();
  });

  it('defaults to "week" on web when innerWidth < 640 (AC2)', () => {
    mockIsNativePlatform.mockReturnValue(false);
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 320 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    expect(screen.getByText(/\d{2}\/\d{2} - \d{2}\/\d{2}/)).toBeInTheDocument();
  });

  it('defaults to "calendar" on web when innerWidth >= 640 (AC2)', () => {
    mockIsNativePlatform.mockReturnValue(false);
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 1024 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    const monthNum = today.getMonth() + 1;
    expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();
  });

  it('defaults to "week" for 768px Capacitor tablet — native overrides width (EC-17)', () => {
    mockIsNativePlatform.mockReturnValue(true);
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 768 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    expect(screen.getByText(/\d{2}\/\d{2} - \d{2}\/\d{2}/)).toBeInTheDocument();
  });

  it('defaults to "calendar" when Capacitor throws and width >= 640', () => {
    mockIsNativePlatform.mockImplementation(() => {
      throw new Error('Capacitor not available');
    });
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 1024 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    const monthNum = today.getMonth() + 1;
    expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();
  });

  it('defaults to "week" at exactly 639px on web (boundary)', () => {
    mockIsNativePlatform.mockReturnValue(false);
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 639 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    expect(screen.getByText(/\d{2}\/\d{2} - \d{2}\/\d{2}/)).toBeInTheDocument();
  });

  it('defaults to "calendar" at exactly 640px on web (boundary)', () => {
    mockIsNativePlatform.mockReturnValue(false);
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 640 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    const monthNum = today.getMonth() + 1;
    expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();
  });
});

describe('DateSelector persistence', () => {
  afterEach(() => {
    mockIsNativePlatform.mockReset().mockReturnValue(false);
    mockCalendarViewMode = null;
    mockSetSetting.mockClear();
    mockGetSetting.mockClear();
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 1024 });
  });

  it('loads persisted "week" preference and overrides desktop default (AC3)', async () => {
    mockCalendarViewMode = 'week';
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    // Desktop default is 'calendar', but persisted 'week' should override
    await waitFor(() => {
      expect(screen.getByText(/\d{2}\/\d{2} - \d{2}\/\d{2}/)).toBeInTheDocument();
    });
  });

  it('loads persisted "calendar" preference and overrides mobile default (AC3)', async () => {
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 320 });
    mockCalendarViewMode = 'calendar';
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    // Mobile default is 'week', but persisted 'calendar' should override
    await waitFor(() => {
      const monthNum = today.getMonth() + 1;
      expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();
    });
  });

  it('persists view mode on toggle (AC3)', async () => {
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    // Default on desktop: calendar. Toggle to week.
    const toggleBtn = screen.getByTitle('Chế độ tuần');
    fireEvent.click(toggleBtn);
    expect(mockSetSetting).toHaveBeenCalledWith(expect.anything(), 'calendar_view_mode', 'week');
  });

  it('persists "calendar" when toggling back from week', async () => {
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 320 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    // Default on mobile: week. Toggle to calendar.
    const toggleBtn = screen.getByTitle('Chế độ lịch');
    fireEvent.click(toggleBtn);
    expect(mockSetSetting).toHaveBeenCalledWith(expect.anything(), 'calendar_view_mode', 'calendar');
  });

  it('uses default when getSetting returns null — no preference (EC-18, EC-19)', async () => {
    mockCalendarViewMode = null;
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    // Desktop default: 'calendar'
    await waitFor(() => {
      const monthNum = today.getMonth() + 1;
      expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();
    });
  });

  it('uses default when getSetting rejects (db error)', async () => {
    mockGetSetting.mockImplementation((_db: unknown, key: string) => {
      if (key === 'calendar_view_mode') return Promise.reject(new Error('DB error'));
      if (key === 'date_hint_dismissed') return Promise.resolve('1');
      return Promise.resolve(null);
    });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    // Should still render calendar (desktop default) without crashing
    await waitFor(() => {
      const monthNum = today.getMonth() + 1;
      expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();
    });
  });

  it('ignores invalid persisted value (not "calendar" or "week")', async () => {
    mockCalendarViewMode = 'invalid_mode';
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    // Should keep desktop default: 'calendar'
    await waitFor(() => {
      const monthNum = today.getMonth() + 1;
      expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();
    });
  });

  it('does NOT auto-switch on resize crossing 640px (EC-20)', async () => {
    // Start at 800px → calendar default
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 800 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    const monthNum = today.getMonth() + 1;
    expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();

    // "Resize" to 320px — should NOT auto-switch
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 320 });
    window.dispatchEvent(new Event('resize'));
    // Still in calendar mode
    expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();
  });

  it('handles setSetting error gracefully on toggle', () => {
    mockSetSetting.mockRejectedValueOnce(new Error('write error'));
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    const toggleBtn = screen.getByTitle('Chế độ tuần');
    // Should not throw
    expect(() => fireEvent.click(toggleBtn)).not.toThrow();
  });
});

describe('DateSelector meal dot tokens (AC5)', () => {
  afterEach(() => {
    mockIsNativePlatform.mockReset().mockReturnValue(false);
    mockCalendarViewMode = null;
    mockSetSetting.mockClear();
    mockGetSetting.mockClear();
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 1024 });
  });

  const dayPlans = [{ date: todayStr, breakfastDishIds: ['d1'], lunchDishIds: ['d2'], dinnerDishIds: ['d3'] }];

  it('renders meal-breakfast, meal-lunch, meal-dinner dot classes in calendar view', () => {
    const { container } = render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} dayPlans={dayPlans} />);
    expect(container.querySelector('.bg-meal-breakfast')).toBeInTheDocument();
    expect(container.querySelector('.bg-meal-lunch')).toBeInTheDocument();
    expect(container.querySelector('.bg-meal-dinner')).toBeInTheDocument();
  });

  it('renders meal-* dot classes in week view', () => {
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 320 });
    const { container } = render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} dayPlans={dayPlans} />);
    expect(container.querySelector('.bg-meal-breakfast')).toBeInTheDocument();
    expect(container.querySelector('.bg-meal-lunch')).toBeInTheDocument();
    expect(container.querySelector('.bg-meal-dinner')).toBeInTheDocument();
  });

  it('does NOT use old bg-energy, bg-macro-carbs, or bg-ai classes', () => {
    const { container } = render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} dayPlans={dayPlans} />);
    expect(container.querySelector('.bg-energy')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-macro-carbs')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-ai')).not.toBeInTheDocument();
  });

  it('calendar legend uses meal-* tokens', () => {
    const { container } = render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} dayPlans={dayPlans} />);
    const legends = container.querySelectorAll('.h-2.w-2.rounded-full');
    const classes = Array.from(legends).map(el => el.className);
    expect(classes.some(c => c.includes('bg-meal-breakfast'))).toBe(true);
    expect(classes.some(c => c.includes('bg-meal-lunch'))).toBe(true);
    expect(classes.some(c => c.includes('bg-meal-dinner'))).toBe(true);
  });

  it('week legend uses meal-* tokens', () => {
    Object.defineProperty(globalThis, 'innerWidth', { writable: true, value: 320 });
    const { container } = render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} dayPlans={dayPlans} />);
    const legends = container.querySelectorAll('.h-2.w-2.rounded-full');
    const classes = Array.from(legends).map(el => el.className);
    expect(classes.some(c => c.includes('bg-meal-breakfast'))).toBe(true);
    expect(classes.some(c => c.includes('bg-meal-lunch'))).toBe(true);
    expect(classes.some(c => c.includes('bg-meal-dinner'))).toBe(true);
  });
});

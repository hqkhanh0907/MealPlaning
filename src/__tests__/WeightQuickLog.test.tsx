import { act, fireEvent, render, screen } from '@testing-library/react';

import { NotificationProvider } from '../contexts/NotificationContext';
import { WeightQuickLog } from '../features/dashboard/components/WeightQuickLog';
import type { WeightEntry } from '../features/fitness/types';
import { useFitnessStore } from '../store/fitnessStore';

/* ------------------------------------------------------------------ */
/*  Mock Capacitor (used by useModalBackHandler)                        */
/* ------------------------------------------------------------------ */
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));
vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn() },
}));

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeEntry(overrides: Partial<WeightEntry> = {}): WeightEntry {
  return {
    id: crypto.randomUUID(),
    date: todayStr(),
    weightKg: 72.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function resetStore(entries: WeightEntry[] = []) {
  useFitnessStore.setState({ weightEntries: entries });
}

const onClose = vi.fn();

function renderSheet() {
  return render(
    <NotificationProvider>
      <WeightQuickLog onClose={onClose} />
    </NotificationProvider>,
  );
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */
describe('WeightQuickLog', () => {
  beforeEach(() => {
    resetStore();
    onClose.mockClear();
  });

  /* ---- Basic rendering ---- */

  it('renders bottom sheet with title and close button', () => {
    renderSheet();

    expect(screen.getByTestId('weight-quick-log')).toBeInTheDocument();
    expect(screen.getByText('Ghi nhanh cân nặng')).toBeInTheDocument();
    expect(screen.getByTestId('close-btn')).toBeInTheDocument();
  });

  it('close button calls onClose', () => {
    renderSheet();

    fireEvent.click(screen.getByTestId('close-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click calls onClose', () => {
    renderSheet();

    const backdropButtons = screen.getAllByLabelText('Đóng');
    const backdrop = backdropButtons.find(el => el.tabIndex === -1);
    expect(backdrop).toBeDefined();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /* ---- Default value logic ---- */

  it('defaults to yesterday weight when exists', () => {
    const yday = makeEntry({ date: yesterdayStr(), weightKg: 73.2 });
    resetStore([yday]);

    renderSheet();

    expect(screen.getByTestId('weight-display')).toHaveTextContent('73.2');
  });

  it('defaults to latest weight when no yesterday entry', () => {
    const past = makeEntry({ date: '2025-01-01', weightKg: 68.5 });
    resetStore([past]);

    renderSheet();

    expect(screen.getByTestId('weight-display')).toHaveTextContent('68.5');
  });

  it('defaults to today entry weight if today already logged', () => {
    const todayEntry = makeEntry({ date: todayStr(), weightKg: 74.0 });
    resetStore([todayEntry]);

    renderSheet();

    expect(screen.getByTestId('weight-display')).toHaveTextContent('74');
  });

  it('shows dash when no weight history exists', () => {
    resetStore([]);

    renderSheet();

    expect(screen.getByTestId('weight-display')).toHaveTextContent('—');
  });

  /* ---- Stepper increments/decrements by 0.1kg ---- */

  it('increment button adds 0.1', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 70.0 })]);
    renderSheet();

    expect(screen.getByTestId('weight-display')).toHaveTextContent('70');

    fireEvent.click(screen.getByTestId('increment-btn'));

    expect(screen.getByTestId('weight-display')).toHaveTextContent('70.1');
  });

  it('decrement button subtracts 0.1', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 70.0 })]);
    renderSheet();

    fireEvent.click(screen.getByTestId('decrement-btn'));

    expect(screen.getByTestId('weight-display')).toHaveTextContent('69.9');
  });

  /* ---- Bounds check (30-300kg) ---- */

  it('decrement does not go below 30kg minimum', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 30.0 })]);
    renderSheet();

    fireEvent.click(screen.getByTestId('decrement-btn'));

    expect(screen.getByTestId('weight-display')).toHaveTextContent('30');
  });

  it('increment does not exceed 300kg maximum', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 300 })]);
    renderSheet();

    fireEvent.click(screen.getByTestId('increment-btn'));

    expect(screen.getByTestId('weight-display')).toHaveTextContent('300');
  });

  it('decrement button disabled at min weight', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 30.0 })]);
    renderSheet();

    expect(screen.getByTestId('decrement-btn')).toBeDisabled();
  });

  it('increment button disabled at max weight', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 300 })]);
    renderSheet();

    expect(screen.getByTestId('increment-btn')).toBeDisabled();
  });

  it('save button disabled when no valid weight', () => {
    resetStore([]);
    renderSheet();

    expect(screen.getByTestId('save-btn')).toBeDisabled();
  });

  /* ---- Quick select chips set correct value ---- */

  it('shows quick select chips for recent weight values', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 71.5 }),
      makeEntry({ date: daysAgoStr(3), weightKg: 73.0 }),
    ];
    resetStore(entries);

    renderSheet();

    expect(screen.getByTestId('quick-select-chips')).toBeInTheDocument();
    expect(screen.getByTestId('chip-72')).toBeInTheDocument();
    expect(screen.getByTestId('chip-71.5')).toBeInTheDocument();
    expect(screen.getByTestId('chip-73')).toBeInTheDocument();
  });

  it('tapping a chip sets the weight value', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 71.5 }),
    ];
    resetStore(entries);

    renderSheet();

    fireEvent.click(screen.getByTestId('chip-71.5'));

    expect(screen.getByTestId('weight-display')).toHaveTextContent('71.5');
  });

  it('active chip has emerald styling', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 71.0 }),
    ];
    resetStore(entries);

    renderSheet();

    fireEvent.click(screen.getByTestId('chip-71'));

    expect(screen.getByTestId('chip-71').className).toContain('border-emerald');
    expect(screen.getByTestId('chip-72').className).not.toContain('border-emerald');
  });

  it('yesterday weight chip shows yesterday label', () => {
    const ydayWeight = 72.5;
    const entries = [
      makeEntry({ date: yesterdayStr(), weightKg: ydayWeight }),
      makeEntry({ date: daysAgoStr(3), weightKg: 73.0 }),
    ];
    resetStore(entries);

    renderSheet();

    const chip = screen.getByTestId(`chip-${ydayWeight}`);
    expect(chip).toHaveTextContent('Hôm qua');
  });

  it('no chips when no prior entries', () => {
    resetStore([]);
    renderSheet();

    expect(screen.queryByTestId('quick-select-chips')).not.toBeInTheDocument();
  });

  it('chips exclude today entry', () => {
    const entries = [
      makeEntry({ date: todayStr(), weightKg: 75.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
    ];
    resetStore(entries);

    renderSheet();

    expect(screen.getByTestId('chip-72')).toBeInTheDocument();
    expect(screen.queryByTestId('chip-75')).not.toBeInTheDocument();
  });

  it('chips show unique values only', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(3), weightKg: 71.0 }),
    ];
    resetStore(entries);

    renderSheet();

    const chipContainer = screen.getByTestId('quick-select-chips');
    const buttons = chipContainer.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
  });

  /* ---- Save calls store method with correct data ---- */

  it('save creates new entry with today date', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 70.0 })]);
    renderSheet();

    fireEvent.click(screen.getByTestId('save-btn'));

    const entries = useFitnessStore.getState().weightEntries;
    const todayEntry = entries.find(e => e.date === todayStr());
    expect(todayEntry).toBeDefined();
    expect(todayEntry?.weightKg).toBe(70);
  });

  it('save updates existing today entry instead of creating', () => {
    const existing = makeEntry({
      id: 'existing-id',
      date: todayStr(),
      weightKg: 72.5,
    });
    resetStore([existing]);

    renderSheet();

    fireEvent.click(screen.getByTestId('increment-btn'));
    fireEvent.click(screen.getByTestId('save-btn'));

    const entries = useFitnessStore.getState().weightEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('existing-id');
    expect(entries[0].weightKg).toBe(72.6);
  });

  it('save closes the sheet', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 70.0 })]);
    renderSheet();

    fireEvent.click(screen.getByTestId('save-btn'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('save shows undo toast notification', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 70.0 })]);
    renderSheet();

    fireEvent.click(screen.getByTestId('save-btn'));

    expect(screen.getByText('Đã lưu cân nặng')).toBeInTheDocument();
    expect(screen.getByText('Hoàn tác')).toBeInTheDocument();
  });

  /* ---- Undo flow works (save → undo → entry removed) ---- */

  it('undo on new entry removes it from store', () => {
    resetStore([makeEntry({ date: daysAgoStr(2), weightKg: 70.0 })]);
    renderSheet();

    fireEvent.click(screen.getByTestId('save-btn'));

    const entriesAfterSave = useFitnessStore.getState().weightEntries;
    expect(entriesAfterSave.find(e => e.date === todayStr())).toBeDefined();

    const undoBtn = screen.getByText('Hoàn tác');
    fireEvent.click(undoBtn);

    const entriesAfterUndo = useFitnessStore.getState().weightEntries;
    expect(entriesAfterUndo.find(e => e.date === todayStr())).toBeUndefined();
  });

  it('undo on updated entry restores previous weight', () => {
    const existing = makeEntry({
      id: 'existing-id',
      date: todayStr(),
      weightKg: 72.5,
    });
    resetStore([existing]);

    renderSheet();

    fireEvent.click(screen.getByTestId('increment-btn'));
    fireEvent.click(screen.getByTestId('save-btn'));

    expect(useFitnessStore.getState().weightEntries[0].weightKg).toBe(72.6);

    const undoBtn = screen.getByText('Hoàn tác');
    fireEvent.click(undoBtn);

    expect(useFitnessStore.getState().weightEntries[0].weightKg).toBe(72.5);
  });

  /* ---- Yesterday's weight and 7-day MA displayed ---- */

  it('shows yesterday weight in info row', () => {
    const yday = makeEntry({ date: yesterdayStr(), weightKg: 72.3 });
    resetStore([yday]);

    renderSheet();

    const info = screen.getByTestId('yesterday-info');
    expect(info).toHaveTextContent('Hôm qua');
    expect(info).toHaveTextContent('72.3');
  });

  it('does not show yesterday info when no yesterday entry', () => {
    resetStore([makeEntry({ date: daysAgoStr(5), weightKg: 70.0 })]);
    renderSheet();

    expect(screen.queryByTestId('yesterday-info')).not.toBeInTheDocument();
  });

  it('shows 7-day moving average when >= 3 entries', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 73.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 74.0 }),
    ];
    resetStore(entries);

    renderSheet();

    const avgEl = screen.getByTestId('moving-average');
    expect(avgEl).toHaveTextContent('TB 7 ngày');
    expect(avgEl).toHaveTextContent('73');
  });

  it('does not show moving average with fewer than 3 entries', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 73.0 }),
    ];
    resetStore(entries);

    renderSheet();

    expect(screen.queryByTestId('moving-average')).not.toBeInTheDocument();
  });

  /* ---- Trend indicator ---- */

  it('shows upward trend when MA > yesterday weight', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 75.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 74.0 }),
    ];
    resetStore(entries);

    renderSheet();

    const trend = screen.getByTestId('trend-indicator');
    expect(trend).toHaveTextContent('↑');
    expect(trend.className).toContain('text-destructive');
  });

  it('shows downward trend when MA < yesterday weight', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 70.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 73.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 71.0 }),
    ];
    resetStore(entries);

    renderSheet();

    const trend = screen.getByTestId('trend-indicator');
    expect(trend).toHaveTextContent('↓');
    expect(trend.className).toContain('text-emerald');
  });

  it('shows stable trend when MA equals yesterday weight', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 72.0 }),
    ];
    resetStore(entries);

    renderSheet();

    const trend = screen.getByTestId('trend-indicator');
    expect(trend).toHaveTextContent('→');
    expect(trend.className).toContain('text-slate');
  });

  it('no trend indicator without yesterday entry', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 71.0 }),
      makeEntry({ date: daysAgoStr(3), weightKg: 73.0 }),
    ];
    resetStore(entries);

    renderSheet();

    expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument();
  });

  /* ---- Long press stepper ---- */

  it('long press on increment triggers rapid increment', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 70.0 })]);
    renderSheet();

    const incBtn = screen.getByTestId('increment-btn');

    fireEvent.pointerDown(incBtn);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    fireEvent.pointerUp(incBtn);

    const displayText = screen.getByTestId('weight-display').textContent;
    const weight = parseFloat(displayText ?? '0');
    expect(weight).toBeGreaterThan(70.1);

    vi.useRealTimers();
  });

  /* ---- tabular-nums styling ---- */

  it('weight display uses tabular-nums', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 72.5 })]);
    renderSheet();

    const display = screen.getByTestId('weight-display');
    expect(display.style.fontVariantNumeric).toBe('tabular-nums');
  });

  it('info row uses tabular-nums', () => {
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 72.5 })]);
    renderSheet();

    const infoRow = screen.getByTestId('info-row');
    expect(infoRow.style.fontVariantNumeric).toBe('tabular-nums');
  });

  /* ---- Long press acceleration ---- */

  it('accelerates to fast interval after sustained long press past threshold', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    resetStore([makeEntry({ date: yesterdayStr(), weightKg: 70.0 })]);
    renderSheet();

    const incBtn = screen.getByTestId('increment-btn');

    fireEvent.pointerDown(incBtn);

    // LONG_PRESS_DELAY = 500ms, then 8 ticks × 150ms = 1200ms → acceleration at tick 9
    // Advance 1800ms total to ensure acceleration branch is hit
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    fireEvent.pointerUp(incBtn);

    const displayText = screen.getByTestId('weight-display').textContent;
    const weight = parseFloat(displayText ?? '0');
    // After 500ms delay + many ticks (9 slow + fast ticks), weight increases significantly
    expect(weight).toBeGreaterThan(70.5);

    vi.useRealTimers();
  });
});

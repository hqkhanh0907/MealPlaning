import { render, screen, fireEvent } from '@testing-library/react';
import { DailyWeightInput } from '../features/fitness/components/DailyWeightInput';
import { useFitnessStore } from '../store/fitnessStore';
import { NotificationProvider } from '../contexts/NotificationContext';
import type { WeightEntry } from '../features/fitness/types';

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

function renderWithNotification() {
  return render(
    <NotificationProvider>
      <DailyWeightInput />
    </NotificationProvider>,
  );
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */
describe('DailyWeightInput', () => {
  beforeEach(() => {
    resetStore();
  });

  /* ---- Basic rendering ---- */

  it('renders weight input with label', () => {
    renderWithNotification();

    expect(screen.getByTestId('daily-weight-input')).toBeInTheDocument();
    expect(screen.getByText('Cân nặng hôm nay')).toBeInTheDocument();
    expect(screen.getByTestId('weight-input')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('pre-fills with latest weight from store', () => {
    const past = makeEntry({ date: '2025-01-01', weightKg: 73.0 });
    resetStore([past]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('73');
  });

  it('empty state with no prior entries shows placeholder', () => {
    resetStore([]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('');

    expect(screen.queryByTestId('yesterday-info')).not.toBeInTheDocument();
  });

  /* ---- Stepper increments/decrements by 0.5kg ---- */

  it('increment button adds 0.5', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('70');

    const incBtn = screen.getByRole('button', { name: 'Tăng' });
    fireEvent.click(incBtn);

    expect(input.value).toBe('70.5');
  });

  it('decrement button subtracts 0.5', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('70');

    const decBtn = screen.getByRole('button', { name: 'Giảm' });
    fireEvent.click(decBtn);

    expect(input.value).toBe('69.5');
  });

  /* ---- Weight bounds: 30kg min, 300kg max ---- */

  it('decrement does not go below 30kg minimum', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 30.0 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('30');

    const decBtn = screen.getByRole('button', { name: 'Giảm' });
    fireEvent.click(decBtn);

    expect(input.value).toBe('30');
  });

  it('increment does not exceed 300kg maximum', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 300 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('300');

    const incBtn = screen.getByRole('button', { name: 'Tăng' });
    fireEvent.click(incBtn);

    expect(input.value).toBe('300');
  });

  it('save disabled when weight below 30kg', () => {
    resetStore([]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '29' } });

    const saveBtn = screen.getByTestId('save-weight-btn');
    expect(saveBtn).toBeDisabled();
  });

  it('save disabled when weight above 300kg', () => {
    resetStore([]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '301' } });

    const saveBtn = screen.getByTestId('save-weight-btn');
    expect(saveBtn).toBeDisabled();
  });

  /* ---- Input validation ---- */

  it('input validation prevents negative or zero values', () => {
    resetStore([]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0' } });

    const saveBtn = screen.getByTestId('save-weight-btn');
    expect(saveBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: '-5' } });
    expect(saveBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: '' } });
    expect(saveBtn).toBeDisabled();
  });

  it('handles empty string input gracefully', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    expect(input.value).toBe('');
    expect(screen.getByTestId('save-weight-btn')).toBeDisabled();
  });

  it('blur keeps empty value when input is cleared', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('70');

    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    fireEvent.blur(input);
    expect(input.value).toBe('');
  });

  it('blur clears non-numeric input on blur', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });

    fireEvent.blur(input);
    expect(input.value).toBe('');
  });

  it('does not force zero when user clears input', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    expect(input.value).toBe('');
    expect(input.value).not.toBe('0');
  });

  it('ignores non-numeric input and keeps state valid', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(screen.getByTestId('save-weight-btn')).toBeDisabled();

    fireEvent.change(input, { target: { value: '70' } });
    expect(screen.getByTestId('save-weight-btn')).not.toBeDisabled();
  });

  /* ---- Save calls store method ---- */

  it('save button creates new entry with today date', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '71.5' } });

    const saveBtn = screen.getByTestId('save-weight-btn');
    fireEvent.click(saveBtn);

    const entries = useFitnessStore.getState().weightEntries;
    const todayEntry = entries.find((e) => e.date === todayStr());
    expect(todayEntry).toBeDefined();
    expect(todayEntry?.weightKg).toBe(71.5);
  });

  it('if today already logged shows saved state', () => {
    const todayEntry = makeEntry({ date: todayStr(), weightKg: 72.5 });
    resetStore([todayEntry]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('72.5');

    const saveBtn = screen.getByTestId('save-weight-btn');
    expect(saveBtn).toHaveAttribute('aria-label', 'Đã lưu');
  });

  it('editing already-logged entry updates instead of creating', () => {
    const todayEntry = makeEntry({
      id: 'existing-id',
      date: todayStr(),
      weightKg: 72.5,
    });
    resetStore([todayEntry]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '73.0' } });

    const saveBtn = screen.getByTestId('save-weight-btn');
    fireEvent.click(saveBtn);

    const entries = useFitnessStore.getState().weightEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('existing-id');
    expect(entries[0].weightKg).toBe(73.0);
  });

  it('save transitions to saved state', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const saveBtn = screen.getByTestId('save-weight-btn');
    expect(saveBtn).toHaveAttribute('aria-label', 'Lưu');

    fireEvent.click(saveBtn);

    expect(saveBtn).toHaveAttribute('aria-label', 'Đã lưu');
  });

  /* ---- Yesterday weight & delta ---- */

  it('shows yesterday weight and delta', () => {
    const yday = makeEntry({ date: yesterdayStr(), weightKg: 72.8 });
    const older = makeEntry({ date: '2025-01-01', weightKg: 72.0 });
    resetStore([yday, older]);

    renderWithNotification();

    const info = screen.getByTestId('yesterday-info');
    expect(info).toBeInTheDocument();
    expect(info).toHaveTextContent('Hôm qua');
    expect(info).toHaveTextContent('72.8');

    const delta = screen.getByTestId('weight-delta');
    expect(delta).toBeInTheDocument();
  });

  it('does not show delta when yesterday entry missing', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    expect(screen.queryByTestId('yesterday-info')).not.toBeInTheDocument();
    expect(screen.queryByTestId('weight-delta')).not.toBeInTheDocument();
  });

  it('delta shows positive value in red and negative in green', () => {
    const yday = makeEntry({ date: yesterdayStr(), weightKg: 72.0 });
    resetStore([yday]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '73.0' } });

    const delta = screen.getByTestId('weight-delta');
    expect(delta).toHaveTextContent('+1');
    expect(delta.className).toContain('text-red');

    fireEvent.change(input, { target: { value: '71.0' } });
    const deltaNeg = screen.getByTestId('weight-delta');
    expect(deltaNeg).toHaveTextContent('-1');
    expect(deltaNeg.className).toContain('text-emerald');
  });

  it('delta shows zero when weights are equal', () => {
    const yday = makeEntry({ date: yesterdayStr(), weightKg: 72.0 });
    resetStore([yday]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '72.0' } });

    const delta = screen.getByTestId('weight-delta');
    expect(delta).toHaveTextContent('(0)');
    expect(delta.className).toContain('text-slate');
  });

  it('delta is null when input is zero', () => {
    const yday = makeEntry({ date: yesterdayStr(), weightKg: 72.0 });
    resetStore([yday]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0' } });

    expect(screen.queryByTestId('weight-delta')).not.toBeInTheDocument();
  });

  /* ---- Quick select chips update display ---- */

  it('shows quick select chips for recent weight values', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 71.5 }),
      makeEntry({ date: daysAgoStr(3), weightKg: 73.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const chipContainer = screen.getByTestId('quick-select-chips');
    expect(chipContainer).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /72/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /71\.5/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /73/ })).toBeInTheDocument();
  });

  it('tapping a chip pre-fills the weight value', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 71.5 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    const chip = screen.getByRole('button', { name: /71\.5/ });
    fireEvent.click(chip);

    expect(input.value).toBe('71.5');
  });

  it('chips exclude today entry from recent values', () => {
    const entries = [
      makeEntry({ date: todayStr(), weightKg: 75.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const chipContainer = screen.getByTestId('quick-select-chips');
    expect(chipContainer).toHaveTextContent('72');
    expect(chipContainer).not.toHaveTextContent('75');
  });

  it('no chips shown when no prior entries exist', () => {
    resetStore([]);

    renderWithNotification();

    expect(
      screen.queryByTestId('quick-select-chips'),
    ).not.toBeInTheDocument();
  });

  it('chips show unique weight values only', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(3), weightKg: 71.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const chipContainer = screen.getByTestId('quick-select-chips');
    const buttons = chipContainer.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
  });

  /* ---- Moving average calculation (7-day) ---- */

  it('shows 7-day moving average when >= 3 entries in last 7 days', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 73.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 74.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const avgEl = screen.getByTestId('moving-average');
    expect(avgEl).toBeInTheDocument();
    expect(avgEl).toHaveTextContent('TB 7 ngày');
    expect(avgEl).toHaveTextContent('73');
  });

  it('does not show moving average with fewer than 3 entries', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 73.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    expect(screen.queryByTestId('moving-average')).not.toBeInTheDocument();
  });

  it('moving average ignores entries older than 7 days', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 70.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 71.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(10), weightKg: 100.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const avgEl = screen.getByTestId('moving-average');
    expect(avgEl).toHaveTextContent('71');
  });

  /* ---- Trend indicator ---- */

  it('shows upward trend when moving avg > yesterday weight', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 75.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 74.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const trend = screen.getByTestId('trend-indicator');
    expect(trend).toHaveTextContent('↑');
    expect(trend.className).toContain('text-red');
  });

  it('shows downward trend when moving avg < yesterday weight', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 70.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 73.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 71.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const trend = screen.getByTestId('trend-indicator');
    expect(trend).toHaveTextContent('↓');
    expect(trend.className).toContain('text-emerald');
  });

  it('shows stable trend when moving avg equals yesterday weight', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(0), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 72.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

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

    renderWithNotification();

    expect(
      screen.queryByTestId('trend-indicator'),
    ).not.toBeInTheDocument();
  });

  /* ---- Undo toast behavior ---- */

  it('save shows undo toast with Hoàn tác button', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const saveBtn = screen.getByTestId('save-weight-btn');
    fireEvent.click(saveBtn);

    expect(screen.getByText('Đã lưu')).toBeInTheDocument();
    expect(screen.getByText('↩ Hoàn tác')).toBeInTheDocument();
  });

  it('undo on new entry removes it from store', () => {
    resetStore([makeEntry({ date: '2025-01-01', weightKg: 70.0 })]);
    renderWithNotification();

    const saveBtn = screen.getByTestId('save-weight-btn');
    fireEvent.click(saveBtn);

    const entriesAfterSave = useFitnessStore.getState().weightEntries;
    expect(
      entriesAfterSave.find((e) => e.date === todayStr()),
    ).toBeDefined();

    const undoBtn = screen.getByText('↩ Hoàn tác');
    fireEvent.click(undoBtn);

    const entriesAfterUndo = useFitnessStore.getState().weightEntries;
    expect(
      entriesAfterUndo.find((e) => e.date === todayStr()),
    ).toBeUndefined();
  });

  it('undo on updated entry restores previous weight', () => {
    const todayEntry = makeEntry({
      id: 'existing-id',
      date: todayStr(),
      weightKg: 72.5,
    });
    resetStore([todayEntry]);

    renderWithNotification();

    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '74.0' } });

    const saveBtn = screen.getByTestId('save-weight-btn');
    fireEvent.click(saveBtn);

    expect(useFitnessStore.getState().weightEntries[0].weightKg).toBe(74.0);

    const undoBtn = screen.getByText('↩ Hoàn tác');
    fireEvent.click(undoBtn);

    expect(useFitnessStore.getState().weightEntries[0].weightKg).toBe(72.5);
  });

  /* ---- Chip selects a value within valid range ---- */

  it('chip selection marks save as unsaved', () => {
    const entries = [
      makeEntry({ date: todayStr(), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(1), weightKg: 71.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const saveBtn = screen.getByTestId('save-weight-btn');
    expect(saveBtn).toHaveAttribute('aria-label', 'Đã lưu');

    const chip = screen.getByRole('button', { name: /71/ });
    fireEvent.click(chip);

    expect(saveBtn).toHaveAttribute('aria-label', 'Lưu');
  });

  /* ---- Chip highlights active value ---- */

  it('selected chip has active styling', () => {
    const entries = [
      makeEntry({ date: daysAgoStr(1), weightKg: 72.0 }),
      makeEntry({ date: daysAgoStr(2), weightKg: 71.0 }),
    ];
    resetStore(entries);

    renderWithNotification();

    const chip72 = screen.getByRole('button', { name: /72/ });
    fireEvent.click(chip72);

    expect(chip72.className).toContain('border-emerald');
  });
});

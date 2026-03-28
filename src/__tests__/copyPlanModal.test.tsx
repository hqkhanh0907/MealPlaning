import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopyPlanModal } from '../components/modals/CopyPlanModal';
import type { DayPlan, Dish } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,
}));

const makePlan = (
  date: string,
  breakfast: string[] = ['d1'],
  lunch: string[] = ['d2'],
  dinner: string[] = ['d3'],
): DayPlan => ({
  date,
  breakfastDishIds: breakfast,
  lunchDishIds: lunch,
  dinnerDishIds: dinner,
});

const makeDish = (id: string, viName: string): Dish => ({
  id,
  name: { vi: viName },
  ingredients: [],
  tags: [],
});

describe('CopyPlanModal', () => {
  const sourceDate = '2025-01-15';
  const sourcePlan = makePlan(sourceDate);
  const dishes: Dish[] = [
    makeDish('d1', 'Phở bò'),
    makeDish('d2', 'Cơm tấm'),
    makeDish('d3', 'Bún chả'),
  ];

  let onCopy: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCopy = vi.fn();
    onClose = vi.fn();
  });

  const renderModal = (
    plan: DayPlan = sourcePlan,
    date: string = sourceDate,
  ) =>
    render(
      <CopyPlanModal
        sourceDate={date}
        sourcePlan={plan}
        dishes={dishes}
        onCopy={onCopy}
        onClose={onClose}
      />,
    );

  // --- Rendering ---

  it('renders modal with test id', () => {
    renderModal();
    expect(screen.getByTestId('copy-plan-modal')).toBeInTheDocument();
  });

  it('renders title in header', () => {
    renderModal();
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toHaveTextContent('Copy kế hoạch');
  });

  it('renders subtitle with source date info', () => {
    renderModal();
    expect(screen.getByText(/Chọn ngày đích để copy bữa ăn/)).toBeInTheDocument();
  });

  it('renders source plan preview with dish names', () => {
    renderModal();
    expect(screen.getByText('Xem trước kế hoạch nguồn')).toBeInTheDocument();
    expect(screen.getByText(/Phở bò/)).toBeInTheDocument();
    expect(screen.getByText(/Cơm tấm/)).toBeInTheDocument();
    expect(screen.getByText(/Bún chả/)).toBeInTheDocument();
  });

  it('renders source preview meal labels', () => {
    renderModal();
    expect(screen.getByText('Sáng:')).toBeInTheDocument();
    expect(screen.getByText('Trưa:')).toBeInTheDocument();
    expect(screen.getByText('Tối:')).toBeInTheDocument();
  });

  it('does not render source preview when plan has no dishes', () => {
    const emptyPlan = makePlan(sourceDate, [], [], []);
    renderModal(emptyPlan);
    expect(
      screen.queryByText('Xem trước kế hoạch nguồn'),
    ).not.toBeInTheDocument();
  });

  it('renders quick select buttons: Tomorrow, This Week, Custom', () => {
    renderModal();
    expect(screen.getByTestId('btn-copy-tomorrow')).toBeInTheDocument();
    expect(screen.getByTestId('btn-copy-week')).toBeInTheDocument();
    expect(screen.getByText('Tùy chọn')).toBeInTheDocument();
  });

  it('renders copy mode toggle with overwrite and merge buttons', () => {
    renderModal();
    expect(screen.getByTestId('copy-mode-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('btn-mode-overwrite')).toBeInTheDocument();
    expect(screen.getByTestId('btn-mode-merge')).toBeInTheDocument();
  });

  it('renders mode labels in Vietnamese', () => {
    renderModal();
    expect(screen.getByTestId('btn-mode-overwrite')).toHaveTextContent(
      'Ghi đè',
    );
    expect(screen.getByTestId('btn-mode-merge')).toHaveTextContent(
      'Gộp thêm',
    );
  });

  it('renders confirm button', () => {
    renderModal();
    expect(screen.getByTestId('btn-copy-confirm')).toBeInTheDocument();
    expect(screen.getByTestId('btn-copy-confirm')).toHaveTextContent(
      'Copy kế hoạch',
    );
  });

  it('shows no selection message initially', () => {
    renderModal();
    expect(screen.getByText('Chưa chọn ngày nào')).toBeInTheDocument();
  });

  it('renders close button with aria-label', () => {
    renderModal();
    expect(screen.getByLabelText('Đóng hộp thoại')).toBeInTheDocument();
  });

  // --- Confirm Button Disabled State ---

  it('confirm button is disabled when no dates selected', () => {
    renderModal();
    expect(screen.getByTestId('btn-copy-confirm')).toBeDisabled();
  });

  it('confirm button is enabled after selecting a date', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    expect(screen.getByTestId('btn-copy-confirm')).not.toBeDisabled();
  });

  // --- Tomorrow Button ---

  it('clicking Tomorrow selects next day and hides no-selection', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    expect(screen.queryByText('Chưa chọn ngày nào')).not.toBeInTheDocument();
  });

  it('clicking Tomorrow then confirm calls onCopy with next date', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));
    expect(onCopy).toHaveBeenCalledWith(['2025-01-16'], false);
  });

  // --- This Week Button ---

  it('clicking This Week selects 6 dates', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-week'));
    expect(screen.queryByText('Chưa chọn ngày nào')).not.toBeInTheDocument();
  });

  it('clicking This Week then confirm calls onCopy with 6 dates', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-week'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));

    const expectedDates = [
      '2025-01-16',
      '2025-01-17',
      '2025-01-18',
      '2025-01-19',
      '2025-01-20',
      '2025-01-21',
    ];
    expect(onCopy).toHaveBeenCalledWith(expectedDates, false);
  });

  // --- Custom Date Input ---

  it('clicking Custom shows date input', () => {
    renderModal();
    fireEvent.click(screen.getByText('Tùy chọn'));
    const dateInput = screen.getByLabelText('Chọn ngày');
    expect(dateInput).toBeInTheDocument();
  });

  it('adding a custom date via input selects it', () => {
    renderModal();
    fireEvent.click(screen.getByText('Tùy chọn'));
    const dateInput = screen.getByLabelText('Chọn ngày');
    fireEvent.change(dateInput, { target: { value: '2025-02-01' } });
    expect(screen.queryByText('Chưa chọn ngày nào')).not.toBeInTheDocument();
  });

  it('does not add source date as a target', () => {
    renderModal();
    fireEvent.click(screen.getByText('Tùy chọn'));
    const dateInput = screen.getByLabelText('Chọn ngày');
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });
    expect(screen.getByText('Chưa chọn ngày nào')).toBeInTheDocument();
  });

  it('does not add duplicate dates', () => {
    renderModal();
    fireEvent.click(screen.getByText('Tùy chọn'));
    const dateInput = screen.getByLabelText('Chọn ngày');
    fireEvent.change(dateInput, { target: { value: '2025-02-01' } });
    fireEvent.change(dateInput, { target: { value: '2025-02-01' } });

    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('.lucide-trash-2'));
    expect(removeButtons).toHaveLength(1);
  });

  it('ignores empty value from date input', () => {
    renderModal();
    fireEvent.click(screen.getByText('Tùy chọn'));
    const dateInput = screen.getByLabelText('Chọn ngày');
    fireEvent.change(dateInput, { target: { value: '' } });
    expect(screen.getByText('Chưa chọn ngày nào')).toBeInTheDocument();
  });

  // --- Remove Date ---

  it('removes a selected date when trash icon clicked', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('.lucide-trash-2'));
    expect(removeButtons.length).toBeGreaterThan(0);
    fireEvent.click(removeButtons[0]);
    expect(screen.getByText('Chưa chọn ngày nào')).toBeInTheDocument();
  });

  it('confirm button becomes disabled after removing all dates', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    expect(screen.getByTestId('btn-copy-confirm')).not.toBeDisabled();

    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('.lucide-trash-2'));
    fireEvent.click(removeButtons[0]);
    expect(screen.getByTestId('btn-copy-confirm')).toBeDisabled();
  });

  // --- Copy Mode Toggle ---

  it('overwrite mode is active by default', () => {
    renderModal();
    const overwriteBtn = screen.getByTestId('btn-mode-overwrite');
    expect(overwriteBtn.className).toContain('text-emerald-700');
  });

  it('clicking merge mode activates it', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-mode-merge'));
    const mergeBtn = screen.getByTestId('btn-mode-merge');
    expect(mergeBtn.className).toContain('text-emerald-700');
  });

  it('switching back to overwrite deactivates merge', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-mode-merge'));
    fireEvent.click(screen.getByTestId('btn-mode-overwrite'));
    const overwriteBtn = screen.getByTestId('btn-mode-overwrite');
    expect(overwriteBtn.className).toContain('text-emerald-700');
  });

  it('calls onCopy with mergeMode true when merge selected', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-mode-merge'));
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));
    expect(onCopy).toHaveBeenCalledWith(['2025-01-16'], true);
  });

  // --- Close Behavior ---

  it('calls onClose when X button is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('Đóng hộp thoại'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // --- Source Preview Sections ---

  it('only shows meal sections that have dishes in preview', () => {
    const lunchOnlyPlan = makePlan(sourceDate, [], ['d2'], []);
    renderModal(lunchOnlyPlan);
    expect(screen.getByText('Xem trước kế hoạch nguồn')).toBeInTheDocument();
    expect(screen.queryByText('Sáng:')).not.toBeInTheDocument();
    expect(screen.getByText('Trưa:')).toBeInTheDocument();
    expect(screen.queryByText('Tối:')).not.toBeInTheDocument();
  });

  // --- Quick Select Overrides Previous Selection ---

  it('Tomorrow overrides previous week selection', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-week'));
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));
    expect(onCopy).toHaveBeenCalledWith(['2025-01-16'], false);
  });

  it('This Week overrides previous tomorrow selection', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-week'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));

    const call = onCopy.mock.calls[0];
    expect(call[0]).toHaveLength(6);
  });

  // --- Selected Dates Header ---

  it('shows selected dates header when dates are selected', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    expect(screen.getByText('Ngày đã chọn')).toBeInTheDocument();
  });

  it('does not show selected dates header when no dates selected', () => {
    renderModal();
    expect(screen.queryByText('Ngày đã chọn')).not.toBeInTheDocument();
  });
});

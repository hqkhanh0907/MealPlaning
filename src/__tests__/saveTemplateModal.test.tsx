import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveTemplateModal } from '../components/modals/SaveTemplateModal';
import { DayPlan, Dish } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.count !== undefined) return `${key}:${opts.count}`;
      return key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="backdrop" onClick={onClose}>{children}</div>
  ),
}));

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

const makePlan = (ids: string[] = ['d1']): DayPlan => ({
  date: '2025-01-15',
  breakfastDishIds: ids,
  lunchDishIds: ['d2'],
  dinnerDishIds: [],
});

const makeDishes = (): Dish[] => [
  { id: 'd1', name: { vi: 'Phở', en: 'Pho' }, ingredients: [], tags: ['breakfast'] },
  { id: 'd2', name: { vi: 'Cơm', en: 'Rice' }, ingredients: [], tags: ['lunch'] },
];

describe('SaveTemplateModal', () => {
  const defaultProps = {
    currentPlan: makePlan(),
    dishes: makeDishes(),
    onSave: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with title and input', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    expect(screen.getByTestId('save-template-modal')).toBeInTheDocument();
    expect(screen.getByTestId('input-template-name')).toBeInTheDocument();
    expect(screen.getByTestId('btn-save-template')).toBeInTheDocument();
  });

  it('shows meal preview with dish names', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    expect(screen.getByText('Phở')).toBeInTheDocument();
    expect(screen.getByText('Cơm')).toBeInTheDocument();
  });

  it('shows noMeals text for empty dinner slot', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    expect(screen.getByText('copyPlan.noMeals')).toBeInTheDocument();
  });

  it('calls onSave with trimmed name on submit', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.change(screen.getByTestId('input-template-name'), { target: { value: '  My Template  ' } });
    fireEvent.click(screen.getByTestId('btn-save-template'));
    expect(defaultProps.onSave).toHaveBeenCalledWith('My Template');
  });

  it('shows validation error when submitting empty name', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-save-template'));
    expect(screen.getByText('template.nameRequired')).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('shows validation error on blur with empty input', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const input = screen.getByTestId('input-template-name');
    fireEvent.blur(input);
    expect(screen.getByText('template.nameRequired')).toBeInTheDocument();
  });

  it('submits on Enter key', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const input = screen.getByTestId('input-template-name');
    fireEvent.change(input, { target: { value: 'Enter Template' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(defaultProps.onSave).toHaveBeenCalledWith('Enter Template');
  });

  it('does not submit on other keys', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const input = screen.getByTestId('input-template-name');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('shows character count', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.change(screen.getByTestId('input-template-name'), { target: { value: 'Hello' } });
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('calls onClose when X button clicked', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(b => !b.getAttribute('data-testid'));
    if (xButton) fireEvent.click(xButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows total meals count in preview', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    // Preview line: "template.preview — template.mealsCount:2"
    expect(screen.getByText(/template\.mealsCount/)).toBeInTheDocument();
  });

  it('handles plan with all empty slots', () => {
    const emptyPlan: DayPlan = { date: '2025-01-15', breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] };
    render(<SaveTemplateModal {...defaultProps} currentPlan={emptyPlan} />);
    expect(screen.getByText(/template\.mealsCount/)).toBeInTheDocument();
  });
});

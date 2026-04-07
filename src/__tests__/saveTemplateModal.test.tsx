import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    <div data-testid="backdrop" onClick={onClose}>
      {children}
    </div>
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

  it('calls onSave with trimmed name on submit', async () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.change(screen.getByTestId('input-template-name'), { target: { value: ' My Template ' } });
    fireEvent.click(screen.getByTestId('btn-save-template'));
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith('My Template', undefined);
    });
  });

  it('shows validation error when submitting empty name', async () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-save-template'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('shows validation error on blur with empty input', async () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const input = screen.getByTestId('input-template-name');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('submits on Enter key', async () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const input = screen.getByTestId('input-template-name');
    fireEvent.change(input, { target: { value: 'Enter Template' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith('Enter Template', undefined);
    });
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

  it('calls onClose when close button clicked', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-close-save-template'));
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

  it('adds tag via preset button', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const presetButtons = screen.getAllByRole('button').filter(b => b.textContent?.startsWith('+'));
    expect(presetButtons.length).toBeGreaterThan(0);
    fireEvent.click(presetButtons[0]);
    const tagText = presetButtons[0].textContent?.replace('+ ', '') ?? '';
    expect(screen.getByText(tagText)).toBeInTheDocument();
  });

  it('adds custom tag via Enter key', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const tagInput = screen.getByTestId('input-template-tag');
    fireEvent.change(tagInput, { target: { value: 'MyTag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('MyTag')).toBeInTheDocument();
  });

  it('removes tag when X clicked', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const tagInput = screen.getByTestId('input-template-tag');
    fireEvent.change(tagInput, { target: { value: 'RemoveMe' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('RemoveMe')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('remove-tag-RemoveMe'));
    expect(screen.queryByText('RemoveMe')).not.toBeInTheDocument();
  });

  it('passes tags to onSave', async () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.change(screen.getByTestId('input-template-name'), { target: { value: 'Tagged Template' } });
    const tagInput = screen.getByTestId('input-template-tag');
    fireEvent.change(tagInput, { target: { value: 'TestTag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    fireEvent.click(screen.getByTestId('btn-save-template'));
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith('Tagged Template', ['TestTag']);
    });
  });

  it('does not add duplicate tag', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const tagInput = screen.getByTestId('input-template-tag');
    fireEvent.change(tagInput, { target: { value: 'Dup' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    fireEvent.change(tagInput, { target: { value: 'Dup' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getAllByText('Dup').length).toBe(1);
  });

  it('adds tag via comma key', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    const tagInput = screen.getByTestId('input-template-tag');
    fireEvent.change(tagInput, { target: { value: 'CommaTag' } });
    fireEvent.keyDown(tagInput, { key: ',' });
    expect(screen.getByText('CommaTag')).toBeInTheDocument();
  });
});

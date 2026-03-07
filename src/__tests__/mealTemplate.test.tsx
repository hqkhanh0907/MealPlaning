import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import { useMealTemplate } from '../hooks/useMealTemplate';
import { TemplateManager } from '../components/modals/TemplateManager';
import { DayPlan, MealTemplate, Dish } from '../types';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'count' in opts) return `${key}_${opts.count}`;
      return key;
    },
    i18n: { language: 'vi' },
  }),
}));

// Mock ModalBackdrop
vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useModalBackHandler
vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

// Mock usePersistedState
let mockTemplates: MealTemplate[] = [];
vi.mock('../hooks/usePersistedState', () => ({
  usePersistedState: <T,>(_key: string, initial: T) => {
    // Use mockTemplates for 'meal-templates' key
    const value = (mockTemplates.length > 0 ? mockTemplates : initial) as T;
    const setter = vi.fn((updater: unknown) => {
      if (typeof updater === 'function') {
        mockTemplates = (updater as (prev: MealTemplate[]) => MealTemplate[])(mockTemplates);
      } else {
        mockTemplates = updater as MealTemplate[];
      }
    });
    return [value, setter, vi.fn()] as const;
  },
}));

// Mock generateId
vi.mock('../utils/helpers', () => ({
  generateId: (prefix: string) => `${prefix}-test-id`,
  parseLocalDate: (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  },
}));

// Mock localize
vi.mock('../utils/localize', () => ({
  getLocalizedField: (name: Record<string, string>, _lang: string) => name.vi || name.en || '',
}));

const makePlan = (date: string): DayPlan => ({
  date,
  breakfastDishIds: ['d1'],
  lunchDishIds: ['d2'],
  dinnerDishIds: ['d3'],
});

const makeTemplate = (id: string, name: string): MealTemplate => ({
  id,
  name,
  breakfastDishIds: ['d1'],
  lunchDishIds: ['d2'],
  dinnerDishIds: ['d3'],
  createdAt: '2025-01-01T00:00:00.000Z',
});

const makeDish = (id: string, name: string): Dish => ({
  id,
  name: { vi: name, en: name },
  ingredients: [],
  tags: ['lunch'],
});

describe('useMealTemplate', () => {
  beforeEach(() => {
    mockTemplates = [];
  });

  it('starts with empty templates', () => {
    const { result } = renderHook(() => useMealTemplate());
    expect(result.current.templates).toEqual([]);
  });

  it('saves a template from plan', () => {
    const { result } = renderHook(() => useMealTemplate());

    act(() => result.current.saveTemplate('My Template', makePlan('2025-01-01')));

    expect(mockTemplates).toHaveLength(1);
    expect(mockTemplates[0].name).toBe('My Template');
    expect(mockTemplates[0].breakfastDishIds).toEqual(['d1']);
  });

  it('deletes a template', () => {
    mockTemplates = [makeTemplate('tpl-1', 'Test')];
    const { result } = renderHook(() => useMealTemplate());

    act(() => result.current.deleteTemplate('tpl-1'));

    expect(mockTemplates).toHaveLength(0);
  });

  it('renames a template', () => {
    mockTemplates = [makeTemplate('tpl-1', 'Old Name')];
    const { result } = renderHook(() => useMealTemplate());

    act(() => result.current.renameTemplate('tpl-1', 'New Name'));

    expect(mockTemplates[0].name).toBe('New Name');
  });

  it('applies template returns DayPlan', () => {
    const template = makeTemplate('tpl-1', 'Test');
    const { result } = renderHook(() => useMealTemplate());

    let plan: DayPlan | undefined;
    act(() => {
      plan = result.current.applyTemplate(template, '2025-02-01');
    });

    expect(plan).toBeDefined();
    expect(plan!.date).toBe('2025-02-01');
    expect(plan!.breakfastDishIds).toEqual(['d1']);
    expect(plan!.lunchDishIds).toEqual(['d2']);
    expect(plan!.dinnerDishIds).toEqual(['d3']);
  });
});

describe('TemplateManager', () => {
  const dishes: Dish[] = [makeDish('d1', 'Phở'), makeDish('d2', 'Cơm'), makeDish('d3', 'Bún')];

  const defaultProps = {
    templates: [] as MealTemplate[],
    dishes,
    onApply: vi.fn(),
    onDelete: vi.fn(),
    onRename: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no templates', () => {
    render(<TemplateManager {...defaultProps} />);
    expect(screen.getByText('template.empty')).toBeInTheDocument();
    expect(screen.getByText('template.emptyHint')).toBeInTheDocument();
  });

  it('renders template list', () => {
    const templates = [makeTemplate('tpl-1', 'Bữa ăn A'), makeTemplate('tpl-2', 'Bữa ăn B')];
    render(<TemplateManager {...defaultProps} templates={templates} />);

    expect(screen.getByText('Bữa ăn A')).toBeInTheDocument();
    expect(screen.getByText('Bữa ăn B')).toBeInTheDocument();
    expect(screen.getByTestId('template-manager-modal')).toBeInTheDocument();
  });

  it('calls onApply when apply clicked', () => {
    const templates = [makeTemplate('tpl-1', 'Test')];
    render(<TemplateManager {...defaultProps} templates={templates} />);

    fireEvent.click(screen.getByTestId('btn-apply-template-tpl-1'));
    expect(defaultProps.onApply).toHaveBeenCalledWith(templates[0]);
  });

  it('calls onDelete when delete clicked', () => {
    const templates = [makeTemplate('tpl-1', 'Test')];
    render(<TemplateManager {...defaultProps} templates={templates} />);

    fireEvent.click(screen.getByTestId('btn-delete-template-tpl-1'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith('tpl-1');
  });

  it('inline rename flow', () => {
    const templates = [makeTemplate('tpl-1', 'Old Name')];
    render(<TemplateManager {...defaultProps} templates={templates} />);

    // Start rename
    fireEvent.click(screen.getByTestId('btn-rename-template-tpl-1'));

    // Input should appear
    const input = screen.getByTestId('template-rename-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Old Name');

    // Change value and confirm
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByTestId('template-rename-confirm'));

    expect(defaultProps.onRename).toHaveBeenCalledWith('tpl-1', 'New Name');
  });

  it('cancel rename flow', () => {
    const templates = [makeTemplate('tpl-1', 'Old Name')];
    render(<TemplateManager {...defaultProps} templates={templates} />);

    // Start rename
    fireEvent.click(screen.getByTestId('btn-rename-template-tpl-1'));
    const input = screen.getByTestId('template-rename-input');
    expect(input).toBeInTheDocument();

    // Press Escape to cancel
    fireEvent.keyDown(input, { key: 'Escape' });

    // Input should disappear and name should still be shown
    expect(screen.queryByTestId('template-rename-input')).not.toBeInTheDocument();
    expect(screen.getByText('Old Name')).toBeInTheDocument();
  });

  it('rename via Enter key', () => {
    const templates = [makeTemplate('tpl-1', 'Old Name')];
    render(<TemplateManager {...defaultProps} templates={templates} />);

    fireEvent.click(screen.getByTestId('btn-rename-template-tpl-1'));
    const input = screen.getByTestId('template-rename-input');

    fireEvent.change(input, { target: { value: 'Enter Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(defaultProps.onRename).toHaveBeenCalledWith('tpl-1', 'Enter Name');
  });

  it('does not rename with empty value', () => {
    const templates = [makeTemplate('tpl-1', 'Old Name')];
    render(<TemplateManager {...defaultProps} templates={templates} />);

    fireEvent.click(screen.getByTestId('btn-rename-template-tpl-1'));
    const input = screen.getByTestId('template-rename-input');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('template-rename-confirm'));

    expect(defaultProps.onRename).not.toHaveBeenCalled();
  });

  it('displays dish names for templates with dishes', () => {
    const templates = [makeTemplate('tpl-1', 'Full Plan')];
    render(<TemplateManager {...defaultProps} templates={templates} />);

    // Dish names should appear in the preview (with meal emoji prefix)
    expect(screen.getByText(/Phở/)).toBeInTheDocument();
    expect(screen.getByText(/Cơm/)).toBeInTheDocument();
    expect(screen.getByText(/Bún/)).toBeInTheDocument();
  });
});

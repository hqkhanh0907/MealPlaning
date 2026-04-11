import { fireEvent, render, screen } from '@testing-library/react';
import { Flame, Moon, Sun } from 'lucide-react';

import { ButtonGroupSelector } from '../components/shared/ButtonGroupSelector';

const defaultOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
] as const;

type OptionValue = 'a' | 'b' | 'c';

describe('ButtonGroupSelector', () => {
  const defaultProps = {
    options: defaultOptions as unknown as Array<{ value: OptionValue; label: string }>,
    value: 'a' as OptionValue,
    onChange: vi.fn(),
    name: 'test-group',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders all options', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
      expect(screen.getByText('Option C')).toBeInTheDocument();
    });

    it('renders with data-testid on container', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      expect(screen.getByTestId('button-group-test-group')).toBeInTheDocument();
    });

    it('renders individual option testids', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      expect(screen.getByTestId('button-group-option-a')).toBeInTheDocument();
      expect(screen.getByTestId('button-group-option-b')).toBeInTheDocument();
      expect(screen.getByTestId('button-group-option-c')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has radiogroup role on container', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('has aria-label for screen readers', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'test-group');
    });

    it('renders native radio inputs', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });

    it('marks selected radio as checked', () => {
      render(<ButtonGroupSelector {...defaultProps} value="b" />);
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
      expect(radios[2]).not.toBeChecked();
    });

    it('sets tabIndex 0 on selected, -1 on others', () => {
      render(<ButtonGroupSelector {...defaultProps} value="b" />);
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('tabIndex', '-1');
      expect(radios[1]).toHaveAttribute('tabIndex', '0');
      expect(radios[2]).toHaveAttribute('tabIndex', '-1');
    });

    it('all radios have type radio', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      screen.getAllByRole('radio').forEach(radio => {
        expect(radio).toHaveAttribute('type', 'radio');
      });
    });
  });

  describe('selection', () => {
    it('calls onChange when clicking an option', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByText('Option B'));
      expect(onChange).toHaveBeenCalledWith('b');
    });

    it('calls onChange with correct value for each option', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByText('Option C'));
      expect(onChange).toHaveBeenCalledWith('c');
    });
  });

  describe('keyboard navigation', () => {
    it('moves to next option on ArrowRight', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith('b');
    });

    it('moves to previous option on ArrowLeft', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} value="b" onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' });
      expect(onChange).toHaveBeenCalledWith('a');
    });

    it('wraps around from last to first on ArrowRight', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} value="c" onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith('a');
    });

    it('wraps around from first to last on ArrowLeft', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} value="a" onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' });
      expect(onChange).toHaveBeenCalledWith('c');
    });

    it('moves to next on ArrowDown', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowDown' });
      expect(onChange).toHaveBeenCalledWith('b');
    });

    it('moves to previous on ArrowUp', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} value="c" onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowUp' });
      expect(onChange).toHaveBeenCalledWith('b');
    });

    it('moves to first option on Home', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} value="c" onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Home' });
      expect(onChange).toHaveBeenCalledWith('a');
    });

    it('moves to last option on End', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} value="a" onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'End' });
      expect(onChange).toHaveBeenCalledWith('c');
    });

    it('does nothing on unrelated keys', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('focuses the target radio input on navigation', () => {
      const onChange = vi.fn();
      render(<ButtonGroupSelector {...defaultProps} onChange={onChange} />);

      const radios = screen.getAllByRole('radio');
      radios[1].focus = vi.fn();

      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });
      expect(radios[1].focus).toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('applies selected styling to active option', () => {
      render(<ButtonGroupSelector {...defaultProps} value="a" />);
      const selected = screen.getByTestId('button-group-option-a');
      expect(selected.className).toContain('bg-primary');
      expect(selected.className).toContain('text-primary-foreground');
      expect(selected.className).toContain('shadow-sm');
    });

    it('applies unselected styling to inactive options', () => {
      render(<ButtonGroupSelector {...defaultProps} value="a" />);
      const unselected = screen.getByTestId('button-group-option-b');
      expect(unselected.className).toContain('bg-muted');
      expect(unselected.className).toContain('text-foreground');
    });

    it('applies transition classes', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      const btn = screen.getByTestId('button-group-option-a');
      expect(btn.className).toContain('transition-colors');
      expect(btn.className).toContain('duration-150');
    });

    it('ensures minimum touch target height', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      const labels = screen.getAllByTestId(/^button-group-option-/);
      labels.forEach(label => {
        expect(label.className).toContain('min-h-[44px]');
      });
    });
  });

  describe('columns', () => {
    it('defaults to 3 columns', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      expect(screen.getByRole('radiogroup').className).toContain('grid-cols-3');
    });

    it('applies 2 columns', () => {
      render(<ButtonGroupSelector {...defaultProps} columns={2} />);
      expect(screen.getByRole('radiogroup').className).toContain('grid-cols-2');
    });

    it('applies 4 columns', () => {
      render(<ButtonGroupSelector {...defaultProps} columns={4} />);
      expect(screen.getByRole('radiogroup').className).toContain('grid-cols-4');
    });
  });

  describe('icons', () => {
    it('renders icon when provided', () => {
      const options = [
        { value: 'sun', label: 'Sun', icon: <Sun data-testid="sun-icon" /> },
        { value: 'moon', label: 'Moon', icon: <Moon data-testid="moon-icon" /> },
      ];
      render(<ButtonGroupSelector options={options} value="sun" onChange={vi.fn()} name="theme" />);
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });

    it('does not render icon wrapper when icon is not provided', () => {
      render(<ButtonGroupSelector {...defaultProps} />);
      const btn = screen.getByTestId('button-group-option-a');
      expect(btn.querySelectorAll('span.shrink-0')).toHaveLength(0);
    });

    it('renders mixed options with and without icons', () => {
      const options = [
        { value: 'x', label: 'With Icon', icon: <Flame data-testid="flame-icon" /> },
        { value: 'y', label: 'No Icon' },
      ];
      render(<ButtonGroupSelector options={options} value="x" onChange={vi.fn()} name="mixed" />);
      expect(screen.getByTestId('flame-icon')).toBeInTheDocument();
      expect(screen.getByText('No Icon')).toBeInTheDocument();
    });
  });

  describe('generic type safety', () => {
    it('works with string literal union types', () => {
      type Goal = 'cut' | 'maintain' | 'bulk';
      const options: Array<{ value: Goal; label: string }> = [
        { value: 'cut', label: 'Giảm cân' },
        { value: 'maintain', label: 'Duy trì' },
        { value: 'bulk', label: 'Tăng cân' },
      ];
      const onChange = vi.fn<(v: Goal) => void>();
      render(<ButtonGroupSelector<Goal> options={options} value="cut" onChange={onChange} name="goal" />);
      fireEvent.click(screen.getByText('Tăng cân'));
      expect(onChange).toHaveBeenCalledWith('bulk');
    });
  });
});

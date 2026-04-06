import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CustomExerciseModal } from '../features/fitness/components/CustomExerciseModal';

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="modal-backdrop">
      <button data-testid="backdrop-overlay" onClick={onClose} type="button" />
      {children}
    </div>
  ),
}));

afterEach(cleanup);

describe('CustomExerciseModal', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(<CustomExerciseModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when isOpen is true', () => {
    render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByTestId('custom-exercise-modal')).toBeInTheDocument();
    expect(screen.getByTestId('custom-exercise-name')).toBeInTheDocument();
    expect(screen.getByTestId('custom-exercise-muscle')).toBeInTheDocument();
    expect(screen.getByTestId('custom-exercise-category')).toBeInTheDocument();
    expect(screen.getByTestId('save-custom-exercise')).toBeInTheDocument();
  });

  it('disables save button with empty name', async () => {
    render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('save-custom-exercise'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('enables save button when name is provided', () => {
    render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    fireEvent.change(screen.getByTestId('custom-exercise-name'), {
      target: { value: 'My Exercise' },
    });
    expect(screen.getByTestId('save-custom-exercise')).not.toBeDisabled();
  });

  it('saves custom exercise with trimmed name', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<CustomExerciseModal isOpen onClose={onClose} onSave={onSave} />);
    fireEvent.change(screen.getByTestId('custom-exercise-name'), {
      target: { value: ' Hip Thrust ' },
    });
    fireEvent.click(screen.getByTestId('save-custom-exercise'));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Hip Thrust' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not save when name is only whitespace', async () => {
    const onSave = vi.fn();
    render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByTestId('custom-exercise-name'), {
      target: { value: ' ' },
    });
    fireEvent.click(screen.getByTestId('save-custom-exercise'));
    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it('resets form after successful save', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(<CustomExerciseModal isOpen onClose={onClose} onSave={onSave} />);
    fireEvent.change(screen.getByTestId('custom-exercise-name'), {
      target: { value: 'My Exercise' },
    });
    fireEvent.click(screen.getByTestId('save-custom-exercise'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    rerender(<CustomExerciseModal isOpen onClose={onClose} onSave={onSave} />);
    expect(screen.getByTestId('custom-exercise-name')).toHaveValue('');
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<CustomExerciseModal isOpen onClose={onClose} onSave={vi.fn()} />);
    const cancelButton = screen.getByText('Hủy');
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows selecting muscle group', async () => {
    const onSave = vi.fn();
    render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByTestId('custom-exercise-muscle'), {
      target: { value: 'back' },
    });
    fireEvent.change(screen.getByTestId('custom-exercise-name'), {
      target: { value: 'Pull-up' },
    });
    fireEvent.click(screen.getByTestId('save-custom-exercise'));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ muscleGroup: 'back', name: 'Pull-up' }));
    });
  });

  it('allows selecting category', async () => {
    const onSave = vi.fn();
    render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByTestId('custom-exercise-category'), {
      target: { value: 'isolation' },
    });
    fireEvent.change(screen.getByTestId('custom-exercise-name'), {
      target: { value: 'Bicep Curl' },
    });
    fireEvent.click(screen.getByTestId('save-custom-exercise'));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ category: 'isolation' }));
    });
  });

  it('allows entering equipment', async () => {
    const onSave = vi.fn();
    render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByTestId('custom-exercise-name'), {
      target: { value: 'My Exercise' },
    });
    fireEvent.change(screen.getByTestId('custom-exercise-equipment'), {
      target: { value: 'dumbbell' },
    });
    fireEvent.click(screen.getByTestId('save-custom-exercise'));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ equipment: 'dumbbell' }));
    });
  });

  it('saves with default category compound', async () => {
    const onSave = vi.fn();
    render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByTestId('custom-exercise-name'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByTestId('save-custom-exercise'));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ category: 'compound' }));
    });
  });

  // --- TODO-08: maxLength on name input ---

  it('has maxLength=80 on exercise name input', () => {
    render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByTestId('custom-exercise-name')).toHaveAttribute('maxLength', '80');
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { Dumbbell, Image, Search } from 'lucide-react';

import { EmptyState } from '../components/shared/EmptyState';

describe('EmptyState', () => {
  describe('compact variant', () => {
    it('renders title only', () => {
      render(<EmptyState variant="compact" title="Không tìm thấy kết quả" />);
      expect(screen.getByText('Không tìm thấy kết quả')).toBeInTheDocument();
    });

    it('renders title and description', () => {
      render(<EmptyState variant="compact" title="Không có dữ liệu" description="Thử lại sau" />);
      expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
      expect(screen.getByText('Thử lại sau')).toBeInTheDocument();
    });

    it('renders CTA link when actionLabel and onAction provided', () => {
      const onAction = vi.fn();
      render(<EmptyState variant="compact" title="Trống" actionLabel="Thêm mới" onAction={onAction} />);
      const btn = screen.getByText('Thêm mới');
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not render CTA when only actionLabel provided without onAction', () => {
      render(<EmptyState variant="compact" title="Trống" actionLabel="Thêm mới" />);
      expect(screen.queryByText('Thêm mới')).not.toBeInTheDocument();
    });

    it('does not render CTA when only onAction provided without actionLabel', () => {
      render(<EmptyState variant="compact" title="Trống" onAction={vi.fn()} />);
      // No button rendered — only the title text
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render icon even if provided', () => {
      render(<EmptyState variant="compact" icon={Dumbbell} title="Trống" />);
      // compact variant does not render icons
      expect(screen.queryByText('Trống')).toBeInTheDocument();
      // No icon container should be present
      expect(document.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<EmptyState variant="compact" title="Trống" className="col-span-full" />);
      expect(container.firstChild).toHaveClass('col-span-full');
    });
  });

  describe('standard variant (default)', () => {
    it('renders title without icon when icon not provided', () => {
      render(<EmptyState title="Chưa có dữ liệu" />);
      expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument();
      // No icon container
      expect(document.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('renders icon, title, and description', () => {
      render(<EmptyState icon={Dumbbell} title="Chưa có lịch sử" description="Bắt đầu tập luyện" />);
      expect(screen.getByText('Chưa có lịch sử')).toBeInTheDocument();
      expect(screen.getByText('Bắt đầu tập luyện')).toBeInTheDocument();
      // Icon is rendered
      expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('renders CTA button when actionLabel and onAction provided', () => {
      const onAction = vi.fn();
      render(<EmptyState icon={Dumbbell} title="Trống" actionLabel="Bắt đầu" onAction={onAction} />);
      const btn = screen.getByRole('button', { name: 'Bắt đầu' });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not render CTA when actionLabel missing', () => {
      render(<EmptyState icon={Dumbbell} title="Trống" onAction={vi.fn()} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<EmptyState title="Trống" />);
      // Only one text element rendered (title)
      const allText = screen.getAllByText(/.+/);
      expect(allText.length).toBe(1);
    });

    it('defaults to standard variant when variant not specified', () => {
      const { container } = render(<EmptyState title="Trống" />);
      // Standard has py-12 px-6 classes
      expect(container.firstChild).toHaveClass('py-12');
      expect(container.firstChild).toHaveClass('px-6');
    });

    it('applies custom className', () => {
      const { container } = render(<EmptyState title="Trống" className="my-custom" />);
      expect(container.firstChild).toHaveClass('my-custom');
    });
  });

  describe('hero variant', () => {
    it('renders icon in prominent circle container', () => {
      render(<EmptyState variant="hero" icon={Search} title="Chưa có món ăn" />);
      expect(screen.getByText('Chưa có món ăn')).toBeInTheDocument();
      // Icon container with h-16 w-16
      const iconContainer = document.querySelector('[aria-hidden="true"]')?.parentElement;
      expect(iconContainer).toHaveClass('h-16', 'w-16');
    });

    it('renders title, description, and CTA button', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          variant="hero"
          icon={Search}
          title="Chưa có món ăn nào"
          description="Thêm món ăn đầu tiên"
          actionLabel="Thêm món"
          onAction={onAction}
        />,
      );
      expect(screen.getByText('Chưa có món ăn nào')).toBeInTheDocument();
      expect(screen.getByText('Thêm món ăn đầu tiên')).toBeInTheDocument();
      const btn = screen.getByRole('button', { name: 'Thêm món' });
      fireEvent.click(btn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('has card styling with dashed border', () => {
      const { container } = render(<EmptyState variant="hero" title="Trống" />);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('border-dashed');
      expect(root).toHaveClass('rounded-2xl');
    });

    it('renders without icon when not provided', () => {
      render(<EmptyState variant="hero" title="Trống" />);
      expect(screen.getByText('Trống')).toBeInTheDocument();
      expect(document.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('does not render CTA without onAction', () => {
      render(<EmptyState variant="hero" title="Trống" actionLabel="Action" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('applies custom className alongside default hero classes', () => {
      const { container } = render(<EmptyState variant="hero" title="Trống" className="col-span-full" />);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('col-span-full');
      expect(root).toHaveClass('border-dashed');
    });
  });

  describe('icon rendering across variants', () => {
    it('standard renders icon with h-6 w-6 classes', () => {
      render(<EmptyState variant="standard" icon={Image} title="Test" />);
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toHaveClass('h-6', 'w-6');
    });

    it('hero renders icon with h-8 w-8 classes', () => {
      render(<EmptyState variant="hero" icon={Image} title="Test" />);
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toHaveClass('h-8', 'w-8');
    });
  });
});

import { fireEvent, render, screen } from '@testing-library/react';

import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { BottomNavBar, DesktopNav, getTabLabels, TabLoadingFallback } from '../components/navigation';
import { DetailModal } from '../components/shared/DetailModal';
import { EmptyState } from '../components/shared/EmptyState';
import { ListToolbar } from '../components/shared/ListToolbar';
import { UnitSelector } from '../components/shared/UnitSelector';
import { UnsavedChangesDialog } from '../components/shared/UnsavedChangesDialog';

// Mock useModalBackHandler to avoid history side effects
vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

// --- EmptyState ---
describe('EmptyState', () => {
  const defaultIcon = <span data-testid="icon">🍽️</span>;

  it('renders no-data message when no searchQuery', () => {
    render(<EmptyState icon={defaultIcon} searchQuery="" entityName="món ăn" />);
    expect(screen.getByText('Chưa có món ăn nào')).toBeInTheDocument();
    expect(screen.getByText(/Bắt đầu tạo/)).toBeInTheDocument();
  });

  it('renders search-not-found message when searchQuery present', () => {
    render(<EmptyState icon={defaultIcon} searchQuery="xyz" entityName="món ăn" />);
    expect(screen.getByText('Không tìm thấy món ăn')).toBeInTheDocument();
    expect(screen.getByText(/từ khóa khác/)).toBeInTheDocument();
  });

  it('renders action button when actionLabel and onAction provided and no search', () => {
    const onAction = vi.fn();
    render(
      <EmptyState icon={defaultIcon} searchQuery="" entityName="món ăn" actionLabel="Tạo món" onAction={onAction} />,
    );
    const btn = screen.getByText('Tạo món');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when searching', () => {
    render(
      <EmptyState icon={defaultIcon} searchQuery="abc" entityName="món ăn" actionLabel="Tạo" onAction={vi.fn()} />,
    );
    expect(screen.queryByText('Tạo')).not.toBeInTheDocument();
  });
});

// --- DetailModal ---
describe('DetailModal', () => {
  it('renders title and children', () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    render(
      <DetailModal title="Chi tiết" editLabel="Sửa" onClose={onClose} onEdit={onEdit}>
        <p>Content here</p>
      </DetailModal>,
    );
    expect(screen.getByText('Chi tiết')).toBeInTheDocument();
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    render(
      <DetailModal title="Test" editLabel="Chỉnh sửa" onClose={onClose} onEdit={onEdit}>
        <div>Body</div>
      </DetailModal>,
    );
    // Click the footer edit button
    fireEvent.click(screen.getByText('Chỉnh sửa'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    render(
      <DetailModal title="Test" editLabel="Edit" onClose={onClose} onEdit={vi.fn()}>
        <div>Body</div>
      </DetailModal>,
    );
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// --- ListToolbar ---
describe('ListToolbar', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    searchPlaceholder: 'Tìm kiếm...',
    sortOptions: [
      { value: 'name', label: 'Tên' },
      { value: 'date', label: 'Ngày' },
    ],
    sortBy: 'name',
    onSortChange: vi.fn(),
    viewLayout: 'grid' as const,
    onLayoutChange: vi.fn(),
    onAdd: vi.fn(),
    addLabel: 'Thêm mới',
  };

  it('renders search input with placeholder', () => {
    render(<ListToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Tìm kiếm...')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', () => {
    render(<ListToolbar {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm...'), { target: { value: 'hello' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('hello');
  });

  it('calls onSortChange when sort dropdown changes', () => {
    render(<ListToolbar {...defaultProps} />);
    fireEvent.change(screen.getByDisplayValue('Tên'), { target: { value: 'date' } });
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('date');
  });

  it('calls onLayoutChange when layout button clicked', () => {
    render(<ListToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    expect(defaultProps.onLayoutChange).toHaveBeenCalledWith('list');
  });

  it('calls onLayoutChange with grid when grid button clicked', () => {
    render(<ListToolbar {...defaultProps} viewLayout="list" />);
    fireEvent.click(screen.getByTitle('Xem dạng lưới'));
    expect(defaultProps.onLayoutChange).toHaveBeenCalledWith('grid');
  });

  it('calls onAdd when add button clicked', () => {
    render(<ListToolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Thêm mới'));
    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('renders children', () => {
    render(
      <ListToolbar {...defaultProps}>
        <div>Extra content</div>
      </ListToolbar>,
    );
    expect(screen.getByText('Extra content')).toBeInTheDocument();
  });
});

// --- UnsavedChangesDialog ---
describe('UnsavedChangesDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <UnsavedChangesDialog isOpen={false} onSave={vi.fn()} onDiscard={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog with 3 action buttons when open', () => {
    render(<UnsavedChangesDialog isOpen={true} onSave={vi.fn()} onDiscard={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Thay đổi chưa lưu')).toBeInTheDocument();
    expect(screen.getByText('Lưu & quay lại')).toBeInTheDocument();
    expect(screen.getByText('Bỏ thay đổi')).toBeInTheDocument();
    expect(screen.getByText('Ở lại chỉnh sửa')).toBeInTheDocument();
  });

  it('calls onSave when save button clicked', () => {
    const onSave = vi.fn();
    render(<UnsavedChangesDialog isOpen={true} onSave={onSave} onDiscard={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('Lưu & quay lại'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when discard button clicked', () => {
    const onDiscard = vi.fn();
    render(<UnsavedChangesDialog isOpen={true} onSave={vi.fn()} onDiscard={onDiscard} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('Bỏ thay đổi'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<UnsavedChangesDialog isOpen={true} onSave={vi.fn()} onDiscard={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Ở lại chỉnh sửa'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// --- ConfirmationModal ---
describe('ConfirmationModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ConfirmationModal isOpen={false} title="Xóa?" message="Chắc chưa?" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders danger variant by default', () => {
    render(
      <ConfirmationModal isOpen={true} title="Xóa?" message="Chắc chưa?" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByText('Xóa?')).toBeInTheDocument();
    expect(screen.getByText('Chắc chưa?')).toBeInTheDocument();
    expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    expect(screen.getByText('Hủy')).toBeInTheDocument();
  });

  it('renders warning variant', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        variant="warning"
        title="Cảnh báo"
        message="OK?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Cảnh báo')).toBeInTheDocument();
  });

  it('uses custom labels', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Title"
        message="Msg"
        confirmLabel="Đồng ý"
        cancelLabel="Không"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Đồng ý')).toBeInTheDocument();
    expect(screen.getByText('Không')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmationModal isOpen={true} title="T" message="M" onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('Xác nhận'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmationModal isOpen={true} title="T" message="M" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Hủy'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmationModal isOpen={true} title="T" message="M" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders custom icon', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="T"
        message="M"
        icon={<span data-testid="custom-icon">🎯</span>}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

// --- AppNavigation (via navigation/index.ts) ---
describe('AppNavigation', () => {
  it('BottomNavBar calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<BottomNavBar activeTab="calendar" onTabChange={onTabChange} />);
    const fitnessTab = screen.getByTestId('nav-fitness');
    fireEvent.click(fitnessTab);
    expect(onTabChange).toHaveBeenCalledWith('fitness');
  });

  it('BottomNavBar renders all navigation tabs', () => {
    const onTabChange = vi.fn();
    render(<BottomNavBar activeTab="calendar" onTabChange={onTabChange} />);
    expect(screen.getByTestId('nav-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('nav-library')).toBeInTheDocument();
    expect(screen.getByTestId('nav-ai-analysis')).toBeInTheDocument();
    expect(screen.getByTestId('nav-fitness')).toBeInTheDocument();
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
  });

  it('DesktopNav calls onTabChange when tab clicked', () => {
    const onTabChange = vi.fn();
    render(<DesktopNav activeTab="calendar" onTabChange={onTabChange} />);
    const tabs = screen.getAllByRole('tab');
    const fitnessTab = tabs.find(t => t.textContent?.includes('Tập luyện'));
    expect(fitnessTab).toBeDefined();
    if (fitnessTab) fireEvent.click(fitnessTab);
    expect(onTabChange).toHaveBeenCalledWith('fitness');
  });

  it('TabLoadingFallback renders loading state', () => {
    render(<TabLoadingFallback />);
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('getTabLabels returns correct labels', () => {
    const mockT = (key: string) => {
      const map: Record<string, string> = {
        'nav.calendar': 'Lịch',
        'nav.library': 'Thư viện',
        'nav.aiAnalysis': 'AI',
        'nav.fitness': 'Tập luyện',
        'nav.dashboard': 'Tổng quan',
      };
      return map[key] ?? key;
    };
    const labels = getTabLabels(mockT as never);
    expect(labels['calendar']).toBe('Lịch');
    expect(labels['fitness']).toBe('Tập luyện');
  });

  it('BottomNavBar shows AI badge when showAIBadge is true', () => {
    const onTabChange = vi.fn();
    render(<BottomNavBar activeTab="calendar" onTabChange={onTabChange} showAIBadge={true} />);
    const aiTab = screen.getByTestId('nav-ai-analysis');
    // The badge is a small div with bg-rose-500
    const badge = aiTab.querySelector('.bg-rose-500');
    expect(badge).toBeTruthy();
  });
});

// --- UnitSelector ---
describe('UnitSelector', () => {
  it('renders with empty value', () => {
    const onChange = vi.fn();
    render(<UnitSelector mode="single" value="" onChange={onChange} data-testid="unit" />);
    const select = screen.getByTestId('unit-select');
    expect(select).toBeInTheDocument();
  });

  it('selecting empty option emits empty string', () => {
    const onChange = vi.fn();
    render(<UnitSelector mode="single" value="g" onChange={onChange} data-testid="unit" />);
    const select = screen.getByTestId('unit-select');
    fireEvent.change(select, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('selecting "Khác..." shows custom input and emits empty', () => {
    const onChange = vi.fn();
    render(<UnitSelector mode="single" value="" onChange={onChange} data-testid="unit" />);
    const select = screen.getByTestId('unit-select');
    fireEvent.change(select, { target: { value: '__custom__' } });
    expect(screen.getByTestId('unit-custom')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('typing in custom input emits the value', () => {
    const onChange = vi.fn();
    render(<UnitSelector mode="single" value="" onChange={onChange} data-testid="unit" />);
    const select = screen.getByTestId('unit-select');
    fireEvent.change(select, { target: { value: '__custom__' } });
    const customInput = screen.getByTestId('unit-custom');
    fireEvent.change(customInput, { target: { value: 'muỗng' } });
    expect(onChange).toHaveBeenCalledWith('muỗng');
  });

  it('bilingual mode emits {vi} object', () => {
    const onChange = vi.fn();
    render(<UnitSelector mode="bilingual" value={{ vi: '' }} onChange={onChange} data-testid="unit" />);
    const select = screen.getByTestId('unit-select');
    fireEvent.change(select, { target: { value: 'g' } });
    expect(onChange).toHaveBeenCalledWith({ vi: 'g' });
  });

  it('shows custom input for unrecognized value', () => {
    const onChange = vi.fn();
    render(<UnitSelector mode="single" value="xyz_custom" onChange={onChange} data-testid="unit" />);
    expect(screen.getByTestId('unit-custom')).toBeInTheDocument();
    expect(screen.getByTestId('unit-custom')).toHaveValue('xyz_custom');
  });

  it('typing custom value in bilingual mode emits vi-only text', () => {
    const onChange = vi.fn();
    render(<UnitSelector mode="bilingual" value={{ vi: '' }} onChange={onChange} data-testid="unit" />);
    const select = screen.getByTestId('unit-select');
    fireEvent.change(select, { target: { value: '__custom__' } });
    const customInput = screen.getByTestId('unit-custom');
    fireEvent.change(customInput, { target: { value: 'tách' } });
    expect(onChange).toHaveBeenCalledWith({ vi: 'tách' });
  });
});

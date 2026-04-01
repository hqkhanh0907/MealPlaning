import { render, screen, fireEvent } from '@testing-library/react';
import { SubTabBar } from '../components/shared/SubTabBar';
import type { SubTab } from '../components/shared/SubTabBar';

const MockIcon = ({ className }: { className?: string }) => (
  <svg data-testid="mock-icon" className={className} />
);

const baseTabs: SubTab[] = [
  { id: 'meals', label: 'Meals' },
  { id: 'nutrition', label: 'Nutrition' },
];

const tabsWithIcons: SubTab[] = [
  { id: 'meals', label: 'Meals', icon: MockIcon },
  { id: 'nutrition', label: 'Nutrition', icon: MockIcon },
];

describe('SubTabBar', () => {
  it('renders all tabs with correct labels', () => {
    render(
      <SubTabBar tabs={baseTabs} activeTab="meals" onTabChange={() => {}} />,
    );
    expect(screen.getByText('Meals')).toBeInTheDocument();
    expect(screen.getByText('Nutrition')).toBeInTheDocument();
  });

  it('sets aria-selected="true" on the active tab', () => {
    render(
      <SubTabBar
        tabs={baseTabs}
        activeTab="nutrition"
        onTabChange={() => {}}
      />,
    );
    expect(screen.getByTestId('subtab-nutrition')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('subtab-meals')).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('calls onTabChange with correct id when a tab is clicked', () => {
    const onTabChange = vi.fn();
    render(
      <SubTabBar
        tabs={baseTabs}
        activeTab="meals"
        onTabChange={onTabChange}
      />,
    );
    fireEvent.click(screen.getByText('Nutrition'));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('nutrition');
  });

  it('has role="tablist" on the container', () => {
    render(
      <SubTabBar tabs={baseTabs} activeTab="meals" onTabChange={() => {}} />,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('has role="tab" on every tab button', () => {
    render(
      <SubTabBar tabs={baseTabs} activeTab="meals" onTabChange={() => {}} />,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
  });

  it('renders icons when provided', () => {
    render(
      <SubTabBar
        tabs={tabsWithIcons}
        activeTab="meals"
        onTabChange={() => {}}
      />,
    );
    const icons = screen.getAllByTestId('mock-icon');
    expect(icons).toHaveLength(2);
    icons.forEach((icon) => {
      expect(icon).toHaveClass('w-4', 'h-4');
    });
  });

  it('renders without icons when not provided', () => {
    render(
      <SubTabBar tabs={baseTabs} activeTab="meals" onTabChange={() => {}} />,
    );
    expect(screen.queryAllByTestId('mock-icon')).toHaveLength(0);
  });

  it('applies custom className to the container', () => {
    render(
      <SubTabBar
        tabs={baseTabs}
        activeTab="meals"
        onTabChange={() => {}}
        className="my-custom-class"
      />,
    );
    expect(screen.getByTestId('subtab-bar')).toHaveClass('my-custom-class');
  });

  it('handles a single tab edge case', () => {
    const singleTab: SubTab[] = [{ id: 'only', label: 'Only Tab' }];
    render(
      <SubTabBar tabs={singleTab} activeTab="only" onTabChange={() => {}} />,
    );
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.getByText('Only Tab')).toBeInTheDocument();
    expect(screen.getByTestId('subtab-only')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('handles many tabs (5+) without breaking', () => {
    const manyTabs: SubTab[] = Array.from({ length: 6 }, (_, i) => ({
      id: `tab-${i}`,
      label: `Tab ${i}`,
    }));
    render(
      <SubTabBar
        tabs={manyTabs}
        activeTab="tab-0"
        onTabChange={() => {}}
      />,
    );
    const allTabs = screen.getAllByRole('tab');
    expect(allTabs).toHaveLength(6);
    manyTabs.forEach((t) => {
      expect(screen.getByText(t.label)).toBeInTheDocument();
    });
  });

  it('sets aria-controls to tabpanel-{id} on each tab', () => {
    render(
      <SubTabBar tabs={baseTabs} activeTab="meals" onTabChange={() => {}} />,
    );
    expect(screen.getByTestId('subtab-meals')).toHaveAttribute(
      'aria-controls',
      'tabpanel-meals',
    );
    expect(screen.getByTestId('subtab-nutrition')).toHaveAttribute(
      'aria-controls',
      'tabpanel-nutrition',
    );
  });

  it('applies default empty className when none provided', () => {
    render(
      <SubTabBar tabs={baseTabs} activeTab="meals" onTabChange={() => {}} />,
    );
    const container = screen.getByTestId('subtab-bar');
    expect(container).toHaveClass('flex', 'rounded-xl');
  });

  it('mixed tabs — only tabs with icons render icon elements', () => {
    const mixedTabs: SubTab[] = [
      { id: 'with-icon', label: 'With Icon', icon: MockIcon },
      { id: 'no-icon', label: 'No Icon' },
    ];
    render(
      <SubTabBar
        tabs={mixedTabs}
        activeTab="with-icon"
        onTabChange={() => {}}
      />,
    );
    expect(screen.getAllByTestId('mock-icon')).toHaveLength(1);
    expect(screen.getByText('No Icon')).toBeInTheDocument();
  });
});

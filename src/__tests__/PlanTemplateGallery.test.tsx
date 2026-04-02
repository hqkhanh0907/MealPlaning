import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanTemplateGallery } from '../features/fitness/components/PlanTemplateGallery';
import { TemplateMatchBadge } from '../features/fitness/components/TemplateMatchBadge';
import type { TrainingProfile } from '../features/fitness/types';
import { useFitnessStore } from '../store/fitnessStore';
import { useNavigationStore } from '../store/navigationStore';

// ---------- helpers ----------

function buildProfile(overrides: Partial<TrainingProfile> = {}): TrainingProfile {
  return {
    id: 'profile-1',
    trainingGoal: 'strength',
    trainingExperience: 'beginner',
    daysPerWeek: 3,
    sessionDurationMin: 60,
    availableEquipment: ['barbell'],
    injuryRestrictions: [],
    cardioSessionsWeek: 0,
    periodizationModel: 'linear',
    planCycleWeeks: 8,
    priorityMuscles: [],
    cardioTypePref: 'mixed',
    cardioDurationMin: 20,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildPlan() {
  return {
    id: 'plan-1',
    name: 'Test Plan',
    status: 'active' as const,
    splitType: 'full_body' as const,
    durationWeeks: 8,
    currentWeek: 1,
    startDate: new Date().toISOString().split('T')[0],
    trainingDays: [1, 3, 5],
    restDays: [2, 4, 6, 7],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

afterEach(() => {
  cleanup();
  useFitnessStore.setState({
    trainingProfile: null,
    trainingPlans: [],
    trainingPlanDays: [],
  });
  useNavigationStore.setState({ pageStack: [] });
});

// ---------- TemplateMatchBadge tests ----------

describe('TemplateMatchBadge', () => {
  it('renders score as percentage text', () => {
    render(<TemplateMatchBadge score={85} />);
    expect(screen.getByTestId('template-match-badge')).toHaveTextContent('85%');
  });

  it('shows green styling for score >= 80', () => {
    render(<TemplateMatchBadge score={80} />);
    const badge = screen.getByTestId('template-match-badge');
    expect(badge.className).toContain('primary');
  });

  it('shows amber styling for score >= 60 and < 80', () => {
    render(<TemplateMatchBadge score={65} />);
    const badge = screen.getByTestId('template-match-badge');
    expect(badge.className).toContain('amber');
  });

  it('shows gray styling for score < 60', () => {
    render(<TemplateMatchBadge score={40} />);
    const badge = screen.getByTestId('template-match-badge');
    expect(badge.className).toContain('muted');
    expect(badge.className).not.toContain('primary');
    expect(badge.className).not.toContain('amber');
  });

  it('clamps score to 0-100 range', () => {
    render(<TemplateMatchBadge score={150} />);
    expect(screen.getByTestId('template-match-badge')).toHaveTextContent('100%');
  });

  it('has aria-label with score', () => {
    render(<TemplateMatchBadge score={72} />);
    const badge = screen.getByTestId('template-match-badge');
    expect(badge).toHaveAttribute('aria-label', expect.stringContaining('72'));
  });

  it('uses tabular-nums font variant', () => {
    render(<TemplateMatchBadge score={50} />);
    const badge = screen.getByTestId('template-match-badge');
    expect(badge.className).toContain('tabular-nums');
  });
});

// ---------- PlanTemplateGallery tests ----------

describe('PlanTemplateGallery', () => {
  beforeEach(() => {
    useFitnessStore.setState({
      trainingProfile: buildProfile(),
      trainingPlans: [buildPlan()],
    });
  });

  it('renders loading state initially then shows content', async () => {
    render(<PlanTemplateGallery planId="plan-1" />);
    // After templates load, we should see the gallery title
    await waitFor(() => {
      expect(screen.getByText('Thư viện mẫu kế hoạch')).toBeInTheDocument();
    });
  });

  it('renders recommended templates section when profile exists', async () => {
    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('recommended-section')).toBeInTheDocument();
    });
    expect(screen.getByText('Đề xuất cho bạn')).toBeInTheDocument();
  });

  it('renders all templates section grouped by split type', async () => {
    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('all-templates-section')).toBeInTheDocument();
    });
    expect(screen.getByText('Tất cả mẫu')).toBeInTheDocument();
    // Should show split group with correct data-testid
    expect(screen.getByTestId('split-group-full_body')).toBeInTheDocument();
  });

  it('template card shows name, description, and equipment', async () => {
    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('all-templates-section')).toBeInTheDocument();
    });
    // PPL Classic template should be visible
    expect(screen.getByText('PPL Classic')).toBeInTheDocument();
    // Check days/week displayed
    const daysLabels = screen.getAllByText(/ngày\/tuần/);
    expect(daysLabels.length).toBeGreaterThan(0);
    // Equipment labels should be English via EQUIPMENT_DISPLAY constant
    expect(screen.getAllByText('Barbell').length).toBeGreaterThan(0);
  });

  it('shows TemplateMatchBadge on recommended templates', async () => {
    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('recommended-section')).toBeInTheDocument();
    });
    const badges = screen.getAllByTestId('template-match-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('shows confirmation dialog when tapping a template card', async () => {
    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      const cards = screen.getAllByTestId('template-card-starting_strength');
      expect(cards.length).toBeGreaterThan(0);
    });
    const cards = screen.getAllByTestId('template-card-starting_strength');
    fireEvent.click(cards[0]);
    await waitFor(() => {
      expect(screen.getByText('Plan hiện tại sẽ bị thay thế. Bạn có chắc không?')).toBeInTheDocument();
    });
  });

  it('renders save current plan button', async () => {
    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('save-as-template-btn')).toBeInTheDocument();
    });
    expect(screen.getByText('Lưu plan hiện tại làm mẫu')).toBeInTheDocument();
  });

  it('opens save dialog when save button is clicked', async () => {
    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('save-as-template-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('save-as-template-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('save-template-dialog')).toBeInTheDocument();
    });
    expect(screen.getByTestId('save-template-input')).toBeInTheDocument();
  });

  it('shows empty state with retry when no templates', async () => {
    // Override getTemplates to return empty array
    const originalGetTemplates = useFitnessStore.getState().getTemplates;
    useFitnessStore.setState({
      getTemplates: () => [],
      getRecommendedTemplates: () => [],
    });

    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('template-empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText('Không tải được mẫu')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();

    // Restore
    useFitnessStore.setState({ getTemplates: originalGetTemplates });
  });

  it('back button calls popPage', async () => {
    const popPageSpy = vi.fn();
    useNavigationStore.setState({ popPage: popPageSpy });

    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('back-button'));
    expect(popPageSpy).toHaveBeenCalled();
  });

  it('has split group sections with correct data-testid', async () => {
    render(<PlanTemplateGallery planId="plan-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('all-templates-section')).toBeInTheDocument();
    });
    // Built-in templates include full_body, ppl, upper_lower, bro_split
    expect(screen.getByTestId('split-group-full_body')).toBeInTheDocument();
    expect(screen.getByTestId('split-group-upper_lower')).toBeInTheDocument();
    expect(screen.getByTestId('split-group-ppl')).toBeInTheDocument();
    expect(screen.getByTestId('split-group-bro_split')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisResultView } from '../components/AnalysisResultView';
import { AnalyzedDishResult } from '../types';

const mockResult: AnalyzedDishResult = {
  name: 'Phở bò',
  description: 'Món phở bò Hà Nội truyền thống',
  totalNutrition: { calories: 500, protein: 30, carbs: 60, fat: 15 },
  ingredients: [
    {
      name: 'Bánh phở',
      amount: 200,
      unit: 'g',
      nutritionPerStandardUnit: { calories: 130, protein: 3, carbs: 25, fat: 1, fiber: 0.5 },
    },
    {
      name: 'Thịt bò',
      amount: 100,
      unit: 'g',
      nutritionPerStandardUnit: { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 },
    },
  ],
};

describe('AnalysisResultView', () => {
  it('shows skeleton loading state when isAnalyzing is true', () => {
    render(<AnalysisResultView result={null} isAnalyzing={true} />);
    expect(screen.getByText('AI đang phân tích hình ảnh...')).toBeInTheDocument();
  });

  it('shows empty state when no result and not analyzing', () => {
    render(<AnalysisResultView result={null} isAnalyzing={false} />);
    expect(screen.getByText(/Tải ảnh lên và nhấn/)).toBeInTheDocument();
  });

  it('renders dish name and description when result is provided', () => {
    render(<AnalysisResultView result={mockResult} isAnalyzing={false} />);
    expect(screen.getByText('Phở bò')).toBeInTheDocument();
    expect(screen.getByText('Món phở bò Hà Nội truyền thống')).toBeInTheDocument();
  });

  it('renders nutrition cards with total values', () => {
    render(<AnalysisResultView result={mockResult} isAnalyzing={false} />);
    expect(screen.getByText('Ước tính Calo')).toBeInTheDocument();
    expect(screen.getByText('Ước tính Protein')).toBeInTheDocument();
    expect(screen.getByText('Ước tính Carbs')).toBeInTheDocument();
    expect(screen.getByText('Ước tính Fat')).toBeInTheDocument();
  });

  it('renders ingredient details', () => {
    render(<AnalysisResultView result={mockResult} isAnalyzing={false} />);
    expect(screen.getByText('Chi tiết nguyên liệu & Dinh dưỡng:')).toBeInTheDocument();
    // Both ingredients should appear — getText handles table/card views
    expect(screen.getAllByText('Bánh phở').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Thịt bò').length).toBeGreaterThan(0);
  });

  it('shows note section', () => {
    render(<AnalysisResultView result={mockResult} isAnalyzing={false} />);
    expect(screen.getByText('Lưu ý:')).toBeInTheDocument();
    expect(screen.getByText(/Kết quả phân tích chỉ mang tính chất tham khảo/)).toBeInTheDocument();
  });

  it('shows save button when onOpenSaveModal is provided', () => {
    const onOpen = vi.fn();
    render(<AnalysisResultView result={mockResult} isAnalyzing={false} onOpenSaveModal={onOpen} />);
    const saveBtn = screen.getByText('Lưu vào thư viện món ăn');
    expect(saveBtn).toBeInTheDocument();
    fireEvent.click(saveBtn);
    expect(onOpen).toHaveBeenCalled();
  });

  it('does not show save button when onOpenSaveModal is undefined', () => {
    render(<AnalysisResultView result={mockResult} isAnalyzing={false} />);
    expect(screen.queryByText('Lưu vào thư viện món ăn')).not.toBeInTheDocument();
  });
});

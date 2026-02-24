import React from 'react';
import { X, Utensils } from 'lucide-react';
import { MealType, DayPlan } from '../../types';

interface TypeSelectionModalProps {
  currentPlan: DayPlan;
  onSelectType: (type: MealType) => void;
  onClose: () => void;
}

const ModalBackdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
    <button type="button" aria-label="Close modal" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} tabIndex={-1} />
    {children}
  </div>
);

const MEAL_OPTIONS: { type: MealType; planKey: keyof DayPlan; label: string; desc: string; colorClass: string }[] = [
  { type: 'breakfast', planKey: 'breakfastId', label: 'Bữa Sáng', desc: 'Bắt đầu ngày mới đầy năng lượng', colorClass: 'bg-amber-100 text-amber-600' },
  { type: 'lunch', planKey: 'lunchId', label: 'Bữa Trưa', desc: 'Nạp lại năng lượng cho buổi chiều', colorClass: 'bg-blue-100 text-blue-600' },
  { type: 'dinner', planKey: 'dinnerId', label: 'Bữa Tối', desc: 'Bữa ăn nhẹ nhàng, dễ tiêu hóa', colorClass: 'bg-indigo-100 text-indigo-600' },
];

export const TypeSelectionModal: React.FC<TypeSelectionModalProps> = ({ currentPlan, onSelectType, onClose }) => {
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[90vh] sm:mx-4">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Lên kế hoạch</h3>
            <p className="text-sm text-slate-500">Chọn buổi bạn muốn lên kế hoạch</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          {MEAL_OPTIONS.map(({ type, planKey, label, desc, colorClass }) => {
            const isPlanned = Boolean(currentPlan[planKey]);
            return (
              <button
                key={type}
                onClick={() => onSelectType(type)}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group min-h-16 active:scale-[0.98] ${isPlanned ? 'border-emerald-500 bg-white' : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-lg ${isPlanned ? 'text-emerald-900' : 'text-slate-800'}`}>{label}</p>
                    <p className={`text-sm ${isPlanned ? 'text-emerald-600' : 'text-slate-500'}`}>{desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ModalBackdrop>
  );
};


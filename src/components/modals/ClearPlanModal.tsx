import React from 'react';
import { X, CalendarDays } from 'lucide-react';

interface ClearPlanModalProps {
  onClear: (scope: 'day' | 'week' | 'month') => void;
  onClose: () => void;
}

const ModalBackdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
    <button type="button" aria-label="Close modal" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} tabIndex={-1} />
    {children}
  </div>
);

const SCOPE_OPTIONS: { scope: 'day' | 'week' | 'month'; label: string; desc: string }[] = [
  { scope: 'day', label: 'Ngày này', desc: 'Xóa kế hoạch của ngày đang chọn' },
  { scope: 'week', label: 'Tuần này', desc: 'Xóa kế hoạch của tuần hiện tại' },
  { scope: 'month', label: 'Tháng này', desc: 'Xóa kế hoạch của tháng hiện tại' },
];

export const ClearPlanModal: React.FC<ClearPlanModalProps> = ({ onClear, onClose }) => {
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col sm:mx-4">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Xóa kế hoạch</h3>
            <p className="text-sm text-slate-500">Chọn phạm vi thời gian muốn xóa</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          {SCOPE_OPTIONS.map(({ scope, label, desc }) => (
            <button
              key={scope}
              onClick={() => onClear(scope)}
              className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 active:scale-[0.98] transition-all flex items-center gap-4 group min-h-16"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-lg group-hover:text-rose-700">{label}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ModalBackdrop>
  );
};


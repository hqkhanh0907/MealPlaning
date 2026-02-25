import React from 'react';
import { X, Target } from 'lucide-react';
import { UserProfile } from '../../types';

interface GoalSettingsModalProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

const ModalBackdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-80">
    <button type="button" aria-label="Close modal" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} tabIndex={-1} />
    {children}
  </div>
);

const PROTEIN_PRESETS = [1.2, 1.6, 2, 2.2];

export const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({ userProfile, onUpdateProfile, onClose }) => {
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[90vh] sm:mx-4">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Mục tiêu dinh dưỡng</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="goal-weight" className="block text-sm font-bold text-slate-700 mb-2">Cân nặng hiện tại (kg)</label>
            <div className="relative">
              <input
                id="goal-weight"
                type="number" min="1" max="500"
                value={userProfile.weight}
                onChange={(e) => onUpdateProfile({ ...userProfile, weight: Math.max(1, Number(e.target.value) || 1) })}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-base sm:text-lg text-slate-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">kg</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="goal-protein" className="block text-sm font-bold text-slate-700">Lượng Protein mong muốn</label>
              <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                {Math.round(userProfile.weight * userProfile.proteinRatio)}g / ngày
              </span>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="goal-protein"
                  type="number" step="0.1" min="0.1" max="5"
                  value={userProfile.proteinRatio}
                  onChange={(e) => onUpdateProfile({ ...userProfile, proteinRatio: Math.max(0.1, Number(e.target.value) || 0.1) })}
                  className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-lg text-slate-800"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">g / kg</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROTEIN_PRESETS.map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => onUpdateProfile({ ...userProfile, proteinRatio: ratio })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${userProfile.proteinRatio === ratio ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}
                  >
                    {ratio}g
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Khuyến nghị: 1.2-1.6g cho người vận động nhẹ, 1.6-2.2g cho người tập luyện/tăng cơ.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="goal-calories" className="block text-sm font-bold text-slate-700 mb-2">Mục tiêu Calo (kcal)</label>
            <div className="relative">
              <input
                id="goal-calories"
                type="number" min="100" max="10000"
                value={userProfile.targetCalories}
                onChange={(e) => onUpdateProfile({ ...userProfile, targetCalories: Math.max(100, Number(e.target.value) || 100) })}
                className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-lg text-slate-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">kcal</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">Thay đổi được tự động lưu ngay lập tức</p>

          <button
            onClick={onClose}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 active:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 mt-2 min-h-12"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};


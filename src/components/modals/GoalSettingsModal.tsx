import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Target } from 'lucide-react';
import { UserProfile } from '../../types';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface GoalSettingsModalProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

const PROTEIN_PRESETS = [1, 2, 3, 4];

export const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({ userProfile, onUpdateProfile, onClose }) => {
  const { t } = useTranslation();
  useModalBackHandler(true, onClose);

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-80">
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[90dvh] sm:mx-4">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('goalSettings.title')}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="goal-weight" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('goalSettings.weight')}</label>
            <div className="relative">
              <input
                id="goal-weight"
                type="number" min="1" max="500" step="1" inputMode="numeric"
                value={userProfile.weight}
                onChange={(e) => onUpdateProfile({ ...userProfile, weight: Math.max(1, Math.round(Number(e.target.value)) || 1) })}
                data-testid="input-goal-weight"
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">kg</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="goal-protein" className="block text-sm font-bold text-slate-700 dark:text-slate-300">{t('goalSettings.proteinGoal')}</label>
              <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                {Math.round(userProfile.weight * userProfile.proteinRatio)}{t('goalSettings.perDay')}
              </span>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="goal-protein"
                  type="number" step="0.1" min="1" max="5" inputMode="decimal"
                  value={userProfile.proteinRatio}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    const rounded = Math.round(Math.max(1, raw || 1) * 10) / 10;
                    onUpdateProfile({ ...userProfile, proteinRatio: rounded });
                  }}
                  data-testid="input-goal-protein"
                  className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none font-bold text-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">{t('goalSettings.perKg')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROTEIN_PRESETS.map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => onUpdateProfile({ ...userProfile, proteinRatio: ratio })}
                    data-testid={`btn-preset-${ratio}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${userProfile.proteinRatio === ratio ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-blue-300'}`}
                  >
                    {ratio}g
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('goalSettings.recommendation')}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="goal-calories" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('goalSettings.caloriesGoal')}</label>
            <div className="relative">
              <input
                id="goal-calories"
                type="number" min="100" max="10000" step="1" inputMode="numeric"
                value={userProfile.targetCalories}
                onChange={(e) => onUpdateProfile({ ...userProfile, targetCalories: Math.max(100, Math.round(Number(e.target.value)) || 100) })}
                data-testid="input-goal-calories"
                className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none font-bold text-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">kcal</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">{t('goalSettings.autoSaveHint')}</p>

          <button
            onClick={onClose}
            data-testid="btn-goal-done"
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 active:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 mt-2 min-h-12"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

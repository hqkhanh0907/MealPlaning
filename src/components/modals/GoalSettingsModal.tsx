import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Target, Zap } from 'lucide-react';
import { UserProfile } from '../../types';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface GoalSettingsModalProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

const PROTEIN_PRESETS = [1, 2, 3, 4];

interface GoalPreset {
  labelKey: string;
  emoji: string;
  calories: number;
  proteinRatio: number;
}

const GOAL_PRESETS: GoalPreset[] = [
  { labelKey: 'goalSettings.presetBalanced', emoji: '⚖️', calories: 2000, proteinRatio: 1.6 },
  { labelKey: 'goalSettings.presetHighProtein', emoji: '💪', calories: 2200, proteinRatio: 2.5 },
  { labelKey: 'goalSettings.presetLowCarb', emoji: '🥑', calories: 1600, proteinRatio: 2 },
  { labelKey: 'goalSettings.presetLightDiet', emoji: '🥗', calories: 1400, proteinRatio: 1.2 },
];

export const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({ userProfile, onUpdateProfile, onClose }) => {
  const { t } = useTranslation();
  useModalBackHandler(true, onClose);

  // String state for numeric inputs to allow clearing without snap-back on mobile
  const [weightStr, setWeightStr] = useState(() => String(userProfile.weight));
  const [proteinStr, setProteinStr] = useState(() => String(userProfile.proteinRatio));
  const [caloriesStr, setCaloriesStr] = useState(() => String(userProfile.targetCalories));

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

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Goal Presets */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('goalSettings.presets')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_PRESETS.map((preset) => {
                const isActive = userProfile.targetCalories === preset.calories && userProfile.proteinRatio === preset.proteinRatio;
                return (
                  <button
                    key={preset.labelKey}
                    onClick={() => {
                      const rounded = Math.round(preset.proteinRatio * 10) / 10;
                      onUpdateProfile({ ...userProfile, targetCalories: preset.calories, proteinRatio: rounded });
                      setCaloriesStr(String(preset.calories));
                      setProteinStr(String(rounded));
                    }}
                    data-testid={`btn-goal-preset-${preset.calories}`}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <span className="text-lg">{preset.emoji}</span>
                    <div>
                      <p className={`text-sm font-bold ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>{t(preset.labelKey)}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{preset.calories} kcal · {preset.proteinRatio}g/kg</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label htmlFor="goal-weight" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('goalSettings.weight')}</label>
            <div className="relative">
              <input
                id="goal-weight"
                type="number" min="1" max="500" step="1" inputMode="numeric"
                value={weightStr}
                onChange={(e) => { const v = e.target.value; setWeightStr(v); const n = Math.round(Number.parseFloat(v)); if (!Number.isNaN(n) && n >= 1) onUpdateProfile({ ...userProfile, weight: n }); }}
                onBlur={() => { if (weightStr.trim() === '' || Number.isNaN(Number.parseFloat(weightStr))) setWeightStr(String(userProfile.weight)); }}
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
                  value={proteinStr}
                  onChange={(e) => { const v = e.target.value; setProteinStr(v); const raw = Number.parseFloat(v); if (!Number.isNaN(raw) && raw >= 0.1) { const rounded = Math.round(Math.max(1, raw) * 10) / 10; onUpdateProfile({ ...userProfile, proteinRatio: rounded }); } }}
                  onBlur={() => { if (proteinStr.trim() === '' || Number.isNaN(Number.parseFloat(proteinStr))) setProteinStr(String(userProfile.proteinRatio)); }}
                  data-testid="input-goal-protein"
                  className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none font-bold text-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">{t('goalSettings.perKg')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROTEIN_PRESETS.map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => { onUpdateProfile({ ...userProfile, proteinRatio: ratio }); setProteinStr(String(ratio)); }}
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
                value={caloriesStr}
                onChange={(e) => { const v = e.target.value; setCaloriesStr(v); const n = Math.round(Number.parseFloat(v)); if (!Number.isNaN(n) && n >= 100) onUpdateProfile({ ...userProfile, targetCalories: n }); }}
                onBlur={() => { if (caloriesStr.trim() === '' || Number.isNaN(Number.parseFloat(caloriesStr))) setCaloriesStr(String(userProfile.targetCalories)); }}
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

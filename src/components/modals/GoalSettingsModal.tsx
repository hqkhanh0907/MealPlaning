import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Target, Zap, Scale, Dumbbell, Leaf, Salad } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface GoalProfile {
  weight: number;
  proteinRatio: number;
  targetCalories: number;
}

interface GoalSettingsModalProps {
  userProfile: GoalProfile;
  onUpdateProfile: (profile: GoalProfile) => void;
  onClose: () => void;
}

const PROTEIN_PRESETS = [1, 2, 3, 4];

interface GoalPreset {
  labelKey: string;
  icon: LucideIcon;
  calories: number;
  proteinRatio: number;
}

const goalSettingsSchema = z.object({
  weight: z.number().min(20).max(300),
  proteinRatio: z.number().min(0.5).max(5),
  targetCalories: z.number().min(800).max(10000),
});

const GOAL_PRESETS: GoalPreset[] = [
  { labelKey: 'goalSettings.presetBalanced', icon: Scale, calories: 2000, proteinRatio: 1.6 },
  { labelKey: 'goalSettings.presetHighProtein', icon: Dumbbell, calories: 2200, proteinRatio: 2.5 },
  { labelKey: 'goalSettings.presetLowCarb', icon: Leaf, calories: 1600, proteinRatio: 2 },
  { labelKey: 'goalSettings.presetLightDiet', icon: Salad, calories: 1400, proteinRatio: 1.2 },
];

export const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({ userProfile, onUpdateProfile, onClose }) => {
  const { t } = useTranslation();
  useModalBackHandler(true, onClose);

  // String state for numeric inputs to allow clearing without snap-back on mobile
  const [weightStr, setWeightStr] = useState(() => String(userProfile.weight));
  const [proteinStr, setProteinStr] = useState(() => String(userProfile.proteinRatio));
  const [caloriesStr, setCaloriesStr] = useState(() => String(userProfile.targetCalories));

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const validateField = useCallback(
    (field: keyof z.infer<typeof goalSettingsSchema>, value: number): string | undefined => {
      const result = goalSettingsSchema.shape[field].safeParse(value);
      return result.success ? undefined : t('goalSettings.invalidValue');
    },
    [t],
  );

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
          <button onClick={onClose} aria-label={t('common.closeDialog')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all">
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
                    <span className="text-lg"><preset.icon className="size-5" aria-hidden="true" /></span>
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
              <Input
                id="goal-weight"
                type="number" min="20" max="300" step="1" inputMode="numeric"
                autoComplete="off"
                value={weightStr}
                onChange={(e) => {
                  const v = e.target.value;
                  setWeightStr(v);
                  const n = Math.round(Number.parseFloat(v));
                  if (Number.isNaN(n)) { setFieldErrors(prev => ({ ...prev, weight: undefined })); return; }
                  const err = validateField('weight', n);
                  setFieldErrors(prev => ({ ...prev, weight: err }));
                  if (!err) onUpdateProfile({ ...userProfile, weight: n });
                }}
                onBlur={() => { if (weightStr.trim() !== '' && !Number.isNaN(Number.parseFloat(weightStr))) { const n = Math.round(Number.parseFloat(weightStr)); const err = validateField('weight', n); setFieldErrors(prev => ({ ...prev, weight: err })); } }}
                data-testid="input-goal-weight"
                aria-invalid={!!fieldErrors.weight}
                className={`w-full pl-4 pr-12 font-bold text-lg text-slate-800 ${fieldErrors.weight ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">kg</span>
            </div>
            {fieldErrors.weight && <p data-testid="error-goal-weight" className="text-xs text-red-500 mt-1">{fieldErrors.weight}</p>}
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
                <Input
                  id="goal-protein"
                  type="number" step="0.1" min="0.5" max="5" inputMode="decimal"
                  autoComplete="off"
                  value={proteinStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    setProteinStr(v);
                    const raw = Number.parseFloat(v);
                    if (Number.isNaN(raw)) { setFieldErrors(prev => ({ ...prev, proteinRatio: undefined })); return; }
                    const rounded = Math.round(raw * 10) / 10;
                    const err = validateField('proteinRatio', rounded);
                    setFieldErrors(prev => ({ ...prev, proteinRatio: err }));
                    if (!err) onUpdateProfile({ ...userProfile, proteinRatio: rounded });
                  }}
                  onBlur={() => { if (proteinStr.trim() !== '' && !Number.isNaN(Number.parseFloat(proteinStr))) { const raw = Number.parseFloat(proteinStr); const rounded = Math.round(raw * 10) / 10; const err = validateField('proteinRatio', rounded); setFieldErrors(prev => ({ ...prev, proteinRatio: err })); } }}
                  data-testid="input-goal-protein"
                  aria-invalid={!!fieldErrors.proteinRatio}
                  className={`w-full pl-4 pr-16 font-bold text-lg text-slate-800 ${fieldErrors.proteinRatio ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">{t('goalSettings.perKg')}</span>
              </div>
              {fieldErrors.proteinRatio && <p data-testid="error-goal-protein" className="text-xs text-red-500 mt-1">{fieldErrors.proteinRatio}</p>}
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
              <Input
                id="goal-calories"
                type="number" min="800" max="10000" step="1" inputMode="numeric"
                autoComplete="off"
                value={caloriesStr}
                onChange={(e) => {
                  const v = e.target.value;
                  setCaloriesStr(v);
                  const n = Math.round(Number.parseFloat(v));
                  if (Number.isNaN(n)) { setFieldErrors(prev => ({ ...prev, targetCalories: undefined })); return; }
                  const err = validateField('targetCalories', n);
                  setFieldErrors(prev => ({ ...prev, targetCalories: err }));
                  if (!err) onUpdateProfile({ ...userProfile, targetCalories: n });
                }}
                onBlur={() => { if (caloriesStr.trim() !== '' && !Number.isNaN(Number.parseFloat(caloriesStr))) { const n = Math.round(Number.parseFloat(caloriesStr)); const err = validateField('targetCalories', n); setFieldErrors(prev => ({ ...prev, targetCalories: err })); } }}
                data-testid="input-goal-calories"
                aria-invalid={!!fieldErrors.targetCalories}
                className={`w-full pl-4 pr-16 font-bold text-lg text-slate-800 ${fieldErrors.targetCalories ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">kcal</span>
            </div>
            {fieldErrors.targetCalories && <p data-testid="error-goal-calories" className="text-xs text-red-500 mt-1">{fieldErrors.targetCalories}</p>}
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

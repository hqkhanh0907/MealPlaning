import type { LucideIcon } from 'lucide-react';
import { Dumbbell, Leaf, Salad, Scale, Target, X, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export const GoalSettingsModal = ({ userProfile, onUpdateProfile, onClose }: GoalSettingsModalProps) => {
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
      <div className="bg-card relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl">
        <div className="border-border-subtle flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-foreground text-lg font-bold">{t('goalSettings.title')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="text-muted-foreground hover:bg-accent rounded-full p-2 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6">
          {/* Goal Presets */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-foreground text-sm font-semibold">{t('goalSettings.presets')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_PRESETS.map(preset => {
                const isActive =
                  userProfile.targetCalories === preset.calories && userProfile.proteinRatio === preset.proteinRatio;
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
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                      isActive ? 'border-primary bg-primary-subtle' : 'border-border hover:border-ring/30'
                    }`}
                  >
                    <span className="text-lg">
                      <preset.icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${isActive ? 'text-primary-emphasis' : 'text-foreground'}`}>
                        {t(preset.labelKey)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {preset.calories} kcal · {preset.proteinRatio}g/kg
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label htmlFor="goal-weight" className="text-foreground mb-2 block text-sm font-semibold">
              {t('goalSettings.weight')}
            </label>
            <div className="relative">
              <Input
                id="goal-weight"
                type="number"
                min="20"
                max="300"
                step="1"
                inputMode="numeric"
                autoComplete="off"
                value={weightStr}
                onChange={e => {
                  const v = e.target.value;
                  setWeightStr(v);
                  const n = Math.round(Number.parseFloat(v));
                  if (Number.isNaN(n)) {
                    setFieldErrors(prev => ({ ...prev, weight: undefined }));
                    return;
                  }
                  const err = validateField('weight', n);
                  setFieldErrors(prev => ({ ...prev, weight: err }));
                  if (!err) onUpdateProfile({ ...userProfile, weight: n });
                }}
                onBlur={() => {
                  if (weightStr.trim() !== '' && !Number.isNaN(Number.parseFloat(weightStr))) {
                    const n = Math.round(Number.parseFloat(weightStr));
                    const err = validateField('weight', n);
                    setFieldErrors(prev => ({ ...prev, weight: err }));
                  }
                }}
                data-testid="input-goal-weight"
                aria-invalid={!!fieldErrors.weight}
                className={`text-foreground w-full pr-12 pl-4 text-lg font-bold ${fieldErrors.weight ? 'border-destructive focus:ring-destructive' : ''}`}
              />
              <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 font-medium">kg</span>
            </div>
            {fieldErrors.weight && (
              <p data-testid="error-goal-weight" className="text-destructive mt-1 text-xs">
                {fieldErrors.weight}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="goal-protein" className="text-foreground block text-sm font-semibold">
                {t('goalSettings.proteinGoal')}
              </label>
              <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {Math.round(userProfile.weight * userProfile.proteinRatio)}
                {t('goalSettings.perDay')}
              </span>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  id="goal-protein"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5"
                  inputMode="decimal"
                  autoComplete="off"
                  value={proteinStr}
                  onChange={e => {
                    const v = e.target.value;
                    setProteinStr(v);
                    const raw = Number.parseFloat(v);
                    if (Number.isNaN(raw)) {
                      setFieldErrors(prev => ({ ...prev, proteinRatio: undefined }));
                      return;
                    }
                    const rounded = Math.round(raw * 10) / 10;
                    const err = validateField('proteinRatio', rounded);
                    setFieldErrors(prev => ({ ...prev, proteinRatio: err }));
                    if (!err) onUpdateProfile({ ...userProfile, proteinRatio: rounded });
                  }}
                  onBlur={() => {
                    if (proteinStr.trim() !== '' && !Number.isNaN(Number.parseFloat(proteinStr))) {
                      const raw = Number.parseFloat(proteinStr);
                      const rounded = Math.round(raw * 10) / 10;
                      const err = validateField('proteinRatio', rounded);
                      setFieldErrors(prev => ({ ...prev, proteinRatio: err }));
                    }
                  }}
                  data-testid="input-goal-protein"
                  aria-invalid={!!fieldErrors.proteinRatio}
                  className={`text-foreground w-full pr-16 pl-4 text-lg font-bold ${fieldErrors.proteinRatio ? 'border-destructive focus:ring-destructive' : ''}`}
                />
                <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 font-medium">
                  {t('goalSettings.perKg')}
                </span>
              </div>
              {fieldErrors.proteinRatio && (
                <p data-testid="error-goal-protein" className="text-destructive mt-1 text-xs">
                  {fieldErrors.proteinRatio}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {PROTEIN_PRESETS.map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => {
                      onUpdateProfile({ ...userProfile, proteinRatio: ratio });
                      setProteinStr(String(ratio));
                    }}
                    data-testid={`btn-preset-${ratio}`}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${userProfile.proteinRatio === ratio ? 'border-blue-500 bg-blue-500 text-white' : 'text-muted-foreground border-border bg-card hover:border-blue-300'}`}
                  >
                    {ratio}g
                  </button>
                ))}
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{t('goalSettings.recommendation')}</p>
            </div>
          </div>

          <div>
            <label htmlFor="goal-calories" className="text-foreground mb-2 block text-sm font-semibold">
              {t('goalSettings.caloriesGoal')}
            </label>
            <div className="relative">
              <Input
                id="goal-calories"
                type="number"
                min="800"
                max="10000"
                step="1"
                inputMode="numeric"
                autoComplete="off"
                value={caloriesStr}
                onChange={e => {
                  const v = e.target.value;
                  setCaloriesStr(v);
                  const n = Math.round(Number.parseFloat(v));
                  if (Number.isNaN(n)) {
                    setFieldErrors(prev => ({ ...prev, targetCalories: undefined }));
                    return;
                  }
                  const err = validateField('targetCalories', n);
                  setFieldErrors(prev => ({ ...prev, targetCalories: err }));
                  if (!err) onUpdateProfile({ ...userProfile, targetCalories: n });
                }}
                onBlur={() => {
                  if (caloriesStr.trim() !== '' && !Number.isNaN(Number.parseFloat(caloriesStr))) {
                    const n = Math.round(Number.parseFloat(caloriesStr));
                    const err = validateField('targetCalories', n);
                    setFieldErrors(prev => ({ ...prev, targetCalories: err }));
                  }
                }}
                data-testid="input-goal-calories"
                aria-invalid={!!fieldErrors.targetCalories}
                className={`text-foreground w-full pr-16 pl-4 text-lg font-bold ${fieldErrors.targetCalories ? 'border-destructive focus:ring-destructive' : ''}`}
              />
              <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 font-medium">kcal</span>
            </div>
            {fieldErrors.targetCalories && (
              <p data-testid="error-goal-calories" className="text-destructive mt-1 text-xs">
                {fieldErrors.targetCalories}
              </p>
            )}
          </div>

          <p className="text-muted-foreground text-center text-xs">{t('goalSettings.autoSaveHint')}</p>

          <button
            onClick={onClose}
            data-testid="btn-goal-done"
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary active:bg-primary/80 mt-2 min-h-12 w-full rounded-xl py-3 font-bold shadow-sm transition-all"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

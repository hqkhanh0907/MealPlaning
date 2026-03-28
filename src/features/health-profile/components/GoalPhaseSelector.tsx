import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingDown, TrendingUp, Equal, Check } from 'lucide-react';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useHealthProfileStore } from '../store/healthProfileStore';
import { getCalorieOffset } from '../../../services/nutritionEngine';
import type { GoalType, RateOfChange, Goal } from '../types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const GOAL_OPTIONS: {
  type: GoalType;
  labelKey: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    type: 'cut',
    labelKey: 'goal.cut',
    icon: TrendingDown,
    color: 'text-amber-500 dark:text-amber-400',
    activeBg: 'bg-amber-50 dark:bg-amber-900/20',
    activeBorder: 'border-amber-500',
    activeText: 'text-amber-700 dark:text-amber-300',
  },
  {
    type: 'maintain',
    labelKey: 'goal.maintain',
    icon: Equal,
    color: 'text-emerald-500 dark:text-emerald-400',
    activeBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    activeBorder: 'border-emerald-500',
    activeText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    type: 'bulk',
    labelKey: 'goal.bulk',
    icon: TrendingUp,
    color: 'text-blue-500 dark:text-blue-400',
    activeBg: 'bg-blue-50 dark:bg-blue-900/20',
    activeBorder: 'border-blue-500',
    activeText: 'text-blue-700 dark:text-blue-300',
  },
];

const RATE_OPTIONS: { rate: RateOfChange; labelKey: string }[] = [
  { rate: 'conservative', labelKey: 'goal.conservative' },
  { rate: 'moderate', labelKey: 'goal.moderate' },
  { rate: 'aggressive', labelKey: 'goal.aggressive' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatOffset(offset: number): string {
  if (offset > 0) return `+${offset} kcal`;
  if (offset < 0) return `${offset} kcal`;
  return '±0 kcal';
}

function generateId(): string {
  return `goal-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface GoalPhaseSelectorProps {
  embedded?: boolean;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export const GoalPhaseSelector: React.FC<GoalPhaseSelectorProps> = ({ embedded, saveRef } = {}) => {
  const { t } = useTranslation();
  const db = useDatabase();
  const saveGoal = useHealthProfileStore((s) => s.saveGoal);

  const [goalType, setGoalType] = useState<GoalType>('maintain');
  const [rateOfChange, setRateOfChange] = useState<RateOfChange>('moderate');
  const [targetWeight, setTargetWeight] = useState('');
  const [manualOverride, setManualOverride] = useState(false);
  const [customOffset, setCustomOffset] = useState('');
  const [saved, setSaved] = useState(false);

  const autoOffset = useMemo(
    () => getCalorieOffset(goalType, rateOfChange),
    [goalType, rateOfChange],
  );

  const effectiveOffset = manualOverride
    ? Math.round(Number(customOffset)) || 0
    : autoOffset;

  const handleGoalTypeChange = useCallback((type: GoalType) => {
    setGoalType(type);
    setSaved(false);
  }, []);

  const handleRateChange = useCallback((rate: RateOfChange) => {
    setRateOfChange(rate);
    setSaved(false);
  }, []);

  const handleTargetWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || /^\d*\.?\d*$/.test(val)) {
        setTargetWeight(val);
        setSaved(false);
      }
    },
    [],
  );

  const handleCustomOffsetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || val === '-' || /^-?\d*$/.test(val)) {
        setCustomOffset(val);
        setSaved(false);
      }
    },
    [],
  );

  const handleToggleOverride = useCallback(() => {
    setManualOverride((prev) => {
      if (!prev) {
        setCustomOffset(String(autoOffset));
      }
      return !prev;
    });
    setSaved(false);
  }, [autoOffset]);

  const handleSave = useCallback(async () => {
    const now = new Date().toISOString();
    const goal: Goal = {
      id: generateId(),
      type: goalType,
      rateOfChange,
      targetWeightKg: targetWeight ? Number(targetWeight) : undefined,
      calorieOffset: effectiveOffset,
      startDate: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await saveGoal(db, goal);
    setSaved(true);
  }, [db, goalType, rateOfChange, targetWeight, effectiveOffset, saveGoal]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  });

  const showRateSelector = goalType !== 'maintain';

  return (
    <div className="space-y-6" data-testid="goal-phase-selector">
      {!embedded && (
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('goal.title')}
        </h3>
      )}

      {/* Phase Cards */}
      <div className="grid grid-cols-3 gap-3">
        {GOAL_OPTIONS.map(({
          type,
          labelKey,
          icon: Icon,
          color,
          activeBg,
          activeBorder,
          activeText,
        }) => {
          const isActive = goalType === type;
          return (
            <button
              key={type}
              type="button"
              data-testid={`goal-type-${type}`}
              onClick={() => handleGoalTypeChange(type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? `${activeBorder} ${activeBg} ${activeText}`
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? color : ''}`} />
              <span className="font-bold text-sm">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Rate of Change Selector */}
      {showRateSelector && (
        <div data-testid="rate-selector">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('goal.rateOfChange')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {RATE_OPTIONS.map(({ rate, labelKey }) => (
              <button
                key={rate}
                type="button"
                data-testid={`rate-${rate}`}
                onClick={() => handleRateChange(rate)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  rateOfChange === rate
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Target Weight */}
      <div>
        <label
          htmlFor="target-weight"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {t('goal.targetWeight')}
        </label>
        <input
          id="target-weight"
          type="text"
          inputMode="decimal"
          data-testid="target-weight-input"
          value={targetWeight}
          onChange={handleTargetWeightChange}
          placeholder={t('goal.targetWeightOptional')}
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Calorie Offset Display */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('goal.calorieOffset')}
          </span>
          <span
            data-testid="calorie-offset-display"
            className="text-lg font-bold text-slate-800 dark:text-slate-100"
          >
            {formatOffset(effectiveOffset)}
          </span>
        </div>

        {/* Manual Override Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {manualOverride
              ? t('goal.calorieOffsetCustom')
              : t('goal.calorieOffsetAuto')}
          </span>
          <button
            type="button"
            data-testid="manual-override-toggle"
            onClick={handleToggleOverride}
            role="switch"
            aria-checked={manualOverride}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              manualOverride
                ? 'bg-emerald-500'
                : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                manualOverride ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Custom Offset Input */}
        {manualOverride && (
          <input
            type="text"
            inputMode="numeric"
            data-testid="custom-offset-input"
            value={customOffset}
            onChange={handleCustomOffsetChange}
            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
        )}
      </div>

      {!embedded && (
        <button
          type="button"
          data-testid="save-goal-button"
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
            saved
              ? 'bg-emerald-500'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              {t('goal.saved')}
            </span>
          ) : (
            t('goal.save')
          )}
        </button>
      )}
    </div>
  );
};

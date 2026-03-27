import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, X } from 'lucide-react';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import { estimateCardioBurn } from '../utils/cardioEstimator';
import { parseNumericInput } from '../utils/parseNumericInput';
import { formatElapsed } from '../utils/timeFormat';
import type { CardioType, CardioIntensity, Workout } from '../types';
import { CARDIO_TYPES, DISTANCE_CARDIO_TYPES, INTENSITY_OPTIONS } from '../constants';
import { useTimer } from '../hooks/useTimer';

interface CardioLoggerProps {
  onComplete: (workout: Workout) => void;
  onBack: () => void;
}



export function CardioLogger({ onComplete, onBack }: CardioLoggerProps): React.JSX.Element {
  const { t } = useTranslation();
  const addWorkout = useFitnessStore((s) => s.addWorkout);
  const addWorkoutSet = useFitnessStore((s) => s.addWorkoutSet);
  const weightKg = useHealthProfileStore((s) => s.profile.weightKg);

  const [selectedType, setSelectedType] = useState<CardioType>('running');
  const [isStopwatchMode, setIsStopwatchMode] = useState(true);
  const [manualDuration, setManualDuration] = useState(0);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [avgHeartRate, setAvgHeartRate] = useState<number | undefined>(undefined);
  const [intensity, setIntensity] = useState<CardioIntensity>('moderate');
  const headerTimer = useTimer(true);
  const stopwatch = useTimer();

  const durationMin = useMemo(() => {
    if (isStopwatchMode) {
      return Math.floor(stopwatch.elapsed / 60);
    }
    return manualDuration;
  }, [isStopwatchMode, stopwatch.elapsed, manualDuration]);

  const estimatedCalories = useMemo(() => {
    if (durationMin <= 0) return 0;
    return estimateCardioBurn(selectedType, durationMin, intensity, weightKg);
  }, [selectedType, durationMin, intensity, weightKg]);

  const showDistance = useMemo(
    () => DISTANCE_CARDIO_TYPES.includes(selectedType),
    [selectedType],
  );

  const handleStartStopwatch = stopwatch.start;
  const handlePauseStopwatch = stopwatch.stop;
  const handleStopStopwatch = stopwatch.reset;

  const handleSave = useCallback(() => {
    const now = new Date().toISOString();
    const workoutId = `workout-${Date.now()}`;
    const workout: Workout = {
      id: workoutId,
      date: now.split('T')[0],
      name: t('fitness.cardio.title'),
      durationMin: durationMin > 0 ? durationMin : undefined,
      createdAt: now,
      updatedAt: now,
    };
    addWorkout(workout);
    addWorkoutSet({
      id: `set-${Date.now()}-cardio`,
      workoutId,
      exerciseId: selectedType,
      setNumber: 1,
      weightKg: 0,
      durationMin: durationMin > 0 ? durationMin : undefined,
      distanceKm,
      avgHeartRate,
      intensity,
      estimatedCalories: estimatedCalories > 0 ? estimatedCalories : undefined,
      updatedAt: now,
    });
    onComplete(workout);
  }, [
    t,
    durationMin,
    addWorkout,
    addWorkoutSet,
    selectedType,
    distanceKm,
    avgHeartRate,
    intensity,
    estimatedCalories,
    onComplete,
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-900"
      data-testid="cardio-logger"
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between bg-emerald-600 px-4 py-3 text-white"
        data-testid="cardio-header"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t('common.back')}</span>
        </button>
        <span
          className="font-mono text-lg font-semibold tabular-nums"
          data-testid="elapsed-timer"
        >
          {formatElapsed(headerTimer.elapsed)}
        </span>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1 text-sm font-medium"
          data-testid="finish-button"
        >
          <span>{t('fitness.logger.finish')}</span>
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Cardio Type Selector */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('fitness.cardio.type')}
          </h3>
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            data-testid="cardio-type-selector"
          >
            {CARDIO_TYPES.map(({ type, emoji, i18nKey }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
                data-testid={`cardio-type-${type}`}
              >
                <span>{emoji}</span>
                <span>{t(i18nKey)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Timer Mode Toggle */}
        <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('fitness.cardio.duration')}
          </h3>
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIsStopwatchMode(true)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                isStopwatchMode
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
              data-testid="stopwatch-mode-button"
            >
              {t('fitness.cardio.stopwatch')}
            </button>
            <button
              type="button"
              onClick={() => setIsStopwatchMode(false)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                !isStopwatchMode
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
              data-testid="manual-mode-button"
            >
              {t('fitness.cardio.manual')}
            </button>
          </div>

          {isStopwatchMode ? (
            <div data-testid="stopwatch-panel">
              <p
                className="mb-3 text-center font-mono text-3xl font-bold text-slate-800 dark:text-slate-100"
                data-testid="stopwatch-display"
              >
                {formatElapsed(stopwatch.elapsed)}
              </p>
              <div className="flex gap-2">
                {!stopwatch.isRunning ? (
                  <button
                    type="button"
                    onClick={handleStartStopwatch}
                    className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    data-testid="start-button"
                  >
                    {t('fitness.cardio.start')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseStopwatch}
                    className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                    data-testid="pause-button"
                  >
                    {t('fitness.cardio.pause')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleStopStopwatch}
                  className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                  data-testid="stop-button"
                >
                  {t('fitness.cardio.stop')}
                </button>
              </div>
            </div>
          ) : (
            <div data-testid="manual-panel">
              <input
                type="number"
                value={manualDuration}
                onChange={(e) => setManualDuration(parseNumericInput(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-lg font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                data-testid="manual-duration-input"
                min={0}
              />
            </div>
          )}
        </section>

        {/* Distance (conditional) */}
        {showDistance && (
          <section
            className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800"
            data-testid="distance-section"
          >
            <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t('fitness.cardio.distance')}
            </h3>
            <input
              type="number"
              value={distanceKm ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setDistanceKm(val === '' ? undefined : parseNumericInput(val));
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-lg font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              data-testid="distance-input"
              min={0}
              step={0.1}
            />
          </section>
        )}

        {/* Heart Rate */}
        <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('fitness.cardio.heartRate')}
          </h3>
          <input
            type="number"
            value={avgHeartRate ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setAvgHeartRate(val === '' ? undefined : parseNumericInput(val));
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-lg font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            data-testid="heart-rate-input"
            min={0}
          />
        </section>

        {/* Intensity */}
        <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('fitness.cardio.intensity')}
          </h3>
          <div className="flex gap-2" data-testid="intensity-selector">
            {INTENSITY_OPTIONS.map(({ value, i18nKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => setIntensity(value)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  intensity === value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
                data-testid={`intensity-${value}`}
              >
                {t(i18nKey)}
              </button>
            ))}
          </div>
        </section>

        {/* Calorie Preview */}
        <section
          className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20"
          data-testid="calorie-preview"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {t('fitness.cardio.calories')}
            </span>
            <span
              className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
              data-testid="calorie-value"
            >
              {estimatedCalories}
            </span>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
          data-testid="save-button"
        >
          {t('fitness.cardio.save')}
        </button>
      </div>
    </div>
  );
}

import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import { estimateCardioBurn } from '../utils/cardioEstimator';
import { parseNumericInput } from '../utils/parseNumericInput';
import { formatElapsed } from '../utils/timeFormat';
import type { Workout } from '../types';
import { CARDIO_TYPES, DISTANCE_CARDIO_TYPES, INTENSITY_OPTIONS } from '../constants';
import { useTimer } from '../hooks/useTimer';
import {
  cardioLoggerSchema,
  cardioLoggerDefaults,
  type CardioLoggerFormData,
} from '../../../schemas/cardioLoggerSchema';

interface CardioLoggerProps {
  onComplete: (workout: Workout) => void;
  onBack: () => void;
}

export function CardioLogger({ onComplete, onBack }: CardioLoggerProps): React.JSX.Element {
  const { t } = useTranslation();
  const saveWorkoutAtomic = useFitnessStore((s) => s.saveWorkoutAtomic);
  const weightKg = useHealthProfileStore((s) => s.profile.weightKg);

  const { control, handleSubmit, setValue } = useForm<CardioLoggerFormData>({
    resolver: zodResolver(cardioLoggerSchema) as unknown as Resolver<CardioLoggerFormData>,
    mode: 'onBlur',
    defaultValues: cardioLoggerDefaults,
  });

  const [selectedType, isStopwatchMode, manualDuration, intensity] = useWatch({
    control,
    name: ['selectedType', 'isStopwatchMode', 'manualDuration', 'intensity'],
  });

  const headerTimer = useTimer(true);
  const stopwatch = useTimer();

  const durationMin = useMemo(() => {
    if (isStopwatchMode) {
      return Math.floor(stopwatch.elapsed / 60);
    }
    return manualDuration ?? 0;
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

  const onFormSubmit = useCallback(
    async (data: CardioLoggerFormData) => {
      const effectiveDuration = data.isStopwatchMode
        ? Math.floor(stopwatch.elapsed / 60)
        : (data.manualDuration ?? 0);
      const now = new Date().toISOString();
      const workoutId = `workout-${Date.now()}`;
      const workout: Workout = {
        id: workoutId,
        date: now.split('T')[0],
        name: t('fitness.cardio.title'),
        durationMin: effectiveDuration > 0 ? effectiveDuration : undefined,
        createdAt: now,
        updatedAt: now,
      };
      const sets = [
        {
          id: `set-${Date.now()}-cardio`,
          workoutId,
          exerciseId: data.selectedType,
          setNumber: 1,
          weightKg: 0,
          durationMin: effectiveDuration > 0 ? effectiveDuration : undefined,
          distanceKm: data.distanceKm,
          avgHeartRate: data.avgHeartRate,
          intensity: data.intensity,
          estimatedCalories: estimatedCalories > 0 ? estimatedCalories : undefined,
          updatedAt: now,
        },
      ];
      try {
        await saveWorkoutAtomic(workout, sets);
      } catch (error) {
        console.error('[CardioLogger] Save failed:', error);
        return;
      }
      onComplete(workout);
    },
    [t, stopwatch.elapsed, saveWorkoutAtomic, estimatedCalories, onComplete],
  );

  const handleSave = useCallback(() => {
    void handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-900"
      data-testid="cardio-logger"
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between bg-emerald-600 px-4 py-3 pt-safe text-white"
        data-testid="cardio-header"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1 text-white hover:bg-white/20 hover:text-white"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t('common.back')}</span>
        </Button>
        <span
          className="font-mono text-lg font-semibold tabular-nums"
          data-testid="elapsed-timer"
        >
          {formatElapsed(headerTimer.elapsed)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="gap-1 text-white hover:bg-white/20 hover:text-white"
          data-testid="finish-button"
        >
          <span>{t('fitness.logger.finish')}</span>
          <X className="h-5 w-5" />
        </Button>
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
            {CARDIO_TYPES.map(({ type, icon: Icon, i18nKey }) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="default"
                onClick={() => setValue('selectedType', type)}
                className={cn(
                  'shrink-0 rounded-full px-4 min-h-11',
                  selectedType === type
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-white text-slate-600 border-transparent dark:bg-slate-800 dark:text-slate-300'
                )}
                data-testid={`cardio-type-${type}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{t(i18nKey)}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Timer Mode Toggle */}
        <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('fitness.cardio.duration')}
          </h3>
          <div className="mb-3 flex gap-2">
            <Button
              variant={isStopwatchMode ? 'default' : 'outline'}
              onClick={() => setValue('isStopwatchMode', true)}
              className={cn(
                'flex-1 rounded-lg py-2',
                isStopwatchMode
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-slate-100 text-slate-600 border-transparent dark:bg-slate-700 dark:text-slate-300'
              )}
              data-testid="stopwatch-mode-button"
            >
              {t('fitness.cardio.stopwatch')}
            </Button>
            <Button
              variant={!isStopwatchMode ? 'default' : 'outline'}
              onClick={() => setValue('isStopwatchMode', false)}
              className={cn(
                'flex-1 rounded-lg py-2',
                !isStopwatchMode
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-slate-100 text-slate-600 border-transparent dark:bg-slate-700 dark:text-slate-300'
              )}
              data-testid="manual-mode-button"
            >
              {t('fitness.cardio.manual')}
            </Button>
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
                  <Button
                    variant="default"
                    onClick={handleStartStopwatch}
                    className="flex-1 bg-emerald-500 py-2.5 text-white hover:bg-emerald-600"
                    data-testid="start-button"
                  >
                    {t('fitness.cardio.start')}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={handlePauseStopwatch}
                    className="flex-1 bg-amber-500 py-2.5 text-white hover:bg-amber-600"
                    data-testid="pause-button"
                  >
                    {t('fitness.cardio.pause')}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleStopStopwatch}
                  className="flex-1 bg-red-500 py-2.5 text-white hover:bg-red-600"
                  data-testid="stop-button"
                >
                  {t('fitness.cardio.stop')}
                </Button>
              </div>
            </div>
          ) : (
            <div data-testid="manual-panel">
              <Controller
                name="manualDuration"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      type="number"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? undefined : parseNumericInput(val));
                      }}
                      onBlur={field.onBlur}
                      className="w-full text-center text-lg font-semibold text-slate-800"
                      data-testid="manual-duration-input"
                      min={0}
                    />
                    {fieldState.error?.message && (
                      <p className="mt-1 text-xs text-rose-500" role="alert" aria-live="assertive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
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
            <Controller
              name="distanceKm"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    type="number"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : parseNumericInput(val));
                    }}
                    onBlur={field.onBlur}
                    className="w-full text-center text-lg font-semibold text-slate-800"
                    data-testid="distance-input"
                    min={0}
                    step={0.1}
                  />
                  {fieldState.error?.message && (
                    <p className="mt-1 text-xs text-rose-500" role="alert" aria-live="assertive">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </section>
        )}

        {/* Heart Rate */}
        <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('fitness.cardio.heartRate')}
          </h3>
          <Controller
            name="avgHeartRate"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  type="number"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseNumericInput(val));
                  }}
                  onBlur={field.onBlur}
                  className="w-full text-center text-lg font-semibold text-slate-800"
                  data-testid="heart-rate-input"
                  min={0}
                />
                {fieldState.error?.message && (
                  <p className="mt-1 text-xs text-rose-500" role="alert" aria-live="assertive">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </section>

        {/* Intensity */}
        <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('fitness.cardio.intensity')}
          </h3>
          <div className="flex gap-2" data-testid="intensity-selector">
            {INTENSITY_OPTIONS.map(({ value, i18nKey }) => (
              <Button
                key={value}
                variant={intensity === value ? 'default' : 'outline'}
                onClick={() => setValue('intensity', value)}
                className={cn(
                  'flex-1 rounded-lg min-h-11',
                  intensity === value
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-slate-100 text-slate-600 border-transparent dark:bg-slate-700 dark:text-slate-300'
                )}
                data-testid={`intensity-${value}`}
              >
                {t(i18nKey)}
              </Button>
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
      <div className="border-t border-slate-200 bg-white p-4 pb-safe dark:border-slate-700 dark:bg-slate-800">
        <Button
          variant="default"
          onClick={handleSave}
          className="w-full rounded-xl bg-emerald-500 py-3 text-white hover:bg-emerald-600"
          data-testid="save-button"
        >
          {t('fitness.cardio.save')}
        </Button>
      </div>
    </div>
  );
}

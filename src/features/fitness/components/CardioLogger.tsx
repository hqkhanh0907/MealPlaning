import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, X } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import type { Resolver } from 'react-hook-form';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateUUID } from '@/utils/helpers';
import { logger } from '@/utils/logger';

import { useNotification } from '../../../contexts/NotificationContext';
import {
  cardioLoggerDefaults,
  type CardioLoggerFormData,
  cardioLoggerSchema,
} from '../../../schemas/cardioLoggerSchema';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import { CARDIO_TYPE_TO_EXERCISE_ID, CARDIO_TYPES, DISTANCE_CARDIO_TYPES, INTENSITY_OPTIONS } from '../constants';
import { useTimer } from '../hooks/useTimer';
import type { Workout } from '../types';
import { estimateCardioBurn } from '../utils/cardioEstimator';
import { parseNumericInput } from '../utils/parseNumericInput';
import { formatElapsed } from '../utils/timeFormat';

interface CardioLoggerProps {
  onComplete: () => void;
  onBack: () => void;
}

export function CardioLogger({ onComplete, onBack }: Readonly<CardioLoggerProps>): React.JSX.Element {
  const { t } = useTranslation();
  const notify = useNotification();
  const saveWorkoutAtomic = useFitnessStore(s => s.saveWorkoutAtomic);
  const weightKg = useHealthProfileStore(s => s.profile?.weightKg ?? 70);

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

  const showDistance = useMemo(() => DISTANCE_CARDIO_TYPES.includes(selectedType), [selectedType]);

  const handleStartStopwatch = stopwatch.start;
  const handlePauseStopwatch = stopwatch.stop;
  const handleStopStopwatch = stopwatch.reset;

  const onFormSubmit = useCallback(
    async (data: CardioLoggerFormData) => {
      const effectiveDuration = data.isStopwatchMode ? Math.floor(stopwatch.elapsed / 60) : (data.manualDuration ?? 0);
      const now = new Date().toISOString();
      const workoutId = generateUUID();
      const exerciseId = CARDIO_TYPE_TO_EXERCISE_ID[data.selectedType];
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
          id: generateUUID(),
          workoutId,
          exerciseId,
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
        logger.error({ component: 'CardioLogger', action: 'save' }, error);
        notify.error(t('fitness.logger.saveFailed'));
        return;
      }
      onComplete();
    },
    [t, stopwatch.elapsed, saveWorkoutAtomic, estimatedCalories, onComplete, notify],
  );

  const handleSave = useCallback(() => {
    void handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  return (
    <div className="bg-muted fixed inset-0 z-50 flex flex-col" data-testid="cardio-logger">
      {/* Header */}
      <header
        className="pt-safe bg-primary text-primary-foreground sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        data-testid="cardio-header"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="hover:bg-card/20 gap-1 text-white hover:text-white"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span>{t('common.back')}</span>
        </Button>
        <span className="font-mono text-lg font-semibold tabular-nums" data-testid="elapsed-timer">
          {formatElapsed(headerTimer.elapsed)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="hover:bg-card/20 gap-1 text-white hover:text-white"
          data-testid="finish-button"
        >
          <span>{t('fitness.logger.finish')}</span>
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Cardio Type Selector */}
        <section>
          <h3 className="text-foreground-secondary mb-2 text-sm font-semibold">{t('fitness.cardio.type')}</h3>
          <div className="flex gap-2 overflow-x-auto pb-2" data-testid="cardio-type-selector">
            {CARDIO_TYPES.map(({ type, icon: Icon, i18nKey, color }) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="default"
                onClick={() => setValue('selectedType', type)}
                className={cn(
                  'min-h-11 shrink-0 rounded-full px-4',
                  selectedType === type
                    ? 'bg-primary text-primary-foreground hover:bg-primary'
                    : 'bg-card text-foreground-secondary border-transparent',
                )}
                data-testid={`cardio-type-${type}`}
              >
                <Icon className={`h-4 w-4 ${selectedType !== type ? color : ''}`} aria-hidden="true" />
                <span>{t(i18nKey)}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Timer Mode Toggle */}
        <section className="bg-card rounded-xl p-4 shadow-sm">
          <h3 className="text-foreground-secondary mb-3 text-sm font-semibold">{t('fitness.cardio.duration')}</h3>
          <div className="mb-3 flex gap-2">
            <Button
              variant={isStopwatchMode ? 'default' : 'outline'}
              onClick={() => setValue('isStopwatchMode', true)}
              className={cn(
                'flex-1 rounded-lg py-2',
                isStopwatchMode
                  ? 'bg-primary text-primary-foreground hover:bg-primary'
                  : 'text-foreground-secondary bg-muted border-transparent',
              )}
              data-testid="stopwatch-mode-button"
            >
              {t('fitness.cardio.stopwatch')}
            </Button>
            <Button
              variant={isStopwatchMode ? 'outline' : 'default'}
              onClick={() => setValue('isStopwatchMode', false)}
              className={cn(
                'flex-1 rounded-lg py-2',
                isStopwatchMode
                  ? 'text-foreground-secondary bg-muted border-transparent'
                  : 'bg-primary text-primary-foreground hover:bg-primary',
              )}
              data-testid="manual-mode-button"
            >
              {t('fitness.cardio.manual')}
            </Button>
          </div>

          {isStopwatchMode ? (
            <div data-testid="stopwatch-panel">
              <p
                className="text-foreground mb-3 text-center font-mono text-3xl font-bold"
                data-testid="stopwatch-display"
              >
                {formatElapsed(stopwatch.elapsed)}
              </p>
              <div className="flex gap-2">
                {stopwatch.isRunning ? (
                  <Button
                    variant="default"
                    onClick={handlePauseStopwatch}
                    className="bg-color-energy hover:bg-color-energy/90 text-color-energy-emphasis flex-1 py-2.5"
                    data-testid="pause-button"
                  >
                    {t('fitness.cardio.pause')}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={handleStartStopwatch}
                    className="bg-primary text-primary-foreground hover:bg-primary flex-1 py-2.5"
                    data-testid="start-button"
                  >
                    {t('fitness.cardio.start')}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleStopStopwatch}
                  className="bg-destructive hover:bg-destructive/90 flex-1 py-2.5 text-white"
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
                      onChange={e => {
                        const val = e.target.value;
                        field.onChange(val === '' ? undefined : parseNumericInput(val));
                      }}
                      onBlur={field.onBlur}
                      className="text-foreground w-full text-center text-lg font-semibold"
                      data-testid="manual-duration-input"
                      min={0}
                    />
                    {fieldState.error?.message && (
                      <p className="text-destructive mt-1 text-xs" role="alert" aria-live="assertive">
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
          <section className="bg-card rounded-xl p-4 shadow-sm" data-testid="distance-section">
            <h3 className="text-foreground-secondary mb-2 text-sm font-semibold">{t('fitness.cardio.distance')}</h3>
            <Controller
              name="distanceKm"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    type="number"
                    value={field.value ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : parseNumericInput(val));
                    }}
                    onBlur={field.onBlur}
                    className="text-foreground w-full text-center text-lg font-semibold"
                    data-testid="distance-input"
                    min={0}
                    step={0.1}
                  />
                  {fieldState.error?.message && (
                    <p className="text-destructive mt-1 text-xs" role="alert" aria-live="assertive">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </section>
        )}

        {/* Heart Rate */}
        <section className="bg-card rounded-xl p-4 shadow-sm">
          <h3 className="text-foreground-secondary mb-2 text-sm font-semibold">{t('fitness.cardio.heartRate')}</h3>
          <Controller
            name="avgHeartRate"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  type="number"
                  value={field.value ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseNumericInput(val));
                  }}
                  onBlur={field.onBlur}
                  className="text-foreground w-full text-center text-lg font-semibold"
                  data-testid="heart-rate-input"
                  min={0}
                />
                {fieldState.error?.message && (
                  <p className="text-destructive mt-1 text-xs" role="alert" aria-live="assertive">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </section>

        {/* Intensity */}
        <section className="bg-card rounded-xl p-4 shadow-sm">
          <h3 className="text-foreground-secondary mb-2 text-sm font-semibold">{t('fitness.cardio.intensity')}</h3>
          <div className="flex gap-2" data-testid="intensity-selector">
            {INTENSITY_OPTIONS.map(({ value, i18nKey }) => (
              <Button
                key={value}
                variant={intensity === value ? 'default' : 'outline'}
                onClick={() => setValue('intensity', value)}
                className={cn(
                  'min-h-11 flex-1 rounded-lg',
                  intensity === value
                    ? 'bg-primary text-primary-foreground hover:bg-primary'
                    : 'text-foreground-secondary bg-muted border-transparent',
                )}
                data-testid={`intensity-${value}`}
              >
                {t(i18nKey)}
              </Button>
            ))}
          </div>
        </section>

        {/* Calorie Preview */}
        <section className="bg-primary-subtle rounded-xl p-4" data-testid="calorie-preview">
          <div className="flex items-center justify-between">
            <span className="text-primary-emphasis text-sm font-semibold">{t('fitness.cardio.calories')}</span>
            <span className="text-primary text-2xl font-bold" data-testid="calorie-value">
              {estimatedCalories}
            </span>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="pb-safe bg-card border-border border-t p-4">
        <Button
          variant="default"
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary w-full rounded-xl py-3"
          data-testid="save-button"
        >
          {t('fitness.cardio.save')}
        </Button>
      </div>
    </div>
  );
}

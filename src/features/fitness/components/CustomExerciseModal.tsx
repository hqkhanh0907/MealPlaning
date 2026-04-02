import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import {
  customExerciseDefaults,
  type CustomExerciseFormData,
  customExerciseSchema,
} from '../../../schemas/customExerciseSchema';
import type { MuscleGroup } from '../types';

export type { CustomExerciseFormData } from '../../../schemas/customExerciseSchema';

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: CustomExerciseFormData) => void;
}

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];

export function CustomExerciseModal({
  isOpen,
  onClose,
  onSave,
}: Readonly<CustomExerciseModalProps>): React.JSX.Element | null {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomExerciseFormData>({
    resolver: zodResolver(customExerciseSchema) as unknown as Resolver<CustomExerciseFormData>,
    mode: 'onBlur',
    defaultValues: customExerciseDefaults,
  });

  const onFormSubmit = useCallback(
    (data: CustomExerciseFormData) => {
      onSave(data);
      reset(customExerciseDefaults);
      onClose();
    },
    [onSave, reset, onClose],
  );

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card w-full max-w-sm rounded-2xl p-6" data-testid="custom-exercise-modal">
        <h3 className="text-foreground text-lg font-bold">{t('fitness.exerciseSelector.addCustom')}</h3>
        <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 space-y-3">
          <div>
            <label htmlFor="custom-exercise-name" className="text-foreground mb-1 block text-sm font-medium">
              {t('fitness.exerciseSelector.customName')}
            </label>
            <Input
              {...register('name')}
              id="custom-exercise-name"
              placeholder={t('fitness.exerciseSelector.customName')}
              data-testid="custom-exercise-name"
              className={`w-full ${errors.name ? 'border-rose-500' : ''}`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="custom-exercise-muscle" className="text-foreground mb-1 block text-sm font-medium">
              {t('fitness.exerciseSelector.selectMuscle')}
            </label>
            <select
              {...register('muscleGroup')}
              id="custom-exercise-muscle"
              data-testid="custom-exercise-muscle"
              className="border-border focus-visible:ring-ring w-full rounded-lg border p-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <option value="">{t('fitness.exerciseSelector.selectMuscle')}</option>
              {MUSCLE_GROUPS.map(mg => (
                <option key={mg} value={mg}>
                  {mg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="custom-exercise-category" className="text-foreground mb-1 block text-sm font-medium">
              {t('fitness.exerciseSelector.compoundCategory')}
            </label>
            <select
              {...register('category')}
              id="custom-exercise-category"
              data-testid="custom-exercise-category"
              className="border-border focus-visible:ring-ring w-full rounded-lg border p-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <option value="compound">{t('fitness.exerciseSelector.compoundCategory')}</option>
              <option value="isolation">{t('fitness.exerciseSelector.isolationCategory')}</option>
              <option value="cardio">{t('fitness.exerciseSelector.cardioCategory')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="custom-exercise-equipment" className="text-foreground mb-1 block text-sm font-medium">
              {t('fitness.exerciseSelector.equipment')}
            </label>
            <Input
              {...register('equipment')}
              id="custom-exercise-equipment"
              placeholder={t('fitness.exerciseSelector.equipment')}
              data-testid="custom-exercise-equipment"
              className="w-full"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-foreground-secondary border-border hover:bg-accent focus-visible:ring-ring flex min-h-[44px] flex-1 items-center justify-center rounded-lg border py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="focus-visible:ring-ring flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-blue-600 py-2 text-sm text-white transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              data-testid="save-custom-exercise"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

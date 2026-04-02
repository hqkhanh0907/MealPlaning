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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-800" data-testid="custom-exercise-modal">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          {t('fitness.exerciseSelector.addCustom')}
        </h3>
        <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 space-y-3">
          <div>
            <Input
              {...register('name')}
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
          <select
            {...register('muscleGroup')}
            data-testid="custom-exercise-muscle"
            className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            <option value="">{t('fitness.exerciseSelector.selectMuscle')}</option>
            {MUSCLE_GROUPS.map(mg => (
              <option key={mg} value={mg}>
                {mg}
              </option>
            ))}
          </select>
          <select
            {...register('category')}
            data-testid="custom-exercise-category"
            className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            <option value="compound">{t('fitness.exerciseSelector.compoundCategory')}</option>
            <option value="isolation">{t('fitness.exerciseSelector.isolationCategory')}</option>
            <option value="cardio">{t('fitness.exerciseSelector.cardioCategory')}</option>
          </select>
          <Input
            {...register('equipment')}
            placeholder={t('fitness.exerciseSelector.equipment')}
            data-testid="custom-exercise-equipment"
            className="w-full"
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white disabled:opacity-50"
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

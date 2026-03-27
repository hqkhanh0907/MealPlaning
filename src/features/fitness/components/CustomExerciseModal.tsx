import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import type { MuscleGroup, ExerciseCategory } from '../types';

export interface CustomExerciseFormData {
  name: string;
  muscleGroup: string;
  category: ExerciseCategory;
  equipment: string;
}

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: CustomExerciseFormData) => void;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'legs',
  'arms',
  'core',
  'glutes',
];

const initialForm: CustomExerciseFormData = {
  name: '',
  muscleGroup: '',
  category: 'compound',
  equipment: '',
};

export function CustomExerciseModal({
  isOpen,
  onClose,
  onSave,
}: CustomExerciseModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [form, setForm] = useState<CustomExerciseFormData>(initialForm);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, name: e.target.value }));
    },
    [],
  );

  const handleMuscleGroupChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setForm((f) => ({ ...f, muscleGroup: e.target.value }));
    },
    [],
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setForm((f) => ({
        ...f,
        category: e.target.value as ExerciseCategory,
      }));
    },
    [],
  );

  const handleEquipmentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, equipment: e.target.value }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim() });
    setForm(initialForm);
    onClose();
  }, [form, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="rounded-2xl bg-white p-6 dark:bg-slate-800 w-full max-w-sm"
        data-testid="custom-exercise-modal"
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          {t('fitness.exerciseSelector.addCustom')}
        </h3>
        <div className="mt-4 space-y-3">
          <input
            value={form.name}
            onChange={handleNameChange}
            placeholder={t('fitness.exerciseSelector.customName')}
            data-testid="custom-exercise-name"
            className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
          <select
            value={form.muscleGroup}
            onChange={handleMuscleGroupChange}
            data-testid="custom-exercise-muscle"
            className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            <option value="">
              {t('fitness.exerciseSelector.selectMuscle')}
            </option>
            {MUSCLE_GROUPS.map((mg) => (
              <option key={mg} value={mg}>
                {mg}
              </option>
            ))}
          </select>
          <select
            value={form.category}
            onChange={handleCategoryChange}
            data-testid="custom-exercise-category"
            className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            <option value="compound">
              {t('fitness.exerciseSelector.compoundCategory')}
            </option>
            <option value="isolation">
              {t('fitness.exerciseSelector.isolationCategory')}
            </option>
            <option value="cardio">
              {t('fitness.exerciseSelector.cardioCategory')}
            </option>
          </select>
          <input
            value={form.equipment}
            onChange={handleEquipmentChange}
            placeholder={t('fitness.exerciseSelector.equipment')}
            data-testid="custom-exercise-equipment"
            className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white disabled:opacity-50"
            data-testid="save-custom-exercise"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

import React, { memo, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, Search } from 'lucide-react';
import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { EXERCISES } from '../data/exerciseDatabase';
import { EQUIPMENT_DISPLAY } from '../constants';
import type {
  Exercise,
  MuscleGroup,
  EquipmentType,
  ExerciseCategory,
} from '../types';

interface SwapExerciseSheetProps {
  isOpen: boolean;
  currentExercise: Exercise;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const MUSCLE_GROUP_I18N_KEYS: Record<MuscleGroup, string> = {
  chest: 'fitness.exerciseSelector.muscleChest',
  back: 'fitness.exerciseSelector.muscleBack',
  shoulders: 'fitness.exerciseSelector.muscleShoulders',
  legs: 'fitness.exerciseSelector.muscleLegs',
  arms: 'fitness.exerciseSelector.muscleArms',
  core: 'fitness.exerciseSelector.muscleCore',
  glutes: 'fitness.exerciseSelector.muscleGlutes',
};

const CATEGORY_I18N_KEYS: Record<ExerciseCategory, string> = {
  compound: 'fitness.exerciseSelector.compound',
  secondary: 'fitness.exerciseSelector.secondary',
  isolation: 'fitness.exerciseSelector.isolation',
};

function toExercise(seed: (typeof EXERCISES)[number]): Exercise {
  return {
    id: seed.id,
    nameVi: seed.nameVi,
    nameEn: seed.nameEn,
    muscleGroup: seed.muscleGroup as MuscleGroup,
    secondaryMuscles: seed.secondaryMuscles as MuscleGroup[],
    category: seed.category,
    equipment: seed.equipment as EquipmentType[],
    contraindicated: seed.contraindicated as Exercise['contraindicated'],
    exerciseType: seed.exerciseType,
    defaultRepsMin: seed.defaultRepsMin,
    defaultRepsMax: seed.defaultRepsMax,
    isCustom: seed.isCustom,
    updatedAt: new Date().toISOString(),
  };
}

const allExercises: Exercise[] = EXERCISES.map(toExercise);

export const SwapExerciseSheet = memo(function SwapExerciseSheet({
  isOpen,
  currentExercise,
  onSelect,
  onClose,
}: SwapExerciseSheetProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  useModalBackHandler(isOpen, onClose);

  const alternatives = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return allExercises.filter((exercise) => {
      if (exercise.id === currentExercise.id) return false;
      if (exercise.muscleGroup !== currentExercise.muscleGroup) return false;

      if (query) {
        const nameViMatch = exercise.nameVi.toLowerCase().includes(query);
        const nameEnMatch = exercise.nameEn
          ? exercise.nameEn.toLowerCase().includes(query)
          : false;
        if (!nameViMatch && !nameEnMatch) return false;
      }

      return true;
    });
  }, [searchQuery, currentExercise.id, currentExercise.muscleGroup]);

  const handleSelect = useCallback(
    (exercise: Exercise) => {
      onSelect(exercise);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-70">
      <div
        data-testid="swap-exercise-sheet"
        className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md max-h-[85vh] flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ArrowLeftRight className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {t('fitness.swap.title')}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span>{t('fitness.swap.current')}: </span>
            <span
              className="font-medium text-slate-700 dark:text-slate-300"
              data-testid="swap-current-name"
            >
              {currentExercise.nameVi}
            </span>
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
            {t('fitness.swap.sameGroup')}:{' '}
            {t(MUSCLE_GROUP_I18N_KEYS[currentExercise.muscleGroup])}
          </p>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              data-testid="swap-search-input"
              placeholder={t('fitness.swap.search')}
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label={t('fitness.swap.search')}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2.5 pl-9 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        {/* Section label */}
        <div className="px-4 pb-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {t('fitness.swap.alternatives')} ({alternatives.length})
          </p>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-4 pb-safe">
          {alternatives.length === 0 ? (
            <div
              data-testid="swap-empty-state"
              className="flex flex-col items-center justify-center py-12 text-slate-400"
            >
              <ArrowLeftRight className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">{t('fitness.swap.noAlternatives')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {alternatives.map((exercise) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    data-testid={`swap-item-${exercise.id}`}
                    aria-label={`${t('fitness.swap.title')}: ${exercise.nameVi}`}
                    onClick={() => handleSelect(exercise)}
                    className="w-full text-left px-3 py-3 min-h-11 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {exercise.nameVi}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {t(CATEGORY_I18N_KEYS[exercise.category])}
                      </span>
                      <span className="text-xs text-slate-300 dark:text-slate-600">
                        •
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {exercise.equipment.map((eq) => EQUIPMENT_DISPLAY[eq] ?? eq).join(', ')}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
});

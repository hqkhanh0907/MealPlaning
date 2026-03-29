import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus } from 'lucide-react';
import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { EXERCISES } from '../data/exerciseDatabase';
import { CustomExerciseModal } from './CustomExerciseModal';
import type { CustomExerciseFormData } from './CustomExerciseModal';
import type {
  Exercise,
  MuscleGroup,
  EquipmentType,
  ExerciseCategory,
} from '../types';

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  muscleGroupFilter?: MuscleGroup;
  equipmentFilter?: EquipmentType[];
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

export function ExerciseSelector({
  isOpen,
  onClose,
  onSelect,
  muscleGroupFilter,
  equipmentFilter,
}: ExerciseSelectorProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<
    MuscleGroup | 'all'
  >(muscleGroupFilter ?? 'all');
  const [showCustomModal, setShowCustomModal] = useState(false);

  useModalBackHandler(isOpen, onClose);

  const filteredExercises = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return allExercises.filter((exercise) => {
      if (
        selectedMuscleGroup !== 'all' &&
        exercise.muscleGroup !== selectedMuscleGroup
      ) {
        return false;
      }

      if (
        equipmentFilter &&
        equipmentFilter.length > 0 &&
        !exercise.equipment.some((eq) => equipmentFilter.includes(eq))
      ) {
        return false;
      }

      if (query) {
        const nameViMatch = exercise.nameVi.toLowerCase().includes(query);
        const nameEnMatch = exercise.nameEn
          ? exercise.nameEn.toLowerCase().includes(query)
          : false;
        if (!nameViMatch && !nameEnMatch) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedMuscleGroup, equipmentFilter]);

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

  const handleChipClick = useCallback((group: MuscleGroup | 'all') => {
    setSelectedMuscleGroup(group);
  }, []);

  const openCustomModal = useCallback(() => {
    setShowCustomModal(true);
  }, []);

  const closeCustomModal = useCallback(() => {
    setShowCustomModal(false);
  }, []);

  const handleSaveCustomExercise = useCallback(
    (data: CustomExerciseFormData) => {
      const customExercise: Exercise = {
        id: `custom-${Date.now()}`,
        nameVi: data.name,
        nameEn: data.name,
        muscleGroup: (data.muscleGroup || 'chest') as MuscleGroup,
        secondaryMuscles: [],
        category: data.category as ExerciseCategory,
        equipment: data.equipment
          ? ([data.equipment] as Exercise['equipment'])
          : [],
        contraindicated: [],
        exerciseType: 'strength',
        defaultRepsMin: 8,
        defaultRepsMax: 12,
        isCustom: true,
        updatedAt: new Date().toISOString(),
      };
      onSelect(customExercise);
      onClose();
    },
    [onSelect, onClose],
  );

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-60">
      <div
        data-testid="exercise-selector-sheet"
        className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md max-h-[85vh] flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 text-center px-4 pb-2">
          {t('fitness.exerciseSelector.title')}
        </h2>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              data-testid="exercise-search-input"
              placeholder={t('fitness.exerciseSelector.search')}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 border-none outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Muscle group chips */}
        <div className="px-4 pb-3 overflow-x-auto shrink-0">
          <div className="flex gap-2 min-w-max" data-testid="muscle-group-chips">
            <button
              type="button"
              onClick={() => handleChipClick('all')}
              className={`px-3 py-1.5 min-h-11 rounded-full text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selectedMuscleGroup === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t('fitness.exerciseSelector.all')}
            </button>
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => handleChipClick(group)}
                className={`px-3 py-1.5 min-h-11 rounded-full text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  selectedMuscleGroup === group
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t(MUSCLE_GROUP_I18N_KEYS[group])}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-4 pb-3">
          {filteredExercises.length === 0 ? (
            <div
              data-testid="exercise-empty-state"
              className="flex flex-col items-center justify-center py-12 text-slate-400"
            >
              <p className="text-sm">
                {t('fitness.exerciseSelector.noResults')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredExercises.map((exercise) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    data-testid={`exercise-item-${exercise.id}`}
                    onClick={() => handleSelect(exercise)}
                    className="w-full text-left px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {exercise.nameVi}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t(MUSCLE_GROUP_I18N_KEYS[exercise.muscleGroup])}
                      </span>
                      <span className="text-xs text-slate-300 dark:text-slate-600">
                        •
                      </span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {t(CATEGORY_I18N_KEYS[exercise.category])}
                      </span>
                      <span className="text-xs text-slate-300 dark:text-slate-600">
                        •
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {exercise.equipment
                          .map((eq) => t(`fitness.equipment.${eq}`))
                          .join(', ')}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Custom Exercise button — sticky footer outside scroll */}
        <div className="border-t border-slate-200 px-4 py-3 pb-safe dark:border-slate-700">
          <button
            type="button"
            onClick={openCustomModal}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm text-slate-400 dark:border-slate-600 dark:text-slate-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-testid="add-custom-exercise"
          >
            <Plus className="h-4 w-4" />
            {t('fitness.exerciseSelector.addCustom')}
          </button>
        </div>

        {/* Custom Exercise Modal */}
        <CustomExerciseModal
          isOpen={showCustomModal}
          onClose={closeCustomModal}
          onSave={handleSaveCustomExercise}
        />
      </div>
    </ModalBackdrop>
  );
}

import { Plus, Search } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { generateUUID } from '@/utils/helpers';

import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { EQUIPMENT_DISPLAY } from '../constants';
import { EXERCISES } from '../data/exerciseDatabase';
import type { EquipmentType, Exercise, ExerciseCategory, MuscleGroup } from '../types';
import type { CustomExerciseFormData } from './CustomExerciseModal';
import { CustomExerciseModal } from './CustomExerciseModal';

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  muscleGroupFilter?: MuscleGroup;
  equipmentFilter?: EquipmentType[];
}

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];

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
}: Readonly<ExerciseSelectorProps>): React.JSX.Element | null {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>(muscleGroupFilter ?? 'all');
  const [showCustomModal, setShowCustomModal] = useState(false);

  useModalBackHandler(isOpen, onClose);

  const filteredExercises = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return allExercises.filter(exercise => {
      if (selectedMuscleGroup !== 'all' && exercise.muscleGroup !== selectedMuscleGroup) {
        return false;
      }

      if (
        equipmentFilter &&
        equipmentFilter.length > 0 &&
        !exercise.equipment.some(eq => equipmentFilter.includes(eq))
      ) {
        return false;
      }

      if (query) {
        const nameViMatch = exercise.nameVi.toLowerCase().includes(query);
        const nameEnMatch = exercise.nameEn ? exercise.nameEn.toLowerCase().includes(query) : false;
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

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

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
        id: generateUUID(),
        nameVi: data.name,
        nameEn: data.name,
        muscleGroup: (data.muscleGroup || 'chest') as MuscleGroup,
        secondaryMuscles: [],
        category: data.category as ExerciseCategory,
        equipment: data.equipment ? ([data.equipment] as Exercise['equipment']) : [],
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
        className="bg-card relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="bg-muted h-1 w-10 rounded-full" />
        </div>

        {/* Title */}
        <h2 className="text-foreground px-4 pb-2 text-center text-lg font-bold">
          {t('fitness.exerciseSelector.title')}
        </h2>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              data-testid="exercise-search-input"
              placeholder={t('fitness.exerciseSelector.search')}
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label={t('fitness.exerciseSelector.search')}
              className="focus:ring-ring bg-muted text-foreground placeholder:text-muted-foreground w-full rounded-xl border-none py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        {/* Muscle group chips */}
        <div className="shrink-0 overflow-x-auto px-4 pb-3">
          <div className="flex min-w-max gap-2" data-testid="muscle-group-chips">
            <button
              type="button"
              onClick={() => handleChipClick('all')}
              className={`focus-visible:ring-ring min-h-11 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
                selectedMuscleGroup === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground-secondary bg-muted'
              }`}
            >
              {t('fitness.exerciseSelector.all')}
            </button>
            {MUSCLE_GROUPS.map(group => (
              <button
                key={group}
                type="button"
                onClick={() => handleChipClick(group)}
                className={`focus-visible:ring-ring min-h-11 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  selectedMuscleGroup === group
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground-secondary bg-muted'
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
              className="text-muted-foreground flex flex-col items-center justify-center py-12"
            >
              <p className="text-sm">{t('fitness.exerciseSelector.noResults')}</p>
            </div>
          ) : (
            <ul className="divide-border divide-y">
              {filteredExercises.map(exercise => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    data-testid={`exercise-item-${exercise.id}`}
                    onClick={() => handleSelect(exercise)}
                    className="focus-visible:ring-ring hover:bg-accent focus-visible:ring-offset-2/50 w-full rounded-lg px-2 py-3 text-left transition-colors focus-visible:ring-2"
                  >
                    <p className="text-foreground text-sm font-medium">{exercise.nameVi}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {t(MUSCLE_GROUP_I18N_KEYS[exercise.muscleGroup])}
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-primary text-xs font-medium">
                        {t(CATEGORY_I18N_KEYS[exercise.category])}
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-muted-foreground text-xs">
                        {exercise.equipment.map(eq => EQUIPMENT_DISPLAY[eq] ?? eq).join(', ')}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Custom Exercise button — sticky footer outside scroll */}
        <div className="pb-safe border-border border-t px-4 py-3">
          <button
            type="button"
            onClick={openCustomModal}
            className="focus-visible:ring-ring border-border text-muted-foreground flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2"
            data-testid="add-custom-exercise"
          >
            <Plus className="h-4 w-4" />
            {t('fitness.exerciseSelector.addCustom')}
          </button>
        </div>

        {/* Custom Exercise Modal */}
        <CustomExerciseModal isOpen={showCustomModal} onClose={closeCustomModal} onSave={handleSaveCustomExercise} />
      </div>
    </ModalBackdrop>
  );
}

import { ArrowLeftRight, Search } from 'lucide-react';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { EQUIPMENT_DISPLAY } from '../constants';
import { EXERCISES } from '../data/exerciseDatabase';
import type { EquipmentType, Exercise, ExerciseCategory, MuscleGroup } from '../types';

interface SwapExerciseSheetProps {
  isOpen: boolean;
  currentExercise: Exercise;
  excludeIds?: string[];
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
  excludeIds,
  onSelect,
  onClose,
}: SwapExerciseSheetProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const titleId = React.useId();

  useModalBackHandler(isOpen, onClose);

  const alternatives = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return allExercises.filter(exercise => {
      if (exercise.id === currentExercise.id) return false;
      if (excludeIds?.includes(exercise.id)) return false;
      if (exercise.muscleGroup !== currentExercise.muscleGroup) return false;

      if (query) {
        const nameViMatch = exercise.nameVi.toLowerCase().includes(query);
        const nameEnMatch = exercise.nameEn ? exercise.nameEn.toLowerCase().includes(query) : false;
        if (!nameViMatch && !nameEnMatch) return false;
      }

      return true;
    });
  }, [searchQuery, currentExercise.id, currentExercise.muscleGroup, excludeIds]);

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

  if (!isOpen) return null;

  return (
    <ModalBackdrop
      onClose={onClose}
      zIndex="z-70"
      mobileLayout="sheet"
      ariaLabelledBy={titleId}
      allowSwipeToDismiss={!isSearchFocused}
    >
      <div
        data-testid="swap-exercise-sheet"
        className="bg-card relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="px-4 pb-3 text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <ArrowLeftRight className="text-primary h-5 w-5" />
            <h2 id={titleId} data-testid="swap-exercise-title" className="text-foreground text-xl font-semibold">
              {t('fitness.swap.title')}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            <span>{t('fitness.swap.current')}: </span>
            <span className="text-foreground font-medium" data-testid="swap-current-name">
              {currentExercise.nameVi}
            </span>
          </p>
          <p className="text-primary mt-0.5 text-xs">
            {t('fitness.swap.sameGroup')}: {t(MUSCLE_GROUP_I18N_KEYS[currentExercise.muscleGroup])}
          </p>
        </div>

        <div data-testid="swap-search-region" className="shrink-0 px-4 pb-3">
          <div className="relative">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              data-testid="swap-search-input"
              placeholder={t('fitness.swap.search')}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label={t('fitness.swap.search')}
              maxLength={100}
              className="focus-visible:ring-ring border-border bg-card text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-3 py-2.5 pl-9 text-sm outline-none focus-visible:ring-2"
            />
          </div>
        </div>

        <div className="shrink-0 px-4 pb-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t('fitness.swap.alternatives')} ({alternatives.length})
          </p>
        </div>

        <div data-testid="swap-list-region" className="pb-safe flex-1 overflow-y-auto px-4">
          {alternatives.length === 0 ? (
            <div
              data-testid="swap-empty-state"
              className="text-muted-foreground flex flex-col items-center justify-center py-12"
            >
              <ArrowLeftRight className="mb-2 h-6 w-6 opacity-40" />
              <p className="text-sm">{t('fitness.swap.noAlternatives')}</p>
            </div>
          ) : (
            <ul className="divide-border divide-y">
              {alternatives.map(exercise => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    data-testid={`swap-item-${exercise.id}`}
                    aria-label={`${t('fitness.swap.title')}: ${exercise.nameVi}`}
                    onClick={() => handleSelect(exercise)}
                    className="focus-visible:ring-ring hover:bg-accent focus-visible:ring-offset-2/50 min-h-11 w-full rounded-lg px-3 py-3 text-left transition-colors focus-visible:ring-2"
                  >
                    <p className="text-foreground text-sm font-medium">{exercise.nameVi}</p>
                    <div className="mt-0.5 flex items-center gap-2">
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
      </div>
    </ModalBackdrop>
  );
});

import { Clock, Plus, Search } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useFitnessStore } from '@/store/fitnessStore';
import { generateUUID } from '@/utils/helpers';

import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { EQUIPMENT_DISPLAY } from '../constants';
import { EXERCISES } from '../data/exerciseDatabase';
import type { EquipmentType, Exercise, ExerciseCategory, ExerciseType, MuscleGroup } from '../types';
import type { CustomExerciseFormData } from './CustomExerciseModal';
import { CustomExerciseModal } from './CustomExerciseModal';

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  muscleGroupFilter?: MuscleGroup;
  equipmentFilter?: EquipmentType[];
}

type CategoryTab = 'all' | 'compound' | 'isolation' | 'cardio';

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];

const EQUIPMENT_TYPES: EquipmentType[] = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'bands',
  'kettlebell',
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

const CATEGORY_TAB_I18N: Record<CategoryTab, string> = {
  all: 'fitness.exerciseSelector.all',
  compound: 'fitness.exerciseSelector.compoundCategory',
  isolation: 'fitness.exerciseSelector.isolationCategory',
  cardio: 'fitness.exerciseSelector.cardioCategory',
};

const RECENTLY_USED_LIMIT = 5;

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
const exerciseMap = new Map(allExercises.map(ex => [ex.id, ex]));

function matchesCategoryTab(exercise: Exercise, tab: CategoryTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'cardio') return exercise.exerciseType === 'cardio';
  if (tab === 'compound') {
    return (
      exercise.exerciseType === 'strength' && (exercise.category === 'compound' || exercise.category === 'secondary')
    );
  }
  // isolation
  return exercise.exerciseType === 'strength' && exercise.category === 'isolation';
}

function matchesSearch(exercise: Exercise, query: string): boolean {
  if (!query) return true;
  const nameViMatch = exercise.nameVi.toLowerCase().includes(query);
  const nameEnMatch = exercise.nameEn ? exercise.nameEn.toLowerCase().includes(query) : false;
  return nameViMatch || nameEnMatch;
}

function getRecentExercises(workoutSets: ReadonlyArray<{ exerciseId: string | null; updatedAt: string }>): Exercise[] {
  const seen = new Set<string>();
  const result: Exercise[] = [];

  const sorted = [...workoutSets]
    .filter((s): s is { exerciseId: string; updatedAt: string } => s.exerciseId !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  for (const ws of sorted) {
    if (seen.has(ws.exerciseId)) continue;
    const exercise = exerciseMap.get(ws.exerciseId);
    if (!exercise) continue;
    seen.add(ws.exerciseId);
    result.push(exercise);
    if (result.length >= RECENTLY_USED_LIMIT) break;
  }

  return result;
}

const chipBase =
  'focus-visible:ring-ring min-h-12 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]';
const chipActive = 'bg-accent-highlight text-accent-highlight-foreground';
const chipInactive = 'text-foreground-secondary bg-muted';

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
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Set<EquipmentType>>(() => new Set(equipmentFilter ?? []));
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const titleId = React.useId();

  const workoutSets = useFitnessStore(
    useShallow(s => s.workoutSets.map(ws => ({ exerciseId: ws.exerciseId, updatedAt: ws.updatedAt }))),
  );

  useModalBackHandler(isOpen, onClose);

  const recentExercises = getRecentExercises(workoutSets);
  const isCardioTab = selectedCategory === 'cardio';

  const filteredExercises = (() => {
    const query = searchQuery.toLowerCase().trim();
    const equipSet = selectedEquipment;

    return allExercises.filter(exercise => {
      if (!matchesCategoryTab(exercise, selectedCategory)) return false;

      if (!isCardioTab && selectedMuscleGroup !== 'all' && exercise.muscleGroup !== selectedMuscleGroup) {
        return false;
      }

      if (!isCardioTab && equipSet.size > 0 && !exercise.equipment.some(eq => equipSet.has(eq))) {
        return false;
      }

      return matchesSearch(exercise, query);
    });
  })();

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleChipClick = (group: MuscleGroup | 'all') => {
    setSelectedMuscleGroup(group);
  };

  const handleCategoryClick = (tab: CategoryTab) => {
    setSelectedCategory(tab);
    if (tab === 'cardio') {
      setSelectedMuscleGroup('all');
      setSelectedEquipment(new Set());
    }
  };

  const handleEquipmentToggle = (eq: EquipmentType) => {
    setSelectedEquipment(prev => {
      const next = new Set(prev);
      if (next.has(eq)) {
        next.delete(eq);
      } else {
        next.add(eq);
      }
      return next;
    });
  };

  const openCustomModal = () => {
    setShowCustomModal(true);
  };

  const closeCustomModal = () => {
    setShowCustomModal(false);
  };

  const handleSaveCustomExercise = (data: CustomExerciseFormData) => {
    const customExercise: Exercise = {
      id: generateUUID(),
      nameVi: data.name,
      nameEn: data.name,
      muscleGroup: (data.muscleGroup || 'chest') as MuscleGroup,
      secondaryMuscles: [],
      category: data.category as ExerciseCategory,
      equipment: data.equipment ? ([data.equipment] as Exercise['equipment']) : [],
      contraindicated: [],
      exerciseType: 'strength' as ExerciseType,
      defaultRepsMin: 8,
      defaultRepsMax: 12,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };
    onSelect(customExercise);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalBackdrop
      onClose={onClose}
      zIndex="z-60"
      mobileLayout="sheet"
      ariaLabelledBy={titleId}
      allowSwipeToDismiss={!isSearchFocused && !showCustomModal}
    >
      <div
        data-testid="exercise-selector-sheet"
        className="bg-card relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="px-4 pb-2 text-center">
          <h2 id={titleId} data-testid="exercise-selector-title" className="text-foreground text-xl font-semibold">
            {t('fitness.exerciseSelector.title')}
          </h2>
        </div>

        {/* Search */}
        <div data-testid="exercise-selector-search-region" className="bg-card shrink-0 px-4 pb-3">
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
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label={t('fitness.exerciseSelector.search')}
              maxLength={100}
              className="focus:ring-ring bg-muted text-foreground placeholder:text-muted-foreground min-h-12 w-full rounded-xl border-none py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div data-testid="exercise-category-tabs" className="bg-card shrink-0 overflow-x-auto px-4 pb-2">
          <div className="flex min-w-max gap-2">
            {(['all', 'compound', 'isolation', 'cardio'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                data-testid={`category-tab-${tab}`}
                onClick={() => handleCategoryClick(tab)}
                className={`${chipBase} ${selectedCategory === tab ? chipActive : chipInactive}`}
              >
                {t(CATEGORY_TAB_I18N[tab])}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips area */}
        <div data-testid="exercise-selector-chip-region" className="bg-card shrink-0 space-y-2 px-4 pb-3">
          {/* Muscle group chips — hidden on cardio tab */}
          {!isCardioTab && (
            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-2" data-testid="muscle-group-chips">
                <button
                  type="button"
                  onClick={() => handleChipClick('all')}
                  className={`${chipBase} ${selectedMuscleGroup === 'all' ? chipActive : chipInactive}`}
                >
                  {t('fitness.exerciseSelector.all')}
                </button>
                {MUSCLE_GROUPS.map(group => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => handleChipClick(group)}
                    className={`${chipBase} ${selectedMuscleGroup === group ? chipActive : chipInactive}`}
                  >
                    {t(MUSCLE_GROUP_I18N_KEYS[group])}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Equipment chips — hidden on cardio tab */}
          {!isCardioTab && (
            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-2" data-testid="equipment-chips">
                {EQUIPMENT_TYPES.map(eq => (
                  <button
                    key={eq}
                    type="button"
                    data-testid={`equipment-chip-${eq}`}
                    onClick={() => handleEquipmentToggle(eq)}
                    className={`${chipBase} ${selectedEquipment.has(eq) ? chipActive : chipInactive}`}
                  >
                    {EQUIPMENT_DISPLAY[eq] ?? eq}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Exercise list */}
        <div data-testid="exercise-selector-list-region" className="flex-1 overflow-y-auto px-4 pb-3">
          {/* Recently used section */}
          {recentExercises.length > 0 && !searchQuery.trim() && (
            <div data-testid="recently-used-section" className="mb-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Clock className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {t('fitness.exerciseSelector.recentlyUsed')}
                </h3>
              </div>
              <ul className="divide-border divide-y">
                {recentExercises.map(exercise => (
                  <li key={`recent-${exercise.id}`}>
                    <button
                      type="button"
                      data-testid={`recent-exercise-${exercise.id}`}
                      onClick={() => handleSelect(exercise)}
                      className="focus-visible:ring-ring hover:bg-accent focus-visible:ring-offset-2/50 min-h-12 w-full rounded-lg px-2 py-3 text-left transition-all focus-visible:ring-2 active:scale-[0.98]"
                    >
                      <p className="text-foreground text-sm font-medium">{exercise.nameVi}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {t(MUSCLE_GROUP_I18N_KEYS[exercise.muscleGroup] ?? '')}
                        </span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-primary text-xs font-medium">
                          {t(CATEGORY_I18N_KEYS[exercise.category])}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main exercise list or empty state */}
          {filteredExercises.length === 0 ? (
            <div data-testid="exercise-empty-state" className="flex flex-col items-center justify-center py-12">
              <div className="bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                <Search className="text-muted-foreground h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-foreground text-sm font-medium">
                {searchQuery.trim()
                  ? t('emptyState.exerciseSearchNoResults', { query: searchQuery.trim() })
                  : t('emptyState.exerciseFilterNoResults')}
              </p>
              <p className="text-muted-foreground mt-1 max-w-xs text-center text-xs">
                {t('emptyState.exerciseNoResultsHint')}
              </p>
              <button
                type="button"
                data-testid="empty-state-create-exercise"
                onClick={openCustomModal}
                className="text-primary mt-3 min-h-12 rounded-lg px-4 py-2 text-sm font-medium active:scale-[0.98]"
              >
                {t('fitness.exerciseSelector.createNewExercise')}
              </button>
            </div>
          ) : (
            <ul className="divide-border divide-y">
              {filteredExercises.map(exercise => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    data-testid={`exercise-item-${exercise.id}`}
                    onClick={() => handleSelect(exercise)}
                    className="focus-visible:ring-ring hover:bg-accent focus-visible:ring-offset-2/50 min-h-12 w-full rounded-lg px-2 py-3 text-left transition-all focus-visible:ring-2 active:scale-[0.98]"
                  >
                    <p className="text-foreground text-sm font-medium">{exercise.nameVi}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {t(MUSCLE_GROUP_I18N_KEYS[exercise.muscleGroup] ?? '')}
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

        <div className="pb-safe border-border shrink-0 border-t px-4 py-3">
          <button
            type="button"
            onClick={openCustomModal}
            className="focus-visible:ring-ring border-border text-muted-foreground flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
            data-testid="add-custom-exercise"
          >
            <Plus className="h-4 w-4" />
            {t('fitness.exerciseSelector.addCustom')}
          </button>
        </div>

        <CustomExerciseModal isOpen={showCustomModal} onClose={closeCustomModal} onSave={handleSaveCustomExercise} />
      </div>
    </ModalBackdrop>
  );
}

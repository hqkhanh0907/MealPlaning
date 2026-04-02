import { ChevronLeft, Dumbbell, Heart, Zap } from 'lucide-react';
import React, { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'] as const;

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStrength: (muscleGroups: string[]) => void;
  onSelectCardio: () => void;
  onSelectFreestyle: () => void;
  currentSessionCount: number;
}

function AddSessionModalInner({
  isOpen,
  onClose,
  onSelectStrength,
  onSelectCardio,
  onSelectFreestyle,
  currentSessionCount,
}: Readonly<AddSessionModalProps>): React.JSX.Element | null {
  const { t } = useTranslation();
  const [step, setStep] = useState<'options' | 'muscle-groups'>('options');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const isMaxReached = currentSessionCount >= 3;

  const handleStrengthClick = useCallback(() => {
    setStep('muscle-groups');
    setSelectedGroups([]);
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setSelectedGroups(prev => (prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]));
  }, []);

  const handleCreateStrength = useCallback(() => {
    if (selectedGroups.length > 0) {
      onSelectStrength(selectedGroups);
    }
  }, [selectedGroups, onSelectStrength]);

  const handleBack = useCallback(() => setStep('options'), []);

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative w-full rounded-t-3xl bg-white p-6 sm:mx-auto sm:max-w-md sm:rounded-2xl dark:bg-slate-800">
        {step === 'options' && (
          <>
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('fitness.plan.addSession')}
            </h3>
            {isMaxReached && (
              <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">{t('fitness.plan.maxSessions')}</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={isMaxReached}
                onClick={handleStrengthClick}
                className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-left transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40"
              >
                <Dumbbell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    {t('fitness.plan.strengthOption')}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('fitness.plan.strengthDesc')}</p>
                </div>
              </button>

              <button
                type="button"
                disabled={isMaxReached}
                onClick={onSelectCardio}
                className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-left transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
              >
                <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    {t('fitness.plan.cardioOption')}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('fitness.plan.cardioDesc')}</p>
                </div>
              </button>

              <button
                type="button"
                disabled={isMaxReached}
                onClick={onSelectFreestyle}
                className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-left transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-900/20 dark:hover:bg-amber-900/40"
              >
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    {t('fitness.plan.freestyleOption')}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">{t('fitness.plan.freestyleDesc')}</p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 'muscle-groups' && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                aria-label={t('common.back')}
                className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t('fitness.plan.selectMuscleGroups')}
              </h3>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(group => {
                const isSelected = selectedGroups.includes(group);
                return (
                  <button
                    key={group}
                    type="button"
                    aria-label={group}
                    aria-pressed={isSelected}
                    onClick={() => toggleGroup(group)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {group}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              data-testid="create-strength-session"
              disabled={selectedGroups.length === 0}
              onClick={handleCreateStrength}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              {t('fitness.plan.createSession')}
            </button>
          </>
        )}
      </div>
    </ModalBackdrop>
  );
}

export const AddSessionModal = memo(AddSessionModalInner);
AddSessionModal.displayName = 'AddSessionModal';

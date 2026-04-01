import { useState, useMemo, useCallback } from 'react';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import { analyzeActivityLevel } from '../utils/activityMultiplier';
import type { ActivityAnalysis } from '../utils/activityMultiplier';

interface UseActivityMultiplierReturn {
  analysis: ActivityAnalysis | null;
  isLoading: boolean;
  applySuggestion: () => void;
  dismissSuggestion: () => void;
}

export function useActivityMultiplier(): UseActivityMultiplierReturn {
  const workouts = useFitnessStore((state) => state.workouts);
  const workoutSets = useFitnessStore((state) => state.workoutSets);
  const profile = useHealthProfileStore((state) => state.profile);

  const [dismissed, setDismissed] = useState(false);

  const analysis = useMemo<ActivityAnalysis | null>(() => {
    if (workouts.length === 0) return null;
    return analyzeActivityLevel(
      workouts,
      workoutSets,
      profile.activityLevel,
    );
  }, [workouts, workoutSets, profile.activityLevel]);

  const applySuggestion = useCallback(() => {
    if (!analysis?.needsAdjustment) return;
    const currentProfile = useHealthProfileStore.getState().profile;
    useHealthProfileStore.setState({
      profile: {
        ...currentProfile,
        activityLevel: analysis.suggestedLevel,
      },
    });
  }, [analysis]);

  const dismissSuggestion = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    analysis: dismissed ? null : analysis,
    isLoading: false,
    applySuggestion,
    dismissSuggestion,
  };
}

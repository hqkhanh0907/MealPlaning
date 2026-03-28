import type { DatabaseService } from './databaseService';

export async function reloadAllStores(db: DatabaseService): Promise<void> {
  const [
    { useIngredientStore },
    { useDishStore },
    { useDayPlanStore },
    { useMealTemplateStore },
    { useHealthProfileStore },
    { useFitnessStore },
  ] = await Promise.all([
    import('../store/ingredientStore'),
    import('../store/dishStore'),
    import('../store/dayPlanStore'),
    import('../store/mealTemplateStore'),
    import('../features/health-profile/store/healthProfileStore'),
    import('../store/fitnessStore'),
  ]);

  await Promise.all([
    useIngredientStore.getState().loadAll(db),
    useDishStore.getState().loadAll(db),
    useDayPlanStore.getState().loadAll(db),
    useMealTemplateStore.getState().loadAll(db),
    useHealthProfileStore.getState().loadProfile(db),
    useFitnessStore.getState().initializeFromSQLite(db),
  ]);
}

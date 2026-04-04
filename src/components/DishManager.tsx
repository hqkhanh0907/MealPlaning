import { Apple, ChefHat, Copy, Edit3, GitCompareArrows, Trash2, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNotification } from '../contexts/NotificationContext';
import type { BaseSortOption } from '../data/constants';
import {
  getBaseSortOptions,
  getMealTagOptions,
  getTagShortLabels,
  MEAL_TYPE_ICONS,
  UNDO_TOAST_DURATION_MS,
} from '../data/constants';
import { useItemModalFlow } from '../hooks/useItemModalFlow';
import { useListManager } from '../hooks/useListManager';
import { Dish, Ingredient, MealType, NutritionInfo, SupportedLang } from '../types';
import { generateUUID } from '../utils/helpers';
import { getLocalizedField } from '../utils/localize';
import { calculateDishNutrition } from '../utils/nutrition';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { DishEditModal } from './modals/DishEditModal';
import { DetailModal } from './shared/DetailModal';
import { EmptyState } from './shared/EmptyState';
import { ListToolbar } from './shared/ListToolbar';

type DishSortOption = BaseSortOption | 'ing-asc' | 'ing-desc' | 'rating-asc' | 'rating-desc';

interface DishManagerProps {
  dishes: Dish[];
  ingredients: Ingredient[];
  onAdd: (dish: Dish) => void;
  onUpdate: (dish: Dish) => void;
  onDelete: (id: string) => void;
  isUsed: (id: string) => boolean;
  onCreateIngredient?: (ing: Ingredient) => void;
}

const ZERO_NUTRITION: NutritionInfo = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export const DishManager = ({
  dishes,
  ingredients,
  onAdd,
  onUpdate,
  onDelete,
  isUsed,
  onCreateIngredient,
}: DishManagerProps) => {
  const notify = useNotification();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const tagLabels = getTagShortLabels(t);
  const mealTagOptions = getMealTagOptions(t);
  const dishSortOptions: { value: DishSortOption; label: string }[] = [
    ...getBaseSortOptions(t),
    { value: 'ing-asc', label: t('sort.ingredientCountAsc') },
    { value: 'ing-desc', label: t('sort.ingredientCountDesc') },
    { value: 'rating-desc', label: t('sort.ratingDesc') },
    { value: 'rating-asc', label: t('sort.ratingAsc') },
  ];

  const [filterTag, setFilterTag] = useState<MealType | null>(null);

  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const MAX_COMPARE = 3;
  const toggleCompare = useCallback(
    (id: string) => {
      setCompareIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < MAX_COMPARE) {
          next.add(id);
        } else {
          notify.warning(t('dish.maxCompare'));
          return prev;
        }
        return next;
      });
    },
    [notify, t],
  );

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    dishId: string | null;
    dishName: string;
  }>({ isOpen: false, dishId: null, dishName: '' });

  // --- Shared hooks ---
  const modal = useItemModalFlow<Dish>();

  const searchFn = useCallback((d: Dish, q: string) => {
    const ql = q.toLowerCase();
    return Object.values(d.name).some(n => n.toLowerCase().includes(ql));
  }, []);

  // Pre-compute nutrition once per dishes/ingredients change — avoids O(N log N) recalculation in sort comparator
  const nutritionMap = useMemo(() => {
    const map = new Map<string, NutritionInfo>();
    for (const dish of dishes) {
      map.set(dish.id, calculateDishNutrition(dish, ingredients));
    }
    return map;
  }, [dishes, ingredients]);

  const sortFn = useCallback(
    (a: Dish, b: Dish, s: DishSortOption) => {
      const nA = nutritionMap.get(a.id) ?? ZERO_NUTRITION;
      const nB = nutritionMap.get(b.id) ?? ZERO_NUTRITION;
      switch (s) {
        case 'name-asc':
          return getLocalizedField(a.name, lang).localeCompare(getLocalizedField(b.name, lang));
        case 'name-desc':
          return getLocalizedField(b.name, lang).localeCompare(getLocalizedField(a.name, lang));
        case 'cal-asc':
          return nA.calories - nB.calories;
        case 'cal-desc':
          return nB.calories - nA.calories;
        case 'pro-asc':
          return nA.protein - nB.protein;
        case 'pro-desc':
          return nB.protein - nA.protein;
        case 'ing-asc':
          return a.ingredients.length - b.ingredients.length;
        case 'ing-desc':
          return b.ingredients.length - a.ingredients.length;
        case 'rating-asc':
          return (a.rating ?? 0) - (b.rating ?? 0);
        case 'rating-desc':
          return (b.rating ?? 0) - (a.rating ?? 0);
      }
    },
    [nutritionMap, lang],
  );
  const extraFilter = useCallback((d: Dish) => !filterTag || (d.tags?.includes(filterTag) ?? false), [filterTag]);

  const list = useListManager<Dish, DishSortOption>({
    items: dishes,
    searchFn,
    sortFn,
    defaultSort: 'name-asc',
    extraFilter,
  });

  // --- Domain handlers ---
  const handleDishSubmit = useCallback(
    (dish: Dish) => {
      if (modal.editingItem) onUpdate(dish);
      else onAdd(dish);
      modal.afterSubmit(dish);
    },
    [modal, onAdd, onUpdate],
  );

  const handleEditClose = useCallback(() => {
    modal.closeEdit(false);
  }, [modal]);

  const handleDelete = (id: string, dname: string) => {
    if (isUsed(id)) {
      notify.warning(t('dish.cannotDelete'), t('dish.usedInPlan'));
      return;
    }
    setDeleteConfirmation({ isOpen: true, dishId: id, dishName: dname });
  };

  const confirmDelete = () => {
    const dishId = deleteConfirmation.dishId;
    if (!dishId) return;
    const deleted = dishes.find(d => d.id === dishId);
    onDelete(dishId);
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    if (deleted) {
      const displayName = getLocalizedField(deleted.name, lang);
      notify.info(t('dish.deleted'), t('dish.deletedDesc', { name: displayName }), {
        duration: UNDO_TOAST_DURATION_MS,
        action: {
          label: t('common.undo'),
          onClick: () => {
            onAdd(deleted);
            notify.success(t('common.undone'), t('dish.restoredDesc', { name: displayName }));
          },
        },
      });
    }
  };

  const handleClone = useCallback(
    (dish: Dish) => {
      const suffix = t('dish.copySuffix');
      const cloned: Dish = {
        ...dish,
        id: generateUUID(),
        name: Object.fromEntries(Object.entries(dish.name).map(([k, v]) => [k, `${v} ${suffix}`])) as Dish['name'],
        ingredients: dish.ingredients.map(si => ({ ...si })),
        tags: dish.tags ? [...dish.tags] : [],
      };
      onAdd(cloned);
      const displayName = getLocalizedField(dish.name, lang);
      notify.success(t('dish.cloned'), t('dish.clonedDesc', { name: displayName }));
    },
    [t, onAdd, lang, notify],
  );

  // --- Render helpers ---
  const emptyIcon = <ChefHat className="text-primary/40 h-8 w-8" />;

  return (
    <div data-testid="dish-manager" className="space-y-6">
      <ListToolbar
        searchQuery={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('dish.searchPlaceholder')}
        sortOptions={dishSortOptions}
        sortBy={list.sortBy}
        onSortChange={v => list.setSortBy(v as DishSortOption)}
        viewLayout={list.viewLayout}
        onLayoutChange={list.setViewLayout}
        onAdd={() => modal.openEdit()}
        addLabel={t('dish.addNew')}
        searchTestId="input-search-dish"
        addTestId="btn-add-dish"
        sortTestId="select-sort-dish"
      >
        {/* Tag filter chips */}
        <div className="scrollbar-hide -mt-2 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterTag(null)}
            data-testid="btn-filter-all-dishes"
            aria-pressed={!filterTag}
            className={`focus-visible:ring-ring min-h-11 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:outline-none ${filterTag ? 'bg-muted text-muted-foreground hover:bg-accent' : 'bg-primary text-primary-foreground'}`}
          >
            {t('common.all')} ({dishes.length})
          </button>
          {mealTagOptions.map(({ type, label, icon: TagIcon }) => {
            const count = dishes.filter(d => d.tags?.includes(type)).length;
            return (
              <button
                key={type}
                onClick={() => setFilterTag(filterTag === type ? null : type)}
                data-testid={`btn-filter-${type}`}
                aria-pressed={filterTag === type}
                className={`focus-visible:ring-ring inline-flex min-h-11 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:outline-none ${filterTag === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
              >
                <TagIcon className="size-3.5" aria-hidden="true" /> {label} ({count})
              </button>
            );
          })}
        </div>
      </ListToolbar>

      {/* Grid View */}
      {list.viewLayout === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.filteredItems.map(dish => {
            const nutrition = nutritionMap.get(dish.id) ?? ZERO_NUTRITION;
            return (
              <div
                key={dish.id}
                className={`group bg-card relative flex w-full flex-col rounded-2xl border p-5 text-left shadow-sm transition-all hover:shadow-md ${compareIds.has(dish.id) ? 'border-blue-400 ring-2 ring-blue-100 dark:border-blue-500 dark:ring-blue-900/50' : 'border-border-subtle'}`}
              >
                <button
                  data-testid={`btn-compare-${dish.id}`}
                  onClick={() => toggleCompare(dish.id)}
                  className={`focus-visible:ring-ring absolute top-3 right-3 z-10 flex h-7 min-h-11 w-7 min-w-11 items-center justify-center rounded-lg border-2 transition-all focus-visible:ring-2 focus-visible:outline-none ${compareIds.has(dish.id) ? 'border-blue-500 bg-blue-500 text-white' : 'border-border text-transparent hover:border-blue-400 hover:text-blue-400'}`}
                  aria-label={t('dish.compare')}
                >
                  <GitCompareArrows className="h-4 w-4" />
                </button>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-primary bg-primary-subtle flex h-10 w-10 items-center justify-center rounded-xl">
                      <ChefHat className="h-5 w-5" />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => modal.openView(dish)}
                        className="focus-visible:ring-ring text-foreground cursor-pointer rounded text-left text-lg font-bold after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      >
                        {getLocalizedField(dish.name, lang)}
                      </button>
                      <p className="text-muted-foreground text-xs font-medium">
                        {dish.ingredients.length} {t('dish.ingredients')}
                      </p>
                      {dish.tags && dish.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {dish.tags.map(tag => {
                            const TagIcon = MEAL_TYPE_ICONS[tag];
                            return (
                              <span
                                key={tag}
                                className="text-muted-foreground bg-muted inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold"
                              >
                                {TagIcon && <TagIcon className="size-3" aria-hidden="true" />}
                                {tagLabels[tag]}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {dish.rating && dish.rating > 0 && (
                  <div className="mb-2 flex items-center gap-0.5" data-testid={`dish-rating-${dish.id}`}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={`text-sm ${s <= dish.rating! ? 'text-amber-400' : 'text-muted'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                )}
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="bg-primary-subtle flex items-center justify-between rounded-lg p-2">
                    <span className="text-primary text-xs font-bold uppercase">{t('common.calories')}</span>
                    <span className="text-primary-emphasis text-sm font-bold">{Math.round(nutrition.calories)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                    <span className="text-macro-protein text-xs font-bold uppercase">{t('common.protein')}</span>
                    <span className="text-macro-protein text-sm font-bold">{Math.round(nutrition.protein)}g</span>
                  </div>
                </div>
                <div className="border-border relative z-10 mt-auto flex items-center gap-4 border-t pt-4">
                  <button
                    data-testid={`btn-clone-dish-${dish.id}`}
                    onClick={() => handleClone(dish)}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-all focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Copy className="h-4 w-4" /> {t('dish.clone')}
                  </button>
                  <button
                    data-testid={`btn-edit-dish-${dish.id}`}
                    onClick={() => modal.openEdit(dish)}
                    className="text-muted-foreground hover:bg-primary-subtle hover:text-primary focus-visible:ring-ring flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-all focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Edit3 className="h-4 w-4" /> {t('common.edit')}
                  </button>
                  <button
                    data-testid={`btn-delete-dish-${dish.id}`}
                    onClick={() => handleDelete(dish.id, getLocalizedField(dish.name, lang))}
                    disabled={isUsed(dish.id)}
                    className={`focus-visible:ring-ring flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-all focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${isUsed(dish.id) ? 'dark:text-muted-foreground text-muted-foreground' : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'}`}
                  >
                    <Trash2 className="h-4 w-4" /> {t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })}
          {list.filteredItems.length === 0 && (
            <EmptyState
              icon={emptyIcon}
              searchQuery={list.searchQuery}
              entityName={t('dish.title').toLowerCase()}
              actionLabel={t('dish.addNew')}
              onAction={() => modal.openEdit()}
              className="col-span-full"
            />
          )}
        </div>
      )}

      {/* List View */}
      {list.viewLayout === 'list' && (
        <div className="bg-card border-border-subtle overflow-hidden rounded-2xl border shadow-sm">
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full">
              <thead className="border-border-subtle bg-muted border-b">
                <tr>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold uppercase">
                    {t('dish.title')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold uppercase">
                    {t('dish.tags')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold uppercase">
                    {t('common.calories')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold uppercase">
                    {t('common.protein')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold uppercase">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {list.filteredItems.map(dish => {
                  const nutrition = nutritionMap.get(dish.id) ?? ZERO_NUTRITION;
                  return (
                    <tr
                      key={dish.id}
                      className={`transition-colors ${compareIds.has(dish.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-accent'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            data-testid={`btn-compare-${dish.id}`}
                            onClick={() => toggleCompare(dish.id)}
                            className={`focus-visible:ring-ring flex h-6 min-h-11 w-6 min-w-11 shrink-0 items-center justify-center rounded border-2 transition-all focus-visible:ring-2 focus-visible:outline-none ${compareIds.has(dish.id) ? 'border-blue-500 bg-blue-500 text-white' : 'border-border text-transparent hover:border-blue-400'}`}
                            aria-label={t('dish.compare')}
                          >
                            <GitCompareArrows className="h-4 w-4" />
                          </button>
                          <div className="text-primary bg-primary-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                            <ChefHat className="h-4 w-4" />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => modal.openView(dish)}
                              className="hover:text-primary text-foreground focus-visible:ring-ring cursor-pointer text-left font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                              {getLocalizedField(dish.name, lang)}
                            </button>
                            <p className="text-muted-foreground text-xs">
                              {dish.ingredients.length} {t('dish.ingredients')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {dish.tags?.map(tag => {
                            const TagIcon = MEAL_TYPE_ICONS[tag];
                            return (
                              <span
                                key={tag}
                                className="text-muted-foreground bg-muted inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold"
                              >
                                {TagIcon && <TagIcon className="size-3" aria-hidden="true" />}
                                {tagLabels[tag]}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-foreground font-bold">{Math.round(nutrition.calories)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-macro-protein font-bold">{Math.round(nutrition.protein)}g</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            data-testid={`btn-clone-dish-${dish.id}`}
                            onClick={() => handleClone(dish)}
                            aria-label={`${t('common.clone')} ${getLocalizedField(dish.name, lang)}`}
                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-all focus-visible:ring-2 focus-visible:outline-none"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            data-testid={`btn-edit-dish-${dish.id}`}
                            onClick={() => modal.openEdit(dish)}
                            aria-label={`${t('common.edit')} ${getLocalizedField(dish.name, lang)}`}
                            className="hover:bg-primary-subtle text-muted-foreground hover:text-primary focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-all focus-visible:ring-2 focus-visible:outline-none"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            data-testid={`btn-delete-dish-${dish.id}`}
                            onClick={() => handleDelete(dish.id, getLocalizedField(dish.name, lang))}
                            disabled={isUsed(dish.id)}
                            aria-label={`${t('common.delete')} ${getLocalizedField(dish.name, lang)}`}
                            className={`focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-all focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${isUsed(dish.id) ? 'text-muted-foreground' : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile List */}
          <div className="divide-border divide-y sm:hidden">
            {list.filteredItems.map(dish => {
              const nutrition = nutritionMap.get(dish.id) ?? ZERO_NUTRITION;
              return (
                <div
                  key={dish.id}
                  className={`relative flex w-full items-center justify-between gap-3 p-4 text-left transition-colors ${compareIds.has(dish.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'active:bg-muted'}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                      data-testid={`btn-compare-${dish.id}`}
                      onClick={() => toggleCompare(dish.id)}
                      className={`focus-visible:ring-ring relative z-10 flex h-7 min-h-11 w-7 min-w-11 shrink-0 items-center justify-center rounded-lg border-2 transition-all focus-visible:ring-2 focus-visible:outline-none ${compareIds.has(dish.id) ? 'border-blue-500 bg-blue-500 text-white' : 'border-border text-transparent hover:border-blue-400'}`}
                      aria-label={t('dish.compare')}
                    >
                      <GitCompareArrows className="h-3.5 w-3.5" />
                    </button>
                    <div className="text-primary bg-primary-subtle flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <ChefHat className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => modal.openView(dish)}
                        className="focus-visible:ring-ring text-foreground cursor-pointer truncate rounded text-left font-bold after:absolute after:inset-0 focus:outline-none focus-visible:ring-2"
                      >
                        {getLocalizedField(dish.name, lang)}
                      </button>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span>{Math.round(nutrition.calories)} kcal</span>
                        <span className="text-macro-protein">{Math.round(nutrition.protein)}g Pro</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 flex shrink-0 items-center gap-3">
                    <button
                      data-testid={`btn-clone-dish-${dish.id}`}
                      onClick={() => handleClone(dish)}
                      aria-label={`${t('common.clone')} ${getLocalizedField(dish.name, lang)}`}
                      className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2.5 transition-all focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      data-testid={`btn-edit-dish-${dish.id}`}
                      onClick={() => modal.openEdit(dish)}
                      aria-label={`${t('common.edit')} ${getLocalizedField(dish.name, lang)}`}
                      className="hover:bg-primary-subtle text-muted-foreground hover:text-primary focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2.5 transition-all focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      data-testid={`btn-delete-dish-${dish.id}`}
                      onClick={() => handleDelete(dish.id, getLocalizedField(dish.name, lang))}
                      disabled={isUsed(dish.id)}
                      aria-label={`${t('common.delete')} ${getLocalizedField(dish.name, lang)}`}
                      className={`focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2.5 transition-all focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${isUsed(dish.id) ? 'text-muted-foreground' : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {list.filteredItems.length === 0 && (
            <EmptyState
              icon={emptyIcon}
              searchQuery={list.searchQuery}
              entityName={t('dish.title').toLowerCase()}
              actionLabel={t('dish.addNew')}
              onAction={() => modal.openEdit()}
            />
          )}
        </div>
      )}

      {/* View Detail Modal */}
      {modal.viewingItem &&
        (() => {
          const dish = modal.viewingItem;
          const nutrition = nutritionMap.get(dish.id) ?? ZERO_NUTRITION;
          return (
            <DetailModal
              title={t('dish.detail')}
              editLabel={t('dish.editDish')}
              onClose={modal.closeView}
              onEdit={() => modal.openEditFromView(dish)}
            >
              <div className="flex items-center gap-4">
                <div className="text-primary bg-primary-subtle flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                  <ChefHat className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-foreground text-xl font-bold">{getLocalizedField(dish.name, lang)}</h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    {dish.ingredients.length} {t('dish.ingredients')}
                  </p>
                  {dish.tags && dish.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {dish.tags.map(tag => {
                        const TagIcon = MEAL_TYPE_ICONS[tag];
                        return (
                          <span
                            key={tag}
                            className="bg-primary-subtle text-primary inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold"
                          >
                            {TagIcon && <TagIcon className="size-3.5" aria-hidden="true" />}
                            {tagLabels[tag]}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary-subtle rounded-xl p-3.5">
                  <p className="text-primary mb-1 text-xs font-bold uppercase">{t('common.calories')}</p>
                  <p className="text-primary-emphasis text-xl font-bold">
                    {Math.round(nutrition.calories)} <span className="text-primary text-xs font-medium">kcal</span>
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3.5 dark:bg-blue-900/30">
                  <p className="text-macro-protein mb-1 text-xs font-bold uppercase">{t('common.protein')}</p>
                  <p className="text-macro-protein text-xl font-bold">
                    {Math.round(nutrition.protein)}
                    <span className="text-macro-protein text-xs font-medium">g</span>
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3.5 dark:bg-amber-900/30">
                  <p className="text-macro-carbs mb-1 text-xs font-bold uppercase">{t('common.carbs')}</p>
                  <p className="text-macro-carbs text-xl font-bold">
                    {Math.round(nutrition.carbs)}
                    <span className="text-macro-carbs text-xs font-medium">g</span>
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3.5 dark:bg-rose-900/30">
                  <p className="text-macro-fat mb-1 text-xs font-bold uppercase">{t('common.fat')}</p>
                  <p className="text-macro-fat text-xl font-bold">
                    {Math.round(nutrition.fat)}
                    <span className="text-macro-fat text-xs font-medium">g</span>
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase">{t('dish.ingredientList')}</p>
                <div className="space-y-2">
                  {dish.ingredients.map(si => {
                    const ing = ingredients.find(i => i.id === si.ingredientId);
                    if (!ing) return null;
                    return (
                      <div
                        key={si.ingredientId}
                        className="bg-muted flex items-center justify-between rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-primary border-border-subtle bg-muted flex h-8 w-8 items-center justify-center rounded-lg border">
                            <Apple className="h-4 w-4" />
                          </div>
                          <span className="text-foreground text-sm font-medium">
                            {getLocalizedField(ing.name, lang)}
                          </span>
                        </div>
                        <span className="text-foreground-secondary text-sm font-bold">
                          {si.amount} {getLocalizedField(ing.unit, lang)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DetailModal>
          );
        })()}

      {/* Edit Modal */}
      {modal.isEditOpen && (
        <DishEditModal
          editingItem={modal.editingItem}
          ingredients={ingredients}
          allDishes={dishes}
          onSubmit={handleDishSubmit}
          onClose={handleEditClose}
          onCreateIngredient={onCreateIngredient}
        />
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        variant="danger"
        title={t('dish.confirmDelete')}
        message={
          <p>
            {t('dish.confirmDeleteMsg')}{' '}
            <span className="text-foreground font-bold">&quot;{deleteConfirmation.dishName}&quot;</span>
            ?<br />
            {t('common.cannotUndo')}
          </p>
        }
        confirmLabel={t('common.deleteNow')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
      />

      {/* Floating Compare Button */}
      {compareIds.size >= 2 && !showCompare && (
        <button
          data-testid="btn-open-compare"
          onClick={() => setShowCompare(true)}
          className="bg-primary text-primary-foreground hover:bg-primary-emphasis focus-visible:ring-ring fixed right-4 bottom-24 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-lg transition-all focus-visible:ring-2 focus-visible:outline-none"
        >
          <GitCompareArrows className="h-5 w-5" />
          {t('dish.compareSelected', { count: compareIds.size })}
        </button>
      )}

      {/* Compare Panel */}
      {showCompare &&
        (() => {
          const compareDishes = dishes.filter(d => compareIds.has(d.id));
          const NUTRITION_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const;
          const NUTRITION_COLORS: Record<string, string> = {
            calories: 'text-foreground',
            protein: 'text-macro-protein',
            carbs: 'text-macro-carbs',
            fat: 'text-macro-fat',
            fiber: 'text-primary',
          };
          return (
            <dialog
              data-testid="compare-panel"
              open
              className="fixed inset-0 z-50 m-0 flex h-full w-full items-end justify-center border-none bg-black/50 bg-transparent p-0 sm:items-center"
              aria-label={t('dish.compareNutrition')}
            >
              <div className="fixed inset-0 bg-black/50" aria-hidden="true">
                <button
                  type="button"
                  className="focus-visible:ring-ring h-full w-full cursor-default border-none bg-transparent focus-visible:ring-2 focus-visible:outline-none"
                  onClick={() => setShowCompare(false)}
                  aria-label={t('common.closeBackdrop')}
                  data-testid="compare-backdrop"
                />
              </div>
              <div className="bg-card relative z-10 max-h-[80dvh] w-full overflow-y-auto rounded-t-2xl shadow-2xl sm:max-w-2xl sm:rounded-2xl">
                <div className="bg-card border-border-subtle sticky top-0 z-10 flex items-center justify-between border-b p-4">
                  <h3 className="text-foreground flex items-center gap-2 text-lg font-bold">
                    <GitCompareArrows className="h-5 w-5 text-blue-500" />
                    {t('dish.compareNutrition')}
                  </h3>
                  <button
                    onClick={() => setShowCompare(false)}
                    className="hover:text-foreground-secondary text-muted-foreground focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-all focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={t('common.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-muted-foreground px-2 py-2 text-left text-xs font-semibold uppercase">
                          &nbsp;
                        </th>
                        {compareDishes.map(d => (
                          <th key={d.id} className="text-foreground px-2 py-2 text-center text-sm font-bold">
                            {getLocalizedField(d.name, lang)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {NUTRITION_KEYS.map(key => {
                        const values = compareDishes.map(d => {
                          const n = nutritionMap.get(d.id) ?? ZERO_NUTRITION;
                          return Math.round(n[key]);
                        });
                        const best = key === 'calories' ? Math.min(...values) : Math.max(...values);
                        return (
                          <tr key={key} className="border-border border-t">
                            <td className="text-muted-foreground px-2 py-2.5 text-xs font-semibold uppercase">
                              {t(`common.${key}`)}
                            </td>
                            {values.map((v, i) => (
                              <td key={compareDishes[i].id} className="px-2 py-2.5 text-center">
                                <span
                                  className={`text-lg font-bold ${NUTRITION_COLORS[key]} ${v === best ? 'underline decoration-blue-400 decoration-2' : ''}`}
                                >
                                  {v}
                                  {key === 'calories' ? '' : 'g'}
                                </span>
                                {key === 'calories' && (
                                  <span className="text-muted-foreground ml-0.5 text-xs">kcal</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </dialog>
          );
        })()}
    </div>
  );
};

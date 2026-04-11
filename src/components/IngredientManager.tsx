import { Apple, Edit3, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNotification } from '../contexts/NotificationContext';
import { BaseSortOption, getBaseSortOptions, UNDO_TOAST_DURATION_MS } from '../data/constants';
import { useItemModalFlow } from '../hooks/useItemModalFlow';
import { useListManager } from '../hooks/useListManager';
import { Dish, Ingredient, SupportedLang } from '../types';
import { getLocalizedField } from '../utils/localize';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { IngredientEditModal } from './modals/IngredientEditModal';
import { DetailModal } from './shared/DetailModal';
import { EmptyState } from './shared/EmptyState';
import { ListToolbar } from './shared/ListToolbar';
import { createSurfaceStateContract } from './shared/surfaceState';

interface IngredientManagerProps {
  ingredients: Ingredient[];
  dishes?: Dish[];
  onAdd: (ing: Ingredient) => void;
  onUpdate: (ing: Ingredient) => void;
  onDelete: (id: string) => void;
  isUsed: (id: string) => boolean;
}

const getDisplayUnit = (unit: Ingredient['unit'], lang: SupportedLang) => {
  const u = getLocalizedField(unit, lang).toLowerCase().trim();
  if (u === 'kg' || u === 'g') return '100g';
  if (u === 'l' || u === 'ml') return '100ml';
  return `1 ${getLocalizedField(unit, lang)}`;
};

export const IngredientManager = ({
  ingredients,
  dishes = [],
  onAdd,
  onUpdate,
  onDelete,
  isUsed,
}: IngredientManagerProps) => {
  const notify = useNotification();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    ingredientId: string | null;
    ingredientName: string;
  }>({ isOpen: false, ingredientId: null, ingredientName: '' });

  // --- Shared hooks ---
  const modal = useItemModalFlow<Ingredient>();

  const searchFn = useCallback((ing: Ingredient, q: string) => {
    const ql = q.toLowerCase();
    return Object.values(ing.name).some(n => n.toLowerCase().includes(ql));
  }, []);
  const sortFn = useCallback(
    (a: Ingredient, b: Ingredient, s: BaseSortOption) => {
      switch (s) {
        case 'name-asc':
          return getLocalizedField(a.name, lang).localeCompare(getLocalizedField(b.name, lang));
        case 'name-desc':
          return getLocalizedField(b.name, lang).localeCompare(getLocalizedField(a.name, lang));
        case 'cal-asc':
          return a.caloriesPer100 - b.caloriesPer100;
        case 'cal-desc':
          return b.caloriesPer100 - a.caloriesPer100;
        case 'pro-asc':
          return a.proteinPer100 - b.proteinPer100;
        case 'pro-desc':
          return b.proteinPer100 - a.proteinPer100;
      }
    },
    [lang],
  );

  const list = useListManager<Ingredient, BaseSortOption>({
    items: ingredients,
    searchFn,
    sortFn,
    defaultSort: 'name-asc',
  });

  // --- Domain helpers ---
  const getDishesUsingIngredient = (ingId: string): string[] =>
    dishes.filter(d => d.ingredients.some(di => di.ingredientId === ingId)).map(d => getLocalizedField(d.name, lang));

  // --- Domain handlers ---
  const handleSaveIngredient = useCallback(
    (ing: Ingredient) => {
      const isEdit = ingredients.some(i => i.id === ing.id);
      if (isEdit) onUpdate(ing);
      else onAdd(ing);
      modal.closeEdit(false);
    },
    [ingredients, onUpdate, onAdd, modal],
  );

  const handleDelete = (id: string, iname: string) => {
    if (isUsed(id)) {
      notify.warning(t('ingredient.cannotDelete'), t('ingredient.usedInDish'));
      return;
    }
    setDeleteConfirmation({ isOpen: true, ingredientId: id, ingredientName: iname });
  };

  const confirmDelete = () => {
    const ingredientId = deleteConfirmation.ingredientId;
    if (!ingredientId) return;
    const deleted = ingredients.find(i => i.id === ingredientId);
    onDelete(ingredientId);
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    if (deleted) {
      const displayName = getLocalizedField(deleted.name, lang);
      notify.info(t('ingredient.deleted'), t('ingredient.deletedDesc', { name: displayName }), {
        duration: UNDO_TOAST_DURATION_MS,
        action: {
          label: t('common.undo'),
          onClick: () => {
            onAdd(deleted);
            notify.success(t('common.undone'), t('ingredient.restoredDesc', { name: displayName }));
          },
        },
      });
    }
  };

  const renderUsedInDishes = (ingId: string) => {
    const usedIn = getDishesUsingIngredient(ingId);
    if (!usedIn.length) return null;
    return (
      <div className="text-muted-foreground mb-3 text-xs">
        <span className="font-medium">{t('ingredient.usedIn')} </span>
        <span className="text-foreground-secondary">
          {usedIn.length <= 2 ? usedIn.join(', ') : `${usedIn.slice(0, 2).join(', ')} +${usedIn.length - 2}`}
        </span>
      </div>
    );
  };

  // --- Render ---
  const hasSearchResultsGap = !!list.searchQuery;
  const emptyIngredientContract = hasSearchResultsGap
    ? createSurfaceStateContract({
        surface: 'library.ingredients',
        state: 'warning',
        copy: {
          title: t('library.ingredients.noResultsTitle'),
          missing: t('library.ingredients.noResultsMissing', { query: list.searchQuery }),
          reason: t('library.ingredients.noResultsReason'),
          nextStep: t('library.ingredients.noResultsNextStep'),
        },
        primaryAction: {
          label: t('library.ingredients.noResultsAction'),
          onAction: () => list.setSearchQuery(''),
        },
      })
    : createSurfaceStateContract({
        surface: 'library.ingredients',
        state: 'empty',
        copy: {
          title: t('library.ingredients.emptyTitle'),
          missing: t('library.ingredients.emptyMissing'),
          reason: t('library.ingredients.emptyReason'),
          nextStep: t('library.ingredients.emptyNextStep'),
        },
        primaryAction: {
          label: t('library.ingredients.emptyAction'),
          onAction: () => modal.openEdit(),
        },
      });

  return (
    <div className="space-y-6">
      <ListToolbar
        searchQuery={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('ingredient.searchPlaceholder')}
        sortOptions={getBaseSortOptions(t)}
        sortBy={list.sortBy}
        onSortChange={v => list.setSortBy(v as BaseSortOption)}
        viewLayout={list.viewLayout}
        onLayoutChange={list.setViewLayout}
        onAdd={() => modal.openEdit()}
        addLabel={t('ingredient.addNew')}
        searchTestId="input-search-ingredient"
        addTestId="btn-add-ingredient"
        sortTestId="select-sort-ingredient"
      />

      {/* Grid View */}
      {list.viewLayout === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.filteredItems.map(ing => (
            <div
              key={ing.id}
              className="group bg-card border-border-subtle relative flex w-full flex-col rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-primary bg-primary-subtle flex h-10 w-10 items-center justify-center rounded-xl">
                    <Apple className="h-5 w-5" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => modal.openView(ing)}
                      className="focus-visible:ring-ring text-foreground cursor-pointer rounded text-left text-lg font-semibold after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    >
                      {getLocalizedField(ing.name, lang)}
                    </button>
                    <p className="text-muted-foreground text-xs font-medium">{getDisplayUnit(ing.unit, lang)}</p>
                  </div>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="bg-muted flex items-center justify-between rounded-lg p-2">
                  <span className="text-muted-foreground text-xs font-semibold uppercase">{t('common.calories')}</span>
                  <span className="text-foreground text-sm font-semibold">{ing.caloriesPer100}</span>
                </div>
                <div className="bg-macro-carbs-subtle flex items-center justify-between rounded-lg p-2">
                  <span className="text-macro-protein text-xs font-semibold uppercase">{t('common.protein')}</span>
                  <span className="text-macro-protein text-sm font-semibold">{ing.proteinPer100}g</span>
                </div>
                <div className="bg-energy-subtle flex items-center justify-between rounded-lg p-2">
                  <span className="text-macro-carbs text-xs font-semibold uppercase">{t('common.carbs')}</span>
                  <span className="text-macro-carbs text-sm font-semibold">{ing.carbsPer100}g</span>
                </div>
                <div className="bg-rose-subtle flex items-center justify-between rounded-lg p-2">
                  <span className="text-macro-fat text-xs font-semibold uppercase">{t('common.fat')}</span>
                  <span className="text-macro-fat text-sm font-semibold">{ing.fatPer100}g</span>
                </div>
              </div>
              {renderUsedInDishes(ing.id)}
              <div className="border-border relative z-10 mt-auto flex items-center gap-4 border-t pt-4">
                <button
                  data-testid={`btn-edit-ingredient-${ing.id}`}
                  onClick={() => modal.openEdit(ing)}
                  className="text-muted-foreground hover:bg-primary-subtle hover:text-primary focus-visible:ring-ring flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Edit3 className="h-4 w-4" /> {t('common.edit')}
                </button>
                <button
                  data-testid={`btn-delete-ingredient-${ing.id}`}
                  onClick={() => handleDelete(ing.id, getLocalizedField(ing.name, lang))}
                  disabled={isUsed(ing.id)}
                  className={`focus-visible:ring-ring flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${isUsed(ing.id) ? 'dark:text-muted-foreground text-muted-foreground opacity-40' : 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive'}`}
                >
                  <Trash2 className="h-4 w-4" /> {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
          {list.filteredItems.length === 0 && (
            <EmptyState
              variant={hasSearchResultsGap ? 'compact' : 'hero'}
              icon={Apple}
              contract={emptyIngredientContract}
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
                    {t('ingredient.title')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold uppercase">
                    {t('common.calories')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold uppercase">
                    {t('common.protein')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold uppercase">
                    {t('common.carbs')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold uppercase">
                    {t('common.fat')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold uppercase">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {list.filteredItems.map(ing => (
                  <tr key={ing.id} className="hover:bg-accent transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="text-primary bg-primary-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                          <Apple className="h-4 w-4" />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => modal.openView(ing)}
                            className="hover:text-primary text-foreground focus-visible:ring-ring cursor-pointer text-left font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          >
                            {getLocalizedField(ing.name, lang)}
                          </button>
                          <p className="text-muted-foreground text-xs">{getDisplayUnit(ing.unit, lang)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-foreground font-semibold">{ing.caloriesPer100}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-macro-protein font-semibold">{ing.proteinPer100}g</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-macro-carbs font-semibold">{ing.carbsPer100}g</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-macro-fat font-semibold">{ing.fatPer100}g</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          data-testid={`btn-edit-ingredient-${ing.id}`}
                          onClick={() => modal.openEdit(ing)}
                          aria-label={`${t('common.edit')} ${getLocalizedField(ing.name, lang)}`}
                          className="hover:bg-primary-subtle text-muted-foreground hover:text-primary focus-visible:ring-ring rounded-lg p-2 transition-all focus-visible:ring-2 focus-visible:outline-none"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          data-testid={`btn-delete-ingredient-${ing.id}`}
                          onClick={() => handleDelete(ing.id, getLocalizedField(ing.name, lang))}
                          disabled={isUsed(ing.id)}
                          aria-label={`${t('common.delete')} ${getLocalizedField(ing.name, lang)}`}
                          className={`focus-visible:ring-ring rounded-lg p-2 transition-all focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${isUsed(ing.id) ? 'text-muted-foreground opacity-40' : 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-border divide-y sm:hidden">
            {list.filteredItems.map(ing => (
              <div
                key={ing.id}
                className="active:bg-muted relative flex w-full items-center justify-between gap-3 p-4 text-left transition-colors"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="text-primary bg-primary-subtle flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Apple className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => modal.openView(ing)}
                      className="focus-visible:ring-ring text-foreground cursor-pointer truncate rounded text-left font-semibold after:absolute after:inset-0 focus:outline-none focus-visible:ring-2"
                    >
                      {getLocalizedField(ing.name, lang)}
                    </button>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>{ing.caloriesPer100} kcal</span>
                      <span className="text-macro-protein">{ing.proteinPer100}g Pro</span>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 flex shrink-0 items-center gap-3">
                  <button
                    data-testid={`btn-edit-ingredient-${ing.id}`}
                    onClick={() => modal.openEdit(ing)}
                    aria-label={`${t('common.edit')} ${getLocalizedField(ing.name, lang)}`}
                    className="hover:bg-primary-subtle text-muted-foreground hover:text-primary focus-visible:ring-ring rounded-lg p-2.5 transition-all focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    data-testid={`btn-delete-ingredient-${ing.id}`}
                    onClick={() => handleDelete(ing.id, getLocalizedField(ing.name, lang))}
                    disabled={isUsed(ing.id)}
                    aria-label={`${t('common.delete')} ${getLocalizedField(ing.name, lang)}`}
                    className={`focus-visible:ring-ring rounded-lg p-2.5 transition-all focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${isUsed(ing.id) ? 'text-muted-foreground opacity-40' : 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {list.filteredItems.length === 0 && (
            <EmptyState
              variant={hasSearchResultsGap ? 'compact' : 'hero'}
              icon={Apple}
              contract={emptyIngredientContract}
            />
          )}
        </div>
      )}

      {/* View Detail Modal */}
      {modal.viewingItem &&
        (() => {
          const ing = modal.viewingItem;
          const usedIn = getDishesUsingIngredient(ing.id);
          return (
            <DetailModal
              title={t('ingredient.detail')}
              editLabel={t('ingredient.editIngredient')}
              onClose={modal.closeView}
              onEdit={() => modal.openEditFromView(ing)}
            >
              <div className="flex items-center gap-4">
                <div className="text-primary bg-primary-subtle flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                  <Apple className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-foreground text-xl font-semibold">{getLocalizedField(ing.name, lang)}</h3>
                  <p className="text-muted-foreground text-sm font-medium">{getDisplayUnit(ing.unit, lang)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-xl p-3.5">
                  <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">{t('common.calories')}</p>
                  <p className="text-foreground text-xl font-semibold">
                    {ing.caloriesPer100} <span className="text-muted-foreground text-xs font-medium">kcal</span>
                  </p>
                </div>
                <div className="bg-macro-carbs-subtle rounded-xl p-3.5">
                  <p className="text-macro-protein mb-1 text-xs font-semibold uppercase">{t('common.protein')}</p>
                  <p className="text-macro-protein text-xl font-semibold">
                    {ing.proteinPer100}
                    <span className="text-macro-protein text-xs font-medium">g</span>
                  </p>
                </div>
                <div className="bg-energy-subtle rounded-xl p-3.5">
                  <p className="text-macro-carbs mb-1 text-xs font-semibold uppercase">{t('common.carbs')}</p>
                  <p className="text-macro-carbs text-xl font-semibold">
                    {ing.carbsPer100}
                    <span className="text-macro-carbs text-xs font-medium">g</span>
                  </p>
                </div>
                <div className="bg-rose-subtle rounded-xl p-3.5">
                  <p className="text-macro-fat mb-1 text-xs font-semibold uppercase">{t('common.fat')}</p>
                  <p className="text-macro-fat text-xl font-semibold">
                    {ing.fatPer100}
                    <span className="text-macro-fat text-xs font-medium">g</span>
                  </p>
                </div>
              </div>
              <div className="bg-primary-subtle rounded-xl p-3.5">
                <p className="text-primary mb-1 text-xs font-semibold uppercase">{t('common.fiber')}</p>
                <p className="text-primary-emphasis text-xl font-semibold">
                  {ing.fiberPer100}
                  <span className="text-primary text-xs font-medium">g</span>
                </p>
              </div>
              {usedIn.length > 0 && (
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">{t('ingredient.usedIn')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {usedIn.map(n => (
                      <span
                        key={n}
                        className="border-border bg-card text-foreground-secondary rounded-lg border px-2.5 py-1 text-xs font-medium"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </DetailModal>
          );
        })()}

      {/* Edit Modal */}
      {modal.isEditOpen && (
        <IngredientEditModal
          editingItem={modal.editingItem}
          onSubmit={handleSaveIngredient}
          onClose={() => modal.closeEdit(false)}
        />
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        variant="danger"
        title={t('ingredient.confirmDelete')}
        message={
          <p>
            {t('ingredient.confirmDeleteMsg')}{' '}
            <span className="text-foreground font-semibold">&quot;{deleteConfirmation.ingredientName}&quot;</span>?
          </p>
        }
        confirmLabel={t('common.deleteNow')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
      />
    </div>
  );
};

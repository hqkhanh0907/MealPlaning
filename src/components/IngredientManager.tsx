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
        <span className="text-slate-600 dark:text-slate-300">
          {usedIn.length <= 2 ? usedIn.join(', ') : `${usedIn.slice(0, 2).join(', ')} +${usedIn.length - 2}`}
        </span>
      </div>
    );
  };

  // --- Render ---
  const emptyIcon = <Apple className="h-8 w-8 text-emerald-300" />;

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
              className="group bg-card relative flex w-full flex-col rounded-2xl border border-slate-100 p-5 text-left shadow-sm transition-all hover:shadow-md dark:border-slate-700"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-primary flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                    <Apple className="h-5 w-5" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => modal.openView(ing)}
                      className="focus-visible:ring-ring cursor-pointer rounded text-left text-lg font-bold text-slate-800 after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:text-slate-100"
                    >
                      {getLocalizedField(ing.name, lang)}
                    </button>
                    <p className="text-muted-foreground text-xs font-medium">{getDisplayUnit(ing.unit, lang)}</p>
                  </div>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-500">
                    {t('common.calories')}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{ing.caloriesPer100}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                  <span className="text-[10px] font-bold text-blue-400 uppercase">{t('common.protein')}</span>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{ing.proteinPer100}g</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-50 p-2 dark:bg-amber-900/30">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">{t('common.carbs')}</span>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{ing.carbsPer100}g</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-rose-50 p-2 dark:bg-rose-900/30">
                  <span className="text-[10px] font-bold text-rose-400 uppercase">{t('common.fat')}</span>
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-400">{ing.fatPer100}g</span>
                </div>
              </div>
              {renderUsedInDishes(ing.id)}
              <div className="relative z-10 mt-auto flex items-center gap-4 border-t border-slate-50 pt-4 dark:border-slate-700">
                <button
                  data-testid={`btn-edit-ingredient-${ing.id}`}
                  onClick={() => modal.openEdit(ing)}
                  className="text-muted-foreground flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
                >
                  <Edit3 className="h-4 w-4" /> {t('common.edit')}
                </button>
                <button
                  data-testid={`btn-delete-ingredient-${ing.id}`}
                  onClick={() => handleDelete(ing.id, getLocalizedField(ing.name, lang))}
                  aria-disabled={isUsed(ing.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-all ${isUsed(ing.id) ? 'dark:text-muted-foreground text-slate-400 opacity-40' : 'text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30'}`}
                >
                  <Trash2 className="h-4 w-4" /> {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
          {list.filteredItems.length === 0 && (
            <EmptyState
              icon={emptyIcon}
              searchQuery={list.searchQuery}
              entityName={t('ingredient.title').toLowerCase()}
              actionLabel={t('ingredient.addNew')}
              onAction={() => modal.openEdit()}
              className="col-span-full"
            />
          )}
        </div>
      )}

      {/* List View */}
      {list.viewLayout === 'list' && (
        <div className="bg-card overflow-hidden rounded-2xl border border-slate-100 shadow-sm dark:border-slate-700">
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-700">
                <tr>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-bold uppercase">
                    {t('ingredient.title')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-bold uppercase">
                    {t('common.calories')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-bold uppercase">
                    {t('common.protein')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-bold uppercase">
                    {t('common.carbs')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-bold uppercase">
                    {t('common.fat')}
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-bold uppercase">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {list.filteredItems.map(ing => (
                  <tr key={ing.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                          <Apple className="h-4 w-4" />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => modal.openView(ing)}
                            className="hover:text-primary cursor-pointer text-left font-bold text-slate-800 transition-colors dark:text-slate-100"
                          >
                            {getLocalizedField(ing.name, lang)}
                          </button>
                          <p className="text-muted-foreground text-xs">{getDisplayUnit(ing.unit, lang)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{ing.caloriesPer100}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{ing.proteinPer100}g</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-amber-600 dark:text-amber-400">{ing.carbsPer100}g</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-rose-600 dark:text-rose-400">{ing.fatPer100}g</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          data-testid={`btn-edit-ingredient-${ing.id}`}
                          onClick={() => modal.openEdit(ing)}
                          aria-label={`${t('common.edit')} ${getLocalizedField(ing.name, lang)}`}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          data-testid={`btn-delete-ingredient-${ing.id}`}
                          onClick={() => handleDelete(ing.id, getLocalizedField(ing.name, lang))}
                          aria-disabled={isUsed(ing.id)}
                          aria-label={`${t('common.delete')} ${getLocalizedField(ing.name, lang)}`}
                          className={`rounded-lg p-2 transition-all ${isUsed(ing.id) ? 'text-slate-300 opacity-40 dark:text-slate-500' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30'}`}
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
          <div className="divide-y divide-slate-100 sm:hidden dark:divide-slate-700">
            {list.filteredItems.map(ing => (
              <div
                key={ing.id}
                className="relative flex w-full items-center justify-between gap-3 p-4 text-left transition-colors active:bg-slate-50 dark:active:bg-slate-700"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                    <Apple className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => modal.openView(ing)}
                      className="focus-visible:ring-ring cursor-pointer truncate rounded text-left font-bold text-slate-800 after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 dark:text-slate-100"
                    >
                      {getLocalizedField(ing.name, lang)}
                    </button>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>{ing.caloriesPer100} kcal</span>
                      <span className="text-blue-600 dark:text-blue-400">{ing.proteinPer100}g Pro</span>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 flex shrink-0 items-center gap-3">
                  <button
                    data-testid={`btn-edit-ingredient-${ing.id}`}
                    onClick={() => modal.openEdit(ing)}
                    aria-label={`${t('common.edit')} ${getLocalizedField(ing.name, lang)}`}
                    className="rounded-lg p-2.5 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    data-testid={`btn-delete-ingredient-${ing.id}`}
                    onClick={() => handleDelete(ing.id, getLocalizedField(ing.name, lang))}
                    aria-disabled={isUsed(ing.id)}
                    aria-label={`${t('common.delete')} ${getLocalizedField(ing.name, lang)}`}
                    className={`rounded-lg p-2.5 transition-all ${isUsed(ing.id) ? 'text-slate-300 opacity-40 dark:text-slate-500' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {list.filteredItems.length === 0 && (
            <EmptyState
              icon={emptyIcon}
              searchQuery={list.searchQuery}
              entityName={t('ingredient.title').toLowerCase()}
              actionLabel={t('ingredient.addNew')}
              onAction={() => modal.openEdit()}
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
                <div className="text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30">
                  <Apple className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {getLocalizedField(ing.name, lang)}
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium">{getDisplayUnit(ing.unit, lang)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-700/50">
                  <p className="mb-1 text-[10px] font-bold text-slate-500 uppercase dark:text-slate-500">
                    {t('common.calories')}
                  </p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    {ing.caloriesPer100} <span className="text-xs font-medium text-slate-500">kcal</span>
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3.5 dark:bg-blue-900/30">
                  <p className="mb-1 text-[10px] font-bold text-blue-400 uppercase">{t('common.protein')}</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                    {ing.proteinPer100}
                    <span className="text-xs font-medium text-blue-400">g</span>
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3.5 dark:bg-amber-900/30">
                  <p className="mb-1 text-[10px] font-bold text-amber-400 uppercase">{t('common.carbs')}</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                    {ing.carbsPer100}
                    <span className="text-xs font-medium text-amber-400">g</span>
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3.5 dark:bg-rose-900/30">
                  <p className="mb-1 text-[10px] font-bold text-rose-400 uppercase">{t('common.fat')}</p>
                  <p className="text-xl font-bold text-rose-700 dark:text-rose-400">
                    {ing.fatPer100}
                    <span className="text-xs font-medium text-rose-400">g</span>
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-green-50 p-3.5 dark:bg-green-900/30">
                <p className="mb-1 text-[10px] font-bold text-green-400 uppercase">{t('common.fiber')}</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                  {ing.fiberPer100}
                  <span className="text-xs font-medium text-green-400">g</span>
                </p>
              </div>
              {usedIn.length > 0 && (
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
                  <p className="text-muted-foreground mb-2 text-xs font-bold uppercase">{t('ingredient.usedIn')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {usedIn.map(n => (
                      <span
                        key={n}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
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
            <span className="font-bold text-slate-800 dark:text-slate-100">
              &quot;{deleteConfirmation.ingredientName}&quot;
            </span>
            ?
          </p>
        }
        confirmLabel={t('common.deleteNow')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
      />
    </div>
  );
};

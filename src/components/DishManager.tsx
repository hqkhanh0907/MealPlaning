import React, { useState, useCallback } from 'react';
import { Dish, Ingredient, DishIngredient, MealType } from '../types';
import { calculateDishNutrition } from '../utils/nutrition';
import { Plus, Trash2, Edit3, Save, Search, ChefHat, Minus, Apple, X } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { generateId } from '../utils/helpers';
import { ListToolbar } from './shared/ListToolbar';
import { EmptyState } from './shared/EmptyState';
import { DetailModal } from './shared/DetailModal';
import { UnsavedChangesDialog } from './shared/UnsavedChangesDialog';
import { useItemModalFlow } from '../hooks/useItemModalFlow';
import { useListManager } from '../hooks/useListManager';

type SortOption = 'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc' | 'ing-asc' | 'ing-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Tên (A-Z)' },
  { value: 'name-desc', label: 'Tên (Z-A)' },
  { value: 'cal-asc', label: 'Calo (Thấp → Cao)' },
  { value: 'cal-desc', label: 'Calo (Cao → Thấp)' },
  { value: 'pro-asc', label: 'Protein (Thấp → Cao)' },
  { value: 'pro-desc', label: 'Protein (Cao → Thấp)' },
  { value: 'ing-asc', label: 'Số NL (Ít → Nhiều)' },
  { value: 'ing-desc', label: 'Số NL (Nhiều → Ít)' },
];

const TAG_OPTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: 'Sáng', icon: '🌅' },
  { type: 'lunch', label: 'Trưa', icon: '🌤️' },
  { type: 'dinner', label: 'Tối', icon: '🌙' },
];

const TAG_SHORT_LABELS: Record<MealType, string> = {
  breakfast: '🌅 Sáng',
  lunch: '🌤️ Trưa',
  dinner: '🌙 Tối',
};

interface DishManagerProps {
  dishes: Dish[];
  ingredients: Ingredient[];
  onAdd: (dish: Dish) => void;
  onUpdate: (dish: Dish) => void;
  onDelete: (id: string) => void;
  isUsed: (id: string) => boolean;
}

export const DishManager: React.FC<DishManagerProps> = ({ dishes, ingredients, onAdd, onUpdate, onDelete, isUsed }) => {
  const notify = useNotification();

  // --- Form state (domain-specific) ---
  const [name, setName] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<DishIngredient[]>([]);
  const [tags, setTags] = useState<MealType[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [formErrors, setFormErrors] = useState<{ tags?: string }>({});
  const [filterTag, setFilterTag] = useState<MealType | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean; dishId: string | null; dishName: string;
  }>({ isOpen: false, dishId: null, dishName: '' });

  // --- Shared hooks ---
  const populateForm = useCallback((dish: Dish | null) => {
    if (dish) {
      setName(dish.name);
      setSelectedIngredients([...dish.ingredients]);
      setTags([...(dish.tags || [])]);
    } else {
      setName(''); setSelectedIngredients([]); setTags([]);
    }
    setIngredientSearch(''); setFormErrors({});
  }, []);

  const modal = useItemModalFlow<Dish>({ onOpenEdit: populateForm });

  const hasFormChanges = useCallback((): boolean => {
    const ed = modal.editingItem;
    if (!ed) return name !== '' || selectedIngredients.length > 0 || tags.length > 0;
    if (name !== ed.name) return true;
    if (JSON.stringify(tags) !== JSON.stringify(ed.tags || [])) return true;
    if (selectedIngredients.length !== ed.ingredients.length) return true;
    return selectedIngredients.some((si, i) => {
      const orig = ed.ingredients[i];
      return si.ingredientId !== orig.ingredientId || si.amount !== orig.amount;
    });
  }, [modal.editingItem, name, selectedIngredients, tags]);

  const searchFn = useCallback((d: Dish, q: string) => d.name.toLowerCase().includes(q.toLowerCase()), []);
  const sortFn = useCallback((a: Dish, b: Dish, s: SortOption) => {
    const nA = calculateDishNutrition(a, ingredients);
    const nB = calculateDishNutrition(b, ingredients);
    switch (s) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'cal-asc': return nA.calories - nB.calories;
      case 'cal-desc': return nB.calories - nA.calories;
      case 'pro-asc': return nA.protein - nB.protein;
      case 'pro-desc': return nB.protein - nA.protein;
      case 'ing-asc': return a.ingredients.length - b.ingredients.length;
      case 'ing-desc': return b.ingredients.length - a.ingredients.length;
      default: return 0;
    }
  }, [ingredients]);
  const extraFilter = useCallback((d: Dish) => !filterTag || (d.tags?.includes(filterTag) ?? false), [filterTag]);

  const list = useListManager<Dish, SortOption>({ items: dishes, searchFn, sortFn, defaultSort: 'name-asc', extraFilter });

  // --- Domain handlers ---
  const buildDish = (): Dish => ({
    id: modal.editingItem ? modal.editingItem.id : generateId('dish'),
    name, ingredients: selectedIngredients, tags,
  });

  const validateAndSubmit = () => {
    const errors: { tags?: string } = {};
    if (tags.length === 0) errors.tags = 'Vui lòng chọn ít nhất một bữa ăn phù hợp';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    if (!name || selectedIngredients.length === 0) return;
    const dish = buildDish();
    if (modal.editingItem) onUpdate(dish); else onAdd(dish);
    modal.afterSubmit(dish);
  };


  const handleSaveAndBack = () => {
    const errors: { tags?: string } = {};
    if (tags.length === 0) errors.tags = 'Vui lòng chọn ít nhất một bữa ăn phù hợp';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); modal.dismissUnsavedDialog(); return; }
    if (!name || selectedIngredients.length === 0) { modal.dismissUnsavedDialog(); return; }
    const dish = buildDish();
    if (modal.editingItem) onUpdate(dish); else onAdd(dish);
    modal.confirmSaveAndBack(dish);
  };

  const handleDelete = (id: string, dname: string) => {
    if (isUsed(id)) { notify.warning('Không thể xóa', 'Món ăn này đang được sử dụng trong kế hoạch.'); return; }
    setDeleteConfirmation({ isOpen: true, dishId: id, dishName: dname });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation.dishId) return;
    const deleted = dishes.find(d => d.id === deleteConfirmation.dishId);
    onDelete(deleteConfirmation.dishId);
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    if (deleted) {
      notify.info('Đã xóa món ăn', `"${deleted.name}" đã được xóa.`, {
        duration: 6000,
        action: { label: '↩ Hoàn tác', onClick: () => { onAdd(deleted); notify.success('Đã hoàn tác', `"${deleted.name}" đã được khôi phục.`); } },
      });
    }
  };

  const handleAddIngredient = (ingId: string) => {
    if (selectedIngredients.some(si => si.ingredientId === ingId)) return;
    setSelectedIngredients([...selectedIngredients, { ingredientId: ingId, amount: 100 }]);
  };

  const handleRemoveIngredient = (ingId: string) => {
    setSelectedIngredients(selectedIngredients.filter(si => si.ingredientId !== ingId));
  };

  const handleUpdateAmount = (ingId: string, amount: number) => {
    setSelectedIngredients(selectedIngredients.map(si => si.ingredientId === ingId ? { ...si, amount } : si));
  };

  const handleTagToggle = (type: MealType, isActive: boolean) => {
    setTags(prev => isActive ? prev.filter(t => t !== type) : [...prev, type]);
    if (!isActive && formErrors.tags) setFormErrors(prev => ({ ...prev, tags: undefined }));
  };

  // --- Render helpers ---
  const emptyIcon = <ChefHat className="w-8 h-8 text-emerald-300" />;

  return (
    <div className="space-y-6">
      <ListToolbar
        searchQuery={list.searchQuery} onSearchChange={list.setSearchQuery} searchPlaceholder="Tìm kiếm món ăn..."
        sortOptions={SORT_OPTIONS} sortBy={list.sortBy} onSortChange={v => list.setSortBy(v as SortOption)}
        viewLayout={list.viewLayout} onLayoutChange={list.setViewLayout}
        onAdd={() => modal.openEdit()} addLabel="Thêm món ăn"
      >
        {/* Tag filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mt-2">
          <button onClick={() => setFilterTag(null)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all min-h-8 ${filterTag ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700' : 'bg-emerald-500 text-white'}`}>
            Tất cả ({dishes.length})
          </button>
          {TAG_OPTIONS.map(({ type, label, icon }) => {
            const count = dishes.filter(d => d.tags?.includes(type)).length;
            return (
              <button key={type} onClick={() => setFilterTag(filterTag === type ? null : type)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all min-h-8 ${filterTag === type ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {icon} {label} ({count})
              </button>
            );
          })}
        </div>
      </ListToolbar>

      {/* Grid View */}
      {list.viewLayout === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.filteredItems.map(dish => {
            const nutrition = calculateDishNutrition(dish, ingredients);
            return (
              <button type="button" key={dish.id} onClick={() => modal.openView(dish)} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer text-left w-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500"><ChefHat className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{dish.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{dish.ingredients.length} nguyên liệu</p>
                      {dish.tags && dish.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {dish.tags.map(tag => <span key={tag} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{TAG_SHORT_LABELS[tag]}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Calories</span><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{Math.round(nutrition.calories)}</span></div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-blue-400 font-bold uppercase">Protein</span><span className="text-sm font-bold text-blue-700 dark:text-blue-400">{Math.round(nutrition.protein)}g</span></div>
                </div>
                <div className="mt-auto flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-700">
                  <button onClick={(e) => { e.stopPropagation(); modal.openEdit(dish); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"><Edit3 className="w-4 h-4" /> Sửa</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(dish.id, dish.name); }} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all ${isUsed(dish.id) ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /> Xóa</button>
                </div>
              </button>
            );
          })}
          {list.filteredItems.length === 0 && <EmptyState icon={emptyIcon} searchQuery={list.searchQuery} entityName="món ăn" actionLabel="Tạo món ăn" onAction={() => modal.openEdit()} className="col-span-full" />}
        </div>
      )}

      {/* List View */}
      {list.viewLayout === 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Món ăn</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tags</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Calo</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Protein</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {list.filteredItems.map(dish => {
                  const nutrition = calculateDishNutrition(dish, ingredients);
                  return (
                    <tr key={dish.id} onClick={() => modal.openView(dish)} onKeyDown={e => { if (e.key === 'Enter') modal.openView(dish); }} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" tabIndex={0}>
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 shrink-0"><ChefHat className="w-4 h-4" /></div><div><p className="font-bold text-slate-800 dark:text-slate-100">{dish.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{dish.ingredients.length} nguyên liệu</p></div></div></td>
                      <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{dish.tags?.map(tag => <span key={tag} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 rounded">{TAG_SHORT_LABELS[tag]}</span>)}</div></td>
                      <td className="px-4 py-3 text-right"><span className="font-bold text-slate-700 dark:text-slate-300">{Math.round(nutrition.calories)}</span></td>
                      <td className="px-4 py-3 text-right"><span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(nutrition.protein)}g</span></td>
                      <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); modal.openEdit(dish); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(dish.id, dish.name); }} className={`p-2 rounded-lg transition-all ${isUsed(dish.id) ? 'text-slate-200 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile List */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {list.filteredItems.map(dish => {
              const nutrition = calculateDishNutrition(dish, ingredients);
              return (
                <button type="button" key={dish.id} onClick={() => modal.openView(dish)} className="p-4 flex items-center justify-between gap-3 cursor-pointer active:bg-slate-50 dark:active:bg-slate-700 transition-colors w-full text-left">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><ChefHat className="w-5 h-5" /></div>
                    <div className="min-w-0"><p className="font-bold text-slate-800 dark:text-slate-100 truncate">{dish.name}</p><div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span>{Math.round(nutrition.calories)} kcal</span><span className="text-blue-600 dark:text-blue-400">{Math.round(nutrition.protein)}g Pro</span></div></div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); modal.openEdit(dish); }} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(dish.id, dish.name); }} className={`p-2.5 rounded-lg transition-all ${isUsed(dish.id) ? 'text-slate-200 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </button>
              );
            })}
          </div>
          {list.filteredItems.length === 0 && <EmptyState icon={emptyIcon} searchQuery={list.searchQuery} entityName="món ăn" actionLabel="Tạo món ăn" onAction={() => modal.openEdit()} />}
        </div>
      )}

      {/* View Detail Modal */}
      {modal.viewingItem && (() => {
        const dish = modal.viewingItem;
        const nutrition = calculateDishNutrition(dish, ingredients);
        return (
          <DetailModal title="Chi tiết món ăn" editLabel="Chỉnh sửa món ăn" onClose={modal.closeView} onEdit={() => modal.openEditFromView(dish)}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0"><ChefHat className="w-7 h-7" /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{dish.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{dish.ingredients.length} nguyên liệu</p>
                {dish.tags && dish.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">{dish.tags.map(tag => <span key={tag} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">{TAG_SHORT_LABELS[tag]}</span>)}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3.5"><p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Calories</p><p className="text-xl font-bold text-slate-700 dark:text-slate-300">{Math.round(nutrition.calories)} <span className="text-xs font-medium text-slate-400">kcal</span></p></div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3.5"><p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Protein</p><p className="text-xl font-bold text-blue-700 dark:text-blue-400">{Math.round(nutrition.protein)}<span className="text-xs font-medium text-blue-400">g</span></p></div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3.5"><p className="text-[10px] text-amber-400 font-bold uppercase mb-1">Carbs</p><p className="text-xl font-bold text-amber-700 dark:text-amber-400">{Math.round(nutrition.carbs)}<span className="text-xs font-medium text-amber-400">g</span></p></div>
              <div className="bg-rose-50 dark:bg-rose-900/30 rounded-xl p-3.5"><p className="text-[10px] text-rose-400 font-bold uppercase mb-1">Fat</p><p className="text-xl font-bold text-rose-700 dark:text-rose-400">{Math.round(nutrition.fat)}<span className="text-xs font-medium text-rose-400">g</span></p></div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Danh sách nguyên liệu</p>
              <div className="space-y-2">
                {dish.ingredients.map(si => {
                  const ing = ingredients.find(i => i.id === si.ingredientId);
                  if (!ing) return null;
                  return (
                    <div key={si.ingredientId} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white dark:bg-slate-600 rounded-lg flex items-center justify-center text-emerald-500 border border-slate-100 dark:border-slate-500"><Apple className="w-4 h-4" /></div><span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{ing.name}</span></div>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{si.amount} {ing.unit}</span>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-60">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{modal.editingItem ? 'Sửa món ăn' : 'Tạo món ăn mới'}</h4>
              <button onClick={() => modal.closeEdit(hasFormChanges())} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label htmlFor="dish-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Tên món ăn</label>
                <input id="dish-name" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100" placeholder="VD: Ức gà áp chảo" />
              </div>
              <div>
                <p className={`block text-xs font-bold uppercase mb-1.5 ${formErrors.tags ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>Phù hợp cho bữa <span className="text-rose-500">*</span></p>
                <div className="flex gap-2 flex-wrap">
                  {TAG_OPTIONS.map(({ type, label, icon }) => {
                    const isActive = tags.includes(type);
                    return (
                      <button key={type} type="button" onClick={() => handleTagToggle(type, isActive)} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all min-h-11 ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300'}`}>
                        {icon} {label}
                      </button>
                    );
                  })}
                </div>
                {formErrors.tags && <p className="text-xs text-rose-500 mt-1.5 font-medium">{formErrors.tags}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ingredient Selector */}
                <div className="space-y-3">
                  <p className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Chọn nguyên liệu</p>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100" placeholder="Tìm nguyên liệu..." />
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
                    {(() => {
                      const pickerSelectedIds = new Set(selectedIngredients.map(si => si.ingredientId));
                      const available = ingredients.filter(ing => !pickerSelectedIds.has(ing.id)).filter(ing => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()));
                      if (available.length === 0) return <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">{pickerSelectedIds.size === ingredients.length ? 'Đã chọn tất cả nguyên liệu' : 'Không tìm thấy nguyên liệu'}</div>;
                      return available.map(ing => (
                        <button key={ing.id} type="button" onClick={() => handleAddIngredient(ing.id)} className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-between group transition-all">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{ing.name}</span>
                          <Plus className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500" />
                        </button>
                      ));
                    })()}
                  </div>
                </div>
                {/* Selected Ingredients */}
                <div className="space-y-3">
                  <p className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nguyên liệu đã chọn</p>
                  <div className="space-y-2">
                    {selectedIngredients.map(si => {
                      const ing = ingredients.find(i => i.id === si.ingredientId);
                      if (!ing) return null;
                      return (
                        <div key={si.ingredientId} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{ing.name}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <button type="button" onClick={() => handleUpdateAmount(si.ingredientId, Math.max(0.1, si.amount - 10))} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 active:bg-slate-300 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"><Minus className="w-3.5 h-3.5" /></button>
                              <input type="number" min="0.1" step="0.1" value={si.amount} onChange={e => handleUpdateAmount(si.ingredientId, Math.max(0.1, Number(e.target.value) || 0.1))} className="w-16 px-2 py-1 text-sm text-center rounded-lg border border-slate-200 dark:border-slate-600 outline-none focus:border-emerald-500 transition-all bg-white dark:bg-slate-700 dark:text-slate-100" />
                              <button type="button" onClick={() => handleUpdateAmount(si.ingredientId, si.amount + 10)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 active:bg-slate-300 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"><Plus className="w-3.5 h-3.5" /></button>
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">{ing.unit}</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => handleRemoveIngredient(si.ingredientId)} className="p-2 text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      );
                    })}
                    {selectedIngredients.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl">Chưa chọn nguyên liệu</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={validateAndSubmit} className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 dark:shadow-emerald-900 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-lg"><Save className="w-5 h-5" /> Lưu món ăn</button>
            </div>
          </div>
        </div>
      )}

      <UnsavedChangesDialog isOpen={modal.showUnsavedDialog} onSave={handleSaveAndBack} onDiscard={modal.discardAndBack} onCancel={modal.dismissUnsavedDialog} />
      <ConfirmationModal isOpen={deleteConfirmation.isOpen} variant="danger" title="Xóa món ăn?" message={<p>Bạn có chắc chắn muốn xóa món <span className="font-bold text-slate-800 dark:text-slate-100">&quot;{deleteConfirmation.dishName}&quot;</span>?<br/>Hành động này không thể hoàn tác.</p>} confirmLabel="Xóa ngay" onConfirm={confirmDelete} onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })} />
    </div>
  );
};

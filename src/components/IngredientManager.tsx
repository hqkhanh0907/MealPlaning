import React, { useState, useCallback } from 'react';
import { Ingredient, Dish } from '../types';
import { Trash2, Edit3, Save, Apple, Sparkles, Loader2, X } from 'lucide-react';
import { suggestIngredientInfo } from '../services/geminiService';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { ListToolbar } from './shared/ListToolbar';
import { EmptyState } from './shared/EmptyState';
import { DetailModal } from './shared/DetailModal';
import { UnsavedChangesDialog } from './shared/UnsavedChangesDialog';
import { useItemModalFlow } from '../hooks/useItemModalFlow';
import { useListManager } from '../hooks/useListManager';

type SortOption = 'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Tên (A-Z)' },
  { value: 'name-desc', label: 'Tên (Z-A)' },
  { value: 'cal-asc', label: 'Calo (Thấp → Cao)' },
  { value: 'cal-desc', label: 'Calo (Cao → Thấp)' },
  { value: 'pro-asc', label: 'Protein (Thấp → Cao)' },
  { value: 'pro-desc', label: 'Protein (Cao → Thấp)' },
];

interface IngredientManagerProps {
  ingredients: Ingredient[];
  dishes?: Dish[];
  onAdd: (ing: Ingredient) => void;
  onUpdate: (ing: Ingredient) => void;
  onDelete: (id: string) => void;
  isUsed: (id: string) => boolean;
}

const EMPTY_FORM: Omit<Ingredient, 'id'> = { name: '', caloriesPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, fiberPer100: 0, unit: '' };

const getDisplayUnit = (unit: string) => {
  const u = unit.toLowerCase().trim();
  if (u === 'kg' || u === 'g') return '100g';
  if (u === 'l' || u === 'ml') return '100ml';
  return `1 ${unit}`;
};

export const IngredientManager: React.FC<IngredientManagerProps> = ({ ingredients, dishes = [], onAdd, onUpdate, onDelete, isUsed }) => {
  const notify = useNotification();

  // --- Form state (domain-specific) ---
  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<{ name?: string; unit?: string }>({});
  const [isSearchingAI, setIsSearchingAI] = useState(false);

  const isEditOpenRef = React.useRef(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean; ingredientId: string | null; ingredientName: string; usageCount: number; exampleDish?: string;
  }>({ isOpen: false, ingredientId: null, ingredientName: '', usageCount: 0 });

  // --- Shared hooks ---
  const populateForm = useCallback((ing: Ingredient | null) => {
    if (ing) setFormData({ ...ing }); else setFormData(EMPTY_FORM);
    setFormErrors({});
  }, []);

  const modal = useItemModalFlow<Ingredient>({ onOpenEdit: populateForm });

  // Sync ref for AI abort guard
  React.useEffect(() => { isEditOpenRef.current = modal.isEditOpen; }, [modal.isEditOpen]);

  const hasFormChanges = useCallback((): boolean => {
    const ed = modal.editingItem;
    if (!ed) return formData.name !== '' || formData.unit !== '';
    return formData.name !== ed.name || formData.unit !== ed.unit ||
      formData.caloriesPer100 !== ed.caloriesPer100 || formData.proteinPer100 !== ed.proteinPer100 ||
      formData.carbsPer100 !== ed.carbsPer100 || formData.fatPer100 !== ed.fatPer100 || formData.fiberPer100 !== ed.fiberPer100;
  }, [modal.editingItem, formData]);

  const searchFn = useCallback((ing: Ingredient, q: string) => ing.name.toLowerCase().includes(q.toLowerCase()), []);
  const sortFn = useCallback((a: Ingredient, b: Ingredient, s: SortOption) => {
    switch (s) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'cal-asc': return a.caloriesPer100 - b.caloriesPer100;
      case 'cal-desc': return b.caloriesPer100 - a.caloriesPer100;
      case 'pro-asc': return a.proteinPer100 - b.proteinPer100;
      case 'pro-desc': return b.proteinPer100 - a.proteinPer100;
      default: return 0;
    }
  }, []);

  const list = useListManager<Ingredient, SortOption>({ items: ingredients, searchFn, sortFn, defaultSort: 'name-asc' });

  // --- Domain helpers ---
  const getDishesUsingIngredient = (ingId: string): string[] =>
    dishes.filter(d => d.ingredients.some(di => di.ingredientId === ingId)).map(d => d.name);

  const buildIngredient = (): Ingredient => ({
    ...formData,
    id: modal.editingItem ? modal.editingItem.id : `ing-${Date.now()}`,
  });

  // --- Domain handlers ---
  const handleAISearch = async () => {
    if (!formData.name || !formData.unit) return;
    try {
      setIsSearchingAI(true);
      const info = await suggestIngredientInfo(formData.name, formData.unit);
      if (!isEditOpenRef.current) return;
      setFormData(prev => ({ ...prev, caloriesPer100: info.calories, proteinPer100: info.protein, carbsPer100: info.carbs, fatPer100: info.fat, fiberPer100: info.fiber }));
    } catch (error) {
      console.error("Failed to get ingredient info:", error);
      if (!isEditOpenRef.current) return;
      if (error instanceof Error && error.message === "Timeout") {
        notify.warning('Phản hồi quá lâu', `"${formData.name}" — Hệ thống phản hồi quá lâu. Vui lòng thử lại sau.`);
      } else {
        notify.error('Tra cứu thất bại', `"${formData.name}" — Không thể tìm thấy thông tin. Vui lòng thử lại.`);
      }
    } finally {
      if (isEditOpenRef.current) setIsSearchingAI(false);
    }
  };

  const validateForm = (): { name?: string; unit?: string } => {
    const errors: { name?: string; unit?: string } = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập tên nguyên liệu';
    if (!formData.unit.trim()) errors.unit = 'Vui lòng nhập đơn vị tính';
    return errors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const ing = buildIngredient();
    if (modal.editingItem) onUpdate(ing); else onAdd(ing);
    modal.afterSubmit(ing);
  };

  const handleSaveAndBack = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); modal.dismissUnsavedDialog(); return; }
    const ing = buildIngredient();
    if (modal.editingItem) onUpdate(ing); else onAdd(ing);
    modal.confirmSaveAndBack(ing);
  };

  const handleDelete = (id: string, iname: string) => {
    if (isUsed(id)) { notify.warning('Không thể xóa', 'Nguyên liệu này đang được sử dụng trong món ăn.'); return; }
    setDeleteConfirmation({ isOpen: true, ingredientId: id, ingredientName: iname, usageCount: 0 });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation.ingredientId) return;
    const deleted = ingredients.find(i => i.id === deleteConfirmation.ingredientId);
    onDelete(deleteConfirmation.ingredientId);
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    if (deleted) {
      notify.info('Đã xóa nguyên liệu', `"${deleted.name}" đã được xóa.`, {
        duration: 6000,
        action: { label: '↩ Hoàn tác', onClick: () => { onAdd(deleted); notify.success('Đã hoàn tác', `"${deleted.name}" đã được khôi phục.`); } },
      });
    }
  };

  const renderUsedInDishes = (ingId: string) => {
    const usedIn = getDishesUsingIngredient(ingId);
    if (!usedIn.length) return null;
    return (
      <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">Dùng trong: </span>
        <span className="text-slate-600 dark:text-slate-300">
          {usedIn.length <= 2 ? usedIn.join(', ') : `${usedIn.slice(0, 2).join(', ')} +${usedIn.length - 2}`}
        </span>
      </div>
    );
  };

  // --- Render ---
  const emptyIcon = <Apple className="w-8 h-8 text-emerald-300" />;

  return (
    <div className="space-y-6">
      <ListToolbar
        searchQuery={list.searchQuery} onSearchChange={list.setSearchQuery} searchPlaceholder="Tìm kiếm nguyên liệu..."
        sortOptions={SORT_OPTIONS} sortBy={list.sortBy} onSortChange={v => list.setSortBy(v as SortOption)}
        viewLayout={list.viewLayout} onLayoutChange={list.setViewLayout}
        onAdd={() => modal.openEdit()} addLabel="Thêm nguyên liệu"
      />

      {/* Grid View */}
      {list.viewLayout === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.filteredItems.map(ing => (
            <button type="button" key={ing.id} onClick={() => modal.openView(ing)} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer text-left w-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500"><Apple className="w-5 h-5" /></div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{ing.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{getDisplayUnit(ing.unit)}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Calories</span><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{ing.caloriesPer100}</span></div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-blue-400 font-bold uppercase">Protein</span><span className="text-sm font-bold text-blue-700 dark:text-blue-400">{ing.proteinPer100}g</span></div>
                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-amber-400 font-bold uppercase">Carbs</span><span className="text-sm font-bold text-amber-700 dark:text-amber-400">{ing.carbsPer100}g</span></div>
                <div className="bg-rose-50 dark:bg-rose-900/30 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-rose-400 font-bold uppercase">Fat</span><span className="text-sm font-bold text-rose-700 dark:text-rose-400">{ing.fatPer100}g</span></div>
              </div>
              {renderUsedInDishes(ing.id)}
              <div className="mt-auto flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-700">
                <button onClick={(e) => { e.stopPropagation(); modal.openEdit(ing); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"><Edit3 className="w-4 h-4" /> Sửa</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(ing.id, ing.name); }} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all ${isUsed(ing.id) ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /> Xóa</button>
              </div>
            </button>
          ))}
          {list.filteredItems.length === 0 && <EmptyState icon={emptyIcon} searchQuery={list.searchQuery} entityName="nguyên liệu" actionLabel="Thêm nguyên liệu" onAction={() => modal.openEdit()} className="col-span-full" />}
        </div>
      )}

      {/* List View */}
      {list.viewLayout === 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nguyên liệu</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Calo</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Protein</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Carbs</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fat</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {list.filteredItems.map(ing => (
                  <tr key={ing.id} onClick={() => modal.openView(ing)} onKeyDown={e => { if (e.key === 'Enter') modal.openView(ing); }} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" tabIndex={0}>
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 shrink-0"><Apple className="w-4 h-4" /></div><div><p className="font-bold text-slate-800 dark:text-slate-100">{ing.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{getDisplayUnit(ing.unit)}</p></div></div></td>
                    <td className="px-4 py-3 text-right"><span className="font-bold text-slate-700 dark:text-slate-300">{ing.caloriesPer100}</span></td>
                    <td className="px-4 py-3 text-right"><span className="font-bold text-blue-600 dark:text-blue-400">{ing.proteinPer100}g</span></td>
                    <td className="px-4 py-3 text-right"><span className="font-bold text-amber-600 dark:text-amber-400">{ing.carbsPer100}g</span></td>
                    <td className="px-4 py-3 text-right"><span className="font-bold text-rose-600 dark:text-rose-400">{ing.fatPer100}g</span></td>
                    <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); modal.openEdit(ing); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(ing.id, ing.name); }} className={`p-2 rounded-lg transition-all ${isUsed(ing.id) ? 'text-slate-200 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {list.filteredItems.map(ing => (
              <button type="button" key={ing.id} onClick={() => modal.openView(ing)} className="p-4 flex items-center justify-between gap-3 cursor-pointer active:bg-slate-50 dark:active:bg-slate-700 transition-colors w-full text-left">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><Apple className="w-5 h-5" /></div>
                  <div className="min-w-0"><p className="font-bold text-slate-800 dark:text-slate-100 truncate">{ing.name}</p><div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span>{ing.caloriesPer100} kcal</span><span className="text-blue-600 dark:text-blue-400">{ing.proteinPer100}g Pro</span></div></div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); modal.openEdit(ing); }} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(ing.id, ing.name); }} className={`p-2.5 rounded-lg transition-all ${isUsed(ing.id) ? 'text-slate-200 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </button>
            ))}
          </div>
          {list.filteredItems.length === 0 && <EmptyState icon={emptyIcon} searchQuery={list.searchQuery} entityName="nguyên liệu" actionLabel="Thêm nguyên liệu" onAction={() => modal.openEdit()} />}
        </div>
      )}

      {/* View Detail Modal */}
      {modal.viewingItem && (() => {
        const ing = modal.viewingItem;
        const usedIn = getDishesUsingIngredient(ing.id);
        return (
          <DetailModal title="Chi tiết nguyên liệu" editLabel="Chỉnh sửa nguyên liệu" onClose={modal.closeView} onEdit={() => modal.openEditFromView(ing)}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0"><Apple className="w-7 h-7" /></div>
              <div><h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{ing.name}</h3><p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{getDisplayUnit(ing.unit)}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3.5"><p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Calories</p><p className="text-xl font-bold text-slate-700 dark:text-slate-300">{ing.caloriesPer100} <span className="text-xs font-medium text-slate-400">kcal</span></p></div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3.5"><p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Protein</p><p className="text-xl font-bold text-blue-700 dark:text-blue-400">{ing.proteinPer100}<span className="text-xs font-medium text-blue-400">g</span></p></div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3.5"><p className="text-[10px] text-amber-400 font-bold uppercase mb-1">Carbs</p><p className="text-xl font-bold text-amber-700 dark:text-amber-400">{ing.carbsPer100}<span className="text-xs font-medium text-amber-400">g</span></p></div>
              <div className="bg-rose-50 dark:bg-rose-900/30 rounded-xl p-3.5"><p className="text-[10px] text-rose-400 font-bold uppercase mb-1">Fat</p><p className="text-xl font-bold text-rose-700 dark:text-rose-400">{ing.fatPer100}<span className="text-xs font-medium text-rose-400">g</span></p></div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3.5"><p className="text-[10px] text-green-400 font-bold uppercase mb-1">Fiber</p><p className="text-xl font-bold text-green-700 dark:text-green-400">{ing.fiberPer100}<span className="text-xs font-medium text-green-400">g</span></p></div>
            {usedIn.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Dùng trong</p>
                <div className="flex flex-wrap gap-1.5">{usedIn.map(n => <span key={n} className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">{n}</span>)}</div>
              </div>
            )}
          </DetailModal>
        );
      })()}

      {/* Edit Modal */}
      {modal.isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-60">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden max-h-[90vh] overflow-y-auto sm:mx-4">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{modal.editingItem ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}</h4>
              <button onClick={() => modal.closeEdit(hasFormChanges())} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="ing-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Tên nguyên liệu</label>
                <div className="flex gap-2">
                  <input id="ing-name" value={formData.name} onChange={e => { setFormData({ ...formData, name: e.target.value }); if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined })); }} className={`flex-1 px-4 py-2.5 rounded-xl border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100`} placeholder="Ví dụ: Thịt bò, Cà chua..." />
                  <button type="button" onClick={handleAISearch} disabled={!formData.name || !formData.unit || isSearchingAI} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" title={formData.unit ? "Tự động điền thông tin bằng AI" : "Vui lòng nhập đơn vị tính trước"}>
                    {isSearchingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="ing-unit" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Đơn vị tính</label>
                <input id="ing-unit" value={formData.unit} onChange={e => { setFormData({ ...formData, unit: e.target.value }); if (formErrors.unit) setFormErrors(prev => ({ ...prev, unit: undefined })); }} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.unit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100`} placeholder="g, ml, cái, quả..." />
                {formErrors.unit && <p className="text-xs text-rose-500 mt-1">{formErrors.unit}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(['caloriesPer100', 'proteinPer100', 'carbsPer100', 'fatPer100', 'fiberPer100'] as const).map(field => {
                  const labels: Record<string, string> = { caloriesPer100: 'Calories', proteinPer100: 'Protein', carbsPer100: 'Carbs', fatPer100: 'Fat', fiberPer100: 'Fiber' };
                  return (
                    <div key={field}>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{labels[field]} / {getDisplayUnit(formData.unit)}</label>
                      <input type="number" required step="0.1" min="0" value={formData[field]} onChange={e => setFormData({ ...formData, [field]: Math.max(0, Number(e.target.value)) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100" />
                    </div>
                  );
                })}
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 dark:shadow-emerald-900 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-lg"><Save className="w-5 h-5" /> Lưu nguyên liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UnsavedChangesDialog isOpen={modal.showUnsavedDialog} onSave={handleSaveAndBack} onDiscard={modal.discardAndBack} onCancel={modal.dismissUnsavedDialog} />
      <ConfirmationModal isOpen={deleteConfirmation.isOpen} variant="danger" title="Xóa nguyên liệu?" message={<p>Bạn có chắc chắn muốn xóa <span className="font-bold text-slate-800 dark:text-slate-100">&quot;{deleteConfirmation.ingredientName}&quot;</span>?{deleteConfirmation.usageCount > 0 && <span className="block mt-2 text-rose-600 font-medium text-sm bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl">Cảnh báo: Nguyên liệu này đang được dùng trong {deleteConfirmation.usageCount} món ăn{deleteConfirmation.exampleDish ? ` (ví dụ: ${deleteConfirmation.exampleDish})` : ''}. Xóa nó sẽ ảnh hưởng đến các món ăn này.</span>}</p>} confirmLabel="Xóa ngay" onConfirm={confirmDelete} onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })} />
    </div>
  );
};

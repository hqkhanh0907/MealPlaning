import React, { useState, useMemo } from 'react';
import { Ingredient, Dish } from '../types';
import { Plus, Trash2, Edit3, X, Save, Search, Apple, Sparkles, Loader2, LayoutGrid, List } from 'lucide-react';
import { suggestIngredientInfo } from '../services/geminiService';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmationModal } from './modals/ConfirmationModal';

type ViewLayout = 'grid' | 'list';
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

export const IngredientManager: React.FC<IngredientManagerProps> = ({ ingredients, dishes = [], onAdd, onUpdate, onDelete, isUsed }) => {
  const notify = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  const isModalOpenRef = React.useRef(isModalOpen);
  React.useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>({
    name: '',
    caloriesPer100: 0,
    proteinPer100: 0,
    carbsPer100: 0,
    fatPer100: 0,
    fiberPer100: 0,
    unit: ''
  });

  const [formErrors, setFormErrors] = useState<{ name?: string; unit?: string }>({});

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    ingredientId: string | null;
    ingredientName: string;
    usageCount: number;
    exampleDish?: string;
  }>({
    isOpen: false,
    ingredientId: null,
    ingredientName: '',
    usageCount: 0
  });

  const handleOpenModal = (ing?: Ingredient) => {
    if (ing) {
      setEditingIng(ing);
      setFormData({ ...ing });
    } else {
      setEditingIng(null);
      setFormData({
        name: '',
        caloriesPer100: 0,
        proteinPer100: 0,
        carbsPer100: 0,
        fatPer100: 0,
        fiberPer100: 0,
        unit: ''
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleAISearch = async () => {
    if (!formData.name || !formData.unit) return;
    
    try {
      setIsSearchingAI(true);
      const info = await suggestIngredientInfo(formData.name, formData.unit);
      
      // If the component is unmounted or modal closed, do not update state
      if (!isModalOpenRef.current) return;

      setFormData(prev => ({
        ...prev,
        caloriesPer100: info.calories,
        proteinPer100: info.protein,
        carbsPer100: info.carbs,
        fatPer100: info.fat,
        fiberPer100: info.fiber
        // Giữ nguyên đơn vị tính của người dùng, không lấy từ AI trả về
      }));
    } catch (error) {
      console.error("Failed to get ingredient info:", error);
      if (!isModalOpenRef.current) return;
      if (error instanceof Error && error.message === "Timeout") {
        notify.warning('Phản hồi quá lâu', `"${formData.name}" — Hệ thống phản hồi quá lâu. Vui lòng thử lại sau.`);
      } else {
        notify.error('Tra cứu thất bại', `"${formData.name}" — Không thể tìm thấy thông tin. Vui lòng thử lại.`);
      }
    } finally {
      if (isModalOpenRef.current) {
        setIsSearchingAI(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; unit?: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập tên nguyên liệu';
    }
    if (!formData.unit.trim()) {
      errors.unit = 'Vui lòng nhập đơn vị tính';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (editingIng) {
      onUpdate({ ...formData, id: editingIng.id });
    } else {
      onAdd({ ...formData, id: `ing-${Date.now()}` });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (isUsed(id)) {
      notify.warning('Không thể xóa', 'Nguyên liệu này đang được sử dụng trong món ăn. Vui lòng gỡ khỏi các món ăn trước.');
      return;
    }
    
    setDeleteConfirmation({
      isOpen: true,
      ingredientId: id,
      ingredientName: name,
      usageCount: 0
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.ingredientId) {
      onDelete(deleteConfirmation.ingredientId);
      setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    }
  };

  const filteredIngredients = useMemo(() => {
    const filtered = ingredients.filter(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'cal-asc': return a.caloriesPer100 - b.caloriesPer100;
        case 'cal-desc': return b.caloriesPer100 - a.caloriesPer100;
        case 'pro-asc': return a.proteinPer100 - b.proteinPer100;
        case 'pro-desc': return b.proteinPer100 - a.proteinPer100;
        default: return 0;
      }
    });
  }, [ingredients, searchQuery, sortBy]);

  // Phase 5 - 6.3: Get dishes that use a specific ingredient
  const getDishesUsingIngredient = (ingId: string): string[] => {
    return dishes
      .filter(d => d.ingredients.some(di => di.ingredientId === ingId))
      .map(d => d.name);
  };

  // Helper to get display unit for labels
  const getDisplayUnit = (unit: string) => {
    const lowerUnit = unit.toLowerCase().trim();
    if (lowerUnit === 'kg' || lowerUnit === 'g') return '100g';
    if (lowerUnit === 'l' || lowerUnit === 'ml') return '100ml';
    return `1 ${unit}`; // Piece-based: display per 1 unit
  };

  return (
    <div className="space-y-6">
      {/* Search and Actions Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm nguyên liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm text-base sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="flex-1 sm:flex-none sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm text-slate-700 font-medium text-sm min-h-11"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Layout Switcher */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-2.5 transition-all min-h-11 min-w-11 flex items-center justify-center ${viewLayout === 'grid' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={`p-2.5 transition-all min-h-11 min-w-11 flex items-center justify-center ${viewLayout === 'list' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
              title="Xem dạng danh sách"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          {/* Add Button */}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200 min-h-11 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Thêm nguyên liệu</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewLayout === 'grid' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIngredients.map(ing => (
          <div key={ing.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">{ing.name}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {getDisplayUnit(ing.unit)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-50 rounded-lg p-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Calories</span>
                <span className="text-sm font-bold text-slate-700">{ing.caloriesPer100}</span>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 flex items-center justify-between">
                <span className="text-[10px] text-blue-400 font-bold uppercase">Protein</span>
                <span className="text-sm font-bold text-blue-700">{ing.proteinPer100}g</span>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 flex items-center justify-between">
                <span className="text-[10px] text-amber-400 font-bold uppercase">Carbs</span>
                <span className="text-sm font-bold text-amber-700">{ing.carbsPer100}g</span>
              </div>
              <div className="bg-rose-50 rounded-lg p-2 flex items-center justify-between">
                <span className="text-[10px] text-rose-400 font-bold uppercase">Fat</span>
                <span className="text-sm font-bold text-rose-700">{ing.fatPer100}g</span>
              </div>
            </div>

            {/* Relationship tags - 6.3 */}
            {(() => {
              const usedIn = getDishesUsingIngredient(ing.id);
              if (usedIn.length === 0) return null;
              return (
                <div className="mb-3 text-xs text-slate-500">
                  <span className="font-medium">Dùng trong: </span>
                  <span className="text-slate-600">{usedIn.length <= 2 ? usedIn.join(', ') : `${usedIn.slice(0, 2).join(', ')} +${usedIn.length - 2}`}</span>
                </div>
              );
            })()}

            <div className="mt-auto flex items-center gap-2 pt-4 border-t border-slate-50">
              <button 
                onClick={() => handleOpenModal(ing)}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
              >
                <Edit3 className="w-4 h-4" /> Sửa
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(ing.id, ing.name);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all ${isUsed(ing.id) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
              >
                <Trash2 className="w-4 h-4" /> Xóa
              </button>
            </div>
          </div>
        ))}
        {filteredIngredients.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Apple className="w-8 h-8 text-emerald-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {searchQuery ? 'Không tìm thấy nguyên liệu' : 'Chưa có nguyên liệu nào'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : 'Bắt đầu thêm nguyên liệu đầu tiên!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200"
              >
                <Plus className="w-5 h-5" /> Thêm nguyên liệu
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {/* List View */}
      {viewLayout === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nguyên liệu</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Calo</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Protein</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Carbs</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Fat</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIngredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
                          <Apple className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{ing.name}</p>
                          <p className="text-xs text-slate-500">{getDisplayUnit(ing.unit)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-slate-700">{ing.caloriesPer100}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-blue-600">{ing.proteinPer100}g</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-amber-600">{ing.carbsPer100}g</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-rose-600">{ing.fatPer100}g</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(ing)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ing.id, ing.name)}
                          className={`p-2 rounded-lg transition-all ${isUsed(ing.id) ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile List */}
          <div className="sm:hidden divide-y divide-slate-100">
            {filteredIngredients.map(ing => (
              <div key={ing.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                    <Apple className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{ing.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{ing.caloriesPer100} kcal</span>
                      <span className="text-blue-600">{ing.proteinPer100}g Pro</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenModal(ing)}
                    className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ing.id, ing.name)}
                    className={`p-2.5 rounded-lg transition-all ${isUsed(ing.id) ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Empty state for list view */}
          {filteredIngredients.length === 0 && (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Apple className="w-8 h-8 text-emerald-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                {searchQuery ? 'Không tìm thấy nguyên liệu' : 'Chưa có nguyên liệu nào'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : 'Bắt đầu thêm nguyên liệu đầu tiên!'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200"
                >
                  <Plus className="w-5 h-5" /> Thêm nguyên liệu
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-60">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden max-h-[90vh] overflow-y-auto sm:mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-lg">{editingIng ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}</h4>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="ing-name" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên nguyên liệu</label>
                <div className="flex gap-2">
                  <input 
                    id="ing-name"
                    value={formData.name}
                    onChange={e => {
                      setFormData({...formData, name: e.target.value});
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-xl border ${formErrors.name ? 'border-rose-500' : 'border-slate-200'} focus:border-emerald-500 outline-none transition-all text-base sm:text-sm`}
                    placeholder="Ví dụ: Thịt bò, Cà chua..."
                  />
                  <button
                    type="button"
                    onClick={handleAISearch}
                    disabled={!formData.name || !formData.unit || isSearchingAI}
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={formData.unit ? "Tự động điền thông tin bằng AI" : "Vui lòng nhập đơn vị tính trước khi tìm kiếm"}
                  >
                    {isSearchingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="ing-unit" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Đơn vị tính</label>
                <input
                  id="ing-unit"
                  value={formData.unit}
                  onChange={e => {
                    setFormData({...formData, unit: e.target.value});
                    if (formErrors.unit) setFormErrors(prev => ({ ...prev, unit: undefined }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.unit ? 'border-rose-500' : 'border-slate-200'} focus:border-emerald-500 outline-none transition-all text-base sm:text-sm`}
                  placeholder="g, ml, cái, quả..."
                />
                {formErrors.unit && <p className="text-xs text-rose-500 mt-1">{formErrors.unit}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Calories / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1" min="0"
                    value={formData.caloriesPer100}
                    onChange={e => setFormData({...formData, caloriesPer100: Math.max(0, Number(e.target.value))})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Protein / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1" min="0"
                    value={formData.proteinPer100}
                    onChange={e => setFormData({...formData, proteinPer100: Math.max(0, Number(e.target.value))})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Carbs / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1" min="0"
                    value={formData.carbsPer100}
                    onChange={e => setFormData({...formData, carbsPer100: Math.max(0, Number(e.target.value))})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fat / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1" min="0"
                    value={formData.fatPer100}
                    onChange={e => setFormData({...formData, fatPer100: Math.max(0, Number(e.target.value))})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fiber / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1" min="0"
                    value={formData.fiberPer100}
                    onChange={e => setFormData({...formData, fiberPer100: Math.max(0, Number(e.target.value))})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-lg">
                  <Save className="w-5 h-5" />
                  Lưu nguyên liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        variant="danger"
        title="Xóa nguyên liệu?"
        message={
          <p>
            Bạn có chắc chắn muốn xóa <span className="font-bold text-slate-800">&quot;{deleteConfirmation.ingredientName}&quot;</span>?
            {deleteConfirmation.usageCount > 0 && (
              <span className="block mt-2 text-rose-600 font-medium text-sm bg-rose-50 p-3 rounded-xl">
                Cảnh báo: Nguyên liệu này đang được dùng trong {deleteConfirmation.usageCount} món ăn
                {deleteConfirmation.exampleDish ? ` (ví dụ: ${deleteConfirmation.exampleDish})` : ''}.
                Xóa nó sẽ ảnh hưởng đến các món ăn này.
              </span>
            )}
          </p>
        }
        confirmLabel="Xóa ngay"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
      />
    </div>
  );
};

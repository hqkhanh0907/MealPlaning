import React, { useState, useMemo } from 'react';
import { Dish, Ingredient, DishIngredient, MealType } from '../types';
import { calculateDishNutrition } from '../utils/nutrition';
import { Plus, Trash2, Edit3, X, Save, Search, ChefHat, Minus, LayoutGrid, List } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmationModal } from './modals/ConfirmationModal';

type ViewLayout = 'grid' | 'list';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<MealType | null>(null);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  const [name, setName] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<DishIngredient[]>([]);
  const [tags, setTags] = useState<MealType[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{ tags?: string }>({});

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    dishId: string | null;
    dishName: string;
  }>({ isOpen: false, dishId: null, dishName: '' });

  const handleOpenModal = (dish?: Dish) => {
    if (dish) {
      setEditingDish(dish);
      setName(dish.name);
      setSelectedIngredients([...dish.ingredients]);
      setTags([...(dish.tags || [])]);
    } else {
      setEditingDish(null);
      setName('');
      setSelectedIngredients([]);
      setTags([]);
    }
    setIngredientSearch('');
    setFormErrors({});
    setIsModalOpen(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: { tags?: string } = {};

    if (tags.length === 0) {
      errors.tags = 'Vui lòng chọn ít nhất một bữa ăn phù hợp';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!name || selectedIngredients.length === 0) return;

    const dishData: Dish = {
      id: editingDish ? editingDish.id : `dish-${Date.now()}`,
      name,
      ingredients: selectedIngredients,
      tags,
    };

    if (editingDish) onUpdate(dishData);
    else onAdd(dishData);
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (isUsed(id)) {
      notify.warning('Không thể xóa', 'Món ăn này đang được sử dụng trong kế hoạch. Vui lòng gỡ khỏi kế hoạch trước.');
      return;
    }
    setDeleteConfirmation({
      isOpen: true,
      dishId: id,
      dishName: name
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.dishId) {
      onDelete(deleteConfirmation.dishId);
      setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    }
  };

  const filteredDishes = useMemo(() => {
    const filtered = dishes
      .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(d => !filterTag || d.tags?.includes(filterTag));

    return filtered.sort((a, b) => {
      const nutritionA = calculateDishNutrition(a, ingredients);
      const nutritionB = calculateDishNutrition(b, ingredients);

      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'cal-asc': return nutritionA.calories - nutritionB.calories;
        case 'cal-desc': return nutritionB.calories - nutritionA.calories;
        case 'pro-asc': return nutritionA.protein - nutritionB.protein;
        case 'pro-desc': return nutritionB.protein - nutritionA.protein;
        case 'ing-asc': return a.ingredients.length - b.ingredients.length;
        case 'ing-desc': return b.ingredients.length - a.ingredients.length;
        default: return 0;
      }
    });
  }, [dishes, searchQuery, filterTag, sortBy, ingredients]);

  return (
    <div className="space-y-6">
      {/* Search and Actions Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm món ăn..."
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
            className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 min-h-11 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Thêm món ăn</span>
          </button>
        </div>
      </div>

      {/* Tag filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mt-2">
        <button
          onClick={() => setFilterTag(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all min-h-8 ${!filterTag ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          Tất cả ({dishes.length})
        </button>
        {TAG_OPTIONS.map(({ type, label, icon }) => {
          const count = dishes.filter(d => d.tags?.includes(type)).length;
          return (
            <button
              key={type}
              onClick={() => setFilterTag(filterTag === type ? null : type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all min-h-8 ${filterTag === type ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {icon} {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid View */}
      {viewLayout === 'grid' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDishes.map(dish => {
          const nutrition = calculateDishNutrition(dish, ingredients);
          return (
            <div key={dish.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{dish.name}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {dish.ingredients.length} nguyên liệu
                    </p>
                    {dish.tags && dish.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {dish.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {TAG_SHORT_LABELS[tag]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 rounded-lg p-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Calories</span>
                  <span className="text-sm font-bold text-slate-700">{Math.round(nutrition.calories)}</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 flex items-center justify-between">
                  <span className="text-[10px] text-blue-400 font-bold uppercase">Protein</span>
                  <span className="text-sm font-bold text-blue-700">{Math.round(nutrition.protein)}g</span>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-4 border-t border-slate-50">
                <button 
                  onClick={() => handleOpenModal(dish)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                >
                  <Edit3 className="w-4 h-4" /> Sửa
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(dish.id, dish.name);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all ${isUsed(dish.id) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
                >
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              </div>
            </div>
          );
        })}
        {filteredDishes.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-emerald-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {searchQuery ? 'Không tìm thấy món ăn' : 'Chưa có món ăn nào'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : 'Bắt đầu tạo món ăn đầu tiên của bạn!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200"
              >
                <Plus className="w-5 h-5" /> Tạo món ăn
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
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Món ăn</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Tags</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Calo</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Protein</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDishes.map(dish => {
                  const nutrition = calculateDishNutrition(dish, ingredients);
                  return (
                    <tr key={dish.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
                            <ChefHat className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{dish.name}</p>
                            <p className="text-xs text-slate-500">{dish.ingredients.length} nguyên liệu</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {dish.tags?.map(tag => (
                            <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {TAG_SHORT_LABELS[tag]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-slate-700">{Math.round(nutrition.calories)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-blue-600">{Math.round(nutrition.protein)}g</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(dish)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dish.id, dish.name)}
                            className={`p-2 rounded-lg transition-all ${isUsed(dish.id) ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="sm:hidden divide-y divide-slate-100">
            {filteredDishes.map(dish => {
              const nutrition = calculateDishNutrition(dish, ingredients);
              return (
                <div key={dish.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{dish.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{Math.round(nutrition.calories)} kcal</span>
                        <span className="text-blue-600">{Math.round(nutrition.protein)}g Pro</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenModal(dish)}
                      className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dish.id, dish.name)}
                      className={`p-2.5 rounded-lg transition-all ${isUsed(dish.id) ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Empty state for list view */}
          {filteredDishes.length === 0 && (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-emerald-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                {searchQuery ? 'Không tìm thấy món ăn' : 'Chưa có món ăn nào'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : 'Bắt đầu tạo món ăn đầu tiên của bạn!'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200"
                >
                  <Plus className="w-5 h-5" /> Tạo món ăn
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-60">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-lg">{editingDish ? 'Sửa món ăn' : 'Tạo món ăn mới'}</h4>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label htmlFor="dish-name" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên món ăn</label>
                <input
                  id="dish-name"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all text-base sm:text-sm"
                  placeholder="VD: Ức gà áp chảo"
                />
              </div>

              <div>
                <p className={`block text-xs font-bold uppercase mb-1.5 ${formErrors.tags ? 'text-rose-500' : 'text-slate-500'}`}>
                  Phù hợp cho bữa <span className="text-rose-500">*</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {TAG_OPTIONS.map(({ type, label, icon }) => {
                    const isActive = tags.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setTags(prev => isActive ? prev.filter(t => t !== type) : [...prev, type]);
                          // Clear error when user selects a tag
                          if (!isActive && formErrors.tags) {
                            setFormErrors(prev => ({ ...prev, tags: undefined }));
                          }
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all min-h-11 ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'}`}
                      >
                        {icon} {label}
                      </button>
                    );
                  })}
                </div>
                {formErrors.tags && (
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">{formErrors.tags}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ingredient Selector */}
                <div className="space-y-3">
                  <p className="block text-xs font-bold text-slate-500 uppercase">Chọn nguyên liệu</p>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={ingredientSearch}
                      onChange={e => setIngredientSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all" placeholder="Tìm nguyên liệu..." />
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {ingredients
                      .filter(ing => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
                      .map(ing => (
                      <button
                        key={ing.id}
                        type="button"
                        onClick={() => handleAddIngredient(ing.id)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 flex items-center justify-between group transition-all"
                      >
                        <span className="text-slate-700 font-medium">{ing.name}</span>
                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Ingredients */}
                <div className="space-y-3">
                  <p className="block text-xs font-bold text-slate-500 uppercase">Nguyên liệu đã chọn</p>
                  <div className="space-y-2">
                    {selectedIngredients.map(si => {
                      const ing = ingredients.find(i => i.id === si.ingredientId);
                      if (!ing) return null;
                      return (
                        <div key={si.ingredientId} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{ing.name}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateAmount(si.ingredientId, Math.max(0.1, si.amount - 10))}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center text-slate-600 transition-all"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={si.amount}
                                onChange={e => handleUpdateAmount(si.ingredientId, Math.max(0.1, Number(e.target.value) || 0.1))}
                                className="w-16 px-2 py-1 text-sm text-center rounded-lg border border-slate-200 outline-none focus:border-emerald-500 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateAmount(si.ingredientId, si.amount + 10)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center text-slate-600 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-medium text-slate-500 ml-1">{ing.unit}</span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveIngredient(si.ingredientId)}
                            className="p-2 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {selectedIngredients.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">Chưa chọn nguyên liệu</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100">
              <button 
                type="button"
                onClick={handleSubmit}
                className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-lg"
              >
                <Save className="w-5 h-5" />
                Lưu món ăn
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        variant="danger"
        title="Xóa món ăn?"
        message={
          <p>
            Bạn có chắc chắn muốn xóa món <span className="font-bold text-slate-800">&quot;{deleteConfirmation.dishName}&quot;</span>?
            <br/>Hành động này không thể hoàn tác.
          </p>
        }
        confirmLabel="Xóa ngay"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
      />
    </div>
  );
};

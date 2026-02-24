import React, { useState } from 'react';
import { Dish, Ingredient, DishIngredient } from '../types';
import { calculateDishNutrition } from '../utils/nutrition';
import { Plus, Trash2, Edit3, X, Save, Search, ChefHat } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

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

  const [name, setName] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<DishIngredient[]>([]);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    dishId: string | null;
    dishName: string;
  }>({
    isOpen: false,
    dishId: null,
    dishName: ''
  });

  const handleOpenModal = (dish?: Dish) => {
    if (dish) {
      setEditingDish(dish);
      setName(dish.name);
      setSelectedIngredients([...dish.ingredients]);
    } else {
      setEditingDish(null);
      setName('');
      setSelectedIngredients([]);
    }
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
    if (!name || selectedIngredients.length === 0) return;

    const dishData: Dish = {
      id: editingDish ? editingDish.id : `dish-${Date.now()}`,
      name,
      ingredients: selectedIngredients
    };

    if (editingDish) onUpdate(dishData);
    else onAdd(dishData);
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (isUsed(id)) {
      notify.warning('Không thể xóa', 'Món ăn này đang được sử dụng trong bữa ăn. Vui lòng gỡ khỏi các bữa ăn trước.');
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

  const filteredDishes = dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm text-base sm:text-sm"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
        >
          <Plus className="w-5 h-5" /> Thêm món ăn
        </button>
      </div>

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
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
            Không tìm thấy món ăn nào.
          </div>
        )}
      </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ingredient Selector */}
                <div className="space-y-3">
                  <p className="block text-xs font-bold text-slate-500 uppercase">Chọn nguyên liệu</p>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-9 pr-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all" placeholder="Tìm nguyên liệu..." />
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {ingredients.map(ing => (
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
                            <div className="flex items-center gap-2 mt-1.5">
                              <input 
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={si.amount}
                                onChange={e => handleUpdateAmount(si.ingredientId, Math.max(0.1, Number(e.target.value) || 0.1))}
                                className="w-20 px-2.5 py-1 text-sm rounded-lg border border-slate-200 outline-none focus:border-emerald-500 transition-all"
                              />
                              <span className="text-xs font-medium text-slate-500">{ing.unit}</span>
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
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-70">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-sm overflow-hidden sm:mx-4">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-xl mb-2">Xóa món ăn?</h4>
              <p className="text-slate-600 mb-6">
                Bạn có chắc chắn muốn xóa món <span className="font-bold text-slate-800">"{deleteConfirmation.dishName}"</span>?
                <br/>Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold shadow-sm shadow-rose-200 hover:bg-rose-600 transition-all"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Meal, Dish, Ingredient, MealType } from '../types';
import { calculateMealNutrition } from '../utils/nutrition';
import { Plus, Trash2, Edit3, X, Save, Utensils, Search } from 'lucide-react';

interface MealManagerProps {
  meals: Meal[];
  dishes: Dish[];
  ingredients: Ingredient[];
  onAdd: (meal: Meal) => void;
  onUpdate: (meal: Meal) => void;
  onDelete: (id: string) => void;
  isUsed: (id: string) => boolean;
}

export const MealManager: React.FC<MealManagerProps> = ({ meals, dishes, ingredients, onAdd, onUpdate, onDelete, isUsed }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc'>('name-asc');

  const [name, setName] = useState('');
  const [type, setType] = useState<MealType>('breakfast');
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);

  const handleOpenModal = (meal?: Meal) => {
    if (meal) {
      setEditingMeal(meal);
      setName(meal.name);
      setType(meal.type);
      setSelectedDishIds([...meal.dishIds]);
    } else {
      setEditingMeal(null);
      setName('');
      setType('breakfast');
      setSelectedDishIds([]);
    }
    setIsModalOpen(true);
  };

  const toggleDish = (dishId: string) => {
    if (selectedDishIds.includes(dishId)) {
      setSelectedDishIds(selectedDishIds.filter(id => id !== dishId));
    } else {
      setSelectedDishIds([...selectedDishIds, dishId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedDishIds.length === 0) return;

    const mealData: Meal = {
      id: editingMeal ? editingMeal.id : `meal-${Date.now()}`,
      name,
      type,
      dishIds: selectedDishIds
    };

    if (editingMeal) onUpdate(mealData);
    else onAdd(mealData);
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (isUsed(id)) {
      alert("Bữa ăn này đang được sử dụng trong kế hoạch. Không thể xóa!");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa bữa ăn này?")) {
      onDelete(id);
    }
  };

  const filteredMeals = meals
    .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const nutritionA = calculateMealNutrition(a, dishes, ingredients);
      const nutritionB = calculateMealNutrition(b, dishes, ingredients);
      
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'cal-asc':
          return nutritionA.calories - nutritionB.calories;
        case 'cal-desc':
          return nutritionB.calories - nutritionA.calories;
        case 'pro-asc':
          return nutritionA.protein - nutritionB.protein;
        case 'pro-desc':
          return nutritionB.protein - nutritionA.protein;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm bữa ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm text-slate-700 font-medium appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
          >
            <option value="name-asc">Tên (A-Z)</option>
            <option value="name-desc">Tên (Z-A)</option>
            <option value="cal-asc">Calo (Thấp - Cao)</option>
            <option value="cal-desc">Calo (Cao - Thấp)</option>
            <option value="pro-asc">Protein (Thấp - Cao)</option>
            <option value="pro-desc">Protein (Cao - Thấp)</option>
          </select>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200 shrink-0"
        >
          <Plus className="w-5 h-5" /> Thêm bữa ăn
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeals.map(meal => {
          const nutrition = calculateMealNutrition(meal, dishes, ingredients);
          return (
            <div key={meal.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-800 text-lg">{meal.name}</p>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase">
                        {meal.type === 'breakfast' ? 'Sáng' : meal.type === 'lunch' ? 'Trưa' : 'Tối'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {meal.dishIds.length} món ăn
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
                  onClick={() => handleOpenModal(meal)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                >
                  <Edit3 className="w-4 h-4" /> Sửa
                </button>
                <button 
                  onClick={() => handleDelete(meal.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all ${isUsed(meal.id) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
                >
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              </div>
            </div>
          );
        })}
        {filteredMeals.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
            Không tìm thấy bữa ăn nào.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-lg">{editingMeal ? 'Sửa bữa ăn' : 'Tạo bữa ăn mới'}</h4>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên bữa ăn</label>
                  <input 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                    placeholder="VD: Bữa sáng giàu đạm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Loại bữa ăn</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value as MealType)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white transition-all"
                  >
                    <option value="breakfast">Bữa Sáng</option>
                    <option value="lunch">Bữa Trưa</option>
                    <option value="dinner">Bữa Tối</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase">Chọn các món ăn</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dishes.map(dish => {
                    const isSelected = selectedDishIds.includes(dish.id);
                    return (
                      <button
                        key={dish.id}
                        type="button"
                        onClick={() => toggleDish(dish.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${isSelected ? 'border-emerald-500 bg-white' : 'border-slate-100 hover:border-emerald-200'}`}
                      >
                        <span className={`text-sm font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{dish.name}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent group-hover:border-emerald-300'}`}>
                          <X className={`w-3 h-3 rotate-45 ${isSelected ? 'block' : 'hidden'}`} />
                        </div>
                      </button>
                    );
                  })}
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
                Lưu bữa ăn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

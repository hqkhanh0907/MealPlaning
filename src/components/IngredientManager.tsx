import React, { useState } from 'react';
import { Ingredient, Dish } from '../types';
import { Plus, Trash2, Edit3, X, Save, Search, Apple, Sparkles, Loader2 } from 'lucide-react';
import { suggestIngredientInfo } from '../services/geminiService';

interface IngredientManagerProps {
  ingredients: Ingredient[];
  dishes?: Dish[];
  onAdd: (ing: Ingredient) => void;
  onUpdate: (ing: Ingredient) => void;
  onDelete: (id: string) => void;
  isUsed: (id: string) => boolean;
}

export const IngredientManager: React.FC<IngredientManagerProps> = ({ ingredients, dishes, onAdd, onUpdate, onDelete, isUsed }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingAI, setIsSearchingAI] = useState(false);

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
    unit: 'g'
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
        unit: 'g'
      });
    }
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
    } catch (error: any) {
      console.error("Failed to get ingredient info:", error);
      if (!isModalOpenRef.current) return;
      if (error.message === "Timeout") {
        alert("Hệ thống phản hồi quá lâu. Vui lòng thử lại sau.");
      } else {
        alert("Không thể tìm thấy thông tin nguyên liệu. Vui lòng thử lại.");
      }
    } finally {
      if (isModalOpenRef.current) {
        setIsSearchingAI(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIng) {
      onUpdate({ ...formData, id: editingIng.id });
    } else {
      onAdd({ ...formData, id: `ing-${Date.now()}` });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    // Check if used in any dish (even if not planned)
    const usedInDishes = dishes?.filter(d => d.ingredients.some(di => di.ingredientId === id)) || [];
    
    if (usedInDishes.length > 0) {
      if (!window.confirm(`Nguyên liệu này đang được sử dụng trong ${usedInDishes.length} món ăn (ví dụ: ${usedInDishes[0].name}). Xóa nó sẽ loại bỏ nó khỏi các món ăn này. Bạn có chắc chắn không?`)) {
        return;
      }
    } else {
      if (!window.confirm("Bạn có chắc chắn muốn xóa nguyên liệu này?")) {
        return;
      }
    }
    
    onDelete(id);
  };

  const filteredIngredients = ingredients.filter(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Helper to get display unit for labels
  const getDisplayUnit = (unit: string) => {
    const lowerUnit = unit.toLowerCase().trim();
    if (lowerUnit === 'kg' || lowerUnit === 'g') return '100g';
    if (lowerUnit === 'l' || lowerUnit === 'ml') return '100ml';
    return `1 ${unit}`; // Piece-based: display per 1 unit
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm nguyên liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
        >
          <Plus className="w-5 h-5" /> Thêm nguyên liệu
        </button>
      </div>

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
            
            <div className="grid grid-cols-2 gap-2 mb-4">
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

            <div className="mt-auto flex items-center gap-2 pt-4 border-t border-slate-50">
              <button 
                onClick={() => handleOpenModal(ing)}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
              >
                <Edit3 className="w-4 h-4" /> Sửa
              </button>
              <button 
                onClick={() => handleDelete(ing.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" /> Xóa
              </button>
            </div>
          </div>
        ))}
        {filteredIngredients.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
            Không tìm thấy nguyên liệu nào.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-lg">{editingIng ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}</h4>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên nguyên liệu</label>
                <div className="flex gap-2">
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ví dụ: Thịt bò, Cà chua..."
                  />
                  <button
                    type="button"
                    onClick={handleAISearch}
                    disabled={!formData.name || !formData.unit || isSearchingAI}
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!formData.unit ? "Vui lòng nhập đơn vị tính trước khi tìm kiếm" : "Tự động điền thông tin bằng AI"}
                  >
                    {isSearchingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Đơn vị tính</label>
                <input 
                  required
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  placeholder="g, ml, cái, quả..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Calories / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1"
                    value={formData.caloriesPer100}
                    onChange={e => setFormData({...formData, caloriesPer100: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Protein / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1"
                    value={formData.proteinPer100}
                    onChange={e => setFormData({...formData, proteinPer100: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Carbs / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1"
                    value={formData.carbsPer100}
                    onChange={e => setFormData({...formData, carbsPer100: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fat / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1"
                    value={formData.fatPer100}
                    onChange={e => setFormData({...formData, fatPer100: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fiber / {getDisplayUnit(formData.unit)}</label>
                  <input 
                    type="number" required step="0.1"
                    value={formData.fiberPer100}
                    onChange={e => setFormData({...formData, fiberPer100: Number(e.target.value)})}
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
    </div>
  );
};

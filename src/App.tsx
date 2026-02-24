import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initialIngredients, initialDishes, initialMeals } from './data/initialData';
import { Ingredient, Dish, Meal, DayPlan, MealType, DishIngredient, UserProfile } from './types';
import { calculateMealNutrition } from './utils/nutrition';
import { Summary } from './components/Summary';
import { GroceryList } from './components/GroceryList';
import { DateSelector } from './components/DateSelector';
import { IngredientManager } from './components/IngredientManager';
import { DishManager } from './components/DishManager';
import { MealManager } from './components/MealManager';
import { AIImageAnalyzer } from './components/AIImageAnalyzer';
import { 
  CalendarDays, 
  Settings2, 
  Plus, 
  Edit3, 
  ChevronRight, 
  Utensils, 
  Info,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Search,
  X,
  Trash2,
  Sparkles,
  Loader2,
  Target,
  XCircle,
  AlertTriangle
} from 'lucide-react';

type NotificationState = {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  onClick?: () => void;
} | null;
import { suggestMealPlan } from './services/geminiService';

export default function App() {
  const [activeMainTab, setActiveMainTab] = useState<'calendar' | 'management' | 'ai-analysis'>('calendar');
  const activeMainTabRef = useRef(activeMainTab);

  useEffect(() => {
    activeMainTabRef.current = activeMainTab;
  }, [activeMainTab]);

  const [activeManagementSubTab, setActiveManagementSubTab] = useState<'ingredients' | 'dishes' | 'meals'>('meals');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    weight: 83,
    proteinRatio: 2, // 2g per kg
    targetCalories: 1500
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // State for library
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);

  // Planning Modal State
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [isTypeSelectionModalOpen, setIsTypeSelectionModalOpen] = useState(false);
  const [isClearPlanModalOpen, setIsClearPlanModalOpen] = useState(false);
  const [planningType, setPlanningType] = useState<MealType | null>(null);
  const [planningSearchQuery, setPlanningSearchQuery] = useState('');
  const [planningSortBy, setPlanningSortBy] = useState<'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc'>('name-asc');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const currentPlan = useMemo(() => {
    return dayPlans.find(p => p.date === selectedDate) || {
      date: selectedDate,
      breakfastId: null,
      lunchId: null,
      dinnerId: null
    };
  }, [dayPlans, selectedDate]);

  const handlePlanMeal = (type: MealType) => {
    setPlanningType(type);
    setIsTypeSelectionModalOpen(false);
    setIsPlanningModalOpen(true);
    setPlanningSearchQuery('');
  };

  const handleSuggestMealPlan = async () => {
    try {
      setIsSuggesting(true);
      
      // Prepare available meals with nutrition for AI
      const availableMeals = meals.map(m => {
        const nutrition = calculateMealNutrition(m, dishes, ingredients);
        return {
          id: m.id,
          name: m.name,
          type: m.type,
          calories: Math.round(nutrition.calories),
          protein: Math.round(nutrition.protein)
        };
      });

      const suggestion = await suggestMealPlan(
        userProfile.targetCalories, 
        Math.round(userProfile.weight * userProfile.proteinRatio), 
        availableMeals
      );
      
      if (suggestion.breakfastId || suggestion.lunchId || suggestion.dinnerId) {
        setDayPlans(prev => {
          const existing = prev.find(p => p.date === selectedDate);
          if (existing) {
            return prev.map(p => p.date === selectedDate ? { 
              ...p, 
              breakfastId: suggestion.breakfastId || p.breakfastId,
              lunchId: suggestion.lunchId || p.lunchId,
              dinnerId: suggestion.dinnerId || p.dinnerId
            } : p);
          }
          return [...prev, {
            date: selectedDate,
            breakfastId: suggestion.breakfastId || null,
            lunchId: suggestion.lunchId || null,
            dinnerId: suggestion.dinnerId || null
          }];
        });
        
        if (suggestion.reasoning) {
          alert(`AI Gợi ý: ${suggestion.reasoning}`);
        }
      }
    } catch (error) {
      console.error("Failed to suggest meal plan:", error);
      alert("Có lỗi xảy ra khi gợi ý thực đơn. Vui lòng kiểm tra lại cấu hình API Key.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleClearPlan = (scope: 'day' | 'week' | 'month') => {
    setDayPlans(prev => {
      const targetDate = new Date(selectedDate);
      
      if (scope === 'day') {
        return prev.filter(p => p.date !== selectedDate);
      }
      
      if (scope === 'week') {
        const day = targetDate.getDay();
        const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(targetDate.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return prev.filter(p => {
          const pDate = new Date(p.date);
          return pDate < startOfWeek || pDate > endOfWeek;
        });
      }
      
      if (scope === 'month') {
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        
        return prev.filter(p => {
          const pDate = new Date(p.date);
          return pDate.getFullYear() !== year || pDate.getMonth() !== month;
        });
      }
      
      return prev;
    });
    
    setIsClearPlanModalOpen(false);
  };

  const selectedMealsForSummary = useMemo(() => {
    const getMeal = (id: string | null) => {
      if (!id) return null;
      const meal = meals.find(m => m.id === id);
      if (!meal) return null;
      const nutrition = calculateMealNutrition(meal, dishes, ingredients);
      return {
        ...meal,
        ...nutrition,
      } as any;
    };

    return {
      breakfast: getMeal(currentPlan.breakfastId),
      lunch: getMeal(currentPlan.lunchId),
      dinner: getMeal(currentPlan.dinnerId)
    };
  }, [currentPlan, meals, dishes, ingredients]);

  const handleUpdatePlan = (type: MealType, mealId: string | null) => {
    setDayPlans(prev => {
      const existing = prev.find(p => p.date === selectedDate);
      if (existing) {
        return prev.map(p => p.date === selectedDate ? { ...p, [`${type}Id`]: mealId } : p);
      }
      return [...prev, {
        date: selectedDate,
        breakfastId: type === 'breakfast' ? mealId : null,
        lunchId: type === 'lunch' ? mealId : null,
        dinnerId: type === 'dinner' ? mealId : null
      }];
    });
  };

  // Check if item is used in any plan
  const isMealUsed = (mealId: string) => dayPlans.some(p => p.breakfastId === mealId || p.lunchId === mealId || p.dinnerId === mealId);
  // Dish is used if it belongs to ANY meal (not just planned ones)
  const isDishUsed = (dishId: string) => meals.some(m => m.dishIds.includes(dishId));
  // Ingredient is used if it belongs to ANY dish (not just used ones) - simplified to protect data integrity
  const isIngredientUsed = (ingId: string) => dishes.some(d => d.ingredients.some(di => di.ingredientId === ingId));

  const handleSaveAnalyzedDish = (result: any) => {
    // 1. Process Ingredients
    const newIngredients: Ingredient[] = [];
    const dishIngredients: DishIngredient[] = [];
    
    // We need a local copy of ingredients to check against, including newly created ones in this loop
    const currentIngredients = [...ingredients];

    // result.ingredients now contains only the SELECTED ingredients
    result.ingredients.forEach((aiIng: any) => {
      // Check if ingredient already exists (by name)
      let existingIng = currentIngredients.find(i => i.name.toLowerCase() === aiIng.name.toLowerCase());
      
      if (!existingIng) {
        // Create new ingredient
        const newIng: Ingredient = {
          id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: aiIng.name,
          unit: aiIng.unit,
          caloriesPer100: aiIng.nutritionPerStandardUnit.calories,
          proteinPer100: aiIng.nutritionPerStandardUnit.protein,
          carbsPer100: aiIng.nutritionPerStandardUnit.carbs,
          fatPer100: aiIng.nutritionPerStandardUnit.fat,
          fiberPer100: aiIng.nutritionPerStandardUnit.fiber
        };
        newIngredients.push(newIng);
        currentIngredients.push(newIng);
        existingIng = newIng;
      }

      // Add to dish ingredients
      dishIngredients.push({
        ingredientId: existingIng.id,
        amount: aiIng.amount
      });
    });

    // Update ingredients state
    if (newIngredients.length > 0) {
      setIngredients(prev => [...prev, ...newIngredients]);
    }

    // 2. Create Dish (Only if shouldCreateDish is true or undefined/legacy)
    if (result.shouldCreateDish !== false) {
      const newDish: Dish = {
        id: `dish-${Date.now()}`,
        name: result.name,
        ingredients: dishIngredients
      };

      setDishes(prev => [...prev, newDish]);
      alert(`Đã lưu món "${result.name}" và ${newIngredients.length} nguyên liệu mới vào thư viện!`);
      setActiveMainTab('management');
      setActiveManagementSubTab('dishes');
    } else {
      alert(`Đã lưu ${newIngredients.length} nguyên liệu mới vào thư viện!`);
      setActiveMainTab('management');
      setActiveManagementSubTab('ingredients');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-sm">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Smart Meal Planner</h1>
              <p className="text-xs text-slate-500 font-medium">Dinh dưỡng chính xác cho {userProfile.weight}kg</p>
            </div>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveMainTab('calendar')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeMainTab === 'calendar' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Lịch trình</span>
            </button>
            <button 
              onClick={() => setActiveMainTab('management')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeMainTab === 'management' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Quản lý</span>
            </button>
            <button 
              onClick={() => setActiveMainTab('ai-analysis')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeMainTab === 'ai-analysis' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Phân tích</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={activeMainTab === 'calendar' ? 'block' : 'hidden'}>
          <div className="space-y-8 sm:space-y-12">
            {/* Date Selection */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xl">
                  <CalendarDays className="w-6 h-6 text-emerald-500" />
                  <h2>Chọn ngày</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full border border-slate-200 text-center">
                    {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <button 
                    onClick={() => setIsTypeSelectionModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
                  >
                    <Plus className="w-4 h-4" />
                    Lên kế hoạch
                  </button>
                </div>
              </div>
              <DateSelector 
                selectedDate={selectedDate} 
                onSelectDate={setSelectedDate} 
                onPlanClick={() => setIsTypeSelectionModalOpen(true)}
                dayPlans={dayPlans}
              />
            </section>

            {/* Overview & Recommendation */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Summary 
                  selectedMeals={selectedMealsForSummary} 
                  targetCalories={userProfile.targetCalories} 
                  targetProtein={Math.round(userProfile.weight * userProfile.proteinRatio)} 
                  onEditGoals={() => setIsGoalModalOpen(true)}
                />
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
                  <Info className="w-5 h-5" />
                  <h3>Gợi ý cho bạn</h3>
                </div>
                <div className="flex-1 space-y-4 text-sm text-slate-600 leading-relaxed">
                  <p>
                    Dựa trên trọng lượng <strong>{userProfile.weight}kg</strong>, bạn cần duy trì lượng protein cao (<strong>{Math.round(userProfile.weight * userProfile.proteinRatio)}g</strong>) để bảo vệ cơ bắp trong khi thâm hụt calo.
                  </p>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-emerald-800 font-medium mb-1">Mẹo tiêu hóa:</p>
                    <p className="text-emerald-700/80">
                      Hãy ưu tiên các món có Kimchi hoặc Sữa chua Hy Lạp để bổ sung probiotics, giúp hấp thụ protein tốt hơn.
                    </p>
                  </div>
                  {selectedMealsForSummary.breakfast && selectedMealsForSummary.lunch && selectedMealsForSummary.dinner ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Kế hoạch ngày hôm nay đã hoàn tất!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Bạn còn thiếu {(!selectedMealsForSummary.breakfast ? 'bữa sáng, ' : '') + (!selectedMealsForSummary.lunch ? 'bữa trưa, ' : '') + (!selectedMealsForSummary.dinner ? 'bữa tối' : '')}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Planning Section */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Kế hoạch ăn uống</h2>
                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleSuggestMealPlan}
                    disabled={isSuggesting}
                    className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-medium hover:bg-indigo-100 transition-all disabled:opacity-50"
                  >
                    {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gợi ý AI
                  </button>
                  <button 
                    onClick={() => setIsClearPlanModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-medium hover:bg-rose-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </button>
                  <button 
                    onClick={() => setIsTypeSelectionModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
                  >
                    <Plus className="w-4 h-4" />
                    Lên kế hoạch
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(type => {
                  const mealId = currentPlan[`${type}Id` as keyof DayPlan] as string | null;
                  const meal = meals.find(m => m.id === mealId);
                  const nutrition = meal ? calculateMealNutrition(meal, dishes, ingredients) : null;

                  return (
                    <div key={type} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {type === 'breakfast' ? 'Bữa Sáng' : type === 'lunch' ? 'Bữa Trưa' : 'Bữa Tối'}
                        </span>
                        <button 
                          onClick={() => handlePlanMeal(type)}
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {meal ? (
                        <div className="space-y-3">
                          <h4 className="font-bold text-slate-800 text-lg">{meal.name}</h4>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                              {Math.round(nutrition!.calories)} kcal
                            </span>
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">
                              {Math.round(nutrition!.protein)}g Pro
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                          <p className="text-sm text-slate-400">Chưa có món ăn</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Grocery List */}
            <section className="pt-8 border-t border-slate-200">
              <GroceryList 
                selectedMeals={selectedMealsForSummary} 
                allDishes={dishes}
                allIngredients={ingredients}
              />
            </section>
          </div>
        </div>

        <div className={activeMainTab === 'management' ? 'block' : 'hidden'}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800">Thư viện dữ liệu</h2>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveManagementSubTab('meals')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeManagementSubTab === 'meals' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Bữa ăn
                </button>
                <button 
                  onClick={() => setActiveManagementSubTab('dishes')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeManagementSubTab === 'dishes' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Món ăn
                </button>
                <button 
                  onClick={() => setActiveManagementSubTab('ingredients')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeManagementSubTab === 'ingredients' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Nguyên liệu
                </button>
              </div>
            </div>

            {activeManagementSubTab === 'ingredients' && (
              <IngredientManager 
                ingredients={ingredients}
                dishes={dishes}
                onAdd={ing => setIngredients(prev => [...prev, ing])}
                onUpdate={ing => setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i))}
                onDelete={id => {
                  setIngredients(prev => prev.filter(i => i.id !== id));
                  setDishes(prev => prev.map(d => ({
                    ...d,
                    ingredients: d.ingredients.filter(di => di.ingredientId !== id)
                  })));
                }}
                isUsed={isIngredientUsed}
              />
            )}

            {activeManagementSubTab === 'dishes' && (
              <DishManager 
                dishes={dishes}
                ingredients={ingredients}
                onAdd={dish => setDishes([...dishes, dish])}
                onUpdate={dish => setDishes(dishes.map(d => d.id === dish.id ? dish : d))}
                onDelete={id => setDishes(dishes.filter(d => d.id !== id))}
                isUsed={isDishUsed}
              />
            )}

            {activeManagementSubTab === 'meals' && (
              <MealManager 
                meals={meals}
                dishes={dishes}
                ingredients={ingredients}
                onAdd={meal => setMeals([...meals, meal])}
                onUpdate={meal => setMeals(meals.map(m => m.id === meal.id ? meal : m))}
                onDelete={id => setMeals(meals.filter(m => m.id !== id))}
                isUsed={isMealUsed}
              />
            )}
          </div>
        </div>

        <div className={activeMainTab === 'ai-analysis' ? 'block' : 'hidden'}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800">AI Phân tích hình ảnh</h2>
              </div>
            </div>
            <AIImageAnalyzer 
              onAnalysisComplete={(result) => {
                console.log("Analysis complete. Current tab:", activeMainTabRef.current);
                if (activeMainTabRef.current !== 'ai-analysis') {
                  console.log("Showing notification");
                  setNotification({
                    type: 'success',
                    title: 'Phân tích hoàn tất!',
                    message: 'Nhấn để xem kết quả',
                    onClick: () => setActiveMainTab('ai-analysis')
                  });
                }
              }} 
              onSave={handleSaveAnalyzedDish}
            />
          </div>
        </div>
      </main>

      {/* Notification System */}
      {notification && (
        <div 
          onClick={() => {
            if (notification.onClick) {
              notification.onClick();
              setNotification(null);
            }
          }}
          className={`fixed bottom-6 right-6 bg-white px-5 py-4 rounded-2xl shadow-xl cursor-pointer transition-all z-[9999] flex items-center gap-4 border-2 ${
            notification.type === 'success' ? 'border-emerald-500 shadow-emerald-100' :
            notification.type === 'error' ? 'border-rose-500 shadow-rose-100' :
            notification.type === 'warning' ? 'border-amber-400 shadow-amber-100' :
            'border-slate-300 shadow-slate-100'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${
            notification.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
            notification.type === 'error' ? 'bg-rose-50 text-rose-600' :
            notification.type === 'warning' ? 'bg-amber-50 text-amber-600' :
            'bg-slate-100 text-slate-600'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
             notification.type === 'error' ? <XCircle className="w-6 h-6" /> :
             notification.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
             <Info className="w-6 h-6" />}
          </div>
          <div>
            <h4 className={`font-bold text-lg ${
              notification.type === 'success' ? 'text-emerald-800' :
              notification.type === 'error' ? 'text-rose-800' :
              notification.type === 'warning' ? 'text-amber-800' :
              'text-slate-800'
            }`}>{notification.title}</h4>
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-emerald-600' :
              notification.type === 'error' ? 'text-rose-600' :
              notification.type === 'warning' ? 'text-amber-600' :
              'text-slate-500'
            }`}>{notification.message}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setNotification(null);
            }}
            className="ml-2 p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Type Selection Modal */}
      {isTypeSelectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsTypeSelectionModalOpen(false); }}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Lên kế hoạch</h3>
                <p className="text-sm text-slate-500">Chọn buổi bạn muốn lên kế hoạch</p>
              </div>
              <button 
                onClick={() => setIsTypeSelectionModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-4">
              <button 
                onClick={() => handlePlanMeal('breakfast')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${currentPlan.breakfastId ? 'border-emerald-500 bg-white' : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-lg ${currentPlan.breakfastId ? 'text-emerald-900' : 'text-slate-800'}`}>Bữa Sáng</p>
                    <p className={`text-sm ${currentPlan.breakfastId ? 'text-emerald-600' : 'text-slate-500'}`}>Bắt đầu ngày mới đầy năng lượng</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => handlePlanMeal('lunch')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${currentPlan.lunchId ? 'border-emerald-500 bg-white' : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-lg ${currentPlan.lunchId ? 'text-emerald-900' : 'text-slate-800'}`}>Bữa Trưa</p>
                    <p className={`text-sm ${currentPlan.lunchId ? 'text-emerald-600' : 'text-slate-500'}`}>Nạp lại năng lượng cho buổi chiều</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => handlePlanMeal('dinner')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${currentPlan.dinnerId ? 'border-emerald-500 bg-white' : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-lg ${currentPlan.dinnerId ? 'text-emerald-900' : 'text-slate-800'}`}>Bữa Tối</p>
                    <p className={`text-sm ${currentPlan.dinnerId ? 'text-emerald-600' : 'text-slate-500'}`}>Bữa ăn nhẹ nhàng, dễ tiêu hóa</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Planning Modal */}
      {isPlanningModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsPlanningModalOpen(false); }}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setIsPlanningModalOpen(false);
                    setIsTypeSelectionModalOpen(true);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">Chọn món cho {planningType === 'breakfast' ? 'Bữa Sáng' : planningType === 'lunch' ? 'Bữa Trưa' : 'Bữa Tối'}</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Danh sách các món ăn phù hợp trong thư viện</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPlanningModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="px-4 py-4 sm:px-8 border-b border-slate-100 bg-slate-50">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Tìm kiếm bữa ăn..."
                    value={planningSearchQuery}
                    onChange={(e) => setPlanningSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm text-sm sm:text-base"
                  />
                </div>
                <select
                  value={planningSortBy}
                  onChange={(e) => setPlanningSortBy(e.target.value as any)}
                  className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm text-slate-700 font-medium appearance-none text-sm sm:text-base"
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
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3 sm:space-y-4">
              {meals
                .filter(m => m.type === planningType && m.name.toLowerCase().includes(planningSearchQuery.toLowerCase()))
                .sort((a, b) => {
                  const nutritionA = calculateMealNutrition(a, dishes, ingredients);
                  const nutritionB = calculateMealNutrition(b, dishes, ingredients);
                  
                  switch (planningSortBy) {
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
                })
                .map(meal => {
                const nutrition = calculateMealNutrition(meal, dishes, ingredients);
                const isSelected = currentPlan[`${planningType}Id` as keyof DayPlan] === meal.id;

                return (
                  <button
                    key={meal.id}
                    onClick={() => handleUpdatePlan(planningType!, isSelected ? null : meal.id)}
                    className={`w-full text-left p-4 sm:p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${isSelected ? 'border-emerald-500 bg-white' : 'border-slate-100 hover:border-emerald-200'}`}
                  >
                    <div>
                      <h4 className={`font-bold text-base sm:text-lg mb-1 sm:mb-2 ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{meal.name}</h4>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                          {Math.round(nutrition.calories)} kcal
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                          {Math.round(nutrition.protein)}g Protein
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent group-hover:border-emerald-300'}`}>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Clear Plan Modal */}
      {isClearPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Xóa kế hoạch</h3>
                <p className="text-sm text-slate-500">Chọn phạm vi thời gian muốn xóa</p>
              </div>
              <button 
                onClick={() => setIsClearPlanModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-4">
              <button 
                onClick={() => handleClearPlan('day')}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 text-lg group-hover:text-rose-700">Ngày này</p>
                  <p className="text-sm text-slate-500">Xóa kế hoạch của ngày đang chọn</p>
                </div>
              </button>

              <button 
                onClick={() => handleClearPlan('week')}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 text-lg group-hover:text-rose-700">Tuần này</p>
                  <p className="text-sm text-slate-500">Xóa kế hoạch của tuần hiện tại</p>
                </div>
              </button>

              <button 
                onClick={() => handleClearPlan('month')}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 text-lg group-hover:text-rose-700">Tháng này</p>
                  <p className="text-sm text-slate-500">Xóa kế hoạch của tháng hiện tại</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Goal Setting Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsGoalModalOpen(false); }}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Mục tiêu dinh dưỡng</h3>
              </div>
              <button 
                onClick={() => setIsGoalModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Weight Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Cân nặng hiện tại (kg)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={userProfile.weight}
                    onChange={(e) => setUserProfile({...userProfile, weight: Number(e.target.value)})}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-lg text-slate-800"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">kg</span>
                </div>
              </div>

              {/* Protein Ratio Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">Lượng Protein mong muốn</label>
                  <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {Math.round(userProfile.weight * userProfile.proteinRatio)}g / ngày
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.1"
                      value={userProfile.proteinRatio}
                      onChange={(e) => setUserProfile({...userProfile, proteinRatio: Number(e.target.value)})}
                      className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-lg text-slate-800"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">g / kg</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {[1.2, 1.6, 2.0, 2.2].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setUserProfile({...userProfile, proteinRatio: ratio})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${userProfile.proteinRatio === ratio ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}
                      >
                        {ratio}g
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Khuyến nghị: 1.2-1.6g cho người vận động nhẹ, 1.6-2.2g cho người tập luyện/tăng cơ.
                  </p>
                </div>
              </div>

              {/* Calories Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mục tiêu Calo (kcal)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={userProfile.targetCalories}
                    onChange={(e) => setUserProfile({...userProfile, targetCalories: Number(e.target.value)})}
                    className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-lg text-slate-800"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">kcal</span>
                </div>
              </div>

              <button 
                onClick={() => setIsGoalModalOpen(false)}
                className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200 mt-4"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

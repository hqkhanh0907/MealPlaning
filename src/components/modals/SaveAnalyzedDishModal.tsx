import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Loader2, Sparkles } from 'lucide-react';
import { AnalyzedDishResult, AnalyzedIngredient, SaveAnalyzedDishPayload, MealType } from '../../types';
import { suggestIngredientInfo } from '../../services/geminiService';
import { useNotification } from '../../contexts/NotificationContext';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { getMealTagOptions } from '../../data/constants';
import { UnitSelector } from '../shared/UnitSelector';
import { logger } from '../../utils/logger';

interface SaveAnalyzedDishModalProps {
  onClose: () => void;
  result: AnalyzedDishResult;
  onSave: (payload: SaveAnalyzedDishPayload) => void;
}

export const SaveAnalyzedDishModal: React.FC<SaveAnalyzedDishModalProps> = ({ onClose, result, onSave }) => {
  const { t } = useTranslation();
  const notify = useNotification();
  const [editedResult, setEditedResult] = useState<AnalyzedDishResult>(() => structuredClone(result));
  const [saveDish, setSaveDish] = useState(true);
  const [dishTags, setDishTags] = useState<MealType[]>([]);
  const [tagError, setTagError] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<boolean[]>(() => new Array(result.ingredients.length).fill(true));
  const [researchingIngredientIndex, setResearchingIngredientIndex] = useState<number | null>(null);

  useModalBackHandler(true, onClose);

  const toggleDishTag = (type: MealType) => {
    setDishTags(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    setTagError(null);
  };

  const handleUpdateIngredient = (index: number, field: string, value: string | number) => {
    const newIngredients: AnalyzedIngredient[] = [...editedResult.ingredients];
    const current = newIngredients[index];

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'nutritionPerStandardUnit') {
        newIngredients[index] = {
          ...current,
          nutritionPerStandardUnit: { ...current.nutritionPerStandardUnit, [child]: value },
        };
      }
    } else {
      newIngredients[index] = { ...current, [field]: value } as AnalyzedIngredient;
    }
    setEditedResult({ ...editedResult, ingredients: newIngredients });
  };

  const hasSubmittedRef = useRef(false);

  const handleConfirmSave = () => {
    if (hasSubmittedRef.current) return;
    if (saveDish && dishTags.length === 0) {
      setTagError(t('saveAnalyzed.validationSelectMeal'));
      return;
    }

    hasSubmittedRef.current = true;
    const finalIngredients = editedResult.ingredients.filter((_, idx) => selectedIngredients[idx]);
    const payload: SaveAnalyzedDishPayload = {
      ...editedResult,
      ingredients: finalIngredients,
      shouldCreateDish: saveDish,
      tags: saveDish ? dishTags : undefined,
    };
    onSave(payload);
    onClose();
  };

  const toggleIngredientSelection = (index: number) => {
    const next = [...selectedIngredients];
    next[index] = !next[index];
    setSelectedIngredients(next);
  };

  const toggleAllIngredients = () => {
    const allSelected = selectedIngredients.every(Boolean);
    setSelectedIngredients(new Array(selectedIngredients.length).fill(!allSelected));
  };

  const handleResearchIngredient = async (index: number) => {
    const ingredient = editedResult.ingredients[index];
    if (!ingredient.name) return;

    try {
      setResearchingIngredientIndex(index);
      const info = await suggestIngredientInfo(ingredient.name, ingredient.unit);
      const newIngredients = [...editedResult.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        nutritionPerStandardUnit: {
          calories: info.calories,
          protein: info.protein,
          carbs: info.carbs,
          fat: info.fat,
          fiber: info.fiber,
        },
      };
      setEditedResult({ ...editedResult, ingredients: newIngredients });
    } catch (error) {
      logger.error({ component: 'SaveAnalyzedDishModal', action: 'researchIngredient' }, error);
      notify.error(t('saveAnalyzed.lookupFailed'), t('saveAnalyzed.lookupFailedDesc'));
    } finally {
      setResearchingIngredientIndex(null);
    }
  };

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-70">
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-4xl max-h-[85dvh] sm:max-h-[90dvh] overflow-hidden flex flex-col sm:mx-4">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{t('saveAnalyzed.title')}</h4>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-8">
          {/* Dish Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <h5 className="font-bold text-slate-800 dark:text-slate-100">{t('saveAnalyzed.dishInfo')}</h5>
              <label className="flex items-center gap-2 cursor-pointer min-h-11 px-2 -mr-2 rounded-lg active:bg-slate-100 dark:active:bg-slate-700 transition-colors">
                <input 
                  type="checkbox" 
                  checked={saveDish}
                  onChange={(e) => setSaveDish(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('saveAnalyzed.saveDish')}</span>
              </label>
            </div>
            
            {saveDish && (
              <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label htmlFor="ai-dish-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('saveAnalyzed.dishName')}</label>
                  <input
                    id="ai-dish-name"
                    value={editedResult.name}
                    onChange={e => setEditedResult({ ...editedResult, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="ai-dish-desc" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('saveAnalyzed.description')}</label>
                  <textarea
                    id="ai-dish-desc"
                    value={editedResult.description}
                    onChange={e => setEditedResult({ ...editedResult, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                    rows={2}
                  />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                    {t('saveAnalyzed.suitableFor')} <span className="text-rose-500">*</span>
                  </span>
                  <div className="flex gap-2">
                    {getMealTagOptions(t).map(opt => {
                      const isActive = dishTags.includes(opt.type);
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => toggleDishTag(opt.type)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all min-h-11 ${
                            isActive
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300'
                          }`}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {tagError && (
                    <p className="text-xs text-rose-500 mt-1.5 font-medium">{tagError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ingredients List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <h5 className="font-bold text-slate-800 dark:text-slate-100">{t('saveAnalyzed.ingredientDetail')}</h5>
              <button
                onClick={toggleAllIngredients}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
              >
                {selectedIngredients.every(Boolean) ? t('common.deselectAll') : t('common.selectAll')}
              </button>
            </div>
            
            <div className="space-y-4">
              {editedResult.ingredients.map((ing, idx) => (
                <div key={`edit-${ing.name}-${idx}`} className={`p-4 rounded-xl border transition-all ${selectedIngredients[idx] ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <label className="flex items-center gap-3 cursor-pointer min-h-11 px-1 rounded-lg active:bg-slate-100 dark:active:bg-slate-700 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedIngredients[idx]}
                        onChange={() => toggleIngredientSelection(idx)}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{t('saveAnalyzed.ingredientNum', { num: idx + 1 })}</span>
                    </label>
                    <button
                      onClick={() => handleResearchIngredient(idx)}
                      disabled={researchingIngredientIndex === idx || !selectedIngredients[idx]}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50"
                    >
                      {researchingIngredientIndex === idx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {t('ai.aiResearch')}
                    </button>
                  </div>
                  
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!selectedIngredients[idx] && 'pointer-events-none opacity-50'}`}>
                    <div className="md:col-span-1">
                      <label htmlFor={`ai-ing-name-${idx}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('common.name')}</label>
                      <input
                        id={`ai-ing-name-${idx}`}
                        value={ing.name}
                        onChange={e => handleUpdateIngredient(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label htmlFor={`ai-ing-amount-${idx}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('ingredient.quantity')}</label>
                      <input
                        id={`ai-ing-amount-${idx}`}
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={ing.amount}
                        onChange={e => handleUpdateIngredient(idx, 'amount', Math.max(0, Math.round(Number(e.target.value))))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label htmlFor={`ai-ing-unit-${idx}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('common.unit')}</label>
                      <UnitSelector
                        mode="single"
                        value={ing.unit}
                        onChange={v => handleUpdateIngredient(idx, 'unit', v)}
                        data-testid={`ai-ing-unit-${idx}`}
                      />
                    </div>
                  </div>
                  
                  <div className={`mt-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-600 ${!selectedIngredients[idx] && 'pointer-events-none opacity-50'}`}>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('saveAnalyzed.nutritionLabel')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label htmlFor={`ai-ing-cal-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">{t('common.calories')}</label>
                        <input
                          id={`ai-ing-cal-${idx}`}
                          type="number" min="0" step="1" inputMode="numeric"
                          value={ing.nutritionPerStandardUnit.calories}
                          onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.calories', Math.max(0, Math.round(Number(e.target.value))))}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label htmlFor={`ai-ing-pro-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Protein</label>
                        <input
                          id={`ai-ing-pro-${idx}`}
                          type="number" min="0" step="1" inputMode="numeric"
                          value={ing.nutritionPerStandardUnit.protein}
                          onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.protein', Math.max(0, Math.round(Number(e.target.value))))}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label htmlFor={`ai-ing-carbs-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Carbs</label>
                        <input
                          id={`ai-ing-carbs-${idx}`}
                          type="number" min="0" step="1" inputMode="numeric"
                          value={ing.nutritionPerStandardUnit.carbs}
                          onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.carbs', Math.max(0, Math.round(Number(e.target.value))))}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label htmlFor={`ai-ing-fat-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Fat</label>
                        <input
                          id={`ai-ing-fat-${idx}`}
                          type="number" min="0" step="1" inputMode="numeric"
                          value={ing.nutritionPerStandardUnit.fat}
                          onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.fat', Math.max(0, Math.round(Number(e.target.value))))}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label htmlFor={`ai-ing-fiber-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Fiber</label>
                        <input
                          id={`ai-ing-fiber-${idx}`}
                          type="number" min="0" step="1" inputMode="numeric"
                          value={ing.nutritionPerStandardUnit.fiber}
                          onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.fiber', Math.max(0, Math.round(Number(e.target.value))))}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0 pb-safe">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 transition-all min-h-12"
          >
            {t('saveAnalyzed.cancelSave')}
          </button>
          <button 
            onClick={handleConfirmSave}
            data-testid="btn-confirm-save-analyzed"
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-600 active:bg-emerald-700 transition-all flex items-center gap-2 min-h-12"
          >
            <Save className="w-5 h-5" />
            {t('saveAnalyzed.confirmSave')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

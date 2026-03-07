import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays, Plus, Edit3, Sparkles, Loader2, Trash2,
  Info, AlertCircle, CheckCircle2, ChefHat, Copy, BookTemplate, Save
} from 'lucide-react';
import { Dish, Ingredient, DayPlan, MealType, DayNutritionSummary, SlotInfo, SupportedLang } from '../types';
import { getLocalizedField } from '../utils/localize';
import { Summary } from './Summary';
import { DateSelector } from './DateSelector';
import { QuickPreviewPanel } from './QuickPreviewPanel';
import { getDynamicTips, NutritionTip } from '../utils/tips';
import { parseLocalDate } from '../utils/helpers';
import { getMealTypeLabels } from '../data/constants';

interface MealCardProps {
  type: MealType;
  slot: SlotInfo;
  dishes: Dish[];
  onEdit: () => void;
}

const MealCard: React.FC<MealCardProps> = ({ type, slot, dishes, onEdit }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const mealLabels = getMealTypeLabels(t);
  const dishNames = slot.dishIds
    .map(id => { const d = dishes.find(x => x.id === id); return d ? getLocalizedField(d.name, lang) : undefined; })
    .filter(Boolean);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group" data-testid={`meal-card-${type}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {mealLabels[type]}
        </span>
        {dishNames.length > 0 && (
          <button
            onClick={onEdit}
            aria-label={`${t('common.edit')} ${mealLabels[type]}`}
            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>
      {dishNames.length > 0 ? (
        <div className="space-y-2">
          {dishNames.map((name) => (
            <div key={name} className="flex items-center gap-2">
              <ChefHat className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
              <span className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{name}</span>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-50 dark:border-slate-700">
            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded uppercase">
              {Math.round(slot.calories)} kcal
            </span>
            <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase">
              {Math.round(slot.protein)}g Pro
            </span>
          </div>
        </div>
      ) : (
        <button onClick={onEdit} aria-label={t('calendar.addDishForMeal', { meal: mealLabels[type] })} className="w-full py-3 sm:py-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 active:bg-emerald-50 transition-all min-h-12 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('calendar.addDish')}</p>
        </button>
      )}
    </div>
  );
};

interface RecommendationPanelProps {
  weight: number;
  targetCalories: number;
  targetProtein: number;
  dayNutrition: DayNutritionSummary;
}

const TIP_STYLES: Record<NutritionTip['type'], string> = {
  success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
  warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300',
};

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ weight, targetCalories, targetProtein, dayNutrition }) => {
  const { t } = useTranslation();
  const tips = React.useMemo(() => getDynamicTips(dayNutrition, targetCalories, targetProtein, t), [dayNutrition, targetCalories, targetProtein, t]);
  const isComplete = dayNutrition.breakfast.dishIds.length > 0 && dayNutrition.lunch.dishIds.length > 0 && dayNutrition.dinner.dishIds.length > 0;
  const hasAnyPlan = dayNutrition.breakfast.dishIds.length > 0 || dayNutrition.lunch.dishIds.length > 0 || dayNutrition.dinner.dishIds.length > 0;

  const getMissingSlots = (): string => {
    const missing: string[] = [];
    if (dayNutrition.breakfast.dishIds.length === 0) missing.push(t('tips.mealBreakfast'));
    if (dayNutrition.lunch.dishIds.length === 0) missing.push(t('tips.mealLunch'));
    if (dayNutrition.dinner.dishIds.length === 0) missing.push(t('tips.mealDinner'));
    return missing.join(', ');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-4">
        <Info className="w-5 h-5" />
        <h3>{t('recommendation.title')}</h3>
      </div>
      <div className="flex-1 space-y-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        <p className="text-slate-500 dark:text-slate-400">
          {t('recommendation.goal')} <strong>{weight}kg</strong> · <strong>{targetCalories} kcal</strong> · <strong>{targetProtein}g protein</strong>
        </p>

        {tips.map((tip) => (
          <div key={tip.text} className={`p-3 rounded-xl border ${TIP_STYLES[tip.type]}`}>
            <p className="font-medium">
              <span className="mr-1.5">{tip.emoji}</span>
              {tip.text}
            </p>
          </div>
        ))}

        {isComplete && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium pt-1">
            <CheckCircle2 className="w-4 h-4" />
            {t('recommendation.planComplete')}
          </div>
        )}
        {!isComplete && hasAnyPlan && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium pt-1">
            <AlertCircle className="w-4 h-4" />
            {t('recommendation.missing')} {getMissingSlots()}
          </div>
        )}
      </div>
    </div>
  );
};

export interface CalendarTabProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayPlans: DayPlan[];
  dishes: Dish[];
  ingredients: Ingredient[];
  currentPlan: DayPlan;
  dayNutrition: DayNutritionSummary;
  userWeight: number;
  targetCalories: number;
  targetProtein: number;
  isSuggesting: boolean;
  onOpenTypeSelection: () => void;
  onOpenClearPlan: () => void;
  onOpenGoalModal: () => void;
  onPlanMeal: (type: MealType) => void;
  onSuggestMealPlan: () => void;
  onCopyPlan?: () => void;
  onSaveTemplate?: () => void;
  onOpenTemplateManager?: () => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export const CalendarTab: React.FC<CalendarTabProps> = React.memo(({
  selectedDate, onSelectDate, dayPlans, dishes, ingredients,
  currentPlan, dayNutrition, userWeight, targetCalories, targetProtein,
  isSuggesting, onOpenTypeSelection, onOpenClearPlan, onOpenGoalModal, onPlanMeal, onSuggestMealPlan,
  onCopyPlan, onSaveTemplate, onOpenTemplateManager,
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const allEmpty = dayNutrition.breakfast.dishIds.length === 0 && dayNutrition.lunch.dishIds.length === 0 && dayNutrition.dinner.dishIds.length === 0;

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Date Selection */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-xl">
            <CalendarDays className="w-6 h-6 text-emerald-500" />
            <h2>{t('calendar.selectDate')}</h2>
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full border border-slate-200 dark:border-slate-700 text-center">
            <span className="sm:hidden">{parseLocalDate(selectedDate).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
            <span className="hidden sm:inline">{parseLocalDate(selectedDate).toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <DateSelector selectedDate={selectedDate} onSelectDate={onSelectDate} onPlanClick={onOpenTypeSelection} dayPlans={dayPlans} />
      </section>

      {/* Quick Preview */}
      <QuickPreviewPanel
        currentPlan={currentPlan}
        dishes={dishes}
        ingredients={ingredients}
        onPlanMeal={onPlanMeal}
        onPlanAll={onOpenTypeSelection}
      />

      {/* Overview & Recommendation */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Summary
            dayNutrition={dayNutrition}
            targetCalories={targetCalories}
            targetProtein={targetProtein}
            onEditGoals={onOpenGoalModal}
          />
        </div>
        <RecommendationPanel weight={userWeight} targetCalories={targetCalories} targetProtein={targetProtein} dayNutrition={dayNutrition} />
      </section>

      {/* Planning Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('calendar.mealPlan')}</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenTypeSelection}
              data-testid="btn-plan-meal-section"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 min-h-11"
            >
              <Plus className="w-4 h-4" />
              {t('calendar.planMeal')}
            </button>
            <button
              onClick={onSuggestMealPlan}
              disabled={isSuggesting}
              data-testid="btn-ai-suggest"
              className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-[0.98] transition-all disabled:opacity-50 min-h-11"
            >
              {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="hidden sm:inline">{t('calendar.aiSuggest')}</span>
              <span className="sm:hidden">AI</span>
            </button>
            {!allEmpty && (
              <button
                onClick={onOpenClearPlan}
                data-testid="btn-clear-plan"
                className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:bg-rose-100 transition-all min-h-11 min-w-11"
                aria-label={t('calendar.clearPlan')}
                title={t('calendar.clearPlan')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {!allEmpty && onCopyPlan && (
              <button
                onClick={onCopyPlan}
                data-testid="btn-copy-plan"
                className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:bg-indigo-100 transition-all min-h-11 min-w-11"
                aria-label={t('template.copyPlan')}
                title={t('template.copyPlan')}
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
            {!allEmpty && onSaveTemplate && (
              <button
                onClick={onSaveTemplate}
                data-testid="btn-save-template"
                className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:bg-amber-100 transition-all min-h-11 min-w-11"
                aria-label={t('template.saveAs')}
                title={t('template.saveAs')}
              >
                <Save className="w-5 h-5" />
              </button>
            )}
            {onOpenTemplateManager && (
              <button
                onClick={onOpenTemplateManager}
                data-testid="btn-template-manager"
                className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 active:bg-purple-100 transition-all min-h-11 min-w-11"
                aria-label={t('template.manageTemplates')}
                title={t('template.manageTemplates')}
              >
                <BookTemplate className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {allEmpty ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 sm:p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 mb-2">{t('calendar.emptyTitle')}</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">{t('calendar.emptyDesc')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onOpenTypeSelection}
                data-testid="btn-plan-meal-empty"
                className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 min-h-12"
              >
                <Plus className="w-4 h-4" />
                {t('calendar.planMeal')}
              </button>
              <button
                onClick={onSuggestMealPlan}
                disabled={isSuggesting}
                data-testid="btn-ai-suggest-empty"
                className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-[0.98] transition-all disabled:opacity-50 min-h-12"
              >
                {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {t('calendar.aiSuggest')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:scrollbar-hide max-md:-mx-4 max-md:px-4">
            {MEAL_TYPES.map(type => (
              <div key={type} className="max-md:min-w-[80%] max-md:snap-start max-md:shrink-0">
                <MealCard type={type} slot={dayNutrition[type]} dishes={dishes} onEdit={() => onPlanMeal(type)} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
});

CalendarTab.displayName = 'CalendarTab';


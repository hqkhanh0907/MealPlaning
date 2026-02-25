import { DayNutritionSummary } from '../types';

export interface NutritionTip {
  emoji: string;
  text: string;
  type: 'success' | 'warning' | 'info';
}

/**
 * Pure function that generates dynamic nutrition tips based on the current day's nutrition data.
 * Returns up to 2 most relevant tips.
 */
export const getDynamicTips = (
  dayNutrition: DayNutritionSummary,
  targetCalories: number,
  targetProtein: number,
): NutritionTip[] => {
  const totalCalories = dayNutrition.breakfast.calories + dayNutrition.lunch.calories + dayNutrition.dinner.calories;
  const totalProtein = dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein;
  const totalFiber = dayNutrition.breakfast.fiber + dayNutrition.lunch.fiber + dayNutrition.dinner.fiber;
  const totalFat = dayNutrition.breakfast.fat + dayNutrition.lunch.fat + dayNutrition.dinner.fat;

  const hasBreakfast = dayNutrition.breakfast.dishIds.length > 0;
  const hasLunch = dayNutrition.lunch.dishIds.length > 0;
  const hasDinner = dayNutrition.dinner.dishIds.length > 0;
  const isComplete = hasBreakfast && hasLunch && hasDinner;
  const hasAnyPlan = hasBreakfast || hasLunch || hasDinner;

  const tips: NutritionTip[] = [];

  // No plan yet
  if (!hasAnyPlan) {
    tips.push({
      emoji: '📋',
      text: 'Bắt đầu lên kế hoạch ăn uống để theo dõi dinh dưỡng hàng ngày!',
      type: 'info',
    });
    return tips;
  }

  // Calories check
  if (totalCalories > 0 && totalCalories > targetCalories * 1.15) {
    tips.push({
      emoji: '⚠️',
      text: `Bạn đang vượt ${Math.round(totalCalories - targetCalories)} kcal so với mục tiêu. Cân nhắc giảm bớt carbs hoặc chất béo.`,
      type: 'warning',
    });
  } else if (isComplete && totalCalories > 0 && totalCalories < targetCalories * 0.7) {
    tips.push({
      emoji: '📉',
      text: `Lượng calo hôm nay thấp (${Math.round(totalCalories)} kcal). Thâm hụt quá nhiều có thể ảnh hưởng cơ bắp và trao đổi chất.`,
      type: 'warning',
    });
  }

  // Protein check
  if (totalProtein > 0 && totalProtein >= targetProtein) {
    tips.push({
      emoji: '💪',
      text: `Tuyệt vời! Đạt ${Math.round(totalProtein)}g protein, đủ mục tiêu ${targetProtein}g.`,
      type: 'success',
    });
  } else if (isComplete && totalProtein > 0 && totalProtein < targetProtein * 0.8) {
    tips.push({
      emoji: '🥩',
      text: `Protein hôm nay mới đạt ${Math.round(totalProtein)}g/${targetProtein}g. Thêm ức gà, cá, trứng hoặc sữa chua Hy Lạp để bổ sung.`,
      type: 'warning',
    });
  }

  // Fiber check
  if (totalFiber > 0 && totalFiber < 15 && isComplete) {
    tips.push({
      emoji: '🥬',
      text: 'Lượng chất xơ thấp. Thêm rau xanh hoặc ngũ cốc nguyên hạt để cải thiện tiêu hóa.',
      type: 'info',
    });
  }

  // Fat balance
  if (totalFat > 0 && totalCalories > 0) {
    const fatCalPercent = (totalFat * 9 / totalCalories) * 100;
    if (fatCalPercent > 40) {
      tips.push({
        emoji: '🫒',
        text: `Tỷ lệ chất béo cao (${Math.round(fatCalPercent)}% tổng calo). Cân nhắc thay thế bằng nguồn protein nạc.`,
        type: 'info',
      });
    }
  }

  // All good
  if (isComplete && tips.length === 0) {
    tips.push({
      emoji: '✅',
      text: 'Kế hoạch hôm nay cân đối! Tiếp tục duy trì nhé.',
      type: 'success',
    });
  }

  // Missing meals
  if (!isComplete && hasAnyPlan) {
    const missing: string[] = [];
    if (!hasBreakfast) missing.push('bữa sáng');
    if (!hasLunch) missing.push('bữa trưa');
    if (!hasDinner) missing.push('bữa tối');
    tips.push({
      emoji: '📝',
      text: `Còn thiếu ${missing.join(', ')}. Hoàn tất để xem đánh giá dinh dưỡng chính xác hơn.`,
      type: 'info',
    });
  }

  return tips.slice(0, 2);
};


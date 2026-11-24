import type { DishListItem } from '../../../models/management.model';

export function catalogForPrompt<T>(catalog: readonly T[]): readonly T[] {
  return catalog.slice(0, 80);
}

export function dishCatalogPrompt(dishes: readonly DishListItem[]): string {
  return dishes
    .map(
      (dish) =>
        `- id=${dish.id}; name="${dish.name}"; meal_tag=${dish.meal_tag ?? 'any'}; kcal=${Math.round(dish.total_calories)}; Protein=${Math.round(dish.total_protein)}g; Carbs=${Math.round(dish.total_carbs)}g; Fat=${Math.round(dish.total_fat)}g; Fiber=${Math.round(dish.total_fiber)}g`,
    )
    .join('\n');
}

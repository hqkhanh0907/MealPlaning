import { Ingredient, Dish } from '../types';

export const initialIngredients: Ingredient[] = [
  { id: 'i1', name: { vi: 'Ức gà', en: 'Chicken breast' }, caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i2', name: { vi: 'Trứng gà', en: 'Chicken egg' }, caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1.1, fatPer100: 11, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i3', name: { vi: 'Yến mạch', en: 'Oats' }, caloriesPer100: 389, proteinPer100: 16.9, carbsPer100: 66, fatPer100: 6.9, fiberPer100: 10.6, unit: { vi: 'g', en: 'g' } },
  { id: 'i4', name: { vi: 'Sữa chua Hy Lạp', en: 'Greek yogurt' }, caloriesPer100: 59, proteinPer100: 10, carbsPer100: 3.6, fatPer100: 0.4, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i5', name: { vi: 'Khoai lang', en: 'Sweet potato' }, caloriesPer100: 86, proteinPer100: 1.6, carbsPer100: 20, fatPer100: 0.1, fiberPer100: 3, unit: { vi: 'g', en: 'g' } },
  { id: 'i6', name: { vi: 'Bông cải xanh', en: 'Broccoli' }, caloriesPer100: 34, proteinPer100: 2.8, carbsPer100: 7, fatPer100: 0.4, fiberPer100: 2.6, unit: { vi: 'g', en: 'g' } },
  { id: 'i7', name: { vi: 'Thịt bò nạc', en: 'Lean beef' }, caloriesPer100: 250, proteinPer100: 26, carbsPer100: 0, fatPer100: 15, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i8', name: { vi: 'Gạo lứt', en: 'Brown rice' }, caloriesPer100: 111, proteinPer100: 2.6, carbsPer100: 23, fatPer100: 0.9, fiberPer100: 1.8, unit: { vi: 'g', en: 'g' } },
  { id: 'i9', name: { vi: 'Cá hồi', en: 'Salmon' }, caloriesPer100: 208, proteinPer100: 20, carbsPer100: 0, fatPer100: 13, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i10', name: { vi: 'Hạt chia', en: 'Chia seeds' }, caloriesPer100: 486, proteinPer100: 17, carbsPer100: 42, fatPer100: 31, fiberPer100: 34, unit: { vi: 'g', en: 'g' } },
];

export const initialDishes: Dish[] = [
  {
    id: 'd1',
    name: { vi: 'Yến mạch sữa chua', en: 'Yogurt oatmeal' },
    tags: ['breakfast'],
    ingredients: [
      { ingredientId: 'i3', amount: 50 },
      { ingredientId: 'i4', amount: 150 },
      { ingredientId: 'i10', amount: 10 },
    ],
  },
  {
    id: 'd2',
    name: { vi: 'Ức gà áp chảo', en: 'Pan-seared chicken breast' },
    tags: ['lunch', 'dinner'],
    ingredients: [
      { ingredientId: 'i1', amount: 200 },
    ],
  },
  {
    id: 'd3',
    name: { vi: 'Khoai lang luộc', en: 'Boiled sweet potato' },
    tags: ['lunch', 'dinner'],
    ingredients: [
      { ingredientId: 'i5', amount: 150 },
    ],
  },
  {
    id: 'd4',
    name: { vi: 'Bông cải xanh luộc', en: 'Boiled broccoli' },
    tags: ['lunch', 'dinner'],
    ingredients: [
      { ingredientId: 'i6', amount: 150 },
    ],
  },
  {
    id: 'd5',
    name: { vi: 'Trứng ốp la (2 quả)', en: 'Fried eggs (2)' },
    tags: ['breakfast', 'dinner'],
    ingredients: [
      { ingredientId: 'i2', amount: 100 },
    ],
  },
];

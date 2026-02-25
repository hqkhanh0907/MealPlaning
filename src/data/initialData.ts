import { Ingredient, Dish } from '../types';

export const initialIngredients: Ingredient[] = [
  { id: 'i1', name: 'Ức gà', caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0, unit: 'g' },
  { id: 'i2', name: 'Trứng gà', caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1.1, fatPer100: 11, fiberPer100: 0, unit: 'g' },
  { id: 'i3', name: 'Yến mạch', caloriesPer100: 389, proteinPer100: 16.9, carbsPer100: 66, fatPer100: 6.9, fiberPer100: 10.6, unit: 'g' },
  { id: 'i4', name: 'Sữa chua Hy Lạp', caloriesPer100: 59, proteinPer100: 10, carbsPer100: 3.6, fatPer100: 0.4, fiberPer100: 0, unit: 'g' },
  { id: 'i5', name: 'Khoai lang', caloriesPer100: 86, proteinPer100: 1.6, carbsPer100: 20, fatPer100: 0.1, fiberPer100: 3, unit: 'g' },
  { id: 'i6', name: 'Bông cải xanh', caloriesPer100: 34, proteinPer100: 2.8, carbsPer100: 7, fatPer100: 0.4, fiberPer100: 2.6, unit: 'g' },
  { id: 'i7', name: 'Thịt bò nạc', caloriesPer100: 250, proteinPer100: 26, carbsPer100: 0, fatPer100: 15, fiberPer100: 0, unit: 'g' },
  { id: 'i8', name: 'Gạo lứt', caloriesPer100: 111, proteinPer100: 2.6, carbsPer100: 23, fatPer100: 0.9, fiberPer100: 1.8, unit: 'g' },
  { id: 'i9', name: 'Cá hồi', caloriesPer100: 208, proteinPer100: 20, carbsPer100: 0, fatPer100: 13, fiberPer100: 0, unit: 'g' },
  { id: 'i10', name: 'Hạt chia', caloriesPer100: 486, proteinPer100: 17, carbsPer100: 42, fatPer100: 31, fiberPer100: 34, unit: 'g' },
];

export const initialDishes: Dish[] = [
  {
    id: 'd1',
    name: 'Yến mạch sữa chua',
    tags: ['breakfast'],
    ingredients: [
      { ingredientId: 'i3', amount: 50 },
      { ingredientId: 'i4', amount: 150 },
      { ingredientId: 'i10', amount: 10 },
    ],
  },
  {
    id: 'd2',
    name: 'Ức gà áp chảo',
    tags: ['lunch', 'dinner'],
    ingredients: [
      { ingredientId: 'i1', amount: 200 },
    ],
  },
  {
    id: 'd3',
    name: 'Khoai lang luộc',
    tags: ['lunch', 'dinner'],
    ingredients: [
      { ingredientId: 'i5', amount: 150 },
    ],
  },
  {
    id: 'd4',
    name: 'Bông cải xanh luộc',
    tags: ['lunch', 'dinner'],
    ingredients: [
      { ingredientId: 'i6', amount: 150 },
    ],
  },
  {
    id: 'd5',
    name: 'Trứng ốp la (2 quả)',
    tags: ['breakfast', 'dinner'],
    ingredients: [
      { ingredientId: 'i2', amount: 100 },
    ],
  },
];

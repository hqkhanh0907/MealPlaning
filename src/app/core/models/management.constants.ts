export const INGREDIENT_CATEGORIES = [
  'Thịt',
  'Cá & Hải sản',
  'Trứng & Sữa',
  'Rau củ',
  'Ngũ cốc & Tinh bột',
  'Đậu & Hạt',
  'Dầu & Mỡ',
  'Gia vị',
  'Nước dùng & Nước chấm',
  'Trái cây',
  'Khác',
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

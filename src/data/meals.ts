export type Ingredient = {
  name: string;
  amount: number;
  unit: string;
};

export type Meal = {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: Ingredient[];
};

export const meals: Meal[] = [
  {
    id: 'b1',
    type: 'breakfast',
    name: 'Yến mạch, Whey & Sữa chua Hy Lạp',
    description: 'Bữa sáng nhanh gọn, giàu protein. Đu đủ chứa enzyme papain hỗ trợ tiêu hoá protein cực tốt. Hạt chia bổ sung chất xơ và Omega-3.',
    calories: 420,
    protein: 47,
    carbs: 41,
    fat: 6,
    fiber: 8,
    ingredients: [
      { name: 'Whey Protein Isolate', amount: 1, unit: 'muỗng (30g)' },
      { name: 'Sữa chua Hy Lạp không đường', amount: 150, unit: 'g' },
      { name: 'Yến mạch cán dẹt', amount: 40, unit: 'g' },
      { name: 'Đu đủ chín', amount: 50, unit: 'g' },
      { name: 'Hạt chia', amount: 10, unit: 'g' },
    ],
  },
  {
    id: 'b2',
    type: 'breakfast',
    name: 'Omelette lòng trắng trứng & Cải bó xôi',
    description: 'Lòng trắng trứng cung cấp nguồn protein tinh khiết. Cải bó xôi giàu chất xơ, vitamin và khoáng chất giúp nhuận tràng.',
    calories: 463,
    protein: 70,
    carbs: 15,
    fat: 9,
    fiber: 5,
    ingredients: [
      { name: 'Lòng trắng trứng', amount: 250, unit: 'g' },
      { name: 'Trứng gà nguyên quả', amount: 1, unit: 'quả' },
      { name: 'Cải bó xôi (Spinach)', amount: 100, unit: 'g' },
      { name: 'Ức gà luộc xé nhỏ', amount: 100, unit: 'g' },
      { name: 'Bánh mì đen nguyên cám', amount: 1, unit: 'lát (30g)' },
    ],
  },
  {
    id: 'l1',
    type: 'lunch',
    name: 'Ức gà nướng, Khoai lang & Kimchi',
    description: 'Bữa trưa kinh điển cho dân tập luyện. Kimchi cung cấp lợi khuẩn (probiotics) tuyệt vời cho đường ruột. Bông cải xanh giàu chất xơ.',
    calories: 509,
    protein: 67,
    carbs: 39,
    fat: 7,
    fiber: 9,
    ingredients: [
      { name: 'Ức gà không da', amount: 200, unit: 'g' },
      { name: 'Khoai lang luộc', amount: 150, unit: 'g' },
      { name: 'Kimchi cải thảo', amount: 100, unit: 'g' },
      { name: 'Bông cải xanh (Broccoli)', amount: 100, unit: 'g' },
    ],
  },
  {
    id: 'l2',
    type: 'lunch',
    name: 'Cá phi lê áp chảo, Quinoa & Măng tây',
    description: 'Cá trắng dễ tiêu hoá. Măng tây chứa prebiotics làm thức ăn cho lợi khuẩn đường ruột. Quinoa là tinh bột hấp thu chậm.',
    calories: 455,
    protein: 60,
    carbs: 38,
    fat: 7,
    fiber: 8,
    ingredients: [
      { name: 'Cá trắng phi lê (Cá chẽm/Cá diêu hồng)', amount: 250, unit: 'g' },
      { name: 'Hạt diêm mạch (Quinoa) khô', amount: 50, unit: 'g' },
      { name: 'Măng tây', amount: 150, unit: 'g' },
      { name: 'Dầu oliu (áp chảo)', amount: 5, unit: 'ml' },
    ],
  },
  {
    id: 'd1',
    type: 'dinner',
    name: 'Bò nạc xào mướp đắng & Tôm luộc',
    description: 'Thịt bò nạc giàu kẽm và sắt. Mướp đắng hỗ trợ tiêu hoá và ổn định đường huyết. Tôm bổ sung thêm protein ít béo.',
    calories: 496,
    protein: 77,
    carbs: 14,
    fat: 12,
    fiber: 6,
    ingredients: [
      { name: 'Thịt bò nạc (95% nạc)', amount: 200, unit: 'g' },
      { name: 'Tôm sú bóc vỏ', amount: 150, unit: 'g' },
      { name: 'Mướp đắng (Khổ qua) hoặc Bí ngòi', amount: 200, unit: 'g' },
      { name: 'Dầu oliu', amount: 5, unit: 'ml' },
    ],
  },
  {
    id: 'd2',
    type: 'dinner',
    name: 'Salad cá ngừ, Ức gà & Sốt sữa chua dứa',
    description: 'Bữa tối nhẹ bụng, dễ ngủ. Dứa chứa enzyme bromelain giúp phân giải protein nhanh chóng, tránh đầy bụng.',
    calories: 410,
    protein: 72,
    carbs: 15,
    fat: 4,
    fiber: 7,
    ingredients: [
      { name: 'Cá ngừ ngâm nước (đóng hộp)', amount: 150, unit: 'g' },
      { name: 'Ức gà luộc xé nhỏ', amount: 100, unit: 'g' },
      { name: 'Rau xà lách hỗn hợp', amount: 200, unit: 'g' },
      { name: 'Sữa chua Hy Lạp không đường (làm sốt)', amount: 100, unit: 'g' },
      { name: 'Dứa chín (thơm)', amount: 50, unit: 'g' },
    ],
  }
];

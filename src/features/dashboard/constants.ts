import type { InsightPriority } from './types';

export const SCORE_WEIGHTS = {
  calories: 0.3,
  protein: 0.25,
  workout: 0.25,
  weightLog: 0.1,
  streak: 0.1,
} as const;

export const CALORIE_THRESHOLDS = [
  { maxDeviation: 50, score: 100 },
  { maxDeviation: 100, score: 90 },
  { maxDeviation: 200, score: 70 },
  { maxDeviation: 500, score: 40 },
] as const;

export const CALORIE_MIN_SCORE = 10;

export const PROTEIN_THRESHOLDS = [
  { minRatio: 1, score: 100 },
  { minRatio: 0.9, score: 80 },
  { minRatio: 0.7, score: 60 },
  { minRatio: 0.5, score: 40 },
] as const;

export const PROTEIN_MIN_SCORE = 20;

export const WORKOUT_SCORES = {
  completed: 100,
  restDay: 100,
  notYet: 50,
  missed: 0,
} as const;

export const WEIGHT_LOG_SCORES = {
  today: 100,
  yesterday: 50,
  none: 0,
} as const;

export const STREAK_MULTIPLIER = 5;
export const STREAK_MAX_BONUS = 100;

export const SCORE_COLOR_THRESHOLDS = {
  emerald: 80,
  amber: 50,
} as const;

export const DEFAULT_MINIMUM_SCORE = 50;

export const INSIGHT_PRIORITIES: Record<InsightPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const DAILY_TIPS_VI = [
  'Uống đủ 2-3 lít nước mỗi ngày để hỗ trợ trao đổi chất.',
  'Ăn chậm, nhai kỹ giúp no lâu hơn và hấp thu tốt hơn.',
  'Bổ sung rau xanh mỗi bữa ăn để tăng chất xơ.',
  'Protein từ trứng, ức gà, cá là nguồn dinh dưỡng tuyệt vời.',
  'Ngủ đủ 7-8 tiếng mỗi đêm để phục hồi cơ bắp.',
  'Không bỏ bữa sáng – đây là bữa quan trọng nhất trong ngày.',
  'Hạn chế đồ uống có đường, thay bằng nước lọc hoặc trà xanh.',
  'Tập thể dục ít nhất 30 phút mỗi ngày để duy trì sức khỏe.',
  'Chia nhỏ bữa ăn thành 4-5 bữa để ổn định đường huyết.',
  'Bổ sung trái cây tươi thay vì nước ép để giữ chất xơ.',
  'Cân đo thực phẩm để kiểm soát lượng calo chính xác hơn.',
  'Kết hợp cardio và tập tạ để đốt mỡ hiệu quả.',
  'Ăn đủ protein sau tập luyện trong vòng 30-60 phút.',
  'Giảm muối trong bữa ăn để bảo vệ tim mạch.',
  'Chuẩn bị meal prep vào cuối tuần để tiết kiệm thời gian.',
  'Theo dõi cân nặng hàng ngày vào cùng một thời điểm.',
  'Duy trì streak tập luyện để tạo thói quen bền vững.',
  'Vitamin D từ ánh nắng sáng giúp tăng cường miễn dịch.',
  'Hạn chế thức ăn chế biến sẵn, ưu tiên thực phẩm tươi.',
  'Đặt mục tiêu nhỏ và tăng dần để tránh quá tải.',
] as const;

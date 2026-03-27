# Scenario 33: Dashboard Score & Layout

**Version:** 1.0  
**Date:** 2026-06-18  
**Total Test Cases:** 299

---

## Mô tả tổng quan

Dashboard Score & Layout là scenario bao quát toàn bộ cấu trúc hiển thị của DashboardTab — màn hình chính của ứng dụng Smart Meal Planner. Scenario này cover kiến trúc 5-tier rendering (Tier 1: DailyScoreHero → Tier 2: EnergyBalanceMini + ProteinProgress → Tier 3: TodaysPlanCard + WeightMini/StreakMini → Tier 4: AutoAdjustBanner + AiInsightCard → Tier 5: QuickActionsBar), stagger animation với delay 0ms/30ms/60ms, lazy loading cho Tier 4-5 qua requestAnimationFrame, CLS prevention (min-h-[56px] cho Tier 4 placeholder), và ErrorBoundary riêng cho từng tier.

DailyScoreHero hiển thị điểm tổng hợp 0-100 với 3 tier labels (≥80 Tuyệt vời, ≥50 Khá tốt, <50 Cần cải thiện), gradient colors (emerald/amber/slate), 5 factor badges (calories, protein, workout, weightLog, streak), partial data indicator, và onboarding checklist cho first-time user. WeightQuickLog bottom sheet toggle từ WeightMini, AutoAdjustBanner hiển thị conditional dựa trên useFeedbackLoop adjustment.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| DashboardTab | DashboardTab.tsx | Container chính, 5-tier layout, stagger animation, lazy loading |
| DailyScoreHero | DailyScoreHero.tsx | Hiển thị điểm tổng hợp, gradient, factor badges, first-time checklist |
| EnergyBalanceMini | EnergyBalanceMini.tsx | Eaten/Burned/Net calories hiển thị compact |
| ProteinProgress | ProteinProgress.tsx | Protein progress bar và suggestion |
| TodaysPlanCard | TodaysPlanCard.tsx | Thẻ kế hoạch hôm nay (4 states) |
| WeightMini | WeightMini.tsx | Widget cân nặng mini, trigger bottom sheet |
| StreakMini | StreakMini.tsx | Widget streak liên tiếp |
| AiInsightCard | AiInsightCard.tsx | Thẻ AI insight/gợi ý |
| QuickActionsBar | QuickActionsBar.tsx | Thanh hành động nhanh 3 buttons |
| WeightQuickLog | WeightQuickLog.tsx | Bottom sheet ghi cân nặng |
| AutoAdjustBanner | AutoAdjustBanner.tsx | Banner gợi ý điều chỉnh calories |
| ErrorBoundary | ErrorBoundary.tsx | Bắt lỗi render, fallback per tier |
| useDailyScore | useDailyScore.ts | Tính điểm tổng hợp, factors, color, greeting |
| useFeedbackLoop | useFeedbackLoop.ts | Auto-adjust logic, moving average |
| useNutritionTargets | useNutritionTargets.ts | Target calories/protein từ health profile |
| useReducedMotion | DashboardTab.tsx (inline) | Detect prefers-reduced-motion |

## Luồng nghiệp vụ

1. Mở app → Dashboard tab active → DashboardTab mount → Tier 1 render ngay lập tức
2. Tier 2 render với 30ms delay → Tier 3 render với 60ms delay (stagger animation)
3. requestAnimationFrame triggers → lowerTiersVisible = true → Tier 4 + Tier 5 render
4. DailyScoreHero tính điểm từ useDailyScore → hiển thị score, label, gradient, badges
5. First-time user (profile = default) → onboarding checklist thay vì score
6. Nhấn WeightMini → weightQuickLogOpen = true → WeightQuickLog bottom sheet mở
7. useFeedbackLoop có adjustment → AutoAdjustBanner hiển thị trong Tier 4
8. Bất kỳ tier nào lỗi → ErrorBoundary bắt → fallback UI → các tier khác vẫn hoạt động

## Quy tắc nghiệp vụ

1. Tier rendering order: 1 → 2 (30ms) → 3 (60ms) → 4,5 (after rAF)
2. Reduced motion: bỏ qua tất cả stagger delay, render đồng thời
3. Tier 4 placeholder có min-h-[56px] để prevent CLS
4. Tier 4 placeholder aria-hidden="true"
5. ErrorBoundary per tier: 1 tier crash không ảnh hưởng tier khác
6. Score 0-100: ≥80 = Tuyệt vời (emerald), ≥50 = Khá tốt (amber), <50 = Cần cải thiện (slate)
7. First-time user: isDefaultProfile = true → hiển thị checklist (3 steps), gradient = slate
8. Partial data: có ≥1 factor nhưng < 5 → hiển thị "(Dữ liệu chưa đầy đủ)"
9. Factor badges chỉ hiển thị khi factor !== null
10. WeightQuickLog chỉ render khi weightQuickLogOpen = true (conditional rendering)
11. AutoAdjustBanner chỉ hiển thị khi adjustment !== null/undefined
12. DashboardTab wrapped trong React.memo

## Test Cases (299 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_DSL_01 | Dashboard tab render với data-testid="dashboard-tab" | Positive | P0 |
| TC_DSL_02 | Tier 1 (DailyScoreHero) render ngay lập tức, không delay | Positive | P0 |
| TC_DSL_03 | Tier 2 có animationDelay 30ms | Positive | P1 |
| TC_DSL_04 | Tier 3 có animationDelay 60ms | Positive | P1 |
| TC_DSL_05 | Tier 4 lazy loaded sau requestAnimationFrame | Positive | P1 |
| TC_DSL_06 | Tier 5 lazy loaded sau requestAnimationFrame | Positive | P1 |
| TC_DSL_07 | Tier 4 placeholder hiển thị trước khi lazy load | Positive | P1 |
| TC_DSL_08 | Tier 4 placeholder có min-h-[56px] (CLS prevention) | Positive | P0 |
| TC_DSL_09 | Tier 4 placeholder có aria-hidden="true" | Positive | P2 |
| TC_DSL_10 | Reduced motion: tất cả tiers render không delay | Positive | P1 |
| TC_DSL_11 | Reduced motion: staggerStyle trả về {} | Positive | P1 |
| TC_DSL_12 | Reduced motion: tierClassName = '' (không 'dashboard-stagger') | Positive | P2 |
| TC_DSL_13 | ErrorBoundary Tier 1 — Hero crash → fallback hiển thị | Negative | P0 |
| TC_DSL_14 | ErrorBoundary Tier 2 — Energy crash → Tier 1,3,4,5 vẫn OK | Negative | P0 |
| TC_DSL_15 | ErrorBoundary Tier 3 — Plan crash → Tier 1,2,4,5 vẫn OK | Negative | P0 |
| TC_DSL_16 | ErrorBoundary Tier 4 — Insight crash → Tier 1,2,3,5 vẫn OK | Negative | P1 |
| TC_DSL_17 | ErrorBoundary Tier 5 — QuickActions crash → Tier 1-4 vẫn OK | Negative | P1 |
| TC_DSL_18 | DailyScoreHero hiển thị score = 100 | Positive | P1 |
| TC_DSL_19 | DailyScoreHero hiển thị score = 0 | Boundary | P1 |
| TC_DSL_20 | Score ≥80 → label "Tuyệt vời" + gradient emerald | Positive | P0 |
| TC_DSL_21 | Score ≥50 và <80 → label "Khá tốt" + gradient amber | Positive | P0 |
| TC_DSL_22 | Score <50 → label "Cần cải thiện" + gradient slate | Positive | P0 |
| TC_DSL_23 | Score = 80 → chính xác là "Tuyệt vời" (boundary) | Boundary | P1 |
| TC_DSL_24 | Score = 79 → chính xác là "Khá tốt" (boundary) | Boundary | P1 |
| TC_DSL_25 | Score = 50 → chính xác là "Khá tốt" (boundary) | Boundary | P1 |
| TC_DSL_26 | Score = 49 → chính xác là "Cần cải thiện" (boundary) | Boundary | P1 |
| TC_DSL_27 | Score number hiển thị với tabular-nums font variant | Positive | P2 |
| TC_DSL_28 | Factor badges hiển thị — calories badge có icon UtensilsCrossed | Positive | P1 |
| TC_DSL_29 | Factor badges hiển thị — protein badge có icon Beef | Positive | P1 |
| TC_DSL_30 | Factor badges hiển thị — workout badge có icon Dumbbell | Positive | P1 |
| TC_DSL_31 | Factor badges hiển thị — weightLog badge có icon Scale | Positive | P1 |
| TC_DSL_32 | Factor badges hiển thị — streak badge có icon Flame | Positive | P1 |
| TC_DSL_33 | Factor = null → badge không hiển thị | Positive | P1 |
| TC_DSL_34 | Tất cả 5 factors = null → không có badge section | Edge | P2 |
| TC_DSL_35 | 3/5 factors có giá trị → partial data label hiển thị | Positive | P1 |
| TC_DSL_36 | 5/5 factors có giá trị → không có partial data label | Positive | P1 |
| TC_DSL_37 | First-time user → onboarding checklist (3 steps) | Positive | P0 |
| TC_DSL_38 | First-time user → gradient = slate | Positive | P1 |
| TC_DSL_39 | First-time user → không hiển thị score number | Positive | P1 |
| TC_DSL_40 | First-time user → không hiển thị factor badges | Positive | P1 |
| TC_DSL_41 | Onboarding checklist hiển thị 3 items với số thứ tự 1,2,3 | Positive | P2 |
| TC_DSL_42 | DailyScoreHero có role="region" | Positive | P2 |
| TC_DSL_43 | DailyScoreHero có aria-label chứa score và label | Positive | P2 |
| TC_DSL_44 | Badge icons có aria-hidden="true" | Positive | P2 |
| TC_DSL_45 | WeightMini tap → weightQuickLogOpen = true → WeightQuickLog render | Positive | P0 |
| TC_DSL_46 | WeightQuickLog onClose → weightQuickLogOpen = false → unmount | Positive | P0 |
| TC_DSL_47 | WeightQuickLog không render khi weightQuickLogOpen = false | Positive | P1 |
| TC_DSL_48 | AutoAdjustBanner hiển thị khi adjustment có giá trị | Positive | P1 |
| TC_DSL_49 | AutoAdjustBanner không hiển thị khi adjustment = undefined | Positive | P1 |
| TC_DSL_50 | AutoAdjustBanner onApply gọi applyAdjustment | Positive | P1 |
| TC_DSL_51 | AutoAdjustBanner onDismiss gọi dismissAdjustment | Positive | P1 |
| TC_DSL_52 | Dashboard layout gap-3, px-4, pb-6 | Positive | P2 |
| TC_DSL_53 | Dashboard overflow-y-auto cho scrolling | Positive | P2 |
| TC_DSL_54 | Greeting hiển thị đúng theo thời gian (sáng/chiều/tối) | Positive | P2 |
| TC_DSL_55 | React.memo prevents re-render khi props không đổi | Positive | P3 |
| TC_DSL_056 | Tier 1 chứa DailyScoreHero component | Positive | P0 |
| TC_DSL_057 | Tier 2 chứa EnergyBalanceMini + ProteinProgress | Positive | P0 |
| TC_DSL_058 | Tier 3 chứa TodaysPlanCard + WeightMini + StreakMini | Positive | P0 |
| TC_DSL_059 | Tier 4 chứa AutoAdjustBanner + AiInsightCard | Positive | P1 |
| TC_DSL_060 | Tier 5 chứa QuickActionsBar | Positive | P0 |
| TC_DSL_061 | Tier order: 1 → 2 → 3 → 4 → 5 trong DOM | Positive | P0 |
| TC_DSL_062 | Tier 1-3 render trước Tier 4-5 (timing) | Positive | P1 |
| TC_DSL_063 | Dashboard container có flex-col layout | Positive | P2 |
| TC_DSL_064 | Dashboard container có gap-3 (12px) | Positive | P2 |
| TC_DSL_065 | Dashboard container có px-4 (16px padding horizontal) | Positive | P2 |
| TC_DSL_066 | Dashboard container có pb-6 (24px padding bottom) | Positive | P2 |
| TC_DSL_067 | Tier 3 grid layout: grid-cols-2 gap-3 cho WeightMini/StreakMini | Positive | P2 |
| TC_DSL_068 | WeightMini chiếm cột trái trong grid | Positive | P2 |
| TC_DSL_069 | StreakMini chiếm cột phải trong grid | Positive | P2 |
| TC_DSL_070 | 5 tiers đều visible sau lazy load hoàn tất | Positive | P0 |
| TC_DSL_071 | Tier 2 flex-col gap-3 cho EnergyBalanceMini và ProteinProgress | Positive | P2 |
| TC_DSL_072 | Tier 4 flex-col gap-3 cho AutoAdjustBanner + AiInsightCard | Positive | P2 |
| TC_DSL_073 | Dashboard scroll container overflow-y-auto hoạt động | Positive | P1 |
| TC_DSL_074 | Scroll từ Tier 1 đến Tier 5 smooth | Positive | P2 |
| TC_DSL_075 | Dashboard không hiển thị horizontal scrollbar | Positive | P2 |
| TC_DSL_076 | Tier 1 không có animationDelay (render 0ms) | Positive | P1 |
| TC_DSL_077 | Tier 2 animationDelay chính xác 30ms | Positive | P1 |
| TC_DSL_078 | Tier 3 animationDelay chính xác 60ms | Positive | P1 |
| TC_DSL_079 | Tier 2 có class 'dashboard-stagger' khi reduced motion OFF | Positive | P1 |
| TC_DSL_080 | Tier 3 có class 'dashboard-stagger' khi reduced motion OFF | Positive | P1 |
| TC_DSL_081 | Tier 1 không có class 'dashboard-stagger' | Positive | P2 |
| TC_DSL_082 | staggerStyle(30) trả về {animationDelay: '30ms'} | Positive | P2 |
| TC_DSL_083 | staggerStyle(60) trả về {animationDelay: '60ms'} | Positive | P2 |
| TC_DSL_084 | STAGGER_DELAYS constant: tier2 = 30, tier3 = 60 | Positive | P2 |
| TC_DSL_085 | Tier 2 animation bắt đầu sau Tier 1 (visual verify) | Positive | P2 |
| TC_DSL_086 | Tier 3 animation bắt đầu sau Tier 2 (visual verify) | Positive | P2 |
| TC_DSL_087 | Stagger animation hoạt động đúng khi tab switch back | Positive | P2 |
| TC_DSL_088 | Dashboard-stagger CSS class có keyframes defined | Positive | P2 |
| TC_DSL_089 | Stagger animation không gây layout shift | Positive | P1 |
| TC_DSL_090 | Tier 4 không có stagger animation (lazy loaded) | Positive | P2 |
| TC_DSL_091 | Tier 5 không có stagger animation (lazy loaded) | Positive | P2 |
| TC_DSL_092 | Stagger animation chỉ áp dụng cho Tier 2 và Tier 3 | Positive | P1 |
| TC_DSL_093 | Stagger animation duration ≤ 300ms | Positive | P2 |
| TC_DSL_094 | Stagger animation không repeat (animation-iteration-count: 1) | Positive | P2 |
| TC_DSL_095 | Reduced motion ON: Tier 2 không có animationDelay | Positive | P1 |
| TC_DSL_096 | Reduced motion ON: Tier 3 không có animationDelay | Positive | P1 |
| TC_DSL_097 | Reduced motion ON: Tier 2 không có class 'dashboard-stagger' | Positive | P1 |
| TC_DSL_098 | Reduced motion ON: Tier 3 không có class 'dashboard-stagger' | Positive | P1 |
| TC_DSL_099 | Reduced motion ON: staggerStyle trả về {} | Positive | P1 |
| TC_DSL_100 | Reduced motion ON: tierClassName trả về '' (empty string) | Positive | P1 |
| TC_DSL_101 | Reduced motion ON: tất cả 5 tiers render đồng thời | Positive | P1 |
| TC_DSL_102 | useReducedMotion hook detect OS setting | Positive | P1 |
| TC_DSL_103 | useReducedMotion hook: OS no-preference → false | Positive | P1 |
| TC_DSL_104 | Reduced motion toggle runtime: ON → OFF → animation appears | Positive | P2 |
| TC_DSL_105 | Reduced motion toggle runtime: OFF → ON → animation removed | Positive | P2 |
| TC_DSL_106 | Reduced motion ON: Tier 4-5 vẫn lazy load (không ảnh hưởng) | Positive | P2 |
| TC_DSL_107 | Reduced motion ON: Score number không có animation | Positive | P2 |
| TC_DSL_108 | Reduced motion ON: ErrorBoundary vẫn hoạt động | Positive | P2 |
| TC_DSL_109 | Reduced motion ON: layout giữ nguyên không thay đổi | Positive | P2 |
| TC_DSL_110 | Reduced motion ON: WeightQuickLog bottom sheet mở không animation | Positive | P2 |
| TC_DSL_111 | useReducedMotion sử dụng matchMedia API | Positive | P3 |
| TC_DSL_112 | useReducedMotion cleanup listener on unmount | Positive | P3 |
| TC_DSL_113 | Reduced motion ON: DailyScoreHero gradient không animate | Positive | P2 |
| TC_DSL_114 | Reduced motion ON: factor badges hiển thị instant | Positive | P2 |
| TC_DSL_115 | Tier 4 placeholder hiển thị trước rAF callback | Positive | P1 |
| TC_DSL_116 | Tier 5 không render trước rAF callback | Positive | P1 |
| TC_DSL_117 | lowerTiersVisible khởi tạo = false | Positive | P1 |
| TC_DSL_118 | lowerTiersVisible chuyển thành true sau rAF | Positive | P1 |
| TC_DSL_119 | Tier 4 content thay thế placeholder sau rAF | Positive | P1 |
| TC_DSL_120 | Tier 5 xuất hiện sau rAF | Positive | P1 |
| TC_DSL_121 | Placeholder → Content transition không gây layout shift | Positive | P0 |
| TC_DSL_122 | Tier 4 placeholder có aria-hidden='true' | Positive | P2 |
| TC_DSL_123 | Tier 4 placeholder min-h-[56px] = 56px computed height | Positive | P1 |
| TC_DSL_124 | Lazy load chỉ kích hoạt 1 lần (không re-trigger) | Positive | P2 |
| TC_DSL_125 | requestAnimationFrame gọi đúng 1 lần | Positive | P2 |
| TC_DSL_126 | Lazy load không block main thread | Positive | P1 |
| TC_DSL_127 | Tier 4 content render sau placeholder unmount | Positive | P2 |
| TC_DSL_128 | Lazy load hoạt động đúng trên slow device (CPU throttle 4x) | Positive | P2 |
| TC_DSL_129 | Tier 4-5 render đúng nội dung sau lazy load | Positive | P1 |
| TC_DSL_130 | useEffect cleanup: cancel rAF nếu unmount trước callback | Positive | P2 |
| TC_DSL_131 | Placeholder background color phù hợp theme | Positive | P3 |
| TC_DSL_132 | Lazy load timing: Tier 4-5 xuất hiện trong < 100ms | Positive | P1 |
| TC_DSL_133 | Multiple rapid mount/unmount không gây memory leak | Positive | P2 |
| TC_DSL_134 | Tier 4-5 không flash/flicker khi lazy load | Positive | P2 |
| TC_DSL_135 | Tier 4 placeholder min-h-[56px] prevents CLS khi content load | Positive | P0 |
| TC_DSL_136 | Tier 4 placeholder chiều rộng = 100% parent width | Positive | P2 |
| TC_DSL_137 | Tier 4 content height ≤ placeholder min-height + reasonable growth | Positive | P2 |
| TC_DSL_138 | Không có CLS khi AutoAdjustBanner xuất hiện conditional | Positive | P1 |
| TC_DSL_139 | Không có CLS khi AutoAdjustBanner dismiss | Positive | P1 |
| TC_DSL_140 | Không có CLS khi WeightQuickLog open | Positive | P1 |
| TC_DSL_141 | Không có CLS khi WeightQuickLog close | Positive | P1 |
| TC_DSL_142 | Không có CLS khi first-time user → regular user transition | Positive | P1 |
| TC_DSL_143 | Tier 1-3 chiều cao ổn định sau render | Positive | P2 |
| TC_DSL_144 | Font loading không gây CLS trong score display | Positive | P2 |
| TC_DSL_145 | ErrorBoundary Tier 1 fallback hiển thị error message | Negative | P0 |
| TC_DSL_146 | ErrorBoundary Tier 1 crash → Tier 2 render bình thường | Negative | P0 |
| TC_DSL_147 | ErrorBoundary Tier 1 crash → Tier 3 render bình thường | Negative | P0 |
| TC_DSL_148 | ErrorBoundary Tier 1 crash → Tier 4 render bình thường | Negative | P1 |
| TC_DSL_149 | ErrorBoundary Tier 1 crash → Tier 5 render bình thường | Negative | P1 |
| TC_DSL_150 | ErrorBoundary Tier 2 fallback hiển thị error message | Negative | P0 |
| TC_DSL_151 | ErrorBoundary Tier 3 fallback hiển thị error message | Negative | P0 |
| TC_DSL_152 | ErrorBoundary Tier 4 fallback hiển thị error message | Negative | P1 |
| TC_DSL_153 | ErrorBoundary Tier 5 fallback hiển thị error message | Negative | P1 |
| TC_DSL_154 | Tier 2 crash → Tier 1, 3, 4, 5 vẫn interactive | Negative | P1 |
| TC_DSL_155 | Tier 3 crash → Tier 1, 2, 4, 5 vẫn interactive | Negative | P1 |
| TC_DSL_156 | Tier 4 crash → QuickActionsBar (Tier 5) vẫn hoạt động | Negative | P1 |
| TC_DSL_157 | Multiple tiers crash đồng thời → còn lại vẫn OK | Negative | P1 |
| TC_DSL_158 | Tất cả 5 tiers crash → dashboard hiển thị 5 fallback | Negative | P2 |
| TC_DSL_159 | ErrorBoundary fallback không ảnh hưởng layout | Negative | P2 |
| TC_DSL_160 | ErrorBoundary log error to console | Negative | P2 |
| TC_DSL_161 | ErrorBoundary fallback có retry button (nếu implemented) | Negative | P3 |
| TC_DSL_162 | ErrorBoundary chỉ bắt render error (không bắt event handler error) | Negative | P2 |
| TC_DSL_163 | ErrorBoundary recovery sau hot reload (dev mode) | Positive | P3 |
| TC_DSL_164 | ErrorBoundary isolate memory: crashed tier không leak | Negative | P3 |
| TC_DSL_165 | ErrorBoundary Tier 2 crash: console không hiện React warning cho Tier 1 | Negative | P2 |
| TC_DSL_166 | ErrorBoundary Tier 3 crash: WeightMini không leak event listeners | Negative | P3 |
| TC_DSL_167 | ErrorBoundary fallback accessible: role='alert' | Negative | P2 |
| TC_DSL_168 | ErrorBoundary fallback readable: đủ contrast ratio | Negative | P3 |
| TC_DSL_169 | Async error trong useEffect không bị ErrorBoundary bắt | Negative | P3 |
| TC_DSL_170 | DailyScoreHero score = 0 → hiển thị '0' | Boundary | P1 |
| TC_DSL_171 | DailyScoreHero score = 1 → hiển thị '1' | Positive | P2 |
| TC_DSL_172 | DailyScoreHero score = 10 → label 'Cần cải thiện' | Positive | P2 |
| TC_DSL_173 | DailyScoreHero score = 25 → label 'Cần cải thiện' | Positive | P2 |
| TC_DSL_174 | DailyScoreHero score = 49 → label 'Cần cải thiện' (boundary -1) | Boundary | P1 |
| TC_DSL_175 | DailyScoreHero score = 50 → label 'Khá tốt' (boundary) | Boundary | P0 |
| TC_DSL_176 | DailyScoreHero score = 51 → label 'Khá tốt' | Positive | P2 |
| TC_DSL_177 | DailyScoreHero score = 65 → label 'Khá tốt' | Positive | P2 |
| TC_DSL_178 | DailyScoreHero score = 79 → label 'Khá tốt' (boundary -1) | Boundary | P1 |
| TC_DSL_179 | DailyScoreHero score = 80 → label 'Tuyệt vời' (boundary) | Boundary | P0 |
| TC_DSL_180 | DailyScoreHero score = 81 → label 'Tuyệt vời' | Positive | P2 |
| TC_DSL_181 | DailyScoreHero score = 95 → label 'Tuyệt vời' | Positive | P2 |
| TC_DSL_182 | DailyScoreHero score = 99 → label 'Tuyệt vời' | Positive | P2 |
| TC_DSL_183 | DailyScoreHero score = 100 → label 'Tuyệt vời' (max) | Boundary | P1 |
| TC_DSL_184 | Score gradient emerald (≥80): from-emerald-500 to-emerald-600 | Positive | P2 |
| TC_DSL_185 | Score gradient amber (50-79): from-amber-500 to-amber-600 | Positive | P2 |
| TC_DSL_186 | Score gradient slate (<50): from-slate-500 to-slate-600 | Positive | P2 |
| TC_DSL_187 | Score number font-size responsive (không truncate) | Positive | P2 |
| TC_DSL_188 | Score tabular-nums: '100' và '88' cùng width | Positive | P2 |
| TC_DSL_189 | Score null/undefined → hiển thị default state | Edge | P1 |
| TC_DSL_190 | Score fraction rounded: 79.6 → hiển thị 80 | Edge | P2 |
| TC_DSL_191 | Score fraction rounded: 49.4 → hiển thị 49 | Edge | P2 |
| TC_DSL_192 | DailyScoreHero aria-label chứa score number | Positive | P2 |
| TC_DSL_193 | DailyScoreHero aria-label chứa label text | Positive | P2 |
| TC_DSL_194 | Score animation count-up (nếu implemented, reduced motion OFF) | Positive | P3 |
| TC_DSL_195 | 0/5 factors active → không hiển thị badge section | Edge | P1 |
| TC_DSL_196 | 1/5 factors active → 1 badge hiển thị + partial data label | Positive | P1 |
| TC_DSL_197 | 2/5 factors active → 2 badges + partial data label | Positive | P2 |
| TC_DSL_198 | 3/5 factors active → 3 badges + partial data label | Positive | P1 |
| TC_DSL_199 | 4/5 factors active → 4 badges + partial data label | Positive | P2 |
| TC_DSL_200 | 5/5 factors active → 5 badges + KHÔNG có partial data label | Positive | P0 |
| TC_DSL_201 | calories factor badge: UtensilsCrossed icon | Positive | P2 |
| TC_DSL_202 | protein factor badge: Beef icon | Positive | P2 |
| TC_DSL_203 | workout factor badge: Dumbbell icon | Positive | P2 |
| TC_DSL_204 | weightLog factor badge: Scale icon | Positive | P2 |
| TC_DSL_205 | streak factor badge: Flame icon | Positive | P2 |
| TC_DSL_206 | Factor badge order: calories → protein → workout → weightLog → streak | Positive | P2 |
| TC_DSL_207 | Factor badge active state: highlighted khi factor > 0 | Positive | P2 |
| TC_DSL_208 | Factor badge inactive state: dimmed khi factor = 0 | Positive | P2 |
| TC_DSL_209 | Partial data label '(Dữ liệu chưa đầy đủ)' text exact | Positive | P2 |
| TC_DSL_210 | First-time user (isDefaultProfile=true): checklist thay vì score | Positive | P0 |
| TC_DSL_211 | First-time user: checklist có 3 steps | Positive | P0 |
| TC_DSL_212 | First-time user: step 1 text đúng | Positive | P1 |
| TC_DSL_213 | First-time user: step 2 text đúng | Positive | P1 |
| TC_DSL_214 | First-time user: step 3 text đúng | Positive | P1 |
| TC_DSL_215 | First-time user: gradient = slate (không emerald/amber) | Positive | P1 |
| TC_DSL_216 | First-time user: không hiển thị factor badges | Positive | P1 |
| TC_DSL_217 | First-time user: không hiển thị score label | Positive | P1 |
| TC_DSL_218 | First-time user: checklist items có số thứ tự 1, 2, 3 | Positive | P2 |
| TC_DSL_219 | First-time user: checklist step clickable (navigate) | Positive | P1 |
| TC_DSL_220 | First-time user: complete step → check mark hiển thị | Positive | P1 |
| TC_DSL_221 | First-time user: complete all 3 steps → chuyển sang score view | Positive | P0 |
| TC_DSL_222 | First-time user: partial completion persisted | Positive | P1 |
| TC_DSL_223 | First-time user: checklist accessible (role='list') | Positive | P2 |
| TC_DSL_224 | First-time user: DailyScoreHero aria-label cho onboarding state | Positive | P2 |
| TC_DSL_225 | WeightMini tap → WeightQuickLog mở với slide-up animation | Positive | P0 |
| TC_DSL_226 | WeightQuickLog mở → backdrop overlay hiển thị | Positive | P1 |
| TC_DSL_227 | WeightQuickLog backdrop tap → dismiss | Positive | P0 |
| TC_DSL_228 | WeightQuickLog X button → close | Positive | P0 |
| TC_DSL_229 | WeightQuickLog close → unmount từ DOM | Positive | P1 |
| TC_DSL_230 | WeightQuickLog không render khi weightQuickLogOpen = false (conditional) | Positive | P1 |
| TC_DSL_231 | WeightMini double tap → chỉ mở 1 instance WeightQuickLog | Edge | P1 |
| TC_DSL_232 | WeightQuickLog mở → focus trap (keyboard) | Positive | P2 |
| TC_DSL_233 | WeightQuickLog close → focus return to WeightMini | Positive | P2 |
| TC_DSL_234 | WeightQuickLog Escape key → close | Positive | P1 |
| TC_DSL_235 | AutoAdjustBanner hiển thị khi adjustment có positive value | Positive | P1 |
| TC_DSL_236 | AutoAdjustBanner hiển thị khi adjustment có negative value | Positive | P1 |
| TC_DSL_237 | AutoAdjustBanner không hiển thị khi adjustment = null | Positive | P1 |
| TC_DSL_238 | AutoAdjustBanner không hiển thị khi adjustment = undefined | Positive | P1 |
| TC_DSL_239 | AutoAdjustBanner Apply button → gọi applyAdjustment | Positive | P1 |
| TC_DSL_240 | AutoAdjustBanner Dismiss button → gọi dismissAdjustment | Positive | P1 |
| TC_DSL_241 | AutoAdjustBanner Apply → banner biến mất sau apply | Positive | P1 |
| TC_DSL_242 | AutoAdjustBanner Dismiss → banner biến mất sau dismiss | Positive | P1 |
| TC_DSL_243 | AutoAdjustBanner vị trí: trong Tier 4, trước AiInsightCard | Positive | P2 |
| TC_DSL_244 | AutoAdjustBanner accessible: có aria-label mô tả | Positive | P2 |
| TC_DSL_245 | Dark mode: Dashboard container bg-slate-900 (hoặc dark variant) | Positive | P2 |
| TC_DSL_246 | Dark mode: Tier 1 DailyScoreHero text readable | Positive | P2 |
| TC_DSL_247 | Dark mode: Tier 2 EnergyBalanceMini dark variant | Positive | P2 |
| TC_DSL_248 | Dark mode: Tier 2 ProteinProgress dark variant | Positive | P2 |
| TC_DSL_249 | Dark mode: Tier 3 TodaysPlanCard dark variant | Positive | P2 |
| TC_DSL_250 | Dark mode: Tier 3 WeightMini dark variant | Positive | P2 |
| TC_DSL_251 | Dark mode: Tier 3 StreakMini dark variant | Positive | P2 |
| TC_DSL_252 | Dark mode: Tier 4 AiInsightCard dark variant | Positive | P2 |
| TC_DSL_253 | Dark mode: Tier 5 QuickActionsBar dark variant | Positive | P2 |
| TC_DSL_254 | Dark mode: AutoAdjustBanner dark variant | Positive | P2 |
| TC_DSL_255 | Dark mode: WeightQuickLog dark variant | Positive | P2 |
| TC_DSL_256 | Dark mode: ErrorBoundary fallback dark variant | Positive | P3 |
| TC_DSL_257 | Dark mode toggle: light → dark → layout preserved | Positive | P2 |
| TC_DSL_258 | Dark mode: gradient colors vẫn phân biệt được | Positive | P2 |
| TC_DSL_259 | Dark mode: factor badges readable | Positive | P2 |
| TC_DSL_260 | Greeting sáng (5:00-11:59): 'Chào buổi sáng' | Positive | P2 |
| TC_DSL_261 | Greeting trưa/chiều (12:00-17:59): 'Chào buổi chiều' | Positive | P2 |
| TC_DSL_262 | Greeting tối (18:00-4:59): 'Chào buổi tối' | Positive | P2 |
| TC_DSL_263 | Greeting boundary: 12:00 chính xác → 'Chào buổi chiều' | Boundary | P2 |
| TC_DSL_264 | Greeting boundary: 18:00 chính xác → 'Chào buổi tối' | Boundary | P2 |
| TC_DSL_265 | Greeting boundary: 5:00 chính xác → 'Chào buổi sáng' | Boundary | P2 |
| TC_DSL_266 | Greeting boundary: 4:59 → 'Chào buổi tối' | Boundary | P2 |
| TC_DSL_267 | Greeting boundary: 11:59 → 'Chào buổi sáng' | Boundary | P2 |
| TC_DSL_268 | Greeting boundary: 17:59 → 'Chào buổi chiều' | Boundary | P2 |
| TC_DSL_269 | Greeting chứa tên user (nếu có) | Positive | P2 |
| TC_DSL_270 | Tab switch: Dashboard → Calendar → Dashboard: layout preserved | Positive | P1 |
| TC_DSL_271 | Tab switch: Dashboard → Fitness → Dashboard: score preserved | Positive | P1 |
| TC_DSL_272 | Tab switch: Dashboard → Settings → Dashboard: WeightQuickLog state reset | Positive | P1 |
| TC_DSL_273 | Tab switch: lazy loaded tiers vẫn visible sau switch back | Positive | P1 |
| TC_DSL_274 | Tab switch: stagger animation không replay sau switch back | Positive | P2 |
| TC_DSL_275 | Rapid tab switching: Dashboard ↔ Calendar 5 lần | Edge | P2 |
| TC_DSL_276 | Tab switch: meal data updated → Dashboard reflects change | Positive | P1 |
| TC_DSL_277 | Tab switch: weight logged → Dashboard reflects change | Positive | P1 |
| TC_DSL_278 | Dashboard mount lại không duplicate API calls | Positive | P2 |
| TC_DSL_279 | Dashboard state consistent sau multiple tab switches | Positive | P2 |
| TC_DSL_280 | Dashboard Tier 1-3 render < 200ms | Positive | P1 |
| TC_DSL_281 | Dashboard full render (5 tiers) < 300ms | Positive | P1 |
| TC_DSL_282 | DailyScoreHero render < 50ms | Positive | P2 |
| TC_DSL_283 | React.memo: parent re-render → Dashboard không re-render | Positive | P2 |
| TC_DSL_284 | Không có unnecessary re-renders khi score unchanged | Positive | P2 |
| TC_DSL_285 | Bundle size: DashboardTab chunk < 50KB gzipped | Positive | P3 |
| TC_DSL_286 | Không có memory leak sau 100 mount/unmount cycles | Positive | P2 |
| TC_DSL_287 | Lazy load: Tier 4-5 không block First Contentful Paint | Positive | P1 |
| TC_DSL_288 | No Long Tasks > 50ms during Dashboard render | Positive | P2 |
| TC_DSL_289 | Dashboard scroll: 60fps maintained | Positive | P2 |
| TC_DSL_290 | Dashboard tab accessible name | Positive | P2 |
| TC_DSL_291 | Tất cả interactive elements có focus visible | Positive | P1 |
| TC_DSL_292 | Tab order logic: top-to-bottom, left-to-right | Positive | P2 |
| TC_DSL_293 | Screen reader: score announced correctly | Positive | P2 |
| TC_DSL_294 | All decorative icons aria-hidden='true' | Positive | P2 |
| TC_DSL_295 | Color không phải là cách duy nhất để truyền thông tin | Positive | P2 |
| TC_DSL_296 | Touch target ≥ 44px cho tất cả interactive elements | Positive | P1 |
| TC_DSL_297 | Heading hierarchy: h1 → h2 → h3 đúng thứ tự | Positive | P2 |
| TC_DSL_298 | LiveRegion: score change announced | Positive | P3 |
| TC_DSL_299 | Landmark regions: dashboard là main content | Positive | P3 |

---

## Chi tiết Test Cases

##### TC_DSL_01: Dashboard tab render với data-testid
- **Pre-conditions**: App đã load, Dashboard tab active
- **Steps**: 1. Mở app tại localhost:3000 2. Chuyển sang Dashboard tab
- **Expected**: Element với data-testid="dashboard-tab" tồn tại, chứa 5 tiers
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_02: Tier 1 render ngay lập tức
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Observe DOM ngay sau mount
- **Expected**: data-testid="dashboard-tier-1" có trong DOM ngay lập tức (0ms), chứa DailyScoreHero
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_03: Tier 2 có animationDelay 30ms
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Inspect style của data-testid="dashboard-tier-2"
- **Expected**: style.animationDelay = "30ms", có class "dashboard-stagger"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_04: Tier 3 có animationDelay 60ms
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Inspect style của data-testid="dashboard-tier-3"
- **Expected**: style.animationDelay = "60ms", có class "dashboard-stagger"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_05: Tier 4 lazy loaded sau requestAnimationFrame
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Kiểm tra DOM ngay sau mount 2. Đợi requestAnimationFrame callback
- **Expected**: Ban đầu data-testid="dashboard-tier-4-placeholder" hiển thị, sau rAF chuyển thành data-testid="dashboard-tier-4" với nội dung thật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_06: Tier 5 lazy loaded sau requestAnimationFrame
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Kiểm tra DOM ngay sau mount 2. Đợi requestAnimationFrame callback
- **Expected**: Ban đầu không có data-testid="dashboard-tier-5", sau rAF xuất hiện QuickActionsBar
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_07: Tier 4 placeholder hiển thị trước lazy load
- **Pre-conditions**: Dashboard tab fresh mount, lowerTiersVisible = false
- **Steps**: 1. Observe DOM trước rAF callback
- **Expected**: data-testid="dashboard-tier-4-placeholder" hiển thị, aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_08: Tier 4 placeholder min-h-[56px] CLS prevention
- **Pre-conditions**: Dashboard tab fresh mount
- **Steps**: 1. Inspect computed style của placeholder
- **Expected**: min-height = 56px, ngăn layout shift khi nội dung thật load
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_09: Tier 4 placeholder aria-hidden
- **Pre-conditions**: Dashboard tab, lowerTiersVisible = false
- **Steps**: 1. Inspect placeholder element
- **Expected**: aria-hidden="true" — screen reader bỏ qua placeholder
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_10: Reduced motion — tất cả tiers render không delay
- **Pre-conditions**: OS prefers-reduced-motion: reduce, Dashboard tab mount
- **Steps**: 1. Bật reduced motion trong OS 2. Reload Dashboard
- **Expected**: Tier 2,3 không có animationDelay, tất cả tiers render đồng thời
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_11: Reduced motion — staggerStyle trả về {}
- **Pre-conditions**: prefers-reduced-motion: reduce
- **Steps**: 1. Inspect style attribute của Tier 2,3
- **Expected**: style attribute rỗng hoặc không chứa animationDelay
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_12: Reduced motion — className không có dashboard-stagger
- **Pre-conditions**: prefers-reduced-motion: reduce
- **Steps**: 1. Inspect class list của Tier 2,3
- **Expected**: Không có class "dashboard-stagger", chỉ có "flex flex-col gap-3"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_13: ErrorBoundary Tier 1 — Hero crash hiển thị fallback
- **Pre-conditions**: DailyScoreHero throw error trong render
- **Steps**: 1. Simulate render error trong DailyScoreHero
- **Expected**: Tier 1 hiển thị fallback message (dashboard.error.hero), Tier 2-5 vẫn render bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSL_14: ErrorBoundary Tier 2 — Energy crash, các tier khác OK
- **Pre-conditions**: EnergyBalanceMini hoặc ProteinProgress throw error
- **Steps**: 1. Simulate render error trong Tier 2 component
- **Expected**: Tier 2 fallback (dashboard.error.energy), Tier 1,3,4,5 hoạt động bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSL_15: ErrorBoundary Tier 3 — Plan crash, các tier khác OK
- **Pre-conditions**: TodaysPlanCard throw error
- **Steps**: 1. Simulate render error trong TodaysPlanCard
- **Expected**: Tier 3 fallback (dashboard.error.plan), Tier 1,2,4,5 hoạt động bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSL_16: ErrorBoundary Tier 4 — Insight crash, các tier khác OK
- **Pre-conditions**: AiInsightCard throw error
- **Steps**: 1. Simulate render error trong AiInsightCard
- **Expected**: Tier 4 fallback (dashboard.error.insight), Tier 1,2,3,5 hoạt động bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_17: ErrorBoundary Tier 5 — QuickActions crash, Tier 1-4 OK
- **Pre-conditions**: QuickActionsBar throw error
- **Steps**: 1. Simulate render error trong QuickActionsBar
- **Expected**: Tier 5 fallback (dashboard.error.quickActions), Tier 1-4 hoạt động bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_18: Score = 100
- **Pre-conditions**: Tất cả factors đạt tối đa
- **Steps**: 1. Setup data: đầy đủ nutrition, workout completed, weight logged, streak > 0
- **Expected**: data-testid="score-number" hiển thị "100", label "Tuyệt vời", gradient emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_19: Score = 0
- **Pre-conditions**: Không có data nào (new user nhưng không phải first-time)
- **Steps**: 1. Setup: profile đã chỉnh sửa nhưng không log gì hôm nay
- **Expected**: data-testid="score-number" hiển thị "0", label "Cần cải thiện", gradient slate
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSL_20: Score ≥80 → label "Tuyệt vời" + gradient emerald
- **Pre-conditions**: Score tính được = 85
- **Steps**: 1. Observe DailyScoreHero
- **Expected**: Label chứa "Tuyệt vời", gradient class "from-[#10b981] to-[#059669]"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_21: Score ≥50 <80 → label "Khá tốt" + gradient amber
- **Pre-conditions**: Score = 65
- **Steps**: 1. Observe DailyScoreHero
- **Expected**: Label chứa "Khá tốt", gradient class "from-[#f59e0b] to-[#d97706]"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_22: Score <50 → label "Cần cải thiện" + gradient slate
- **Pre-conditions**: Score = 30
- **Steps**: 1. Observe DailyScoreHero
- **Expected**: Label chứa "Cần cải thiện", gradient class "from-[#64748b] to-[#475569]"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_23: Score = 80 boundary → "Tuyệt vời"
- **Pre-conditions**: Score tính được chính xác = 80
- **Steps**: 1. Verify score display và label
- **Expected**: Label = "Tuyệt vời" (≥80 condition), không phải "Khá tốt"
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSL_24: Score = 79 boundary → "Khá tốt"
- **Pre-conditions**: Score tính được chính xác = 79
- **Steps**: 1. Verify score display và label
- **Expected**: Label = "Khá tốt" (≥50 && <80), không phải "Tuyệt vời"
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSL_25: Score = 50 boundary → "Khá tốt"
- **Pre-conditions**: Score tính được chính xác = 50
- **Steps**: 1. Verify score display và label
- **Expected**: Label = "Khá tốt" (≥50 condition), không phải "Cần cải thiện"
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSL_26: Score = 49 boundary → "Cần cải thiện"
- **Pre-conditions**: Score tính được chính xác = 49
- **Steps**: 1. Verify score display và label
- **Expected**: Label = "Cần cải thiện" (<50), không phải "Khá tốt"
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSL_27: Score number tabular-nums
- **Pre-conditions**: DailyScoreHero hiển thị score
- **Steps**: 1. Inspect data-testid="score-number" style
- **Expected**: fontVariantNumeric = "tabular-nums" → số không nhảy khi thay đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_28: Factor badge calories — icon UtensilsCrossed
- **Pre-conditions**: calories factor !== null
- **Steps**: 1. Inspect data-testid="badge-calories"
- **Expected**: Badge hiển thị với UtensilsCrossed icon, score number, bg-white/20 rounded-full
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_29: Factor badge protein — icon Beef
- **Pre-conditions**: protein factor !== null
- **Steps**: 1. Inspect data-testid="badge-protein"
- **Expected**: Badge hiển thị với Beef icon và protein score
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_30: Factor badge workout — icon Dumbbell
- **Pre-conditions**: workout factor !== null
- **Steps**: 1. Inspect data-testid="badge-workout"
- **Expected**: Badge hiển thị với Dumbbell icon và workout score
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_31: Factor badge weightLog — icon Scale
- **Pre-conditions**: weightLog factor !== null
- **Steps**: 1. Inspect data-testid="badge-weightLog"
- **Expected**: Badge hiển thị với Scale icon và weightLog score
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_32: Factor badge streak — icon Flame
- **Pre-conditions**: streak factor !== null
- **Steps**: 1. Inspect data-testid="badge-streak"
- **Expected**: Badge hiển thị với Flame icon và streak score
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_33: Factor = null → badge ẩn
- **Pre-conditions**: workout factor = null (chưa có workout data)
- **Steps**: 1. Observe data-testid="score-badges"
- **Expected**: data-testid="badge-workout" không tồn tại trong DOM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_34: Tất cả 5 factors null → không có badge section
- **Pre-conditions**: Tất cả factors trả về null
- **Steps**: 1. Observe DailyScoreHero
- **Expected**: data-testid="score-badges" không tồn tại (activeBadges.length === 0)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSL_35: Partial data — 3/5 factors → label hiển thị
- **Pre-conditions**: calories, protein, streak có giá trị; workout, weightLog = null
- **Steps**: 1. Observe DailyScoreHero
- **Expected**: data-testid="partial-data-label" hiển thị "(Dữ liệu chưa đầy đủ)"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_36: Full data — 5/5 factors → no partial label
- **Pre-conditions**: Tất cả 5 factors có giá trị
- **Steps**: 1. Observe DailyScoreHero
- **Expected**: data-testid="partial-data-label" không tồn tại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_37: First-time user hiển thị onboarding checklist
- **Pre-conditions**: isFirstTimeUser = true (health profile = default)
- **Steps**: 1. Đăng ký tài khoản mới 2. Mở Dashboard
- **Expected**: DailyScoreHero hiển thị tiêu đề onboarding, 3 checklist items, gradient slate, không score number
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_38: First-time user gradient = slate
- **Pre-conditions**: isFirstTimeUser = true
- **Steps**: 1. Inspect DailyScoreHero background
- **Expected**: Gradient class "from-[#64748b] to-[#475569]" (slate), bất kể score value
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_39: First-time user không hiển thị score number
- **Pre-conditions**: isFirstTimeUser = true
- **Steps**: 1. Tìm data-testid="score-number"
- **Expected**: Element không tồn tại, thay bằng checklist UI
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_40: First-time user không hiển thị factor badges
- **Pre-conditions**: isFirstTimeUser = true
- **Steps**: 1. Tìm data-testid="score-badges"
- **Expected**: Element không tồn tại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_41: Onboarding checklist 3 items numbered
- **Pre-conditions**: isFirstTimeUser = true
- **Steps**: 1. Inspect checklist ul > li elements
- **Expected**: 3 li items, mỗi item có số thứ tự (1, 2, 3) trong circle bg-white/20
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_42: DailyScoreHero role="region"
- **Pre-conditions**: DailyScoreHero render (bất kỳ state)
- **Steps**: 1. Inspect root element
- **Expected**: role="region" trên container div
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_43: DailyScoreHero aria-label chứa score
- **Pre-conditions**: isFirstTimeUser = false, score = 85
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label chứa "85" và "Tuyệt vời" (hoặc tương ứng)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_44: Badge icons aria-hidden
- **Pre-conditions**: Có factor badges hiển thị
- **Steps**: 1. Inspect SVG icons trong badges
- **Expected**: Tất cả icons có aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_45: WeightMini tap mở WeightQuickLog
- **Pre-conditions**: Dashboard tab active
- **Steps**: 1. Click/tap WeightMini component
- **Expected**: WeightQuickLog bottom sheet hiển thị, weightQuickLogOpen = true
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_46: WeightQuickLog onClose đóng bottom sheet
- **Pre-conditions**: WeightQuickLog đang mở
- **Steps**: 1. Click close button hoặc backdrop
- **Expected**: WeightQuickLog unmount, weightQuickLogOpen = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_47: WeightQuickLog không render khi closed
- **Pre-conditions**: weightQuickLogOpen = false
- **Steps**: 1. Inspect DOM
- **Expected**: data-testid="weight-quick-log" không tồn tại trong DOM (conditional rendering)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_48: AutoAdjustBanner hiển thị khi có adjustment
- **Pre-conditions**: useFeedbackLoop trả về adjustment !== undefined
- **Steps**: 1. Observe Tier 4
- **Expected**: AutoAdjustBanner render trong Tier 4, hiển thị adjustment info
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_49: AutoAdjustBanner ẩn khi không có adjustment
- **Pre-conditions**: useFeedbackLoop trả về adjustment = undefined
- **Steps**: 1. Observe Tier 4
- **Expected**: AutoAdjustBanner không render, chỉ AiInsightCard hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_50: AutoAdjustBanner onApply callback
- **Pre-conditions**: AutoAdjustBanner visible
- **Steps**: 1. Click "Apply" trên AutoAdjustBanner
- **Expected**: applyAdjustment() được gọi, cập nhật calorieOffset trong store
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_51: AutoAdjustBanner onDismiss callback
- **Pre-conditions**: AutoAdjustBanner visible
- **Steps**: 1. Click "Dismiss" trên AutoAdjustBanner
- **Expected**: dismissAdjustment() được gọi, banner ẩn đi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_52: Dashboard layout spacing
- **Pre-conditions**: Dashboard tab active
- **Steps**: 1. Inspect container class
- **Expected**: "flex flex-col gap-3 px-4 pb-6 overflow-y-auto"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_53: Dashboard overflow-y-auto scroll
- **Pre-conditions**: Nội dung dashboard vượt viewport height
- **Steps**: 1. Scroll xuống
- **Expected**: Container scrollable, tất cả tiers accessible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_54: Greeting đúng theo thời gian
- **Pre-conditions**: Dashboard load lúc 9:00 AM
- **Steps**: 1. Observe greeting text trong DailyScoreHero
- **Expected**: Greeting "Chào buổi sáng" (hoặc tương ứng với buổi sáng)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_55: React.memo prevents unnecessary re-renders
- **Pre-conditions**: Dashboard đã render, parent re-render với same props
- **Steps**: 1. Trigger parent re-render 2. Monitor DashboardTab render count
- **Expected**: DashboardTab không re-render nếu inputs không đổi (React.memo)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSL_056: Tier 1 chứa DailyScoreHero component
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect children của dashboard-tier-1
- **Expected**: Tier 1 chứa chính xác 1 child là DailyScoreHero component
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_057: Tier 2 chứa EnergyBalanceMini + ProteinProgress
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect children của dashboard-tier-2
- **Expected**: Tier 2 chứa EnergyBalanceMini và ProteinProgress trong flex-col gap-3
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_058: Tier 3 chứa TodaysPlanCard + WeightMini + StreakMini
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect children của dashboard-tier-3
- **Expected**: Tier 3 chứa TodaysPlanCard và grid 2 cột (WeightMini, StreakMini)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_059: Tier 4 chứa AutoAdjustBanner + AiInsightCard
- **Pre-conditions**: Dashboard tab mount, lowerTiersVisible = true
- **Steps**: 1. Inspect children của dashboard-tier-4
- **Expected**: Tier 4 chứa AiInsightCard, có thể có AutoAdjustBanner (conditional)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_060: Tier 5 chứa QuickActionsBar
- **Pre-conditions**: Dashboard tab mount, lowerTiersVisible = true
- **Steps**: 1. Inspect children của dashboard-tier-5
- **Expected**: Tier 5 chứa QuickActionsBar component
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_061: Tier order: 1 → 2 → 3 → 4 → 5 trong DOM
- **Pre-conditions**: Dashboard tab mount hoàn tất
- **Steps**: 1. Query tất cả [data-testid^='dashboard-tier-'] 2. Kiểm tra thứ tự DOM
- **Expected**: Thứ tự DOM: tier-1 trước tier-2, tier-2 trước tier-3, tier-3 trước tier-4, tier-4 trước tier-5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_062: Tier 1-3 render trước Tier 4-5 (timing)
- **Pre-conditions**: Dashboard tab mount, Performance API available
- **Steps**: 1. Đo timestamp render của tier-1 (t1), tier-4 (t4) 2. So sánh
- **Expected**: t4 > t1 (Tier 4 render sau Tier 1 ít nhất 1 frame)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_063: Dashboard container có flex-col layout
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect dashboard-tab computed style
- **Expected**: display: flex, flex-direction: column
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_064: Dashboard container có gap-3 (12px)
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect gap giữa các tiers
- **Expected**: gap = 12px (0.75rem = gap-3)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_065: Dashboard container có px-4 (16px padding horizontal)
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect padding-left và padding-right
- **Expected**: padding-left = padding-right = 16px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_066: Dashboard container có pb-6 (24px padding bottom)
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect padding-bottom
- **Expected**: padding-bottom = 24px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_067: Tier 3 grid layout: grid-cols-2 gap-3 cho WeightMini/StreakMini
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect grid container trong tier-3
- **Expected**: display: grid, grid-template-columns: repeat(2, minmax(0, 1fr)), gap: 12px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_068: WeightMini chiếm cột trái trong grid
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect WeightMini position
- **Expected**: WeightMini là first-child của grid, chiếm cột 1
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_069: StreakMini chiếm cột phải trong grid
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect StreakMini position
- **Expected**: StreakMini là second-child của grid, chiếm cột 2
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_070: 5 tiers đều visible sau lazy load hoàn tất
- **Pre-conditions**: Dashboard tab mount, đợi 100ms
- **Steps**: 1. Query tất cả 5 tier elements 2. Kiểm tra visibility
- **Expected**: Tất cả 5 data-testid 'dashboard-tier-1' đến 'dashboard-tier-5' đều visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_071: Tier 2 flex-col gap-3 cho EnergyBalanceMini và ProteinProgress
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect tier-2 layout
- **Expected**: display: flex, flex-direction: column, gap: 12px chứa 2 children
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_072: Tier 4 flex-col gap-3 cho AutoAdjustBanner + AiInsightCard
- **Pre-conditions**: Dashboard tab mount, lowerTiersVisible = true
- **Steps**: 1. Inspect tier-4 layout
- **Expected**: display: flex, flex-direction: column, gap: 12px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_073: Dashboard scroll container overflow-y-auto hoạt động
- **Pre-conditions**: Dashboard tab mount, nội dung dài hơn viewport
- **Steps**: 1. Scroll xuống trong dashboard-tab
- **Expected**: Container scrollable, tất cả 5 tiers accessible qua scroll
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_074: Scroll từ Tier 1 đến Tier 5 smooth
- **Pre-conditions**: Dashboard tab mount, nội dung dài hơn viewport
- **Steps**: 1. Scroll từ đầu đến cuối dashboard
- **Expected**: Scroll mượt, không jank, tất cả tiers render đúng khi vào viewport
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_075: Dashboard không hiển thị horizontal scrollbar
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Kiểm tra overflow-x
- **Expected**: overflow-x không visible, không horizontal scroll
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_076: Tier 1 không có animationDelay (render 0ms)
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Inspect style của dashboard-tier-1
- **Expected**: Không có animationDelay property hoặc animationDelay = '0ms'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_077: Tier 2 animationDelay chính xác 30ms
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Inspect computed style của dashboard-tier-2
- **Expected**: animationDelay = '30ms'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_078: Tier 3 animationDelay chính xác 60ms
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Inspect computed style của dashboard-tier-3
- **Expected**: animationDelay = '60ms'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_079: Tier 2 có class 'dashboard-stagger' khi reduced motion OFF
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Inspect classList của dashboard-tier-2
- **Expected**: classList chứa 'dashboard-stagger'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_080: Tier 3 có class 'dashboard-stagger' khi reduced motion OFF
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Inspect classList của dashboard-tier-3
- **Expected**: classList chứa 'dashboard-stagger'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_081: Tier 1 không có class 'dashboard-stagger'
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect classList của dashboard-tier-1
- **Expected**: classList KHÔNG chứa 'dashboard-stagger' (Tier 1 render ngay, không cần stagger)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_082: staggerStyle(30) trả về {animationDelay: '30ms'}
- **Pre-conditions**: reduced motion OFF
- **Steps**: 1. Gọi staggerStyle(30)
- **Expected**: Return value = {animationDelay: '30ms'}
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_083: staggerStyle(60) trả về {animationDelay: '60ms'}
- **Pre-conditions**: reduced motion OFF
- **Steps**: 1. Gọi staggerStyle(60)
- **Expected**: Return value = {animationDelay: '60ms'}
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_084: STAGGER_DELAYS constant: tier2 = 30, tier3 = 60
- **Pre-conditions**: Source code review
- **Steps**: 1. Inspect STAGGER_DELAYS constant
- **Expected**: STAGGER_DELAYS = { tier2: 30, tier3: 60 } — immutable (as const)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_085: Tier 2 animation bắt đầu sau Tier 1 (visual verify)
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF, slow motion DevTools
- **Steps**: 1. Bật slow motion (Animation tab DevTools) 2. Reload 3. Observe tier-2
- **Expected**: Tier 2 bắt đầu animate SAU tier-1 khoảng 30ms
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_086: Tier 3 animation bắt đầu sau Tier 2 (visual verify)
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF, slow motion DevTools
- **Steps**: 1. Bật slow motion 2. Reload 3. Observe tier-3
- **Expected**: Tier 3 bắt đầu animate SAU tier-2 khoảng 30ms (60ms sau tier-1)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_087: Stagger animation hoạt động đúng khi tab switch back
- **Pre-conditions**: Dashboard đã mount rồi chuyển tab khác, quay lại Dashboard
- **Steps**: 1. Chuyển sang tab Calendar 2. Chuyển về Dashboard tab
- **Expected**: Stagger animation replay (hoặc instant nếu cached)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_088: Dashboard-stagger CSS class có keyframes defined
- **Pre-conditions**: CSS loaded
- **Steps**: 1. Inspect stylesheet cho .dashboard-stagger
- **Expected**: CSS keyframes defined cho .dashboard-stagger (opacity 0→1 hoặc transform)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_089: Stagger animation không gây layout shift
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Bật Performance tab 2. Record layout shift
- **Expected**: Không có Cumulative Layout Shift từ stagger animation
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_090: Tier 4 không có stagger animation (lazy loaded)
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect style và classList của dashboard-tier-4
- **Expected**: Không có animationDelay, không có class dashboard-stagger
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_091: Tier 5 không có stagger animation (lazy loaded)
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Inspect style và classList của dashboard-tier-5
- **Expected**: Không có animationDelay, không có class dashboard-stagger
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_092: Stagger animation chỉ áp dụng cho Tier 2 và Tier 3
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Kiểm tra tất cả 5 tiers cho dashboard-stagger class
- **Expected**: Chỉ tier-2 và tier-3 có dashboard-stagger, tier-1/4/5 không có
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_093: Stagger animation duration ≤ 300ms
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Inspect animation-duration cho dashboard-stagger
- **Expected**: animation-duration ≤ 300ms (fast enough không ảnh hưởng UX)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_094: Stagger animation không repeat (animation-iteration-count: 1)
- **Pre-conditions**: Dashboard tab mount, reduced motion OFF
- **Steps**: 1. Inspect animation-iteration-count
- **Expected**: animation-iteration-count = 1 (chỉ chạy 1 lần)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_095: Reduced motion ON: Tier 2 không có animationDelay
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Inspect style của dashboard-tier-2
- **Expected**: Không có animationDelay hoặc animationDelay = '0ms'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_096: Reduced motion ON: Tier 3 không có animationDelay
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Inspect style của dashboard-tier-3
- **Expected**: Không có animationDelay hoặc animationDelay = '0ms'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_097: Reduced motion ON: Tier 2 không có class 'dashboard-stagger'
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Inspect classList của dashboard-tier-2
- **Expected**: classList KHÔNG chứa 'dashboard-stagger'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_098: Reduced motion ON: Tier 3 không có class 'dashboard-stagger'
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Inspect classList của dashboard-tier-3
- **Expected**: classList KHÔNG chứa 'dashboard-stagger'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_099: Reduced motion ON: staggerStyle trả về {}
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Gọi staggerStyle(30)
- **Expected**: Return value = {} (empty object)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_100: Reduced motion ON: tierClassName trả về '' (empty string)
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Gọi tierClassName
- **Expected**: Return value = '' (không có 'dashboard-stagger')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_101: Reduced motion ON: tất cả 5 tiers render đồng thời
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Đo timestamp render của tất cả 5 tiers
- **Expected**: Tất cả tiers render trong cùng frame (±16ms)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_102: useReducedMotion hook detect OS setting
- **Pre-conditions**: OS prefers-reduced-motion: reduce
- **Steps**: 1. Kiểm tra reducedMotion state
- **Expected**: reducedMotion = true
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_103: useReducedMotion hook: OS no-preference → false
- **Pre-conditions**: OS prefers-reduced-motion: no-preference
- **Steps**: 1. Kiểm tra reducedMotion state
- **Expected**: reducedMotion = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_104: Reduced motion toggle runtime: ON → OFF → animation appears
- **Pre-conditions**: Ban đầu reduced motion ON, toggle OFF
- **Steps**: 1. Bật reduced motion 2. Mount dashboard 3. Tắt reduced motion 4. Remount
- **Expected**: Sau remount: stagger animation hoạt động
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_105: Reduced motion toggle runtime: OFF → ON → animation removed
- **Pre-conditions**: Ban đầu reduced motion OFF, toggle ON
- **Steps**: 1. Tắt reduced motion 2. Mount dashboard 3. Bật reduced motion 4. Remount
- **Expected**: Sau remount: không có stagger animation
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_106: Reduced motion ON: Tier 4-5 vẫn lazy load (không ảnh hưởng)
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Mount dashboard 2. Observe tier-4-placeholder
- **Expected**: Tier 4-5 vẫn lazy load qua rAF (reduced motion chỉ ảnh hưởng animation, không ảnh hưởng loading)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_107: Reduced motion ON: Score number không có animation
- **Pre-conditions**: prefers-reduced-motion: reduce enabled, score đổi từ 50→80
- **Steps**: 1. Observe DailyScoreHero khi score thay đổi
- **Expected**: Score number cập nhật tức thời, không count-up animation
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_108: Reduced motion ON: ErrorBoundary vẫn hoạt động
- **Pre-conditions**: prefers-reduced-motion: reduce, Tier 2 crash
- **Steps**: 1. Force error trong Tier 2
- **Expected**: ErrorBoundary bắt lỗi, fallback hiển thị, Tier 1/3/4/5 OK
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_109: Reduced motion ON: layout giữ nguyên không thay đổi
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. So sánh layout reduced-motion ON vs OFF (sau animation xong)
- **Expected**: Layout cuối cùng giống hệt nhau (chỉ khác animation transition)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_110: Reduced motion ON: WeightQuickLog bottom sheet mở không animation
- **Pre-conditions**: prefers-reduced-motion: reduce, WeightQuickLog open
- **Steps**: 1. Tap WeightMini
- **Expected**: WeightQuickLog hiển thị ngay, không slide-up animation
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_111: useReducedMotion sử dụng matchMedia API
- **Pre-conditions**: Browser hỗ trợ matchMedia
- **Steps**: 1. Review source code
- **Expected**: Hook dùng window.matchMedia('(prefers-reduced-motion: reduce)')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSL_112: useReducedMotion cleanup listener on unmount
- **Pre-conditions**: Component unmount
- **Steps**: 1. Mount rồi unmount DashboardTab 2. Kiểm tra event listeners
- **Expected**: matchMedia listener được remove khi unmount (no memory leak)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSL_113: Reduced motion ON: DailyScoreHero gradient không animate
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Inspect DailyScoreHero gradient
- **Expected**: Gradient hiển thị static, không có shimmer/pulse animation
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_114: Reduced motion ON: factor badges hiển thị instant
- **Pre-conditions**: prefers-reduced-motion: reduce enabled
- **Steps**: 1. Inspect factor badges render timing
- **Expected**: Tất cả badges hiển thị cùng lúc, không staggered appearance
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_115: Tier 4 placeholder hiển thị trước rAF callback
- **Pre-conditions**: Dashboard tab mount, trước rAF
- **Steps**: 1. Synchronously check DOM sau mount
- **Expected**: data-testid='dashboard-tier-4-placeholder' tồn tại trong DOM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_116: Tier 5 không render trước rAF callback
- **Pre-conditions**: Dashboard tab mount, trước rAF
- **Steps**: 1. Synchronously check DOM sau mount
- **Expected**: data-testid='dashboard-tier-5' KHÔNG tồn tại trước rAF
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_117: lowerTiersVisible khởi tạo = false
- **Pre-conditions**: DashboardTab initial state
- **Steps**: 1. Inspect state value
- **Expected**: lowerTiersVisible = false trước rAF callback
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_118: lowerTiersVisible chuyển thành true sau rAF
- **Pre-conditions**: DashboardTab mount
- **Steps**: 1. Đợi rAF callback 2. Inspect state
- **Expected**: lowerTiersVisible = true sau requestAnimationFrame
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_119: Tier 4 content thay thế placeholder sau rAF
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Observe DOM changes 2. Đợi rAF
- **Expected**: dashboard-tier-4-placeholder biến mất, dashboard-tier-4 xuất hiện với content thật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_120: Tier 5 xuất hiện sau rAF
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Đợi rAF callback 2. Query dashboard-tier-5
- **Expected**: dashboard-tier-5 tồn tại trong DOM với QuickActionsBar
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_121: Placeholder → Content transition không gây layout shift
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Record CLS score trước và sau lazy load
- **Expected**: CLS = 0 (min-h-[56px] prevent shift)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_122: Tier 4 placeholder có aria-hidden='true'
- **Pre-conditions**: Dashboard tab mount, trước rAF
- **Steps**: 1. Inspect placeholder attributes
- **Expected**: aria-hidden='true' trên placeholder element
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_123: Tier 4 placeholder min-h-[56px] = 56px computed height
- **Pre-conditions**: Dashboard tab mount, trước rAF
- **Steps**: 1. Inspect computed min-height
- **Expected**: min-height = 56px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_124: Lazy load chỉ kích hoạt 1 lần (không re-trigger)
- **Pre-conditions**: Dashboard tab mount, đợi 1s
- **Steps**: 1. Monitor lowerTiersVisible state changes
- **Expected**: lowerTiersVisible chuyển từ false → true đúng 1 lần, không flip-flop
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_125: requestAnimationFrame gọi đúng 1 lần
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Spy on requestAnimationFrame calls
- **Expected**: rAF gọi 1 lần trong useEffect, callback set lowerTiersVisible = true
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_126: Lazy load không block main thread
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Đo Long Task API
- **Expected**: Không có long task > 50ms từ lazy load logic
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_127: Tier 4 content render sau placeholder unmount
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. MutationObserver trên tier-4 area
- **Expected**: Placeholder removed → Tier 4 content inserted (single DOM update)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_128: Lazy load hoạt động đúng trên slow device (CPU throttle 4x)
- **Pre-conditions**: Dashboard tab mount, CPU throttle 4x
- **Steps**: 1. Enable CPU throttling 2. Reload 3. Observe lazy load
- **Expected**: Tier 4-5 vẫn render (có thể delay hơn), không crash
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_129: Tier 4-5 render đúng nội dung sau lazy load
- **Pre-conditions**: Dashboard tab mount, đợi lazy load hoàn tất
- **Steps**: 1. Inspect tier-4 children 2. Inspect tier-5 children
- **Expected**: Tier 4: AiInsightCard (+ AutoAdjustBanner nếu có). Tier 5: QuickActionsBar
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_130: useEffect cleanup: cancel rAF nếu unmount trước callback
- **Pre-conditions**: DashboardTab mount rồi unmount ngay <16ms
- **Steps**: 1. Mount DashboardTab 2. Unmount ngay 3. Kiểm tra console errors
- **Expected**: Không có 'setState on unmounted component' warning
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_131: Placeholder background color phù hợp theme
- **Pre-conditions**: Dashboard tab mount, trước rAF
- **Steps**: 1. Inspect placeholder background
- **Expected**: Placeholder có background phù hợp (transparent hoặc subtle gray)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSL_132: Lazy load timing: Tier 4-5 xuất hiện trong < 100ms
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Đo thời gian từ mount đến tier-4 visible
- **Expected**: Tier 4-5 visible trong < 100ms (1-2 rAF frames)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_133: Multiple rapid mount/unmount không gây memory leak
- **Pre-conditions**: Mount/unmount DashboardTab 10 lần nhanh
- **Steps**: 1. Mount/unmount 10 lần 2. Check memory heap
- **Expected**: Heap size stable, không tăng dần (rAF cleanup đúng)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_134: Tier 4-5 không flash/flicker khi lazy load
- **Pre-conditions**: Dashboard tab mount, observe visually
- **Steps**: 1. Observe dashboard khi load
- **Expected**: Tier 4-5 xuất hiện mượt, không flash trắng hoặc flicker content
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_135: Tier 4 placeholder min-h-[56px] prevents CLS khi content load
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Đo CLS với PerformanceObserver 2. Observe lazy load transition
- **Expected**: CLS score = 0 từ tier 4 transition
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_136: Tier 4 placeholder chiều rộng = 100% parent width
- **Pre-conditions**: Dashboard tab mount, trước rAF
- **Steps**: 1. Inspect placeholder width
- **Expected**: width = 100% of dashboard-tab container
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_137: Tier 4 content height ≤ placeholder min-height + reasonable growth
- **Pre-conditions**: Dashboard tab mount, sau lazy load
- **Steps**: 1. Đo tier-4 actual height vs 56px
- **Expected**: Actual height ≥ 56px (content fills or exceeds placeholder space)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_138: Không có CLS khi AutoAdjustBanner xuất hiện conditional
- **Pre-conditions**: adjustment !== null, dashboard mount
- **Steps**: 1. Đo CLS 2. Observe AutoAdjustBanner render
- **Expected**: AutoAdjustBanner render trong reserved space, CLS = 0 hoặc rất nhỏ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_139: Không có CLS khi AutoAdjustBanner dismiss
- **Pre-conditions**: AutoAdjustBanner đang hiển thị
- **Steps**: 1. Dismiss AutoAdjustBanner 2. Đo CLS
- **Expected**: Layout shift minimal khi banner biến mất
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_140: Không có CLS khi WeightQuickLog open
- **Pre-conditions**: Dashboard stable
- **Steps**: 1. Tap WeightMini 2. Observe CLS
- **Expected**: WeightQuickLog overlay, không shift dashboard content
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_141: Không có CLS khi WeightQuickLog close
- **Pre-conditions**: WeightQuickLog đang mở
- **Steps**: 1. Close WeightQuickLog 2. Observe CLS
- **Expected**: Dashboard layout restored, CLS = 0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_142: Không có CLS khi first-time user → regular user transition
- **Pre-conditions**: isDefaultProfile = true → false
- **Steps**: 1. Complete onboarding 2. Observe layout shift
- **Expected**: Transition từ checklist → score view không gây CLS lớn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_143: Tier 1-3 chiều cao ổn định sau render
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Đo height của tier-1, tier-2, tier-3 sau 1s
- **Expected**: Heights không thay đổi sau initial render (stable layout)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_144: Font loading không gây CLS trong score display
- **Pre-conditions**: Dashboard tab mount, slow network
- **Steps**: 1. Throttle network 2. Observe score number rendering
- **Expected**: Score number không nhảy size khi font load (fallback font similar size)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_145: ErrorBoundary Tier 1 fallback hiển thị error message
- **Pre-conditions**: Tier 1 throw error
- **Steps**: 1. Force DailyScoreHero throw error
- **Expected**: Fallback UI hiển thị thay vì DailyScoreHero, có thông báo lỗi
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSL_146: ErrorBoundary Tier 1 crash → Tier 2 render bình thường
- **Pre-conditions**: Tier 1 throw error
- **Steps**: 1. Force error trong Tier 1 2. Inspect Tier 2
- **Expected**: EnergyBalanceMini + ProteinProgress render bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSL_147: ErrorBoundary Tier 1 crash → Tier 3 render bình thường
- **Pre-conditions**: Tier 1 throw error
- **Steps**: 1. Force error trong Tier 1 2. Inspect Tier 3
- **Expected**: TodaysPlanCard + WeightMini + StreakMini render bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSL_148: ErrorBoundary Tier 1 crash → Tier 4 render bình thường
- **Pre-conditions**: Tier 1 throw error
- **Steps**: 1. Force error trong Tier 1 2. Inspect Tier 4
- **Expected**: AiInsightCard render bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_149: ErrorBoundary Tier 1 crash → Tier 5 render bình thường
- **Pre-conditions**: Tier 1 throw error
- **Steps**: 1. Force error trong Tier 1 2. Inspect Tier 5
- **Expected**: QuickActionsBar render bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_150: ErrorBoundary Tier 2 fallback hiển thị error message
- **Pre-conditions**: Tier 2 throw error
- **Steps**: 1. Force EnergyBalanceMini throw error
- **Expected**: Fallback UI hiển thị thay vì Tier 2 content
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSL_151: ErrorBoundary Tier 3 fallback hiển thị error message
- **Pre-conditions**: Tier 3 throw error
- **Steps**: 1. Force TodaysPlanCard throw error
- **Expected**: Fallback UI hiển thị thay vì Tier 3 content
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSL_152: ErrorBoundary Tier 4 fallback hiển thị error message
- **Pre-conditions**: Tier 4 throw error
- **Steps**: 1. Force AiInsightCard throw error
- **Expected**: Fallback UI hiển thị thay vì Tier 4 content
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_153: ErrorBoundary Tier 5 fallback hiển thị error message
- **Pre-conditions**: Tier 5 throw error
- **Steps**: 1. Force QuickActionsBar throw error
- **Expected**: Fallback UI hiển thị thay vì Tier 5 content
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_154: Tier 2 crash → Tier 1, 3, 4, 5 vẫn interactive
- **Pre-conditions**: Tier 2 throw error
- **Steps**: 1. Force error Tier 2 2. Tap WeightMini (Tier 3)
- **Expected**: WeightMini vẫn clickable, WeightQuickLog mở bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_155: Tier 3 crash → Tier 1, 2, 4, 5 vẫn interactive
- **Pre-conditions**: Tier 3 throw error
- **Steps**: 1. Force error Tier 3 2. Inspect EnergyBalanceMini (Tier 2)
- **Expected**: EnergyBalanceMini hiển thị data bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_156: Tier 4 crash → QuickActionsBar (Tier 5) vẫn hoạt động
- **Pre-conditions**: Tier 4 throw error
- **Steps**: 1. Force error Tier 4 2. Tap action button (Tier 5)
- **Expected**: QuickActionsBar buttons vẫn clickable và navigate
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_157: Multiple tiers crash đồng thời → còn lại vẫn OK
- **Pre-conditions**: Tier 1 + Tier 3 throw error
- **Steps**: 1. Force error Tier 1 và Tier 3 2. Inspect Tier 2, 4, 5
- **Expected**: Tier 2, 4, 5 render bình thường, Tier 1 và 3 hiển thị fallback
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSL_158: Tất cả 5 tiers crash → dashboard hiển thị 5 fallback
- **Pre-conditions**: Tất cả components throw error
- **Steps**: 1. Force error tất cả tier components
- **Expected**: 5 fallback UIs hiển thị, app không crash hoàn toàn
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_DSL_159: ErrorBoundary fallback không ảnh hưởng layout
- **Pre-conditions**: Tier 2 throw error
- **Steps**: 1. Force error Tier 2 2. Inspect layout
- **Expected**: Fallback chiếm cùng space, Tier 3 position không đổi
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_DSL_160: ErrorBoundary log error to console
- **Pre-conditions**: Tier 1 throw error
- **Steps**: 1. Force error 2. Check Console tab
- **Expected**: Console hiển thị error stack trace từ ErrorBoundary componentDidCatch
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_DSL_161: ErrorBoundary fallback có retry button (nếu implemented)
- **Pre-conditions**: Tier 2 throw error
- **Steps**: 1. Force error 2. Inspect fallback
- **Expected**: Fallback có nút retry hoặc thông báo reload
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P3

##### TC_DSL_162: ErrorBoundary chỉ bắt render error (không bắt event handler error)
- **Pre-conditions**: Click handler throw error
- **Steps**: 1. Force error trong onClick handler
- **Expected**: Error propagate lên, ErrorBoundary KHÔNG bắt (React limitation)
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_DSL_163: ErrorBoundary recovery sau hot reload (dev mode)
- **Pre-conditions**: Tier 2 crash, dev mode
- **Steps**: 1. Force error 2. Hot reload (save file)
- **Expected**: Component recover sau hot reload
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSL_164: ErrorBoundary isolate memory: crashed tier không leak
- **Pre-conditions**: Tier 2 crash
- **Steps**: 1. Force error Tier 2 2. Đo memory usage
- **Expected**: Memory stable, crashed component cleaned up
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P3

##### TC_DSL_165: ErrorBoundary Tier 2 crash: console không hiện React warning cho Tier 1
- **Pre-conditions**: Tier 2 throw error
- **Steps**: 1. Force error Tier 2 2. Filter console for Tier 1
- **Expected**: Không có React warning liên quan đến Tier 1 components
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_DSL_166: ErrorBoundary Tier 3 crash: WeightMini không leak event listeners
- **Pre-conditions**: Tier 3 throw error
- **Steps**: 1. Force error 2. Check event listeners
- **Expected**: WeightMini event listeners cleaned up properly
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P3

##### TC_DSL_167: ErrorBoundary fallback accessible: role='alert'
- **Pre-conditions**: Tier crash
- **Steps**: 1. Force error 2. Inspect fallback ARIA
- **Expected**: Fallback có role='alert' hoặc aria-live='assertive'
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_DSL_168: ErrorBoundary fallback readable: đủ contrast ratio
- **Pre-conditions**: Tier crash
- **Steps**: 1. Force error 2. Kiểm tra contrast
- **Expected**: Fallback text contrast ratio ≥ 4.5:1
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P3

##### TC_DSL_169: Async error trong useEffect không bị ErrorBoundary bắt
- **Pre-conditions**: useEffect async throw error
- **Steps**: 1. Simulate async error 2. Check behavior
- **Expected**: Error không bị ErrorBoundary bắt (React design), cần separate handling
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P3

##### TC_DSL_170: DailyScoreHero score = 0 → hiển thị '0'
- **Pre-conditions**: useDailyScore returns totalScore = 0
- **Steps**: 1. Observe score display
- **Expected**: Hiển thị '0', label 'Cần cải thiện', gradient slate
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSL_171: DailyScoreHero score = 1 → hiển thị '1'
- **Pre-conditions**: useDailyScore returns totalScore = 1
- **Steps**: 1. Observe score display
- **Expected**: Hiển thị '1', label 'Cần cải thiện', gradient slate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_172: DailyScoreHero score = 10 → label 'Cần cải thiện'
- **Pre-conditions**: useDailyScore returns totalScore = 10
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Cần cải thiện', gradient slate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_173: DailyScoreHero score = 25 → label 'Cần cải thiện'
- **Pre-conditions**: useDailyScore returns totalScore = 25
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Cần cải thiện', gradient slate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_174: DailyScoreHero score = 49 → label 'Cần cải thiện' (boundary -1)
- **Pre-conditions**: useDailyScore returns totalScore = 49
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Cần cải thiện', gradient slate (49 < 50)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSL_175: DailyScoreHero score = 50 → label 'Khá tốt' (boundary)
- **Pre-conditions**: useDailyScore returns totalScore = 50
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Khá tốt', gradient amber (50 ≥ 50)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_DSL_176: DailyScoreHero score = 51 → label 'Khá tốt'
- **Pre-conditions**: useDailyScore returns totalScore = 51
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Khá tốt', gradient amber
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_177: DailyScoreHero score = 65 → label 'Khá tốt'
- **Pre-conditions**: useDailyScore returns totalScore = 65
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Khá tốt', gradient amber
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_178: DailyScoreHero score = 79 → label 'Khá tốt' (boundary -1)
- **Pre-conditions**: useDailyScore returns totalScore = 79
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Khá tốt', gradient amber (79 < 80)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSL_179: DailyScoreHero score = 80 → label 'Tuyệt vời' (boundary)
- **Pre-conditions**: useDailyScore returns totalScore = 80
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Tuyệt vời', gradient emerald (80 ≥ 80)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_DSL_180: DailyScoreHero score = 81 → label 'Tuyệt vời'
- **Pre-conditions**: useDailyScore returns totalScore = 81
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Tuyệt vời', gradient emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_181: DailyScoreHero score = 95 → label 'Tuyệt vời'
- **Pre-conditions**: useDailyScore returns totalScore = 95
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Tuyệt vời', gradient emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_182: DailyScoreHero score = 99 → label 'Tuyệt vời'
- **Pre-conditions**: useDailyScore returns totalScore = 99
- **Steps**: 1. Observe score label
- **Expected**: Label = 'Tuyệt vời', gradient emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_183: DailyScoreHero score = 100 → label 'Tuyệt vời' (max)
- **Pre-conditions**: useDailyScore returns totalScore = 100
- **Steps**: 1. Observe score display
- **Expected**: Hiển thị '100', label 'Tuyệt vời', gradient emerald
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSL_184: Score gradient emerald (≥80): from-emerald-500 to-emerald-600
- **Pre-conditions**: score = 85
- **Steps**: 1. Inspect gradient classes
- **Expected**: Container có from-emerald-500 to-emerald-600 gradient
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_185: Score gradient amber (50-79): from-amber-500 to-amber-600
- **Pre-conditions**: score = 65
- **Steps**: 1. Inspect gradient classes
- **Expected**: Container có from-amber-500 to-amber-600 gradient
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_186: Score gradient slate (<50): from-slate-500 to-slate-600
- **Pre-conditions**: score = 30
- **Steps**: 1. Inspect gradient classes
- **Expected**: Container có from-slate-500 to-slate-600 gradient
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_187: Score number font-size responsive (không truncate)
- **Pre-conditions**: score = 100 (3 digits)
- **Steps**: 1. Inspect score display
- **Expected**: 3 chữ số hiển thị đầy đủ, không bị cắt, font-size phù hợp
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_188: Score tabular-nums: '100' và '88' cùng width
- **Pre-conditions**: score thay đổi từ 88 → 100
- **Steps**: 1. Đo width trước và sau
- **Expected**: Width ổn định nhờ tabular-nums (monospaced digits)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_189: Score null/undefined → hiển thị default state
- **Pre-conditions**: useDailyScore returns null
- **Steps**: 1. Observe DailyScoreHero
- **Expected**: Hiển thị default (0 hoặc placeholder), không crash
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DSL_190: Score fraction rounded: 79.6 → hiển thị 80
- **Pre-conditions**: useDailyScore returns 79.6
- **Steps**: 1. Observe score display
- **Expected**: Hiển thị '80' (Math.round(79.6)), label 'Tuyệt vời'
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSL_191: Score fraction rounded: 49.4 → hiển thị 49
- **Pre-conditions**: useDailyScore returns 49.4
- **Steps**: 1. Observe score display
- **Expected**: Hiển thị '49' (Math.round(49.4)), label 'Cần cải thiện'
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSL_192: DailyScoreHero aria-label chứa score number
- **Pre-conditions**: score = 85
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label chứa '85' hoặc tương tự cho screen reader
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_193: DailyScoreHero aria-label chứa label text
- **Pre-conditions**: score = 85
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label chứa 'Tuyệt vời' hoặc tương đương
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_194: Score animation count-up (nếu implemented, reduced motion OFF)
- **Pre-conditions**: score thay đổi từ 0 → 85
- **Steps**: 1. Observe score display
- **Expected**: Score count up từ 0 đến 85 (hoặc instant nếu không implement)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSL_195: 0/5 factors active → không hiển thị badge section
- **Pre-conditions**: Tất cả 5 factors = null
- **Steps**: 1. Inspect DailyScoreHero badges area
- **Expected**: Không có badge nào hiển thị, badge section ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DSL_196: 1/5 factors active → 1 badge hiển thị + partial data label
- **Pre-conditions**: Chỉ calories factor có giá trị, 4 factors = null
- **Steps**: 1. Inspect badges
- **Expected**: 1 badge (UtensilsCrossed), partial data label '(Dữ liệu chưa đầy đủ)'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_197: 2/5 factors active → 2 badges + partial data label
- **Pre-conditions**: calories + protein factors có giá trị
- **Steps**: 1. Inspect badges
- **Expected**: 2 badges hiển thị, partial data label có
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_198: 3/5 factors active → 3 badges + partial data label
- **Pre-conditions**: calories + protein + workout factors có giá trị
- **Steps**: 1. Inspect badges
- **Expected**: 3 badges hiển thị, partial data label có
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_199: 4/5 factors active → 4 badges + partial data label
- **Pre-conditions**: 4 factors có giá trị, streak = null
- **Steps**: 1. Inspect badges
- **Expected**: 4 badges hiển thị, partial data label có (vẫn < 5)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_200: 5/5 factors active → 5 badges + KHÔNG có partial data label
- **Pre-conditions**: Tất cả 5 factors có giá trị
- **Steps**: 1. Inspect badges
- **Expected**: 5 badges hiển thị, KHÔNG có partial data label
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_201: calories factor badge: UtensilsCrossed icon
- **Pre-conditions**: calories factor có giá trị
- **Steps**: 1. Inspect calories badge
- **Expected**: Icon = UtensilsCrossed, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_202: protein factor badge: Beef icon
- **Pre-conditions**: protein factor có giá trị
- **Steps**: 1. Inspect protein badge
- **Expected**: Icon = Beef, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_203: workout factor badge: Dumbbell icon
- **Pre-conditions**: workout factor có giá trị
- **Steps**: 1. Inspect workout badge
- **Expected**: Icon = Dumbbell, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_204: weightLog factor badge: Scale icon
- **Pre-conditions**: weightLog factor có giá trị
- **Steps**: 1. Inspect weightLog badge
- **Expected**: Icon = Scale, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_205: streak factor badge: Flame icon
- **Pre-conditions**: streak factor có giá trị
- **Steps**: 1. Inspect streak badge
- **Expected**: Icon = Flame, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_206: Factor badge order: calories → protein → workout → weightLog → streak
- **Pre-conditions**: 5/5 factors active
- **Steps**: 1. Inspect badge DOM order
- **Expected**: Badges hiển thị theo thứ tự: calories, protein, workout, weightLog, streak
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_207: Factor badge active state: highlighted khi factor > 0
- **Pre-conditions**: calories factor = 20
- **Steps**: 1. Inspect badge styling
- **Expected**: Badge highlighted (emerald color hoặc opacity-100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_208: Factor badge inactive state: dimmed khi factor = 0
- **Pre-conditions**: calories factor = 0 (nhưng không null)
- **Steps**: 1. Inspect badge styling
- **Expected**: Badge dimmed (gray hoặc opacity-50)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_209: Partial data label '(Dữ liệu chưa đầy đủ)' text exact
- **Pre-conditions**: 3/5 factors active
- **Steps**: 1. Inspect partial data text
- **Expected**: Text chính xác là '(Dữ liệu chưa đầy đủ)'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_210: First-time user (isDefaultProfile=true): checklist thay vì score
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect DailyScoreHero
- **Expected**: Không hiển thị score number, hiển thị onboarding checklist
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_211: First-time user: checklist có 3 steps
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Đếm checklist items
- **Expected**: Chính xác 3 checklist items hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_212: First-time user: step 1 text đúng
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect step 1 text
- **Expected**: Step 1 có nội dung onboarding hợp lệ (ví dụ: 'Cập nhật hồ sơ sức khỏe')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_213: First-time user: step 2 text đúng
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect step 2 text
- **Expected**: Step 2 có nội dung onboarding hợp lệ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_214: First-time user: step 3 text đúng
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect step 3 text
- **Expected**: Step 3 có nội dung onboarding hợp lệ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_215: First-time user: gradient = slate (không emerald/amber)
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect DailyScoreHero gradient
- **Expected**: Gradient classes: from-slate-*, không from-emerald-* hay from-amber-*
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_216: First-time user: không hiển thị factor badges
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect badges area
- **Expected**: Không có badges hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_217: First-time user: không hiển thị score label
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect score label area
- **Expected**: Không có 'Tuyệt vời'/'Khá tốt'/'Cần cải thiện' labels
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_218: First-time user: checklist items có số thứ tự 1, 2, 3
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect checklist numbering
- **Expected**: Mỗi item có số 1, 2, 3 prefix
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_219: First-time user: checklist step clickable (navigate)
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Click step 1
- **Expected**: Navigate đến trang tương ứng (ví dụ: Health Profile setup)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_220: First-time user: complete step → check mark hiển thị
- **Pre-conditions**: isDefaultProfile = true, step 1 completed
- **Steps**: 1. Complete step 1 (fill health profile) 2. Quay lại dashboard
- **Expected**: Step 1 có checkmark ✓ hoặc completed styling
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_221: First-time user: complete all 3 steps → chuyển sang score view
- **Pre-conditions**: Tất cả 3 steps completed
- **Steps**: 1. Complete step 3 2. Observe DailyScoreHero
- **Expected**: Checklist biến mất, score view hiển thị (isDefaultProfile = false)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_222: First-time user: partial completion persisted
- **Pre-conditions**: Step 1 completed, step 2,3 chưa
- **Steps**: 1. Close app 2. Reopen
- **Expected**: Step 1 vẫn marked completed, step 2,3 chưa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_223: First-time user: checklist accessible (role='list')
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect checklist ARIA
- **Expected**: Checklist container có role='list', items có role='listitem'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_224: First-time user: DailyScoreHero aria-label cho onboarding state
- **Pre-conditions**: isDefaultProfile = true
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label phù hợp cho onboarding state (không chứa score)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_225: WeightMini tap → WeightQuickLog mở với slide-up animation
- **Pre-conditions**: Dashboard stable
- **Steps**: 1. Tap WeightMini
- **Expected**: WeightQuickLog bottom sheet mở, slide-up animation (hoặc instant nếu reduced motion)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_226: WeightQuickLog mở → backdrop overlay hiển thị
- **Pre-conditions**: Tap WeightMini
- **Steps**: 1. Observe overlay
- **Expected**: ModalBackdrop hiển thị (semi-transparent dark overlay)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_227: WeightQuickLog backdrop tap → dismiss
- **Pre-conditions**: WeightQuickLog đang mở
- **Steps**: 1. Tap backdrop (outside bottom sheet)
- **Expected**: WeightQuickLog close, weightQuickLogOpen = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_228: WeightQuickLog X button → close
- **Pre-conditions**: WeightQuickLog đang mở
- **Steps**: 1. Tap X button (close-btn)
- **Expected**: WeightQuickLog close, weightQuickLogOpen = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSL_229: WeightQuickLog close → unmount từ DOM
- **Pre-conditions**: WeightQuickLog đang mở
- **Steps**: 1. Close WeightQuickLog 2. Query DOM
- **Expected**: data-testid='weight-quick-log' không tồn tại trong DOM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_230: WeightQuickLog không render khi weightQuickLogOpen = false (conditional)
- **Pre-conditions**: weightQuickLogOpen = false
- **Steps**: 1. Query DOM cho weight-quick-log
- **Expected**: Không tìm thấy element (conditional rendering, không chỉ hidden)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_231: WeightMini double tap → chỉ mở 1 instance WeightQuickLog
- **Pre-conditions**: Dashboard stable
- **Steps**: 1. Double tap WeightMini nhanh
- **Expected**: Chỉ 1 WeightQuickLog instance render (không duplicate)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DSL_232: WeightQuickLog mở → focus trap (keyboard)
- **Pre-conditions**: WeightQuickLog mở, keyboard navigation
- **Steps**: 1. Tab through WeightQuickLog
- **Expected**: Focus trapped trong bottom sheet (không tab ra ngoài)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_233: WeightQuickLog close → focus return to WeightMini
- **Pre-conditions**: WeightQuickLog mở → close
- **Steps**: 1. Close WeightQuickLog
- **Expected**: Focus trả về WeightMini (focus restoration)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_234: WeightQuickLog Escape key → close
- **Pre-conditions**: WeightQuickLog mở
- **Steps**: 1. Nhấn Escape key
- **Expected**: WeightQuickLog close (keyboard dismiss)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_235: AutoAdjustBanner hiển thị khi adjustment có positive value
- **Pre-conditions**: useFeedbackLoop returns adjustment = {calories: +200}
- **Steps**: 1. Inspect Tier 4
- **Expected**: AutoAdjustBanner hiển thị với thông tin tăng 200 kcal
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_236: AutoAdjustBanner hiển thị khi adjustment có negative value
- **Pre-conditions**: useFeedbackLoop returns adjustment = {calories: -150}
- **Steps**: 1. Inspect Tier 4
- **Expected**: AutoAdjustBanner hiển thị với thông tin giảm 150 kcal
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_237: AutoAdjustBanner không hiển thị khi adjustment = null
- **Pre-conditions**: useFeedbackLoop returns adjustment = null
- **Steps**: 1. Inspect Tier 4
- **Expected**: Không có AutoAdjustBanner trong DOM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_238: AutoAdjustBanner không hiển thị khi adjustment = undefined
- **Pre-conditions**: useFeedbackLoop returns adjustment = undefined
- **Steps**: 1. Inspect Tier 4
- **Expected**: Không có AutoAdjustBanner trong DOM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_239: AutoAdjustBanner Apply button → gọi applyAdjustment
- **Pre-conditions**: AutoAdjustBanner hiển thị
- **Steps**: 1. Click 'Áp dụng' button
- **Expected**: applyAdjustment() được gọi, targetCalories cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_240: AutoAdjustBanner Dismiss button → gọi dismissAdjustment
- **Pre-conditions**: AutoAdjustBanner hiển thị
- **Steps**: 1. Click 'Bỏ qua' button
- **Expected**: dismissAdjustment() được gọi, banner biến mất
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_241: AutoAdjustBanner Apply → banner biến mất sau apply
- **Pre-conditions**: AutoAdjustBanner hiển thị
- **Steps**: 1. Click Apply 2. Observe banner
- **Expected**: Banner biến mất (adjustment = null sau apply)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_242: AutoAdjustBanner Dismiss → banner biến mất sau dismiss
- **Pre-conditions**: AutoAdjustBanner hiển thị
- **Steps**: 1. Click Dismiss 2. Observe banner
- **Expected**: Banner biến mất (adjustment = null sau dismiss)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_243: AutoAdjustBanner vị trí: trong Tier 4, trước AiInsightCard
- **Pre-conditions**: adjustment có giá trị
- **Steps**: 1. Inspect Tier 4 children order
- **Expected**: AutoAdjustBanner là child đầu tiên, AiInsightCard sau
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_244: AutoAdjustBanner accessible: có aria-label mô tả
- **Pre-conditions**: AutoAdjustBanner hiển thị
- **Steps**: 1. Inspect ARIA attributes
- **Expected**: Banner có aria-label mô tả nội dung adjustment
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_245: Dark mode: Dashboard container bg-slate-900 (hoặc dark variant)
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect dashboard-tab background
- **Expected**: Background = dark theme (slate-900 hoặc tương tự)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_246: Dark mode: Tier 1 DailyScoreHero text readable
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect score text color
- **Expected**: Text color sáng trên nền tối (contrast ≥ 4.5:1)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_247: Dark mode: Tier 2 EnergyBalanceMini dark variant
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect EnergyBalanceMini
- **Expected**: Background dark, text sáng, numbers readable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_248: Dark mode: Tier 2 ProteinProgress dark variant
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect ProteinProgress
- **Expected**: Track dark bg, bar colors vẫn đúng, text sáng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_249: Dark mode: Tier 3 TodaysPlanCard dark variant
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect TodaysPlanCard
- **Expected**: Card bg-slate-800, text-slate-100, borders dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_250: Dark mode: Tier 3 WeightMini dark variant
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect WeightMini
- **Expected**: Dark background, text readable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_251: Dark mode: Tier 3 StreakMini dark variant
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect StreakMini
- **Expected**: Dark background, flame icon visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_252: Dark mode: Tier 4 AiInsightCard dark variant
- **Pre-conditions**: Dark mode ON, lowerTiersVisible = true
- **Steps**: 1. Inspect AiInsightCard
- **Expected**: Dark background, text readable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_253: Dark mode: Tier 5 QuickActionsBar dark variant
- **Pre-conditions**: Dark mode ON, lowerTiersVisible = true
- **Steps**: 1. Inspect QuickActionsBar buttons
- **Expected**: Secondary buttons: dark:bg-slate-800, dark:border-slate-600, dark:text-emerald-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_254: Dark mode: AutoAdjustBanner dark variant
- **Pre-conditions**: Dark mode ON, adjustment có giá trị
- **Steps**: 1. Inspect AutoAdjustBanner
- **Expected**: Dark background, text readable, buttons dark variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_255: Dark mode: WeightQuickLog dark variant
- **Pre-conditions**: Dark mode ON, WeightQuickLog open
- **Steps**: 1. Inspect WeightQuickLog
- **Expected**: bg-slate-800, text sáng, stepper buttons dark, chips dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_256: Dark mode: ErrorBoundary fallback dark variant
- **Pre-conditions**: Dark mode ON, Tier crash
- **Steps**: 1. Force error 2. Inspect fallback
- **Expected**: Fallback UI dark theme, text readable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSL_257: Dark mode toggle: light → dark → layout preserved
- **Pre-conditions**: Switch từ light sang dark mode
- **Steps**: 1. Note layout 2. Toggle dark mode
- **Expected**: Tất cả tiers giữ nguyên position/size, chỉ đổi colors
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_258: Dark mode: gradient colors vẫn phân biệt được
- **Pre-conditions**: Dark mode ON, score = 85 (emerald)
- **Steps**: 1. Inspect gradient
- **Expected**: Gradient emerald vẫn visible và phân biệt trên dark background
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_259: Dark mode: factor badges readable
- **Pre-conditions**: Dark mode ON, 5/5 factors
- **Steps**: 1. Inspect badge icons
- **Expected**: Icons visible, colors phù hợp trên dark background
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_260: Greeting sáng (5:00-11:59): 'Chào buổi sáng'
- **Pre-conditions**: System time 8:00 AM
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting = 'Chào buổi sáng' (hoặc tương tự)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_261: Greeting trưa/chiều (12:00-17:59): 'Chào buổi chiều'
- **Pre-conditions**: System time 2:00 PM
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting = 'Chào buổi chiều' (hoặc tương tự)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_262: Greeting tối (18:00-4:59): 'Chào buổi tối'
- **Pre-conditions**: System time 8:00 PM
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting = 'Chào buổi tối' (hoặc tương tự)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_263: Greeting boundary: 12:00 chính xác → 'Chào buổi chiều'
- **Pre-conditions**: System time 12:00 PM
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting = 'Chào buổi chiều' (12:00 = afternoon boundary)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSL_264: Greeting boundary: 18:00 chính xác → 'Chào buổi tối'
- **Pre-conditions**: System time 6:00 PM
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting = 'Chào buổi tối' (18:00 = evening boundary)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSL_265: Greeting boundary: 5:00 chính xác → 'Chào buổi sáng'
- **Pre-conditions**: System time 5:00 AM
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting = 'Chào buổi sáng' (5:00 = morning boundary)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSL_266: Greeting boundary: 4:59 → 'Chào buổi tối'
- **Pre-conditions**: System time 4:59 AM
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting = 'Chào buổi tối' (4:59 = still evening)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSL_267: Greeting boundary: 11:59 → 'Chào buổi sáng'
- **Pre-conditions**: System time 11:59 AM
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting = 'Chào buổi sáng' (11:59 = still morning)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSL_268: Greeting boundary: 17:59 → 'Chào buổi chiều'
- **Pre-conditions**: System time 5:59 PM
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting = 'Chào buổi chiều' (17:59 = still afternoon)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSL_269: Greeting chứa tên user (nếu có)
- **Pre-conditions**: User đã set display name = 'Khánh'
- **Steps**: 1. Observe greeting text
- **Expected**: Greeting chứa tên, ví dụ: 'Chào buổi sáng, Khánh'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_270: Tab switch: Dashboard → Calendar → Dashboard: layout preserved
- **Pre-conditions**: Dashboard đã render
- **Steps**: 1. Chuyển sang Calendar tab 2. Chuyển về Dashboard tab
- **Expected**: Tất cả 5 tiers hiển thị đúng, data unchanged
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_271: Tab switch: Dashboard → Fitness → Dashboard: score preserved
- **Pre-conditions**: Dashboard score = 85
- **Steps**: 1. Chuyển sang Fitness 2. Chuyển về Dashboard
- **Expected**: Score vẫn = 85, label 'Tuyệt vời'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_272: Tab switch: Dashboard → Settings → Dashboard: WeightQuickLog state reset
- **Pre-conditions**: WeightQuickLog đang mở
- **Steps**: 1. Chuyển tab 2. Chuyển về
- **Expected**: WeightQuickLog đóng (weightQuickLogOpen = false)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_273: Tab switch: lazy loaded tiers vẫn visible sau switch back
- **Pre-conditions**: Dashboard với Tier 4-5 đã loaded
- **Steps**: 1. Chuyển tab 2. Chuyển về
- **Expected**: Tier 4-5 vẫn visible, không cần lazy load lại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_274: Tab switch: stagger animation không replay sau switch back
- **Pre-conditions**: Dashboard đã render
- **Steps**: 1. Chuyển tab 2. Chuyển về 3. Observe animation
- **Expected**: Không replay stagger animation (already loaded)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_275: Rapid tab switching: Dashboard ↔ Calendar 5 lần
- **Pre-conditions**: Dashboard active
- **Steps**: 1. Switch tabs 5 lần nhanh
- **Expected**: Không crash, không duplicate renders, final state đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSL_276: Tab switch: meal data updated → Dashboard reflects change
- **Pre-conditions**: Log meal trong Calendar tab
- **Steps**: 1. Dashboard → Calendar → Log bữa sáng → Dashboard
- **Expected**: EnergyBalanceMini cập nhật eaten calories, ProteinProgress cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_277: Tab switch: weight logged → Dashboard reflects change
- **Pre-conditions**: Log weight trong Fitness tab
- **Steps**: 1. Dashboard → Fitness → Log weight → Dashboard
- **Expected**: WeightMini hiển thị weight mới, factor badge weightLog cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_278: Dashboard mount lại không duplicate API calls
- **Pre-conditions**: Tab switch Dashboard → Calendar → Dashboard
- **Steps**: 1. Monitor Network tab 2. Switch back to Dashboard
- **Expected**: Không có duplicate API calls (stores đã cached)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_279: Dashboard state consistent sau multiple tab switches
- **Pre-conditions**: Switch tabs 10 lần
- **Steps**: 1. Switch tabs nhiều lần 2. Final: Dashboard tab
- **Expected**: Dashboard hiển thị đúng dữ liệu, không stale data
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_280: Dashboard Tier 1-3 render < 200ms
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Đo thời gian từ mount → tier-3 painted
- **Expected**: Total time < 200ms (Performance API)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_281: Dashboard full render (5 tiers) < 300ms
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Đo thời gian từ mount → tier-5 painted
- **Expected**: Total time < 300ms kể cả lazy load
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_282: DailyScoreHero render < 50ms
- **Pre-conditions**: Dashboard mount
- **Steps**: 1. Profile DailyScoreHero render time
- **Expected**: Component render < 50ms
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_283: React.memo: parent re-render → Dashboard không re-render
- **Pre-conditions**: Parent state change, Dashboard props unchanged
- **Steps**: 1. Trigger parent re-render 2. Monitor DashboardTab
- **Expected**: DashboardTab skipped (React.memo)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_284: Không có unnecessary re-renders khi score unchanged
- **Pre-conditions**: Score = 85, trigger unrelated state change
- **Steps**: 1. Change unrelated state 2. Monitor DailyScoreHero
- **Expected**: DailyScoreHero không re-render
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_285: Bundle size: DashboardTab chunk < 50KB gzipped
- **Pre-conditions**: Build production
- **Steps**: 1. Analyze bundle size
- **Expected**: DashboardTab và dependencies < 50KB gzipped
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSL_286: Không có memory leak sau 100 mount/unmount cycles
- **Pre-conditions**: Stress test
- **Steps**: 1. Mount/unmount DashboardTab 100 lần 2. Measure heap
- **Expected**: Heap size stable (±10%)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_287: Lazy load: Tier 4-5 không block First Contentful Paint
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Measure FCP
- **Expected**: FCP chỉ bao gồm Tier 1-3, Tier 4-5 load sau
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_288: No Long Tasks > 50ms during Dashboard render
- **Pre-conditions**: Dashboard tab mount
- **Steps**: 1. Monitor Long Task API
- **Expected**: Không có task > 50ms (no jank)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_289: Dashboard scroll: 60fps maintained
- **Pre-conditions**: Scroll through all tiers
- **Steps**: 1. Profile scroll performance
- **Expected**: Frame rate ≥ 55fps (near 60fps), no jank frames
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_290: Dashboard tab accessible name
- **Pre-conditions**: Dashboard tab active
- **Steps**: 1. Inspect ARIA
- **Expected**: Dashboard container có accessible name (aria-label hoặc heading)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_291: Tất cả interactive elements có focus visible
- **Pre-conditions**: Keyboard navigation
- **Steps**: 1. Tab through all interactive elements
- **Expected**: Mỗi element có visible focus indicator (focus:ring-2)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_292: Tab order logic: top-to-bottom, left-to-right
- **Pre-conditions**: Keyboard navigation
- **Steps**: 1. Tab through dashboard
- **Expected**: Focus order: Tier 1 → Tier 2 → Tier 3 (WeightMini, StreakMini) → Tier 4 → Tier 5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_293: Screen reader: score announced correctly
- **Pre-conditions**: Screen reader ON, score = 85
- **Steps**: 1. Navigate to DailyScoreHero
- **Expected**: Screen reader announces score 85 và label 'Tuyệt vời'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_294: All decorative icons aria-hidden='true'
- **Pre-conditions**: Dashboard render
- **Steps**: 1. Inspect all icon elements
- **Expected**: Tất cả decorative icons (Lucide) có aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_295: Color không phải là cách duy nhất để truyền thông tin
- **Pre-conditions**: Dashboard render
- **Steps**: 1. View in grayscale mode
- **Expected**: Score label text ('Tuyệt vời', etc.) truyền info ngoài color
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_296: Touch target ≥ 44px cho tất cả interactive elements
- **Pre-conditions**: Dashboard render
- **Steps**: 1. Inspect hit area của all buttons
- **Expected**: Min touch target 44×44px cho WeightMini, action buttons, etc.
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSL_297: Heading hierarchy: h1 → h2 → h3 đúng thứ tự
- **Pre-conditions**: Dashboard render
- **Steps**: 1. Inspect heading levels
- **Expected**: Headings follow logical hierarchy, không skip levels
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSL_298: LiveRegion: score change announced
- **Pre-conditions**: Score thay đổi từ 50 → 85
- **Steps**: 1. Monitor aria-live region
- **Expected**: Screen reader announce score change
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSL_299: Landmark regions: dashboard là main content
- **Pre-conditions**: Dashboard render
- **Steps**: 1. Inspect landmark roles
- **Expected**: Dashboard area có role='main' hoặc là trong <main>
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

#### 4.14. StreakMini Week Dots

##### TC_DSL_300: StreakMini renders 7 week dots (T2-CN) trên Dashboard Tier 3
- **Loại**: Positive
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Dashboard đã render, StreakMini component có dữ liệu tuần hiện tại
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống Tier 3
  3. Kiểm tra StreakMini component
- **Kết quả mong đợi**: Hiển thị đúng 7 dots đại diện cho 7 ngày trong tuần (Thứ 2 đến Chủ nhật)
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_301: StreakMini dot màu xanh lá cho ngày đã hoàn thành tập luyện
- **Loại**: Positive
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Có ngày đã hoàn thành workout trong tuần hiện tại
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống StreakMini
  3. Kiểm tra màu dot của ngày đã hoàn thành
- **Kết quả mong đợi**: Dot của ngày đã hoàn thành tập luyện có màu xanh lá (green/success)
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_302: StreakMini dot màu xám cho ngày nghỉ
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: Có ngày nghỉ (rest day) trong lịch tập
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống StreakMini
  3. Kiểm tra màu dot của ngày nghỉ
- **Kết quả mong đợi**: Dot của ngày nghỉ có màu xám (gray/neutral)
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_303: StreakMini dot màu đỏ cho ngày bỏ lỡ
- **Loại**: Negative
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Có ngày đã qua mà user không tập luyện (missed day)
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống StreakMini
  3. Kiểm tra màu dot của ngày bỏ lỡ
- **Kết quả mong đợi**: Dot của ngày bỏ lỡ có màu đỏ (red/danger)
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_304: StreakMini dot màu xanh dương/highlighted cho ngày hôm nay
- **Loại**: Positive
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Dashboard render vào ngày bất kỳ trong tuần
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống StreakMini
  3. Kiểm tra dot đại diện cho ngày hôm nay
- **Kết quả mong đợi**: Dot ngày hôm nay có màu xanh dương/highlighted, nổi bật so với các dot khác
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_305: StreakMini dot màu mặc định cho ngày sắp tới
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: Tuần hiện tại còn ngày chưa đến
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống StreakMini
  3. Kiểm tra dot của các ngày chưa đến
- **Kết quả mong đợi**: Dot ngày sắp tới có màu mặc định (nhạt/outline), chưa có trạng thái
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_306: StreakMini hiển thị số ngày streak hiện tại
- **Loại**: Positive
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: User có streak liên tiếp ≥ 1 ngày (ví dụ: 2 ngày)
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống StreakMini
  3. Kiểm tra số streak hiển thị
- **Kết quả mong đợi**: Hiển thị "2 ngày liên tiếp" (hoặc tương đương), phản ánh đúng số ngày streak hiện tại
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_307: StreakMini hiển thị kỷ lục streak dài nhất
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: User có kỷ lục streak = 5 ngày
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống StreakMini
  3. Kiểm tra hiển thị kỷ lục
- **Kết quả mong đợi**: Hiển thị "Kỷ lục: 5" (hoặc tương đương), phản ánh đúng kỷ lục dài nhất
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_308: StreakMini click chuyển đến Fitness Progress tab
- **Loại**: Positive
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Dashboard đã render, StreakMini hiển thị
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Nhấn vào StreakMini component
  3. Kiểm tra navigation
- **Kết quả mong đợi**: App chuyển đến Fitness Progress tab để xem chi tiết streak
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_309: StreakMini accessible với role="button" và aria-label
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: StreakMini đã render
- **Các bước**:
  1. Inspect StreakMini element
  2. Kiểm tra ARIA attributes
- **Kết quả mong đợi**: StreakMini có role="button" và aria-label mô tả chức năng (ví dụ: "Xem chi tiết streak tập luyện")
- **Kết quả test thực tế**: *(Chưa test)*

#### 4.15. Dashboard ErrorBoundary Recovery

##### TC_DSL_310: Dashboard ErrorBoundary bắt lỗi crash Tier 2 component
- **Loại**: Negative
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Tier 2 component throw runtime error (simulated)
- **Các bước**:
  1. Mô phỏng lỗi runtime trong Tier 2 component (ví dụ: NutritionScore)
  2. Quan sát Dashboard render
- **Kết quả mong đợi**: ErrorBoundary bắt lỗi, Dashboard không crash toàn bộ, hiển thị fallback UI cho Tier 2
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_311: Dashboard ErrorBoundary bắt lỗi crash Tier 3 component
- **Loại**: Negative
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Tier 3 component throw runtime error (simulated)
- **Các bước**:
  1. Mô phỏng lỗi runtime trong Tier 3 component (ví dụ: WeightMini hoặc StreakMini)
  2. Quan sát Dashboard render
- **Kết quả mong đợi**: ErrorBoundary bắt lỗi, Dashboard không crash toàn bộ, hiển thị fallback UI cho Tier 3
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_312: Dashboard ErrorBoundary bắt lỗi crash Tier 4 component
- **Loại**: Negative
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Tier 4 component throw runtime error (simulated)
- **Các bước**:
  1. Mô phỏng lỗi runtime trong Tier 4 component (ví dụ: QuickActions)
  2. Quan sát Dashboard render
- **Kết quả mong đợi**: ErrorBoundary bắt lỗi, Dashboard không crash toàn bộ, hiển thị fallback UI cho Tier 4
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_313: Các tiers khác tiếp tục render khi một tier bị crash
- **Loại**: Positive
- **Độ ưu tiên**: P0
- **Tiền điều kiện**: Tier 3 component bị crash (simulated)
- **Các bước**:
  1. Mô phỏng lỗi crash Tier 3
  2. Kiểm tra Tier 1, Tier 2, Tier 4, Tier 5
- **Kết quả mong đợi**: Tier 1, 2, 4, 5 vẫn render bình thường, chỉ Tier 3 hiển thị fallback UI
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_314: ErrorBoundary hiển thị thông báo lỗi thân thiện (không hiện stack trace)
- **Loại**: Positive
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Một tier component bị crash
- **Các bước**:
  1. Mô phỏng lỗi crash bất kỳ tier nào
  2. Kiểm tra nội dung fallback UI
- **Kết quả mong đợi**: Hiển thị thông báo thân thiện (ví dụ: "Đã xảy ra lỗi, vui lòng thử lại") thay vì stack trace hoặc thông tin kỹ thuật
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_DSL_315: ErrorBoundary error state accessible với role="alert"
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: Một tier component bị crash, fallback UI hiển thị
- **Các bước**:
  1. Mô phỏng lỗi crash
  2. Inspect fallback UI element
  3. Kiểm tra ARIA attributes
- **Kết quả mong đợi**: Fallback UI có role="alert" để screen reader thông báo lỗi tự động cho user
- **Kết quả test thực tế**: *(Chưa test)*

---

## Đề xuất Cải tiến

### Đề xuất 1: Skeleton Loading cho Tiers
- **Vấn đề hiện tại**: Tier 4-5 dùng placeholder trống (min-h-[56px]), user thấy khoảng trống rồi content xuất hiện đột ngột.
- **Giải pháp đề xuất**: Thay placeholder bằng skeleton shimmer (animated gradient) giống design system phổ biến.
- **Lý do chi tiết**: Skeleton loading giảm perceived load time 30-40%. User cảm nhận app responsive hơn. Pattern quen thuộc (Facebook, YouTube).
- **Phần trăm cải thiện**: Perceived performance +35%, User satisfaction +20%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 2: Score Animation khi thay đổi
- **Vấn đề hiện tại**: Score number thay đổi tức thời, user có thể miss sự thay đổi.
- **Giải pháp đề xuất**: Count-up animation từ old → new score (300ms ease-out), kèm subtle pulse effect.
- **Lý do chi tiết**: Animation thu hút attention, tạo cảm giác achievement. Gamification pattern hiệu quả cho health apps.
- **Phần trăm cải thiện**: Engagement +25%, Motivation +30%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 3: Tier Loading Priority dựa trên User Behavior
- **Vấn đề hiện tại**: Tất cả users đều có cùng loading order, bất kể behavior pattern.
- **Giải pháp đề xuất**: Track user interaction frequency per tier → prioritize lazy loading cho tiers user hay dùng nhất.
- **Lý do chi tiết**: Personalized loading cải thiện perceived performance cho power users. A/B testable.
- **Phần trăm cải thiện**: Task completion speed +15%, Repeat usage +10%
- **Mức độ ưu tiên**: Low | **Effort**: L

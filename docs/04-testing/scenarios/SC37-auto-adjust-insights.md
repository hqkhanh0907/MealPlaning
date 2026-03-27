# Scenario 37: Auto-Adjust & AI Insights

**Version:** 1.0  
**Date:** 2026-06-12  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Auto-Adjust & AI Insights là scenario quản lý hai tính năng cốt lõi trên Dashboard: (1) **AutoAdjustBanner** — hiển thị banner cảnh báo khi hệ thống phát hiện cần điều chỉnh calories mục tiêu dựa trên feedback loop 14 ngày (trung bình trượt 7 ngày, ±150 kcal, adherence ≥80%), cho phép user apply hoặc dismiss điều chỉnh; (2) **AdjustmentHistory** — hiển thị lịch sử các lần điều chỉnh (auto/manual) với trạng thái applied/declined, sắp xếp theo ngày giảm dần, hỗ trợ collapse/expand; (3) **AiInsightCard** — hiển thị thẻ gợi ý AI thông minh với 8 loại insight (alert, action, remind, motivate, celebrate, praise, progress, tip) và 5 bảng màu (dark-amber, amber, blue, green, gray), ưu tiên theo thứ tự P1→P8; (4) **useInsightEngine** hook — engine xử lý logic ưu tiên, dismiss persistence qua localStorage, tip of the day xoay vòng từ pool 20 tips với hash deterministic theo ngày.

Scenario bao phủ toàn bộ luồng: từ hiển thị banner điều chỉnh, tương tác apply/dismiss, lịch sử điều chỉnh, engine chọn insight theo priority, quản lý dismissed state, đến xử lý edge cases (dữ liệu hỏng, dismiss hàng loạt, rapid interactions).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| AutoAdjustBanner | `src/features/dashboard/components/AutoAdjustBanner.tsx` | Banner cảnh báo điều chỉnh calories tự động, role="alert" |
| AdjustmentHistory | `src/features/dashboard/components/AdjustmentHistory.tsx` | Danh sách lịch sử các lần điều chỉnh, collapsible |
| AiInsightCard | `src/features/dashboard/components/AiInsightCard.tsx` | Thẻ hiển thị insight AI với icon, màu, action/dismiss |
| useInsightEngine | `src/features/dashboard/hooks/useInsightEngine.ts` | Hook xử lý logic priority P1-P8, dismiss persistence, tip pool |
| useFeedbackLoop | `src/features/dashboard/hooks/useFeedbackLoop.ts` | Hook đánh giá dữ liệu 14 ngày, đề xuất Adjustment ±150 kcal |
| useTranslation | `react-i18next` | Hook i18n cho đa ngôn ngữ |
| localStorage | Web API | Lưu trữ dismissed insight IDs (key: `mp-insight-dismissed`) |

## Luồng nghiệp vụ

1. Hệ thống thu thập dữ liệu cân nặng 14 ngày → tính trung bình trượt 7 ngày (moving average) → so sánh với ngưỡng weightChangeThreshold (0.2kg)
2. Nếu phát hiện xu hướng tăng/giảm cân bất thường → tạo Adjustment object với reason (increasing/decreasing/stalled), oldTargetCal, newTargetCal (±150 kcal)
3. AutoAdjustBanner hiển thị với nội dung tương ứng: bodyGaining (tăng cân), bodyLosing (giảm cân), bodyStalled (trì trệ)
4. User nhấn "Áp dụng" → onApply() được gọi → cập nhật target calories mới → ghi nhận AdjustmentRecord với applied=true
5. User nhấn "Bỏ qua" → onDismiss() được gọi → ghi nhận AdjustmentRecord với applied=false
6. AdjustmentHistory hiển thị tất cả records, sắp xếp theo ngày mới nhất, toggle collapse/expand
7. useInsightEngine kiểm tra 7 generators P1→P7 theo thứ tự, trả về insight đầu tiên non-null và non-dismissed
8. Nếu tất cả P1-P7 đều null hoặc dismissed → fallback P8: Tip of the Day từ pool 20 tips, hash deterministic theo ngày
9. User dismiss insight → ID thêm vào localStorage → engine chọn insight tiếp theo theo priority
10. Insight có autoDismissHours (P4-P7: 24h) → tự động biến mất sau thời gian quy định

## Quy tắc nghiệp vụ

1. AUTO_ADJUST_CONFIG: evaluationPeriodDays=14, minWeightEntries=10, weightChangeThreshold=0.2, calorieAdjustment=150, maxDeficit=1000, minCalories=1200, maxSurplus=700
2. Banner bodyKey: reason chứa "increasing" → bodyGaining, chứa "decreasing" → bodyLosing, còn lại → bodyStalled
3. isDecrease = newTargetCal < oldTargetCal; currentDelta = newTargetCal - oldTargetCal
4. prevAvgDisplay = movingAvgWeight + (currentDelta > 0 ? -0.2 : 0.2) — hiển thị xu hướng trước đó
5. AdjustmentHistory mặc định collapsed (defaultCollapsed=true), sort by date descending
6. Date format: vi-VN locale (DD/MM/YYYY)
7. triggerType: 'auto' | 'manual' → hiển thị badge tương ứng
8. Applied → CheckCircle (emerald); Not applied → XCircle (gray)
9. TrendingUp (emerald) nếu newTargetCal > oldTargetCal; TrendingDown (red) ngược lại
10. Insight priority: P1 (alert, dark-amber) → P2 (action, amber) → P3 (remind, amber) → P4 (motivate, blue) → P5 (celebrate, blue) → P6 (praise, green) → P7 (progress, green) → P8 (tip, gray)
11. P1 (auto-adjust): hasAutoAdjustment=true → non-dismissable alert
12. P2 (low protein): proteinRatio < 0.7 AND isAfterEvening → dismissable action
13. P3 (weight log): daysSinceWeightLog >= 3 → dismissable remind
14. P4 (streak): currentStreak < longestStreak AND gap ≤ 2 → autoDismiss 24h
15. P5 (PR today): hasPRToday → autoDismiss 24h
16. P6 (adherence): weeklyAdherence >= 85 → autoDismiss 24h
17. P7 (weight trend): weightTrendCorrect AND weightTrendWeeks >= 2 → autoDismiss 24h
18. P8 (tip): hashDateToIndex deterministic, pool 20 tips, fallback nếu all tips dismissed
19. Dismissed IDs: localStorage key 'mp-insight-dismissed', parse JSON, return [] on error
20. AiInsightCard: role="region", aria-label="{emoji} {title}", empty state → aria-hidden="true"
21. ICON_MAP: alert→AlertTriangle, action→Beef, remind→Scale, motivate→Flame, celebrate→Trophy, praise→CheckCircle, progress→TrendingUp, tip→Lightbulb
22. ICON_PREFIX_MAP: alert→⚠️, action→🥩, remind→⚖️, motivate→🔥, celebrate→🏆, praise→✅, progress→📈, tip→💡
23. COLOR_MAP: 5 color schemes (dark-amber, amber, blue, green, gray), mỗi scheme có 7 thuộc tính (bg, border, icon, title, message, action, dismiss)

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_AAI_01 | Hiển thị banner khi có auto adjustment (reason: increasing) | Positive | P0 |
| TC_AAI_02 | Hiển thị banner khi có auto adjustment (reason: decreasing) | Positive | P0 |
| TC_AAI_03 | Hiển thị banner khi có auto adjustment (reason: stalled) | Positive | P0 |
| TC_AAI_04 | Banner role="alert" và aria-label chính xác | Positive | P1 |
| TC_AAI_05 | Banner icon AlertTriangle có aria-hidden="true" | Positive | P1 |
| TC_AAI_06 | Nhấn nút "Áp dụng" gọi onApply callback | Positive | P0 |
| TC_AAI_07 | Nhấn nút "Bỏ qua" gọi onDismiss callback | Positive | P0 |
| TC_AAI_08 | Hiển thị chính xác currentDelta và direction cho tăng calories | Positive | P1 |
| TC_AAI_09 | Hiển thị chính xác currentDelta và direction cho giảm calories | Positive | P1 |
| TC_AAI_10 | prevAvgDisplay tính đúng với offset +0.2 khi giảm | Boundary | P1 |
| TC_AAI_11 | prevAvgDisplay tính đúng với offset -0.2 khi tăng | Boundary | P1 |
| TC_AAI_12 | Container styling: bg-amber-950 p-4 rounded-lg | Positive | P2 |
| TC_AAI_13 | Apply button styling: px-3 py-1.5 bg-white text-amber-950 | Positive | P2 |
| TC_AAI_14 | Dismiss button styling: border border-white/30 text-white/80 | Positive | P2 |
| TC_AAI_15 | AdjustmentHistory mặc định collapsed | Positive | P0 |
| TC_AAI_16 | Toggle expand AdjustmentHistory | Positive | P0 |
| TC_AAI_17 | Toggle collapse lại AdjustmentHistory | Positive | P1 |
| TC_AAI_18 | aria-expanded cập nhật đúng khi toggle | Positive | P1 |
| TC_AAI_19 | Chevron icon thay đổi khi toggle (Down↔Up) | Positive | P2 |
| TC_AAI_20 | Hiển thị empty state khi không có records | Positive | P1 |
| TC_AAI_21 | Sắp xếp records theo ngày giảm dần | Positive | P1 |
| TC_AAI_22 | Format ngày vi-VN (DD/MM/YYYY) | Positive | P1 |
| TC_AAI_23 | Badge triggerType: "auto" hiển thị đúng | Positive | P1 |
| TC_AAI_24 | Badge triggerType: "manual" hiển thị đúng | Positive | P1 |
| TC_AAI_25 | Applied record: CheckCircle emerald + label "Đã áp dụng" | Positive | P1 |
| TC_AAI_26 | Declined record: XCircle gray + label "Đã bỏ qua" | Positive | P1 |
| TC_AAI_27 | TrendingUp icon khi newTargetCal > oldTargetCal | Positive | P1 |
| TC_AAI_28 | TrendingDown icon khi newTargetCal < oldTargetCal | Positive | P1 |
| TC_AAI_29 | Insight P1: alert non-dismissable khi hasAutoAdjustment=true | Positive | P0 |
| TC_AAI_30 | Insight P2: action khi proteinRatio < 0.7 AND isAfterEvening | Positive | P1 |
| TC_AAI_31 | Insight P3: remind khi daysSinceWeightLog >= 3 | Positive | P1 |
| TC_AAI_32 | Insight P4: motivate khi streak gap ≤ 2 | Positive | P1 |
| TC_AAI_33 | Insight P5: celebrate khi hasPRToday=true | Positive | P1 |
| TC_AAI_34 | Insight P6: praise khi weeklyAdherence >= 85 | Positive | P1 |
| TC_AAI_35 | Insight P7: progress khi weightTrendCorrect AND weeks >= 2 | Positive | P1 |
| TC_AAI_36 | Insight P8: tip of the day fallback | Positive | P1 |
| TC_AAI_37 | Priority ordering: P1 override P2-P8 | Positive | P0 |
| TC_AAI_38 | Priority ordering: P2 hiển thị khi P1 null | Positive | P1 |
| TC_AAI_39 | AiInsightCard empty state: aria-hidden="true" | Positive | P2 |
| TC_AAI_40 | AiInsightCard role="region" với aria-label chính xác | Positive | P1 |
| TC_AAI_41 | Action button chỉ hiển thị khi actionLabel tồn tại | Positive | P1 |
| TC_AAI_42 | Dismiss button chỉ hiển thị khi dismissable=true | Positive | P1 |
| TC_AAI_43 | P2 không trigger khi proteinRatio >= 0.7 | Negative | P1 |
| TC_AAI_44 | P2 không trigger khi isAfterEvening=false | Negative | P1 |
| TC_AAI_45 | P3 không trigger khi daysSinceWeightLog < 3 | Negative | P1 |
| TC_AAI_46 | P4 không trigger khi streak gap > 2 | Negative | P1 |
| TC_AAI_47 | localStorage corrupt JSON → dismissed trả về [] | Negative | P1 |
| TC_AAI_48 | localStorage key không tồn tại → dismissed trả về [] | Negative | P2 |
| TC_AAI_49 | Dismiss tất cả P1-P7 → hiển thị P8 tip | Edge | P1 |
| TC_AAI_50 | Dismiss tất cả 20 tips → fallback tip đầu tiên theo hash | Edge | P1 |
| TC_AAI_51 | hashDateToIndex deterministic: cùng ngày → cùng tip | Boundary | P1 |
| TC_AAI_52 | hashDateToIndex: ngày khác nhau → tip khác nhau | Boundary | P2 |
| TC_AAI_53 | Rapid dismiss 10 insights liên tiếp → state nhất quán | Edge | P2 |
| TC_AAI_54 | Nhiều pending adjustments + insights cùng lúc | Edge | P2 |
| TC_AAI_55 | 5 color schemes render đúng cấu hình (bg, border, icon, title, message, action, dismiss) | Boundary | P1 |
| TC_AAI_56 | Banner ẩn khi adjustment=null (không truyền props) | Negative | P0 |
| TC_AAI_57 | Banner ẩn khi adjustment=undefined | Negative | P1 |
| TC_AAI_58 | Banner hiển thị chính xác oldTargetCal trong body text | Positive | P0 |
| TC_AAI_59 | Banner hiển thị chính xác newTargetCal trong body text | Positive | P0 |
| TC_AAI_60 | Banner hiển thị đúng calorieAdjustment amount = 150 kcal | Positive | P1 |
| TC_AAI_61 | Apply button gọi onApply callback chính xác 1 lần khi click | Positive | P0 |
| TC_AAI_62 | Dismiss button gọi onDismiss callback chính xác 1 lần khi click | Positive | P0 |
| TC_AAI_63 | Double-click apply chỉ gọi callback 1 lần (debounce) | Edge | P1 |
| TC_AAI_64 | Double-click dismiss chỉ gọi callback 1 lần (debounce) | Edge | P1 |
| TC_AAI_65 | Banner re-render khi adjustment props thay đổi từ increasing → decreasing | Positive | P1 |
| TC_AAI_66 | Banner re-render khi adjustment props thay đổi từ stalled → increasing | Positive | P1 |
| TC_AAI_67 | Banner hiển thị movingAvgWeight với 1 decimal (ví dụ: 75.5) | Positive | P1 |
| TC_AAI_68 | prevAvgDisplay = 75.7 khi movingAvg=75.5, currentDelta < 0 (offset +0.2) | Boundary | P0 |
| TC_AAI_69 | prevAvgDisplay = 68.0 khi movingAvg=68.2, currentDelta > 0 (offset -0.2) | Boundary | P0 |
| TC_AAI_70 | prevAvgDisplay khi currentDelta = 0 (stalled case) | Boundary | P1 |
| TC_AAI_71 | Banner title sử dụng đúng i18n key adjustBanner.title | Positive | P1 |
| TC_AAI_72 | bodyKey = adjustBanner.bodyGaining khi reason chứa 'increasing fast' | Positive | P1 |
| TC_AAI_73 | bodyKey = adjustBanner.bodyLosing khi reason chứa 'decreasing slowly' | Positive | P1 |
| TC_AAI_74 | bodyKey = adjustBanner.bodyStalled khi reason = 'plateau detected' | Positive | P1 |
| TC_AAI_75 | Banner data-testid='auto-adjust-banner' tồn tại | Positive | P1 |
| TC_AAI_76 | Apply button có data-testid='apply-btn' | Positive | P2 |
| TC_AAI_77 | Dismiss button có data-testid='dismiss-btn' | Positive | P2 |
| TC_AAI_78 | Banner direction text = 'tăng' khi newTargetCal > oldTargetCal | Positive | P0 |
| TC_AAI_79 | Banner direction text = 'giảm' khi newTargetCal < oldTargetCal | Positive | P0 |
| TC_AAI_80 | Banner với oldTargetCal=1200 (minCalories boundary) hiển thị đúng | Boundary | P1 |
| TC_AAI_81 | History render empty state khi adjustments=[] (mảng rỗng) | Negative | P0 |
| TC_AAI_82 | History render đúng khi adjustments có 1 item duy nhất | Positive | P0 |
| TC_AAI_83 | History render đúng khi adjustments có 5 items | Positive | P1 |
| TC_AAI_84 | History render đúng khi adjustments có 20 items | Positive | P1 |
| TC_AAI_85 | History mặc định collapsed khi defaultCollapsed=true | Positive | P0 |
| TC_AAI_86 | History mặc định expanded khi defaultCollapsed=false | Positive | P0 |
| TC_AAI_87 | Click toggle button: collapsed → expanded hiển thị danh sách | Positive | P0 |
| TC_AAI_88 | Click toggle button: expanded → collapsed ẩn danh sách | Positive | P0 |
| TC_AAI_89 | aria-expanded='false' khi History đang collapsed | Positive | P1 |
| TC_AAI_90 | aria-expanded='true' khi History đang expanded | Positive | P1 |
| TC_AAI_91 | Sort: adjustment mới nhất (2026-06-12) hiển thị ở vị trí đầu tiên | Positive | P0 |
| TC_AAI_92 | Sort: adjustment cũ nhất hiển thị ở vị trí cuối cùng | Positive | P1 |
| TC_AAI_93 | Sort: 5 items sắp xếp đúng thứ tự ngày giảm dần | Positive | P0 |
| TC_AAI_94 | Date format vi-VN: '12/06/2026' cho ngày 2026-06-12 | Positive | P1 |
| TC_AAI_95 | Date format vi-VN: '01/01/2025' cho ngày 2025-01-01 | Boundary | P1 |
| TC_AAI_96 | Applied=true → icon CheckCircle (emerald) hiển thị | Positive | P0 |
| TC_AAI_97 | Applied=false → icon XCircle (gray) hiển thị | Positive | P0 |
| TC_AAI_98 | Applied=true → text có class màu emerald | Positive | P1 |
| TC_AAI_99 | Applied=false → text có class màu gray | Positive | P1 |
| TC_AAI_100 | TrendingUp icon hiển thị khi newTargetCal > oldTargetCal | Positive | P1 |
| TC_AAI_101 | TrendingDown icon hiển thị khi newTargetCal < oldTargetCal | Positive | P1 |
| TC_AAI_102 | triggerType='auto' → hiển thị badge 'Tự động' | Positive | P0 |
| TC_AAI_103 | triggerType='manual' → hiển thị badge 'Thủ công' | Positive | P0 |
| TC_AAI_104 | Hiển thị text '2000 → 1850 kcal' khi oldTarget=2000, newTarget=1850 | Positive | P0 |
| TC_AAI_105 | Hiển thị reason text chính xác trong mỗi adjustment record | Positive | P1 |
| TC_AAI_106 | History container có đúng aria-label từ i18n key adjustmentHistory.ariaLabel | Positive | P1 |
| TC_AAI_107 | aria-hidden='true' trên icon CheckCircle trong history items | Positive | P1 |
| TC_AAI_108 | aria-hidden='true' trên icon XCircle trong history items | Positive | P1 |
| TC_AAI_109 | aria-hidden='true' trên icon TrendingUp/TrendingDown | Positive | P1 |
| TC_AAI_110 | aria-hidden='true' trên icon ChevronUp/ChevronDown toggle | Positive | P1 |
| TC_AAI_111 | History hiển thị đúng khi tất cả items đều applied=true | Positive | P1 |
| TC_AAI_112 | History hiển thị đúng khi tất cả items đều applied=false | Positive | P1 |
| TC_AAI_113 | History hiển thị mix items: 3 applied + 2 declined | Positive | P1 |
| TC_AAI_114 | History hiển thị đúng khi cùng ngày có 2 adjustments | Boundary | P2 |
| TC_AAI_115 | History toggle nhanh 5 lần liên tiếp → state nhất quán | Edge | P2 |
| TC_AAI_116 | P1 alert insight: icon AlertTriangle render đúng | Positive | P0 |
| TC_AAI_117 | P1 alert insight: emoji prefix ⚠️ trong aria-label | Positive | P1 |
| TC_AAI_118 | P1 alert insight: color scheme dark-amber áp dụng đúng | Positive | P0 |
| TC_AAI_119 | P1 alert insight: nút dismiss KHÔNG render (non-dismissable) | Positive | P0 |
| TC_AAI_120 | P2 action insight: icon Beef render đúng | Positive | P1 |
| TC_AAI_121 | P2 action insight: emoji prefix 🥩 trong aria-label | Positive | P1 |
| TC_AAI_122 | P2 action insight: color scheme amber áp dụng đúng | Positive | P1 |
| TC_AAI_123 | P2 action insight: nút dismiss render (dismissable) | Positive | P1 |
| TC_AAI_124 | P3 remind insight: icon Scale render đúng | Positive | P1 |
| TC_AAI_125 | P3 remind insight: emoji prefix ⚖️ trong aria-label | Positive | P1 |
| TC_AAI_126 | P3 remind insight: color scheme amber áp dụng đúng | Positive | P1 |
| TC_AAI_127 | P3 remind insight: nút dismiss render (dismissable) | Positive | P1 |
| TC_AAI_128 | P4 motivate insight: icon Flame render đúng | Positive | P1 |
| TC_AAI_129 | P4 motivate insight: emoji prefix 🔥 trong aria-label | Positive | P1 |
| TC_AAI_130 | P4 motivate insight: color scheme blue áp dụng đúng | Positive | P1 |
| TC_AAI_131 | P4 motivate insight: autoDismissHours = 24 | Positive | P1 |
| TC_AAI_132 | P5 celebrate insight: icon Trophy render đúng | Positive | P1 |
| TC_AAI_133 | P5 celebrate insight: emoji prefix 🏆 trong aria-label | Positive | P1 |
| TC_AAI_134 | P5 celebrate insight: color scheme blue áp dụng đúng | Positive | P1 |
| TC_AAI_135 | P5 celebrate insight: autoDismissHours = 24 | Positive | P1 |
| TC_AAI_136 | P6 praise insight: icon CheckCircle render đúng | Positive | P1 |
| TC_AAI_137 | P6 praise insight: emoji prefix ✅ trong aria-label | Positive | P1 |
| TC_AAI_138 | P6 praise insight: color scheme green áp dụng đúng | Positive | P1 |
| TC_AAI_139 | P6 praise insight: autoDismissHours = 24 | Positive | P1 |
| TC_AAI_140 | P7 progress insight: icon TrendingUp render đúng | Positive | P1 |
| TC_AAI_141 | P7 progress insight: emoji prefix 📈 trong aria-label | Positive | P1 |
| TC_AAI_142 | P7 progress insight: color scheme green áp dụng đúng | Positive | P1 |
| TC_AAI_143 | P7 progress insight: autoDismissHours = 24 | Positive | P1 |
| TC_AAI_144 | P8 tip insight: icon Lightbulb render đúng | Positive | P1 |
| TC_AAI_145 | P8 tip insight: emoji prefix 💡 trong aria-label | Positive | P1 |
| TC_AAI_146 | P8 tip insight: color scheme gray áp dụng đúng | Positive | P1 |
| TC_AAI_147 | P8 tip insight: dismissable = true | Positive | P1 |
| TC_AAI_148 | Insight card có role='region' | Positive | P0 |
| TC_AAI_149 | Insight card aria-label format = '{emoji} {title}' | Positive | P0 |
| TC_AAI_150 | Empty state: không có insight → render empty div | Negative | P0 |
| TC_AAI_151 | Insight action button hiển thị khi actionLabel tồn tại | Positive | P1 |
| TC_AAI_152 | Insight action button ẩn khi không có actionLabel | Negative | P1 |
| TC_AAI_153 | Action button type='navigate' → trigger navigation | Positive | P1 |
| TC_AAI_154 | Action button type='dismiss' → dismiss insight | Positive | P1 |
| TC_AAI_155 | Dismiss button có aria-label từ i18n key insightCard.dismiss | Positive | P1 |
| TC_AAI_156 | dark-amber: bg class = 'bg-amber-900/10' | Positive | P1 |
| TC_AAI_157 | dark-amber: border class = 'border-amber-800' | Positive | P1 |
| TC_AAI_158 | dark-amber: icon class = 'text-amber-800' | Positive | P2 |
| TC_AAI_159 | dark-amber: title class = 'text-amber-900' | Positive | P2 |
| TC_AAI_160 | dark-amber: message class = 'text-amber-800' | Positive | P2 |
| TC_AAI_161 | amber: bg class = 'bg-amber-50' | Positive | P1 |
| TC_AAI_162 | amber: border class = 'border-amber-500' | Positive | P1 |
| TC_AAI_163 | amber: icon class = 'text-amber-600' | Positive | P2 |
| TC_AAI_164 | blue: bg class = 'bg-blue-50' | Positive | P1 |
| TC_AAI_165 | blue: border class = 'border-blue-500' | Positive | P1 |
| TC_AAI_166 | blue: icon class = 'text-blue-600' | Positive | P2 |
| TC_AAI_167 | green: bg class = 'bg-emerald-50' | Positive | P1 |
| TC_AAI_168 | green: border class = 'border-emerald-500' | Positive | P1 |
| TC_AAI_169 | gray: bg class = 'bg-slate-50' | Positive | P1 |
| TC_AAI_170 | gray: border class = 'border-slate-400' | Positive | P1 |
| TC_AAI_171 | Dismiss insight → ID thêm vào dismissedIds trong state | Positive | P0 |
| TC_AAI_172 | Dismiss insight → persistDismissedIds ghi vào localStorage | Positive | P0 |
| TC_AAI_173 | Dismiss P2 → engine chọn P3 hiển thị tiếp theo | Positive | P0 |
| TC_AAI_174 | Dismiss P2 + P3 → engine chọn P4 hiển thị tiếp | Positive | P1 |
| TC_AAI_175 | Dismiss tất cả P1-P7 → P8 tip of the day hiển thị | Positive | P0 |
| TC_AAI_176 | Dismiss P8 tip → tip tiếp theo trong pool hiển thị | Positive | P1 |
| TC_AAI_177 | Dismiss tất cả 20 tips → fallback tip hiển thị (quay vòng) | Boundary | P2 |
| TC_AAI_178 | localStorage corrupt (invalid JSON mp-insight-dismissed) → dismissedIds = [] | Negative | P0 |
| TC_AAI_179 | localStorage rỗng (key không tồn tại) → dismissedIds = [] | Negative | P1 |
| TC_AAI_180 | localStorage có 3 dismissed IDs → load đúng vào state khi mount | Positive | P0 |
| TC_AAI_181 | Dismiss persist qua page reload: dismissed insights vẫn dismissed | Positive | P0 |
| TC_AAI_182 | Dismiss persist qua component unmount/remount | Positive | P1 |
| TC_AAI_183 | autoDismiss 24h: P4 insight biến mất sau 24h kể từ lần hiển thị | Positive | P1 |
| TC_AAI_184 | autoDismiss 24h: P5 insight vẫn hiển thị trước khi hết 24h | Positive | P1 |
| TC_AAI_185 | autoDismiss 24h: P6 insight biến mất đúng sau 24h | Positive | P1 |
| TC_AAI_186 | autoDismiss 24h: P7 insight biến mất đúng sau 24h | Positive | P1 |
| TC_AAI_187 | Non-dismissable P1: nút dismiss KHÔNG render trong DOM | Positive | P0 |
| TC_AAI_188 | Dismissable insight: nút dismiss RENDER trong DOM | Positive | P1 |
| TC_AAI_189 | Action button label hiển thị đúng text từ actionLabel prop | Positive | P1 |
| TC_AAI_190 | Dismiss button aria-label = t('insightCard.dismiss') | Positive | P1 |
| TC_AAI_191 | selectInsight: hasAutoAdjustment=true → trả về P1 (priority cao nhất) | Positive | P0 |
| TC_AAI_192 | selectInsight: proteinRatio=0.5, isAfterEvening=true → P2 trigger | Positive | P0 |
| TC_AAI_193 | selectInsight: proteinRatio=0.7 (boundary) → P2 KHÔNG trigger | Boundary | P0 |
| TC_AAI_194 | selectInsight: proteinRatio=0.69 → P2 trigger | Boundary | P1 |
| TC_AAI_195 | selectInsight: proteinRatio=0.5, isAfterEvening=false → P2 KHÔNG trigger | Negative | P1 |
| TC_AAI_196 | selectInsight: daysSinceWeightLog=3 (boundary) → P3 trigger | Boundary | P0 |
| TC_AAI_197 | selectInsight: daysSinceWeightLog=7 → P3 trigger | Positive | P1 |
| TC_AAI_198 | selectInsight: daysSinceWeightLog=2 → P3 KHÔNG trigger | Boundary | P1 |
| TC_AAI_199 | selectInsight: currentStreak=8, longestStreak=10 (gap=2) → P4 trigger | Boundary | P0 |
| TC_AAI_200 | selectInsight: currentStreak=9, longestStreak=10 (gap=1) → P4 trigger | Positive | P1 |
| TC_AAI_201 | selectInsight: currentStreak=7, longestStreak=10 (gap=3) → P4 KHÔNG trigger | Boundary | P1 |
| TC_AAI_202 | selectInsight: hasPRToday=true → P5 trigger | Positive | P0 |
| TC_AAI_203 | selectInsight: hasPRToday=false → P5 KHÔNG trigger | Negative | P1 |
| TC_AAI_204 | selectInsight: weeklyAdherence=85 (boundary) → P6 trigger | Boundary | P0 |
| TC_AAI_205 | selectInsight: weeklyAdherence=100 → P6 trigger | Positive | P1 |
| TC_AAI_206 | selectInsight: weeklyAdherence=84 → P6 KHÔNG trigger | Boundary | P1 |
| TC_AAI_207 | selectInsight: weightTrendCorrect=true, weeks=2 → P7 trigger | Boundary | P0 |
| TC_AAI_208 | selectInsight: weightTrendCorrect=true, weeks=5 → P7 trigger | Positive | P1 |
| TC_AAI_209 | selectInsight: weightTrendCorrect=true, weeks=1 → P7 KHÔNG trigger | Boundary | P1 |
| TC_AAI_210 | selectInsight: weightTrendCorrect=false, weeks=3 → P7 KHÔNG trigger | Negative | P1 |

---

## Chi tiết Test Cases

##### TC_AAI_01: Hiển thị banner khi có auto adjustment (reason: increasing)
- **Pre-conditions**: Có Adjustment object với reason chứa "increasing", oldTargetCal=2000, newTargetCal=1850, movingAvgWeight=75.5
- **Steps**:
  1. Render AutoAdjustBanner với adjustment={reason: "Weight is increasing", oldTargetCal: 2000, newTargetCal: 1850, triggerType: 'auto', movingAvgWeight: 75.5}
  2. Kiểm tra data-testid="auto-adjust-banner" hiển thị
  3. Kiểm tra data-testid="banner-title" hiển thị tiêu đề từ i18n key `adjustBanner.title`
  4. Kiểm tra data-testid="banner-body" chứa nội dung từ i18n key `adjustBanner.bodyGaining`
- **Expected**: Banner hiển thị với bodyKey = "adjustBanner.bodyGaining", hiển thị thông tin prevAvg (75.7 = 75.5 + 0.2 vì currentDelta < 0), currAvg (75.5), direction "giảm", amount "150"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_02: Hiển thị banner khi có auto adjustment (reason: decreasing)
- **Pre-conditions**: Có Adjustment object với reason chứa "decreasing", oldTargetCal=1800, newTargetCal=1950, movingAvgWeight=68.2
- **Steps**:
  1. Render AutoAdjustBanner với adjustment={reason: "Weight is decreasing too fast", oldTargetCal: 1800, newTargetCal: 1950, triggerType: 'auto', movingAvgWeight: 68.2}
  2. Kiểm tra data-testid="banner-body" chứa nội dung từ i18n key `adjustBanner.bodyLosing`
  3. Xác nhận isDecrease = false (1950 > 1800)
  4. Xác nhận currentDelta = 150 (1950 - 1800)
- **Expected**: Banner hiển thị bodyKey = "adjustBanner.bodyLosing", prevAvg = 68.4 (68.2 + (-0.2)... thực tế 68.2 + (-0.2) không đúng → currentDelta > 0 nên offset = -0.2 → prevAvg = 68.2 - 0.2 = 68.0), currAvg = 68.2, direction "tăng", amount "150"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_03: Hiển thị banner khi có auto adjustment (reason: stalled)
- **Pre-conditions**: Có Adjustment object với reason = "Weight stalled for 2 weeks", oldTargetCal=2100, newTargetCal=1950, movingAvgWeight=80.0
- **Steps**:
  1. Render AutoAdjustBanner với adjustment={reason: "Weight stalled for 2 weeks", oldTargetCal: 2100, newTargetCal: 1950, triggerType: 'auto', movingAvgWeight: 80.0}
  2. Kiểm tra reason không chứa "increasing" cũng không chứa "decreasing"
  3. Kiểm tra data-testid="banner-body" chứa nội dung từ i18n key `adjustBanner.bodyStalled`
- **Expected**: Banner hiển thị bodyKey = "adjustBanner.bodyStalled" (fallback), isDecrease = true, prevAvg = 80.2 (80.0 + 0.2 vì currentDelta = -150 < 0), currAvg = 80.0
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_04: Banner role="alert" và aria-label chính xác
- **Pre-conditions**: AutoAdjustBanner đã render với adjustment hợp lệ
- **Steps**:
  1. Kiểm tra element data-testid="auto-adjust-banner" có attribute role="alert"
  2. Kiểm tra element có attribute aria-label chứa giá trị từ i18n key `adjustBanner.ariaLabel`
- **Expected**: role="alert" present trên container div, aria-label có giá trị đúng từ translation — đảm bảo screen reader đọc được cảnh báo
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_05: Banner icon AlertTriangle có aria-hidden="true"
- **Pre-conditions**: AutoAdjustBanner đã render
- **Steps**:
  1. Tìm element data-testid="banner-icon" (AlertTriangle icon)
  2. Kiểm tra attribute aria-hidden
- **Expected**: AlertTriangle icon có aria-hidden="true" — icon decorative, không cần screen reader đọc
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_06: Nhấn nút "Áp dụng" gọi onApply callback
- **Pre-conditions**: AutoAdjustBanner render với onApply=vi.fn(), adjustment hợp lệ
- **Steps**:
  1. Tìm button data-testid="banner-apply-btn"
  2. Click button
  3. Kiểm tra onApply đã được gọi
- **Expected**: onApply callback được gọi đúng 1 lần, không có tham số. Button có text từ i18n key `adjustBanner.apply`
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_07: Nhấn nút "Bỏ qua" gọi onDismiss callback
- **Pre-conditions**: AutoAdjustBanner render với onDismiss=vi.fn(), adjustment hợp lệ
- **Steps**:
  1. Tìm button data-testid="banner-dismiss-btn"
  2. Click button
  3. Kiểm tra onDismiss đã được gọi
- **Expected**: onDismiss callback được gọi đúng 1 lần, không có tham số. Button có text từ i18n key `adjustBanner.dismiss`
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_08: Hiển thị chính xác currentDelta và direction cho tăng calories
- **Pre-conditions**: adjustment={oldTargetCal: 1800, newTargetCal: 1950, reason: "decreasing", movingAvgWeight: 70.0}
- **Steps**:
  1. Render AutoAdjustBanner
  2. Tính toán: isDecrease = false (1950 > 1800), currentDelta = 150
  3. Kiểm tra direction hiển thị "tăng" (từ i18n key `adjustBanner.directionIncrease`)
  4. Kiểm tra banner body chứa amount "150"
- **Expected**: direction = t('adjustBanner.directionIncrease'), amount = "150", body text interpolation chính xác với các giá trị prevAvg, currAvg, direction, amount
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_09: Hiển thị chính xác currentDelta và direction cho giảm calories
- **Pre-conditions**: adjustment={oldTargetCal: 2200, newTargetCal: 2050, reason: "increasing", movingAvgWeight: 82.3}
- **Steps**:
  1. Render AutoAdjustBanner
  2. Tính toán: isDecrease = true (2050 < 2200), currentDelta = -150
  3. Kiểm tra direction hiển thị "giảm" (từ i18n key `adjustBanner.directionDecrease`)
- **Expected**: direction = t('adjustBanner.directionDecrease'), amount = "150" (từ AUTO_ADJUST_CONFIG.calorieAdjustment), body text chính xác
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_10: prevAvgDisplay tính đúng với offset +0.2 khi giảm calories
- **Pre-conditions**: adjustment={oldTargetCal: 2000, newTargetCal: 1850, movingAvgWeight: 75.5, reason: "increasing"}
- **Steps**:
  1. Tính currentDelta = 1850 - 2000 = -150 (< 0)
  2. Áp dụng công thức: prevAvgDisplay = (75.5 + 0.2).toFixed(1)
  3. Kiểm tra banner body chứa prevAvg = "75.7"
- **Expected**: prevAvgDisplay = "75.7" — offset +0.2 khi currentDelta ≤ 0, thể hiện cân nặng trước đó cao hơn hiện tại (đang tăng cân)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_11: prevAvgDisplay tính đúng với offset -0.2 khi tăng calories
- **Pre-conditions**: adjustment={oldTargetCal: 1800, newTargetCal: 1950, movingAvgWeight: 68.0, reason: "decreasing"}
- **Steps**:
  1. Tính currentDelta = 1950 - 1800 = 150 (> 0)
  2. Áp dụng công thức: prevAvgDisplay = (68.0 + (-0.2)).toFixed(1) = (67.8).toFixed(1)
  3. Kiểm tra banner body chứa prevAvg = "67.8"
- **Expected**: prevAvgDisplay = "67.8" — offset -0.2 khi currentDelta > 0, thể hiện cân nặng trước đó thấp hơn (đang giảm quá nhanh)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_12: Container styling: bg-amber-950 p-4 rounded-lg
- **Pre-conditions**: AutoAdjustBanner render với adjustment hợp lệ
- **Steps**:
  1. Kiểm tra container div data-testid="auto-adjust-banner"
  2. Kiểm tra className chứa "rounded-lg bg-amber-950 p-4"
  3. Kiểm tra inline style backgroundColor = '#92400e'
- **Expected**: Container có đúng classes Tailwind và inline style backgroundColor '#92400e' — đảm bảo visual consistency
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_13: Apply button styling: px-3 py-1.5 bg-white text-amber-950
- **Pre-conditions**: AutoAdjustBanner render
- **Steps**:
  1. Tìm button data-testid="banner-apply-btn"
  2. Kiểm tra className chứa "px-3 py-1.5" và "bg-white text-amber-950"
- **Expected**: Apply button có classes: px-3, py-1.5, text-xs, font-semibold, rounded, bg-white, text-amber-950, hover:bg-white/90, transition-colors
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_14: Dismiss button styling: border border-white/30 text-white/80
- **Pre-conditions**: AutoAdjustBanner render
- **Steps**:
  1. Tìm button data-testid="banner-dismiss-btn"
  2. Kiểm tra className chứa "text-white/80" và "border-white/30"
- **Expected**: Dismiss button có classes: px-3, py-1.5, text-xs, font-semibold, rounded, text-white/80, border, border-white/30, hover:text-white, hover:border-white/50, transition-colors
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_15: AdjustmentHistory mặc định collapsed
- **Pre-conditions**: Render AdjustmentHistory với adjustments=[1 record], không truyền defaultCollapsed
- **Steps**:
  1. Render component
  2. Kiểm tra data-testid="adjustment-history-list" không tồn tại trong DOM
  3. Kiểm tra toggle button có aria-expanded="false"
- **Expected**: defaultCollapsed=true (default), danh sách records bị ẩn, aria-expanded="false" trên toggle button, chỉ hiển thị header
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_16: Toggle expand AdjustmentHistory
- **Pre-conditions**: AdjustmentHistory render với defaultCollapsed=true, adjustments=[2 records]
- **Steps**:
  1. Tìm button data-testid="adjustment-history-toggle"
  2. Click button
  3. Kiểm tra data-testid="adjustment-history-list" xuất hiện
  4. Kiểm tra aria-expanded trên toggle button
- **Expected**: Sau click, collapsed=false → danh sách records hiển thị, aria-expanded="true", icon chuyển từ ChevronDown sang ChevronUp
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_17: Toggle collapse lại AdjustmentHistory
- **Pre-conditions**: AdjustmentHistory đang ở trạng thái expanded (collapsed=false)
- **Steps**:
  1. Click toggle button lần nữa
  2. Kiểm tra data-testid="adjustment-history-list" biến mất khỏi DOM
  3. Kiểm tra aria-expanded="false"
- **Expected**: Danh sách ẩn lại, aria-expanded="false", icon quay về ChevronDown
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_18: aria-expanded cập nhật đúng khi toggle
- **Pre-conditions**: AdjustmentHistory render
- **Steps**:
  1. Kiểm tra ban đầu: aria-expanded="false" (collapsed=true)
  2. Click toggle → kiểm tra aria-expanded="true"
  3. Click toggle → kiểm tra aria-expanded="false"
  4. Lặp lại 3 lần để xác nhận tính nhất quán
- **Expected**: aria-expanded luôn phản ánh đúng trạng thái !collapsed: false khi collapsed, true khi expanded
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_19: Chevron icon thay đổi khi toggle (Down↔Up)
- **Pre-conditions**: AdjustmentHistory render
- **Steps**:
  1. Khi collapsed=true → kiểm tra ChevronDown icon hiển thị (aria-hidden="true")
  2. Click toggle → kiểm tra ChevronUp icon hiển thị (aria-hidden="true")
  3. Cả hai icon đều có aria-hidden="true"
- **Expected**: Collapsed → ChevronDown, Expanded → ChevronUp, cả hai icon đều có aria-hidden="true" vì chỉ là decorative
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_20: Hiển thị empty state khi không có records
- **Pre-conditions**: AdjustmentHistory render với adjustments=[] (mảng rỗng), defaultCollapsed=false
- **Steps**:
  1. Render component với adjustments=[]
  2. Kiểm tra data-testid="adjustment-history-empty" hiển thị
  3. Kiểm tra text content từ i18n key `adjustmentHistory.noData`
- **Expected**: Hiển thị fallback message "Chưa có dữ liệu" (hoặc tương đương), không render danh sách records
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_21: Sắp xếp records theo ngày giảm dần
- **Pre-conditions**: AdjustmentHistory với adjustments chứa 3 records: {date: "2026-06-10"}, {date: "2026-06-12"}, {date: "2026-06-08"}
- **Steps**:
  1. Render component với defaultCollapsed=false
  2. Kiểm tra thứ tự hiển thị các adjustment rows
- **Expected**: Thứ tự hiển thị: 12/06/2026 → 10/06/2026 → 08/06/2026 (mới nhất trước). Sort dùng new Date(b.date).getTime() - new Date(a.date).getTime()
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_22: Format ngày vi-VN (DD/MM/YYYY)
- **Pre-conditions**: AdjustmentHistory với record có date="2026-06-12"
- **Steps**:
  1. Render component expanded
  2. Kiểm tra ngày hiển thị trên row
- **Expected**: Ngày hiển thị dạng "12/06/2026" theo locale vi-VN với options {day: '2-digit', month: '2-digit', year: 'numeric'}
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_23: Badge triggerType "auto" hiển thị đúng
- **Pre-conditions**: AdjustmentHistory expanded, record có triggerType='auto'
- **Steps**:
  1. Tìm element data-testid="trigger-badge-{id}"
  2. Kiểm tra text content
- **Expected**: Badge hiển thị text từ i18n key `adjustmentHistory.auto`, có styling classes text-[10px] px-1.5 py-0.5 rounded
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_24: Badge triggerType "manual" hiển thị đúng
- **Pre-conditions**: AdjustmentHistory expanded, record có triggerType='manual'
- **Steps**:
  1. Tìm element data-testid="trigger-badge-{id}"
  2. Kiểm tra text content
- **Expected**: Badge hiển thị text từ i18n key `adjustmentHistory.manual`, cùng styling classes với badge auto
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_25: Applied record: CheckCircle emerald + label "Đã áp dụng"
- **Pre-conditions**: AdjustmentHistory expanded, record có applied=true
- **Steps**:
  1. Tìm row data-testid="adjustment-row-{id}"
  2. Kiểm tra icon Check trong div bg-emerald-100
  3. Kiểm tra status label data-testid="status-label-{id}"
- **Expected**: Hiển thị Check icon (emerald), status label có class bg-emerald-100 text-emerald-700, text từ i18n key `adjustmentHistory.applied`
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_26: Declined record: XCircle gray + label "Đã bỏ qua"
- **Pre-conditions**: AdjustmentHistory expanded, record có applied=false
- **Steps**:
  1. Tìm row data-testid="adjustment-row-{id}"
  2. Kiểm tra icon X trong div bg-slate-100
  3. Kiểm tra status label data-testid="status-label-{id}"
- **Expected**: Hiển thị X icon (gray/slate), status label có class bg-slate-100 text-slate-500, text từ i18n key `adjustmentHistory.declined`
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_27: TrendingUp icon khi newTargetCal > oldTargetCal
- **Pre-conditions**: AdjustmentHistory expanded, record có oldTargetCal=1800, newTargetCal=1950
- **Steps**:
  1. Tìm row tương ứng
  2. Kiểm tra icon giữa oldTargetCal và newTargetCal
- **Expected**: TrendingUp icon hiển thị với class text-emerald-500, aria-hidden="true". Hiển thị: "1800 ↑ 1950"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_28: TrendingDown icon khi newTargetCal < oldTargetCal
- **Pre-conditions**: AdjustmentHistory expanded, record có oldTargetCal=2200, newTargetCal=2050
- **Steps**:
  1. Tìm row tương ứng
  2. Kiểm tra icon giữa oldTargetCal và newTargetCal
- **Expected**: TrendingDown icon hiển thị với class text-red-500, aria-hidden="true". Hiển thị: "2200 ↓ 2050"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_29: Insight P1: alert non-dismissable khi hasAutoAdjustment=true
- **Pre-conditions**: InsightInput={hasAutoAdjustment: true, adjustmentDetails: {oldCal: 2000, newCal: 1850, reason: "Cân nặng tăng"}}, dismissedIds=[]
- **Steps**:
  1. Gọi selectInsight(input, [], today)
  2. Kiểm tra insight trả về
  3. Render AiInsightCard với insight này
  4. Kiểm tra nút dismiss không hiển thị
- **Expected**: Insight trả về: id='p1-auto-adjust', priority=1, type='alert', color='dark-amber', title='Điều chỉnh tự động', dismissable=false, actionLabel='Xem chi tiết'. Nút dismiss KHÔNG render vì dismissable=false
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_30: Insight P2: action khi proteinRatio < 0.7 AND isAfterEvening
- **Pre-conditions**: InsightInput={proteinRatio: 0.5, isAfterEvening: true}, dismissedIds=[], P1 trả về null (hasAutoAdjustment=false)
- **Steps**:
  1. Gọi selectInsight với input trên
  2. Kiểm tra insight trả về
- **Expected**: Insight: id='p2-low-protein', priority=2, type='action', color='amber', title='Protein thấp', message chứa "50% mục tiêu protein" (Math.round(0.5*100)=50), actionLabel='Gợi ý bữa tối', dismissable=true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_31: Insight P3: remind khi daysSinceWeightLog >= 3
- **Pre-conditions**: InsightInput={daysSinceWeightLog: 5}, P1 và P2 trả về null, dismissedIds=[]
- **Steps**:
  1. Gọi selectInsight
  2. Kiểm tra insight trả về
- **Expected**: Insight: id='p3-weight-log', priority=3, type='remind', color='amber', title='Cập nhật cân nặng', message chứa "5 ngày chưa cập nhật", actionLabel='Log cân nặng', dismissable=true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_32: Insight P4: motivate khi streak gap ≤ 2
- **Pre-conditions**: InsightInput={currentStreak: 8, longestStreak: 10}, P1-P3 null, dismissedIds=[]
- **Steps**:
  1. Gọi selectInsight
  2. Kiểm tra: longestStreak - currentStreak = 2 (≤ 2) → P4 trigger
- **Expected**: Insight: id='p4-streak-near-record', priority=4, type='motivate', color='blue', title='Sắp phá kỷ lục!', message chứa "Còn 2 ngày nữa là phá kỷ lục streak 10 ngày! 🔥", autoDismissHours=24
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_33: Insight P5: celebrate khi hasPRToday=true
- **Pre-conditions**: InsightInput={hasPRToday: true}, P1-P4 null, dismissedIds=[]
- **Steps**:
  1. Gọi selectInsight
  2. Kiểm tra insight trả về
- **Expected**: Insight: id='p5-pr-today', priority=5, type='celebrate', color='blue', title='Kỷ lục mới! 🎉', message='Chúc mừng! Bạn vừa đạt Personal Record mới hôm nay!', autoDismissHours=24
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_34: Insight P6: praise khi weeklyAdherence >= 85
- **Pre-conditions**: InsightInput={weeklyAdherence: 92}, P1-P5 null, dismissedIds=[]
- **Steps**:
  1. Gọi selectInsight
  2. Kiểm tra insight trả về
- **Expected**: Insight: id='p6-weekly-adherence', priority=6, type='praise', color='green', title='Tuần xuất sắc! 👏', message chứa "92% mục tiêu tuần" (Math.round(92)=92), autoDismissHours=24
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_35: Insight P7: progress khi weightTrendCorrect AND weeks >= 2
- **Pre-conditions**: InsightInput={weightTrendCorrect: true, weightTrendWeeks: 3}, P1-P6 null, dismissedIds=[]
- **Steps**:
  1. Gọi selectInsight
  2. Kiểm tra insight trả về
- **Expected**: Insight: id='p7-weight-trend', priority=7, type='progress', color='green', title='Xu hướng tốt! 📈', message chứa "3 tuần liên tiếp", autoDismissHours=24
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_36: Insight P8: tip of the day fallback
- **Pre-conditions**: InsightInput={} (tất cả fields undefined → P1-P7 đều null), dismissedIds=[]
- **Steps**:
  1. Gọi selectInsight({}, [], '2026-06-12')
  2. Kiểm tra insight trả về là P8 tip
  3. Kiểm tra tip nằm trong TIPS_POOL (20 tips)
- **Expected**: Insight: id bắt đầu bằng 'p8-tip-', priority=8, type='tip', color='gray', title và message match một entry trong TIPS_POOL, dismissable=true, không có autoDismissHours
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_37: Priority ordering: P1 override P2-P8
- **Pre-conditions**: InsightInput={hasAutoAdjustment: true, adjustmentDetails: {oldCal: 2000, newCal: 1850, reason: "test"}, proteinRatio: 0.3, isAfterEvening: true, daysSinceWeightLog: 7, currentStreak: 9, longestStreak: 10, hasPRToday: true, weeklyAdherence: 95, weightTrendCorrect: true, weightTrendWeeks: 4}
- **Steps**:
  1. Gọi selectInsight — tất cả 7 generators đều trả về non-null
  2. Kiểm tra insight trả về là P1 (alert)
- **Expected**: Mặc dù tất cả P1-P7 đều qualify, engine trả về P1 vì priority cao nhất (generator thứ nhất trong INSIGHT_GENERATORS array)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_38: Priority ordering: P2 hiển thị khi P1 null
- **Pre-conditions**: InsightInput={hasAutoAdjustment: false, proteinRatio: 0.5, isAfterEvening: true, daysSinceWeightLog: 5}, dismissedIds=[]
- **Steps**:
  1. Gọi selectInsight
  2. P1 null (hasAutoAdjustment=false) → P2 checked
  3. P2 qualify (proteinRatio < 0.7 AND isAfterEvening) → trả về P2
- **Expected**: Insight trả về là P2 (action, amber), không phải P3 hay P8. Đảm bảo generator chain dừng tại insight đầu tiên non-null
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_39: AiInsightCard empty state: aria-hidden="true"
- **Pre-conditions**: useInsightEngine trả về currentInsight=null (tất cả dismissed, kể cả tips fallback)
- **Steps**:
  1. Render AiInsightCard
  2. Kiểm tra data-testid="ai-insight-card-empty" hiển thị
  3. Kiểm tra attribute aria-hidden
- **Expected**: Empty state div render với data-testid="ai-insight-card-empty", className="min-h-[56px]", aria-hidden="true" — ẩn khỏi screen reader
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_40: AiInsightCard role="region" với aria-label chính xác
- **Pre-conditions**: useInsightEngine trả về insight type='alert', title='Điều chỉnh tự động'
- **Steps**:
  1. Render AiInsightCard
  2. Kiểm tra data-testid="ai-insight-card" có role="region"
  3. Kiểm tra aria-label = "⚠️ Điều chỉnh tự động" (emoji prefix + title)
- **Expected**: role="region" present, aria-label="${ICON_PREFIX_MAP[type]} ${title}" — cho P1 alert: "⚠️ Điều chỉnh tự động"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_41: Action button chỉ hiển thị khi actionLabel tồn tại
- **Pre-conditions**: Insight A có actionLabel='Xem chi tiết'; Insight B không có actionLabel (P4 motivate)
- **Steps**:
  1. Render AiInsightCard với insight A → kiểm tra data-testid="insight-action-btn" tồn tại
  2. Render AiInsightCard với insight B → kiểm tra data-testid="insight-action-btn" KHÔNG tồn tại
- **Expected**: Insight A: action button hiển thị với text "Xem chi tiết" + ChevronRight icon. Insight B (P4 motivate, không có actionLabel): action button KHÔNG render
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_42: Dismiss button chỉ hiển thị khi dismissable=true
- **Pre-conditions**: Insight P1 (dismissable=false); Insight P2 (dismissable=true)
- **Steps**:
  1. Render AiInsightCard với P1 → kiểm tra data-testid="insight-dismiss-btn" KHÔNG tồn tại
  2. Render AiInsightCard với P2 → kiểm tra data-testid="insight-dismiss-btn" tồn tại
- **Expected**: P1 (alert, non-dismissable): nút X không render. P2 (action, dismissable): nút X render với aria-label từ i18n key `insightCard.dismiss`
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_43: P2 không trigger khi proteinRatio >= 0.7
- **Pre-conditions**: InsightInput={proteinRatio: 0.75, isAfterEvening: true}, hasAutoAdjustment=false
- **Steps**:
  1. Gọi createP2 hoặc selectInsight
  2. Kiểm tra P2 trả về null
- **Expected**: proteinRatio=0.75 >= 0.7 → createP2 trả về null, engine skip P2 và tiếp tục kiểm tra P3
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_44: P2 không trigger khi isAfterEvening=false
- **Pre-conditions**: InsightInput={proteinRatio: 0.3, isAfterEvening: false}, hasAutoAdjustment=false
- **Steps**:
  1. Gọi createP2
  2. Kiểm tra trả về null mặc dù proteinRatio < 0.7
- **Expected**: isAfterEvening=false → createP2 trả về null. Cả hai điều kiện (proteinRatio < 0.7 AND isAfterEvening) phải đồng thời đúng
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_45: P3 không trigger khi daysSinceWeightLog < 3
- **Pre-conditions**: InsightInput={daysSinceWeightLog: 2}, P1-P2 null
- **Steps**:
  1. Gọi createP3
  2. Kiểm tra trả về null
- **Expected**: daysSinceWeightLog=2 < 3 → createP3 trả về null. Ngưỡng là >= 3 ngày
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_46: P4 không trigger khi streak gap > 2
- **Pre-conditions**: InsightInput={currentStreak: 5, longestStreak: 10}
- **Steps**:
  1. Tính gap = 10 - 5 = 5 (> 2)
  2. Gọi createP4
  3. Kiểm tra trả về null
- **Expected**: Gap=5 > 2 → createP4 trả về null. Chỉ trigger khi gap ≤ 2 (1 hoặc 2 ngày nữa phá kỷ lục)
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_47: localStorage corrupt JSON → dismissed trả về []
- **Pre-conditions**: localStorage.setItem('mp-insight-dismissed', 'invalid{json')
- **Steps**:
  1. Gọi loadDismissedIds()
  2. JSON.parse sẽ throw error
  3. Kiểm tra kết quả trả về
- **Expected**: Hàm trả về [] (mảng rỗng) nhờ try/catch. Không throw error ra ngoài, app tiếp tục hoạt động bình thường
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_48: localStorage key không tồn tại → dismissed trả về []
- **Pre-conditions**: localStorage không có key 'mp-insight-dismissed' (clear localStorage)
- **Steps**:
  1. Gọi loadDismissedIds()
  2. localStorage.getItem trả về null
  3. Kiểm tra kết quả
- **Expected**: stored=null → return [] ngay lập tức. Không gọi JSON.parse(null)
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P2

##### TC_AAI_49: Dismiss tất cả P1-P7 → hiển thị P8 tip
- **Pre-conditions**: InsightInput đủ điều kiện cho tất cả P1-P7, dismissedIds=['p1-auto-adjust', 'p2-low-protein', 'p3-weight-log', 'p4-streak-near-record', 'p5-pr-today', 'p6-weekly-adherence', 'p7-weight-trend']
- **Steps**:
  1. Gọi selectInsight(input, dismissedIds, '2026-06-12')
  2. Mỗi generator trả về insight nhưng đều nằm trong dismissedIds
  3. Kiểm tra fallback to getTipOfTheDay
- **Expected**: Engine skip tất cả P1-P7 (đã dismissed), trả về P8 tip of the day. Tip lấy từ TIPS_POOL[hashDateToIndex('2026-06-12', 20)]
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_AAI_50: Dismiss tất cả 20 tips → fallback tip đầu tiên theo hash
- **Pre-conditions**: dismissedIds chứa tất cả 'p8-tip-0' đến 'p8-tip-19' (20 tip IDs), P1-P7 đều null
- **Steps**:
  1. Gọi getTipOfTheDay('2026-06-12', ['p8-tip-0', ..., 'p8-tip-19'])
  2. Vòng for duyệt hết 20 tips, tất cả đều trong recentTipIds
  3. Kiểm tra fallback cuối cùng
- **Expected**: Khi tất cả tips đã dismissed, hàm fallback trả về tip tại startIndex = hashDateToIndex('2026-06-12', 20). Đây là safety net — luôn có ít nhất 1 tip hiển thị, không bao giờ trả về null
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_AAI_51: hashDateToIndex deterministic: cùng ngày → cùng tip
- **Pre-conditions**: Chuẩn bị dateStr = '2026-06-12'
- **Steps**:
  1. Gọi hashDateToIndex('2026-06-12', 20) lần 1 → ghi nhận kết quả index_1
  2. Gọi hashDateToIndex('2026-06-12', 20) lần 2 → ghi nhận kết quả index_2
  3. Gọi hashDateToIndex('2026-06-12', 20) lần 3 → ghi nhận kết quả index_3
- **Expected**: index_1 === index_2 === index_3. Hash function là deterministic: cùng input luôn cho cùng output, đảm bảo user thấy cùng tip trong 1 ngày
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_52: hashDateToIndex: ngày khác nhau → tip khác nhau
- **Pre-conditions**: Chuẩn bị 7 dateStr khác nhau: '2026-06-12' đến '2026-06-18'
- **Steps**:
  1. Gọi hashDateToIndex cho mỗi ngày với poolSize=20
  2. Thu thập 7 index
  3. Kiểm tra phân bố
- **Expected**: Các ngày khác nhau cho ra index khác nhau (hoặc ít nhất phần lớn khác nhau). Index luôn trong range [0, 19]. Hash phân bố đều trên pool
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P2

##### TC_AAI_53: Rapid dismiss 10 insights liên tiếp → state nhất quán
- **Pre-conditions**: useInsightEngine hook mounted, nhiều insights qualify
- **Steps**:
  1. Render AiInsightCard
  2. Click dismiss 10 lần liên tiếp nhanh (mỗi lần dismiss, insight mới hiển thị)
  3. Kiểm tra localStorage sau mỗi lần
  4. Reload app, kiểm tra dismissed state persist
- **Expected**: Mỗi lần dismiss: (1) ID thêm vào dismissedIds state, (2) persistDismissedIds ghi vào localStorage, (3) insight tiếp theo hiển thị ngay. Sau reload: localStorage chứa 10 dismissed IDs, insight thứ 11 (hoặc tip) hiển thị
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P2

##### TC_AAI_54: Nhiều pending adjustments + insights cùng lúc
- **Pre-conditions**: Có AutoAdjustBanner hiển thị (adjustment pending), đồng thời useInsightEngine trả về P1 alert (hasAutoAdjustment=true)
- **Steps**:
  1. Render Dashboard chứa cả AutoAdjustBanner và AiInsightCard
  2. Kiểm tra cả hai component hiển thị đồng thời
  3. Apply adjustment trên banner
  4. Kiểm tra AiInsightCard cập nhật (P1 alert có thể biến mất nếu hasAutoAdjustment chuyển false)
- **Expected**: Cả AutoAdjustBanner và AiInsightCard P1 render song song. Sau apply banner: nếu hasAutoAdjustment chuyển false, AiInsightCard chuyển sang insight priority tiếp theo (P2 hoặc thấp hơn). State đồng bộ giữa 2 component
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P2

##### TC_AAI_55: 5 color schemes render đúng cấu hình (bg, border, icon, title, message, action, dismiss)
- **Pre-conditions**: Chuẩn bị 5 insights, mỗi insight tương ứng 1 color scheme: dark-amber (P1), amber (P2), blue (P4), green (P6), gray (P8)
- **Steps**:
  1. Render AiInsightCard lần lượt với từng insight:
     - dark-amber: kiểm tra bg='bg-amber-900/10', border='border-amber-800', icon='text-amber-800', title='text-amber-900', message='text-amber-800'
     - amber: kiểm tra bg='bg-amber-50', border='border-amber-500', icon='text-amber-600', title='text-amber-800', message='text-amber-700'
     - blue: kiểm tra bg='bg-blue-50', border='border-blue-500', icon='text-blue-600', title='text-blue-800', message='text-blue-700'
     - green: kiểm tra bg='bg-emerald-50', border='border-emerald-500', icon='text-emerald-600', title='text-emerald-800', message='text-emerald-700'
     - gray: kiểm tra bg='bg-slate-50', border='border-slate-400', icon='text-slate-500', title='text-slate-700', message='text-slate-600'
  2. Kiểm tra mỗi scheme có đủ 7 thuộc tính CSS classes
- **Expected**: Tất cả 5 color schemes render đúng theo COLOR_MAP. Mỗi scheme áp dụng classes cho: container bg, left border (border-l-4), icon color, title color, message color, action button color, dismiss button color. Dark mode variants cũng đúng (dark: prefix)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1


##### TC_AAI_56: Banner ẩn khi adjustment=null (không truyền props)
- **Pre-conditions**: Không có Adjustment object (null/undefined)
- **Steps**:
  1. Render AutoAdjustBanner với adjustment=null
  2. Kiểm tra DOM xem banner có render hay không
  3. Kiểm tra data-testid='auto-adjust-banner' không tồn tại
- **Expected**: Banner KHÔNG render, DOM trả về null hoặc empty fragment. Không có lỗi console
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_AAI_57: Banner ẩn khi adjustment=undefined
- **Pre-conditions**: adjustment=undefined (props không truyền)
- **Steps**:
  1. Render AutoAdjustBanner mà không truyền prop adjustment
  2. Kiểm tra DOM
  3. Kiểm tra console không có error
- **Expected**: Component trả về null hoặc không render nội dung. Console không có error/warning
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_58: Banner hiển thị chính xác oldTargetCal trong body text
- **Pre-conditions**: Có Adjustment object với oldTargetCal=2200, newTargetCal=2050
- **Steps**:
  1. Render AutoAdjustBanner với adjustment={oldTargetCal: 2200, newTargetCal: 2050, reason: 'increasing', movingAvgWeight: 80.0}
  2. Kiểm tra body text chứa giá trị '2200'
  3. Kiểm tra body text hiển thị oldTargetCal chính xác
- **Expected**: Body text chứa '2200' kcal là giá trị cũ. Hiển thị rõ ràng trong context 'mục tiêu hiện tại: 2200 kcal'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_59: Banner hiển thị chính xác newTargetCal trong body text
- **Pre-conditions**: Có Adjustment object với oldTargetCal=2000, newTargetCal=1850
- **Steps**:
  1. Render AutoAdjustBanner với adjustment={oldTargetCal: 2000, newTargetCal: 1850, reason: 'increasing', movingAvgWeight: 75.5}
  2. Kiểm tra body text chứa giá trị '1850'
  3. Kiểm tra body text hiển thị newTargetCal chính xác
- **Expected**: Body text chứa '1850' kcal là giá trị mới đề xuất. Direction text hiển thị 'giảm' vì 1850 < 2000
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_60: Banner hiển thị đúng calorieAdjustment amount = 150 kcal
- **Pre-conditions**: Adjustment với oldTargetCal=2000, newTargetCal=1850 (delta=150)
- **Steps**:
  1. Render AutoAdjustBanner với adjustment delta = |2000 - 1850| = 150
  2. Kiểm tra body text chứa giá trị '150'
  3. Xác nhận amount luôn hiển thị giá trị tuyệt đối của delta
- **Expected**: Body text chứa '150' kcal là mức điều chỉnh, khớp với AUTO_ADJUST_CONFIG.calorieAdjustment = 150
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_61: Apply button gọi onApply callback chính xác 1 lần khi click
- **Pre-conditions**: Adjustment hợp lệ, user click nút 'Áp dụng'
- **Steps**:
  1. Render AutoAdjustBanner với adjustment hợp lệ và onApply mock function
  2. Click nút 'Áp dụng' (data-testid='apply-btn')
  3. Kiểm tra onApply mock được gọi
  4. Kiểm tra onApply mock chỉ được gọi 1 lần
- **Expected**: onApply callback được gọi chính xác 1 lần. expect(onApply).toHaveBeenCalledTimes(1)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_62: Dismiss button gọi onDismiss callback chính xác 1 lần khi click
- **Pre-conditions**: Adjustment hợp lệ, user click nút 'Bỏ qua'
- **Steps**:
  1. Render AutoAdjustBanner với adjustment hợp lệ và onDismiss mock function
  2. Click nút 'Bỏ qua' (data-testid='dismiss-btn')
  3. Kiểm tra onDismiss mock được gọi
  4. Kiểm tra onDismiss mock chỉ được gọi 1 lần
- **Expected**: onDismiss callback được gọi chính xác 1 lần. expect(onDismiss).toHaveBeenCalledTimes(1)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_63: Double-click apply chỉ gọi callback 1 lần (debounce)
- **Pre-conditions**: Adjustment hợp lệ, user double-click nhanh nút 'Áp dụng'
- **Steps**:
  1. Render AutoAdjustBanner với adjustment hợp lệ và onApply mock
  2. Double-click nhanh nút 'Áp dụng' (2 click liên tiếp < 100ms)
  3. Kiểm tra số lần onApply được gọi
- **Expected**: onApply callback chỉ được gọi 1 lần dù double-click. Debounce hoặc disable button sau click đầu tiên
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_AAI_64: Double-click dismiss chỉ gọi callback 1 lần (debounce)
- **Pre-conditions**: Adjustment hợp lệ, user double-click nhanh nút 'Bỏ qua'
- **Steps**:
  1. Render AutoAdjustBanner với adjustment hợp lệ và onDismiss mock
  2. Double-click nhanh nút 'Bỏ qua' (2 click liên tiếp < 100ms)
  3. Kiểm tra số lần onDismiss được gọi
- **Expected**: onDismiss callback chỉ được gọi 1 lần dù double-click
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_AAI_65: Banner re-render khi adjustment props thay đổi từ increasing → decreasing
- **Pre-conditions**: Banner đang hiển thị reason 'increasing', props thay đổi sang 'decreasing'
- **Steps**:
  1. Render AutoAdjustBanner với adjustment reason='increasing'
  2. Re-render với adjustment reason='decreasing'
  3. Kiểm tra body text cập nhật sang bodyLosing
- **Expected**: Banner re-render thành công, bodyKey chuyển từ adjustBanner.bodyGaining → adjustBanner.bodyLosing. Nội dung body text cập nhật tương ứng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_66: Banner re-render khi adjustment props thay đổi từ stalled → increasing
- **Pre-conditions**: Banner đang hiển thị reason 'stalled', props thay đổi sang 'increasing'
- **Steps**:
  1. Render AutoAdjustBanner với adjustment reason='stalled'
  2. Re-render với adjustment reason='increasing'
  3. Kiểm tra body text cập nhật sang bodyGaining
- **Expected**: Banner re-render thành công, bodyKey chuyển từ adjustBanner.bodyStalled → adjustBanner.bodyGaining
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_67: Banner hiển thị movingAvgWeight với 1 decimal (ví dụ: 75.5)
- **Pre-conditions**: Adjustment với movingAvgWeight=75.5432
- **Steps**:
  1. Render AutoAdjustBanner với movingAvgWeight=75.5432
  2. Kiểm tra hiển thị giá trị movingAvgWeight
  3. Xác nhận format hiển thị
- **Expected**: movingAvgWeight hiển thị với 1 decimal: '75.5' hoặc format phù hợp. Không hiển thị quá nhiều decimal
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_68: prevAvgDisplay = 75.7 khi movingAvg=75.5, currentDelta < 0 (offset +0.2)
- **Pre-conditions**: movingAvg=75.5, newTarget=1850 < oldTarget=2000 → currentDelta=-150 < 0 → offset=+0.2
- **Steps**:
  1. Render AutoAdjustBanner với {movingAvgWeight: 75.5, oldTargetCal: 2000, newTargetCal: 1850}
  2. Tính toán: currentDelta = 1850 - 2000 = -150 (< 0)
  3. Kiểm tra prevAvgDisplay = 75.5 + 0.2 = 75.7
- **Expected**: prevAvgDisplay = 75.7, currAvg = 75.5. Banner hiển thị xu hướng: trước đó 75.7 → hiện tại 75.5 (giảm)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_AAI_69: prevAvgDisplay = 68.0 khi movingAvg=68.2, currentDelta > 0 (offset -0.2)
- **Pre-conditions**: movingAvg=68.2, newTarget=1950 > oldTarget=1800 → currentDelta=+150 > 0 → offset=-0.2
- **Steps**:
  1. Render AutoAdjustBanner với {movingAvgWeight: 68.2, oldTargetCal: 1800, newTargetCal: 1950}
  2. Tính toán: currentDelta = 1950 - 1800 = 150 (> 0)
  3. Kiểm tra prevAvgDisplay = 68.2 - 0.2 = 68.0
- **Expected**: prevAvgDisplay = 68.0, currAvg = 68.2. Banner hiển thị xu hướng: trước đó 68.0 → hiện tại 68.2 (tăng)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_AAI_70: prevAvgDisplay khi currentDelta = 0 (stalled case)
- **Pre-conditions**: movingAvg=72.0, newTarget=2000 = oldTarget=2000 → currentDelta=0
- **Steps**:
  1. Render AutoAdjustBanner với {movingAvgWeight: 72.0, oldTargetCal: 2000, newTargetCal: 2000}
  2. Tính toán: currentDelta = 0, xử lý như trường hợp decrease
  3. Kiểm tra prevAvgDisplay
- **Expected**: currentDelta = 0 → offset = +0.2 (vì currentDelta > 0 = false) → prevAvgDisplay = 72.2
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_71: Banner title sử dụng đúng i18n key adjustBanner.title
- **Pre-conditions**: Adjustment hợp lệ, kiểm tra i18n key cho title
- **Steps**:
  1. Render AutoAdjustBanner với adjustment hợp lệ
  2. Kiểm tra data-testid='banner-title'
  3. Xác nhận text lấy từ i18n key adjustBanner.title
- **Expected**: Title text render từ t('adjustBanner.title'), không hardcode. Nội dung phụ thuộc ngôn ngữ hiện tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_72: bodyKey = adjustBanner.bodyGaining khi reason chứa 'increasing fast'
- **Pre-conditions**: reason = 'Weight is increasing fast, gaining too much'
- **Steps**:
  1. Render AutoAdjustBanner với reason chứa chuỗi 'increasing'
  2. Kiểm tra bodyKey được chọn
- **Expected**: bodyKey = 'adjustBanner.bodyGaining' vì reason.includes('increasing') = true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_73: bodyKey = adjustBanner.bodyLosing khi reason chứa 'decreasing slowly'
- **Pre-conditions**: reason = 'Weight is decreasing slowly but consistently'
- **Steps**:
  1. Render AutoAdjustBanner với reason chứa chuỗi 'decreasing'
  2. Kiểm tra bodyKey được chọn
- **Expected**: bodyKey = 'adjustBanner.bodyLosing' vì reason.includes('decreasing') = true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_74: bodyKey = adjustBanner.bodyStalled khi reason = 'plateau detected'
- **Pre-conditions**: reason = 'plateau detected - weight stalled for 2 weeks'
- **Steps**:
  1. Render AutoAdjustBanner với reason='plateau detected'
  2. Kiểm tra bodyKey được chọn
- **Expected**: bodyKey = 'adjustBanner.bodyStalled' vì reason không chứa 'increasing' hay 'decreasing'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_75: Banner data-testid='auto-adjust-banner' tồn tại
- **Pre-conditions**: Kiểm tra data-testid trên banner container
- **Steps**:
  1. Render AutoAdjustBanner với adjustment hợp lệ
  2. Query DOM bằng data-testid='auto-adjust-banner'
- **Expected**: Element với data-testid='auto-adjust-banner' tồn tại trong DOM
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_76: Apply button có data-testid='apply-btn'
- **Pre-conditions**: Kiểm tra data-testid trên nút Áp dụng
- **Steps**:
  1. Render AutoAdjustBanner với adjustment hợp lệ
  2. Query DOM bằng data-testid tương ứng nút apply
- **Expected**: Nút 'Áp dụng' có thể query được bằng test ID, accessible cho automation testing
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_77: Dismiss button có data-testid='dismiss-btn'
- **Pre-conditions**: Kiểm tra data-testid trên nút Bỏ qua
- **Steps**:
  1. Render AutoAdjustBanner với adjustment hợp lệ
  2. Query DOM bằng data-testid tương ứng nút dismiss
- **Expected**: Nút 'Bỏ qua' có thể query được bằng test ID, accessible cho automation testing
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_78: Banner direction text = 'tăng' khi newTargetCal > oldTargetCal
- **Pre-conditions**: newTargetCal=2150 > oldTargetCal=2000 → direction 'tăng'
- **Steps**:
  1. Render AutoAdjustBanner với {oldTargetCal: 2000, newTargetCal: 2150}
  2. Kiểm tra direction text trong body
- **Expected**: Body text chứa từ 'tăng' (hoặc tương đương) cho biết calories mục tiêu sẽ tăng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_79: Banner direction text = 'giảm' khi newTargetCal < oldTargetCal
- **Pre-conditions**: newTargetCal=1850 < oldTargetCal=2000 → direction 'giảm'
- **Steps**:
  1. Render AutoAdjustBanner với {oldTargetCal: 2000, newTargetCal: 1850}
  2. Kiểm tra direction text trong body
- **Expected**: Body text chứa từ 'giảm' (hoặc tương đương) cho biết calories mục tiêu sẽ giảm
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_80: Banner với oldTargetCal=1200 (minCalories boundary) hiển thị đúng
- **Pre-conditions**: oldTargetCal=1200 (minCalories boundary), newTargetCal=1350
- **Steps**:
  1. Render AutoAdjustBanner với {oldTargetCal: 1200, newTargetCal: 1350}
  2. Kiểm tra banner hiển thị đúng khi ở ranh giới minCalories
- **Expected**: Banner hiển thị bình thường với oldTarget=1200 (giá trị tối thiểu). Direction = 'tăng'
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_81: History render empty state khi adjustments=[] (mảng rỗng)
- **Pre-conditions**: adjustments=[] (mảng rỗng)
- **Steps**:
  1. Render AdjustmentHistory với adjustments=[]
  2. Kiểm tra danh sách điều chỉnh
  3. Kiểm tra empty state message
- **Expected**: Hiển thị thông báo 'Chưa có lịch sử điều chỉnh' hoặc danh sách rỗng. Không crash, không error
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_AAI_82: History render đúng khi adjustments có 1 item duy nhất
- **Pre-conditions**: adjustments có đúng 1 item
- **Steps**:
  1. Render AdjustmentHistory với adjustments=[{id:'1', date:'2026-06-12', reason:'increasing', oldTargetCal:2000, newTargetCal:1850, triggerType:'auto', applied:true}]
  2. Expand history
  3. Kiểm tra số lượng items render
- **Expected**: Chính xác 1 item hiển thị trong danh sách. Hiển thị đầy đủ thông tin: date, reason, calories, status
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_83: History render đúng khi adjustments có 5 items
- **Pre-conditions**: adjustments có 5 items
- **Steps**:
  1. Render AdjustmentHistory với 5 AdjustmentRecord items
  2. Expand history
  3. Kiểm tra số lượng items render
- **Expected**: Chính xác 5 items hiển thị, sắp xếp theo ngày giảm dần
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_84: History render đúng khi adjustments có 20 items
- **Pre-conditions**: adjustments có 20 items
- **Steps**:
  1. Render AdjustmentHistory với 20 AdjustmentRecord items
  2. Expand history
  3. Kiểm tra scroll và hiển thị
- **Expected**: Tất cả 20 items render đúng thứ tự. UI có thể scroll nếu danh sách dài. Không lag render
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_85: History mặc định collapsed khi defaultCollapsed=true
- **Pre-conditions**: defaultCollapsed=true (mặc định)
- **Steps**:
  1. Render AdjustmentHistory với defaultCollapsed=true (hoặc không truyền prop)
  2. Kiểm tra trạng thái ban đầu
- **Expected**: History ở trạng thái collapsed, danh sách ẩn. Toggle button hiển thị mũi tên ChevronDown
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_86: History mặc định expanded khi defaultCollapsed=false
- **Pre-conditions**: defaultCollapsed=false
- **Steps**:
  1. Render AdjustmentHistory với defaultCollapsed=false
  2. Kiểm tra trạng thái ban đầu
- **Expected**: History ở trạng thái expanded, danh sách hiển thị đầy đủ. Toggle button hiển thị mũi tên ChevronUp
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_87: Click toggle button: collapsed → expanded hiển thị danh sách
- **Pre-conditions**: Click toggle khi đang collapsed
- **Steps**:
  1. Render AdjustmentHistory ở trạng thái collapsed
  2. Click toggle button
  3. Kiểm tra danh sách hiển thị
- **Expected**: Danh sách adjustments hiển thị (expanded). aria-expanded chuyển thành 'true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_88: Click toggle button: expanded → collapsed ẩn danh sách
- **Pre-conditions**: Click toggle khi đang expanded
- **Steps**:
  1. Render AdjustmentHistory ở trạng thái expanded
  2. Click toggle button
  3. Kiểm tra danh sách ẩn
- **Expected**: Danh sách adjustments ẩn (collapsed). aria-expanded chuyển thành 'false'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_89: aria-expanded='false' khi History đang collapsed
- **Pre-conditions**: Kiểm tra aria-expanded khi collapsed
- **Steps**:
  1. Render AdjustmentHistory ở trạng thái collapsed
  2. Query toggle button
  3. Kiểm tra attribute aria-expanded
- **Expected**: Toggle button có aria-expanded='false'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_90: aria-expanded='true' khi History đang expanded
- **Pre-conditions**: Kiểm tra aria-expanded khi expanded
- **Steps**:
  1. Render AdjustmentHistory ở trạng thái expanded
  2. Query toggle button
  3. Kiểm tra attribute aria-expanded
- **Expected**: Toggle button có aria-expanded='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_91: Sort: adjustment mới nhất (2026-06-12) hiển thị ở vị trí đầu tiên
- **Pre-conditions**: 3 items: dates 2026-06-10, 2026-06-12, 2026-06-08
- **Steps**:
  1. Render AdjustmentHistory với 3 items có dates khác nhau
  2. Expand history
  3. Kiểm tra thứ tự items
- **Expected**: Item đầu tiên = 2026-06-12, thứ hai = 2026-06-10, thứ ba = 2026-06-08 (giảm dần)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_92: Sort: adjustment cũ nhất hiển thị ở vị trí cuối cùng
- **Pre-conditions**: 5 items, kiểm tra item cuối cùng
- **Steps**:
  1. Render AdjustmentHistory với 5 items, dates: 01/06, 03/06, 05/06, 07/06, 09/06
  2. Expand history
  3. Kiểm tra item cuối cùng
- **Expected**: Item cuối cùng hiển thị date 01/06/2026 (cũ nhất)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_93: Sort: 5 items sắp xếp đúng thứ tự ngày giảm dần
- **Pre-conditions**: 5 items ngẫu nhiên → sort đúng
- **Steps**:
  1. Render AdjustmentHistory với dates: [2026-06-05, 2026-06-01, 2026-06-10, 2026-06-03, 2026-06-07]
  2. Expand history
  3. Kiểm tra thứ tự tất cả 5 items
- **Expected**: Thứ tự: 10/06, 07/06, 05/06, 03/06, 01/06 (giảm dần theo ngày)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_94: Date format vi-VN: '12/06/2026' cho ngày 2026-06-12
- **Pre-conditions**: Date 2026-06-12 format vi-VN
- **Steps**:
  1. Render item với date='2026-06-12'
  2. Kiểm tra text hiển thị ngày
- **Expected**: Ngày hiển thị '12/06/2026' theo locale vi-VN (DD/MM/YYYY)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_95: Date format vi-VN: '01/01/2025' cho ngày 2025-01-01
- **Pre-conditions**: Date 2025-01-01 format vi-VN
- **Steps**:
  1. Render item với date='2025-01-01'
  2. Kiểm tra text hiển thị ngày
- **Expected**: Ngày hiển thị '01/01/2025' theo locale vi-VN
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_96: Applied=true → icon CheckCircle (emerald) hiển thị
- **Pre-conditions**: Item với applied=true
- **Steps**:
  1. Render history item với applied=true
  2. Kiểm tra icon status
- **Expected**: Icon CheckCircle hiển thị với màu emerald, biểu thị đã áp dụng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_97: Applied=false → icon XCircle (gray) hiển thị
- **Pre-conditions**: Item với applied=false
- **Steps**:
  1. Render history item với applied=false
  2. Kiểm tra icon status
- **Expected**: Icon XCircle hiển thị với màu gray, biểu thị đã từ chối
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_98: Applied=true → text có class màu emerald
- **Pre-conditions**: Item applied=true → class màu emerald
- **Steps**:
  1. Render history item với applied=true
  2. Kiểm tra CSS class trên text status
- **Expected**: Text status có class chứa 'emerald' (ví dụ: text-emerald-600)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_99: Applied=false → text có class màu gray
- **Pre-conditions**: Item applied=false → class màu gray
- **Steps**:
  1. Render history item với applied=false
  2. Kiểm tra CSS class trên text status
- **Expected**: Text status có class chứa 'gray' hoặc 'slate' (ví dụ: text-gray-500)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_100: TrendingUp icon hiển thị khi newTargetCal > oldTargetCal
- **Pre-conditions**: newTargetCal=2150 > oldTargetCal=2000 → TrendingUp
- **Steps**:
  1. Render history item với oldTargetCal=2000, newTargetCal=2150
  2. Kiểm tra trend icon
- **Expected**: Icon TrendingUp hiển thị với màu emerald, biểu thị tăng calories
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_101: TrendingDown icon hiển thị khi newTargetCal < oldTargetCal
- **Pre-conditions**: newTargetCal=1850 < oldTargetCal=2000 → TrendingDown
- **Steps**:
  1. Render history item với oldTargetCal=2000, newTargetCal=1850
  2. Kiểm tra trend icon
- **Expected**: Icon TrendingDown hiển thị với màu red, biểu thị giảm calories
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_102: triggerType='auto' → hiển thị badge 'Tự động'
- **Pre-conditions**: triggerType='auto'
- **Steps**:
  1. Render history item với triggerType='auto'
  2. Kiểm tra badge hiển thị
- **Expected**: Badge hiển thị text 'Tự động' (hoặc t('adjustmentHistory.auto'))
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_103: triggerType='manual' → hiển thị badge 'Thủ công'
- **Pre-conditions**: triggerType='manual'
- **Steps**:
  1. Render history item với triggerType='manual'
  2. Kiểm tra badge hiển thị
- **Expected**: Badge hiển thị text 'Thủ công' (hoặc t('adjustmentHistory.manual'))
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_104: Hiển thị text '2000 → 1850 kcal' khi oldTarget=2000, newTarget=1850
- **Pre-conditions**: oldTargetCal=2000, newTargetCal=1850
- **Steps**:
  1. Render history item với oldTargetCal=2000, newTargetCal=1850
  2. Kiểm tra text hiển thị calories
- **Expected**: Text hiển thị '2000 → 1850 kcal' hoặc format tương đương thể hiện rõ sự thay đổi
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_105: Hiển thị reason text chính xác trong mỗi adjustment record
- **Pre-conditions**: reason='Weight is increasing consistently'
- **Steps**:
  1. Render history item với reason='Weight is increasing consistently'
  2. Kiểm tra reason text
- **Expected**: Reason text hiển thị chính xác hoặc bản dịch tương ứng từ i18n
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_106: History container có đúng aria-label từ i18n key adjustmentHistory.ariaLabel
- **Pre-conditions**: Kiểm tra aria-label trên container
- **Steps**:
  1. Render AdjustmentHistory
  2. Query container element
  3. Kiểm tra attribute aria-label
- **Expected**: Container có aria-label khớp với i18n key adjustmentHistory.ariaLabel
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_107: aria-hidden='true' trên icon CheckCircle trong history items
- **Pre-conditions**: aria-hidden trên CheckCircle icon
- **Steps**:
  1. Render history item với applied=true
  2. Query CheckCircle SVG element
- **Expected**: CheckCircle icon có aria-hidden='true', ẩn khỏi screen reader
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_108: aria-hidden='true' trên icon XCircle trong history items
- **Pre-conditions**: aria-hidden trên XCircle icon
- **Steps**:
  1. Render history item với applied=false
  2. Query XCircle SVG element
- **Expected**: XCircle icon có aria-hidden='true', ẩn khỏi screen reader
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_109: aria-hidden='true' trên icon TrendingUp/TrendingDown
- **Pre-conditions**: aria-hidden trên TrendingUp/TrendingDown icons
- **Steps**:
  1. Render history items với cả tăng và giảm calories
  2. Query trend SVG elements
- **Expected**: Tất cả TrendingUp và TrendingDown icons có aria-hidden='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_110: aria-hidden='true' trên icon ChevronUp/ChevronDown toggle
- **Pre-conditions**: aria-hidden trên ChevronUp/ChevronDown toggle icon
- **Steps**:
  1. Render AdjustmentHistory
  2. Query chevron SVG trong toggle button
- **Expected**: Icon ChevronUp/ChevronDown có aria-hidden='true', button đã có aria-label riêng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_111: History hiển thị đúng khi tất cả items đều applied=true
- **Pre-conditions**: Tất cả 5 items đều applied=true
- **Steps**:
  1. Render AdjustmentHistory với 5 items tất cả applied=true
  2. Expand history
  3. Kiểm tra tất cả icons status
- **Expected**: Tất cả 5 items hiển thị CheckCircle emerald. Không có XCircle nào
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_112: History hiển thị đúng khi tất cả items đều applied=false
- **Pre-conditions**: Tất cả 5 items đều applied=false
- **Steps**:
  1. Render AdjustmentHistory với 5 items tất cả applied=false
  2. Expand history
  3. Kiểm tra tất cả icons status
- **Expected**: Tất cả 5 items hiển thị XCircle gray. Không có CheckCircle nào
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_113: History hiển thị mix items: 3 applied + 2 declined
- **Pre-conditions**: Mix: 3 applied + 2 declined
- **Steps**:
  1. Render AdjustmentHistory với 3 items applied=true và 2 items applied=false
  2. Expand history
  3. Kiểm tra icons tương ứng từng item
- **Expected**: 3 items có CheckCircle emerald, 2 items có XCircle gray. Mỗi item hiển thị đúng icon theo status
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_114: History hiển thị đúng khi cùng ngày có 2 adjustments
- **Pre-conditions**: 2 adjustments cùng ngày 2026-06-12
- **Steps**:
  1. Render AdjustmentHistory với 2 items cùng date='2026-06-12' nhưng khác id
  2. Expand history
  3. Kiểm tra cả 2 items hiển thị
- **Expected**: Cả 2 items hiển thị cùng ngày, thứ tự phụ thuộc vào thời gian tạo. Không mất item nào
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P2

##### TC_AAI_115: History toggle nhanh 5 lần liên tiếp → state nhất quán
- **Pre-conditions**: Toggle nhanh 5 lần liên tiếp
- **Steps**:
  1. Render AdjustmentHistory
  2. Click toggle button 5 lần nhanh liên tiếp
  3. Kiểm tra state cuối cùng
- **Expected**: State cuối cùng nhất quán: nếu bắt đầu collapsed → sau 5 toggle = expanded (lẻ). aria-expanded đúng
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P2

##### TC_AAI_116: P1 alert insight: icon AlertTriangle render đúng
- **Pre-conditions**: P1 alert insight hiển thị
- **Steps**:
  1. Tạo insight P1 với type='alert'
  2. Render AiInsightCard với insight P1
  3. Kiểm tra icon render
- **Expected**: Icon AlertTriangle hiển thị trong card. SVG tương ứng với ICON_MAP['alert']
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_117: P1 alert insight: emoji prefix ⚠️ trong aria-label
- **Pre-conditions**: P1 alert insight, kiểm tra aria-label
- **Steps**:
  1. Tạo insight P1 với type='alert', title='Điều chỉnh calo'
  2. Render AiInsightCard
  3. Kiểm tra aria-label trên card container
- **Expected**: aria-label = '⚠️ Điều chỉnh calo' (emoji prefix từ ICON_PREFIX_MAP['alert'] + title)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_118: P1 alert insight: color scheme dark-amber áp dụng đúng
- **Pre-conditions**: P1 alert → dark-amber color scheme
- **Steps**:
  1. Render AiInsightCard với insight có color='dark-amber'
  2. Kiểm tra CSS classes trên container
- **Expected**: Container có classes: bg-amber-900/10, border-amber-800. Icon có class text-amber-800
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_119: P1 alert insight: nút dismiss KHÔNG render (non-dismissable)
- **Pre-conditions**: P1 alert → nút dismiss không render
- **Steps**:
  1. Tạo insight P1 với dismissable=false
  2. Render AiInsightCard
  3. Kiểm tra DOM không có nút dismiss
- **Expected**: Nút dismiss KHÔNG tồn tại trong DOM. Chỉ có nội dung insight và action button (nếu có)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_120: P2 action insight: icon Beef render đúng
- **Pre-conditions**: P2 action insight, kiểm tra icon
- **Steps**:
  1. Tạo insight P2 với type='action'
  2. Render AiInsightCard
  3. Kiểm tra icon render
- **Expected**: Icon Beef hiển thị trong card. SVG tương ứng với ICON_MAP['action']
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_121: P2 action insight: emoji prefix 🥩 trong aria-label
- **Pre-conditions**: P2 action insight, kiểm tra emoji prefix
- **Steps**:
  1. Tạo insight P2 với type='action', title='Bổ sung protein'
  2. Render AiInsightCard
  3. Kiểm tra aria-label
- **Expected**: aria-label = '🥩 Bổ sung protein'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_122: P2 action insight: color scheme amber áp dụng đúng
- **Pre-conditions**: P2 action → amber color scheme
- **Steps**:
  1. Render AiInsightCard với insight có color='amber'
  2. Kiểm tra CSS classes
- **Expected**: Container có classes: bg-amber-50, border-amber-500. Icon class: text-amber-600
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_123: P2 action insight: nút dismiss render (dismissable)
- **Pre-conditions**: P2 action → nút dismiss render
- **Steps**:
  1. Tạo insight P2 với dismissable=true
  2. Render AiInsightCard
  3. Kiểm tra nút dismiss tồn tại
- **Expected**: Nút dismiss tồn tại trong DOM, có aria-label từ i18n
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_124: P3 remind insight: icon Scale render đúng
- **Pre-conditions**: P3 remind insight, kiểm tra icon
- **Steps**:
  1. Tạo insight P3 với type='remind'
  2. Render AiInsightCard
  3. Kiểm tra icon render
- **Expected**: Icon Scale hiển thị trong card
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_125: P3 remind insight: emoji prefix ⚖️ trong aria-label
- **Pre-conditions**: P3 remind insight, kiểm tra emoji prefix
- **Steps**:
  1. Tạo insight P3 với type='remind', title='Ghi cân nặng'
  2. Render AiInsightCard
  3. Kiểm tra aria-label
- **Expected**: aria-label = '⚖️ Ghi cân nặng'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_126: P3 remind insight: color scheme amber áp dụng đúng
- **Pre-conditions**: P3 remind → amber color scheme
- **Steps**:
  1. Render AiInsightCard với insight color='amber'
  2. Kiểm tra CSS classes
- **Expected**: Container có classes bg-amber-50, border-amber-500
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_127: P3 remind insight: nút dismiss render (dismissable)
- **Pre-conditions**: P3 remind → dismissable
- **Steps**:
  1. Tạo insight P3 với dismissable=true
  2. Kiểm tra nút dismiss
- **Expected**: Nút dismiss hiển thị, có thể click
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_128: P4 motivate insight: icon Flame render đúng
- **Pre-conditions**: P4 motivate insight, kiểm tra icon
- **Steps**:
  1. Tạo insight P4 với type='motivate'
  2. Render AiInsightCard
- **Expected**: Icon Flame hiển thị trong card
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_129: P4 motivate insight: emoji prefix 🔥 trong aria-label
- **Pre-conditions**: P4 motivate insight, kiểm tra emoji prefix
- **Steps**:
  1. Tạo insight P4 với type='motivate', title='Sắp phá kỷ lục!'
  2. Kiểm tra aria-label
- **Expected**: aria-label = '🔥 Sắp phá kỷ lục!'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_130: P4 motivate insight: color scheme blue áp dụng đúng
- **Pre-conditions**: P4 motivate → blue color scheme
- **Steps**:
  1. Render AiInsightCard với insight color='blue'
  2. Kiểm tra CSS classes
- **Expected**: Container có classes bg-blue-50, border-blue-500. Icon class text-blue-600
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_131: P4 motivate insight: autoDismissHours = 24
- **Pre-conditions**: P4 motivate → autoDismissHours = 24
- **Steps**:
  1. Tạo insight P4
  2. Kiểm tra autoDismissHours property
- **Expected**: Insight P4 có autoDismissHours = 24, tự động ẩn sau 24 giờ
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_132: P5 celebrate insight: icon Trophy render đúng
- **Pre-conditions**: P5 celebrate insight, kiểm tra icon
- **Steps**:
  1. Tạo insight P5 với type='celebrate'
  2. Render AiInsightCard
- **Expected**: Icon Trophy hiển thị trong card
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_133: P5 celebrate insight: emoji prefix 🏆 trong aria-label
- **Pre-conditions**: P5 celebrate insight, kiểm tra emoji prefix
- **Steps**:
  1. Tạo insight P5 với type='celebrate', title='PR mới!'
  2. Kiểm tra aria-label
- **Expected**: aria-label = '🏆 PR mới!'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_134: P5 celebrate insight: color scheme blue áp dụng đúng
- **Pre-conditions**: P5 celebrate → blue color scheme
- **Steps**:
  1. Render AiInsightCard với insight color='blue'
- **Expected**: Container có classes bg-blue-50, border-blue-500
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_135: P5 celebrate insight: autoDismissHours = 24
- **Pre-conditions**: P5 celebrate → autoDismissHours = 24
- **Steps**:
  1. Tạo insight P5
  2. Kiểm tra autoDismissHours
- **Expected**: autoDismissHours = 24
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_136: P6 praise insight: icon CheckCircle render đúng
- **Pre-conditions**: P6 praise insight, kiểm tra icon
- **Steps**:
  1. Tạo insight P6 với type='praise'
  2. Render AiInsightCard
- **Expected**: Icon CheckCircle hiển thị trong card
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_137: P6 praise insight: emoji prefix ✅ trong aria-label
- **Pre-conditions**: P6 praise insight, kiểm tra emoji prefix
- **Steps**:
  1. Tạo insight P6 với type='praise', title='Tuần xuất sắc!'
  2. Kiểm tra aria-label
- **Expected**: aria-label = '✅ Tuần xuất sắc!'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_138: P6 praise insight: color scheme green áp dụng đúng
- **Pre-conditions**: P6 praise → green color scheme
- **Steps**:
  1. Render AiInsightCard với insight color='green'
- **Expected**: Container có classes bg-emerald-50, border-emerald-500. Icon class text-emerald-600
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_139: P6 praise insight: autoDismissHours = 24
- **Pre-conditions**: P6 praise → autoDismissHours = 24
- **Steps**:
  1. Tạo insight P6
  2. Kiểm tra autoDismissHours
- **Expected**: autoDismissHours = 24
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_140: P7 progress insight: icon TrendingUp render đúng
- **Pre-conditions**: P7 progress insight, kiểm tra icon
- **Steps**:
  1. Tạo insight P7 với type='progress'
  2. Render AiInsightCard
- **Expected**: Icon TrendingUp hiển thị trong card
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_141: P7 progress insight: emoji prefix 📈 trong aria-label
- **Pre-conditions**: P7 progress insight, kiểm tra emoji prefix
- **Steps**:
  1. Tạo insight P7 với type='progress', title='Xu hướng tốt!'
  2. Kiểm tra aria-label
- **Expected**: aria-label = '📈 Xu hướng tốt!'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_142: P7 progress insight: color scheme green áp dụng đúng
- **Pre-conditions**: P7 progress → green color scheme
- **Steps**:
  1. Render AiInsightCard với insight color='green'
- **Expected**: Container có classes bg-emerald-50, border-emerald-500
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_143: P7 progress insight: autoDismissHours = 24
- **Pre-conditions**: P7 progress → autoDismissHours = 24
- **Steps**:
  1. Tạo insight P7
  2. Kiểm tra autoDismissHours
- **Expected**: autoDismissHours = 24
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_144: P8 tip insight: icon Lightbulb render đúng
- **Pre-conditions**: P8 tip insight, kiểm tra icon
- **Steps**:
  1. Tạo insight P8 với type='tip'
  2. Render AiInsightCard
- **Expected**: Icon Lightbulb hiển thị trong card
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_145: P8 tip insight: emoji prefix 💡 trong aria-label
- **Pre-conditions**: P8 tip insight, kiểm tra emoji prefix
- **Steps**:
  1. Tạo insight P8 với type='tip', title='Mẹo hay!'
  2. Kiểm tra aria-label
- **Expected**: aria-label = '💡 Mẹo hay!'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_146: P8 tip insight: color scheme gray áp dụng đúng
- **Pre-conditions**: P8 tip → gray color scheme
- **Steps**:
  1. Render AiInsightCard với insight color='gray'
- **Expected**: Container có classes bg-slate-50, border-slate-400. Icon class text-slate-500
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_147: P8 tip insight: dismissable = true
- **Pre-conditions**: P8 tip → dismissable=true
- **Steps**:
  1. Tạo insight P8 với dismissable=true
  2. Kiểm tra nút dismiss
- **Expected**: Nút dismiss hiển thị, user có thể dismiss tip
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_148: Insight card có role='region'
- **Pre-conditions**: Card container có role='region'
- **Steps**:
  1. Render AiInsightCard với insight hợp lệ
  2. Query container element
  3. Kiểm tra role attribute
- **Expected**: Container element có role='region'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_149: Insight card aria-label format = '{emoji} {title}'
- **Pre-conditions**: Card aria-label format đúng
- **Steps**:
  1. Render AiInsightCard với insight type='alert', title='Test Title'
  2. Kiểm tra aria-label
- **Expected**: aria-label = '⚠️ Test Title' (format: {ICON_PREFIX_MAP[type]} {title})
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_150: Empty state: không có insight → render empty div
- **Pre-conditions**: Không có insight → empty state
- **Steps**:
  1. Render AiInsightCard khi useInsightEngine trả về null/undefined
  2. Kiểm tra DOM render
- **Expected**: Render empty div, không có nội dung insight. Không crash, không error
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_AAI_151: Insight action button hiển thị khi actionLabel tồn tại
- **Pre-conditions**: Insight có actionLabel → action button hiển thị
- **Steps**:
  1. Tạo insight với actionLabel='Xem chi tiết'
  2. Render AiInsightCard
  3. Kiểm tra action button
- **Expected**: Action button hiển thị với text 'Xem chi tiết'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_152: Insight action button ẩn khi không có actionLabel
- **Pre-conditions**: Insight không có actionLabel → action button ẩn
- **Steps**:
  1. Tạo insight không có actionLabel (undefined)
  2. Render AiInsightCard
  3. Kiểm tra action button
- **Expected**: Action button KHÔNG tồn tại trong DOM
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_153: Action button type='navigate' → trigger navigation
- **Pre-conditions**: Action button type='navigate'
- **Steps**:
  1. Tạo insight với actionType='navigate', actionLabel='Đi tới'
  2. Click action button
  3. Kiểm tra navigation trigger
- **Expected**: Click action button trigger navigation đến trang tương ứng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_154: Action button type='dismiss' → dismiss insight
- **Pre-conditions**: Action button type='dismiss'
- **Steps**:
  1. Tạo insight với actionType='dismiss'
  2. Click action button
- **Expected**: Click action button dismiss insight, tương đương click nút dismiss
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_155: Dismiss button có aria-label từ i18n key insightCard.dismiss
- **Pre-conditions**: Nút dismiss có đúng aria-label
- **Steps**:
  1. Render AiInsightCard với insight dismissable
  2. Query nút dismiss
  3. Kiểm tra aria-label
- **Expected**: Nút dismiss có aria-label = t('insightCard.dismiss')
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_156: dark-amber: bg class = 'bg-amber-900/10'
- **Pre-conditions**: Insight color='dark-amber'
- **Steps**:
  1. Render AiInsightCard với insight có color='dark-amber'
  2. Kiểm tra container background class
- **Expected**: Container có class 'bg-amber-900/10'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_157: dark-amber: border class = 'border-amber-800'
- **Pre-conditions**: Insight color='dark-amber' border
- **Steps**:
  1. Render AiInsightCard với color='dark-amber'
  2. Kiểm tra border class (border-l-4)
- **Expected**: Left border có class 'border-amber-800'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_158: dark-amber: icon class = 'text-amber-800'
- **Pre-conditions**: Insight color='dark-amber' icon
- **Steps**:
  1. Render AiInsightCard với color='dark-amber'
  2. Kiểm tra icon color class
- **Expected**: Icon có class 'text-amber-800'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_159: dark-amber: title class = 'text-amber-900'
- **Pre-conditions**: Insight color='dark-amber' title
- **Steps**:
  1. Render AiInsightCard với color='dark-amber'
  2. Kiểm tra title text color
- **Expected**: Title có class 'text-amber-900'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_160: dark-amber: message class = 'text-amber-800'
- **Pre-conditions**: Insight color='dark-amber' message
- **Steps**:
  1. Render AiInsightCard với color='dark-amber'
  2. Kiểm tra message text color
- **Expected**: Message có class 'text-amber-800'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_161: amber: bg class = 'bg-amber-50'
- **Pre-conditions**: Insight color='amber' background
- **Steps**:
  1. Render AiInsightCard với insight có color='amber'
  2. Kiểm tra bg class
- **Expected**: Container có class 'bg-amber-50'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_162: amber: border class = 'border-amber-500'
- **Pre-conditions**: Insight color='amber' border
- **Steps**:
  1. Render AiInsightCard với color='amber'
  2. Kiểm tra border class
- **Expected**: Left border có class 'border-amber-500'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_163: amber: icon class = 'text-amber-600'
- **Pre-conditions**: Insight color='amber' icon
- **Steps**:
  1. Render AiInsightCard với color='amber'
  2. Kiểm tra icon color
- **Expected**: Icon có class 'text-amber-600'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_164: blue: bg class = 'bg-blue-50'
- **Pre-conditions**: Insight color='blue' background
- **Steps**:
  1. Render AiInsightCard với color='blue'
  2. Kiểm tra bg class
- **Expected**: Container có class 'bg-blue-50'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_165: blue: border class = 'border-blue-500'
- **Pre-conditions**: Insight color='blue' border
- **Steps**:
  1. Render AiInsightCard với color='blue'
  2. Kiểm tra border class
- **Expected**: Left border có class 'border-blue-500'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_166: blue: icon class = 'text-blue-600'
- **Pre-conditions**: Insight color='blue' icon
- **Steps**:
  1. Render AiInsightCard với color='blue'
  2. Kiểm tra icon color
- **Expected**: Icon có class 'text-blue-600'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_AAI_167: green: bg class = 'bg-emerald-50'
- **Pre-conditions**: Insight color='green' background
- **Steps**:
  1. Render AiInsightCard với color='green'
  2. Kiểm tra bg class
- **Expected**: Container có class 'bg-emerald-50'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_168: green: border class = 'border-emerald-500'
- **Pre-conditions**: Insight color='green' border
- **Steps**:
  1. Render AiInsightCard với color='green'
  2. Kiểm tra border class
- **Expected**: Left border có class 'border-emerald-500'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_169: gray: bg class = 'bg-slate-50'
- **Pre-conditions**: Insight color='gray' background
- **Steps**:
  1. Render AiInsightCard với color='gray'
  2. Kiểm tra bg class
- **Expected**: Container có class 'bg-slate-50'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_170: gray: border class = 'border-slate-400'
- **Pre-conditions**: Insight color='gray' border
- **Steps**:
  1. Render AiInsightCard với color='gray'
  2. Kiểm tra border class
- **Expected**: Left border có class 'border-slate-400'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_171: Dismiss insight → ID thêm vào dismissedIds trong state
- **Pre-conditions**: useInsightEngine hook mounted, insight P2 hiển thị
- **Steps**:
  1. Mount component với useInsightEngine hook
  2. Verify P2 insight hiển thị
  3. Click dismiss P2
  4. Kiểm tra dismissedIds trong state
- **Expected**: ID insight P2 ('p2-low-protein') thêm vào dismissedIds array trong hook state
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_172: Dismiss insight → persistDismissedIds ghi vào localStorage
- **Pre-conditions**: Dismiss P2, kiểm tra localStorage
- **Steps**:
  1. Mount component, dismiss P2 insight
  2. Đọc localStorage key 'mp-insight-dismissed'
  3. Parse JSON
- **Expected**: localStorage['mp-insight-dismissed'] chứa JSON array bao gồm 'p2-low-protein'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_173: Dismiss P2 → engine chọn P3 hiển thị tiếp theo
- **Pre-conditions**: P1 null, dismiss P2 → P3 hiển thị
- **Steps**:
  1. Setup: hasAutoAdjustment=false (P1 null), proteinRatio=0.5+isAfterEvening (P2 active), daysSinceWeightLog=5 (P3 active)
  2. Dismiss P2
  3. Kiểm tra insight hiển thị tiếp theo
- **Expected**: Sau dismiss P2, AiInsightCard hiển thị P3 (remind, icon Scale, color amber)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_174: Dismiss P2 + P3 → engine chọn P4 hiển thị tiếp
- **Pre-conditions**: Dismiss P2 rồi dismiss P3 → P4 hiển thị
- **Steps**:
  1. Setup conditions cho P2, P3, P4 đều active
  2. Dismiss P2, verify P3 hiển thị
  3. Dismiss P3, verify P4 hiển thị
- **Expected**: Sau dismiss P2+P3, AiInsightCard hiển thị P4 (motivate, icon Flame, color blue)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_175: Dismiss tất cả P1-P7 → P8 tip of the day hiển thị
- **Pre-conditions**: Dismiss tất cả P1-P7 → P8 tip
- **Steps**:
  1. Setup conditions cho tất cả P1-P7 active
  2. Dismiss lần lượt P1 (nếu dismissable) → P2 → P3 → P4 → P5 → P6 → P7
  3. Kiểm tra insight cuối cùng
- **Expected**: AiInsightCard hiển thị P8 tip of the day (type='tip', icon Lightbulb, color gray)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_176: Dismiss P8 tip → tip tiếp theo trong pool hiển thị
- **Pre-conditions**: Dismiss P8 tip hiện tại
- **Steps**:
  1. Chỉ có P8 tip hiển thị (P1-P7 đều null/dismissed)
  2. Dismiss tip hiện tại
  3. Kiểm tra tip tiếp theo
- **Expected**: Tip tiếp theo từ TIPS_POOL hiển thị, dựa trên hashDateToIndex cho ngày tiếp theo hoặc tip khác
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_177: Dismiss tất cả 20 tips → fallback tip hiển thị (quay vòng)
- **Pre-conditions**: Dismiss tất cả 20 tips trong pool
- **Steps**:
  1. Dismiss lần lượt tất cả 20 tips từ TIPS_POOL
  2. Kiểm tra behavior khi tất cả tips đã dismissed
- **Expected**: Khi tất cả tips đã dismissed, fallback hiển thị tip đầu tiên hoặc empty state. Không crash
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P2

##### TC_AAI_178: localStorage corrupt (invalid JSON mp-insight-dismissed) → dismissedIds = []
- **Pre-conditions**: localStorage key 'mp-insight-dismissed' chứa invalid JSON
- **Steps**:
  1. Set localStorage['mp-insight-dismissed'] = '{invalid json'
  2. Mount useInsightEngine hook
  3. Kiểm tra dismissedIds
- **Expected**: loadDismissedIds() catch error → trả về []. Hook hoạt động bình thường với dismissedIds=[]
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_AAI_179: localStorage rỗng (key không tồn tại) → dismissedIds = []
- **Pre-conditions**: localStorage không có key 'mp-insight-dismissed'
- **Steps**:
  1. Xóa localStorage key 'mp-insight-dismissed' (nếu có)
  2. Mount useInsightEngine hook
  3. Kiểm tra dismissedIds
- **Expected**: dismissedIds = [] (mảng rỗng). Tất cả insights khả dụng theo priority
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_180: localStorage có 3 dismissed IDs → load đúng vào state khi mount
- **Pre-conditions**: localStorage có 3 dismissed IDs sẵn
- **Steps**:
  1. Set localStorage['mp-insight-dismissed'] = '["p2-low-protein", "p3-weight-log", "p4-streak"]'
  2. Mount useInsightEngine hook
  3. Kiểm tra dismissedIds loaded
- **Expected**: dismissedIds chứa 3 IDs. P2, P3, P4 đều bị bỏ qua khi selectInsight
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_181: Dismiss persist qua page reload: dismissed insights vẫn dismissed
- **Pre-conditions**: Dismiss P2, reload page, verify persist
- **Steps**:
  1. Dismiss P2 insight
  2. Reload page (unmount + remount)
  3. Kiểm tra P2 vẫn dismissed
- **Expected**: Sau reload, P2 vẫn bị dismissed vì ID đã persist trong localStorage. Insight tiếp theo hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_182: Dismiss persist qua component unmount/remount
- **Pre-conditions**: Dismiss P3, unmount component, remount
- **Steps**:
  1. Dismiss P3
  2. Unmount AiInsightCard
  3. Remount AiInsightCard
  4. Kiểm tra P3 vẫn dismissed
- **Expected**: P3 vẫn dismissed sau unmount/remount. localStorage persist giữa mount cycles
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_183: autoDismiss 24h: P4 insight biến mất sau 24h kể từ lần hiển thị
- **Pre-conditions**: P4 autoDismiss sau 24h
- **Steps**:
  1. P4 insight hiển thị lúc t=0
  2. Advance timer 24 giờ (jest.advanceTimersByTime hoặc tương đương)
  3. Kiểm tra P4 còn hiển thị không
- **Expected**: Sau 24h, P4 tự động biến mất. Engine chọn insight priority tiếp theo
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_184: autoDismiss 24h: P5 insight vẫn hiển thị trước khi hết 24h
- **Pre-conditions**: P5 autoDismiss chưa hết 24h
- **Steps**:
  1. P5 insight hiển thị lúc t=0
  2. Advance timer 23 giờ 59 phút
  3. Kiểm tra P5 vẫn hiển thị
- **Expected**: P5 vẫn hiển thị vì chưa đủ 24h
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_185: autoDismiss 24h: P6 insight biến mất đúng sau 24h
- **Pre-conditions**: P6 autoDismiss sau đúng 24h
- **Steps**:
  1. P6 insight hiển thị lúc t=0
  2. Advance timer chính xác 24 giờ
  3. Kiểm tra P6 biến mất
- **Expected**: P6 biến mất sau 24h, chuyển sang insight tiếp theo
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_186: autoDismiss 24h: P7 insight biến mất đúng sau 24h
- **Pre-conditions**: P7 autoDismiss sau 24h
- **Steps**:
  1. P7 insight hiển thị
  2. Advance timer 24 giờ
- **Expected**: P7 tự động biến mất sau 24h
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_187: Non-dismissable P1: nút dismiss KHÔNG render trong DOM
- **Pre-conditions**: P1 non-dismissable: nút dismiss không render
- **Steps**:
  1. Tạo insight P1 với dismissable=false
  2. Render AiInsightCard
  3. Query nút dismiss trong DOM
- **Expected**: Nút dismiss KHÔNG tồn tại trong DOM. queryByTestId('dismiss-btn') = null
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_188: Dismissable insight: nút dismiss RENDER trong DOM
- **Pre-conditions**: Insight dismissable=true: nút dismiss render
- **Steps**:
  1. Tạo insight P2 với dismissable=true
  2. Render AiInsightCard
  3. Query nút dismiss
- **Expected**: Nút dismiss tồn tại trong DOM, clickable
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_189: Action button label hiển thị đúng text từ actionLabel prop
- **Pre-conditions**: Action button hiển thị đúng text
- **Steps**:
  1. Tạo insight với actionLabel='Xem lịch tập'
  2. Render AiInsightCard
  3. Kiểm tra text trên action button
- **Expected**: Action button hiển thị 'Xem lịch tập' (text từ actionLabel)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_190: Dismiss button aria-label = t('insightCard.dismiss')
- **Pre-conditions**: Dismiss button aria-label chính xác
- **Steps**:
  1. Render AiInsightCard với insight dismissable
  2. Query nút dismiss
  3. Kiểm tra aria-label attribute
- **Expected**: aria-label = giá trị từ t('insightCard.dismiss')
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_191: selectInsight: hasAutoAdjustment=true → trả về P1 (priority cao nhất)
- **Pre-conditions**: hasAutoAdjustment=true, tất cả input khác default
- **Steps**:
  1. Gọi selectInsight với input={hasAutoAdjustment: true}
  2. Kiểm tra insight trả về
- **Expected**: Trả về P1 insight: id='p1-auto-adjust', type='alert', color='dark-amber', priority=1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_192: selectInsight: proteinRatio=0.5, isAfterEvening=true → P2 trigger
- **Pre-conditions**: proteinRatio=0.5, isAfterEvening=true, hasAutoAdjustment=false
- **Steps**:
  1. Gọi selectInsight với input={proteinRatio: 0.5, isAfterEvening: true, hasAutoAdjustment: false}
  2. Kiểm tra insight trả về
- **Expected**: Trả về P2 insight: id='p2-low-protein', type='action', color='amber'. proteinRatio < 0.7 AND isAfterEvening
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_193: selectInsight: proteinRatio=0.7 (boundary) → P2 KHÔNG trigger
- **Pre-conditions**: proteinRatio=0.7 (boundary), isAfterEvening=true
- **Steps**:
  1. Gọi selectInsight với input={proteinRatio: 0.7, isAfterEvening: true}
  2. Kiểm tra P2 có trigger không
- **Expected**: P2 KHÔNG trigger vì proteinRatio = 0.7 không < 0.7. Engine tiếp tục kiểm tra P3
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_AAI_194: selectInsight: proteinRatio=0.69 → P2 trigger
- **Pre-conditions**: proteinRatio=0.69 (ngay dưới boundary), isAfterEvening=true
- **Steps**:
  1. Gọi selectInsight với input={proteinRatio: 0.69, isAfterEvening: true}
  2. Kiểm tra P2
- **Expected**: P2 trigger vì 0.69 < 0.7
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_195: selectInsight: proteinRatio=0.5, isAfterEvening=false → P2 KHÔNG trigger
- **Pre-conditions**: proteinRatio=0.5, isAfterEvening=false
- **Steps**:
  1. Gọi selectInsight với input={proteinRatio: 0.5, isAfterEvening: false}
  2. Kiểm tra P2
- **Expected**: P2 KHÔNG trigger vì isAfterEvening=false. Dù proteinRatio < 0.7 nhưng cần cả 2 điều kiện
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_196: selectInsight: daysSinceWeightLog=3 (boundary) → P3 trigger
- **Pre-conditions**: daysSinceWeightLog=3 (boundary)
- **Steps**:
  1. Gọi selectInsight với input={daysSinceWeightLog: 3, hasAutoAdjustment: false}
  2. Kiểm tra P3
- **Expected**: P3 trigger: id='p3-weight-log', type='remind'. daysSinceWeightLog >= 3
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_AAI_197: selectInsight: daysSinceWeightLog=7 → P3 trigger
- **Pre-conditions**: daysSinceWeightLog=7
- **Steps**:
  1. Gọi selectInsight với input={daysSinceWeightLog: 7}
  2. Kiểm tra P3
- **Expected**: P3 trigger: daysSinceWeightLog >= 3
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_198: selectInsight: daysSinceWeightLog=2 → P3 KHÔNG trigger
- **Pre-conditions**: daysSinceWeightLog=2 (dưới boundary)
- **Steps**:
  1. Gọi selectInsight với input={daysSinceWeightLog: 2}
  2. Kiểm tra P3
- **Expected**: P3 KHÔNG trigger: 2 < 3. Engine tiếp tục P4
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_199: selectInsight: currentStreak=8, longestStreak=10 (gap=2) → P4 trigger
- **Pre-conditions**: currentStreak=8, longestStreak=10 → gap=2
- **Steps**:
  1. Gọi selectInsight với input={currentStreak: 8, longestStreak: 10}
  2. Kiểm tra P4
- **Expected**: P4 trigger: id='p4-streak-near-record'. currentStreak >= longestStreak - 2 (8 >= 8) AND gap ≤ 2
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_AAI_200: selectInsight: currentStreak=9, longestStreak=10 (gap=1) → P4 trigger
- **Pre-conditions**: currentStreak=9, longestStreak=10 → gap=1
- **Steps**:
  1. Gọi selectInsight với input={currentStreak: 9, longestStreak: 10}
  2. Kiểm tra P4
- **Expected**: P4 trigger: gap=1 ≤ 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_201: selectInsight: currentStreak=7, longestStreak=10 (gap=3) → P4 KHÔNG trigger
- **Pre-conditions**: currentStreak=7, longestStreak=10 → gap=3
- **Steps**:
  1. Gọi selectInsight với input={currentStreak: 7, longestStreak: 10}
  2. Kiểm tra P4
- **Expected**: P4 KHÔNG trigger: gap=3 > 2
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_202: selectInsight: hasPRToday=true → P5 trigger
- **Pre-conditions**: hasPRToday=true
- **Steps**:
  1. Gọi selectInsight với input={hasPRToday: true}
  2. Kiểm tra P5
- **Expected**: P5 trigger: id='p5-pr-today', type='celebrate', color='blue'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_AAI_203: selectInsight: hasPRToday=false → P5 KHÔNG trigger
- **Pre-conditions**: hasPRToday=false
- **Steps**:
  1. Gọi selectInsight với input={hasPRToday: false}
  2. Kiểm tra P5
- **Expected**: P5 KHÔNG trigger
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_AAI_204: selectInsight: weeklyAdherence=85 (boundary) → P6 trigger
- **Pre-conditions**: weeklyAdherence=85 (boundary)
- **Steps**:
  1. Gọi selectInsight với input={weeklyAdherence: 85}
  2. Kiểm tra P6
- **Expected**: P6 trigger: id='p6-weekly-adherence', type='praise'. weeklyAdherence >= 85
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_AAI_205: selectInsight: weeklyAdherence=100 → P6 trigger
- **Pre-conditions**: weeklyAdherence=100
- **Steps**:
  1. Gọi selectInsight với input={weeklyAdherence: 100}
  2. Kiểm tra P6
- **Expected**: P6 trigger: 100 >= 85
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_206: selectInsight: weeklyAdherence=84 → P6 KHÔNG trigger
- **Pre-conditions**: weeklyAdherence=84 (dưới boundary)
- **Steps**:
  1. Gọi selectInsight với input={weeklyAdherence: 84}
  2. Kiểm tra P6
- **Expected**: P6 KHÔNG trigger: 84 < 85
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_207: selectInsight: weightTrendCorrect=true, weeks=2 → P7 trigger
- **Pre-conditions**: weightTrendCorrect=true, weightTrendWeeks=2 (boundary)
- **Steps**:
  1. Gọi selectInsight với input={weightTrendCorrect: true, weightTrendWeeks: 2}
  2. Kiểm tra P7
- **Expected**: P7 trigger: id='p7-weight-trend', type='progress'. weeks >= 2 AND trendCorrect
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_AAI_208: selectInsight: weightTrendCorrect=true, weeks=5 → P7 trigger
- **Pre-conditions**: weightTrendCorrect=true, weightTrendWeeks=5
- **Steps**:
  1. Gọi selectInsight với input={weightTrendCorrect: true, weightTrendWeeks: 5}
  2. Kiểm tra P7
- **Expected**: P7 trigger: 5 >= 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_AAI_209: selectInsight: weightTrendCorrect=true, weeks=1 → P7 KHÔNG trigger
- **Pre-conditions**: weightTrendCorrect=true, weightTrendWeeks=1 (dưới boundary)
- **Steps**:
  1. Gọi selectInsight với input={weightTrendCorrect: true, weightTrendWeeks: 1}
  2. Kiểm tra P7
- **Expected**: P7 KHÔNG trigger: 1 < 2
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_AAI_210: selectInsight: weightTrendCorrect=false, weeks=3 → P7 KHÔNG trigger
- **Pre-conditions**: weightTrendCorrect=false, weightTrendWeeks=3
- **Steps**:
  1. Gọi selectInsight với input={weightTrendCorrect: false, weightTrendWeeks: 3}
  2. Kiểm tra P7
- **Expected**: P7 KHÔNG trigger: weightTrendCorrect=false dù weeks=3 >= 2
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

#### 4.13. AdjustmentHistory Component

##### TC_AAI_211: AdjustmentHistory renders khi có adjustment history data
- **Loại**: Positive
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Có ít nhất 1 adjustment trong history
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống phần Auto-Adjust
  3. Kiểm tra hiển thị adjustment history
- **Kết quả mong đợi**: AdjustmentHistory component hiển thị với toggle collapsed
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_212: AdjustmentHistory collapsible toggle - mặc định collapsed
- **Loại**: Positive
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: AdjustmentHistory đã render với dữ liệu
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống phần Auto-Adjust
  3. Quan sát trạng thái mặc định của AdjustmentHistory
- **Kết quả mong đợi**: Toggle ở trạng thái collapsed, danh sách adjustment bị ẩn
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_213: AdjustmentHistory expanded hiển thị danh sách các adjustment đã qua
- **Loại**: Positive
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: AdjustmentHistory đã render, có ≥ 2 adjustments trong history
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống phần Auto-Adjust
  3. Nhấn toggle để expand AdjustmentHistory
  4. Kiểm tra danh sách hiển thị
- **Kết quả mong đợi**: Danh sách các adjustment hiển thị đầy đủ với thông tin ngày, loại, trạng thái
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_214: AdjustmentHistory định dạng ngày theo locale vi-VN
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: AdjustmentHistory expanded, có adjustment với ngày 27/03/2026
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Expand AdjustmentHistory
  3. Kiểm tra định dạng ngày của adjustment
- **Kết quả mong đợi**: Ngày hiển thị theo locale vi-VN (ví dụ: "27 tháng 3, 2026"), không phải "Mar 27, 2026"
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_215: AdjustmentHistory status icon - Check circle cho "applied"
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: AdjustmentHistory expanded, có adjustment với status = "applied"
- **Các bước**:
  1. Expand AdjustmentHistory
  2. Tìm adjustment có trạng thái "applied"
  3. Kiểm tra icon hiển thị
- **Kết quả mong đợi**: Icon Check circle (✓) màu xanh lá hiển thị bên cạnh adjustment đã applied
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_216: AdjustmentHistory status icon - X circle cho "declined"
- **Loại**: Negative
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: AdjustmentHistory expanded, có adjustment với status = "declined"
- **Các bước**:
  1. Expand AdjustmentHistory
  2. Tìm adjustment có trạng thái "declined"
  3. Kiểm tra icon hiển thị
- **Kết quả mong đợi**: Icon X circle (✗) màu đỏ hiển thị bên cạnh adjustment đã declined
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_217: AdjustmentHistory trigger type badge hiển thị "auto" vs "manual"
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: AdjustmentHistory expanded, có cả adjustment auto và manual
- **Các bước**:
  1. Expand AdjustmentHistory
  2. Kiểm tra badge trigger type của từng adjustment
- **Kết quả mong đợi**: Badge "auto" (tự động) có màu khác biệt với badge "manual" (thủ công), dễ phân biệt
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_218: AdjustmentHistory trending icon với giá trị thay đổi calorie
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: AdjustmentHistory expanded, adjustment có calorie change ≠ 0
- **Các bước**:
  1. Expand AdjustmentHistory
  2. Kiểm tra trending icon và giá trị calorie change
- **Kết quả mong đợi**: Trending icon (↑/↓) hiển thị kèm giá trị thay đổi calorie (ví dụ: "+150 kcal" hoặc "-100 kcal")
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_219: AdjustmentHistory applied/declined status label styling
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: AdjustmentHistory expanded, có cả adjustment applied và declined
- **Các bước**:
  1. Expand AdjustmentHistory
  2. So sánh styling của label "Đã áp dụng" và "Đã từ chối"
- **Kết quả mong đợi**: Label "Đã áp dụng" có màu xanh lá/success, label "Đã từ chối" có màu đỏ/danger, đủ tương phản để phân biệt
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_220: AdjustmentHistory aria-expanded attribute trên toggle
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: AdjustmentHistory đã render
- **Các bước**:
  1. Inspect toggle button của AdjustmentHistory
  2. Kiểm tra attribute aria-expanded khi collapsed
  3. Nhấn toggle để expand
  4. Kiểm tra attribute aria-expanded khi expanded
- **Kết quả mong đợi**: aria-expanded="false" khi collapsed, aria-expanded="true" khi expanded
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_221: AdjustmentHistory dark mode contrast và readability
- **Loại**: Positive
- **Độ ưu tiên**: P2
- **Tiền điều kiện**: Dark mode được bật, AdjustmentHistory có dữ liệu
- **Các bước**:
  1. Bật dark mode
  2. Mở Dashboard tab (Tổng quan)
  3. Expand AdjustmentHistory
  4. Kiểm tra contrast và readability
- **Kết quả mong đợi**: Text, icons, badges đều đọc được rõ ràng trên nền dark, contrast ratio ≥ 4.5:1 (WCAG AA)
- **Kết quả test thực tế**: *(Chưa test)*

##### TC_AAI_222: AdjustmentHistory empty state khi không có adjustment history
- **Loại**: Negative
- **Độ ưu tiên**: P1
- **Tiền điều kiện**: Không có adjustment nào trong history (user mới hoặc đã xóa)
- **Các bước**:
  1. Mở Dashboard tab (Tổng quan)
  2. Cuộn xuống phần Auto-Adjust
  3. Kiểm tra AdjustmentHistory khi không có dữ liệu
- **Kết quả mong đợi**: Hiển thị empty state phù hợp (ví dụ: "Chưa có lịch sử điều chỉnh") thay vì component trống hoặc lỗi
- **Kết quả test thực tế**: *(Chưa test)*

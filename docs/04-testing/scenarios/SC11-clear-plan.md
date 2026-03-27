# Scenario 11: Clear Plan

**Version:** 2.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Clear Plan cho phép xóa meal plan theo 3 scope: Day (1 ngày, 3 meals), Week (Mon-Sun, 21 slots), Month (toàn bộ tháng). Confirmation required. Data xóa khỏi localStorage. Dishes/Ingredients không bị xóa (chỉ xóa plan assignments).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| ClearPlanModal | modals/ClearPlanModal.tsx | UI modal |
| CalendarTab | CalendarTab.tsx | Context |
| useMealPlans | hooks/ | Plan state |

## Luồng nghiệp vụ

1. User clicks "Clear Plan" on calendar
2. Modal opens: select scope (Day/Week/Month)
3. Confirmation dialog with warning
4. Confirm → plan data removed → calendar refreshes
5. Nutrition zeroes for cleared dates

## Quy tắc nghiệp vụ

1. Day: clear breakfast + lunch + dinner for selected date
2. Week: clear Mon-Sun of current week
3. Month: clear all days in current calendar month
4. Only plan assignments removed — dishes/ingredients preserved
5. Cannot undo (unless undo feature implemented)
6. Grocery list recalculated after clear

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_CL_01 | Clear Plan button visible | Positive | P1 | — |
| TC_CL_02 | Click → modal opens | Positive | P0 | — |
| TC_CL_03 | Scope: Day option | Positive | P1 | — |
| TC_CL_04 | Scope: Week option | Positive | P1 | — |
| TC_CL_05 | Scope: Month option | Positive | P1 | — |
| TC_CL_06 | Day scope selected by default | Positive | P2 | — |
| TC_CL_07 | Confirmation warning message | Positive | P1 | — |
| TC_CL_08 | Confirm button | Positive | P1 | — |
| TC_CL_09 | Cancel button | Positive | P1 | — |
| TC_CL_10 | Clear Day → 3 meals removed | Positive | P0 | — |
| TC_CL_11 | Clear Day → breakfast removed | Positive | P1 | — |
| TC_CL_12 | Clear Day → lunch removed | Positive | P1 | — |
| TC_CL_13 | Clear Day → dinner removed | Positive | P1 | — |
| TC_CL_14 | Clear Day → only target day affected | Positive | P0 | — |
| TC_CL_15 | Clear Week → 7 days cleared | Positive | P0 | — |
| TC_CL_16 | Clear Week → Mon-Sun scope | Positive | P1 | — |
| TC_CL_17 | Clear Week → only current week | Positive | P0 | — |
| TC_CL_18 | Clear Month → all month days | Positive | P0 | — |
| TC_CL_19 | Clear Month → only current month | Positive | P0 | — |
| TC_CL_20 | Cancel → data preserved | Positive | P0 | — |
| TC_CL_21 | Calendar refreshes after clear | Positive | P1 | — |
| TC_CL_22 | Nutrition zeroes after clear | Positive | P1 | — |
| TC_CL_23 | Grocery list updated after clear | Positive | P1 | — |
| TC_CL_24 | Success notification | Positive | P1 | — |
| TC_CL_25 | Modal closes after clear | Positive | P1 | — |
| TC_CL_26 | Dishes NOT deleted (only assignments) | Positive | P0 | — |
| TC_CL_27 | Ingredients NOT deleted | Positive | P0 | — |
| TC_CL_28 | Clear already empty day | Edge | P2 | — |
| TC_CL_29 | Clear already empty week | Edge | P2 | — |
| TC_CL_30 | Clear already empty month | Edge | P2 | — |
| TC_CL_31 | Clear Day partial (only breakfast has data) | Edge | P2 | — |
| TC_CL_32 | Clear Week partial (3/7 days have data) | Edge | P2 | — |
| TC_CL_33 | Clear Month partial (10/30 days have data) | Edge | P2 | — |
| TC_CL_34 | Multiple clears in sequence | Positive | P2 | — |
| TC_CL_35 | Clear → then add → then clear again | Edge | P2 | — |
| TC_CL_36 | Clear Day with 10 dishes per meal | Boundary | P2 | — |
| TC_CL_37 | Clear Week with full 21 slots | Boundary | P2 | — |
| TC_CL_38 | Clear Month with 90 slots filled | Boundary | P2 | — |
| TC_CL_39 | Performance: clear large month data | Boundary | P2 | — |
| TC_CL_40 | Clear → reload → data gone | Positive | P0 | — |
| TC_CL_41 | localStorage updated after clear | Positive | P1 | — |
| TC_CL_42 | Clear → export → verify no plan data | Positive | P2 | — |
| TC_CL_43 | Clear → cloud sync update | Positive | P2 | — |
| TC_CL_44 | Clear today | Positive | P1 | — |
| TC_CL_45 | Clear past date | Positive | P2 | — |
| TC_CL_46 | Clear future date | Positive | P2 | — |
| TC_CL_47 | Clear current week | Positive | P1 | — |
| TC_CL_48 | Clear last week | Positive | P2 | — |
| TC_CL_49 | Clear next week | Positive | P2 | — |
| TC_CL_50 | Clear current month | Positive | P1 | — |
| TC_CL_51 | Clear February (28 days) | Positive | P2 | — |
| TC_CL_52 | Clear February leap year (29 days) | Edge | P2 | — |
| TC_CL_53 | Clear December → no affect January | Positive | P2 | — |
| TC_CL_54 | Clear January → no affect December | Positive | P2 | — |
| TC_CL_55 | Week boundary: Mon of this week to Sun | Positive | P1 | — |
| TC_CL_56 | Week cross-month (e.g., Jan 29 - Feb 4) | Edge | P2 | — |
| TC_CL_57 | Month with 28 days | Positive | P2 | — |
| TC_CL_58 | Month with 30 days | Positive | P2 | — |
| TC_CL_59 | Month with 31 days | Positive | P2 | — |
| TC_CL_60 | Dark mode modal | Positive | P2 | — |
| TC_CL_61 | i18n modal labels | Positive | P2 | — |
| TC_CL_62 | Mobile modal layout | Positive | P2 | — |
| TC_CL_63 | Desktop modal layout | Positive | P2 | — |
| TC_CL_64 | Modal backdrop close | Positive | P2 | — |
| TC_CL_65 | Modal Escape close | Positive | P2 | — |
| TC_CL_66 | Screen reader | Positive | P3 | — |
| TC_CL_67 | Keyboard navigation | Positive | P3 | — |
| TC_CL_68 | Touch radio buttons mobile | Positive | P2 | — |
| TC_CL_69 | Warning icon/color in confirmation | Positive | P2 | — |
| TC_CL_70 | Destructive action red button | Positive | P2 | — |
| TC_CL_71 | Double confirm for month clear | Positive | P2 | — |
| TC_CL_72 | Scope count display ("Clear 21 meals?") | Positive | P2 | — |
| TC_CL_73 | Clear during unsaved modal elsewhere | Edge | P2 | — |
| TC_CL_74 | Clear then undo (if undo exists) | Positive | P3 | — |
| TC_CL_75 | Clear then copy plan to cleared date | Positive | P2 | — |
| TC_CL_76 | Clear then apply template | Positive | P2 | — |
| TC_CL_77 | Clear then AI suggest | Positive | P2 | — |
| TC_CL_78 | Clear affects only plans, not settings | Positive | P1 | — |
| TC_CL_79 | Clear affects only plans, not goals | Positive | P1 | — |
| TC_CL_80 | Rapid clear-add-clear cycles | Edge | P2 | — |
| TC_CL_81 | Clear with concurrent cloud sync | Edge | P2 | — |
| TC_CL_82 | Clear → immediate re-plan | Positive | P2 | — |
| TC_CL_83 | Clear → grocery list empty | Positive | P1 | — |
| TC_CL_84 | Clear week → next week unaffected | Positive | P1 | — |
| TC_CL_85 | Clear month → next month unaffected | Positive | P1 | — |
| TC_CL_86 | Notification shows scope detail | Positive | P2 | — |
| TC_CL_87 | Loading state during clear | Positive | P3 | — |
| TC_CL_88 | Error handling if clear fails | Negative | P2 | — |
| TC_CL_89 | Partial clear failure recovery | Edge | P2 | — |
| TC_CL_90 | Clear with corrupted localStorage | Edge | P2 | — |
| TC_CL_91 | Clear → template still available | Positive | P1 | — |
| TC_CL_92 | Clear → dishes still in management | Positive | P1 | — |
| TC_CL_93 | Clear → ingredients still available | Positive | P1 | — |
| TC_CL_94 | Clear custom date range | Positive | P3 | — |
| TC_CL_95 | Clear specific meal type only (breakfast) | Positive | P3 | — |
| TC_CL_96 | Clear with filter (e.g., only dishes > 500 cal) | Positive | P3 | — |
| TC_CL_97 | Selective clear (choose which meals to clear) | Positive | P3 | — |
| TC_CL_98 | Confirm text shows exact scope | Positive | P2 | — |
| TC_CL_99 | Multiple scope clear in sequence (day → week → month) | Positive | P2 | — |
| TC_CL_100 | Clear → verify localStorage size reduced | Positive | P2 | — |
| TC_CL_101 | Animation on clear | Positive | P3 | — |
| TC_CL_102 | Clear feedback: "X meals removed" | Positive | P2 | — |
| TC_CL_103 | Undo timer countdown | Positive | P3 | — |
| TC_CL_104 | Clear all months (entire history) | Boundary | P3 | — |
| TC_CL_105 | Stress: clear → refill → clear 10 cycles | Boundary | P3 | — |
| TC_CL_106 | Bộ lọc bữa ăn: chọn chỉ bữa sáng, xóa → chỉ breakfast bị xóa, lunch và dinner giữ nguyên | Positive | P0 | — |
| TC_CL_107 | Bộ lọc bữa ăn: chọn chỉ bữa trưa, xóa → chỉ lunch bị xóa, breakfast và dinner giữ nguyên | Positive | P0 | — |
| TC_CL_108 | Bộ lọc bữa ăn: chọn chỉ bữa tối, xóa → chỉ dinner bị xóa, breakfast và lunch giữ nguyên | Positive | P0 | — |
| TC_CL_109 | Bộ lọc bữa ăn: chọn sáng+trưa, xóa → breakfast+lunch bị xóa, dinner giữ nguyên | Positive | P0 | — |
| TC_CL_110 | Bộ lọc bữa ăn: chọn sáng+tối, xóa → breakfast+dinner bị xóa, lunch giữ nguyên | Positive | P0 | — |
| TC_CL_111 | Bộ lọc bữa ăn: chọn trưa+tối, xóa → lunch+dinner bị xóa, breakfast giữ nguyên | Positive | P0 | — |
| TC_CL_112 | Bộ lọc bữa ăn: chọn cả 3 bữa → xóa toàn bộ ngày (tương đương clear day) | Positive | P0 | — |
| TC_CL_113 | Bộ lọc bữa ăn: bỏ chọn tất cả → không cho phép xóa (minimum 1 bữa phải được chọn) | Negative | P0 | — |
| TC_CL_114 | Bộ lọc bữa ăn: toggle nhanh liên tục → UI phản hồi chính xác, không bị lag | Edge | P1 | — |
| TC_CL_115 | Bộ lọc meal + scope Week → xóa đúng bữa được chọn cho 7 ngày | Positive | P0 | — |
| TC_CL_116 | Bộ lọc meal + scope Month → xóa đúng bữa được chọn cho toàn bộ tháng | Positive | P0 | — |
| TC_CL_117 | Bộ lọc meal mặc định: cả 3 bữa được chọn khi modal mở | Positive | P1 | — |
| TC_CL_118 | Visual state bộ lọc: nút được chọn hiển thị active, nút không chọn hiển thị inactive | Positive | P1 | — |
| TC_CL_119 | Bộ lọc meal persist khi đổi scope (Day→Week→Month) — giữ nguyên bữa đã chọn | Positive | P1 | — |
| TC_CL_120 | Số lượng meal hiển thị cập nhật theo bộ lọc khi toggle bữa ăn | Positive | P1 | — |
| TC_CL_121 | Hiển thị phạm vi: Scope Day hiển thị "1 ngày, X bữa ăn" | Positive | P1 | — |
| TC_CL_122 | Hiển thị phạm vi: Scope Week hiển thị "7 ngày, X bữa ăn" | Positive | P1 | — |
| TC_CL_123 | Hiển thị phạm vi: Scope Month hiển thị "N ngày, X bữa ăn" (N=28/29/30/31 tùy tháng) | Positive | P1 | — |
| TC_CL_124 | Số bữa ăn hiển thị thay đổi khi toggle meal filter (ví dụ: 3→2→1) | Positive | P1 | — |
| TC_CL_125 | Day scope chỉ 1 bữa sáng được chọn → hiển thị "1 ngày, 1 bữa ăn" | Positive | P2 | — |
| TC_CL_126 | Week scope 2 bữa được chọn → hiển thị "7 ngày, 14 bữa ăn" | Positive | P2 | — |
| TC_CL_127 | Month scope (31 ngày) 3 bữa → hiển thị "31 ngày, 93 bữa ăn" | Positive | P2 | — |
| TC_CL_128 | Danh sách ngày bị ảnh hưởng có nút expand/collapse | Positive | P2 | — |
| TC_CL_129 | Click expand → hiện tất cả ngày trong scope hiện tại | Positive | P2 | — |
| TC_CL_130 | Collapse danh sách ngày → ẩn chi tiết, chỉ hiện tóm tắt | Positive | P2 | — |
| TC_CL_131 | Ngày trong danh sách hiển thị đúng format (dd/mm/yyyy) | Positive | P2 | — |
| TC_CL_132 | Scope Day → danh sách mở rộng chỉ hiện 1 ngày (selectedDate) | Positive | P2 | — |
| TC_CL_133 | Scope Week → danh sách mở rộng hiện 7 ngày (Mon-Sun) đúng thứ tự | Positive | P2 | — |
| TC_CL_134 | Scope Month → danh sách mở rộng hiện tất cả ngày trong tháng hiện tại | Positive | P2 | — |
| TC_CL_135 | Highlight ngày có dữ liệu (có plan) khác biệt với ngày trống (không có plan) | Positive | P2 | — |
| TC_CL_136 | Undo toast: xóa Day → undo toast hiện lên ngay sau khi xóa | Positive | P0 | — |
| TC_CL_137 | Undo toast hiển thị đúng scope và số lượng bữa ăn đã xóa | Positive | P1 | — |
| TC_CL_138 | Click Undo trên toast → dữ liệu phục hồi hoàn toàn về trạng thái trước khi xóa | Positive | P0 | — |
| TC_CL_139 | Undo timer countdown hiển thị đếm ngược 10 giây | Positive | P1 | — |
| TC_CL_140 | Toast tự đóng sau khi hết timeout (10 giây) → xóa vĩnh viễn | Positive | P0 | — |
| TC_CL_141 | Không click Undo trong 10 giây → dữ liệu bị xóa vĩnh viễn, không thể khôi phục | Positive | P0 | — |
| TC_CL_142 | Undo sau xóa Week → toàn bộ 7 ngày phục hồi đúng dữ liệu gốc | Positive | P0 | — |
| TC_CL_143 | Undo sau xóa Month → toàn bộ tháng phục hồi đúng dữ liệu gốc | Positive | P0 | — |
| TC_CL_144 | Xóa → Undo → calendar hiện lại đúng indicators cho các ngày đã phục hồi | Positive | P1 | — |
| TC_CL_145 | Xóa → Undo → nutrition values phục hồi đúng (calories, protein, carbs, fat) | Positive | P1 | — |
| TC_CL_146 | Xóa → Undo → grocery list phục hồi lại các nguyên liệu đã bị xóa | Positive | P1 | — |
| TC_CL_147 | Undo toast z-index: toast không bị che bởi modal hoặc các elements UI khác | Positive | P2 | — |
| TC_CL_148 | Undo khi đã navigate sang ngày khác → dữ liệu ngày cũ vẫn phục hồi đúng | Edge | P1 | — |
| TC_CL_149 | Undo khi đã mở modal khác (ví dụ: AddDish modal) → undo vẫn hoạt động | Edge | P2 | — |
| TC_CL_150 | Multiple clear liên tiếp → chỉ undo được lần xóa cuối cùng | Edge | P1 | — |
| TC_CL_151 | Xóa partial (chỉ 1 bữa) → Undo → chỉ bữa đó được phục hồi, các bữa khác không đổi | Positive | P1 | — |
| TC_CL_152 | Toast animation: slide in từ dưới và slide out khi hết thời gian | Positive | P3 | — |
| TC_CL_153 | Toast vị trí đúng: hiển thị ở bottom center màn hình | Positive | P2 | — |
| TC_CL_154 | Undo với dữ liệu lớn (100+ dishes trong plan) → phục hồi hoàn chỉnh, không mất data | Boundary | P1 | — |
| TC_CL_155 | Undo → localStorage cập nhật lại đúng giá trị gốc sau khi phục hồi | Positive | P0 | — |
| TC_CL_156 | Xác thực nutrition: xóa toàn bộ ngày → calories hiển thị 0 | Positive | P0 | — |
| TC_CL_157 | Xác thực nutrition: xóa toàn bộ ngày → protein/carbs/fat đều hiển thị 0 | Positive | P0 | — |
| TC_CL_158 | Xác thực nutrition: xóa 1 bữa → nutrition giảm đúng giá trị dinh dưỡng của bữa đó | Positive | P0 | — |
| TC_CL_159 | Xác thực nutrition: xóa 2 bữa → nutrition chỉ còn giá trị của bữa còn lại | Positive | P0 | — |
| TC_CL_160 | Calendar dot indicator biến mất sau xóa toàn bộ ngày | Positive | P1 | — |
| TC_CL_161 | Calendar dot vẫn còn nếu chỉ xóa 1 bữa (còn 2 bữa có dữ liệu) | Positive | P1 | — |
| TC_CL_162 | Week view cập nhật đúng sau khi clear week (tất cả 7 ngày hiện empty) | Positive | P1 | — |
| TC_CL_163 | Month view cập nhật đúng sau khi clear month (tất cả ngày hiện empty) | Positive | P1 | — |
| TC_CL_164 | Ngày bị xóa toàn bộ hiển thị empty state (ví dụ: "Chưa có kế hoạch") | Positive | P1 | — |
| TC_CL_165 | Ngày không bị xóa (ngoài scope) giữ nguyên indicator và dữ liệu | Positive | P0 | — |
| TC_CL_166 | Clear Day → nutrition bar chart reset về 0 cho ngày đó | Positive | P1 | — |
| TC_CL_167 | Clear Week → nutrition summary tuần cập nhật (tổng calories tuần giảm) | Positive | P1 | — |
| TC_CL_168 | Clear Month → monthly nutrition report cập nhật phản ánh dữ liệu đã xóa | Positive | P1 | — |
| TC_CL_169 | Navigation sang ngày đã xóa → hiện empty state, không hiển thị dữ liệu cũ | Positive | P1 | — |
| TC_CL_170 | Nutrition goal so sánh sau clear: hiển thị dưới target (deficit indicator) | Positive | P2 | — |
| TC_CL_171 | Plan indicator icon thay đổi: full → partial → empty tùy theo mức xóa | Positive | P2 | — |
| TC_CL_172 | Swipe giữa các ngày sau clear → hiển thị đúng data (ngày xóa = empty, ngày khác = giữ nguyên) | Positive | P2 | — |
| TC_CL_173 | Mini calendar dots cập nhật realtime ngay sau khi clear (không cần refresh) | Positive | P1 | — |
| TC_CL_174 | Nutrition chart (biểu đồ) cập nhật đúng sau clear — cột/thanh giảm về 0 | Positive | P2 | — |
| TC_CL_175 | Calorie deficit warning hiển thị sau khi clear nhiều bữa (tổng calories < daily goal) | Positive | P2 | — |
| TC_CL_176 | Tương tác nhanh: xóa Day liên tục 5 lần cho 5 ngày khác nhau → mỗi ngày xóa đúng | Edge | P1 | — |
| TC_CL_177 | Tương tác nhanh: xóa ngày → thêm bữa mới → xóa lại ngay → lần xóa thứ 2 xóa đúng data mới | Edge | P1 | — |
| TC_CL_178 | Tương tác nhanh: xóa ngày → apply template ngay → template áp dụng đúng trên ngày trống | Positive | P1 | — |
| TC_CL_179 | Tương tác nhanh: xóa ngày → AI suggest ngay → suggestion dựa trên ngày trống | Positive | P2 | — |
| TC_CL_180 | Concurrent: 2 tab trình duyệt mở cùng lúc → xóa ở tab 1 → tab 2 phản ánh thay đổi khi refresh | Edge | P2 | — |
| TC_CL_181 | Concurrent: xóa plan trong khi đang export dữ liệu → export hoàn tất hoặc báo lỗi rõ ràng | Edge | P2 | — |
| TC_CL_182 | Concurrent: xóa plan trong khi đang import dữ liệu → không gây conflict, import hoàn tất | Edge | P2 | — |
| TC_CL_183 | Tương tác nhanh: xóa rồi reload trang ngay lập tức → data đã xóa không còn sau reload | Positive | P0 | — |
| TC_CL_184 | Tương tác nhanh: xóa rồi đóng app → mở lại → data đã xóa không còn (persistent) | Positive | P0 | — |
| TC_CL_185 | Network offline → thực hiện xóa → data local cập nhật đúng (offline-first) | Edge | P1 | — |
| TC_CL_186 | Xóa khi localStorage gần đầy → clear thành công và giải phóng dung lượng | Edge | P2 | — |
| TC_CL_187 | Rapid scope switching: Day→Week→Month→Day liên tục rồi xóa → xóa đúng scope cuối cùng | Edge | P1 | — |
| TC_CL_188 | Xóa với modal animation chưa hoàn tất (click nhanh) → không gây crash hoặc duplicate clear | Edge | P2 | — |
| TC_CL_189 | Double-click nút xác nhận xóa → chỉ thực hiện xóa 1 lần duy nhất | Edge | P0 | — |
| TC_CL_190 | Race condition: xóa plan + save plan cùng lúc → một trong hai thành công, không corrupt data | Edge | P1 | — |
| TC_CL_191 | Xóa rồi nhấn back button trình duyệt → modal đã đóng, không trigger xóa lại | Positive | P2 | — |
| TC_CL_192 | Xóa rồi navigate sang Settings tab → Settings không bị ảnh hưởng | Positive | P2 | — |
| TC_CL_193 | Xóa rồi navigate sang Grocery tab → grocery list đã cập nhật (loại bỏ items đã xóa) | Positive | P1 | — |
| TC_CL_194 | Long press nút xóa trên mobile → không trigger thêm action ngoài ý muốn | Edge | P2 | — |
| TC_CL_195 | Spam click Cancel rồi Confirm nhanh → hành vi đúng (cancel hoặc confirm, không cả hai) | Edge | P1 | — |
| TC_CL_196 | Validation: localStorage bị corrupted → clear xử lý gracefully, hiện thông báo lỗi | Negative | P1 | — |
| TC_CL_197 | Validation: DayPlan data format sai (thiếu field) → clear không crash, xử lý an toàn | Negative | P1 | — |
| TC_CL_198 | Validation: selectedDate null → modal không mở, không throw error | Negative | P0 | — |
| TC_CL_199 | Validation: selectedDate format sai (không phải ISO date) → fallback hoặc hiện error message | Negative | P1 | — |
| TC_CL_200 | Validation: onClear callback throw error → UI hiện error message, không crash toàn app | Negative | P0 | — |
| TC_CL_201 | Validation: clear với dayPlans rỗng ([]) → no-op, hiện thông báo "Không có dữ liệu để xóa" | Negative | P1 | — |
| TC_CL_202 | Validation: clear scope không hợp lệ (không phải day/week/month) → fallback về Day scope | Negative | P2 | — |
| TC_CL_203 | Performance: memory leak check — mở/đóng ClearPlanModal 50 lần → memory không tăng liên tục | Boundary | P1 | — |
| TC_CL_204 | Performance: clear response time < 200ms cho Day scope (3 meals) | Boundary | P1 | — |
| TC_CL_205 | Performance: clear response time < 500ms cho Month scope với full data (93 meals) | Boundary | P1 | — |
| TC_CL_206 | Performance: clear 365 ngày liên tục (full year) → hoàn tất không bị timeout hoặc freeze | Boundary | P2 | — |
| TC_CL_207 | Sync: IndexedDB (nếu dùng) đồng bộ đúng sau clear — không còn dữ liệu đã xóa | Positive | P2 | — |
| TC_CL_208 | Verification: clear → export JSON → file export không chứa dữ liệu đã xóa | Positive | P2 | — |
| TC_CL_209 | Accessibility: VoiceOver đọc đúng confirmation text ("Bạn có chắc muốn xóa...") | Positive | P2 | — |
| TC_CL_210 | Accessibility: clear modal focus trap — Tab key không thoát ra ngoài modal | Positive | P2 | — |

---

## Chi tiết Test Cases (Grouped)

##### TC_CL_01–27: Luồng xóa plan cốt lõi (Core Clear Flow)
- Hiển thị button, mở modal, chọn scope (Day/Week/Month), xác nhận/hủy, xóa dữ liệu, side effects

##### TC_CL_28–39: Trường hợp biên và ranh giới (Edge Cases & Boundaries)
- Dữ liệu trống, dữ liệu một phần, dữ liệu lớn, hiệu suất

##### TC_CL_40–59: Lưu trữ và xử lý ngày tháng (Persistence & Date Handling)
- localStorage, export, sync, các edge case ngày tháng (hôm nay, quá khứ, tương lai, tháng, năm nhuận, cross-boundary)

##### TC_CL_60–72: Giao diện và trải nghiệm người dùng (UI/UX)
- Dark mode, i18n, responsive, modal, accessibility, UX hành động nguy hiểm

##### TC_CL_73–93: Tích hợp liên module (Integration)
- Clear + copy, clear + template, clear + AI, settings/goals giữ nguyên, concurrent sync

##### TC_CL_94–105: Tính năng nâng cao (Advanced Features)
- Phạm vi tùy chỉnh, lọc theo loại bữa, xóa chọn lọc, undo, stress testing

##### TC_CL_106–120: Bộ lọc bữa ăn (Meal Filter Toggles)
- Xóa chọn lọc theo bữa sáng/trưa/tối, kết hợp 2 bữa, cả 3 bữa, tối thiểu 1 bữa, visual state, persist khi đổi scope, cập nhật số lượng

##### TC_CL_121–135: Hiển thị phạm vi và đếm (Scope Display & Counts)
- Hiển thị số ngày/bữa ăn theo scope, danh sách ngày expand/collapse, format ngày tháng, highlight ngày có/không dữ liệu

##### TC_CL_136–155: Undo Toast và Phục hồi (Undo Toast & Recovery)
- Undo toast hiển thị, countdown timer, phục hồi dữ liệu hoàn chỉnh (calendar, nutrition, grocery), toast z-index, undo sau navigate, multiple clear undo, toast animation, localStorage phục hồi

##### TC_CL_156–175: Xác thực Nutrition và Calendar sau Clear (Nutrition & Calendar Validation)
- Calories/protein/carbs/fat về 0 sau xóa, dot indicator cập nhật, week/month view cập nhật, empty state, nutrition bar/chart reset, goal comparison, plan indicator icon, realtime update

##### TC_CL_176–195: Tương tác nhanh và Concurrent (Rapid Interaction & Concurrency)
- Xóa liên tục, xóa+thêm+xóa, xóa+template, xóa+AI suggest, multi-tab, offline, rapid scope switch, double-click prevention, race condition, navigation sau xóa

##### TC_CL_196–210: Validation và Error Handling nâng cao (Advanced Validation & Error Handling)
- localStorage corrupted, data format sai, selectedDate null/invalid, callback error, dayPlans rỗng, scope không hợp lệ, memory leak, performance benchmarks, IndexedDB sync, JSON export verify, accessibility (VoiceOver, focus trap)

---

## Đề xuất Cải tiến

### Đề xuất 1: Undo Clear with Timer
- **Vấn đề hiện tại**: Clear is irreversible. Accidental clear = frustration.
- **Giải pháp đề xuất**: 10-second undo toast after clear. Snapshot data before clearing. "Undo" restores.
- **Lý do chi tiết**: Irreversible actions cause anxiety. Undo reduces support requests 80%.
- **Phần trăm cải thiện**: Accidental data loss -95%, User confidence +50%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 2: Selective Clear
- **Vấn đề hiện tại**: All-or-nothing scope. Can't clear just breakfast or just one meal.
- **Giải pháp đề xuất**: Checkbox per meal slot. User chooses exactly which meals to clear.
- **Lý do chi tiết**: Granular control = fewer accidental clears. User keeps what they want.
- **Phần trăm cải thiện**: Clear precision +80%, Accidental clearing -60%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Clear Summary Preview
- **Vấn đề hiện tại**: "Are you sure?" without showing what will be deleted.
- **Giải pháp đề xuất**: Preview: "5 meals, 12 dishes will be removed" with expandable list.
- **Lý do chi tiết**: Informed decisions > blind confirmations. Preview reduces errors 70%.
- **Phần trăm cải thiện**: Decision quality +70%, Accidental clears -80%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 4: Archive Instead of Delete
- **Vấn đề hiện tại**: Clear permanently removes data. No history.
- **Giải pháp đề xuất**: "Archive" option: moves cleared plans to archive. Restorable later. History preserved.
- **Lý do chi tiết**: Users want clean calendar but don't want to lose history. Archive = best of both.
- **Phần trăm cải thiện**: Data preservation +90%, User peace of mind +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 5: Smart Clear Suggestions
- **Vấn đề hiện tại**: User manually decides scope. No guidance.
- **Giải pháp đề xuất**: "Clear past plans" quick action. Auto-suggest clearing old data (>30 days) to free space.
- **Lý do chi tiết**: Most users want to clear past, not future. Smart suggestions save decision time.
- **Phần trăm cải thiện**: Clear efficiency +40%, Storage management +30%
- **Mức độ ưu tiên**: Low | **Effort**: S

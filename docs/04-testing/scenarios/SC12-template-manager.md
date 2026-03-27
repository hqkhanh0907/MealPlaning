# Scenario 12: Template Manager

**Version:** 2.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Template Manager cho phép user quản lý meal plan templates. Templates là immutable snapshots của meal plans. User có thể list, preview, apply, rename, delete templates. Apply template overwrites target day/week. Templates stored in localStorage với IndexedDB sync backup.

### Source Code References

- **TemplateManager.tsx** (`src/components/modals/TemplateManager.tsx`): UI modal hiển thị danh sách templates. Props: `templates: MealTemplate[]`, `dishes: Dish[]`, `onApply`, `onDelete`, `onRename`, `onClose`. Hỗ trợ search case-insensitive, tag filter multi-select, inline rename (trim, min length > 0, Enter/Escape), dish preview với emoji (🌅🌤️🌙), empty state, no-results state. Localization qua `getLocalizedField(d.name, lang)`.
- **mealTemplateStore.ts** (`src/store/mealTemplateStore.ts`): Zustand store quản lý state. Actions: `saveTemplate`, `deleteTemplate`, `renameTemplate`, `applyTemplate`, `hydrate`, `loadTemplates`, `saveTemplateToDb`, `deleteTemplateFromDb`. Persist localStorage `'meal-templates'` + IndexedDB sync.
- **MealTemplate interface**: `{ id: string, name: string, breakfastDishIds: string[], lunchDishIds: string[], dinnerDishIds: string[], createdAt: string, tags?: string[] }`

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| TemplateManager | modals/TemplateManager.tsx | UI modal quản lý templates |
| useMealTemplate | hooks/useMealTemplate.ts | Template logic hook |
| mealTemplateStore | store/mealTemplateStore.ts | Zustand store (CRUD + persist) |

## Luồng nghiệp vụ

1. User clicks "Templates" button
2. Modal shows saved templates list (search + tag filter)
3. Preview: click template → see contents (breakfast 🌅, lunch 🌤️, dinner 🌙)
4. Apply: select template + target date → overwrite confirm → apply
5. Delete: remove template permanently (localStorage + IndexedDB)
6. Rename: inline edit → trim → validate → save

## Quy tắc nghiệp vụ

1. Templates are immutable snapshots (editing plan after save doesn't change template)
2. Apply = overwrite target date(s) với confirmation nếu ngày đã có data
3. Template contains: name, breakfastDishIds[], lunchDishIds[], dinnerDishIds[], createdAt, tags?[]
4. Name required, unique among templates, trim whitespace, min length > 0
5. Delete is permanent (cả localStorage và IndexedDB)
6. Apply creates plan assignments referencing current dishes
7. Search: case-insensitive partial name matching
8. Tag filter: multi-tag với "Tất cả" option, tags auto-collected và sorted alphabetically
9. Dish count = breakfast + lunch + dinner IDs length
10. Storage: localStorage 'meal-templates' + IndexedDB sync backup

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_TM_01 | Templates button visible | Positive | P1 | — |
| TC_TM_02 | Click → modal opens | Positive | P0 | — |
| TC_TM_03 | Empty state (no templates) | Positive | P1 | — |
| TC_TM_04 | Templates list display | Positive | P1 | — |
| TC_TM_05 | Template card: name | Positive | P1 | — |
| TC_TM_06 | Template card: meal count | Positive | P2 | — |
| TC_TM_07 | Template card: created date | Positive | P2 | — |
| TC_TM_08 | Preview template | Positive | P1 | — |
| TC_TM_09 | Preview shows meals detail | Positive | P1 | — |
| TC_TM_10 | Preview shows nutrition summary | Positive | P2 | — |
| TC_TM_11 | Apply button | Positive | P1 | — |
| TC_TM_12 | Apply → target date picker | Positive | P1 | — |
| TC_TM_13 | Apply → target has data → overwrite confirm | Positive | P0 | — |
| TC_TM_14 | Confirm apply → plan created | Positive | P0 | — |
| TC_TM_15 | Cancel apply → no changes | Positive | P1 | — |
| TC_TM_16 | Applied plan in calendar | Positive | P0 | — |
| TC_TM_17 | Applied plan nutrition correct | Positive | P1 | — |
| TC_TM_18 | Delete template button | Positive | P1 | — |
| TC_TM_19 | Delete confirmation | Positive | P1 | — |
| TC_TM_20 | Confirm delete → removed | Positive | P0 | — |
| TC_TM_21 | Cancel delete → preserved | Positive | P1 | — |
| TC_TM_22 | Rename template | Positive | P1 | — |
| TC_TM_23 | Rename saves | Positive | P1 | — |
| TC_TM_24 | Rename duplicate → error | Negative | P1 | — |
| TC_TM_25 | Modal closes after apply | Positive | P1 | — |
| TC_TM_26 | Success notification | Positive | P1 | — |
| TC_TM_27 | Multiple templates listed | Positive | P1 | — |
| TC_TM_28 | Sort templates by name | Positive | P2 | — |
| TC_TM_29 | Sort templates by date | Positive | P2 | — |
| TC_TM_30 | Search templates | Positive | P2 | — |
| TC_TM_31 | Template with 1 meal | Positive | P2 | — |
| TC_TM_32 | Template with 3 meals (full day) | Positive | P1 | — |
| TC_TM_33 | Template with 21 meals (full week) | Positive | P1 | — |
| TC_TM_34 | Template with 0 meals (empty) | Edge | P2 | — |
| TC_TM_35 | Template immutability: edit plan → template unchanged | Positive | P0 | — |
| TC_TM_36 | Template immutability: edit dish → template unchanged | Positive | P0 | — |
| TC_TM_37 | Template with deleted dish → graceful handling | Edge | P1 | — |
| TC_TM_38 | Template with deleted ingredient → handling | Edge | P1 | — |
| TC_TM_39 | Apply template → dishes still referenced | Positive | P1 | — |
| TC_TM_40 | Apply template → ingredients referenced | Positive | P1 | — |
| TC_TM_41 | Apply to today | Positive | P1 | — |
| TC_TM_42 | Apply to future date | Positive | P2 | — |
| TC_TM_43 | Apply to past date | Positive | P2 | — |
| TC_TM_44 | Apply across months | Edge | P2 | — |
| TC_TM_45 | Apply week template to Mon start | Positive | P1 | — |
| TC_TM_46 | Apply day template to specific date | Positive | P1 | — |
| TC_TM_47 | 1 template in list | Positive | P2 | — |
| TC_TM_48 | 20 templates in list | Positive | P2 | — |
| TC_TM_49 | 50 templates — scroll/performance | Boundary | P2 | — |
| TC_TM_50 | Template name empty → error | Negative | P1 | — |
| TC_TM_51 | Template name whitespace → error | Negative | P1 | — |
| TC_TM_52 | Template name very long (200 chars) | Boundary | P2 | — |
| TC_TM_53 | Template name special chars | Edge | P2 | — |
| TC_TM_54 | Template name Vietnamese | Positive | P2 | — |
| TC_TM_55 | Template name emoji | Edge | P2 | — |
| TC_TM_56 | Template name HTML injection | Security | P1 | — |
| TC_TM_57 | Delete all templates | Edge | P2 | — |
| TC_TM_58 | Delete last template → empty state | Positive | P2 | — |
| TC_TM_59 | Apply deleted template (race) | Edge | P2 | — |
| TC_TM_60 | Multiple applies same template | Positive | P2 | — |
| TC_TM_61 | Apply different templates to same date | Edge | P2 | — |
| TC_TM_62 | Persist after reload | Positive | P0 | — |
| TC_TM_63 | localStorage format correct | Positive | P1 | — |
| TC_TM_64 | Export includes templates | Positive | P1 | — |
| TC_TM_65 | Import includes templates | Positive | P1 | — |
| TC_TM_66 | Cloud sync templates | Positive | P2 | — |
| TC_TM_67 | Corrupt template data → graceful | Edge | P2 | — |
| TC_TM_68 | Dark mode modal | Positive | P2 | — |
| TC_TM_69 | i18n labels | Positive | P2 | — |
| TC_TM_70 | Mobile layout | Positive | P2 | — |
| TC_TM_71 | Desktop layout | Positive | P2 | — |
| TC_TM_72 | Modal backdrop close | Positive | P2 | — |
| TC_TM_73 | Modal Escape close | Positive | P2 | — |
| TC_TM_74 | Screen reader | Positive | P3 | — |
| TC_TM_75 | Keyboard navigation | Positive | P3 | — |
| TC_TM_76 | Touch interactions mobile | Positive | P2 | — |
| TC_TM_77 | Swipe to delete template | Positive | P2 | — |
| TC_TM_78 | Template preview expand/collapse | Positive | P2 | — |
| TC_TM_79 | Template nutrition badge | Positive | P2 | — |
| TC_TM_80 | Apply loading state | Positive | P2 | — |
| TC_TM_81 | Delete loading state | Positive | P3 | — |
| TC_TM_82 | Template favorites/pin | Positive | P3 | — |
| TC_TM_83 | Template categories | Positive | P3 | — |
| TC_TM_84 | Template sharing | Positive | P3 | — |
| TC_TM_85 | Template from AI suggestion | Positive | P3 | — |
| TC_TM_86 | Duplicate template | Positive | P3 | — |
| TC_TM_87 | Edit template content | Positive | P3 | — |
| TC_TM_88 | Template version history | Positive | P3 | — |
| TC_TM_89 | Template apply count tracking | Positive | P3 | — |
| TC_TM_90 | Most used template highlight | Positive | P3 | — |
| TC_TM_91 | Template apply → grocery list update | Positive | P1 | — |
| TC_TM_92 | Template apply → nutrition bars update | Positive | P1 | — |
| TC_TM_93 | Template created from current plan | Positive | P1 | — |
| TC_TM_94 | Template preview nutrition accuracy | Positive | P2 | — |
| TC_TM_95 | Apply week template → verify all 7 days | Positive | P1 | — |
| TC_TM_96 | Apply day template → verify 3 meals only | Positive | P1 | — |
| TC_TM_97 | Template data size estimation | Positive | P3 | — |
| TC_TM_98 | Template export as standalone file | Positive | P3 | — |
| TC_TM_99 | Template import from file | Positive | P3 | — |
| TC_TM_100 | Template preview image/thumbnail | Positive | P3 | — |
| TC_TM_101 | Animation on apply | Positive | P3 | — |
| TC_TM_102 | Template apply undo | Positive | P3 | — |
| TC_TM_103 | Concurrent template operations | Edge | P2 | — |
| TC_TM_104 | Template with very large data (100 dishes) | Boundary | P2 | — |
| TC_TM_105 | Template storage quota handling | Boundary | P2 | — |
| TC_TM_106 | Tìm kiếm rỗng → hiển thị tất cả templates | Positive | P1 | — |
| TC_TM_107 | Tìm kiếm 1 ký tự → lọc đúng templates có chứa ký tự đó | Positive | P1 | — |
| TC_TM_108 | Tìm kiếm tên đầy đủ → hiển thị đúng 1 kết quả | Positive | P1 | — |
| TC_TM_109 | Tìm kiếm không phân biệt chữ hoa/chữ thường (case-insensitive) | Positive | P0 | — |
| TC_TM_110 | Tìm kiếm tiếng Việt có dấu (ví dụ: "Bữa ăn lành mạnh") | Positive | P1 | — |
| TC_TM_111 | Tìm kiếm không có kết quả → hiển thị no-results empty state | Positive | P1 | — |
| TC_TM_112 | Xóa search text → hiển thị lại tất cả templates | Positive | P1 | — |
| TC_TM_113 | Tìm kiếm kết hợp với tag filter đồng thời | Positive | P1 | — |
| TC_TM_114 | Tag filter chọn "Tất cả" → hiển thị tất cả templates | Positive | P1 | — |
| TC_TM_115 | Chọn 1 tag cụ thể → chỉ hiển thị templates có tag đó | Positive | P1 | — |
| TC_TM_116 | Chọn tag không có template nào → hiển thị empty state | Edge | P2 | — |
| TC_TM_117 | Tag tự động thu thập từ tất cả templates (unique tags) | Positive | P1 | — |
| TC_TM_118 | Tags hiển thị sắp xếp theo thứ tự alphabet | Positive | P2 | — |
| TC_TM_119 | Tìm kiếm với ký tự đặc biệt (@#$%^&*) không crash | Edge | P2 | — |
| TC_TM_120 | Tìm kiếm với emoji trong tên template | Edge | P2 | — |
| TC_TM_121 | Tìm kiếm realtime có debounce (không gọi liên tục) | Positive | P2 | — |
| TC_TM_122 | Nút clear search hoạt động đúng, xóa text và hiện lại tất cả | Positive | P1 | — |
| TC_TM_123 | Tag filter vẫn giữ nguyên khi search text thay đổi | Positive | P1 | — |
| TC_TM_124 | Search text vẫn giữ nguyên khi tag filter thay đổi | Positive | P1 | — |
| TC_TM_125 | Tìm kiếm với 100+ templates → thời gian phản hồi < 200ms | Performance | P2 | — |
| TC_TM_126 | Double-click tên template → chuyển sang chế độ inline edit | Positive | P1 | — |
| TC_TM_127 | Nhấn Enter trong inline edit → lưu tên mới thành công | Positive | P0 | — |
| TC_TM_128 | Nhấn Escape trong inline edit → hủy, giữ nguyên tên cũ | Positive | P0 | — |
| TC_TM_129 | Rename tên trống (empty string) → hiển thị lỗi validation | Negative | P0 | — |
| TC_TM_130 | Rename chỉ có khoảng trắng → hiển thị lỗi (trim → empty) | Negative | P0 | — |
| TC_TM_131 | Rename tên 1 ký tự → lưu thành công | Boundary | P2 | — |
| TC_TM_132 | Rename tên 100 ký tự → lưu thành công | Boundary | P2 | — |
| TC_TM_133 | Rename tên 101+ ký tự → cắt bớt hoặc hiển thị lỗi giới hạn | Boundary | P2 | — |
| TC_TM_134 | Rename tên trùng với template khác → hiển thị lỗi trùng tên | Negative | P1 | — |
| TC_TM_135 | Rename tên giống hệt tên cũ → không thực hiện thao tác (no-op) | Edge | P2 | — |
| TC_TM_136 | Rename tiếng Việt có dấu (ví dụ: "Thực đơn giảm cân") → OK | Positive | P1 | — |
| TC_TM_137 | Rename với emoji trong tên (ví dụ: "🥗 Healthy") → lưu OK | Edge | P2 | — |
| TC_TM_138 | Rename với HTML injection (ví dụ: "<script>") → escaped an toàn | Security | P0 | — |
| TC_TM_139 | Click ra ngoài vùng inline rename → tự động lưu tên mới | Positive | P1 | — |
| TC_TM_140 | Rename thành công → localStorage được cập nhật ngay lập tức | Positive | P0 | — |
| TC_TM_141 | Rename thành công → IndexedDB được đồng bộ (sync) | Positive | P1 | — |
| TC_TM_142 | Rename → reload trang → tên mới vẫn persist đúng | Positive | P0 | — |
| TC_TM_143 | Rename hiển thị loading state trong khi đang lưu | Positive | P2 | — |
| TC_TM_144 | Rename gặp lỗi → rollback về tên cũ, hiển thị thông báo lỗi | Edge | P1 | — |
| TC_TM_145 | Rename 2 templates đồng thời (concurrent) → không conflict | Edge | P2 | — |
| TC_TM_146 | Card hiển thị tên template đầy đủ và chính xác | Positive | P0 | — |
| TC_TM_147 | Card hiển thị ngày tạo template theo format locale (dd/MM/yyyy) | Positive | P1 | — |
| TC_TM_148 | Card hiển thị danh sách tags (nếu template có tags) | Positive | P1 | — |
| TC_TM_149 | Card hiển thị tổng số món: "X món" (breakfast + lunch + dinner) | Positive | P1 | — |
| TC_TM_150 | Card hiển thị preview bữa sáng với emoji 🌅 | Positive | P1 | — |
| TC_TM_151 | Card hiển thị preview bữa trưa với emoji 🌤️ | Positive | P1 | — |
| TC_TM_152 | Card hiển thị preview bữa tối với emoji 🌙 | Positive | P1 | — |
| TC_TM_153 | Card không có bữa sáng (breakfastDishIds rỗng) → ẩn section sáng | Edge | P2 | — |
| TC_TM_154 | Card không có bữa tối (dinnerDishIds rỗng) → ẩn section tối | Edge | P2 | — |
| TC_TM_155 | Card có 0 món tổng cộng → hiển thị text "Trống" | Edge | P2 | — |
| TC_TM_156 | Card có 1 món → hiển thị tên món đầy đủ | Positive | P2 | — |
| TC_TM_157 | Card có 5+ món → hiển thị 3 tên + "+2 món khác" | Positive | P1 | — |
| TC_TM_158 | Card tên món quá dài → truncate với dấu ba chấm (ellipsis) | Positive | P2 | — |
| TC_TM_159 | Card hiển thị đúng trong dark mode (màu sắc, contrast) | Positive | P2 | — |
| TC_TM_160 | Card có hover effect khi di chuột qua | Positive | P2 | — |
| TC_TM_161 | Card click → expand hoặc select template | Positive | P1 | — |
| TC_TM_162 | Card responsive: hiển thị đúng trên mobile vs desktop | Positive | P1 | — |
| TC_TM_163 | Card có animation khi xuất hiện lần đầu (fade-in/slide-in) | Positive | P3 | — |
| TC_TM_164 | Card hiển thị badge tổng nutrition (calories/protein) | Positive | P2 | — |
| TC_TM_165 | Card action buttons (Áp dụng, Đổi tên, Xóa) căn chỉnh đúng vị trí | Positive | P1 | — |
| TC_TM_166 | Apply template trống (0 dish) → hiển thị cảnh báo warning | Edge | P1 | — |
| TC_TM_167 | Apply → overwrite confirmation hiển thị rõ dữ liệu sẽ bị ghi đè | Positive | P0 | — |
| TC_TM_168 | Apply → xác nhận confirm → dishes trong plan đúng với template | Positive | P0 | — |
| TC_TM_169 | Apply → nhấn cancel → plan hiện tại không thay đổi gì | Positive | P0 | — |
| TC_TM_170 | Apply → breakfast dishes nằm đúng vị trí bữa sáng trong plan | Positive | P0 | — |
| TC_TM_171 | Apply → lunch dishes nằm đúng vị trí bữa trưa trong plan | Positive | P0 | — |
| TC_TM_172 | Apply → dinner dishes nằm đúng vị trí bữa tối trong plan | Positive | P0 | — |
| TC_TM_173 | Apply template có dish đã bị xóa → skip dish đó, không crash | Edge | P1 | — |
| TC_TM_174 | Apply template → nutrition tự động tính toán lại (recalculated) | Positive | P1 | — |
| TC_TM_175 | Apply template → danh sách đi chợ (grocery list) được cập nhật | Positive | P1 | — |
| TC_TM_176 | Apply template → calendar dot xuất hiện cho ngày được apply | Positive | P1 | — |
| TC_TM_177 | Apply 2 templates liên tục cùng ngày → template thứ 2 ghi đè hoàn toàn | Edge | P1 | — |
| TC_TM_178 | Apply template lên ngày đã có đầy đủ data → hiện overwrite confirm | Positive | P0 | — |
| TC_TM_179 | Apply template lên ngày trống → không cần confirm, apply trực tiếp | Positive | P1 | — |
| TC_TM_180 | Apply template thành công → hiển thị success toast notification | Positive | P1 | — |
| TC_TM_181 | Apply template thành công → modal tự động đóng | Positive | P1 | — |
| TC_TM_182 | Apply template thành công → undo action khả dụng | Positive | P2 | — |
| TC_TM_183 | Apply template → hiển thị loading state (spinner) trong khi xử lý | Positive | P2 | — |
| TC_TM_184 | Apply template gặp lỗi → rollback về trạng thái plan trước đó | Edge | P1 | — |
| TC_TM_185 | Apply template từ kết quả search → hoạt động đúng như apply thường | Positive | P1 | — |
| TC_TM_186 | Template vẫn tồn tại sau khi reload trang (persist localStorage) | Positive | P0 | — |
| TC_TM_187 | Template vẫn tồn tại sau khi clear cache (IndexedDB backup restore) | Positive | P1 | — |
| TC_TM_188 | Kiểm tra localStorage format là JSON hợp lệ (valid JSON parse) | Positive | P1 | — |
| TC_TM_189 | Export data bao gồm đầy đủ tất cả templates | Positive | P1 | — |
| TC_TM_190 | Import data khôi phục đúng tất cả templates đã export | Positive | P1 | — |
| TC_TM_191 | Template bị corrupt trong localStorage → graceful degradation, không crash | Edge | P1 | — |
| TC_TM_192 | localStorage quota exceeded → hiển thị warning cho user | Edge | P2 | — |
| TC_TM_193 | Template với 50 dishes mỗi bữa (150 tổng) → hiển thị và apply bình thường | Performance | P2 | — |
| TC_TM_194 | 100 templates trong danh sách → scroll mượt, không lag | Performance | P2 | — |
| TC_TM_195 | 200 templates → tìm kiếm vẫn phản hồi nhanh < 300ms | Performance | P2 | — |
| TC_TM_196 | Delete template → localStorage size giảm tương ứng | Positive | P2 | — |
| TC_TM_197 | Delete tất cả templates → hiển thị empty state với icon + message + hint | Positive | P1 | — |
| TC_TM_198 | Kiểm tra mỗi template có ID duy nhất (uniqueness verification) | Positive | P1 | — |
| TC_TM_199 | Template createdAt tuân thủ format ISO 8601 | Positive | P2 | — |
| TC_TM_200 | Zustand store hydrate đúng dữ liệu từ localStorage khi khởi tạo | Positive | P0 | — |
| TC_TM_201 | IndexedDB fallback hoạt động khi localStorage bị xóa thủ công | Edge | P1 | — |
| TC_TM_202 | Template data migration khi nâng cấp phiên bản (version upgrade) | Edge | P2 | — |
| TC_TM_203 | Concurrent save + delete cùng lúc → không mất dữ liệu (no data loss) | Edge | P1 | — |
| TC_TM_204 | Sắp xếp templates theo tên (thứ tự alphabet A-Z) | Positive | P2 | — |
| TC_TM_205 | Sắp xếp templates theo ngày tạo (mới nhất trước) | Positive | P2 | — |
| TC_TM_206 | Sắp xếp templates theo số lần sử dụng (usage count) | Positive | P3 | — |
| TC_TM_207 | Lọc templates theo loại bữa ăn (chỉ breakfast/lunch/dinner) | Positive | P2 | — |
| TC_TM_208 | Mở modal → đóng → mở lại → state được reset hoàn toàn | Positive | P1 | — |
| TC_TM_209 | Modal memory leak check: mở/đóng 50 lần liên tục → không leak | Performance | P2 | — |
| TC_TM_210 | Template deep equality check: 2 template cùng nội dung → cảnh báo trùng lặp | Edge | P2 | — |

---

## Chi tiết Test Cases (Grouped)

##### TC_TM_01–27: CRUD cơ bản & Apply
- Hiển thị button, mở modal, empty state, danh sách templates
- Template card: tên, số bữa, ngày tạo
- Preview template: chi tiết bữa ăn, tóm tắt dinh dưỡng
- Apply: chọn ngày, overwrite confirm, tạo plan, hiển thị trong calendar
- Delete: xác nhận xóa, hủy xóa
- Rename: đổi tên, lưu, trùng tên → lỗi
- Success notification, đóng modal sau apply

##### TC_TM_28–46: Apply Variations & Date Targeting
- Sắp xếp theo tên/ngày, tìm kiếm templates
- Template kích thước khác nhau: 1 bữa, 3 bữa (full day), 21 bữa (full week), 0 bữa (rỗng)
- Immutability: sửa plan/dish không ảnh hưởng template
- Xử lý dish/ingredient đã bị xóa
- Apply: hôm nay, ngày tương lai, ngày quá khứ, qua tháng
- Apply template tuần (bắt đầu thứ Hai), apply template ngày

##### TC_TM_47–67: Data Integrity & Persistence
- Giới hạn số lượng templates: 1, 20, 50 templates
- Validate tên: rỗng, khoảng trắng, dài 200 ký tự, ký tự đặc biệt, tiếng Việt, emoji, HTML injection
- Edge cases: xóa hết, xóa template cuối, apply template đã xóa (race condition)
- Apply nhiều lần, apply templates khác nhau cùng ngày
- Persist sau reload, localStorage format, export/import bao gồm templates
- Cloud sync, dữ liệu bị corrupt → graceful handling

##### TC_TM_68–81: UI/UX & Accessibility
- Dark mode modal, i18n labels, responsive layout (mobile/desktop)
- Modal đóng: click backdrop, phím Escape
- Screen reader, keyboard navigation, touch interactions
- Swipe to delete, preview expand/collapse, nutrition badge, loading states

##### TC_TM_82–105: Advanced Features & Integration
- Favorites/pin, categories, sharing, AI suggestion templates
- Duplicate, edit content, version history, apply count tracking, most used highlight
- Integration: grocery list update, nutrition bars update sau apply
- Template tạo từ plan hiện tại, preview nutrition accuracy
- Verify apply tuần (7 ngày) / apply ngày (3 bữa)
- Data size estimation, export/import file standalone, thumbnail preview
- Animation, undo apply, concurrent operations, large data (100 dishes), storage quota

##### TC_TM_106–125: Tìm kiếm và Lọc nâng cao (Search & Filter)
- Search rỗng hiển thị tất cả, search 1 ký tự, search tên đầy đủ
- Case-insensitive, tiếng Việt có dấu, không kết quả → empty state
- Xóa search text → hiện lại tất cả
- Kết hợp search + tag filter, tag "Tất cả", tag cụ thể, tag không có template
- Tags auto-collected unique, sắp xếp alphabet
- Special characters, emoji trong search, realtime debounce
- Clear search button, tag persist khi search đổi, search persist khi tag đổi
- Performance với 100+ templates

##### TC_TM_126–145: Inline Rename nâng cao
- Double-click → inline edit mode, Enter → lưu, Escape → hủy
- Validate: tên trống, chỉ khoảng trắng, 1 ký tự, 100 ký tự, 101+ ký tự
- Trùng tên → lỗi, tên giống cũ → no-op
- Tiếng Việt có dấu, emoji, HTML injection escaped
- Click ngoài → lưu, localStorage cập nhật, IndexedDB sync
- Reload → persist, loading state, error → rollback, concurrent rename

##### TC_TM_146–165: Template Card chi tiết
- Hiển thị: tên, ngày tạo (locale format), tags, tổng số món
- Preview bữa ăn với emoji: 🌅 sáng, 🌤️ trưa, 🌙 tối
- Edge cases: không có bữa sáng/tối → ẩn section, 0 món → "Trống"
- 1 món → tên đầy đủ, 5+ món → 3 tên + "+N món khác"
- Tên món dài → truncate ellipsis
- Dark mode style, hover effect, click expand/select
- Responsive mobile/desktop, animation xuất hiện
- Badge nutrition tổng, action buttons alignment

##### TC_TM_166–185: Apply Template nâng cao
- Apply template trống → warning, overwrite confirmation chi tiết
- Confirm → dishes đúng, cancel → plan không đổi
- Vị trí đúng: breakfast/lunch/dinner dishes
- Dish đã xóa → skip, nutrition recalculated, grocery list updated
- Calendar dot xuất hiện, apply liên tục ghi đè, ngày có data vs ngày trống
- Success toast, modal đóng, undo available
- Loading spinner, error → rollback, apply từ search result

##### TC_TM_186–210: Storage, Sync và Edge Cases
- Persist sau reload (localStorage), persist sau clear cache (IndexedDB backup)
- JSON valid format, export/import bao gồm templates
- Corrupt data → graceful degradation, quota exceeded → warning
- Performance: 50 dishes/bữa, 100 templates scroll, 200 templates search
- Delete → localStorage shrink, delete all → empty state
- ID uniqueness, createdAt ISO 8601, Zustand hydrate đúng
- IndexedDB fallback, data migration, concurrent save+delete
- Sort: alphabet, date, usage count; filter by meal type
- Modal state reset, memory leak check (50 cycles)
- Deep equality → cảnh báo trùng lặp nội dung

---

## Đề xuất Cải tiến

### Đề xuất 1: Template Gallery with Community Sharing
- **Vấn đề hiện tại**: Only personal templates. No discovery of new meal plans.
- **Giải pháp đề xuất**: Community template gallery. Browse "High Protein Week", "Vegan Month". Rate & download.
- **Lý do chi tiết**: Community content increases engagement 3x. Users learn from others' meal plans.
- **Phần trăm cải thiện**: Template adoption +200%, User engagement +60%
- **Mức độ ưu tiên**: Low | **Effort**: XL

### Đề xuất 2: Template Editor (Modify Before Apply)
- **Vấn đề hiện tại**: Templates immutable. Must apply then edit. Can't customize before applying.
- **Giải pháp đề xuất**: "Apply with modifications" — open template in editor, swap dishes, then apply.
- **Lý do chi tiết**: 60% of template applies need 1-2 changes. Edit-before-apply saves time.
- **Phần trăm cải thiện**: Template usage +40%, Post-apply edits -70%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Smart Template Suggestions
- **Vấn đề hiện tại**: User must manually choose template. No recommendation.
- **Giải pháp đề xuất**: AI suggest: "Based on your goals and preferences, try 'Balanced Week' template".
- **Lý do chi tiết**: Recommendations increase template usage 50%. Personalization = higher satisfaction.
- **Phần trăm cải thiện**: Template discovery +50%, User satisfaction +30%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Template Scheduling (Auto-Apply)
- **Vấn đề hiện tại**: Must manually apply template each week.
- **Giải pháp đề xuất**: Schedule: "Apply 'Work Week' every Monday automatically". Recurring templates.
- **Lý do chi tiết**: Meal prep users have recurring patterns. Auto-apply = zero effort weekly planning.
- **Phần trăm cải thiện**: Weekly planning time -95%, Consistency +60%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 5: Template Comparison
- **Vấn đề hiện tại**: Can't compare nutrition of 2 templates side by side.
- **Giải pháp đề xuất**: Side-by-side comparison: Template A vs B — calories, macros, meal variety.
- **Lý do chi tiết**: Users often have 5+ templates. Comparison helps choose the best one for current goals.
- **Phần trăm cải thiện**: Decision quality +40%, Template selection time -50%
- **Mức độ ưu tiên**: Low | **Effort**: M

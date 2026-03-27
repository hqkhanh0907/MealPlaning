# Scenario 15: Background Translation

**Version:** 2.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Background Translation dịch toàn bộ nội dung app (labels, dish names, ingredient names) từ ngôn ngữ hiện tại sang ngôn ngữ đã chọn. Zustand queue quản lý translation tasks. Runs in background không block UI. Progress indicator hiển thị tiến trình.

**Hệ thống i18n hiện tại:**
- `i18n.ts`: resources `{vi: {translation: vi}}`, `lng: 'vi'`, `fallbackLng: 'vi'`, `interpolation: {escapeValue: false}`
- `vi.json`: 979 dòng, sections: common, meal, sort, nav, header, calendar, dish, ingredient, management, grocery, planning, clearPlan, template, copyPlan, goalSettings, backup, settings, notification, tips, imageCapture, fitness, healthProfile
- `localize.ts`: `getLocalizedField(field: LocalizedString, lang: SupportedLang)` → `field[lang]` fallback `field['vi']`
  - `LocalizedString = Record<'vi', string> & Partial<Record<'en', string>>`
  - `SupportedLang = 'vi'`
  - Interpolation patterns: `{{count}}`, `{{date}}`, `{{meal}}`, `{{weight}}`, `{{summary}}`, `{{amount}}`
- Background translation: Zustand queue + Gemini API, non-blocking, queue-based, API key required, retry logic

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| TranslateQueueService | services/translateQueueService.ts | Queue management |
| useTranslateWorker | hooks/useTranslateWorker.ts | Worker orchestration |
| useTranslateProcessor | hooks/useTranslateProcessor.ts | Translation processing |
| TranslationProgress | components/ | Progress indicator |
| geminiService | services/geminiService.ts | AI translation |
| i18n | i18n.ts | i18next configuration |
| localize | localize.ts | getLocalizedField utility |
| vi.json | locales/vi.json | Vietnamese translation file (979 lines) |

## Luồng nghiệp vụ

1. User changes language in Settings (vi → en or en → vi)
2. System queues all translatable content (dish names, ingredient names, custom labels)
3. Background worker processes queue items via Gemini API
4. Progress bar shows X/Y translated
5. Translated content stored and displayed
6. UI remains responsive during translation

## Quy tắc nghiệp vụ

1. Non-blocking: UI usable during translation
2. Queue-based: items processed one by one (or batched)
3. API key required (same as AI features)
4. Cache: already-translated items skipped
5. Error: failed items retried 3 times, then skipped with original
6. Progress: shows completed/total count
7. Cancel: user can cancel remaining translations
8. i18n default language: Vietnamese (`vi`)
9. fallbackLng: `vi` — nếu key thiếu thì dùng tiếng Việt
10. `getLocalizedField`: luôn trả về `field['vi']` khi `lang='vi'`
11. Interpolation `escapeValue: false` — cho phép HTML trong translation

## Test Cases (210 TCs)

### Nhóm 1: Core Translation Flow (TC_BT_01–15)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_01 | Chuyển đổi ngôn ngữ kích hoạt quá trình dịch | Positive | P0 | — |
| TC_BT_02 | Hàng đợi được populate với các item cần dịch | Positive | P1 | — |
| TC_BT_03 | Thanh tiến trình xuất hiện khi bắt đầu dịch | Positive | P1 | — |
| TC_BT_04 | Tiến trình hiển thị 0/N ban đầu | Positive | P1 | — |
| TC_BT_05 | Tiến trình cập nhật X/N trong quá trình dịch | Positive | P1 | — |
| TC_BT_06 | Tiến trình hiển thị N/N khi hoàn thành | Positive | P1 | — |
| TC_BT_07 | UI vẫn phản hồi trong quá trình dịch | Positive | P0 | — |
| TC_BT_08 | Xử lý nền (non-blocking) hoạt động đúng | Positive | P0 | — |
| TC_BT_09 | Kết quả dịch hiển thị đúng trên UI | Positive | P0 | — |
| TC_BT_10 | Tên món ăn được dịch đúng | Positive | P1 | — |
| TC_BT_11 | Tên nguyên liệu được dịch đúng | Positive | P1 | — |
| TC_BT_12 | Labels tĩnh của UI được dịch đúng | Positive | P1 | — |
| TC_BT_13 | Hủy quá trình dịch hoạt động đúng | Positive | P1 | — |
| TC_BT_14 | Hủy → các item còn lại giữ nguyên bản gốc | Positive | P1 | — |
| TC_BT_15 | Hủy → thanh tiến trình biến mất | Positive | P1 | — |

### Nhóm 2: Error Handling & Cache (TC_BT_16–24)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_16 | Không có API key → dịch bị vô hiệu hóa | Negative | P0 | — |
| TC_BT_17 | Lỗi API → thử lại 3 lần | Positive | P1 | — |
| TC_BT_18 | Tất cả lần thử lại thất bại → giữ bản gốc | Negative | P1 | — |
| TC_BT_19 | Lỗi mạng trong quá trình dịch | Negative | P1 | — |
| TC_BT_20 | API timeout xử lý đúng | Negative | P1 | — |
| TC_BT_21 | Rate limit → hàng đợi tạm dừng | Negative | P1 | — |
| TC_BT_22 | Cache: item đã dịch trước đó → bỏ qua | Positive | P1 | — |
| TC_BT_23 | Cache hit → hiển thị ngay lập tức | Positive | P2 | — |
| TC_BT_24 | Cache invalidation khi nội dung thay đổi | Positive | P2 | — |

### Nhóm 3: Content Variations (TC_BT_25–37)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_25 | Dịch vi → en hoạt động đúng | Positive | P0 | — |
| TC_BT_26 | Dịch en → vi hoạt động đúng | Positive | P0 | — |
| TC_BT_27 | Dịch khứ hồi vi → en → vi giữ nghĩa | Edge | P2 | — |
| TC_BT_28 | Chất lượng dịch có nghĩa, tự nhiên | Positive | P2 | — |
| TC_BT_29 | Văn bản ngắn (1 từ) dịch đúng | Positive | P2 | — |
| TC_BT_30 | Văn bản dài (100+ ký tự) dịch đúng | Positive | P2 | — |
| TC_BT_31 | Ký tự đặc biệt được giữ nguyên sau dịch | Edge | P2 | — |
| TC_BT_32 | Số được giữ nguyên trong bản dịch | Positive | P2 | — |
| TC_BT_33 | Chuỗi rỗng → bỏ qua không dịch | Edge | P2 | — |
| TC_BT_34 | Chuỗi chỉ có khoảng trắng → bỏ qua | Edge | P2 | — |
| TC_BT_35 | Nội dung đã ở ngôn ngữ đích → bỏ qua | Edge | P2 | — |
| TC_BT_36 | Văn bản hỗn hợp nhiều ngôn ngữ xử lý đúng | Edge | P2 | — |
| TC_BT_37 | HTML trong nội dung → sanitized đúng | Security | P1 | — |

### Nhóm 4: Queue Management (TC_BT_38–49)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_38 | Hàng đợi: 1 item xử lý đúng | Positive | P2 | — |
| TC_BT_39 | Hàng đợi: 10 items xử lý đúng | Positive | P2 | — |
| TC_BT_40 | Hàng đợi: 100 items xử lý đúng | Positive | P1 | — |
| TC_BT_41 | Hàng đợi: 500 items (stress test) | Boundary | P2 | — |
| TC_BT_42 | Hàng đợi: 1000 items (boundary test) | Boundary | P2 | — |
| TC_BT_43 | Hàng đợi xử lý theo thứ tự FIFO | Positive | P2 | — |
| TC_BT_44 | Tạm dừng/tiếp tục hàng đợi | Positive | P2 | — |
| TC_BT_45 | Xử lý theo lô (5 items/lần gọi API) | Positive | P2 | — |
| TC_BT_46 | Xử lý lỗi một phần trong lô dịch | Edge | P2 | — |
| TC_BT_47 | Trạng thái Zustand store đúng trong quá trình dịch | Positive | P1 | — |
| TC_BT_48 | Zustand store reset sau khi hoàn thành | Positive | P2 | — |
| TC_BT_49 | Zustand persist (nếu có) hoạt động đúng | Positive | P2 | — |

### Nhóm 5: Persistence (TC_BT_50–55)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_50 | Bản dịch lưu vào localStorage | Positive | P1 | — |
| TC_BT_51 | Bản dịch giữ nguyên sau reload trang | Positive | P0 | — |
| TC_BT_52 | Reload giữa quá trình dịch → resume | Edge | P2 | — |
| TC_BT_53 | Export bao gồm bản dịch | Positive | P2 | — |
| TC_BT_54 | Import bao gồm bản dịch | Positive | P2 | — |
| TC_BT_55 | Cloud sync đồng bộ bản dịch | Positive | P2 | — |

### Nhóm 6: UI/UX (TC_BT_56–67)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_56 | Dark mode: thanh tiến trình hiển thị đúng | Positive | P2 | — |
| TC_BT_57 | Labels tiến trình đã được i18n | Positive | P2 | — |
| TC_BT_58 | Layout tiến trình trên mobile đúng | Positive | P2 | — |
| TC_BT_59 | Layout tiến trình trên desktop đúng | Positive | P2 | — |
| TC_BT_60 | Animation thanh tiến trình mượt mà | Positive | P3 | — |
| TC_BT_61 | Phần trăm tiến trình chính xác | Positive | P1 | — |
| TC_BT_62 | Hiển thị thời gian ước tính (ETA) | Positive | P3 | — |
| TC_BT_63 | Thông báo lỗi dịch hiển thị đúng | Positive | P1 | — |
| TC_BT_64 | Thông báo thành công khi hoàn thành | Positive | P1 | — |
| TC_BT_65 | Thông báo thành công một phần | Positive | P2 | — |
| TC_BT_66 | Screen reader đọc tiến trình đúng | Positive | P3 | — |
| TC_BT_67 | Phím tắt hủy dịch hoạt động | Positive | P3 | — |

### Nhóm 7: Concurrent Operations (TC_BT_68–79)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_68 | Chuyển đổi ngôn ngữ nhanh liên tục xử lý đúng | Edge | P1 | — |
| TC_BT_69 | Chuyển đổi trong khi đang dịch → xử lý đúng | Edge | P1 | — |
| TC_BT_70 | Dịch đồng thời với chỉnh sửa dữ liệu | Edge | P2 | — |
| TC_BT_71 | Dịch đồng thời với AI gợi ý | Edge | P2 | — |
| TC_BT_72 | Dịch đồng thời với cloud sync | Edge | P2 | — |
| TC_BT_73 | Sử dụng bộ nhớ khi hàng đợi lớn | Boundary | P2 | — |
| TC_BT_74 | Sử dụng CPU không quá mức | Boundary | P2 | — |
| TC_BT_75 | Băng thông mạng sử dụng hợp lý | Boundary | P2 | — |
| TC_BT_76 | Thời gian dịch 100 items < 60 giây | Boundary | P2 | — |
| TC_BT_77 | Thêm item mới trong khi đang dịch → được xếp hàng | Positive | P2 | — |
| TC_BT_78 | Xóa item trong khi đang dịch → loại khỏi hàng đợi | Positive | P2 | — |
| TC_BT_79 | Sửa item trong khi đang dịch → xếp hàng lại | Edge | P2 | — |

### Nhóm 8: Cross-Feature Impact & Advanced (TC_BT_80–105)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_80 | Hoàn thành → thêm nội dung mới → tự động dịch | Positive | P2 | — |
| TC_BT_81 | Bản dịch ảnh hưởng đúng đến kết quả tìm kiếm | Positive | P2 | — |
| TC_BT_82 | Bản dịch ảnh hưởng đúng đến thứ tự sắp xếp | Positive | P2 | — |
| TC_BT_83 | Bản dịch ảnh hưởng đúng đến danh sách mua sắm | Positive | P2 | — |
| TC_BT_84 | Bản dịch ảnh hưởng đúng đến hiển thị lịch | Positive | P1 | — |
| TC_BT_85 | Bản dịch ảnh hưởng đúng đến nhãn dinh dưỡng | Positive | P2 | — |
| TC_BT_86 | Tên template được dịch đúng | Positive | P2 | — |
| TC_BT_87 | Nhãn mục tiêu (goal) được dịch đúng | Positive | P2 | — |
| TC_BT_88 | Nhãn cài đặt được dịch đúng | Positive | P2 | — |
| TC_BT_89 | Thông báo lỗi được dịch đúng | Positive | P2 | — |
| TC_BT_90 | Placeholder text được dịch đúng | Positive | P2 | — |
| TC_BT_91 | Nhãn nút bấm được dịch đúng | Positive | P1 | — |
| TC_BT_92 | Tiêu đề modal được dịch đúng | Positive | P2 | — |
| TC_BT_93 | Tên tab được dịch đúng | Positive | P1 | — |
| TC_BT_94 | Toast messages được dịch đúng | Positive | P2 | — |
| TC_BT_95 | Định dạng ngày được localize | Positive | P2 | — |
| TC_BT_96 | Định dạng số được localize | Positive | P2 | — |
| TC_BT_97 | Hỗ trợ RTL (nếu áp dụng) | Positive | P3 | — |
| TC_BT_98 | Font hỗ trợ ngôn ngữ đích | Positive | P3 | — |
| TC_BT_99 | Log/lịch sử dịch hoạt động | Positive | P3 | — |
| TC_BT_100 | Nút dịch lại thủ công hoạt động | Positive | P2 | — |
| TC_BT_101 | Dịch chọn lọc (chỉ món ăn) hoạt động | Positive | P3 | — |
| TC_BT_102 | Phản hồi chất lượng dịch hoạt động | Positive | P3 | — |
| TC_BT_103 | Ghi đè bản dịch tùy chỉnh hoạt động | Positive | P3 | — |
| TC_BT_104 | Translation memory (TM) tái sử dụng | Positive | P3 | — |
| TC_BT_105 | Theo dõi chi phí API dịch thuật | Positive | P3 | — |

### Nhóm 9: Đối tượng tên song ngữ — Bilingual Name Objects (TC_BT_106–125)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_106 | Dish name `{vi: "Phở bò", en: "Beef Pho"}` → hiển thị "Phở bò" khi lang=vi | Positive | P0 | — |
| TC_BT_107 | Dish name chỉ có trường vi → hiển thị đúng giá trị vi | Positive | P0 | — |
| TC_BT_108 | Dish name thiếu trường vi → fallback về vi (hoặc chuỗi rỗng) | Negative | P1 | — |
| TC_BT_109 | Ingredient name `{vi: "Thịt bò"}` → hiển thị đúng "Thịt bò" | Positive | P0 | — |
| TC_BT_110 | Ingredient name `{vi: "Rau muống", en: "Morning Glory"}` → hiển thị "Rau muống" khi lang=vi | Positive | P1 | — |
| TC_BT_111 | Template name chỉ có trường vi → hiển thị đúng | Positive | P1 | — |
| TC_BT_112 | `getLocalizedField` với `lang='vi'` → trả về `field.vi` | Positive | P0 | — |
| TC_BT_113 | `getLocalizedField` với field là `undefined` → xử lý graceful không crash | Negative | P1 | — |
| TC_BT_114 | `getLocalizedField` với field là `null` → xử lý graceful không crash | Negative | P1 | — |
| TC_BT_115 | `getLocalizedField` với `field.vi` là chuỗi rỗng `""` → trả về `""` | Edge | P2 | — |
| TC_BT_116 | Tên có đầy đủ dấu tiếng Việt: ă, â, đ, ê, ô, ơ, ư hiển thị đúng | Positive | P1 | — |
| TC_BT_117 | Tên có đầy đủ tone marks: sắc, huyền, hỏi, ngã, nặng hiển thị đúng | Positive | P1 | — |
| TC_BT_118 | Tên dài 200+ ký tự → truncate đúng ở UI, không bị tràn | Boundary | P2 | — |
| TC_BT_119 | Tên có ký tự đặc biệt (`&`, `<`, `>`, `"`, `'`) → escaped đúng | Security | P1 | — |
| TC_BT_120 | LocalizedString type check: tuân thủ `Record<'vi', string>` | Positive | P2 | — |
| TC_BT_121 | Tên song ngữ trong export/import → preserve cả trường vi và en | Positive | P2 | — |
| TC_BT_122 | Tên song ngữ trong tìm kiếm → tìm theo giá trị vi | Positive | P1 | — |
| TC_BT_123 | Tên song ngữ trong sắp xếp → sort theo giá trị vi | Positive | P2 | — |
| TC_BT_124 | Tên song ngữ trong template → preserve đầy đủ cả hai ngôn ngữ | Positive | P2 | — |
| TC_BT_125 | Tên song ngữ hiển thị nhất quán trên tất cả components | Positive | P1 | — |

### Nhóm 10: i18n Key Resolution (TC_BT_126–145)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_126 | Key tồn tại `common.save` → trả về "Lưu" | Positive | P0 | — |
| TC_BT_127 | Key không tồn tại → trả về key name làm fallback | Negative | P1 | — |
| TC_BT_128 | Nested key `grocery.scopeToday` → resolve đúng giá trị | Positive | P0 | — |
| TC_BT_129 | Deep nested key (3+ levels) → resolve đúng giá trị | Positive | P1 | — |
| TC_BT_130 | Key có interpolation `{{count}}` → thay thế đúng giá trị | Positive | P0 | — |
| TC_BT_131 | Interpolation `{{count}}=0` → hiển thị "0" đúng | Edge | P1 | — |
| TC_BT_132 | Interpolation `{{count}}=1` → hiển thị "1" đúng | Positive | P1 | — |
| TC_BT_133 | Interpolation `{{count}}=999` → hiển thị "999" đúng | Positive | P2 | — |
| TC_BT_134 | Interpolation `{{date}}` → format đúng theo locale vi | Positive | P1 | — |
| TC_BT_135 | Interpolation `{{meal}}` → thay thế đúng tên bữa ăn | Positive | P1 | — |
| TC_BT_136 | Interpolation nhiều biến cùng lúc → tất cả thay thế đúng | Positive | P1 | — |
| TC_BT_137 | Key là chuỗi rỗng `""` → trả về fallback | Edge | P2 | — |
| TC_BT_138 | Key là `null` → trả về fallback không crash | Negative | P2 | — |
| TC_BT_139 | Key là `undefined` → trả về fallback không crash | Negative | P2 | — |
| TC_BT_140 | Biến interpolation thiếu → hiển thị `{{variable}}` hoặc fallback | Edge | P1 | — |
| TC_BT_141 | `useTranslation()` hook trả về hàm `t` hoạt động đúng | Positive | P0 | — |
| TC_BT_142 | `t()` gọi nhiều lần cùng key → kết quả nhất quán (cache) | Positive | P2 | — |
| TC_BT_143 | `t()` với namespace khác → resolve đúng giá trị | Positive | P2 | — |
| TC_BT_144 | `i18n.language` luôn bằng `'vi'` | Positive | P0 | — |
| TC_BT_145 | `fallbackLng` là `'vi'` → hoạt động đúng khi key thiếu ở locale khác | Positive | P0 | — |

### Nhóm 11: Định dạng Ngày/Số/Tiền — Locale Formatting (TC_BT_146–165)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_146 | Ngày hiển thị đúng format Vietnamese `dd/mm/yyyy` | Positive | P0 | — |
| TC_BT_147 | Ngày `"2026-03-11"` → hiển thị `"11/03/2026"` | Positive | P1 | — |
| TC_BT_148 | Ngày thứ trong tuần hiển thị đúng: "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật" | Positive | P1 | — |
| TC_BT_149 | Tháng hiển thị đúng: "Tháng 1", "Tháng 2"... "Tháng 12" | Positive | P1 | — |
| TC_BT_150 | Số `1000` → hiển thị `"1.000"` (dấu chấm phân cách nghìn) | Positive | P1 | — |
| TC_BT_151 | Số thập phân `1.5` → hiển thị `"1,5"` (dấu phẩy thập phân) | Positive | P1 | — |
| TC_BT_152 | Calories `2000` → hiển thị `"2.000 kcal"` | Positive | P1 | — |
| TC_BT_153 | Weight `65.5` → hiển thị `"65,5 kg"` | Positive | P1 | — |
| TC_BT_154 | Percentage `75` → hiển thị `"75%"` | Positive | P2 | — |
| TC_BT_155 | Currency (nếu có) `50000` → hiển thị `"50.000 ₫"` | Positive | P2 | — |
| TC_BT_156 | Số âm `-100` → hiển thị `"-100"` đúng | Edge | P2 | — |
| TC_BT_157 | Số không `0` → hiển thị `"0"` đúng | Edge | P2 | — |
| TC_BT_158 | Số lớn `999999` → hiển thị `"999.999"` đúng | Boundary | P2 | — |
| TC_BT_159 | Ngày tương đối: "Hôm nay", "Hôm qua", "2 ngày trước" hiển thị đúng | Positive | P2 | — |
| TC_BT_160 | Định dạng thời gian (nếu có): `"14:30"` | Positive | P2 | — |
| TC_BT_161 | Định dạng khoảng thời gian: `"2 giờ 30 phút"` | Positive | P2 | — |
| TC_BT_162 | Thứ viết tắt: "T2", "T3", "T4", "T5", "T6", "T7", "CN" | Positive | P2 | — |
| TC_BT_163 | Tháng viết tắt: "Th1", "Th2"... "Th12" | Positive | P2 | — |
| TC_BT_164 | Năm hiển thị đúng: `"2026"` | Positive | P2 | — |
| TC_BT_165 | Khoảng ngày hiển thị đúng: `"11/03 - 17/03"` | Positive | P2 | — |

### Nhóm 12: Dịch trong tất cả Components (TC_BT_166–185)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_166 | CalendarTab: tất cả labels hiển thị tiếng Việt đúng | Positive | P1 | — |
| TC_BT_167 | GroceryList: headers, buttons, empty states hiển thị tiếng Việt | Positive | P1 | — |
| TC_BT_168 | ClearPlanModal: scope labels, warnings hiển thị tiếng Việt | Positive | P1 | — |
| TC_BT_169 | SaveTemplateModal: form labels, errors hiển thị tiếng Việt | Positive | P1 | — |
| TC_BT_170 | TemplateManager: cards, actions hiển thị tiếng Việt | Positive | P1 | — |
| TC_BT_171 | DataBackup: export/import labels hiển thị tiếng Việt | Positive | P1 | — |
| TC_BT_172 | Navigation tabs: tất cả tab hiển thị tiếng Việt | Positive | P0 | — |
| TC_BT_173 | Settings page: tất cả labels và options tiếng Việt | Positive | P1 | — |
| TC_BT_174 | Toast notifications: tất cả messages hiển thị tiếng Việt | Positive | P1 | — |
| TC_BT_175 | Error messages: tất cả lỗi hiển thị tiếng Việt | Positive | P1 | — |
| TC_BT_176 | Confirmation dialogs: tất cả nội dung tiếng Việt | Positive | P1 | — |
| TC_BT_177 | Empty states: tất cả thông báo trống hiển thị tiếng Việt | Positive | P2 | — |
| TC_BT_178 | Tooltip text: tất cả tooltip hiển thị tiếng Việt | Positive | P2 | — |
| TC_BT_179 | Placeholder text: tất cả placeholder hiển thị tiếng Việt | Positive | P2 | — |
| TC_BT_180 | Loading messages: tất cả messages loading tiếng Việt | Positive | P2 | — |
| TC_BT_181 | Success messages: tất cả thông báo thành công tiếng Việt | Positive | P2 | — |
| TC_BT_182 | Meal names hiển thị đúng: "Bữa sáng", "Bữa trưa", "Bữa tối" | Positive | P0 | — |
| TC_BT_183 | Sort options hiển thị tiếng Việt: "Tên A-Z", "Ngày tạo", etc. | Positive | P2 | — |
| TC_BT_184 | Button labels hiển thị đúng: "Lưu", "Hủy", "Xóa", "Thêm" | Positive | P0 | — |
| TC_BT_185 | Header: app name hiển thị tiếng Việt đúng | Positive | P0 | — |

### Nhóm 13: Translation Queue, Cache và Edge Cases (TC_BT_186–210)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_BT_186 | Translation queue xử lý 1 item → thành công | Positive | P1 | — |
| TC_BT_187 | Translation queue xử lý 10 items → tất cả thành công | Positive | P1 | — |
| TC_BT_188 | Queue item fail → retry đúng 3 lần | Positive | P1 | — |
| TC_BT_189 | Queue item fail 3 lần → skip item và log error | Negative | P1 | — |
| TC_BT_190 | API key missing → hiển thị error message tiếng Việt | Negative | P0 | — |
| TC_BT_191 | API key invalid → hiển thị error message phù hợp | Negative | P1 | — |
| TC_BT_192 | API timeout → thực hiện retry tự động | Negative | P1 | — |
| TC_BT_193 | Translation cache: item đã dịch → không gọi API lại | Positive | P1 | — |
| TC_BT_194 | Cache persist vào localStorage sau reload | Positive | P1 | — |
| TC_BT_195 | Cache invalidation khi content gốc thay đổi | Positive | P1 | — |
| TC_BT_196 | Queue non-blocking: UI vẫn responsive khi đang xử lý queue | Positive | P0 | — |
| TC_BT_197 | Queue progress indicator hiển thị chính xác số lượng | Positive | P1 | — |
| TC_BT_198 | Concurrent translations: 5 items gửi cùng lúc xử lý đúng | Positive | P2 | — |
| TC_BT_199 | Translation result lưu đúng vào cấu trúc LocalizedString | Positive | P1 | — |
| TC_BT_200 | Translation fallback khi offline → dùng bản vi gốc | Negative | P0 | — |
| TC_BT_201 | `escapeValue: false` → HTML trong translation render đúng | Positive | P1 | — |
| TC_BT_202 | XSS prevention: user input không inject được vào translation | Security | P0 | — |
| TC_BT_203 | Translation file size (979 dòng vi.json) → load time dưới 100ms | Boundary | P1 | — |
| TC_BT_204 | Hot reload translation trong dev mode hoạt động | Positive | P2 | — |
| TC_BT_205 | Translation key missing → console warning hiển thị trong dev mode | Positive | P2 | — |
| TC_BT_206 | Tất cả 979 dòng vi.json → không có key trùng lặp | Positive | P1 | — |
| TC_BT_207 | Tất cả interpolation variables trong vi.json → có giá trị truyền vào | Positive | P1 | — |
| TC_BT_208 | Translation format consistency: tất cả keys dùng snake_case nhất quán | Positive | P2 | — |
| TC_BT_209 | Translation completeness: tất cả UI strings đều có key tương ứng | Positive | P1 | — |
| TC_BT_210 | Language preference persist vào localStorage giữa các phiên | Positive | P1 | — |

---

## Chi tiết Test Cases (Grouped)

##### TC_BT_01–15: Core Translation Flow
- Trigger chuyển ngôn ngữ, populate hàng đợi, thanh tiến trình, kết quả dịch, hủy dịch

##### TC_BT_16–24: Error Handling & Cache
- Không có API key, lỗi API, retry, rate limit, cache hit/miss/invalidation

##### TC_BT_25–37: Content Variations
- vi↔en, roundtrip, chất lượng, độ dài văn bản, ký tự đặc biệt, số, chuỗi rỗng, bảo mật

##### TC_BT_38–49: Queue Management
- Kích thước hàng đợi, thứ tự FIFO, tạm dừng/tiếp tục, xử lý theo lô, Zustand store

##### TC_BT_50–55: Persistence
- localStorage, reload trang, import/export, cloud sync

##### TC_BT_56–67: UI/UX
- Dark mode, responsive, animation, độ chính xác tiến trình, ETA, thông báo, accessibility

##### TC_BT_68–79: Concurrent Operations
- Chuyển đổi nhanh, thao tác đồng thời, thêm/xóa/sửa item trong quá trình dịch

##### TC_BT_80–105: Cross-Feature Impact & Advanced
- Ảnh hưởng dịch lên tất cả features (tìm kiếm, sắp xếp, danh sách mua sắm, lịch, cài đặt), chi tiết localization

##### TC_BT_106–125: Đối tượng tên song ngữ (Bilingual Name Objects)
- `getLocalizedField` với `LocalizedString`, hiển thị tên vi khi lang=vi, fallback khi thiếu trường, xử lý graceful với undefined/null, dấu tiếng Việt, tone marks, tên dài, ký tự đặc biệt, type check, export/import preserve, tìm kiếm/sắp xếp theo vi, nhất quán hiển thị

##### TC_BT_126–145: i18n Key Resolution
- Resolve key tồn tại/không tồn tại, nested key, deep nested, interpolation `{{count}}` `{{date}}` `{{meal}}`, nhiều biến, key rỗng/null/undefined, biến thiếu, `useTranslation()` hook, `t()` cache, namespace, `i18n.language`, `fallbackLng`

##### TC_BT_146–165: Định dạng Ngày/Số/Tiền (Locale Formatting)
- Format ngày dd/mm/yyyy, thứ trong tuần, tháng, số phân cách nghìn bằng dấu chấm, thập phân bằng dấu phẩy, calories, weight, percentage, currency, số âm, số không, số lớn, ngày tương đối, thời gian, khoảng thời gian, viết tắt, khoảng ngày

##### TC_BT_166–185: Dịch trong tất cả Components
- CalendarTab, GroceryList, ClearPlanModal, SaveTemplateModal, TemplateManager, DataBackup, Navigation, Settings, Toast, Error messages, Confirmation dialogs, Empty states, Tooltip, Placeholder, Loading, Success, Meal names, Sort options, Button labels, Header

##### TC_BT_186–210: Translation Queue, Cache và Edge Cases
- Queue xử lý 1/10 items, retry logic, skip sau 3 lần fail, API key missing/invalid, timeout retry, cache persist/invalidation, non-blocking UI, progress indicator, concurrent translations, LocalizedString storage, offline fallback, escapeValue, XSS prevention, load time, hot reload, console warning, key uniqueness, interpolation completeness, format consistency, translation completeness, language preference persist

---

## Đề xuất Cải tiến

### Đề xuất 1: Instant Translation Preview
- **Vấn đề hiện tại**: Translation takes time. User waits without seeing progress per item.
- **Giải pháp đề xuất**: Items update one by one in real-time as translated. Shimmer effect on pending items.
- **Lý do chi tiết**: Real-time feedback feels faster than batch reveal. Reduces perceived wait time 50%.
- **Phần trăm cải thiện**: Perceived speed +50%, User patience +40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 2: Offline Translation Pack
- **Vấn đề hiện tại**: Translation requires API call (online). Offline = no translation.
- **Giải pháp đề xuất**: Download language pack for offline use. Pre-translated common words. AI for custom content.
- **Lý do chi tiết**: Offline users can't switch language. Language pack enables offline i18n.
- **Phần trăm cải thiện**: Offline accessibility +80%, API cost -40%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 3: Translation Quality Control
- **Vấn đề hiện tại**: AI translation may be inaccurate. No way to report/fix.
- **Giải pháp đề xuất**: "Edit translation" option per item. Report bad translation. User-corrected translations cached.
- **Lý do chi tiết**: User corrections improve quality over time. Community-driven accuracy.
- **Phần trăm cải thiện**: Translation accuracy +20%, User control +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Priority Translation
- **Vấn đề hiện tại**: All items translated in FIFO order. Visible items may be last.
- **Giải pháp đề xuất**: Priority queue: visible items first, then background items. On-demand instant translate on view.
- **Lý do chi tiết**: Users see untranslated content while waiting. Priority reduces this by translating visible first.
- **Phần trăm cải thiện**: Visible content delay -70%, User experience +40%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 5: Multi-Language Support
- **Vấn đề hiện tại**: Only vi and en. International users excluded.
- **Giải pháp đề xuất**: Add Japanese, Korean, Chinese, Thai, French, Spanish via same AI pipeline.
- **Lý do chi tiết**: Regional expansion requires multi-language. AI makes adding languages near-zero cost.
- **Phần trăm cải thiện**: Addressable market +300%, International users +50%
- **Mức độ ưu tiên**: Low | **Effort**: M

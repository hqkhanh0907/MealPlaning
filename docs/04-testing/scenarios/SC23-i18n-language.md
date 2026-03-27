# Scenario 23: Internationalization (i18n) & Vietnamese Language

**Version:** 2.0  
**Date:** 2026-03-15  
**Total Test Cases:** 210

---

## Mô tả tổng quan

i18n hỗ trợ đa ngôn ngữ với Vietnamese (vi) là ngôn ngữ chính. i18next library khởi tạo với resources từ src/locales/vi.json. Tất cả static labels, buttons, placeholders, error messages, toast notifications có phiên bản tiếng Việt. Translation keys tổ chức theo nhóm: common.*, meal.*, sort.*, filter.*, listToolbar.*, ai.*, notification.*, syncConflict.*. Dynamic content (tên dish, ingredient) dùng LocalizedString type. useTranslation hook cung cấp t() function và i18n object.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| i18n config | src/i18n.ts | i18next initialization, vi resources |
| vi.json | src/locales/vi.json | Vietnamese translation strings |
| useTranslation | react-i18next | Hook: t() function, language access |
| All components | *.tsx | Sử dụng t() cho mọi static text |

## Luồng nghiệp vụ

1. App khởi tạo → i18next load vi.json translations
2. Ngôn ngữ mặc định: vi (Vietnamese)
3. Components dùng useTranslation hook → t('key') → Vietnamese text
4. Dynamic content: LocalizedString type { vi: '...', en?: '...' }
5. Missing key → fallback to key name
6. Date format: DD/MM/YYYY (Vietnamese locale)
7. Number format: 1.000,5 (dấu chấm ngàn, phẩy thập phân)

## Quy tắc nghiệp vụ

1. Default language: vi (Vietnamese)
2. SupportedLang type = 'vi'
3. Translation key fallback: missing key → hiển thị key name
4. Date format Vietnamese: DD/MM/YYYY
5. Day names: Thứ Hai - Chủ Nhật
6. Number format: 1.000,5 (dot=thousands, comma=decimal)
7. Interpolation: escapeValue = false
8. All UI text phải có translation key
9. Vietnamese diacritics: đ, ă, â, ê, ô, ơ, ư phải hiển thị đúng


## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|---|---|---|---|
| TC_I18N_001 | Tab Lịch hiển thị tiếng Việt | Positive | P0 |
| TC_I18N_002 | Tab Quản lý tiếng Việt | Positive | P0 |
| TC_I18N_003 | Tab AI Phân tích tiếng Việt | Positive | P0 |
| TC_I18N_004 | Tab Mua sắm tiếng Việt | Positive | P0 |
| TC_I18N_005 | Tab Cài đặt tiếng Việt | Positive | P0 |
| TC_I18N_006 | Sub-tab Nguyên liệu | Positive | P1 |
| TC_I18N_007 | Sub-tab Món ăn | Positive | P1 |
| TC_I18N_008 | Calendar header tháng tiếng Việt | Positive | P1 |
| TC_I18N_009 | Calendar day names tiếng Việt | Positive | P1 |
| TC_I18N_010 | Navigation breadcrumb tiếng Việt | Positive | P2 |
| TC_I18N_011 | Page titles tiếng Việt | Positive | P1 |
| TC_I18N_012 | Tooltip navigation tiếng Việt | Positive | P2 |
| TC_I18N_013 | Footer text tiếng Việt (nếu có) | Positive | P3 |
| TC_I18N_014 | App title/logo text | Positive | P2 |
| TC_I18N_015 | Loading text 'Đang tải...' | Positive | P1 |
| TC_I18N_016 | Error boundary text tiếng Việt | Positive | P1 |
| TC_I18N_017 | Offline banner tiếng Việt | Positive | P2 |
| TC_I18N_018 | Welcome message tiếng Việt | Positive | P2 |
| TC_I18N_019 | Fitness tab tiếng Việt | Positive | P2 |
| TC_I18N_020 | Dashboard tab tiếng Việt | Positive | P2 |
| TC_I18N_021 | Button 'Lưu' tiếng Việt | Positive | P1 |
| TC_I18N_022 | Button 'Hủy' tiếng Việt | Positive | P1 |
| TC_I18N_023 | Button 'Xóa' tiếng Việt | Positive | P1 |
| TC_I18N_024 | Button 'Thêm' tiếng Việt | Positive | P1 |
| TC_I18N_025 | Button 'Sửa' tiếng Việt | Positive | P1 |
| TC_I18N_026 | Button 'Đóng' tiếng Việt | Positive | P1 |
| TC_I18N_027 | Button 'Xác nhận' tiếng Việt | Positive | P1 |
| TC_I18N_028 | Button 'Áp dụng' tiếng Việt | Positive | P1 |
| TC_I18N_029 | Button 'Đặt lại' tiếng Việt | Positive | P1 |
| TC_I18N_030 | Button 'Đồng bộ ngay' tiếng Việt | Positive | P1 |
| TC_I18N_031 | Button 'Đăng nhập' tiếng Việt | Positive | P1 |
| TC_I18N_032 | Button 'Đăng xuất' tiếng Việt | Positive | P1 |
| TC_I18N_033 | Button 'Tìm kiếm' tiếng Việt | Positive | P1 |
| TC_I18N_034 | Button 'Lọc' tiếng Việt | Positive | P1 |
| TC_I18N_035 | Button 'Sắp xếp' tiếng Việt | Positive | P1 |
| TC_I18N_036 | Button 'Xuất dữ liệu' tiếng Việt | Positive | P2 |
| TC_I18N_037 | Button 'Nhập dữ liệu' tiếng Việt | Positive | P2 |
| TC_I18N_038 | Button 'Chụp ảnh' tiếng Việt | Positive | P2 |
| TC_I18N_039 | Button 'Phân tích' tiếng Việt | Positive | P2 |
| TC_I18N_040 | Button 'Gợi ý AI' tiếng Việt | Positive | P2 |
| TC_I18N_041 | Button 'Lên kế hoạch' tiếng Việt | Positive | P2 |
| TC_I18N_042 | Button 'Sao chép' tiếng Việt | Positive | P2 |
| TC_I18N_043 | Button 'Xóa tất cả' tiếng Việt | Positive | P2 |
| TC_I18N_044 | Button 'Thử lại' tiếng Việt | Positive | P2 |
| TC_I18N_045 | Button 'Tiếp tục' tiếng Việt | Positive | P2 |
| TC_I18N_046 | Form label 'Tên nguyên liệu' tiếng Việt | Positive | P1 |
| TC_I18N_047 | Form label 'Calo (kcal)' tiếng Việt | Positive | P1 |
| TC_I18N_048 | Form label 'Đạm (g)' tiếng Việt | Positive | P1 |
| TC_I18N_049 | Form label 'Tinh bột (g)' tiếng Việt | Positive | P1 |
| TC_I18N_050 | Form label 'Chất béo (g)' tiếng Việt | Positive | P1 |
| TC_I18N_051 | Form label 'Chất xơ (g)' tiếng Việt | Positive | P1 |
| TC_I18N_052 | Form label 'Đơn vị' tiếng Việt | Positive | P1 |
| TC_I18N_053 | Form label 'Số lượng' tiếng Việt | Positive | P1 |
| TC_I18N_054 | Form label 'Tên món ăn' tiếng Việt | Positive | P1 |
| TC_I18N_055 | Form label 'Mô tả món ăn' tiếng Việt | Positive | P1 |
| TC_I18N_056 | Form label 'Nguyên liệu' tiếng Việt | Positive | P1 |
| TC_I18N_057 | Form label 'Bữa sáng' tiếng Việt | Positive | P1 |
| TC_I18N_058 | Form label 'Bữa trưa' tiếng Việt | Positive | P1 |
| TC_I18N_059 | Form label 'Bữa tối' tiếng Việt | Positive | P1 |
| TC_I18N_060 | Form label 'Ngày' tiếng Việt | Positive | P1 |
| TC_I18N_061 | Form label 'Tên mẫu' tiếng Việt | Positive | P1 |
| TC_I18N_062 | Form label 'Mục tiêu calo' tiếng Việt | Positive | P1 |
| TC_I18N_063 | Form label 'Mục tiêu đạm' tiếng Việt | Positive | P1 |
| TC_I18N_064 | Form label 'Mục tiêu tinh bột' tiếng Việt | Positive | P1 |
| TC_I18N_065 | Form label 'Mục tiêu chất béo' tiếng Việt | Positive | P1 |
| TC_I18N_066 | Form label 'Tên người dùng' tiếng Việt | Positive | P2 |
| TC_I18N_067 | Form label 'Cân nặng' tiếng Việt | Positive | P2 |
| TC_I18N_068 | Form label 'Chiều cao' tiếng Việt | Positive | P2 |
| TC_I18N_069 | Form label 'Tuổi' tiếng Việt | Positive | P2 |
| TC_I18N_070 | Form label 'Giới tính' tiếng Việt | Positive | P2 |
| TC_I18N_071 | Form label 'Tìm kiếm... (placeholder)' tiếng Việt | Positive | P2 |
| TC_I18N_072 | Form label 'Nhập tên... (placeholder)' tiếng Việt | Positive | P2 |
| TC_I18N_073 | Form label 'Chọn đơn vị (placeholder)' tiếng Việt | Positive | P2 |
| TC_I18N_074 | Form label 'Chọn ngày (placeholder)' tiếng Việt | Positive | P2 |
| TC_I18N_075 | Form label 'Nhập số lượng (placeholder)' tiếng Việt | Positive | P2 |
| TC_I18N_076 | Error message 'Trường bắt buộc' tiếng Việt | Positive | P1 |
| TC_I18N_077 | Error message 'Giá trị phải là số' tiếng Việt | Positive | P1 |
| TC_I18N_078 | Error message 'Tên quá dài' tiếng Việt | Positive | P1 |
| TC_I18N_079 | Error message 'Tên đã tồn tại' tiếng Việt | Positive | P1 |
| TC_I18N_080 | Error message 'Không có kết nối mạng' tiếng Việt | Positive | P1 |
| TC_I18N_081 | Error message 'Lỗi server, thử lại sau' tiếng Việt | Positive | P1 |
| TC_I18N_082 | Error message 'Lỗi đồng bộ' tiếng Việt | Positive | P1 |
| TC_I18N_083 | Error message 'Phiên đăng nhập hết hạn' tiếng Việt | Positive | P1 |
| TC_I18N_084 | Error message 'Lỗi nhập file' tiếng Việt | Positive | P1 |
| TC_I18N_085 | Error message 'Lỗi xuất file' tiếng Việt | Positive | P1 |
| TC_I18N_086 | Error message 'Xác nhận xóa?' tiếng Việt | Positive | P1 |
| TC_I18N_087 | Error message 'Xóa nguyên liệu này?' tiếng Việt | Positive | P1 |
| TC_I18N_088 | Error message 'Xóa món ăn này?' tiếng Việt | Positive | P1 |
| TC_I18N_089 | Error message 'Xóa kế hoạch?' tiếng Việt | Positive | P1 |
| TC_I18N_090 | Error message 'Số lượng phải > 0' tiếng Việt | Positive | P1 |
| TC_I18N_091 | Error message 'Email không hợp lệ' tiếng Việt | Positive | P1 |
| TC_I18N_092 | Error message 'Calo không hợp lệ' tiếng Việt | Positive | P1 |
| TC_I18N_093 | Error message 'Ảnh không phải thức ăn' tiếng Việt | Positive | P1 |
| TC_I18N_094 | Error message 'AI không phản hồi' tiếng Việt | Positive | P1 |
| TC_I18N_095 | Error message 'Quá giới hạn API' tiếng Việt | Positive | P1 |
| TC_I18N_096 | Error message 'Dữ liệu không hợp lệ' tiếng Việt | Positive | P1 |
| TC_I18N_097 | Error message 'Hết dung lượng' tiếng Việt | Positive | P1 |
| TC_I18N_098 | Error message 'File quá lớn' tiếng Việt | Positive | P1 |
| TC_I18N_099 | Error message 'Timeout, thử lại' tiếng Việt | Positive | P1 |
| TC_I18N_100 | Error message 'Token hết hạn' tiếng Việt | Positive | P1 |
| TC_I18N_101 | Modal title 'Thêm nguyên liệu' tiếng Việt | Positive | P1 |
| TC_I18N_102 | Modal title 'Sửa nguyên liệu' tiếng Việt | Positive | P1 |
| TC_I18N_103 | Modal title 'Thêm món ăn' tiếng Việt | Positive | P1 |
| TC_I18N_104 | Modal title 'Sửa món ăn' tiếng Việt | Positive | P1 |
| TC_I18N_105 | Modal title 'Lên kế hoạch bữa ăn' tiếng Việt | Positive | P1 |
| TC_I18N_106 | Modal title 'Lưu mẫu' tiếng Việt | Positive | P1 |
| TC_I18N_107 | Modal title 'Xung đột đồng bộ' tiếng Việt | Positive | P1 |
| TC_I18N_108 | Modal title 'Xác nhận xóa' tiếng Việt | Positive | P1 |
| TC_I18N_109 | Modal title 'AI gợi ý nguyên liệu' tiếng Việt | Positive | P1 |
| TC_I18N_110 | Modal title 'AI gợi ý kế hoạch' tiếng Việt | Positive | P1 |
| TC_I18N_111 | Modal title 'Bộ lọc' tiếng Việt | Positive | P1 |
| TC_I18N_112 | Modal title 'Cài đặt mục tiêu' tiếng Việt | Positive | P1 |
| TC_I18N_113 | Modal title 'Xuất dữ liệu' tiếng Việt | Positive | P1 |
| TC_I18N_114 | Modal title 'Nhập dữ liệu' tiếng Việt | Positive | P1 |
| TC_I18N_115 | Modal title 'Chi tiết nguyên liệu' tiếng Việt | Positive | P1 |
| TC_I18N_116 | Modal title 'Chi tiết món ăn' tiếng Việt | Positive | P2 |
| TC_I18N_117 | Modal title 'Chọn món ăn' tiếng Việt | Positive | P2 |
| TC_I18N_118 | Modal title 'Chọn nguyên liệu' tiếng Việt | Positive | P2 |
| TC_I18N_119 | Modal title 'Sao chép kế hoạch' tiếng Việt | Positive | P2 |
| TC_I18N_120 | Modal title 'Xóa kế hoạch' tiếng Việt | Positive | P2 |
| TC_I18N_121 | Modal title 'Quản lý mẫu' tiếng Việt | Positive | P2 |
| TC_I18N_122 | Modal title 'Thông tin ứng dụng' tiếng Việt | Positive | P2 |
| TC_I18N_123 | Modal title 'Hướng dẫn' tiếng Việt | Positive | P2 |
| TC_I18N_124 | Modal title 'Phản hồi' tiếng Việt | Positive | P2 |
| TC_I18N_125 | Modal title 'Cài đặt chung' tiếng Việt | Positive | P2 |
| TC_I18N_126 | Empty/info text 'Chưa có nguyên liệu nào' tiếng Việt | Positive | P1 |
| TC_I18N_127 | Empty/info text 'Chưa có món ăn nào' tiếng Việt | Positive | P1 |
| TC_I18N_128 | Empty/info text 'Chưa có kế hoạch' tiếng Việt | Positive | P1 |
| TC_I18N_129 | Empty/info text 'Chưa có mẫu' tiếng Việt | Positive | P1 |
| TC_I18N_130 | Empty/info text 'Không tìm thấy kết quả' tiếng Việt | Positive | P1 |
| TC_I18N_131 | Empty/info text 'Không có kết quả lọc' tiếng Việt | Positive | P1 |
| TC_I18N_132 | Empty/info text 'Chưa có mục mua sắm' tiếng Việt | Positive | P1 |
| TC_I18N_133 | Empty/info text 'Chưa lên kế hoạch ngày này' tiếng Việt | Positive | P1 |
| TC_I18N_134 | Empty/info text 'Chào buổi sáng' tiếng Việt | Positive | P2 |
| TC_I18N_135 | Empty/info text 'Chào buổi trưa' tiếng Việt | Positive | P2 |
| TC_I18N_136 | Empty/info text 'Chào buổi tối' tiếng Việt | Positive | P2 |
| TC_I18N_137 | Empty/info text 'Chào mừng đến MealPlaning' tiếng Việt | Positive | P2 |
| TC_I18N_138 | Empty/info text 'Bắt đầu bằng cách thêm nguyên liệu' tiếng Việt | Positive | P2 |
| TC_I18N_139 | Empty/info text 'Dùng AI để phân tích ảnh' tiếng Việt | Positive | P2 |
| TC_I18N_140 | Empty/info text 'Lên kế hoạch bữa ăn' tiếng Việt | Positive | P2 |
| TC_I18N_141 | Empty/info text 'Thêm nguyên liệu đầu tiên' tiếng Việt | Positive | P2 |
| TC_I18N_142 | Empty/info text 'Khám phá tính năng' tiếng Việt | Positive | P2 |
| TC_I18N_143 | Empty/info text 'Chưa có dữ liệu' tiếng Việt | Positive | P2 |
| TC_I18N_144 | Empty/info text 'Tính năng mới' tiếng Việt | Positive | P2 |
| TC_I18N_145 | Empty/info text 'Cập nhật ứng dụng' tiếng Việt | Positive | P2 |
| TC_I18N_146 | Empty/info text 'Đồng bộ để sao lưu' tiếng Việt | Positive | P2 |
| TC_I18N_147 | Empty/info text 'Thiết lập mục tiêu' tiếng Việt | Positive | P2 |
| TC_I18N_148 | Empty/info text 'Tùy chỉnh giao diện' tiếng Việt | Positive | P2 |
| TC_I18N_149 | Empty/info text 'Hỗ trợ và phản hồi' tiếng Việt | Positive | P2 |
| TC_I18N_150 | Empty/info text 'Phiên bản ứng dụng' tiếng Việt | Positive | P2 |
| TC_I18N_151 | Date format DD/MM/YYYY tiếng Việt | Positive | P1 |
| TC_I18N_152 | Thứ Hai tiếng Việt | Positive | P1 |
| TC_I18N_153 | Thứ Ba tiếng Việt | Positive | P1 |
| TC_I18N_154 | Thứ Tư tiếng Việt | Positive | P1 |
| TC_I18N_155 | Thứ Năm tiếng Việt | Positive | P1 |
| TC_I18N_156 | Thứ Sáu tiếng Việt | Positive | P1 |
| TC_I18N_157 | Thứ Bảy tiếng Việt | Positive | P1 |
| TC_I18N_158 | Chủ Nhật tiếng Việt | Positive | P1 |
| TC_I18N_159 | Tháng 1-12 tiếng Việt tiếng Việt | Positive | P1 |
| TC_I18N_160 | Hôm nay tiếng Việt | Positive | P1 |
| TC_I18N_161 | Hôm qua tiếng Việt | Positive | P1 |
| TC_I18N_162 | Ngày mai tiếng Việt | Positive | P1 |
| TC_I18N_163 | Relative date: 2 ngày trước tiếng Việt | Positive | P1 |
| TC_I18N_164 | Number 1.000 (thousands) tiếng Việt | Positive | P1 |
| TC_I18N_165 | Number 0,5 (decimal comma) tiếng Việt | Positive | P1 |
| TC_I18N_166 | Calories unit 'kcal' tiếng Việt | Positive | P2 |
| TC_I18N_167 | Weight unit 'g' tiếng Việt | Positive | P2 |
| TC_I18N_168 | Volume unit 'ml' tiếng Việt | Positive | P2 |
| TC_I18N_169 | Portion 'phần' tiếng Việt | Positive | P2 |
| TC_I18N_170 | Percentage format '%' tiếng Việt | Positive | P2 |
| TC_I18N_171 | Duration '5 phút' tiếng Việt | Positive | P2 |
| TC_I18N_172 | Temperature (nếu có) tiếng Việt | Positive | P2 |
| TC_I18N_173 | Currency (nếu có) tiếng Việt | Positive | P2 |
| TC_I18N_174 | Last sync: time ago format tiếng Việt | Positive | P2 |
| TC_I18N_175 | Date range format tiếng Việt | Positive | P2 |
| TC_I18N_176 | Tất cả keys vi.json có giá trị | Positive | P0 |
| TC_I18N_177 | Không có English text trong UI | Positive | P0 |
| TC_I18N_178 | Nested key resolution: common.save | Positive | P1 |
| TC_I18N_179 | Interpolation: {count} items | Positive | P1 |
| TC_I18N_180 | Missing key → fallback to key name | Positive | P1 |
| TC_I18N_181 | meal.breakfast = 'Sáng' | Positive | P1 |
| TC_I18N_182 | meal.lunch = 'Trưa' | Positive | P1 |
| TC_I18N_183 | meal.dinner = 'Tối' | Positive | P1 |
| TC_I18N_184 | sort.nameAsc = 'Tên A-Z' | Positive | P2 |
| TC_I18N_185 | sort.calDesc = 'Calo giảm' | Positive | P2 |
| TC_I18N_186 | filter labels tiếng Việt | Positive | P2 |
| TC_I18N_187 | ai.analyzing = 'Đang phân tích' | Positive | P2 |
| TC_I18N_188 | notification.syncSuccess | Positive | P2 |
| TC_I18N_189 | notification.syncError | Positive | P2 |
| TC_I18N_190 | syncConflict.title | Positive | P2 |
| TC_I18N_191 | Nutrition: Calo | Positive | P1 |
| TC_I18N_192 | Nutrition: Đạm | Positive | P1 |
| TC_I18N_193 | Nutrition: Tinh bột | Positive | P1 |
| TC_I18N_194 | Nutrition: Chất béo | Positive | P1 |
| TC_I18N_195 | Nutrition: Chất xơ | Positive | P2 |
| TC_I18N_196 | Consistency: same term = same translation | Positive | P1 |
| TC_I18N_197 | listToolbar labels | Positive | P2 |
| TC_I18N_198 | Settings section labels | Positive | P2 |
| TC_I18N_199 | toast notifications Vietnamese | Positive | P1 |
| TC_I18N_200 | New features text Vietnamese | Positive | P2 |
| TC_I18N_201 | Vietnamese đ hiển thị đúng | Positive | P1 |
| TC_I18N_202 | Vietnamese ă hiển thị | Positive | P1 |
| TC_I18N_203 | Vietnamese â hiển thị | Positive | P1 |
| TC_I18N_204 | Vietnamese ê hiển thị | Positive | P1 |
| TC_I18N_205 | Vietnamese ô hiển thị | Positive | P1 |
| TC_I18N_206 | Vietnamese ơ hiển thị | Positive | P1 |
| TC_I18N_207 | Vietnamese ư hiển thị | Positive | P1 |
| TC_I18N_208 | Long Vietnamese text wrapping | Positive | P2 |
| TC_I18N_209 | Font supports Vietnamese | Positive | P0 |
| TC_I18N_210 | i18n performance: switch < 100ms | Positive | P2 |

---

## Chi tiết Test Cases

### Nhóm 1: Tab Headers & Navigation (Tab & Điều hướng) (TC_I18N_001 – TC_I18N_020)

### TC_I18N_001: Tab Lịch hiển thị tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_001 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App mở |
| **Các bước thực hiện** | 1. Kiểm tra bottom tab/sidebar |
| **Kết quả mong đợi** | Tab hiển thị 'Lịch' |
| **Kết quả test thực tế** | — |

### TC_I18N_002: Tab Quản lý tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_002 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App mở |
| **Các bước thực hiện** | 1. Kiểm tra tab |
| **Kết quả mong đợi** | 'Quản lý' |
| **Kết quả test thực tế** | — |

### TC_I18N_003: Tab AI Phân tích tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_003 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App mở |
| **Các bước thực hiện** | 1. Kiểm tra tab |
| **Kết quả mong đợi** | 'AI Phân tích' hoặc tương tự |
| **Kết quả test thực tế** | — |

### TC_I18N_004: Tab Mua sắm tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_004 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App mở |
| **Các bước thực hiện** | 1. Kiểm tra tab |
| **Kết quả mong đợi** | 'Mua sắm' |
| **Kết quả test thực tế** | — |

### TC_I18N_005: Tab Cài đặt tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_005 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App mở |
| **Các bước thực hiện** | 1. Kiểm tra tab |
| **Kết quả mong đợi** | 'Cài đặt' |
| **Kết quả test thực tế** | — |

### TC_I18N_006: Sub-tab Nguyên liệu

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_006 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Tab Quản lý |
| **Các bước thực hiện** | 1. Kiểm tra sub-tabs |
| **Kết quả mong đợi** | 'Nguyên liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_007: Sub-tab Món ăn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_007 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Tab Quản lý |
| **Các bước thực hiện** | 1. Kiểm tra sub-tabs |
| **Kết quả mong đợi** | 'Món ăn' |
| **Kết quả test thực tế** | — |

### TC_I18N_008: Calendar header tháng tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_008 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Tab Lịch |
| **Các bước thực hiện** | 1. Kiểm tra header |
| **Kết quả mong đợi** | 'Tháng 3, 2026' hoặc tương tự |
| **Kết quả test thực tế** | — |

### TC_I18N_009: Calendar day names tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_009 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Tab Lịch |
| **Các bước thực hiện** | 1. Kiểm tra day headers |
| **Kết quả mong đợi** | T2, T3, T4, T5, T6, T7, CN |
| **Kết quả test thực tế** | — |

### TC_I18N_010: Navigation breadcrumb tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_010 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Desktop navigation |
| **Các bước thực hiện** | 1. Kiểm tra breadcrumb |
| **Kết quả mong đợi** | Labels tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_011: Page titles tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_011 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Mỗi tab |
| **Các bước thực hiện** | 1. Kiểm tra page title |
| **Kết quả mong đợi** | Title bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_012: Tooltip navigation tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_012 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Hover nav items |
| **Các bước thực hiện** | 1. Kiểm tra tooltip |
| **Kết quả mong đợi** | Tooltip tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_013: Footer text tiếng Việt (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_013 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | App footer |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Footer tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_014: App title/logo text

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_014 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Header/logo |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Tên app tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_015: Loading text 'Đang tải...'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_015 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App loading |
| **Các bước thực hiện** | 1. Kiểm tra loading text |
| **Kết quả mong đợi** | 'Đang tải...' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_016: Error boundary text tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_016 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error state |
| **Các bước thực hiện** | 1. Trigger error |
| **Kết quả mong đợi** | 'Đã xảy ra lỗi' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_017: Offline banner tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_017 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Offline state |
| **Các bước thực hiện** | 1. Ngắt mạng |
| **Kết quả mong đợi** | 'Không có kết nối mạng' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_018: Welcome message tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_018 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mở app |
| **Các bước thực hiện** | 1. Kiểm tra greeting |
| **Kết quả mong đợi** | 'Chào buổi sáng/trưa/tối' theo thời gian |
| **Kết quả test thực tế** | — |

### TC_I18N_019: Fitness tab tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_019 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Fitness tab |
| **Các bước thực hiện** | 1. Kiểm tra labels |
| **Kết quả mong đợi** | Labels tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_020: Dashboard tab tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_020 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dashboard tab |
| **Các bước thực hiện** | 1. Kiểm tra labels |
| **Kết quả mong đợi** | Labels tiếng Việt |
| **Kết quả test thực tế** | — |

### Nhóm 2: Button Labels (Nhãn nút) (TC_I18N_021 – TC_I18N_045)

### TC_I18N_021: Button 'Lưu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_021 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Lưu' |
| **Kết quả mong đợi** | Button hiển thị 'Lưu' |
| **Kết quả test thực tế** | — |

### TC_I18N_022: Button 'Hủy' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_022 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Hủy' |
| **Kết quả mong đợi** | Button hiển thị 'Hủy' |
| **Kết quả test thực tế** | — |

### TC_I18N_023: Button 'Xóa' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_023 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Xóa' |
| **Kết quả mong đợi** | Button hiển thị 'Xóa' |
| **Kết quả test thực tế** | — |

### TC_I18N_024: Button 'Thêm' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_024 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Thêm' |
| **Kết quả mong đợi** | Button hiển thị 'Thêm' |
| **Kết quả test thực tế** | — |

### TC_I18N_025: Button 'Sửa' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_025 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Sửa' |
| **Kết quả mong đợi** | Button hiển thị 'Sửa' |
| **Kết quả test thực tế** | — |

### TC_I18N_026: Button 'Đóng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_026 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Đóng' |
| **Kết quả mong đợi** | Button hiển thị 'Đóng' |
| **Kết quả test thực tế** | — |

### TC_I18N_027: Button 'Xác nhận' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_027 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Xác nhận' |
| **Kết quả mong đợi** | Button hiển thị 'Xác nhận' |
| **Kết quả test thực tế** | — |

### TC_I18N_028: Button 'Áp dụng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_028 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Áp dụng' |
| **Kết quả mong đợi** | Button hiển thị 'Áp dụng' |
| **Kết quả test thực tế** | — |

### TC_I18N_029: Button 'Đặt lại' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_029 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Đặt lại' |
| **Kết quả mong đợi** | Button hiển thị 'Đặt lại' |
| **Kết quả test thực tế** | — |

### TC_I18N_030: Button 'Đồng bộ ngay' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_030 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Đồng bộ ngay' |
| **Kết quả mong đợi** | Button hiển thị 'Đồng bộ ngay' |
| **Kết quả test thực tế** | — |

### TC_I18N_031: Button 'Đăng nhập' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_031 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Đăng nhập' |
| **Kết quả mong đợi** | Button hiển thị 'Đăng nhập' |
| **Kết quả test thực tế** | — |

### TC_I18N_032: Button 'Đăng xuất' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_032 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Đăng xuất' |
| **Kết quả mong đợi** | Button hiển thị 'Đăng xuất' |
| **Kết quả test thực tế** | — |

### TC_I18N_033: Button 'Tìm kiếm' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_033 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Tìm kiếm' |
| **Kết quả mong đợi** | Button hiển thị 'Tìm kiếm' |
| **Kết quả test thực tế** | — |

### TC_I18N_034: Button 'Lọc' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_034 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Lọc' |
| **Kết quả mong đợi** | Button hiển thị 'Lọc' |
| **Kết quả test thực tế** | — |

### TC_I18N_035: Button 'Sắp xếp' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_035 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Sắp xếp' |
| **Kết quả mong đợi** | Button hiển thị 'Sắp xếp' |
| **Kết quả test thực tế** | — |

### TC_I18N_036: Button 'Xuất dữ liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_036 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Xuất dữ liệu' |
| **Kết quả mong đợi** | Button hiển thị 'Xuất dữ liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_037: Button 'Nhập dữ liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_037 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Nhập dữ liệu' |
| **Kết quả mong đợi** | Button hiển thị 'Nhập dữ liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_038: Button 'Chụp ảnh' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_038 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Chụp ảnh' |
| **Kết quả mong đợi** | Button hiển thị 'Chụp ảnh' |
| **Kết quả test thực tế** | — |

### TC_I18N_039: Button 'Phân tích' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_039 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Phân tích' |
| **Kết quả mong đợi** | Button hiển thị 'Phân tích' |
| **Kết quả test thực tế** | — |

### TC_I18N_040: Button 'Gợi ý AI' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_040 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Gợi ý AI' |
| **Kết quả mong đợi** | Button hiển thị 'Gợi ý AI' |
| **Kết quả test thực tế** | — |

### TC_I18N_041: Button 'Lên kế hoạch' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_041 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Lên kế hoạch' |
| **Kết quả mong đợi** | Button hiển thị 'Lên kế hoạch' |
| **Kết quả test thực tế** | — |

### TC_I18N_042: Button 'Sao chép' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_042 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Sao chép' |
| **Kết quả mong đợi** | Button hiển thị 'Sao chép' |
| **Kết quả test thực tế** | — |

### TC_I18N_043: Button 'Xóa tất cả' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_043 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Xóa tất cả' |
| **Kết quả mong đợi** | Button hiển thị 'Xóa tất cả' |
| **Kết quả test thực tế** | — |

### TC_I18N_044: Button 'Thử lại' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_044 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Thử lại' |
| **Kết quả mong đợi** | Button hiển thị 'Thử lại' |
| **Kết quả test thực tế** | — |

### TC_I18N_045: Button 'Tiếp tục' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_045 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút có text 'Tiếp tục' |
| **Kết quả mong đợi** | Button hiển thị 'Tiếp tục' |
| **Kết quả test thực tế** | — |

### Nhóm 3: Form Labels & Placeholders (Nhãn form) (TC_I18N_046 – TC_I18N_075)

### TC_I18N_046: Form label 'Tên nguyên liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_046 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Tên nguyên liệu' |
| **Kết quả mong đợi** | Label hiển thị 'Tên nguyên liệu' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_047: Form label 'Calo (kcal)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_047 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Calo (kcal)' |
| **Kết quả mong đợi** | Label hiển thị 'Calo (kcal)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_048: Form label 'Đạm (g)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_048 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Đạm (g)' |
| **Kết quả mong đợi** | Label hiển thị 'Đạm (g)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_049: Form label 'Tinh bột (g)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_049 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Tinh bột (g)' |
| **Kết quả mong đợi** | Label hiển thị 'Tinh bột (g)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_050: Form label 'Chất béo (g)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_050 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Chất béo (g)' |
| **Kết quả mong đợi** | Label hiển thị 'Chất béo (g)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_051: Form label 'Chất xơ (g)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_051 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Chất xơ (g)' |
| **Kết quả mong đợi** | Label hiển thị 'Chất xơ (g)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_052: Form label 'Đơn vị' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_052 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Đơn vị' |
| **Kết quả mong đợi** | Label hiển thị 'Đơn vị' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_053: Form label 'Số lượng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_053 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Số lượng' |
| **Kết quả mong đợi** | Label hiển thị 'Số lượng' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_054: Form label 'Tên món ăn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_054 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Tên món ăn' |
| **Kết quả mong đợi** | Label hiển thị 'Tên món ăn' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_055: Form label 'Mô tả món ăn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_055 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Mô tả món ăn' |
| **Kết quả mong đợi** | Label hiển thị 'Mô tả món ăn' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_056: Form label 'Nguyên liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_056 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Nguyên liệu' |
| **Kết quả mong đợi** | Label hiển thị 'Nguyên liệu' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_057: Form label 'Bữa sáng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_057 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Bữa sáng' |
| **Kết quả mong đợi** | Label hiển thị 'Bữa sáng' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_058: Form label 'Bữa trưa' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_058 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Bữa trưa' |
| **Kết quả mong đợi** | Label hiển thị 'Bữa trưa' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_059: Form label 'Bữa tối' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_059 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Bữa tối' |
| **Kết quả mong đợi** | Label hiển thị 'Bữa tối' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_060: Form label 'Ngày' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_060 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Ngày' |
| **Kết quả mong đợi** | Label hiển thị 'Ngày' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_061: Form label 'Tên mẫu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_061 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Tên mẫu' |
| **Kết quả mong đợi** | Label hiển thị 'Tên mẫu' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_062: Form label 'Mục tiêu calo' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_062 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Mục tiêu calo' |
| **Kết quả mong đợi** | Label hiển thị 'Mục tiêu calo' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_063: Form label 'Mục tiêu đạm' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_063 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Mục tiêu đạm' |
| **Kết quả mong đợi** | Label hiển thị 'Mục tiêu đạm' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_064: Form label 'Mục tiêu tinh bột' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_064 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Mục tiêu tinh bột' |
| **Kết quả mong đợi** | Label hiển thị 'Mục tiêu tinh bột' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_065: Form label 'Mục tiêu chất béo' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_065 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Mục tiêu chất béo' |
| **Kết quả mong đợi** | Label hiển thị 'Mục tiêu chất béo' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_066: Form label 'Tên người dùng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_066 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Tên người dùng' |
| **Kết quả mong đợi** | Label hiển thị 'Tên người dùng' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_067: Form label 'Cân nặng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_067 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Cân nặng' |
| **Kết quả mong đợi** | Label hiển thị 'Cân nặng' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_068: Form label 'Chiều cao' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_068 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Chiều cao' |
| **Kết quả mong đợi** | Label hiển thị 'Chiều cao' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_069: Form label 'Tuổi' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_069 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Tuổi' |
| **Kết quả mong đợi** | Label hiển thị 'Tuổi' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_070: Form label 'Giới tính' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_070 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Giới tính' |
| **Kết quả mong đợi** | Label hiển thị 'Giới tính' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_071: Form label 'Tìm kiếm... (placeholder)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_071 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Tìm kiếm... (placeholder)' |
| **Kết quả mong đợi** | Label hiển thị 'Tìm kiếm... (placeholder)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_072: Form label 'Nhập tên... (placeholder)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_072 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Nhập tên... (placeholder)' |
| **Kết quả mong đợi** | Label hiển thị 'Nhập tên... (placeholder)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_073: Form label 'Chọn đơn vị (placeholder)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_073 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Chọn đơn vị (placeholder)' |
| **Kết quả mong đợi** | Label hiển thị 'Chọn đơn vị (placeholder)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_074: Form label 'Chọn ngày (placeholder)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_074 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Chọn ngày (placeholder)' |
| **Kết quả mong đợi** | Label hiển thị 'Chọn ngày (placeholder)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_075: Form label 'Nhập số lượng (placeholder)' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_075 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form mở |
| **Các bước thực hiện** | 1. Kiểm tra label 'Nhập số lượng (placeholder)' |
| **Kết quả mong đợi** | Label hiển thị 'Nhập số lượng (placeholder)' bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### Nhóm 4: Error & Validation Messages (Thông báo lỗi) (TC_I18N_076 – TC_I18N_100)

### TC_I18N_076: Error message 'Trường bắt buộc' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_076 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Trường bắt buộc' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_077: Error message 'Giá trị phải là số' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_077 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Giá trị phải là số' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_078: Error message 'Tên quá dài' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_078 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Tên quá dài' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_079: Error message 'Tên đã tồn tại' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_079 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Tên đã tồn tại' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_080: Error message 'Không có kết nối mạng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_080 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Không có kết nối mạng' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_081: Error message 'Lỗi server, thử lại sau' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_081 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Lỗi server, thử lại sau' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_082: Error message 'Lỗi đồng bộ' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_082 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Lỗi đồng bộ' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_083: Error message 'Phiên đăng nhập hết hạn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_083 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Phiên đăng nhập hết hạn' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_084: Error message 'Lỗi nhập file' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_084 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Lỗi nhập file' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_085: Error message 'Lỗi xuất file' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_085 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Lỗi xuất file' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_086: Error message 'Xác nhận xóa?' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_086 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Xác nhận xóa?' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_087: Error message 'Xóa nguyên liệu này?' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_087 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Xóa nguyên liệu này?' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_088: Error message 'Xóa món ăn này?' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_088 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Xóa món ăn này?' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_089: Error message 'Xóa kế hoạch?' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_089 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Xóa kế hoạch?' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_090: Error message 'Số lượng phải > 0' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_090 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Số lượng phải > 0' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_091: Error message 'Email không hợp lệ' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_091 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Email không hợp lệ' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_092: Error message 'Calo không hợp lệ' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_092 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Calo không hợp lệ' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_093: Error message 'Ảnh không phải thức ăn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_093 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Ảnh không phải thức ăn' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_094: Error message 'AI không phản hồi' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_094 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'AI không phản hồi' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_095: Error message 'Quá giới hạn API' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_095 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Quá giới hạn API' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_096: Error message 'Dữ liệu không hợp lệ' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_096 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Dữ liệu không hợp lệ' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_097: Error message 'Hết dung lượng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_097 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Hết dung lượng' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_098: Error message 'File quá lớn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_098 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'File quá lớn' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_099: Error message 'Timeout, thử lại' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_099 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Timeout, thử lại' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_100: Error message 'Token hết hạn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_100 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error triggered |
| **Các bước thực hiện** | 1. Trigger lỗi tương ứng |
| **Kết quả mong đợi** | Message hiển thị 'Token hết hạn' tiếng Việt |
| **Kết quả test thực tế** | — |

### Nhóm 5: Modal Titles (Tiêu đề modal) (TC_I18N_101 – TC_I18N_125)

### TC_I18N_101: Modal title 'Thêm nguyên liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_101 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Thêm nguyên liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_102: Modal title 'Sửa nguyên liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_102 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Sửa nguyên liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_103: Modal title 'Thêm món ăn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_103 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Thêm món ăn' |
| **Kết quả test thực tế** | — |

### TC_I18N_104: Modal title 'Sửa món ăn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_104 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Sửa món ăn' |
| **Kết quả test thực tế** | — |

### TC_I18N_105: Modal title 'Lên kế hoạch bữa ăn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_105 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Lên kế hoạch bữa ăn' |
| **Kết quả test thực tế** | — |

### TC_I18N_106: Modal title 'Lưu mẫu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_106 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Lưu mẫu' |
| **Kết quả test thực tế** | — |

### TC_I18N_107: Modal title 'Xung đột đồng bộ' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_107 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Xung đột đồng bộ' |
| **Kết quả test thực tế** | — |

### TC_I18N_108: Modal title 'Xác nhận xóa' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_108 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Xác nhận xóa' |
| **Kết quả test thực tế** | — |

### TC_I18N_109: Modal title 'AI gợi ý nguyên liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_109 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'AI gợi ý nguyên liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_110: Modal title 'AI gợi ý kế hoạch' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_110 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'AI gợi ý kế hoạch' |
| **Kết quả test thực tế** | — |

### TC_I18N_111: Modal title 'Bộ lọc' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_111 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Bộ lọc' |
| **Kết quả test thực tế** | — |

### TC_I18N_112: Modal title 'Cài đặt mục tiêu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_112 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Cài đặt mục tiêu' |
| **Kết quả test thực tế** | — |

### TC_I18N_113: Modal title 'Xuất dữ liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_113 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Xuất dữ liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_114: Modal title 'Nhập dữ liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_114 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Nhập dữ liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_115: Modal title 'Chi tiết nguyên liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_115 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Chi tiết nguyên liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_116: Modal title 'Chi tiết món ăn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_116 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Chi tiết món ăn' |
| **Kết quả test thực tế** | — |

### TC_I18N_117: Modal title 'Chọn món ăn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_117 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Chọn món ăn' |
| **Kết quả test thực tế** | — |

### TC_I18N_118: Modal title 'Chọn nguyên liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_118 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Chọn nguyên liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_119: Modal title 'Sao chép kế hoạch' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_119 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Sao chép kế hoạch' |
| **Kết quả test thực tế** | — |

### TC_I18N_120: Modal title 'Xóa kế hoạch' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_120 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Xóa kế hoạch' |
| **Kết quả test thực tế** | — |

### TC_I18N_121: Modal title 'Quản lý mẫu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_121 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Quản lý mẫu' |
| **Kết quả test thực tế** | — |

### TC_I18N_122: Modal title 'Thông tin ứng dụng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_122 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Thông tin ứng dụng' |
| **Kết quả test thực tế** | — |

### TC_I18N_123: Modal title 'Hướng dẫn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_123 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Hướng dẫn' |
| **Kết quả test thực tế** | — |

### TC_I18N_124: Modal title 'Phản hồi' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_124 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Phản hồi' |
| **Kết quả test thực tế** | — |

### TC_I18N_125: Modal title 'Cài đặt chung' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_125 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Mở modal tương ứng |
| **Kết quả mong đợi** | Title hiển thị 'Cài đặt chung' |
| **Kết quả test thực tế** | — |

### Nhóm 6: Empty States & Informational (Trạng thái rỗng) (TC_I18N_126 – TC_I18N_150)

### TC_I18N_126: Empty/info text 'Chưa có nguyên liệu nào' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_126 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chưa có nguyên liệu nào' |
| **Kết quả mong đợi** | Text hiển thị 'Chưa có nguyên liệu nào' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_127: Empty/info text 'Chưa có món ăn nào' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_127 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chưa có món ăn nào' |
| **Kết quả mong đợi** | Text hiển thị 'Chưa có món ăn nào' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_128: Empty/info text 'Chưa có kế hoạch' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_128 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chưa có kế hoạch' |
| **Kết quả mong đợi** | Text hiển thị 'Chưa có kế hoạch' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_129: Empty/info text 'Chưa có mẫu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_129 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chưa có mẫu' |
| **Kết quả mong đợi** | Text hiển thị 'Chưa có mẫu' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_130: Empty/info text 'Không tìm thấy kết quả' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_130 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Không tìm thấy kết quả' |
| **Kết quả mong đợi** | Text hiển thị 'Không tìm thấy kết quả' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_131: Empty/info text 'Không có kết quả lọc' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_131 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Không có kết quả lọc' |
| **Kết quả mong đợi** | Text hiển thị 'Không có kết quả lọc' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_132: Empty/info text 'Chưa có mục mua sắm' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_132 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chưa có mục mua sắm' |
| **Kết quả mong đợi** | Text hiển thị 'Chưa có mục mua sắm' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_133: Empty/info text 'Chưa lên kế hoạch ngày này' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_133 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chưa lên kế hoạch ngày này' |
| **Kết quả mong đợi** | Text hiển thị 'Chưa lên kế hoạch ngày này' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_134: Empty/info text 'Chào buổi sáng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_134 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chào buổi sáng' |
| **Kết quả mong đợi** | Text hiển thị 'Chào buổi sáng' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_135: Empty/info text 'Chào buổi trưa' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_135 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chào buổi trưa' |
| **Kết quả mong đợi** | Text hiển thị 'Chào buổi trưa' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_136: Empty/info text 'Chào buổi tối' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_136 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chào buổi tối' |
| **Kết quả mong đợi** | Text hiển thị 'Chào buổi tối' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_137: Empty/info text 'Chào mừng đến MealPlaning' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_137 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chào mừng đến MealPlaning' |
| **Kết quả mong đợi** | Text hiển thị 'Chào mừng đến MealPlaning' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_138: Empty/info text 'Bắt đầu bằng cách thêm nguyên liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_138 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Bắt đầu bằng cách thêm nguyên liệu' |
| **Kết quả mong đợi** | Text hiển thị 'Bắt đầu bằng cách thêm nguyên liệu' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_139: Empty/info text 'Dùng AI để phân tích ảnh' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_139 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Dùng AI để phân tích ảnh' |
| **Kết quả mong đợi** | Text hiển thị 'Dùng AI để phân tích ảnh' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_140: Empty/info text 'Lên kế hoạch bữa ăn' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_140 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Lên kế hoạch bữa ăn' |
| **Kết quả mong đợi** | Text hiển thị 'Lên kế hoạch bữa ăn' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_141: Empty/info text 'Thêm nguyên liệu đầu tiên' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_141 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Thêm nguyên liệu đầu tiên' |
| **Kết quả mong đợi** | Text hiển thị 'Thêm nguyên liệu đầu tiên' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_142: Empty/info text 'Khám phá tính năng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_142 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Khám phá tính năng' |
| **Kết quả mong đợi** | Text hiển thị 'Khám phá tính năng' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_143: Empty/info text 'Chưa có dữ liệu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_143 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Chưa có dữ liệu' |
| **Kết quả mong đợi** | Text hiển thị 'Chưa có dữ liệu' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_144: Empty/info text 'Tính năng mới' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_144 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Tính năng mới' |
| **Kết quả mong đợi** | Text hiển thị 'Tính năng mới' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_145: Empty/info text 'Cập nhật ứng dụng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_145 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Cập nhật ứng dụng' |
| **Kết quả mong đợi** | Text hiển thị 'Cập nhật ứng dụng' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_146: Empty/info text 'Đồng bộ để sao lưu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_146 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Đồng bộ để sao lưu' |
| **Kết quả mong đợi** | Text hiển thị 'Đồng bộ để sao lưu' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_147: Empty/info text 'Thiết lập mục tiêu' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_147 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Thiết lập mục tiêu' |
| **Kết quả mong đợi** | Text hiển thị 'Thiết lập mục tiêu' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_148: Empty/info text 'Tùy chỉnh giao diện' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_148 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Tùy chỉnh giao diện' |
| **Kết quả mong đợi** | Text hiển thị 'Tùy chỉnh giao diện' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_149: Empty/info text 'Hỗ trợ và phản hồi' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_149 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Hỗ trợ và phản hồi' |
| **Kết quả mong đợi** | Text hiển thị 'Hỗ trợ và phản hồi' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_150: Empty/info text 'Phiên bản ứng dụng' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_150 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra text 'Phiên bản ứng dụng' |
| **Kết quả mong đợi** | Text hiển thị 'Phiên bản ứng dụng' tiếng Việt |
| **Kết quả test thực tế** | — |

### Nhóm 7: Date & Number Format (Định dạng ngày & số) (TC_I18N_151 – TC_I18N_175)

### TC_I18N_151: Date format DD/MM/YYYY tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_151 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | Date 15/03/2026 hiển thị đúng format |
| **Kết quả test thực tế** | — |

### TC_I18N_152: Thứ Hai tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_152 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | Day name 'Thứ Hai' |
| **Kết quả test thực tế** | — |

### TC_I18N_153: Thứ Ba tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_153 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'Thứ Ba' |
| **Kết quả test thực tế** | — |

### TC_I18N_154: Thứ Tư tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_154 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'Thứ Tư' |
| **Kết quả test thực tế** | — |

### TC_I18N_155: Thứ Năm tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_155 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'Thứ Năm' |
| **Kết quả test thực tế** | — |

### TC_I18N_156: Thứ Sáu tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_156 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'Thứ Sáu' |
| **Kết quả test thực tế** | — |

### TC_I18N_157: Thứ Bảy tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_157 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'Thứ Bảy' |
| **Kết quả test thực tế** | — |

### TC_I18N_158: Chủ Nhật tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_158 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'Chủ Nhật' |
| **Kết quả test thực tế** | — |

### TC_I18N_159: Tháng 1-12 tiếng Việt tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_159 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | Month names tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_160: Hôm nay tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_160 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'Hôm nay' cho current date |
| **Kết quả test thực tế** | — |

### TC_I18N_161: Hôm qua tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_161 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'Hôm qua' |
| **Kết quả test thực tế** | — |

### TC_I18N_162: Ngày mai tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_162 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'Ngày mai' |
| **Kết quả test thực tế** | — |

### TC_I18N_163: Relative date: 2 ngày trước tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_163 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | '2 ngày trước' |
| **Kết quả test thực tế** | — |

### TC_I18N_164: Number 1.000 (thousands) tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_164 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | Dấu chấm ngàn |
| **Kết quả test thực tế** | — |

### TC_I18N_165: Number 0,5 (decimal comma) tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_165 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | Dấu phẩy thập phân |
| **Kết quả test thực tế** | — |

### TC_I18N_166: Calories unit 'kcal' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_166 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'kcal' suffix |
| **Kết quả test thực tế** | — |

### TC_I18N_167: Weight unit 'g' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_167 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'g' suffix |
| **Kết quả test thực tế** | — |

### TC_I18N_168: Volume unit 'ml' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_168 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'ml' suffix |
| **Kết quả test thực tế** | — |

### TC_I18N_169: Portion 'phần' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_169 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | 'phần' hoặc 'miếng' |
| **Kết quả test thực tế** | — |

### TC_I18N_170: Percentage format '%' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_170 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | '75%' format |
| **Kết quả test thực tế** | — |

### TC_I18N_171: Duration '5 phút' tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_171 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | Time duration tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_172: Temperature (nếu có) tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_172 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | Temperature format |
| **Kết quả test thực tế** | — |

### TC_I18N_173: Currency (nếu có) tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_173 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | VND format |
| **Kết quả test thực tế** | — |

### TC_I18N_174: Last sync: time ago format tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_174 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | '5 phút trước' |
| **Kết quả test thực tế** | — |

### TC_I18N_175: Date range format tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_175 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | UI hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | '01/03 - 07/03/2026' |
| **Kết quả test thực tế** | — |

### Nhóm 8: Translation Coverage & Quality (Độ phủ dịch thuật) (TC_I18N_176 – TC_I18N_200)

### TC_I18N_176: Tất cả keys vi.json có giá trị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_176 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Audit vi.json |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | Không có key nào có value rỗng |
| **Kết quả test thực tế** | — |

### TC_I18N_177: Không có English text trong UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_177 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Scan toàn bộ UI |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | Không thấy English-only text |
| **Kết quả test thực tế** | — |

### TC_I18N_178: Nested key resolution: common.save

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_178 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Kiểm tra t('common.save') |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | Trả về 'Lưu' |
| **Kết quả test thực tế** | — |

### TC_I18N_179: Interpolation: {count} items

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_179 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Text có variable |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | '{count} nguyên liệu' → '5 nguyên liệu' |
| **Kết quả test thực tế** | — |

### TC_I18N_180: Missing key → fallback to key name

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_180 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dùng key không tồn tại |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | Hiển thị key name thay vì crash |
| **Kết quả test thực tế** | — |

### TC_I18N_181: meal.breakfast = 'Sáng'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_181 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | t('meal.breakfast') |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Sáng' |
| **Kết quả test thực tế** | — |

### TC_I18N_182: meal.lunch = 'Trưa'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_182 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | t('meal.lunch') |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Trưa' |
| **Kết quả test thực tế** | — |

### TC_I18N_183: meal.dinner = 'Tối'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_183 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | t('meal.dinner') |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Tối' |
| **Kết quả test thực tế** | — |

### TC_I18N_184: sort.nameAsc = 'Tên A-Z'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_184 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | t('sort.nameAsc') |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Tên A-Z' |
| **Kết quả test thực tế** | — |

### TC_I18N_185: sort.calDesc = 'Calo giảm'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_185 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | t('sort.calDesc') |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Calo giảm dần' |
| **Kết quả test thực tế** | — |

### TC_I18N_186: filter labels tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_186 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Filter sheet labels |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | Tất cả tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_187: ai.analyzing = 'Đang phân tích'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_187 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI loading text |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Đang phân tích...' |
| **Kết quả test thực tế** | — |

### TC_I18N_188: notification.syncSuccess

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_188 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync success |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Đồng bộ thành công' |
| **Kết quả test thực tế** | — |

### TC_I18N_189: notification.syncError

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_189 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync error |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Lỗi đồng bộ' |
| **Kết quả test thực tế** | — |

### TC_I18N_190: syncConflict.title

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_190 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Conflict modal |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Xung đột đồng bộ' |
| **Kết quả test thực tế** | — |

### TC_I18N_191: Nutrition: Calo

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_191 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Nutrition labels |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Calo' |
| **Kết quả test thực tế** | — |

### TC_I18N_192: Nutrition: Đạm

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_192 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Labels |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Đạm' |
| **Kết quả test thực tế** | — |

### TC_I18N_193: Nutrition: Tinh bột

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_193 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Labels |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Tinh bột' |
| **Kết quả test thực tế** | — |

### TC_I18N_194: Nutrition: Chất béo

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_194 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Labels |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Chất béo' |
| **Kết quả test thực tế** | — |

### TC_I18N_195: Nutrition: Chất xơ

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_195 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Labels |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Chất xơ' |
| **Kết quả test thực tế** | — |

### TC_I18N_196: Consistency: same term = same translation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_196 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Audit |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | 'Delete' luôn = 'Xóa' |
| **Kết quả test thực tế** | — |

### TC_I18N_197: listToolbar labels

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_197 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Toolbar |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | Tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_198: Settings section labels

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_198 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Settings |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | Tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_199: toast notifications Vietnamese

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_199 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | All toasts |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | Tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_I18N_200: New features text Vietnamese

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_200 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | New feature labels |
| **Các bước thực hiện** | 1. Kiểm tra translation |
| **Kết quả mong đợi** | Tiếng Việt |
| **Kết quả test thực tế** | — |

### Nhóm 9: Special Characters & Edge Cases (Ký tự đặc biệt) (TC_I18N_201 – TC_I18N_210)

### TC_I18N_201: Vietnamese đ hiển thị đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_201 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Text có 'đ' |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 'đ' hiển thị đúng, không bị ? hoặc □ |
| **Kết quả test thực tế** | — |

### TC_I18N_202: Vietnamese ă hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_202 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Text có 'ă' |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 'ă' đúng |
| **Kết quả test thực tế** | — |

### TC_I18N_203: Vietnamese â hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_203 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Text có 'â' |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 'â' đúng |
| **Kết quả test thực tế** | — |

### TC_I18N_204: Vietnamese ê hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_204 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Text có 'ê' |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 'ê' đúng |
| **Kết quả test thực tế** | — |

### TC_I18N_205: Vietnamese ô hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_205 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Text có 'ô' |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 'ô' đúng |
| **Kết quả test thực tế** | — |

### TC_I18N_206: Vietnamese ơ hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_206 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Text có 'ơ' |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 'ơ' đúng |
| **Kết quả test thực tế** | — |

### TC_I18N_207: Vietnamese ư hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_207 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Text có 'ư' |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 'ư' đúng |
| **Kết quả test thực tế** | — |

### TC_I18N_208: Long Vietnamese text wrapping

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_208 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Text dài |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Text wrap đúng, không bị cắt |
| **Kết quả test thực tế** | — |

### TC_I18N_209: Font supports Vietnamese

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_209 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Toàn app |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Font hiển thị tất cả Vietnamese chars |
| **Kết quả test thực tế** | — |

### TC_I18N_210: i18n performance: switch < 100ms

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_I18N_210 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Đổi ngôn ngữ |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | UI update < 100ms |
| **Kết quả test thực tế** | — |

---

## Đề xuất Cải tiến

### Đề xuất 1: Auto-Detect Browser Language
- **Vấn đề hiện tại**: Default vi. No auto-detection.
- **Giải pháp đề xuất**: On first visit, detect navigator.language.
- **Phần trăm cải thiện**: First-time UX +50%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 2: Additional Languages
- **Vấn đề hiện tại**: Only Vietnamese supported.
- **Giải pháp đề xuất**: Add English, Japanese, Korean.
- **Phần trăm cải thiện**: Market +200%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 3: Translation Contributors
- **Vấn đề hiện tại**: No community translation.
- **Giải pháp đề xuất**: "Suggest better translation" on each label.
- **Phần trăm cải thiện**: Quality +25%
- **Mức độ ưu tiên**: Low | **Effort**: M

### Đề xuất 4: Language-Specific Content
- **Vấn đề hiện tại**: Same sample data regardless of language.
- **Giải pháp đề xuất**: Pre-loaded Vietnamese dishes for vi users.
- **Phần trăm cải thiện**: Relevance +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 5: In-Context Translation Preview
- **Vấn đề hiện tại**: Can't see translations in context.
- **Giải pháp đề xuất**: Dev mode: hover text → show key + values.
- **Phần trăm cải thiện**: QA efficiency +40%
- **Mức độ ưu tiên**: Low | **Effort**: M

# Scenario 16: Data Backup & Import/Export

**Version:** 2.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Data Backup cho phép user export toàn bộ dữ liệu app (ingredients, dishes, plans, templates, user-profile) thành JSON file và import lại. Backup button trong Settings tab. Export tạo downloadable file (Web: Blob → Object URL → hidden `<a>` → click → download → cleanup; Native: Capacitor Filesystem + Share). Import validates schema trước khi replace (file picker → FileReader → JSON.parse → validateImportData → confirm dialog → onImport).

### Source Code Reference

- **Component:** `DataBackup.tsx`
- **Props:** `onImport: (data: Record<string, unknown>) => void`
- **EXPORT_KEYS:** `['mp-ingredients', 'mp-dishes', 'mp-day-plans', 'mp-user-profile', 'meal-templates']`
- **Export metadata:** `_exportedAt` (ISO string), `_version` (`'1.0'`)
- **File name format:** `meal-planner-backup-YYYY-MM-DD.json`
- **Validation:** `validateImportData()` — filter EXPORT_KEYS, tách valid/invalid entries
- **Backup health:** kiểm tra `mp-last-sync-at`, `mp-last-local-backup-at`
- **Health levels:** good (≤3 ngày, xanh), warning (4–7 ngày, vàng), critical (>7 ngày, đỏ)
- **LAST_LOCAL_BACKUP_KEY:** `'mp-last-local-backup-at'`
- **Import confirmation:** hiện summary (số lượng ingredients, dishes, plans)

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| DataBackup | DataBackup.tsx | Backup/Import UI, export/import logic |
| SettingsTab | SettingsTab.tsx | Container chứa DataBackup |

## Luồng nghiệp vụ

1. **Export (Web):** click "Export" → gather tất cả EXPORT_KEYS từ localStorage → tạo JSON (pretty-printed, 2-space indent) với metadata (`_exportedAt`, `_version`) → tạo Blob → Object URL → hidden `<a>` → click → download → revoke URL → cập nhật `LAST_LOCAL_BACKUP_KEY`
2. **Export (Native):** click "Export" → gather data → tạo JSON → Capacitor Filesystem write → Share dialog
3. **Import:** click "Import" → file picker (accept=".json") → FileReader đọc file → JSON.parse → `validateImportData()` filter EXPORT_KEYS → confirm dialog hiện summary → onImport callback → cập nhật stores
4. **Validation:** `validateImportData()` kiểm tra từng key trong EXPORT_KEYS, tách valid entries và invalid entries, trả về kết quả
5. **Backup Health:** component mount → đọc `mp-last-local-backup-at` và `mp-last-sync-at` → tính khoảng cách ngày → xác định level (good/warning/critical) → hiển thị badge + message

## Quy tắc nghiệp vụ

1. Export bao gồm 5 EXPORT_KEYS: `mp-ingredients`, `mp-dishes`, `mp-day-plans`, `mp-user-profile`, `meal-templates`
2. Export file format: JSON pretty-printed (2-space indent) với metadata (`_exportedAt` ISO, `_version` "1.0")
3. Export file name: `meal-planner-backup-YYYY-MM-DD.json`
4. Import validates schema trước khi áp dụng — dùng `validateImportData()`
5. Import là destructive: thay thế TOÀN BỘ dữ liệu hiện tại
6. Confirmation dialog bắt buộc trước khi import — hiện summary counts
7. File không hợp lệ → error message, không thay đổi data
8. File corrupt/partial → reject hoàn toàn
9. Backup health indicator: good (≤3 ngày), warning (4–7 ngày), critical (>7 ngày)
10. `LAST_LOCAL_BACKUP_KEY` cập nhật sau mỗi export thành công

---

## Test Cases (210 TCs)

### Nhóm 1: Export Flow (TC_DB_01–14)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_01 | Export button hiển thị trong Settings | Positive | P0 | — |
| TC_DB_02 | Import button hiển thị trong Settings | Positive | P0 | — |
| TC_DB_03 | Click Export → file tải về | Positive | P0 | — |
| TC_DB_04 | Export file là JSON hợp lệ | Positive | P0 | — |
| TC_DB_05 | Export bao gồm mp-ingredients | Positive | P0 | — |
| TC_DB_06 | Export bao gồm mp-dishes | Positive | P0 | — |
| TC_DB_07 | Export bao gồm mp-day-plans | Positive | P0 | — |
| TC_DB_08 | Export bao gồm meal-templates | Positive | P1 | — |
| TC_DB_09 | Export bao gồm mp-user-profile | Positive | P1 | — |
| TC_DB_10 | Export bao gồm goals (nếu có) | Positive | P1 | — |
| TC_DB_11 | Export bao gồm metadata (_exportedAt, _version) | Positive | P1 | — |
| TC_DB_12 | Export filename format: meal-planner-backup-YYYY-MM-DD.json | Positive | P2 | — |
| TC_DB_13 | Export timestamp _exportedAt là ISO string hợp lệ | Positive | P2 | — |
| TC_DB_14 | Export _version = "1.0" trong metadata | Positive | P2 | — |

### Nhóm 2: Import Flow (TC_DB_15–26)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_15 | Click Import → file picker mở ra | Positive | P0 | — |
| TC_DB_16 | Chọn file JSON hợp lệ → hiện preview/confirm | Positive | P0 | — |
| TC_DB_17 | Confirm import → dữ liệu được thay thế | Positive | P0 | — |
| TC_DB_18 | Cancel import → không có thay đổi | Positive | P1 | — |
| TC_DB_19 | Import → mp-ingredients được thay thế | Positive | P1 | — |
| TC_DB_20 | Import → mp-dishes được thay thế | Positive | P1 | — |
| TC_DB_21 | Import → mp-day-plans được thay thế | Positive | P1 | — |
| TC_DB_22 | Import → meal-templates được thay thế | Positive | P1 | — |
| TC_DB_23 | Import → mp-user-profile được thay thế | Positive | P1 | — |
| TC_DB_24 | Import → goals được thay thế (nếu có) | Positive | P1 | — |
| TC_DB_25 | Import thành công → hiện notification | Positive | P1 | — |
| TC_DB_26 | App refresh sau import thành công | Positive | P1 | — |

### Nhóm 3: Validation & Edge Cases (TC_DB_27–43)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_27 | Import file JSON không hợp lệ → error | Negative | P0 | — |
| TC_DB_28 | Import file corrupt → reject | Negative | P0 | — |
| TC_DB_29 | Import file rỗng → error | Negative | P1 | — |
| TC_DB_30 | Import file không phải JSON (.txt) → error | Negative | P1 | — |
| TC_DB_31 | Import file ảnh → error | Negative | P2 | — |
| TC_DB_32 | JSON hợp lệ nhưng sai schema → error | Negative | P0 | — |
| TC_DB_33 | Thiếu required fields → error | Negative | P1 | — |
| TC_DB_34 | Extra unknown fields → bị bỏ qua | Edge | P2 | — |
| TC_DB_35 | Giá trị null trong data → xử lý được | Edge | P2 | — |
| TC_DB_36 | Mảng rỗng → chấp nhận | Edge | P2 | — |
| TC_DB_37 | File rất lớn (10MB) → xử lý hoặc cảnh báo | Boundary | P2 | — |
| TC_DB_38 | File rất nhỏ (data rỗng) → chấp nhận | Boundary | P2 | — |
| TC_DB_39 | File có 0 ingredients → chấp nhận | Edge | P2 | — |
| TC_DB_40 | File có 1000 ingredients → xử lý được | Boundary | P2 | — |
| TC_DB_41 | File có ký tự đặc biệt trong data | Edge | P2 | — |
| TC_DB_42 | File có text tiếng Việt → xử lý đúng | Positive | P1 | — |
| TC_DB_43 | File có emoji trong data → xử lý đúng | Edge | P2 | — |

### Nhóm 4: Roundtrip & Tích hợp (TC_DB_44–58)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_44 | Overwrite confirmation dialog hiển thị | Positive | P0 | — |
| TC_DB_45 | Overwrite warning message rõ ràng | Positive | P1 | — |
| TC_DB_46 | Export → Import roundtrip (data identical) | Positive | P0 | — |
| TC_DB_47 | Roundtrip: ingredients count khớp | Positive | P1 | — |
| TC_DB_48 | Roundtrip: dishes count khớp | Positive | P1 | — |
| TC_DB_49 | Roundtrip: plans count khớp | Positive | P1 | — |
| TC_DB_50 | Roundtrip: templates được giữ nguyên | Positive | P1 | — |
| TC_DB_51 | Roundtrip: goals được giữ nguyên | Positive | P1 | — |
| TC_DB_52 | Nhiều lần export-import cycles → data nhất quán | Positive | P2 | — |
| TC_DB_53 | Export từ browser này → import browser khác | Positive | P2 | — |
| TC_DB_54 | Export version cũ → import app version mới | Edge | P1 | — |
| TC_DB_55 | Version migration khi import | Edge | P1 | — |
| TC_DB_56 | Import → nutrition được tính lại | Positive | P1 | — |
| TC_DB_57 | Import → grocery list được tính lại | Positive | P1 | — |
| TC_DB_58 | Import → calendar được refresh | Positive | P1 | — |

### Nhóm 5: UI/UX (TC_DB_59–70)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_59 | Dark mode export/import UI hiển thị đúng | Positive | P2 | — |
| TC_DB_60 | i18n labels hiển thị đúng ngôn ngữ | Positive | P2 | — |
| TC_DB_61 | Mobile layout responsive | Positive | P2 | — |
| TC_DB_62 | Desktop layout hiển thị đúng | Positive | P2 | — |
| TC_DB_63 | Export loading state hiển thị | Positive | P2 | — |
| TC_DB_64 | Import loading state hiển thị | Positive | P2 | — |
| TC_DB_65 | Export error handling hiển thị lỗi | Negative | P1 | — |
| TC_DB_66 | Import error → rollback dữ liệu | Negative | P1 | — |
| TC_DB_67 | Import partial failure → full rollback | Negative | P1 | — |
| TC_DB_68 | Screen reader accessible | Positive | P3 | — |
| TC_DB_69 | Keyboard navigation accessible | Positive | P3 | — |
| TC_DB_70 | File drag-drop import (nếu hỗ trợ) | Positive | P3 | — |

### Nhóm 6: Tính năng Nâng cao (TC_DB_71–105)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_71 | Export bao gồm grocery check state | Positive | P2 | — |
| TC_DB_72 | Export bao gồm translation cache | Positive | P2 | — |
| TC_DB_73 | Export file size hợp lý (<5MB typical) | Boundary | P2 | — |
| TC_DB_74 | Concurrent export-import → không corrupt | Edge | P2 | — |
| TC_DB_75 | Export trong khi cloud sync → xử lý đúng | Edge | P2 | — |
| TC_DB_76 | Import trong khi cloud sync → xử lý đúng | Edge | P2 | — |
| TC_DB_77 | Export khi app data rỗng → file có metadata | Edge | P2 | — |
| TC_DB_78 | Import vào app rỗng → data populated | Positive | P1 | — |
| TC_DB_79 | Export nhiều lần → nội dung giống nhau | Positive | P2 | — |
| TC_DB_80 | Import cùng file 2 lần → data giống nhau | Edge | P2 | — |
| TC_DB_81 | Export button text/icon hiển thị đúng | Positive | P2 | — |
| TC_DB_82 | Import button text/icon hiển thị đúng | Positive | P2 | — |
| TC_DB_83 | File picker filter chỉ .json | Positive | P2 | — |
| TC_DB_84 | Export file date trong filename đúng | Positive | P2 | — |
| TC_DB_85 | Backup reminder nhắc nhở (nếu có) | Positive | P3 | — |
| TC_DB_86 | Auto-backup trước khi import | Positive | P2 | — |
| TC_DB_87 | Restore từ auto-backup | Positive | P2 | — |
| TC_DB_88 | Backup history (nếu có) | Positive | P3 | — |
| TC_DB_89 | Scheduled backup tự động (nếu có) | Positive | P3 | — |
| TC_DB_90 | Backup lên Google Drive (nếu có) | Positive | P2 | — |
| TC_DB_91 | Restore từ Google Drive (nếu có) | Positive | P2 | — |
| TC_DB_92 | Export dưới dạng CSV (nếu có) | Positive | P3 | — |
| TC_DB_93 | Export dưới dạng PDF report (nếu có) | Positive | P3 | — |
| TC_DB_94 | Selective export (chỉ ingredients) | Positive | P3 | — |
| TC_DB_95 | Selective import (merge specific data) | Positive | P3 | — |
| TC_DB_96 | Import preview hiện data summary trước confirm | Positive | P2 | — |
| TC_DB_97 | Import diff hiện thay đổi sắp xảy ra | Positive | P3 | — |
| TC_DB_98 | Export encryption tùy chọn (nếu có) | Positive | P3 | — |
| TC_DB_99 | Import decryption (nếu có) | Positive | P3 | — |
| TC_DB_100 | Data integrity hash check | Positive | P2 | — |
| TC_DB_101 | Export progress cho data lớn | Positive | P2 | — |
| TC_DB_102 | Import progress cho data lớn | Positive | P2 | — |
| TC_DB_103 | Mobile: share exported file qua native share | Positive | P2 | — |
| TC_DB_104 | Export bao gồm app preferences | Positive | P2 | — |
| TC_DB_105 | Backup size estimation trước export | Positive | P3 | — |

### Nhóm 7: Export Chi tiết (TC_DB_106–125)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_106 | Export → file tải về thành công trên trình duyệt | Positive | P0 | — |
| TC_DB_107 | Export file name đúng format: meal-planner-backup-2026-03-11.json | Positive | P1 | — |
| TC_DB_108 | Export file content là valid JSON (JSON.parse không lỗi) | Positive | P0 | — |
| TC_DB_109 | Export file chứa key mp-ingredients | Positive | P0 | — |
| TC_DB_110 | Export file chứa key mp-dishes | Positive | P0 | — |
| TC_DB_111 | Export file chứa key mp-day-plans | Positive | P0 | — |
| TC_DB_112 | Export file chứa key mp-user-profile | Positive | P0 | — |
| TC_DB_113 | Export file chứa key meal-templates | Positive | P0 | — |
| TC_DB_114 | Export file chứa _exportedAt là ISO string hợp lệ | Positive | P1 | — |
| TC_DB_115 | Export file chứa _version = "1.0" | Positive | P1 | — |
| TC_DB_116 | Export JSON được pretty-printed (2-space indent) | Positive | P2 | — |
| TC_DB_117 | Export file size tương ứng với lượng data trong localStorage | Positive | P2 | — |
| TC_DB_118 | Export khi 0 data → file chỉ chứa metadata và empty arrays | Edge | P2 | — |
| TC_DB_119 | Export khi có 1 ingredient → file chứa đúng 1 ingredient | Positive | P1 | — |
| TC_DB_120 | Export khi có 100 dishes → tất cả 100 dishes có trong file | Boundary | P2 | — |
| TC_DB_121 | Export khi có 1000+ items → file không bị corrupt | Boundary | P1 | — |
| TC_DB_122 | Export thành công → LAST_LOCAL_BACKUP_KEY được cập nhật timestamp | Positive | P0 | — |
| TC_DB_123 | Export thành công → backup health chuyển sang "good" (xanh) | Positive | P1 | — |
| TC_DB_124 | Export → loading spinner hiển thị trong quá trình tạo file | Positive | P2 | — |
| TC_DB_125 | Export button bị disabled trong khi đang loading | Positive | P2 | — |

### Nhóm 8: Import Validation — Xác thực Import (TC_DB_126–145)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_126 | Import file JSON hợp lệ với đủ EXPORT_KEYS → preview hiển thị | Positive | P0 | — |
| TC_DB_127 | Import file không phải JSON → hiện error "File không hợp lệ" | Negative | P0 | — |
| TC_DB_128 | Import file JSON nhưng không chứa bất kỳ EXPORT_KEY nào → error | Negative | P0 | — |
| TC_DB_129 | Import file có 1 EXPORT_KEY (chỉ mp-ingredients) → partial import OK | Edge | P1 | — |
| TC_DB_130 | Import file có đủ 5 EXPORT_KEYS → full import thành công | Positive | P0 | — |
| TC_DB_131 | Import file có extra keys ngoài EXPORT_KEYS → extra keys bị ignored | Edge | P2 | — |
| TC_DB_132 | Import file có invalid key values (sai kiểu dữ liệu) → warning hiển thị | Negative | P1 | — |
| TC_DB_133 | Import file rỗng {} → error "Không có dữ liệu hợp lệ" | Negative | P1 | — |
| TC_DB_134 | Import file null → error xử lý đúng | Negative | P1 | — |
| TC_DB_135 | Import file là array [] → error "Định dạng không hợp lệ" | Negative | P1 | — |
| TC_DB_136 | Import file là string thuần → error parse | Negative | P1 | — |
| TC_DB_137 | Import file rất lớn (10MB) → xử lý được hoặc hiện warning kích thước | Boundary | P2 | — |
| TC_DB_138 | Import file 0 bytes → error "File rỗng" | Negative | P1 | — |
| TC_DB_139 | Import file corrupt JSON (thiếu bracket cuối) → parse error hiển thị | Negative | P0 | — |
| TC_DB_140 | Import file UTF-8 encoding → đọc và parse OK | Positive | P1 | — |
| TC_DB_141 | Import file với Unicode tiếng Việt (dấu, ký tự đặc biệt) → hiển thị đúng | Positive | P1 | — |
| TC_DB_142 | Import file từ version cũ hơn → backward compatible, import OK | Edge | P1 | — |
| TC_DB_143 | Import file từ version mới hơn → hiện warning version mismatch | Edge | P2 | — |
| TC_DB_144 | Import file có mp-ingredients là array → validateImportData chấp nhận | Positive | P1 | — |
| TC_DB_145 | Import file có mp-ingredients không phải array → validateImportData skip entry | Negative | P1 | — |

### Nhóm 9: Confirmation Dialog — Xác nhận Import (TC_DB_146–165)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_146 | Confirm dialog hiển thị sau khi validateImportData thành công | Positive | P0 | — |
| TC_DB_147 | Dialog hiện summary: "X nguyên liệu, Y món ăn, Z kế hoạch" | Positive | P0 | — |
| TC_DB_148 | Summary count chính xác khớp với data trong file import | Positive | P1 | — |
| TC_DB_149 | Dialog hiện warning: "Dữ liệu hiện tại sẽ bị ghi đè" | Positive | P0 | — |
| TC_DB_150 | Click Confirm button → import thực hiện, onImport callback gọi | Positive | P0 | — |
| TC_DB_151 | Click Cancel button → không import, file bỏ qua, data không đổi | Positive | P0 | — |
| TC_DB_152 | Dialog dark mode style hiển thị đúng màu sắc | Positive | P2 | — |
| TC_DB_153 | Dialog mobile responsive — không bị tràn, scroll được | Positive | P2 | — |
| TC_DB_154 | Dialog animation open/close mượt mà | Positive | P3 | — |
| TC_DB_155 | Click Confirm → loading state hiển thị trên button | Positive | P2 | — |
| TC_DB_156 | Confirm thành công → success toast notification hiển thị | Positive | P1 | — |
| TC_DB_157 | Cancel → không có thay đổi nào trong localStorage | Positive | P1 | — |
| TC_DB_158 | Summary với 0 ingredients → hiện "0 nguyên liệu" | Edge | P2 | — |
| TC_DB_159 | Summary với 1000 dishes → hiện "1.000 món ăn" (format number) | Edge | P2 | — |
| TC_DB_160 | Dialog nhấn Escape key → cancel import | Positive | P2 | — |
| TC_DB_161 | Dialog click backdrop (overlay) → cancel import | Positive | P2 | — |
| TC_DB_162 | Invalid keys được thông báo: "Bỏ qua: key1, key2" | Positive | P2 | — |
| TC_DB_163 | Confirm → tất cả stores được cập nhật đồng bộ | Positive | P0 | — |
| TC_DB_164 | Confirm → ingredients store refreshed sau import | Positive | P1 | — |
| TC_DB_165 | Confirm → dishes store refreshed sau import | Positive | P1 | — |

### Nhóm 10: Backup Health Indicator (TC_DB_166–185)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_166 | Chưa từng backup (không có timestamp) → critical (đỏ) | Negative | P0 | — |
| TC_DB_167 | Backup 1 ngày trước → good (xanh lá) | Positive | P0 | — |
| TC_DB_168 | Backup 3 ngày trước → good (xanh lá) — ranh giới good | Boundary | P1 | — |
| TC_DB_169 | Backup 4 ngày trước → warning (vàng) — ranh giới warning | Boundary | P1 | — |
| TC_DB_170 | Backup 7 ngày trước → warning (vàng) — ranh giới cuối warning | Boundary | P1 | — |
| TC_DB_171 | Backup 8 ngày trước → critical (đỏ) — ranh giới critical | Boundary | P1 | — |
| TC_DB_172 | Backup 30 ngày trước → critical (đỏ) | Negative | P1 | — |
| TC_DB_173 | Health message: "Sao lưu lần cuối: 1 ngày trước" | Positive | P1 | — |
| TC_DB_174 | Health message: "Sao lưu lần cuối: 5 ngày trước" | Positive | P1 | — |
| TC_DB_175 | Health message: "Chưa từng sao lưu" khi không có backup nào | Negative | P1 | — |
| TC_DB_176 | Health icon: ✓ cho good, ⚠️ cho warning, ✗ cho critical | Positive | P2 | — |
| TC_DB_177 | Health badge color đúng theo level (xanh/vàng/đỏ) | Positive | P1 | — |
| TC_DB_178 | Health tính từ mp-last-local-backup-at timestamp | Positive | P0 | — |
| TC_DB_179 | Health tính từ mp-last-sync-at nếu có cloud sync | Positive | P2 | — |
| TC_DB_180 | Health dùng timestamp mới nhất (local hoặc cloud) để xác định level | Edge | P2 | — |
| TC_DB_181 | Health cập nhật ngay sau export thành công (chuyển good) | Positive | P1 | — |
| TC_DB_182 | Health cập nhật khi component mount (đọc giá trị hiện tại) | Positive | P1 | — |
| TC_DB_183 | Health dark mode style hiển thị đúng màu | Positive | P2 | — |
| TC_DB_184 | Health mobile layout không bị cắt, hiển thị đầy đủ | Positive | P2 | — |
| TC_DB_185 | Health tooltip chi tiết khi hover (hiện timestamp chính xác) | Positive | P3 | — |

### Nhóm 11: Round-trip và Edge Cases (TC_DB_186–210)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_DB_186 | Export → Import → data identical (full round-trip verification) | Positive | P0 | — |
| TC_DB_187 | Export → Import → ingredients count giống hệt | Positive | P0 | — |
| TC_DB_188 | Export → Import → dishes count giống hệt | Positive | P0 | — |
| TC_DB_189 | Export → Import → day-plans count giống hệt | Positive | P0 | — |
| TC_DB_190 | Export → Import → meal-templates count giống hệt | Positive | P1 | — |
| TC_DB_191 | Export → Import → user-profile data giống hệt | Positive | P1 | — |
| TC_DB_192 | Import → Export → Import → data consistent qua 3 bước | Positive | P1 | — |
| TC_DB_193 | Export trên Chrome → Import trên Safari → data đúng | Positive | P2 | — |
| TC_DB_194 | Export trên mobile → Import trên desktop → data đúng | Positive | P2 | — |
| TC_DB_195 | Export → edit file thủ công → Import → validateImportData kiểm tra | Edge | P2 | — |
| TC_DB_196 | Import ghi đè TOÀN BỘ existing data (không merge) | Positive | P0 | — |
| TC_DB_197 | Import → old data hoàn toàn bị thay thế, không còn dấu vết | Positive | P0 | — |
| TC_DB_198 | Import partial (chỉ có mp-ingredients) → chỉ ingredients thay đổi | Edge | P1 | — |
| TC_DB_199 | Import → undo nếu có tính năng → rollback về trạng thái trước | Positive | P3 | — |
| TC_DB_200 | Import 2 lần liên tục cùng file → lần 2 ghi đè lần 1, data giống | Edge | P2 | — |
| TC_DB_201 | Concurrent export + import cùng lúc → không corrupt data | Edge | P2 | — |
| TC_DB_202 | Export khi localStorage rỗng → file có empty arrays cho mỗi key | Edge | P1 | — |
| TC_DB_203 | Import khi localStorage rỗng → data được populated đầy đủ | Positive | P1 | — |
| TC_DB_204 | File picker accept=".json" → chỉ hiện file .json trong dialog | Positive | P2 | — |
| TC_DB_205 | File picker cancel (đóng không chọn file) → no action, no error | Positive | P2 | — |
| TC_DB_206 | FileReader onerror → hiện error message thân thiện | Negative | P1 | — |
| TC_DB_207 | Native export (Capacitor Filesystem) → share dialog mở ra | Positive | P2 | — |
| TC_DB_208 | Native import → file picker native platform mở ra | Positive | P2 | — |
| TC_DB_209 | Web export → Blob tạo đúng → Object URL → download trigger | Positive | P1 | — |
| TC_DB_210 | Web import → hidden input[type=file] trigger click đúng | Positive | P1 | — |

---

## Chi tiết Test Cases (Grouped Summary)

##### TC_DB_01–14: Export Flow
- Button hiển thị, file download, JSON validity, data completeness (5 EXPORT_KEYS), metadata (_exportedAt, _version)

##### TC_DB_15–26: Import Flow
- File picker, validation, confirm dialog, data replacement cho từng key, notification, app refresh

##### TC_DB_27–43: Validation & Edge Cases
- Invalid files, wrong schema, missing fields, null values, empty arrays, large files, special characters, Vietnamese text, emoji

##### TC_DB_44–58: Roundtrip & Tích hợp
- Overwrite confirm, export-import roundtrip, cross-browser, version migration, nutrition/grocery/calendar recalculations

##### TC_DB_59–70: UI/UX
- Dark mode, i18n, responsive layouts, loading states, error handling, accessibility (screen reader, keyboard)

##### TC_DB_71–105: Tính năng Nâng cao
- Grocery/translation state, concurrent operations, empty app, auto-backup, Google Drive, export formats, encryption, progress

##### TC_DB_106–125: Export Chi tiết
- Kiểm tra chi tiết từng key trong export file, metadata format, pretty-printed JSON, file size, empty/large data, LAST_LOCAL_BACKUP_KEY cập nhật, backup health chuyển good, loading/disabled states

##### TC_DB_126–145: Import Validation (Xác thực Import)
- validateImportData() với các loại input: valid/invalid JSON, partial keys, extra keys, empty object, null, array, string, large file, corrupt JSON, encoding, version compatibility, schema validation

##### TC_DB_146–165: Confirmation Dialog (Xác nhận Import)
- Dialog hiển thị summary counts, warning ghi đè, Confirm/Cancel actions, dark mode, mobile responsive, animation, Escape/backdrop cancel, stores refresh sau confirm

##### TC_DB_166–185: Backup Health Indicator
- Health levels (good/warning/critical) theo số ngày, ranh giới chính xác (≤3/4–7/>7), messages, icons, badge colors, timestamp sources (local/cloud), cập nhật sau export, dark mode, mobile layout

##### TC_DB_186–210: Round-trip và Edge Cases
- Full round-trip verification cho từng key, multi-step round-trip, cross-browser/cross-device, manual edit, overwrite behavior, partial import, concurrent operations, empty localStorage, file picker behavior, FileReader error, native vs web platform differences

---

## Đề xuất Cải tiến

### Đề xuất 1: Incremental Backup
- **Vấn đề hiện tại**: Full export mỗi lần. File 5MB cho 1 thay đổi nhỏ.
- **Giải pháp đề xuất**: Incremental backup: chỉ export data thay đổi kể từ lần backup cuối. Diff-based.
- **Lý do chi tiết**: Export nhanh hơn, file nhỏ hơn, tiết kiệm bandwidth cho cloud backup.
- **Phần trăm cải thiện**: Tốc độ backup +80%, Kích thước file -70%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 2: Import Preview & Merge
- **Vấn đề hiện tại**: Import = thay thế toàn bộ. Không thể merge hoặc preview.
- **Giải pháp đề xuất**: Trước import: hiện diff. Tùy chọn: "Thay thế tất cả", "Merge (giữ mới hơn)", "Import có chọn lọc".
- **Lý do chi tiết**: Thay thế toàn bộ rất nguy hiểm. Merge cho phép kết hợp data từ nhiều nguồn.
- **Phần trăm cải thiện**: Tính linh hoạt import +60%, Bảo toàn dữ liệu +50%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 3: Cloud Auto-Backup
- **Vấn đề hiện tại**: Chỉ export thủ công. User quên → mất dữ liệu.
- **Giải pháp đề xuất**: Auto-backup lên Google Drive hàng ngày. Giữ 7 bản gần nhất. Khôi phục 1 click.
- **Lý do chi tiết**: Auto-backup loại bỏ rủi ro mất dữ liệu. Mối quan tâm #1 của user.
- **Phần trăm cải thiện**: Sự cố mất dữ liệu -95%, Sự tin tưởng của user +60%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Cross-Device Sync
- **Vấn đề hiện tại**: Export/import = chuyển file thủ công giữa thiết bị. Không có real-time sync.
- **Giải pháp đề xuất**: Real-time sync qua Google Drive. Thay đổi tự động replicate. UI giải quyết conflict.
- **Lý do chi tiết**: User mong đợi data có mặt trên mọi thiết bị. Sync là tính năng cơ bản cho app hiện đại.
- **Phần trăm cải thiện**: Sử dụng đa thiết bị +80%, Hài lòng user +50%
- **Mức độ ưu tiên**: High | **Effort**: XL

### Đề xuất 5: Backup Encryption
- **Vấn đề hiện tại**: Export file dạng plaintext JSON. Bất kỳ ai cũng đọc được dữ liệu dinh dưỡng.
- **Giải pháp đề xuất**: Mã hóa tùy chọn bằng mật khẩu khi export. AES-256. Giải mã khi import.
- **Lý do chi tiết**: Dữ liệu sức khỏe rất nhạy cảm. Mã hóa bảo vệ quyền riêng tư trên thiết bị dùng chung/cloud.
- **Phần trăm cải thiện**: Bảo mật dữ liệu +80%, Tin tưởng quyền riêng tư +50%
- **Mức độ ưu tiên**: Low | **Effort**: M

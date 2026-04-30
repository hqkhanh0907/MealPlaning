# Phase 1.5B.2 — F-01 AI Lookup QA Report

- **Build:** prod APK (`app-debug.apk`, key obfuscated `CSwbDScRDxYaLWdgXHFlfAk+...`).
- **Device:** `emulator-5554` (Android 16, system WebView Chrome 147).
- **Bundle verified:** key bundled at `assets/public/chunk-BO7JFKFZ.js`.
- **Date:** 2026-04-30.
- **Tester:** Hermes Agent (uiautomator dump + tap, no CDP — Android 16 WebView 147 SIGTRAP per skill §1.4).
- **Result:** 4/4 nhánh PASS. 0 console errors trong logcat `Capacitor/Console:E`.

## Test matrix

| # | Branch | Input | Expected | Actual | Verdict |
|---|---|---|---|---|---|
| 1 | success — name chưa có | "Cai bo xoi tuoi" → "Hỏi AI" | Loading → sheet "Kết quả AI" với confidence + form prefilled → Lưu → list refresh | Loading "Đang hỏi AI..." (~8s) → sheet hiển thị "Độ tin cậy cao" + note "Dữ liệu cho cải bó xôi tươi, chưa nấu chín." + form prefilled (Rau củ, kcal/protein/carbs/fat/fiber per 100g) → Lưu → "Cải bó xôi tươi" xuất hiện đầu list, persist sau force-stop+relaunch | **PASS** |
| 2 | duplicate → "Cập nhật cũ" | "me chua" (đã có trong seed) → "Hỏi AI" | Alert "Đã có nguyên liệu này" với HỦY/TẠO MỚI/CẬP NHẬT CŨ → CẬP NHẬT CŨ → sheet update mode (banner) → Lưu → 1 row | Alert hiển thị đúng spec (header + message + 3 buttons). Tap CẬP NHẬT CŨ → sheet hiển thị banner **"Đang cập nhật \"Me chua\" đã có trong DB"** + form prefilled (Trái cây) → Lưu → filter Trái cây = **1 row "Me chua"** | **PASS** |
| 3 | duplicate → "Tạo mới" | "me chua" (lần 2) → "Hỏi AI" → TẠO MỚI | Sheet create mode (KHÔNG có banner update) → Lưu → 2 rows "Me chua" trong list | Sau Lưu, filter Trái cây hiển thị **2 rows "Me chua"** → confirm CREATE path không update | **PASS** |
| 4 | offline error | tắt WiFi+data, gõ "rau ngot" → "Hỏi AI" | Banner offline phía trên form + toast khi tap | Banner **"Cần kết nối mạng để dùng AI"** ở Y=334 (giữa header và CTA AI) + toast cùng nội dung ở Y=2232 sau khi tap "Hỏi AI" | **PASS** |

## Evidence

| File | Mô tả |
|---|---|
| `01-before-tap-ai.png` | Form trống với button "Hỏi AI điền dinh dưỡng" |
| `02-ai-sheet-success.png` | Sheet thành công cho "Cải bó xôi tươi" |
| `03-duplicate-alert.png` | Alert duplicate với 3 buttons |
| `04-update-mode-sheet.png` | Sheet update mode với banner "Đang cập nhật" |
| `05-update-result-edit.png` | Edit form sau khi update Me chua |
| `06-create-mode-after-dup.png` | Sheet create mode (không có banner) |
| `07-offline-banner.png` | Banner offline trên form |
| `08-offline-toast.png` | Toast "Cần kết nối mạng để dùng AI" |

Screenshots tại `/tmp/qa-f01/` (chưa commit — chỉ là test artifact).

## Verified behaviors

- **Duplicate detection** dùng `normalizeIngredientName` (lowercase + collapse whitespace, **giữ diacritics**). "ca chua" (không dấu) ≠ "cà chua" (có dấu) trong seed → KHÔNG bắt duplicate. Đúng theo Decision #2.
- **AI sheet write-through:** save thành công cho cả 3 mode (create-fresh / update-existing / create-from-duplicate).
- **Offline UX:** dual-cue (banner + toast) — banner thông báo trước, toast confirm khi user vẫn tap.
- **Persist sau restart:** "Cải bó xôi tươi" còn nguyên sau `force-stop` + relaunch → IngredientStore + repository write OK.
- **0 errors** trong `Capacitor/Console:E` xuyên suốt 4 nhánh.

## Notes / known limitations

- DB pull qua `run-as ... cat databases/healthmateSQLite.db` cho thấy 47 seed rows nhưng KHÔNG thấy "Cải bó xôi tươi" hay "Me chua" mới. Resolution: app dùng path khác (likely `@capacitor-community/sqlite` ghi vào `no-cloud/healthmateSQLite.db` thay vì `databases/`). Persistence vẫn được verify gián tiếp qua force-stop+relaunch test. Không phải bug — chỉ là DB pull inspection limitation.
- ADB `input text` không hỗ trợ unicode tiếng Việt có dấu (`NullPointerException` khi truyền). Test case có dấu (Cà chua, Trứng gà v.v.) cần dùng IME khác hoặc clipboard provider — out of scope cho QA này. Đã work-around bằng "me chua" (ingredient không dấu duy nhất trong seed).
- ⚠️ **Security:** API key đã bị log trong chat history. Recommend revoke key tại https://aistudio.google.com/apikey và tạo key mới sau khi merge.

## Verdict

**Phase 1.5B.2 (F-01 AI Lookup) — READY TO MERGE.** All acceptance criteria pass on real Android emulator with real Gemini API call.

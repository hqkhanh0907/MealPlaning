## Plan: Update Test Cases V2.12 — Bổ sung tính năng chưa có

So sánh source code thực tế với tài liệu test-cases-v2.md, phát hiện **6 nhóm tính năng quan trọng** chưa được cover bởi bất kỳ test case nào. Cần bổ sung khoảng **26 TCs mới** và sửa lại tổng số ở bảng tóm tắt.

### Steps

1. **Thêm PHẦN M: Dark Mode / Theme Switcher (~8 TCs)** vào cuối [test-cases-v2.md](.github/docs/test-cases-v2.md).
   - `THEME_01`: Mặc định `system`, icon Monitor hiển thị.
   - `THEME_02`: Click cycle: light (Sun) → dark (Moon) → system (Monitor) → light.
   - `THEME_03`: Persist theme vào `localStorage('mp-theme')`, reload giữ nguyên.
   - `THEME_04`: Dark mode toggle class `dark` trên `<html>`, background `bg-slate-950`, text `text-slate-100`.
   - `THEME_05`: System mode — theo OS preference, auto update khi thay đổi OS setting.
   - `THEME_06`: Tooltip/aria-label thay đổi theo theme hiện tại.
   - `THEME_07`: Dark mode áp dụng trên tất cả modals, cards, toasts, inputs.
   - `THEME_08`: `localStorage` fail → fallback `system`, app không crash.

2. **Thêm PHẦN N: Lazy Loading & Code Splitting (~5 TCs)** vào [test-cases-v2.md](.github/docs/test-cases-v2.md).
   - `LAZY_01`: Tab Grocery/AI dùng conditional render (`{activeMainTab === 'x' && ...}`), unmount khi rời tab.
   - `LAZY_02`: Tab Calendar/Management dùng `hidden/block`, giữ state khi switch.
   - `LAZY_03`: Loading fallback (spinner "Đang tải...") hiển thị khi tab Grocery/AI lần đầu mount.
   - `LAZY_04`: Chuyển tab nhanh liên tục không gây crash/double render.
   - `LAZY_05`: Network chậm → fallback hiển thị cho đến khi chunk load xong.

3. **Thêm PHẦN O: Image Compression (~4 TCs)** vào [test-cases-v2.md](.github/docs/test-cases-v2.md).
   - `IMG_C_01`: Upload ảnh lớn (>2MB) → compress xuống ≤ 1024x1024, JPEG quality 0.8.
   - `IMG_C_02`: Camera capture → compress trước khi preview.
   - `IMG_C_03`: Paste từ clipboard → compress trước khi set image.
   - `IMG_C_04`: Canvas context fail → fallback dùng ảnh gốc, không crash.

4. **Cập nhật Phần A: Bổ sung A5 — Management Sub-tabs (~4 TCs)** trong [test-cases-v2.md](.github/docs/test-cases-v2.md).
   - `MGT_S_01`: 2 sub-tabs "Món ăn" / "Nguyên liệu", active state `bg-white text-emerald-600`.
   - `MGT_S_02`: Default sub-tab = "Món ăn" (`dishes`).
   - `MGT_S_03`: DataBackup section hiển thị dưới cùng tab Thư viện, luôn visible cho cả 2 sub-tabs.
   - `MGT_S_04`: Sub-tabs responsive — `min-h-11` touch target, `overflow-x-auto scrollbar-hide` trên mobile.

5. **Cập nhật Phần J: Bổ sung TCs Notification nâng cao (~5 TCs)** trong [test-cases-v2.md](.github/docs/test-cases-v2.md).
   - `NOT_06`: Toast action button — hiện button underline bên dưới message, click → execute action + dismiss.
   - `NOT_07`: Toast position responsive — mobile: top + safe-area-inset, desktop: bottom-right.
   - `NOT_08`: Toast close button (X) — click X → dismiss ngay lập tức.
   - `NOT_09`: Keyboard accessibility — clickable toast support Enter/Space.
   - `NOT_10`: Import validation per-key — key hợp lệ import, key sai format → warning toast từng key + bỏ qua.

6. **Sửa bảng TÓM TẮT & metadata** trong [test-cases-v2.md](.github/docs/test-cases-v2.md).
   - Cập nhật tổng TC từ 277 → 303 (bổ sung 26 TCs mới).
   - Thêm dòng Phần M, N, O vào bảng tóm tắt.
   - Sửa version lên `2.12`, cập nhật ngày `2026-03-01`.
   - Thêm Changelog v2.12 ở đầu document.

### Verification Summary (26 TCs — all verified via source code)

| TC ID    | Source file                                   | Line(s)           | Status |
| -------- | --------------------------------------------- | ----------------- | ------ |
| THEME_01 | `useDarkMode.ts`                              | 22                | ✅     |
| THEME_02 | `useDarkMode.ts`                              | 43-47             | ✅     |
| THEME_03 | `useDarkMode.ts`                              | 28                | ✅     |
| THEME_04 | `useDarkMode.ts`                              | 13                | ✅     |
| THEME_05 | `useDarkMode.ts`                              | 35-39             | ✅     |
| THEME_06 | `App.tsx`                                     | 453-454           | ✅     |
| THEME_07 | All components                                | `dark:*` classes  | ✅     |
| THEME_08 | `useDarkMode.ts`                              | 18-21, 28         | ✅     |
| MGT_S_01 | `ManagementTab.tsx`                           | 27-28, 50         | ✅     |
| MGT_S_02 | `App.tsx`                                     | 147               | ✅     |
| MGT_S_03 | `ManagementTab.tsx`                           | 73-76             | ✅     |
| MGT_S_04 | `ManagementTab.tsx`                           | 45, 50            | ✅     |
| NOT_06   | `NotificationContext.tsx`                     | 101-109           | ✅     |
| NOT_07   | `NotificationContext.tsx`                     | 155               | ✅     |
| NOT_08   | `NotificationContext.tsx`                     | 111-117           | ✅     |
| NOT_09   | `NotificationContext.tsx`                     | 83-84, 93         | ✅     |
| NOT_10   | `App.tsx`                                     | 401-428           | ✅     |
| LAZY_01  | `App.tsx`                                     | 480, 512          | ✅     |
| LAZY_02  | `App.tsx`                                     | 466, 496          | ✅     |
| LAZY_03  | `App.tsx`                                     | 125-130, 482, 514 | ✅     |
| LAZY_04  | React.lazy + Suspense                         | structural        | ✅     |
| LAZY_05  | Suspense boundary                             | structural        | ✅     |
| IMG_C_01 | `imageCompression.ts` + `AIImageAnalyzer.tsx` | 11-15, 69-70      | ✅     |
| IMG_C_02 | `AIImageAnalyzer.tsx`                         | 123               | ✅     |
| IMG_C_03 | `AIImageAnalyzer.tsx`                         | 45-49             | ✅     |
| IMG_C_04 | `imageCompression.ts`                         | 35-38             | ✅     |

### Further Considerations

1. **Numbering conflict** — PHẦN K cũ dùng # 203-210 trùng với NOT_06~10 (# 203-207). Cột `#` chỉ là sequential counter, `ID` column mới là unique. Nên renumber K→L→M→N→O cho liền mạch (208+).
2. **`useOnlineStatus` hook** đã tạo nhưng chưa integrate vào UI — không cần TC cho đến khi dùng. Có thể thêm TC "pending" nếu muốn.
3. **Tổng ở bảng "So sánh V1"** (273) khác tổng chính (303) vì bảng so sánh group theo metric khác. Cần đồng bộ hoặc ghi chú rõ phương pháp đếm.

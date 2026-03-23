# Google Drive Import/Export — Kiểm thử & Đánh giá Chi tiết

**Ngày:** 2026-03-23  
**Môi trường:** macOS Darwin, Chrome, localhost:3000  
**App:** Smart Meal Planner v0.0.0 (React 19 + Vite 6 + TypeScript 5.8)  
**Phiên bản kiểm thử:** v2.0 (sau fix BUG_GDRIVE_01)

---

## 1. Phạm vi Kiểm thử

### 1.1 Tính năng được kiểm thử

| Tính năng | Phương pháp | Kết quả |
|---|---|---|
| Local JSON Export | Unit test + Browser | ✅ PASSED |
| Local JSON Import (valid) | Unit test + Browser | ✅ PASSED |
| Local JSON Import (invalid) | Unit test + Browser | ✅ PASSED |
| Import confirmation modal | Browser | ✅ PASSED |
| Import cancel flow | Browser | ✅ PASSED |
| Google OAuth popup (port 3000) | Browser | ✅ PASSED |
| Google OAuth popup (port sai) | Browser | ❌ Expected fail |
| OAuth popup close handling | Unit test + Browser | ✅ PASSED (sau fix) |
| Backup health indicator | Browser | ✅ PASSED |
| Dark mode rendering | Browser | ✅ PASSED |
| Settings search filter | Browser | ✅ PASSED |
| Console errors monitoring | DevTools | ✅ 0 errors |
| Network requests audit | DevTools | ✅ No unexpected calls |
| localStorage state audit | DevTools | ✅ Consistent |

### 1.2 Tính năng CHƯA test end-to-end trên trình duyệt (cần tài khoản Google thật)

> **Lưu ý:** Các tính năng bên dưới đã được kiểm thử kỹ bằng unit tests với mocked APIs (39 tests cho GoogleDriveSync, 14 tests cho useAutoSync). Phần chưa test là **end-to-end trên trình duyệt** với tài khoản Google thật.

| Tính năng | Lý do |
|---|---|
| Upload backup lên Google Drive | Cần OAuth token thật |
| Download backup từ Google Drive | Cần OAuth token thật |
| Sync conflict resolution modal | Cần data trên cả local và Drive |
| Auto-sync on launch | Cần phiên đăng nhập thật |
| Auto-sync on data change (debounce 3s) | Cần phiên đăng nhập thật |

---

## 2. Kiến trúc Hệ thống

### 2.1 Component Architecture

```
SettingsTab.tsx (119 LOC)
├── GoogleDriveSync.tsx (240 LOC) — Cloud sync UI
│   ├── googleDriveService.ts (98 LOC) — Drive API layer
│   └── SyncConflictModal.tsx (75 LOC) — Conflict resolution
├── DataBackup.tsx (203 LOC) — Local export/import
└── useAutoSync.ts (146 LOC) — Auto-sync hook

AuthContext.tsx (288 LOC) — OAuth2 provider
├── Web: Google Identity Services (GIS)
└── Native: Capacitor SocialLogin plugin
```

### 2.2 Data Flow

**Export (Local):**
1. `DataBackup.tsx` → `buildExportData()` collects 5 localStorage keys
2. Creates `Blob` → `URL.createObjectURL()` → triggers download
3. Updates `mp-last-local-backup-at` timestamp

**Export (Cloud):**
1. `GoogleDriveSync.tsx` → `buildExportData()` collects same 5 keys
2. Calls `googleDriveService.uploadBackup(data, token)`
3. Service checks existing file via `listBackups()` (GET `/drive/v3/files`)
4. If exists: `PATCH /drive/v3/files/{id}` (update)
5. If new: `POST /upload/drive/v3/files` (multipart create)
6. Uses `appDataFolder` scope — file hidden from user's Drive UI

**Import (Local):**
1. `DataBackup.tsx` → hidden `<input type="file" accept=".json">`
2. `FileReader.readAsText()` → `JSON.parse()` with try-catch
3. Shows confirmation modal with item count summary
4. On confirm: writes to localStorage, triggers `storage` event

**Import (Cloud):**
1. `GoogleDriveSync.tsx` → calls `downloadLatestBackup(token)`
2. Compares timestamps for conflict detection
3. If conflict: shows `SyncConflictModal` with 3 options
4. On resolve: overwrites localStorage

### 2.3 OAuth Flow

```
User clicks "Đăng nhập bằng Google"
    ↓
AuthContext.signIn() sets isLoading=true
    ↓
GIS tokenClient.requestAccessToken()
    ↓
┌─ Success: callback(token) → setState(user) → isLoading=false
├─ Error: error_callback(err) → isLoading=false → reject
└─ Popup closed: error_callback({type:'popup_closed'}) → isLoading=false → reject
```

---

## 3. Kết quả Kiểm thử Chi tiết

### 3.1 Unit Tests

| Test File | Tests | Pass | Fail |
|---|---|---|---|
| authContext.test.tsx | 26 | 26 | 0 |
| googleDriveService.test.ts | 23 | 23 | 0 |
| GoogleDriveSync.test.tsx | 39 | 39 | 0 |
| DataBackup.test.tsx | 19 | 19 | 0 |
| SyncConflictModal.test.tsx | 14 | 14 | 0 |
| useAutoSync.test.tsx | 14 | 14 | 0 |
| SettingsTab.test.tsx | 17 | 17 | 0 |
| **Tổng** | **152** | **152** | **0** |

### 3.2 Coverage Report

| File | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| googleDriveService.ts | 100% | 100% | 100% | 100% |
| GoogleDriveSync.tsx | 100% | 97.87% | 100% | 100% |
| SyncConflictModal.tsx | 100% | 100% | 100% | 100% |
| DataBackup.tsx | 99% | 84.37% | 100% | 100% |
| useAutoSync.ts | 98.71% | 87.5% | 100% | 100% |
| AuthContext.tsx | 98.54% | 96.42% | 89.28% | 100% |
| SettingsTab.tsx | 100% | 100% | 100% | 100% |

### 3.3 ESLint

```
0 errors, 0 warnings across all 7 Google Drive files
```

### 3.4 Browser Test Cases

#### TC_EXPORT_01: Xuất dữ liệu local (JSON file)
- **Pre-conditions:** App có dữ liệu (ingredients, dishes, day plans)
- **Steps:** Cài đặt → Click "Xuất dữ liệu"
- **Expected:** File JSON download, toast thành công, backup health cập nhật
- **Actual:** ✅ PASSED — File downloaded, `mp-last-local-backup-at` set, badge "Đã sao lưu hôm nay ✓"

#### TC_EXPORT_02: Export không gọi API bên ngoài
- **Steps:** Export → kiểm tra Network tab
- **Expected:** Không có fetch/XHR requests
- **Actual:** ✅ PASSED — Zero network requests, data stays client-side

#### TC_OAUTH_01: Google Sign-in (port 3000)
- **Pre-conditions:** App chạy trên localhost:3000
- **Steps:** Click "Đăng nhập bằng Google"
- **Expected:** Popup Google mở, hiển thị form đăng nhập
- **Actual:** ✅ PASSED — Popup hiển thị "Tiếp tục tới Smart Meal Planner", scopes chính xác

#### TC_OAUTH_02: Google Sign-in (port sai 3002)
- **Pre-conditions:** App chạy trên localhost:3002
- **Steps:** Click "Đăng nhập bằng Google"
- **Expected:** Lỗi redirect_uri_mismatch
- **Actual:** ❌ Expected failure — Google trả 400 error

#### TC_OAUTH_03: Đóng popup OAuth (BUG đã fix)
- **Pre-conditions:** Popup OAuth đang mở
- **Steps:** Đóng popup mà không đăng nhập
- **Expected:** Nút trở lại trạng thái bình thường
- **Actual:** ✅ PASSED (sau fix) — Nút "Đăng nhập bằng Google" hoạt động bình thường

#### TC_IMPORT_01: Import file JSON hợp lệ
- **Pre-conditions:** File JSON có 1 ingredient, 1 dish
- **Steps:** Click "Nhập dữ liệu" → chọn file → Xác nhận
- **Expected:** Confirmation modal → toast thành công → dữ liệu ghi đè
- **Actual:** ✅ PASSED — Modal "ghi đè 1 nguyên liệu, 1 món ăn", toast "Nhập dữ liệu thành công! Đã khôi phục 2 mục dữ liệu."

#### TC_IMPORT_02: Hủy import
- **Steps:** Click "Nhập dữ liệu" → chọn file → Hủy
- **Expected:** Modal đóng, dữ liệu không thay đổi
- **Actual:** ✅ PASSED — Modal đóng, localStorage không thay đổi

#### TC_IMPORT_03: Import file không hợp lệ
- **Pre-conditions:** File text không phải JSON
- **Steps:** Click "Nhập dữ liệu" → chọn file invalid
- **Expected:** Toast lỗi, dữ liệu không thay đổi
- **Actual:** ✅ PASSED — Toast "Nhập thất bại", console clean, dữ liệu nguyên vẹn

#### TC_DARKMODE_01: Settings page dark mode
- **Steps:** Click "Tối" trong Giao diện
- **Expected:** Toàn bộ settings page render đúng dark mode
- **Actual:** ✅ PASSED — Background tối, text sáng, contrast tốt, buttons gradient đẹp

#### TC_SEARCH_01: Tìm kiếm cài đặt
- **Steps:** Gõ "google" vào ô tìm kiếm
- **Expected:** Chỉ hiển thị section "Đồng bộ đám mây"
- **Actual:** ✅ PASSED — Filter đúng, ẩn sections không liên quan

#### TC_HEALTH_01: Backup health indicator
- **Pre-conditions:** Chưa từng backup
- **Steps:** Kiểm tra badge → Export → kiểm tra lại
- **Expected:** Badge chuyển từ critical → good
- **Actual:** ✅ PASSED — "Chưa từng sao lưu" → "Đã sao lưu hôm nay ✓"

#### TC_LOCALSTORAGE_01: State consistency
- **Steps:** Kiểm tra localStorage sau các thao tác
- **Expected:** Tất cả keys nhất quán
- **Actual:** ✅ PASSED — `mp-last-local-backup-at` set, `mp-auth-state` null, data counts đúng

---

## 4. Bug Report

### BUG_GDRIVE_01: OAuth Loading State Stuck (ĐÃ FIX)

| Mục | Chi tiết |
|---|---|
| **Severity** | 🔴 High — chặn user đăng nhập lại |
| **Status** | ✅ Fixed (commit `710fc23`) |
| **Root Cause** | GIS `initTokenClient` callback không fire khi user đóng popup, `isLoading` không reset |
| **Fix** | Thêm `error_callback` vào GIS config để handle `popup_closed` và `popup_failed_to_open` |
| **Files Changed** | `src/contexts/AuthContext.tsx`, `src/__tests__/authContext.test.tsx` |
| **Tests Added** | 2 tests: popup_closed handling, popup_failed_to_open handling |
| **Regression** | ✅ All 1274 tests pass, ESLint clean |

---

## 5. Đánh giá Tổng thể

### 5.1 Điểm theo Tiêu chí

| Tiêu chí | Điểm | Ghi chú |
|---|---|---|
| **Code Quality** | 9/10 | TypeScript strict, clean ESLint, minor duplication issue |
| **Architecture** | 9/10 | Clean separation, dual platform, good service layer |
| **Test Coverage** | 9/10 | 95%+ stmts, 152 tests, branch coverage could improve |
| **Error Handling** | 9/10 | Comprehensive try-catch, popup close handled (after fix) |
| **UX/UI** | 8.5/10 | Good feedback, dark mode, search filter, health indicator |
| **Security** | 8/10 | Minimal scope, token revocation; localStorage token concern |
| **i18n** | 10/10 | Full vi/en support across all components |
| **Performance** | 9/10 | Debounced auto-sync (3s), no unnecessary API calls |
| **Tổng** | **8.9/10** | ⭐⭐⭐⭐ |

### 5.2 Điểm mạnh

1. **Kiến trúc sạch** — Service/Component/Hook tách biệt rõ ràng theo feature-based structure
2. **Test coverage cao** — 152 tests chuyên biệt, 95%+ statements
3. **Dual platform** — Web (GIS) + Native (Capacitor) cùng interface
4. **Conflict resolution** — 3-option modal: keep-local, use-cloud, cancel
5. **Backup health** — 3-level indicator (good/warning/critical) nhắc user backup
6. **Auto-sync** — Debounced 3s + sync-on-launch, không gây lag
7. **Error handling toàn diện** — Invalid file, network error, popup close
8. **Zero console errors** — App chạy sạch sẽ dưới mọi test scenario
9. **Privacy** — Local export không gọi API, `appDataFolder` ẩn khỏi Drive UI

### 5.3 Điểm cần cải thiện

| Priority | Issue | Đề xuất |
|---|---|---|
| P2 | `buildExportData()` duplicate 3 nơi | Extract thành shared utility trong `src/utils/` |
| P2 | Branch coverage ~85.77% overall | Thêm tests cho edge cases trong DataBackup, useAutoSync |
| P3 | Access token trong localStorage | Cân nhắc secure storage hoặc memory-only token |
| P3 | Backup data không mã hóa | Cân nhắc AES encryption trước khi upload |
| P3 | Thiếu aria-labels | Thêm accessibility attributes cho screen readers |

---

## 6. Kiến nghị Hành động

### Ngắn hạn (P1-P2)
1. ✅ Fix BUG_GDRIVE_01 — ĐÃ HOÀN THÀNH
2. Extract `buildExportData()` thành `src/utils/exportUtils.ts`
3. Tăng branch coverage lên ≥90% cho DataBackup.tsx và useAutoSync.ts

### Trung hạn (P3)
4. Đánh giá lại token storage strategy (memory vs localStorage)
5. Thêm backup versioning (hiện tại chỉ 1 file, không rollback)
6. Cân nhắc mã hóa backup data trước khi upload

### Dài hạn
7. Hỗ trợ selective sync (chỉ sync ingredients hoặc dishes)
8. Backup history/changelog
9. Multi-device conflict resolution cải tiến

---

## 7. Kết luận

Tính năng Import/Export Google Drive của Smart Meal Planner đạt chất lượng **tốt** (8.9/10). Kiến trúc clean, test coverage cao, error handling toàn diện. Bug nghiêm trọng duy nhất (OAuth loading stuck) đã được phát hiện và fix trong quá trình kiểm thử. Tính năng sẵn sàng cho production với các cải thiện P2-P3 có thể thực hiện trong các sprint tiếp theo.

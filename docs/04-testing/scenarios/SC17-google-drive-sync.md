# Scenario 17: Google Drive Cloud Sync

**Version:** 2.0  
**Date:** 2026-03-15  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Google Drive Cloud Sync cho phép đồng bộ dữ liệu app lên Google Drive. AuthContext quản lý Google OAuth. useAutoSync hook tự động sync sau mỗi data change (debounce 3s). Manual sync button cũng có. Data stored as JSON file on Drive. SyncConflictModal xử lý conflict khi local và remote data khác nhau. Hỗ trợ offline queue, retry logic, và error handling toàn diện.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| AuthContext | contexts/AuthContext.tsx | Quản lý Google OAuth state, token, user info |
| googleDriveService | services/googleDriveService.ts | Drive API wrapper: listBackups, uploadBackup, downloadBackup, deleteBackup |
| useAutoSync | hooks/useAutoSync.ts | Auto-sync logic: debounce 3s, listen data changes |
| GoogleDriveSync | components/GoogleDriveSync.tsx | Sync UI: buttons, status, progress |
| SyncConflictModal | components/modals/SyncConflictModal.tsx | Conflict resolution UI |

## Luồng nghiệp vụ

1. User signs in with Google account (OAuth 2.0 popup)
2. AuthContext stores auth state (token in memory, not localStorage)
3. Auto-sync enabled → useAutoSync listens for data changes
4. Data change → 3s debounce → uploadBackup() to Drive appDataFolder
5. Manual sync: click "Đồng bộ ngay" → immediate upload/download
6. Conflict detected (timestamps differ) → SyncConflictModal → user chooses
7. Network error → retry up to 3 times → display error notification
8. Offline → queue changes → sync when online

## Quy tắc nghiệp vụ

1. Google sign-in required for sync (OAuth 2.0 with drive.appdata scope)
2. Auto-sync: 3s debounce after any data change
3. Immediate sync on first sign-in (auth → initial sync)
4. Data stored as single JSON file in app-specific Drive folder (appDataFolder)
5. Upload: multipart for new file, PATCH for existing file
6. Download: downloadLatestBackup() lấy file mới nhất
7. Conflict: compare modifiedTime → SyncConflictModal cho user chọn
8. Offline changes: queue and sync when online
9. Max retry: 3 attempts with increasing delay
10. localStorage keys: mp-last-sync-at, mp-ingredients, mp-dishes, mp-day-plans, mp-user-profile, meal-templates
11. Sync status: 'idle' | 'uploading' | 'downloading' | 'error'

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|---|---|---|---|
| TC_GD_001 | Hiển thị nút Google Sign In khi chưa đăng nhập | Positive | P0 |
| TC_GD_002 | Click Sign In mở OAuth popup | Positive | P0 |
| TC_GD_003 | Đăng nhập thành công hiển thị thông tin user | Positive | P0 |
| TC_GD_004 | Nút Sign Out hiển thị khi đã đăng nhập | Positive | P1 |
| TC_GD_005 | Click Sign Out xóa auth state | Positive | P0 |
| TC_GD_006 | Auth state persist sau reload | Positive | P0 |
| TC_GD_007 | Token refresh tự động khi gần hết hạn | Positive | P1 |
| TC_GD_008 | Expired token yêu cầu re-auth | Positive | P1 |
| TC_GD_009 | OAuth popup bị chặn bởi browser | Negative | P2 |
| TC_GD_010 | User hủy OAuth flow | Positive | P1 |
| TC_GD_011 | Chọn nhiều tài khoản Google | Edge | P2 |
| TC_GD_012 | Chuyển đổi tài khoản Google | Edge | P2 |
| TC_GD_013 | AuthContext lưu trữ đúng user info | Positive | P1 |
| TC_GD_014 | Token lưu trữ an toàn trong memory | Security | P1 |
| TC_GD_015 | Đăng nhập khi không có kết nối mạng | Negative | P1 |
| TC_GD_016 | OAuth chỉ yêu cầu quyền appDataFolder | Security | P1 |
| TC_GD_017 | Đăng nhập lần đầu trigger initial sync | Positive | P1 |
| TC_GD_018 | Auth state cập nhật đúng khi sign out | Positive | P1 |
| TC_GD_019 | Nhiều tab mở cùng auth state | Edge | P2 |
| TC_GD_020 | Auth UI responsive trên mobile | Positive | P2 |
| TC_GD_021 | Auth UI trong dark mode | Positive | P2 |
| TC_GD_022 | HTTPS bắt buộc cho API calls | Security | P0 |
| TC_GD_023 | Sign out trong khi đang sync | Edge | P2 |
| TC_GD_024 | Auth error handling khi Google API down | Negative | P2 |
| TC_GD_025 | Google account bị vô hiệu hóa | Negative | P2 |
| TC_GD_026 | Auto-sync toggle hiển thị khi đã đăng nhập | Positive | P1 |
| TC_GD_027 | Bật auto-sync | Positive | P1 |
| TC_GD_028 | Tắt auto-sync | Positive | P1 |
| TC_GD_029 | Auto-sync trigger khi thêm ingredient | Positive | P0 |
| TC_GD_030 | Auto-sync trigger khi sửa dish | Positive | P0 |
| TC_GD_031 | Auto-sync trigger khi xóa plan | Positive | P1 |
| TC_GD_032 | Auto-sync trigger khi lưu template | Positive | P1 |
| TC_GD_033 | Debounce 3s: nhiều thay đổi trong 3s chỉ 1 upload | Positive | P1 |
| TC_GD_034 | Debounce reset khi có thay đổi mới | Positive | P2 |
| TC_GD_035 | 10 thay đổi liên tục trong 5s → 1 upload | Positive | P1 |
| TC_GD_036 | Auto-sync trạng thái 'idle' ban đầu | Positive | P1 |
| TC_GD_037 | Auto-sync trạng thái 'uploading' | Positive | P1 |
| TC_GD_038 | Auto-sync trạng thái 'error' | Positive | P1 |
| TC_GD_039 | Auto-sync không trigger khi chưa đăng nhập | Positive | P1 |
| TC_GD_040 | Auto-sync setting persist sau reload | Positive | P1 |
| TC_GD_041 | Auto-sync on app launch | Positive | P1 |
| TC_GD_042 | Auto-sync khi thay đổi user profile | Positive | P2 |
| TC_GD_043 | Auto-sync khi thay đổi goals/targets | Positive | P2 |
| TC_GD_044 | Auto-sync không chạy khi đang manual sync | Edge | P2 |
| TC_GD_045 | Auto-sync toggle ẩn khi chưa đăng nhập | Positive | P2 |
| TC_GD_046 | Auto-sync indicator trong header/tab bar | Positive | P2 |
| TC_GD_047 | Auto-sync sau khi import data | Edge | P2 |
| TC_GD_048 | Auto-sync sau khi AI thêm dish | Positive | P2 |
| TC_GD_049 | Auto-sync khi clear toàn bộ plan | Edge | P2 |
| TC_GD_050 | Auto-sync debounce không leak memory | Boundary | P2 |
| TC_GD_051 | Nút Manual Sync hiển thị khi đã đăng nhập | Positive | P1 |
| TC_GD_052 | Click Manual Sync → upload data lên Drive | Positive | P0 |
| TC_GD_053 | Manual sync button disabled khi đang sync | Positive | P1 |
| TC_GD_054 | Sync status: Đang đồng bộ (uploading) | Positive | P1 |
| TC_GD_055 | Sync status: Đồng bộ thành công | Positive | P1 |
| TC_GD_056 | Sync status: Lỗi đồng bộ | Positive | P1 |
| TC_GD_057 | Last sync timestamp hiển thị đúng | Positive | P1 |
| TC_GD_058 | Sync progress indicator | Positive | P2 |
| TC_GD_059 | Manual sync download từ Drive | Positive | P0 |
| TC_GD_060 | Manual sync lần đầu tạo file trên Drive | Positive | P1 |
| TC_GD_061 | Manual sync cập nhật file existing trên Drive | Positive | P1 |
| TC_GD_062 | Sync notification toast success | Positive | P2 |
| TC_GD_063 | Sync notification toast error | Positive | P1 |
| TC_GD_064 | Manual sync ẩn khi chưa đăng nhập | Positive | P2 |
| TC_GD_065 | Sync button text chuyển đổi theo trạng thái | Positive | P2 |
| TC_GD_066 | Manual sync trong khi auto-sync debounce | Edge | P2 |
| TC_GD_067 | Sync trên mobile layout | Positive | P2 |
| TC_GD_068 | Sync trên desktop layout | Positive | P2 |
| TC_GD_069 | Sync button keyboard accessible | Positive | P3 |
| TC_GD_070 | Screen reader đọc sync status | Positive | P3 |
| TC_GD_071 | Sync với data rỗng (không có ingredient/dish/plan) | Edge | P2 |
| TC_GD_072 | Sync với 1 ingredient duy nhất | Positive | P2 |
| TC_GD_073 | Manual sync cancel/abort | Positive | P2 |
| TC_GD_074 | Sync dark mode UI | Positive | P2 |
| TC_GD_075 | Sync i18n labels tiếng Việt | Positive | P2 |
| TC_GD_076 | Upload bao gồm ingredients data | Positive | P0 |
| TC_GD_077 | Upload bao gồm dishes data | Positive | P0 |
| TC_GD_078 | Upload bao gồm day plans data | Positive | P0 |
| TC_GD_079 | Upload bao gồm meal templates | Positive | P1 |
| TC_GD_080 | Upload bao gồm user profile | Positive | P1 |
| TC_GD_081 | Upload bao gồm nutrition goals | Positive | P1 |
| TC_GD_082 | Upload data format JSON hợp lệ | Positive | P0 |
| TC_GD_083 | Upload multipart cho file mới | Positive | P1 |
| TC_GD_084 | Upload PATCH cho file existing | Positive | P1 |
| TC_GD_085 | Upload success → mp-last-sync-at updated | Positive | P1 |
| TC_GD_086 | Upload với ingredient có dấu tiếng Việt | Positive | P1 |
| TC_GD_087 | Upload với dish có nhiều ingredients | Positive | P1 |
| TC_GD_088 | Upload với plan có 3 bữa đầy đủ | Positive | P1 |
| TC_GD_089 | Upload data integrity: hash/checksum | Positive | P2 |
| TC_GD_090 | Upload khi network chậm (3G) | Boundary | P2 |
| TC_GD_091 | Upload khi network bị ngắt giữa chừng | Negative | P1 |
| TC_GD_092 | Upload với data > 1MB | Boundary | P2 |
| TC_GD_093 | Upload với data > 5MB | Boundary | P2 |
| TC_GD_094 | Upload không gửi sensitive info | Security | P1 |
| TC_GD_095 | Upload timestamp format chuẩn ISO | Positive | P2 |
| TC_GD_096 | Upload retry tự động khi fail lần 1 | Positive | P1 |
| TC_GD_097 | Upload max retry attempts | Positive | P2 |
| TC_GD_098 | Upload với ingredient có giá trị nutrition 0 | Edge | P2 |
| TC_GD_099 | Upload với ingredient có giá trị nutrition rất lớn | Edge | P2 |
| TC_GD_100 | Upload không tạo duplicate files trên Drive | Positive | P1 |
| TC_GD_101 | Upload với emoji trong dish name | Edge | P2 |
| TC_GD_102 | Upload trong khi user đang edit form | Edge | P2 |
| TC_GD_103 | Upload bao gồm settings (dark mode, language) | Positive | P2 |
| TC_GD_104 | Upload compression (nếu có) | Positive | P3 |
| TC_GD_105 | Upload content-type đúng | Positive | P2 |
| TC_GD_106 | Download data từ Drive thành công | Positive | P0 |
| TC_GD_107 | Download → ingredients restored đúng | Positive | P1 |
| TC_GD_108 | Download → dishes restored đúng | Positive | P1 |
| TC_GD_109 | Download → plans restored đúng | Positive | P1 |
| TC_GD_110 | Download → templates restored đúng | Positive | P1 |
| TC_GD_111 | Download → user profile restored | Positive | P1 |
| TC_GD_112 | Download khi local data rỗng | Positive | P1 |
| TC_GD_113 | Download khi local data đã có | Positive | P1 |
| TC_GD_114 | Download file không tồn tại trên Drive | Edge | P2 |
| TC_GD_115 | Download file bị corrupt trên Drive | Negative | P1 |
| TC_GD_116 | Download giữ nguyên dấu tiếng Việt | Positive | P1 |
| TC_GD_117 | Download network error | Negative | P0 |
| TC_GD_118 | Download timeout | Negative | P1 |
| TC_GD_119 | Download với data lớn (>5MB) | Boundary | P2 |
| TC_GD_120 | Download round-trip: upload → download → data identical | Positive | P0 |
| TC_GD_121 | Download cập nhật last sync timestamp | Positive | P1 |
| TC_GD_122 | Download không mất data local nếu fail | Negative | P1 |
| TC_GD_123 | Download notification success | Positive | P2 |
| TC_GD_124 | Download notification error | Positive | P1 |
| TC_GD_125 | Download → UI auto-refresh | Positive | P1 |
| TC_GD_126 | Download → nutrition totals recalculated | Positive | P2 |
| TC_GD_127 | Download sử dụng downloadLatestBackup() | Positive | P2 |
| TC_GD_128 | Download caching (nếu có) | Positive | P3 |
| TC_GD_129 | Download parsing JSON error handling | Negative | P1 |
| TC_GD_130 | Download khi auth token hết hạn | Negative | P1 |
| TC_GD_131 | Conflict detection: local mới hơn Drive | Positive | P1 |
| TC_GD_132 | Conflict detection: Drive mới hơn local | Positive | P1 |
| TC_GD_133 | SyncConflictModal hiển thị đúng | Positive | P1 |
| TC_GD_134 | Conflict: chọn giữ local data | Positive | P1 |
| TC_GD_135 | Conflict: chọn giữ Drive data | Positive | P1 |
| TC_GD_136 | Conflict modal đóng sau khi chọn | Positive | P2 |
| TC_GD_137 | Conflict: timestamp comparison chính xác | Positive | P1 |
| TC_GD_138 | Conflict: cùng timestamp | Edge | P2 |
| TC_GD_139 | Conflict khi offline rồi online | Positive | P1 |
| TC_GD_140 | Conflict modal dark mode | Positive | P2 |
| TC_GD_141 | Conflict modal i18n labels | Positive | P2 |
| TC_GD_142 | Conflict modal responsive mobile | Positive | P2 |
| TC_GD_143 | Conflict modal keyboard accessible | Positive | P3 |
| TC_GD_144 | Conflict modal close bằng ESC | Positive | P2 |
| TC_GD_145 | Multiple conflicts liên tiếp | Edge | P2 |
| TC_GD_146 | Conflict data preview (nếu có) | Positive | P3 |
| TC_GD_147 | Conflict resolution không mất data | Positive | P0 |
| TC_GD_148 | Auto-conflict resolution: newer wins | Positive | P2 |
| TC_GD_149 | Conflict khi có thay đổi nhỏ (1 ingredient) | Edge | P2 |
| TC_GD_150 | Conflict khi có thay đổi lớn (50+ items) | Edge | P2 |
| TC_GD_151 | Conflict resolution → auto-sync resume | Positive | P2 |
| TC_GD_152 | Conflict modal accessibility: screen reader | Positive | P3 |
| TC_GD_153 | Conflict sau khi app restart | Edge | P2 |
| TC_GD_154 | Conflict khi data structure khác version | Edge | P2 |
| TC_GD_155 | Conflict modal loading state | Positive | P2 |
| TC_GD_156 | Cancel conflict resolution | Positive | P2 |
| TC_GD_157 | Conflict khi đang sử dụng nhiều tab | Edge | P2 |
| TC_GD_158 | Conflict resolve → timestamp sync đúng | Positive | P2 |
| TC_GD_159 | Conflict UI hiển thị timestamps readable | Positive | P2 |
| TC_GD_160 | Conflict resolution logging | Positive | P3 |
| TC_GD_161 | Network error khi upload | Negative | P0 |
| TC_GD_162 | Network error khi download | Negative | P0 |
| TC_GD_163 | API quota exceeded (429 Too Many Requests) | Negative | P1 |
| TC_GD_164 | Auth token revoked bên ngoài app | Negative | P1 |
| TC_GD_165 | Drive storage full | Negative | P2 |
| TC_GD_166 | Corrupted file trên Drive | Negative | P1 |
| TC_GD_167 | Google API 500 Internal Server Error | Negative | P1 |
| TC_GD_168 | Google API 403 Forbidden | Negative | P1 |
| TC_GD_169 | Request timeout 30s | Negative | P1 |
| TC_GD_170 | Retry logic: lần 1 fail, lần 2 success | Positive | P1 |
| TC_GD_171 | Retry logic: 3 lần fail liên tiếp → dừng | Positive | P2 |
| TC_GD_172 | Offline → queue changes | Positive | P1 |
| TC_GD_173 | Come online → auto-sync queued changes | Positive | P1 |
| TC_GD_174 | Offline indicator hiển thị | Positive | P1 |
| TC_GD_175 | Error retry button trong UI | Positive | P1 |
| TC_GD_176 | Error details expandable | Positive | P2 |
| TC_GD_177 | Error không crash app | Positive | P0 |
| TC_GD_178 | Slow network (3G) → sync vẫn hoạt động | Boundary | P2 |
| TC_GD_179 | Intermittent network → partial upload handling | Edge | P2 |
| TC_GD_180 | Error state → manual retry success → clear error | Positive | P1 |
| TC_GD_181 | CORS error handling | Negative | P2 |
| TC_GD_182 | SSL certificate error | Negative | P2 |
| TC_GD_183 | API response empty body | Negative | P2 |
| TC_GD_184 | API response wrong content-type | Edge | P2 |
| TC_GD_185 | Sync error logging trong Console | Positive | P2 |
| TC_GD_186 | Concurrent sync requests prevention | Positive | P1 |
| TC_GD_187 | Error recovery: clear error state on success | Positive | P1 |
| TC_GD_188 | Error notification không chồng chéo | Positive | P2 |
| TC_GD_189 | Network status listener cleanup | Positive | P2 |
| TC_GD_190 | Error boundary not triggered by sync errors | Positive | P1 |
| TC_GD_191 | Sync time < 5s cho data bình thường | Boundary | P2 |
| TC_GD_192 | Sync time < 15s cho data lớn | Boundary | P2 |
| TC_GD_193 | Memory usage stable during sync | Boundary | P2 |
| TC_GD_194 | Debounce timer cleanup khi unmount | Positive | P2 |
| TC_GD_195 | Sync không block UI thread | Positive | P1 |
| TC_GD_196 | OAuth token secure storage (không localStorage) | Security | P1 |
| TC_GD_197 | Drive appDataFolder permission only | Security | P1 |
| TC_GD_198 | No extra Drive permissions requested | Security | P1 |
| TC_GD_199 | Data encrypted in transit (HTTPS) | Security | P0 |
| TC_GD_200 | Sign out xóa tất cả tokens | Security | P0 |
| TC_GD_201 | Local data preserved sau sign out | Positive | P0 |
| TC_GD_202 | Sync background tab handling | Positive | P2 |
| TC_GD_203 | Sync khi app bị minimize | Edge | P2 |
| TC_GD_204 | Multiple browser tabs: chỉ 1 sync | Edge | P2 |
| TC_GD_205 | Sync data version tracking | Positive | P2 |
| TC_GD_206 | Selective sync: chỉ sync ingredients (nếu có) | Positive | P3 |
| TC_GD_207 | Sync history/log viewer | Positive | P3 |
| TC_GD_208 | Bandwidth optimization: chỉ sync diff | Positive | P3 |
| TC_GD_209 | Force sync button (ignore debounce) | Positive | P2 |
| TC_GD_210 | Sync encryption at rest (Drive) | Positive | P3 |

---

## Chi tiết Test Cases

### Nhóm 1: Authentication (Xác thực Google) (TC_GD_001 – TC_GD_025)

### TC_GD_001: Hiển thị nút Google Sign In khi chưa đăng nhập

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_001 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App mở tại localhost:3000, user chưa đăng nhập Google |
| **Các bước thực hiện** | 1. Mở app<br>2. Vào tab Settings<br>3. Cuộn đến section Google Drive Sync |
| **Kết quả mong đợi** | Nút 'Đăng nhập Google' hiển thị rõ ràng với icon Google |
| **Kết quả test thực tế** | — |

### TC_GD_002: Click Sign In mở OAuth popup

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_002 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App mở, user chưa đăng nhập |
| **Các bước thực hiện** | 1. Click nút 'Đăng nhập Google' |
| **Kết quả mong đợi** | Popup OAuth Google mở ra, hiển thị form chọn tài khoản |
| **Kết quả test thực tế** | — |

### TC_GD_003: Đăng nhập thành công hiển thị thông tin user

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_003 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | OAuth popup đang mở |
| **Các bước thực hiện** | 1. Chọn tài khoản Google<br>2. Cho phép quyền truy cập |
| **Kết quả mong đợi** | Popup đóng, hiển thị tên user + avatar, nút Sign Out xuất hiện |
| **Kết quả test thực tế** | — |

### TC_GD_004: Nút Sign Out hiển thị khi đã đăng nhập

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_004 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập Google thành công |
| **Các bước thực hiện** | 1. Kiểm tra section Google Drive Sync |
| **Kết quả mong đợi** | Nút 'Đăng xuất' hiển thị, nút 'Đăng nhập' ẩn đi |
| **Kết quả test thực tế** | — |

### TC_GD_005: Click Sign Out xóa auth state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_005 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | User đã đăng nhập Google |
| **Các bước thực hiện** | 1. Click nút 'Đăng xuất'<br>2. Xác nhận dialog đăng xuất |
| **Kết quả mong đợi** | Auth state bị xóa, quay lại trạng thái chưa đăng nhập, hiển thị nút 'Đăng nhập Google' |
| **Kết quả test thực tế** | — |

### TC_GD_006: Auth state persist sau reload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_006 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | User đã đăng nhập Google thành công |
| **Các bước thực hiện** | 1. Reload trang (F5)<br>2. Chờ app load xong<br>3. Kiểm tra section Google Drive Sync |
| **Kết quả mong đợi** | User vẫn đang đăng nhập, hiển thị tên + avatar |
| **Kết quả test thực tế** | — |

### TC_GD_007: Token refresh tự động khi gần hết hạn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_007 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập, token sắp hết hạn (< 5 phút) |
| **Các bước thực hiện** | 1. Chờ token gần expire<br>2. Thực hiện thao tác cần auth (sync) |
| **Kết quả mong đợi** | Token được refresh tự động, thao tác sync thành công, không yêu cầu đăng nhập lại |
| **Kết quả test thực tế** | — |

### TC_GD_008: Expired token yêu cầu re-auth

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_008 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập, token đã hết hạn hoàn toàn |
| **Các bước thực hiện** | 1. Chờ token expire<br>2. Click Sync Now |
| **Kết quả mong đợi** | Hiển thị thông báo 'Phiên đăng nhập hết hạn', popup OAuth mở để đăng nhập lại |
| **Kết quả test thực tế** | — |

### TC_GD_009: OAuth popup bị chặn bởi browser

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_009 |
| **Loại** | Negative |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Browser cài đặt chặn popup |
| **Các bước thực hiện** | 1. Click nút 'Đăng nhập Google' |
| **Kết quả mong đợi** | Hiển thị thông báo lỗi hướng dẫn user cho phép popup từ app |
| **Kết quả test thực tế** | — |

### TC_GD_010: User hủy OAuth flow

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_010 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | OAuth popup đang mở |
| **Các bước thực hiện** | 1. Click 'Cancel' hoặc đóng popup OAuth |
| **Kết quả mong đợi** | Popup đóng, app quay lại trạng thái chưa đăng nhập, hiển thị thông báo 'Đăng nhập bị hủy' |
| **Kết quả test thực tế** | — |

### TC_GD_011: Chọn nhiều tài khoản Google

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_011 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | OAuth popup hiển thị danh sách tài khoản |
| **Các bước thực hiện** | 1. Popup hiển thị nhiều tài khoản<br>2. Chọn tài khoản thứ 2 |
| **Kết quả mong đợi** | Đăng nhập bằng tài khoản được chọn, hiển thị đúng tên/avatar |
| **Kết quả test thực tế** | — |

### TC_GD_012: Chuyển đổi tài khoản Google

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_012 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | User đã đăng nhập tài khoản A |
| **Các bước thực hiện** | 1. Đăng xuất tài khoản A<br>2. Đăng nhập tài khoản B |
| **Kết quả mong đợi** | Data sync chuyển sang tài khoản B, dữ liệu Drive của tài khoản B được tải về |
| **Kết quả test thực tế** | — |

### TC_GD_013: AuthContext lưu trữ đúng user info

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_013 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User vừa đăng nhập Google thành công |
| **Các bước thực hiện** | 1. Kiểm tra AuthContext state trong React DevTools |
| **Kết quả mong đợi** | AuthContext chứa: email, name, imageUrl, accessToken |
| **Kết quả test thực tế** | — |

### TC_GD_014: Token lưu trữ an toàn trong memory

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_014 |
| **Loại** | Security |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập |
| **Các bước thực hiện** | 1. Kiểm tra localStorage<br>2. Kiểm tra sessionStorage<br>3. Kiểm tra cookies |
| **Kết quả mong đợi** | Access token không lưu trong localStorage/cookies (chỉ trong memory) |
| **Kết quả test thực tế** | — |

### TC_GD_015: Đăng nhập khi không có kết nối mạng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_015 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Thiết bị offline |
| **Các bước thực hiện** | 1. Click nút 'Đăng nhập Google' |
| **Kết quả mong đợi** | Hiển thị thông báo lỗi 'Không có kết nối mạng, vui lòng thử lại' |
| **Kết quả test thực tế** | — |

### TC_GD_016: OAuth chỉ yêu cầu quyền appDataFolder

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_016 |
| **Loại** | Security |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | OAuth popup đang hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra quyền truy cập được yêu cầu |
| **Kết quả mong đợi** | Chỉ yêu cầu quyền drive.appdata, không yêu cầu quyền đọc/ghi file Drive của user |
| **Kết quả test thực tế** | — |

### TC_GD_017: Đăng nhập lần đầu trigger initial sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_017 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User chưa từng đăng nhập Google trong app |
| **Các bước thực hiện** | 1. Đăng nhập Google lần đầu |
| **Kết quả mong đợi** | Sau đăng nhập thành công, auto-sync được trigger ngay lập tức |
| **Kết quả test thực tế** | — |

### TC_GD_018: Auth state cập nhật đúng khi sign out

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_018 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập |
| **Các bước thực hiện** | 1. Click Sign Out<br>2. Kiểm tra AuthContext trong DevTools |
| **Kết quả mong đợi** | AuthContext reset về null/empty, isAuthenticated = false |
| **Kết quả test thực tế** | — |

### TC_GD_019: Nhiều tab mở cùng auth state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_019 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | User đăng nhập ở tab 1 |
| **Các bước thực hiện** | 1. Mở tab 2 cùng URL<br>2. Kiểm tra auth state ở tab 2 |
| **Kết quả mong đợi** | Tab 2 cũng hiển thị trạng thái đăng nhập |
| **Kết quả test thực tế** | — |

### TC_GD_020: Auth UI responsive trên mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_020 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App mở trên viewport mobile (375px) |
| **Các bước thực hiện** | 1. Vào Settings > Google Drive Sync |
| **Kết quả mong đợi** | Nút đăng nhập/đăng xuất hiển thị đúng, không bị cắt hoặc tràn |
| **Kết quả test thực tế** | — |

### TC_GD_021: Auth UI trong dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_021 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode đang bật |
| **Các bước thực hiện** | 1. Vào Settings > Google Drive Sync |
| **Kết quả mong đợi** | Nút đăng nhập hiển thị rõ ràng trên nền tối, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_GD_022: HTTPS bắt buộc cho API calls

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_022 |
| **Loại** | Security |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | User đã đăng nhập |
| **Các bước thực hiện** | 1. Mở Network tab trong DevTools<br>2. Thực hiện sync |
| **Kết quả mong đợi** | Tất cả requests đến Google API đều dùng HTTPS |
| **Kết quả test thực tế** | — |

### TC_GD_023: Sign out trong khi đang sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_023 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync đang chạy (uploading/downloading) |
| **Các bước thực hiện** | 1. Click Sign Out trong khi sync |
| **Kết quả mong đợi** | Sync bị hủy, auth state cleared, hiển thị thông báo phù hợp |
| **Kết quả test thực tế** | — |

### TC_GD_024: Auth error handling khi Google API down

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_024 |
| **Loại** | Negative |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Google API không phản hồi |
| **Các bước thực hiện** | 1. Click Đăng nhập Google |
| **Kết quả mong đợi** | Hiển thị thông báo lỗi timeout sau 30s, cho phép retry |
| **Kết quả test thực tế** | — |

### TC_GD_025: Google account bị vô hiệu hóa

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_025 |
| **Loại** | Negative |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Tài khoản Google bị suspend |
| **Các bước thực hiện** | 1. Thử đăng nhập với tài khoản bị vô hiệu hóa |
| **Kết quả mong đợi** | Hiển thị thông báo lỗi từ Google, hướng dẫn user liên hệ Google support |
| **Kết quả test thực tế** | — |

### Nhóm 2: Auto-sync Configuration (Cấu hình tự động đồng bộ) (TC_GD_026 – TC_GD_050)

### TC_GD_026: Auto-sync toggle hiển thị khi đã đăng nhập

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_026 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập Google |
| **Các bước thực hiện** | 1. Kiểm tra Settings > Google Drive Sync |
| **Kết quả mong đợi** | Toggle 'Tự động đồng bộ' hiển thị với trạng thái on/off |
| **Kết quả test thực tế** | — |

### TC_GD_027: Bật auto-sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_027 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập, auto-sync đang tắt |
| **Các bước thực hiện** | 1. Bật toggle 'Tự động đồng bộ' |
| **Kết quả mong đợi** | Toggle chuyển sang ON, hiển thị thông báo 'Đã bật tự động đồng bộ' |
| **Kết quả test thực tế** | — |

### TC_GD_028: Tắt auto-sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_028 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập, auto-sync đang bật |
| **Các bước thực hiện** | 1. Tắt toggle 'Tự động đồng bộ' |
| **Kết quả mong đợi** | Toggle chuyển sang OFF, auto-sync dừng lại |
| **Kết quả test thực tế** | — |

### TC_GD_029: Auto-sync trigger khi thêm ingredient

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_029 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Auto-sync bật, user đã đăng nhập |
| **Các bước thực hiện** | 1. Thêm ingredient mới<br>2. Chờ 3 giây (debounce)<br>3. Kiểm tra Network tab |
| **Kết quả mong đợi** | Sau 3s debounce, request upload đến Google Drive API được gửi |
| **Kết quả test thực tế** | — |

### TC_GD_030: Auto-sync trigger khi sửa dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_030 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Sửa thông tin một dish<br>2. Chờ 3 giây |
| **Kết quả mong đợi** | Upload request được gửi sau debounce 3s |
| **Kết quả test thực tế** | — |

### TC_GD_031: Auto-sync trigger khi xóa plan

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_031 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Xóa một day plan<br>2. Chờ 3 giây |
| **Kết quả mong đợi** | Upload request được gửi với dữ liệu đã xóa plan |
| **Kết quả test thực tế** | — |

### TC_GD_032: Auto-sync trigger khi lưu template

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_032 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Lưu meal template mới<br>2. Chờ 3 giây |
| **Kết quả mong đợi** | Upload request chứa template mới |
| **Kết quả test thực tế** | — |

### TC_GD_033: Debounce 3s: nhiều thay đổi trong 3s chỉ 1 upload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_033 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Sửa ingredient 1 (t=0s)<br>2. Sửa ingredient 2 (t=1s)<br>3. Sửa ingredient 3 (t=2s)<br>4. Chờ 3 giây từ thay đổi cuối |
| **Kết quả mong đợi** | Chỉ có 1 request upload (không phải 3) |
| **Kết quả test thực tế** | — |

### TC_GD_034: Debounce reset khi có thay đổi mới

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_034 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Sửa dish (t=0s)<br>2. Chờ 2s<br>3. Sửa dish khác (t=2s)<br>4. Chờ 3s |
| **Kết quả mong đợi** | Upload chỉ xảy ra 3s sau thay đổi cuối cùng (t=5s) |
| **Kết quả test thực tế** | — |

### TC_GD_035: 10 thay đổi liên tục trong 5s → 1 upload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_035 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Thực hiện 10 thao tác sửa/thêm/xóa liên tục trong 5s<br>2. Chờ 3s sau thao tác cuối |
| **Kết quả mong đợi** | Chỉ 1 request upload duy nhất |
| **Kết quả test thực tế** | — |

### TC_GD_036: Auto-sync trạng thái 'idle' ban đầu

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_036 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập, auto-sync bật |
| **Các bước thực hiện** | 1. Kiểm tra sync status indicator |
| **Kết quả mong đợi** | Hiển thị trạng thái 'idle' hoặc 'Đã đồng bộ' |
| **Kết quả test thực tế** | — |

### TC_GD_037: Auto-sync trạng thái 'uploading'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_037 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Auto-sync đang upload |
| **Các bước thực hiện** | 1. Thay đổi data<br>2. Kiểm tra UI trong lúc upload |
| **Kết quả mong đợi** | Hiển thị trạng thái 'Đang đồng bộ...' với spinner |
| **Kết quả test thực tế** | — |

### TC_GD_038: Auto-sync trạng thái 'error'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_038 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Auto-sync upload thất bại |
| **Các bước thực hiện** | 1. Ngắt mạng<br>2. Thay đổi data<br>3. Chờ 3s |
| **Kết quả mong đợi** | Hiển thị trạng thái 'Lỗi đồng bộ' với icon cảnh báo |
| **Kết quả test thực tế** | — |

### TC_GD_039: Auto-sync không trigger khi chưa đăng nhập

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_039 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User chưa đăng nhập Google |
| **Các bước thực hiện** | 1. Thay đổi data<br>2. Chờ 5s<br>3. Kiểm tra Network tab |
| **Kết quả mong đợi** | Không có request nào đến Google Drive API |
| **Kết quả test thực tế** | — |

### TC_GD_040: Auto-sync setting persist sau reload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_040 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Auto-sync đã bật |
| **Các bước thực hiện** | 1. Reload trang<br>2. Kiểm tra toggle auto-sync |
| **Kết quả mong đợi** | Toggle vẫn ở trạng thái ON sau reload |
| **Kết quả test thực tế** | — |

### TC_GD_041: Auto-sync on app launch

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_041 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Auto-sync bật, có data mới từ lần dùng trước |
| **Các bước thực hiện** | 1. Mở app (fresh load) |
| **Kết quả mong đợi** | Auto-sync check và upload nếu có thay đổi từ lần sync trước |
| **Kết quả test thực tế** | — |

### TC_GD_042: Auto-sync khi thay đổi user profile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_042 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Sửa user profile (tên, mục tiêu dinh dưỡng)<br>2. Chờ 3s |
| **Kết quả mong đợi** | Upload request bao gồm profile data mới |
| **Kết quả test thực tế** | — |

### TC_GD_043: Auto-sync khi thay đổi goals/targets

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_043 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Sửa nutrition targets<br>2. Chờ 3s |
| **Kết quả mong đợi** | Upload request bao gồm goals data mới |
| **Kết quả test thực tế** | — |

### TC_GD_044: Auto-sync không chạy khi đang manual sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_044 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật, manual sync đang chạy |
| **Các bước thực hiện** | 1. Thay đổi data trong khi manual sync |
| **Kết quả mong đợi** | Auto-sync chờ manual sync hoàn thành, rồi mới chạy |
| **Kết quả test thực tế** | — |

### TC_GD_045: Auto-sync toggle ẩn khi chưa đăng nhập

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_045 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | User chưa đăng nhập Google |
| **Các bước thực hiện** | 1. Kiểm tra Settings > Google Drive |
| **Kết quả mong đợi** | Toggle auto-sync không hiển thị (hoặc disabled) |
| **Kết quả test thực tế** | — |

### TC_GD_046: Auto-sync indicator trong header/tab bar

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_046 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync đang bật và hoạt động |
| **Các bước thực hiện** | 1. Kiểm tra header hoặc tab bar |
| **Kết quả mong đợi** | Có icon nhỏ chỉ sync status (cloud icon) |
| **Kết quả test thực tế** | — |

### TC_GD_047: Auto-sync sau khi import data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_047 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Import data từ file JSON<br>2. Chờ 3s |
| **Kết quả mong đợi** | Auto-sync trigger upload dữ liệu mới import |
| **Kết quả test thực tế** | — |

### TC_GD_048: Auto-sync sau khi AI thêm dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_048 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Dùng AI phân tích ảnh → thêm dish mới<br>2. Chờ 3s |
| **Kết quả mong đợi** | Auto-sync upload bao gồm dish mới từ AI |
| **Kết quả test thực tế** | — |

### TC_GD_049: Auto-sync khi clear toàn bộ plan

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_049 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật, có nhiều plans |
| **Các bước thực hiện** | 1. Clear toàn bộ day plans<br>2. Chờ 3s |
| **Kết quả mong đợi** | Auto-sync upload dữ liệu đã clear plans |
| **Kết quả test thực tế** | — |

### TC_GD_050: Auto-sync debounce không leak memory

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_050 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Thực hiện 100 thay đổi liên tục<br>2. Kiểm tra memory usage trong DevTools |
| **Kết quả mong đợi** | Memory không tăng bất thường, debounce timer được cleanup đúng |
| **Kết quả test thực tế** | — |

### Nhóm 3: Manual Sync (Đồng bộ thủ công) (TC_GD_051 – TC_GD_075)

### TC_GD_051: Nút Manual Sync hiển thị khi đã đăng nhập

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_051 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập Google |
| **Các bước thực hiện** | 1. Vào Settings > Google Drive Sync |
| **Kết quả mong đợi** | Nút 'Đồng bộ ngay' hiển thị rõ ràng |
| **Kết quả test thực tế** | — |

### TC_GD_052: Click Manual Sync → upload data lên Drive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_052 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | User đã đăng nhập, có data local |
| **Các bước thực hiện** | 1. Click nút 'Đồng bộ ngay' |
| **Kết quả mong đợi** | Data được upload lên Google Drive, hiển thị 'Đồng bộ thành công' |
| **Kết quả test thực tế** | — |

### TC_GD_053: Manual sync button disabled khi đang sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_053 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync đang chạy |
| **Các bước thực hiện** | 1. Kiểm tra nút 'Đồng bộ ngay' |
| **Kết quả mong đợi** | Nút bị disabled/loading, không cho click lại |
| **Kết quả test thực tế** | — |

### TC_GD_054: Sync status: Đang đồng bộ (uploading)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_054 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Click Manual Sync |
| **Các bước thực hiện** | 1. Kiểm tra UI ngay sau click |
| **Kết quả mong đợi** | Hiển thị spinner + text 'Đang đồng bộ...' |
| **Kết quả test thực tế** | — |

### TC_GD_055: Sync status: Đồng bộ thành công

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_055 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync vừa hoàn thành thành công |
| **Các bước thực hiện** | 1. Kiểm tra UI |
| **Kết quả mong đợi** | Hiển thị checkmark + 'Đồng bộ thành công' + timestamp |
| **Kết quả test thực tế** | — |

### TC_GD_056: Sync status: Lỗi đồng bộ

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_056 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync thất bại do network error |
| **Các bước thực hiện** | 1. Kiểm tra UI |
| **Kết quả mong đợi** | Hiển thị icon lỗi + 'Lỗi đồng bộ' + nút retry |
| **Kết quả test thực tế** | — |

### TC_GD_057: Last sync timestamp hiển thị đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_057 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Đã sync thành công ít nhất 1 lần |
| **Các bước thực hiện** | 1. Kiểm tra thông tin sync |
| **Kết quả mong đợi** | Hiển thị 'Lần đồng bộ cuối: [thời gian]' chính xác |
| **Kết quả test thực tế** | — |

### TC_GD_058: Sync progress indicator

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_058 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync đang chạy với data lớn |
| **Các bước thực hiện** | 1. Kiểm tra UI trong lúc sync |
| **Kết quả mong đợi** | Hiển thị progress bar hoặc spinner với phần trăm |
| **Kết quả test thực tế** | — |

### TC_GD_059: Manual sync download từ Drive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_059 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Drive có backup mới hơn local |
| **Các bước thực hiện** | 1. Click 'Đồng bộ ngay'<br>2. Chọn 'Tải về từ Drive' |
| **Kết quả mong đợi** | Data từ Drive được download và merge vào local |
| **Kết quả test thực tế** | — |

### TC_GD_060: Manual sync lần đầu tạo file trên Drive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_060 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User mới đăng nhập, Drive chưa có backup |
| **Các bước thực hiện** | 1. Click 'Đồng bộ ngay' |
| **Kết quả mong đợi** | File backup mới được tạo trên Drive trong appDataFolder |
| **Kết quả test thực tế** | — |

### TC_GD_061: Manual sync cập nhật file existing trên Drive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_061 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Drive đã có backup file |
| **Các bước thực hiện** | 1. Click 'Đồng bộ ngay' |
| **Kết quả mong đợi** | File backup hiện tại trên Drive được PATCH (không tạo file mới) |
| **Kết quả test thực tế** | — |

### TC_GD_062: Sync notification toast success

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_062 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync thành công |
| **Các bước thực hiện** | 1. Kiểm tra toast notification |
| **Kết quả mong đợi** | Toast 'Đồng bộ thành công' hiển thị trong 3s rồi tự đóng |
| **Kết quả test thực tế** | — |

### TC_GD_063: Sync notification toast error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_063 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync thất bại |
| **Các bước thực hiện** | 1. Kiểm tra toast notification |
| **Kết quả mong đợi** | Toast 'Lỗi đồng bộ: [chi tiết lỗi]' hiển thị |
| **Kết quả test thực tế** | — |

### TC_GD_064: Manual sync ẩn khi chưa đăng nhập

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_064 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | User chưa đăng nhập |
| **Các bước thực hiện** | 1. Kiểm tra Settings |
| **Kết quả mong đợi** | Nút 'Đồng bộ ngay' không hiển thị hoặc disabled |
| **Kết quả test thực tế** | — |

### TC_GD_065: Sync button text chuyển đổi theo trạng thái

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_065 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | User đã đăng nhập |
| **Các bước thực hiện** | 1. Click sync<br>2. Quan sát text button qua các trạng thái |
| **Kết quả mong đợi** | idle:'Đồng bộ ngay' → syncing:'Đang đồng bộ...' → done:'Đã đồng bộ' |
| **Kết quả test thực tế** | — |

### TC_GD_066: Manual sync trong khi auto-sync debounce

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_066 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync đang đếm debounce 3s |
| **Các bước thực hiện** | 1. Click Manual Sync trước khi debounce hết |
| **Kết quả mong đợi** | Manual sync chạy ngay, auto-sync debounce bị reset |
| **Kết quả test thực tế** | — |

### TC_GD_067: Sync trên mobile layout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_067 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App trên viewport 375px |
| **Các bước thực hiện** | 1. Vào Settings > Google Drive Sync<br>2. Click Sync |
| **Kết quả mong đợi** | UI sync responsive, không bị cắt, nút bấm được |
| **Kết quả test thực tế** | — |

### TC_GD_068: Sync trên desktop layout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_068 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App trên viewport 1440px |
| **Các bước thực hiện** | 1. Vào Settings > Google Drive Sync<br>2. Click Sync |
| **Kết quả mong đợi** | UI sync hiển thị đúng layout desktop, nút và status rõ ràng |
| **Kết quả test thực tế** | — |

### TC_GD_069: Sync button keyboard accessible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_069 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | User dùng keyboard navigation |
| **Các bước thực hiện** | 1. Tab đến nút Sync<br>2. Nhấn Enter |
| **Kết quả mong đợi** | Sync được trigger bằng keyboard |
| **Kết quả test thực tế** | — |

### TC_GD_070: Screen reader đọc sync status

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_070 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Screen reader đang bật |
| **Các bước thực hiện** | 1. Thực hiện sync<br>2. Lắng nghe screen reader |
| **Kết quả mong đợi** | Screen reader thông báo 'Đang đồng bộ' và 'Đồng bộ thành công' |
| **Kết quả test thực tế** | — |

### TC_GD_071: Sync với data rỗng (không có ingredient/dish/plan)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_071 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App vừa cài, chưa có data nào |
| **Các bước thực hiện** | 1. Click 'Đồng bộ ngay' |
| **Kết quả mong đợi** | Upload thành công file rỗng/default lên Drive |
| **Kết quả test thực tế** | — |

### TC_GD_072: Sync với 1 ingredient duy nhất

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_072 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App có 1 ingredient |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra file trên Drive |
| **Kết quả mong đợi** | File backup chứa đúng 1 ingredient |
| **Kết quả test thực tế** | — |

### TC_GD_073: Manual sync cancel/abort

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_073 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync đang chạy |
| **Các bước thực hiện** | 1. Click nút hủy sync (nếu có) |
| **Kết quả mong đợi** | Sync bị hủy, hiển thị 'Đã hủy đồng bộ' |
| **Kết quả test thực tế** | — |

### TC_GD_074: Sync dark mode UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_074 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Vào Settings > Google Drive Sync<br>2. Thực hiện sync |
| **Kết quả mong đợi** | Tất cả UI sync hiển thị đúng trong dark mode |
| **Kết quả test thực tế** | — |

### TC_GD_075: Sync i18n labels tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_075 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngôn ngữ = Tiếng Việt |
| **Các bước thực hiện** | 1. Kiểm tra tất cả labels liên quan đến sync |
| **Kết quả mong đợi** | Tất cả labels hiển thị bằng tiếng Việt: 'Đồng bộ ngay', 'Đang đồng bộ...', 'Đồng bộ thành công' |
| **Kết quả test thực tế** | — |

### Nhóm 4: Data Upload (Tải lên dữ liệu) (TC_GD_076 – TC_GD_105)

### TC_GD_076: Upload bao gồm ingredients data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_076 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Có ≥1 ingredient, user đã đăng nhập |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra request body trong Network tab |
| **Kết quả mong đợi** | JSON payload chứa danh sách ingredients đầy đủ |
| **Kết quả test thực tế** | — |

### TC_GD_077: Upload bao gồm dishes data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_077 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Có ≥1 dish |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra payload |
| **Kết quả mong đợi** | JSON payload chứa danh sách dishes với ingredients reference |
| **Kết quả test thực tế** | — |

### TC_GD_078: Upload bao gồm day plans data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_078 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Có ≥1 day plan |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra payload |
| **Kết quả mong đợi** | JSON payload chứa day plans với dish references |
| **Kết quả test thực tế** | — |

### TC_GD_079: Upload bao gồm meal templates

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_079 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Có ≥1 meal template |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra payload |
| **Kết quả mong đợi** | JSON payload chứa meal templates |
| **Kết quả test thực tế** | — |

### TC_GD_080: Upload bao gồm user profile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_080 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User profile đã được cập nhật |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra payload |
| **Kết quả mong đợi** | JSON payload chứa user profile data |
| **Kết quả test thực tế** | — |

### TC_GD_081: Upload bao gồm nutrition goals

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_081 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Nutrition goals đã được thiết lập |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra payload |
| **Kết quả mong đợi** | JSON payload chứa nutrition goals/targets |
| **Kết quả test thực tế** | — |

### TC_GD_082: Upload data format JSON hợp lệ

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_082 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Có data để sync |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra response status |
| **Kết quả mong đợi** | Response status 200, file được tạo/cập nhật thành công trên Drive |
| **Kết quả test thực tế** | — |

### TC_GD_083: Upload multipart cho file mới

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_083 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Lần đầu sync (chưa có file trên Drive) |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra request type trong Network |
| **Kết quả mong đợi** | Request dùng multipart upload để tạo file mới |
| **Kết quả test thực tế** | — |

### TC_GD_084: Upload PATCH cho file existing

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_084 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Đã sync trước đó (file exists trên Drive) |
| **Các bước thực hiện** | 1. Click Sync<br>2. Kiểm tra request method |
| **Kết quả mong đợi** | Request dùng PATCH method để cập nhật file |
| **Kết quả test thực tế** | — |

### TC_GD_085: Upload success → mp-last-sync-at updated

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_085 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync thành công |
| **Các bước thực hiện** | 1. Kiểm tra localStorage mp-last-sync-at |
| **Kết quả mong đợi** | Timestamp được cập nhật thành thời điểm sync vừa xong |
| **Kết quả test thực tế** | — |

### TC_GD_086: Upload với ingredient có dấu tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_086 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ingredient tên 'Bún bò Huế' |
| **Các bước thực hiện** | 1. Thêm ingredient 'Bún bò Huế'<br>2. Sync |
| **Kết quả mong đợi** | Ingredient name giữ nguyên dấu tiếng Việt sau upload |
| **Kết quả test thực tế** | — |

### TC_GD_087: Upload với dish có nhiều ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_087 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish có 15 ingredients |
| **Các bước thực hiện** | 1. Sync<br>2. Kiểm tra data trên Drive |
| **Kết quả mong đợi** | Tất cả 15 ingredients được upload đầy đủ |
| **Kết quả test thực tế** | — |

### TC_GD_088: Upload với plan có 3 bữa đầy đủ

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_088 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Day plan có breakfast, lunch, dinner |
| **Các bước thực hiện** | 1. Sync<br>2. Kiểm tra data trên Drive |
| **Kết quả mong đợi** | Plan chứa đầy đủ 3 bữa với dishes tương ứng |
| **Kết quả test thực tế** | — |

### TC_GD_089: Upload data integrity: hash/checksum

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_089 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Data đã upload thành công |
| **Các bước thực hiện** | 1. Download lại data<br>2. So sánh với local data |
| **Kết quả mong đợi** | Data upload = data download (không mất mát) |
| **Kết quả test thực tế** | — |

### TC_GD_090: Upload khi network chậm (3G)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_090 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mạng throttle 3G (Network tab) |
| **Các bước thực hiện** | 1. Bật 3G throttling<br>2. Click Sync |
| **Kết quả mong đợi** | Upload hoàn thành (có thể chậm hơn), hiển thị progress |
| **Kết quả test thực tế** | — |

### TC_GD_091: Upload khi network bị ngắt giữa chừng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_091 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync đang upload |
| **Các bước thực hiện** | 1. Ngắt network giữa chừng |
| **Kết quả mong đợi** | Hiển thị lỗi 'Mất kết nối', cho phép retry |
| **Kết quả test thực tế** | — |

### TC_GD_092: Upload với data > 1MB

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_092 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App có nhiều data (> 1MB JSON) |
| **Các bước thực hiện** | 1. Click Sync |
| **Kết quả mong đợi** | Upload thành công, không timeout |
| **Kết quả test thực tế** | — |

### TC_GD_093: Upload với data > 5MB

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_093 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App có rất nhiều data (> 5MB) |
| **Các bước thực hiện** | 1. Click Sync |
| **Kết quả mong đợi** | Upload xử lý đúng (success hoặc thông báo giới hạn) |
| **Kết quả test thực tế** | — |

### TC_GD_094: Upload không gửi sensitive info

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_094 |
| **Loại** | Security |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập |
| **Các bước thực hiện** | 1. Sync<br>2. Kiểm tra payload trong Network tab |
| **Kết quả mong đợi** | Payload không chứa access token, password, hoặc sensitive data |
| **Kết quả test thực tế** | — |

### TC_GD_095: Upload timestamp format chuẩn ISO

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_095 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync thành công |
| **Các bước thực hiện** | 1. Kiểm tra modifiedTime trong response |
| **Kết quả mong đợi** | Timestamp format ISO 8601 |
| **Kết quả test thực tế** | — |

### TC_GD_096: Upload retry tự động khi fail lần 1

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_096 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Upload fail do network glitch |
| **Các bước thực hiện** | 1. Click Sync<br>2. Network glitch tạm thời |
| **Kết quả mong đợi** | App tự retry 1-2 lần trước khi báo lỗi |
| **Kết quả test thực tế** | — |

### TC_GD_097: Upload max retry attempts

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_097 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Upload fail liên tục |
| **Các bước thực hiện** | 1. Click Sync khi network down<br>2. Đếm số retry |
| **Kết quả mong đợi** | Sau max retry (2-3 lần), dừng lại và báo lỗi |
| **Kết quả test thực tế** | — |

### TC_GD_098: Upload với ingredient có giá trị nutrition 0

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_098 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ingredient calories=0, protein=0 |
| **Các bước thực hiện** | 1. Sync<br>2. Kiểm tra data Drive |
| **Kết quả mong đợi** | Giá trị 0 được giữ nguyên (không bị null/undefined) |
| **Kết quả test thực tế** | — |

### TC_GD_099: Upload với ingredient có giá trị nutrition rất lớn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_099 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ingredient calories=9999 |
| **Các bước thực hiện** | 1. Sync<br>2. Kiểm tra data Drive |
| **Kết quả mong đợi** | Giá trị lớn được upload đúng |
| **Kết quả test thực tế** | — |

### TC_GD_100: Upload không tạo duplicate files trên Drive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_100 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync nhiều lần |
| **Các bước thực hiện** | 1. Sync 5 lần liên tiếp<br>2. Kiểm tra listBackups |
| **Kết quả mong đợi** | Chỉ 1 file backup trên Drive (cập nhật, không tạo mới) |
| **Kết quả test thực tế** | — |

### TC_GD_101: Upload với emoji trong dish name

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_101 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish tên '🍜 Phở bò' |
| **Các bước thực hiện** | 1. Sync<br>2. Kiểm tra data Drive |
| **Kết quả mong đợi** | Emoji được giữ nguyên trong data |
| **Kết quả test thực tế** | — |

### TC_GD_102: Upload trong khi user đang edit form

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_102 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync trigger, user đang nhập form |
| **Các bước thực hiện** | 1. Đang nhập ingredient form<br>2. Auto-sync trigger upload |
| **Kết quả mong đợi** | Upload không ảnh hưởng form đang nhập, data snapshot tại thời điểm trigger |
| **Kết quả test thực tế** | — |

### TC_GD_103: Upload bao gồm settings (dark mode, language)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_103 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | User đã thay đổi settings |
| **Các bước thực hiện** | 1. Sync<br>2. Kiểm tra payload |
| **Kết quả mong đợi** | Settings data được bao gồm trong backup |
| **Kết quả test thực tế** | — |

### TC_GD_104: Upload compression (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_104 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Data lớn |
| **Các bước thực hiện** | 1. Sync<br>2. Kiểm tra Content-Encoding |
| **Kết quả mong đợi** | Data có thể được compress để tiết kiệm bandwidth |
| **Kết quả test thực tế** | — |

### TC_GD_105: Upload content-type đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_105 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync đang chạy |
| **Các bước thực hiện** | 1. Kiểm tra request headers |
| **Kết quả mong đợi** | Content-Type: multipart/related hoặc application/json |
| **Kết quả test thực tế** | — |

### Nhóm 5: Data Download (Tải xuống dữ liệu) (TC_GD_106 – TC_GD_130)

### TC_GD_106: Download data từ Drive thành công

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_106 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Drive có backup file |
| **Các bước thực hiện** | 1. Click 'Tải về từ Drive' hoặc auto-download |
| **Kết quả mong đợi** | Data từ Drive được download và parse thành công |
| **Kết quả test thực tế** | — |

### TC_GD_107: Download → ingredients restored đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_107 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Drive backup có 10 ingredients |
| **Các bước thực hiện** | 1. Download backup<br>2. Kiểm tra danh sách ingredients |
| **Kết quả mong đợi** | 10 ingredients hiển thị đúng với name, nutrition values |
| **Kết quả test thực tế** | — |

### TC_GD_108: Download → dishes restored đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_108 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Drive backup có 5 dishes |
| **Các bước thực hiện** | 1. Download backup<br>2. Kiểm tra danh sách dishes |
| **Kết quả mong đợi** | 5 dishes hiển thị đúng với ingredients references |
| **Kết quả test thực tế** | — |

### TC_GD_109: Download → plans restored đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_109 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Drive backup có 7 day plans |
| **Các bước thực hiện** | 1. Download backup<br>2. Kiểm tra Calendar |
| **Kết quả mong đợi** | 7 day plans hiển thị đúng trên Calendar |
| **Kết quả test thực tế** | — |

### TC_GD_110: Download → templates restored đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_110 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Drive backup có 3 templates |
| **Các bước thực hiện** | 1. Download backup<br>2. Kiểm tra templates |
| **Kết quả mong đợi** | 3 templates hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_GD_111: Download → user profile restored

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_111 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Drive backup có user profile |
| **Các bước thực hiện** | 1. Download backup<br>2. Kiểm tra Settings |
| **Kết quả mong đợi** | User profile data hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_GD_112: Download khi local data rỗng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_112 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Local storage rỗng, Drive có data |
| **Các bước thực hiện** | 1. Sync → download |
| **Kết quả mong đợi** | Data từ Drive restore hoàn toàn vào local |
| **Kết quả test thực tế** | — |

### TC_GD_113: Download khi local data đã có

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_113 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Local có data cũ, Drive có data mới |
| **Các bước thực hiện** | 1. Sync → download |
| **Kết quả mong đợi** | Data mới từ Drive thay thế/merge data cũ |
| **Kết quả test thực tế** | — |

### TC_GD_114: Download file không tồn tại trên Drive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_114 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Drive không có backup file |
| **Các bước thực hiện** | 1. Thử download |
| **Kết quả mong đợi** | Hiển thị thông báo 'Chưa có bản sao lưu trên Drive' |
| **Kết quả test thực tế** | — |

### TC_GD_115: Download file bị corrupt trên Drive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_115 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | File trên Drive bị corrupt |
| **Các bước thực hiện** | 1. Thử download |
| **Kết quả mong đợi** | Hiển thị lỗi 'File backup không hợp lệ', local data không bị ảnh hưởng |
| **Kết quả test thực tế** | — |

### TC_GD_116: Download giữ nguyên dấu tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_116 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Drive backup có data tiếng Việt |
| **Các bước thực hiện** | 1. Download<br>2. Kiểm tra tên ingredients/dishes |
| **Kết quả mong đợi** | Tất cả dấu tiếng Việt hiển thị đúng (đ, ă, â, ê, ô, ơ, ư) |
| **Kết quả test thực tế** | — |

### TC_GD_117: Download network error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_117 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Network bị ngắt |
| **Các bước thực hiện** | 1. Thử download |
| **Kết quả mong đợi** | Hiển thị lỗi 'Không thể tải dữ liệu, kiểm tra kết nối mạng' |
| **Kết quả test thực tế** | — |

### TC_GD_118: Download timeout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_118 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Network rất chậm |
| **Các bước thực hiện** | 1. Thử download<br>2. Chờ timeout |
| **Kết quả mong đợi** | Hiển thị lỗi timeout sau 30s, cho phép retry |
| **Kết quả test thực tế** | — |

### TC_GD_119: Download với data lớn (>5MB)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_119 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Backup file lớn trên Drive |
| **Các bước thực hiện** | 1. Thử download |
| **Kết quả mong đợi** | Download thành công, hiển thị progress |
| **Kết quả test thực tế** | — |

### TC_GD_120: Download round-trip: upload → download → data identical

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_120 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App có data đầy đủ |
| **Các bước thực hiện** | 1. Upload lên Drive<br>2. Clear local data<br>3. Download từ Drive<br>4. So sánh data |
| **Kết quả mong đợi** | Data sau round-trip giống hệt data ban đầu |
| **Kết quả test thực tế** | — |

### TC_GD_121: Download cập nhật last sync timestamp

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_121 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Download thành công |
| **Các bước thực hiện** | 1. Kiểm tra mp-last-sync-at |
| **Kết quả mong đợi** | Timestamp cập nhật đúng |
| **Kết quả test thực tế** | — |

### TC_GD_122: Download không mất data local nếu fail

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_122 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Download bị fail giữa chừng |
| **Các bước thực hiện** | 1. Download bắt đầu<br>2. Network ngắt giữa chừng |
| **Kết quả mong đợi** | Local data giữ nguyên, không bị partial overwrite |
| **Kết quả test thực tế** | — |

### TC_GD_123: Download notification success

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_123 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Download thành công |
| **Các bước thực hiện** | 1. Kiểm tra toast |
| **Kết quả mong đợi** | Toast 'Tải dữ liệu thành công' hiển thị |
| **Kết quả test thực tế** | — |

### TC_GD_124: Download notification error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_124 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Download thất bại |
| **Các bước thực hiện** | 1. Kiểm tra toast |
| **Kết quả mong đợi** | Toast lỗi hiển thị với chi tiết |
| **Kết quả test thực tế** | — |

### TC_GD_125: Download → UI auto-refresh

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_125 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Download thành công, data thay đổi |
| **Các bước thực hiện** | 1. Download backup mới<br>2. Kiểm tra UI |
| **Kết quả mong đợi** | Danh sách ingredients/dishes/plans tự cập nhật ngay sau download |
| **Kết quả test thực tế** | — |

### TC_GD_126: Download → nutrition totals recalculated

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_126 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Download backup có dishes khác |
| **Các bước thực hiện** | 1. Download<br>2. Kiểm tra nutrition summary |
| **Kết quả mong đợi** | Nutrition totals cập nhật theo data mới |
| **Kết quả test thực tế** | — |

### TC_GD_127: Download sử dụng downloadLatestBackup()

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_127 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Drive có nhiều backup versions |
| **Các bước thực hiện** | 1. Download |
| **Kết quả mong đợi** | App download version mới nhất (latest modifiedTime) |
| **Kết quả test thực tế** | — |

### TC_GD_128: Download caching (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_128 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Download lần 2 cùng data |
| **Các bước thực hiện** | 1. Download 2 lần liên tiếp |
| **Kết quả mong đợi** | Lần 2 có thể dùng cache (hoặc skip nếu không thay đổi) |
| **Kết quả test thực tế** | — |

### TC_GD_129: Download parsing JSON error handling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_129 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | File trên Drive có JSON không hợp lệ |
| **Các bước thực hiện** | 1. Download file |
| **Kết quả mong đợi** | App catch JSON parse error, hiển thị lỗi phù hợp, local data an toàn |
| **Kết quả test thực tế** | — |

### TC_GD_130: Download khi auth token hết hạn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_130 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Token expired |
| **Các bước thực hiện** | 1. Thử download |
| **Kết quả mong đợi** | App detect expired token, yêu cầu re-auth hoặc auto-refresh |
| **Kết quả test thực tế** | — |

### Nhóm 6: Conflict Resolution (Giải quyết xung đột) (TC_GD_131 – TC_GD_160)

### TC_GD_131: Conflict detection: local mới hơn Drive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_131 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Local modifiedTime > Drive modifiedTime |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | App detect local mới hơn, auto-upload (hoặc hỏi user) |
| **Kết quả test thực tế** | — |

### TC_GD_132: Conflict detection: Drive mới hơn local

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_132 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Drive modifiedTime > local modifiedTime |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | App detect Drive mới hơn, hiển thị SyncConflictModal |
| **Kết quả test thực tế** | — |

### TC_GD_133: SyncConflictModal hiển thị đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_133 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Conflict detected |
| **Các bước thực hiện** | 1. Kiểm tra modal |
| **Kết quả mong đợi** | Modal hiển thị: 'Local' vs 'Drive' timestamps, nút chọn |
| **Kết quả test thực tế** | — |

### TC_GD_134: Conflict: chọn giữ local data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_134 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | SyncConflictModal hiển thị |
| **Các bước thực hiện** | 1. Click 'Giữ dữ liệu local' |
| **Kết quả mong đợi** | Local data được upload lên Drive, Drive bị overwrite |
| **Kết quả test thực tế** | — |

### TC_GD_135: Conflict: chọn giữ Drive data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_135 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | SyncConflictModal hiển thị |
| **Các bước thực hiện** | 1. Click 'Tải dữ liệu từ Drive' |
| **Kết quả mong đợi** | Drive data được download, local bị overwrite |
| **Kết quả test thực tế** | — |

### TC_GD_136: Conflict modal đóng sau khi chọn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_136 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | User đã chọn option |
| **Các bước thực hiện** | 1. Chọn 1 option trong modal |
| **Kết quả mong đợi** | Modal đóng, sync thực hiện theo lựa chọn |
| **Kết quả test thực tế** | — |

### TC_GD_137: Conflict: timestamp comparison chính xác

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_137 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Local sửa 10:00, Drive sửa 10:05 |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | App detect Drive mới hơn 5 phút |
| **Kết quả test thực tế** | — |

### TC_GD_138: Conflict: cùng timestamp

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_138 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Local và Drive cùng modifiedTime |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | App xử lý hợp lý (upload local hoặc skip) |
| **Kết quả test thực tế** | — |

### TC_GD_139: Conflict khi offline rồi online

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_139 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User sửa data offline, Drive đã có data mới |
| **Các bước thực hiện** | 1. Bật lại mạng<br>2. Sync |
| **Kết quả mong đợi** | Conflict detected, hiển thị modal cho user chọn |
| **Kết quả test thực tế** | — |

### TC_GD_140: Conflict modal dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_140 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật, conflict detected |
| **Các bước thực hiện** | 1. Kiểm tra modal |
| **Kết quả mong đợi** | Modal hiển thị đúng trong dark mode |
| **Kết quả test thực tế** | — |

### TC_GD_141: Conflict modal i18n labels

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_141 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngôn ngữ tiếng Việt |
| **Các bước thực hiện** | 1. Kiểm tra modal labels |
| **Kết quả mong đợi** | Tất cả text trong modal bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_GD_142: Conflict modal responsive mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_142 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, conflict detected |
| **Các bước thực hiện** | 1. Kiểm tra modal |
| **Kết quả mong đợi** | Modal hiển thị đúng trên mobile (bottom sheet hoặc full-width) |
| **Kết quả test thực tế** | — |

### TC_GD_143: Conflict modal keyboard accessible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_143 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Dùng keyboard |
| **Các bước thực hiện** | 1. Tab qua các options<br>2. Enter để chọn |
| **Kết quả mong đợi** | Modal navigable bằng keyboard |
| **Kết quả test thực tế** | — |

### TC_GD_144: Conflict modal close bằng ESC

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_144 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal đang mở |
| **Các bước thực hiện** | 1. Nhấn ESC |
| **Kết quả mong đợi** | Modal đóng, sync bị hủy (không chọn option nào) |
| **Kết quả test thực tế** | — |

### TC_GD_145: Multiple conflicts liên tiếp

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_145 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync nhiều lần có conflict |
| **Các bước thực hiện** | 1. Sync lần 1 → conflict → resolve<br>2. Sync lần 2 → conflict |
| **Kết quả mong đợi** | Mỗi lần conflict đều hiển thị modal riêng |
| **Kết quả test thực tế** | — |

### TC_GD_146: Conflict data preview (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_146 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Conflict detected |
| **Các bước thực hiện** | 1. Kiểm tra modal |
| **Kết quả mong đợi** | Modal hiển thị summary: số ingredients/dishes khác nhau |
| **Kết quả test thực tế** | — |

### TC_GD_147: Conflict resolution không mất data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_147 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Conflict resolved bằng cách chọn 1 bên |
| **Các bước thực hiện** | 1. Resolve conflict<br>2. Kiểm tra data sau resolution |
| **Kết quả mong đợi** | Data bên được chọn intact hoàn toàn |
| **Kết quả test thực tế** | — |

### TC_GD_148: Auto-conflict resolution: newer wins

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_148 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Setting auto-resolve = newer wins |
| **Các bước thực hiện** | 1. Sync khi có conflict |
| **Kết quả mong đợi** | Tự động chọn data mới hơn mà không hiển thị modal |
| **Kết quả test thực tế** | — |

### TC_GD_149: Conflict khi có thay đổi nhỏ (1 ingredient)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_149 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Chỉ sửa 1 ingredient trên mỗi bên |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | Conflict detected dù chỉ 1 item khác nhau |
| **Kết quả test thực tế** | — |

### TC_GD_150: Conflict khi có thay đổi lớn (50+ items)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_150 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Nhiều thay đổi trên cả 2 bên |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | Conflict modal hiển thị summary rõ ràng |
| **Kết quả test thực tế** | — |

### TC_GD_151: Conflict resolution → auto-sync resume

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_151 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật, conflict resolved |
| **Các bước thực hiện** | 1. Resolve conflict |
| **Kết quả mong đợi** | Auto-sync resume bình thường sau resolution |
| **Kết quả test thực tế** | — |

### TC_GD_152: Conflict modal accessibility: screen reader

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_152 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Screen reader bật |
| **Các bước thực hiện** | 1. Conflict modal mở |
| **Kết quả mong đợi** | Screen reader đọc nội dung modal và options |
| **Kết quả test thực tế** | — |

### TC_GD_153: Conflict sau khi app restart

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_153 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Conflict pending, restart app |
| **Các bước thực hiện** | 1. Restart app |
| **Kết quả mong đợi** | App detect conflict lại khi sync, hiển thị modal |
| **Kết quả test thực tế** | — |

### TC_GD_154: Conflict khi data structure khác version

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_154 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Drive có data từ app version cũ |
| **Các bước thực hiện** | 1. Sync với version mismatch |
| **Kết quả mong đợi** | App detect version mismatch, migrate hoặc thông báo |
| **Kết quả test thực tế** | — |

### TC_GD_155: Conflict modal loading state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_155 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal đang load comparison data |
| **Các bước thực hiện** | 1. Kiểm tra modal trong lúc load |
| **Kết quả mong đợi** | Hiển thị skeleton/spinner trong lúc compare |
| **Kết quả test thực tế** | — |

### TC_GD_156: Cancel conflict resolution

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_156 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal hiển thị |
| **Các bước thực hiện** | 1. Click Cancel hoặc đóng modal |
| **Kết quả mong đợi** | Sync bị hủy, data local giữ nguyên |
| **Kết quả test thực tế** | — |

### TC_GD_157: Conflict khi đang sử dụng nhiều tab

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_157 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Tab 1 sync, tab 2 sửa data |
| **Các bước thực hiện** | 1. Tab 1 upload<br>2. Tab 2 sửa data<br>3. Tab 2 sync |
| **Kết quả mong đợi** | Conflict detected giữa tab 1 upload và tab 2 local |
| **Kết quả test thực tế** | — |

### TC_GD_158: Conflict resolve → timestamp sync đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_158 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Conflict resolved |
| **Các bước thực hiện** | 1. Kiểm tra mp-last-sync-at |
| **Kết quả mong đợi** | Timestamp cập nhật đúng sau resolution |
| **Kết quả test thực tế** | — |

### TC_GD_159: Conflict UI hiển thị timestamps readable

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_159 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Conflict modal hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format timestamps |
| **Kết quả mong đợi** | Timestamps hiển thị dạng '10:30 AM, 15/03/2026' (không phải raw ISO) |
| **Kết quả test thực tế** | — |

### TC_GD_160: Conflict resolution logging

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_160 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Conflict resolved |
| **Các bước thực hiện** | 1. Kiểm tra console log |
| **Kết quả mong đợi** | Log ghi nhận: 'Conflict resolved: kept [local/drive] data' |
| **Kết quả test thực tế** | — |

### Nhóm 7: Error Handling & Network (Xử lý lỗi & mạng) (TC_GD_161 – TC_GD_190)

### TC_GD_161: Network error khi upload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_161 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Network bị ngắt |
| **Các bước thực hiện** | 1. Click Sync khi offline |
| **Kết quả mong đợi** | Hiển thị lỗi 'Không có kết nối mạng' |
| **Kết quả test thực tế** | — |

### TC_GD_162: Network error khi download

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_162 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Network bị ngắt |
| **Các bước thực hiện** | 1. Thử download từ Drive |
| **Kết quả mong đợi** | Hiển thị lỗi network, local data giữ nguyên |
| **Kết quả test thực tế** | — |

### TC_GD_163: API quota exceeded (429 Too Many Requests)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_163 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Gọi API quá nhiều |
| **Các bước thực hiện** | 1. Sync liên tục 50 lần |
| **Kết quả mong đợi** | Hiển thị lỗi 'Quá giới hạn API, thử lại sau' |
| **Kết quả test thực tế** | — |

### TC_GD_164: Auth token revoked bên ngoài app

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_164 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User revoke quyền truy cập từ Google account |
| **Các bước thực hiện** | 1. Thử sync |
| **Kết quả mong đợi** | Hiển thị lỗi auth, yêu cầu đăng nhập lại |
| **Kết quả test thực tế** | — |

### TC_GD_165: Drive storage full

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_165 |
| **Loại** | Negative |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Google Drive user hết dung lượng |
| **Các bước thực hiện** | 1. Thử upload |
| **Kết quả mong đợi** | Hiển thị lỗi 'Hết dung lượng Google Drive' |
| **Kết quả test thực tế** | — |

### TC_GD_166: Corrupted file trên Drive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_166 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | File backup trên Drive bị hỏng |
| **Các bước thực hiện** | 1. Thử download |
| **Kết quả mong đợi** | Hiển thị lỗi parse, cho phép overwrite với data local |
| **Kết quả test thực tế** | — |

### TC_GD_167: Google API 500 Internal Server Error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_167 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Google API trả về 500 |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | Hiển thị lỗi server, auto-retry 1-2 lần |
| **Kết quả test thực tế** | — |

### TC_GD_168: Google API 403 Forbidden

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_168 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Quyền truy cập bị từ chối |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | Hiển thị lỗi quyền, hướng dẫn re-auth |
| **Kết quả test thực tế** | — |

### TC_GD_169: Request timeout 30s

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_169 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | API phản hồi chậm > 30s |
| **Các bước thực hiện** | 1. Sync khi API chậm |
| **Kết quả mong đợi** | Abort request sau 30s, hiển thị lỗi timeout |
| **Kết quả test thực tế** | — |

### TC_GD_170: Retry logic: lần 1 fail, lần 2 success

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_170 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Network glitch tạm thời |
| **Các bước thực hiện** | 1. Sync<br>2. Lần 1 fail<br>3. Auto-retry lần 2 |
| **Kết quả mong đợi** | Lần 2 thành công, user thấy 'Đồng bộ thành công' |
| **Kết quả test thực tế** | — |

### TC_GD_171: Retry logic: 3 lần fail liên tiếp → dừng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_171 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Network down hoàn toàn |
| **Các bước thực hiện** | 1. Sync<br>2. 3 retry fail |
| **Kết quả mong đợi** | Dừng retry, hiển thị lỗi cuối cùng |
| **Kết quả test thực tế** | — |

### TC_GD_172: Offline → queue changes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_172 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App offline, auto-sync bật |
| **Các bước thực hiện** | 1. Sửa data khi offline |
| **Kết quả mong đợi** | Thay đổi được queue, hiển thị badge 'Chờ đồng bộ' |
| **Kết quả test thực tế** | — |

### TC_GD_173: Come online → auto-sync queued changes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_173 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App vừa có lại mạng, có data queued |
| **Các bước thực hiện** | 1. Bật lại network |
| **Kết quả mong đợi** | Auto-sync trigger upload queued changes |
| **Kết quả test thực tế** | — |

### TC_GD_174: Offline indicator hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_174 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App offline |
| **Các bước thực hiện** | 1. Kiểm tra UI |
| **Kết quả mong đợi** | Hiển thị banner/icon 'Offline' hoặc 'Không có mạng' |
| **Kết quả test thực tế** | — |

### TC_GD_175: Error retry button trong UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_175 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync error hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra error UI |
| **Kết quả mong đợi** | Có nút 'Thử lại' để retry manual |
| **Kết quả test thực tế** | — |

### TC_GD_176: Error details expandable

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_176 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync error hiển thị |
| **Các bước thực hiện** | 1. Click 'Chi tiết lỗi' |
| **Kết quả mong đợi** | Hiển thị error message chi tiết (HTTP status, response body) |
| **Kết quả test thực tế** | — |

### TC_GD_177: Error không crash app

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_177 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Bất kỳ sync error nào |
| **Các bước thực hiện** | 1. Gây ra lỗi sync |
| **Kết quả mong đợi** | App không crash, ErrorBoundary không trigger, chỉ hiện toast lỗi |
| **Kết quả test thực tế** | — |

### TC_GD_178: Slow network (3G) → sync vẫn hoạt động

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_178 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Network throttle 3G |
| **Các bước thực hiện** | 1. Sync trên mạng chậm |
| **Kết quả mong đợi** | Sync hoàn thành (chậm hơn), hiển thị progress |
| **Kết quả test thực tế** | — |

### TC_GD_179: Intermittent network → partial upload handling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_179 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Network on/off ngẫu nhiên |
| **Các bước thực hiện** | 1. Sync khi network không ổn định |
| **Kết quả mong đợi** | Upload retry hoặc báo lỗi, không gây corrupt data |
| **Kết quả test thực tế** | — |

### TC_GD_180: Error state → manual retry success → clear error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_180 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync error đang hiển thị |
| **Các bước thực hiện** | 1. Fix network<br>2. Click Retry |
| **Kết quả mong đợi** | Retry success, error state cleared, hiển thị success |
| **Kết quả test thực tế** | — |

### TC_GD_181: CORS error handling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_181 |
| **Loại** | Negative |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | CORS misconfigured |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | Hiển thị lỗi rõ ràng (không phải lỗi generic) |
| **Kết quả test thực tế** | — |

### TC_GD_182: SSL certificate error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_182 |
| **Loại** | Negative |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | SSL issue |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | Hiển thị lỗi security rõ ràng |
| **Kết quả test thực tế** | — |

### TC_GD_183: API response empty body

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_183 |
| **Loại** | Negative |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API trả về 200 nhưng body rỗng |
| **Các bước thực hiện** | 1. Download |
| **Kết quả mong đợi** | Hiển thị lỗi 'Dữ liệu rỗng từ server' |
| **Kết quả test thực tế** | — |

### TC_GD_184: API response wrong content-type

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_184 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API trả HTML thay vì JSON |
| **Các bước thực hiện** | 1. Download |
| **Kết quả mong đợi** | Parse error được xử lý, hiển thị lỗi format |
| **Kết quả test thực tế** | — |

### TC_GD_185: Sync error logging trong Console

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_185 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bất kỳ sync error |
| **Các bước thực hiện** | 1. Kiểm tra Console tab |
| **Kết quả mong đợi** | Error được log chi tiết: URL, status, message |
| **Kết quả test thực tế** | — |

### TC_GD_186: Concurrent sync requests prevention

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_186 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Click Sync 2 lần nhanh |
| **Các bước thực hiện** | 1. Double-click Sync button |
| **Kết quả mong đợi** | Chỉ 1 request được gửi (button disabled sau click đầu) |
| **Kết quả test thực tế** | — |

### TC_GD_187: Error recovery: clear error state on success

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_187 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error state đang active |
| **Các bước thực hiện** | 1. Retry sync thành công |
| **Kết quả mong đợi** | Error state cleared, status chuyển về 'idle' hoặc 'synced' |
| **Kết quả test thực tế** | — |

### TC_GD_188: Error notification không chồng chéo

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_188 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Nhiều errors liên tiếp |
| **Các bước thực hiện** | 1. Gây ra 3 sync errors |
| **Kết quả mong đợi** | Notifications hiển thị tuần tự, không stack overflow UI |
| **Kết quả test thực tế** | — |

### TC_GD_189: Network status listener cleanup

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_189 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Component unmount |
| **Các bước thực hiện** | 1. Navigate away từ Settings<br>2. Kiểm tra memory |
| **Kết quả mong đợi** | Event listener cho network status được cleanup |
| **Kết quả test thực tế** | — |

### TC_GD_190: Error boundary not triggered by sync errors

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_190 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync error xảy ra |
| **Các bước thực hiện** | 1. Sync fail |
| **Kết quả mong đợi** | App vẫn chạy bình thường, ErrorBoundary không catch (vì đây là async error) |
| **Kết quả test thực tế** | — |

### Nhóm 8: Performance & Security (Hiệu suất & bảo mật) (TC_GD_191 – TC_GD_210)

### TC_GD_191: Sync time < 5s cho data bình thường

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_191 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Data ~100 items |
| **Các bước thực hiện** | 1. Sync<br>2. Đo thời gian |
| **Kết quả mong đợi** | Sync hoàn thành trong < 5s |
| **Kết quả test thực tế** | — |

### TC_GD_192: Sync time < 15s cho data lớn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_192 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Data ~1000 items |
| **Các bước thực hiện** | 1. Sync<br>2. Đo thời gian |
| **Kết quả mong đợi** | Sync hoàn thành trong < 15s |
| **Kết quả test thực tế** | — |

### TC_GD_193: Memory usage stable during sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_193 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Data bình thường |
| **Các bước thực hiện** | 1. Sync<br>2. Kiểm tra Memory tab |
| **Kết quả mong đợi** | Memory không tăng > 20MB trong quá trình sync |
| **Kết quả test thực tế** | — |

### TC_GD_194: Debounce timer cleanup khi unmount

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_194 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Auto-sync bật |
| **Các bước thực hiện** | 1. Navigate away từ page có auto-sync<br>2. Kiểm tra memory |
| **Kết quả mong đợi** | Timer được clearTimeout, không memory leak |
| **Kết quả test thực tế** | — |

### TC_GD_195: Sync không block UI thread

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_195 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sync đang chạy |
| **Các bước thực hiện** | 1. Thao tác UI trong lúc sync |
| **Kết quả mong đợi** | UI vẫn responsive, không bị freeze |
| **Kết quả test thực tế** | — |

### TC_GD_196: OAuth token secure storage (không localStorage)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_196 |
| **Loại** | Security |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User đã đăng nhập |
| **Các bước thực hiện** | 1. Kiểm tra localStorage, sessionStorage, cookies |
| **Kết quả mong đợi** | Token không lưu trong persistent storage (chỉ memory) |
| **Kết quả test thực tế** | — |

### TC_GD_197: Drive appDataFolder permission only

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_197 |
| **Loại** | Security |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Kiểm tra OAuth scopes |
| **Các bước thực hiện** | 1. Kiểm tra request authorization |
| **Kết quả mong đợi** | Chỉ scope drive.appdata, không có scope drive.file |
| **Kết quả test thực tế** | — |

### TC_GD_198: No extra Drive permissions requested

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_198 |
| **Loại** | Security |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | OAuth consent screen |
| **Các bước thực hiện** | 1. Kiểm tra quyền được yêu cầu |
| **Kết quả mong đợi** | Không yêu cầu quyền đọc file Drive của user |
| **Kết quả test thực tế** | — |

### TC_GD_199: Data encrypted in transit (HTTPS)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_199 |
| **Loại** | Security |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Sync đang chạy |
| **Các bước thực hiện** | 1. Kiểm tra protocol trong Network tab |
| **Kết quả mong đợi** | Tất cả requests dùng HTTPS |
| **Kết quả test thực tế** | — |

### TC_GD_200: Sign out xóa tất cả tokens

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_200 |
| **Loại** | Security |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | User click Sign Out |
| **Các bước thực hiện** | 1. Sign Out<br>2. Kiểm tra memory, storage |
| **Kết quả mong đợi** | Tất cả tokens bị xóa, không còn auth info trong memory |
| **Kết quả test thực tế** | — |

### TC_GD_201: Local data preserved sau sign out

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_201 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | User sign out |
| **Các bước thực hiện** | 1. Sign Out<br>2. Kiểm tra local data |
| **Kết quả mong đợi** | Local data (ingredients, dishes, plans) vẫn còn |
| **Kết quả test thực tế** | — |

### TC_GD_202: Sync background tab handling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_202 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App ở background tab |
| **Các bước thực hiện** | 1. Chuyển tab khác<br>2. Sync trigger |
| **Kết quả mong đợi** | Sync vẫn chạy trong background tab |
| **Kết quả test thực tế** | — |

### TC_GD_203: Sync khi app bị minimize

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_203 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App window minimize |
| **Các bước thực hiện** | 1. Minimize app<br>2. Auto-sync trigger |
| **Kết quả mong đợi** | Sync queue và chạy khi app resume |
| **Kết quả test thực tế** | — |

### TC_GD_204: Multiple browser tabs: chỉ 1 sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_204 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 2 tabs mở cùng app |
| **Các bước thực hiện** | 1. Cả 2 tab trigger sync |
| **Kết quả mong đợi** | Chỉ 1 sync request, tránh race condition |
| **Kết quả test thực tế** | — |

### TC_GD_205: Sync data version tracking

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_205 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Data structure thay đổi qua versions |
| **Các bước thực hiện** | 1. Upload v1.0 data<br>2. App update v2.0<br>3. Download |
| **Kết quả mong đợi** | Data migration xử lý đúng version mismatch |
| **Kết quả test thực tế** | — |

### TC_GD_206: Selective sync: chỉ sync ingredients (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_206 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Feature selective sync |
| **Các bước thực hiện** | 1. Chọn sync chỉ ingredients<br>2. Click Sync |
| **Kết quả mong đợi** | Chỉ ingredients được sync, dishes/plans không thay đổi |
| **Kết quả test thực tế** | — |

### TC_GD_207: Sync history/log viewer

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_207 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Đã sync nhiều lần |
| **Các bước thực hiện** | 1. Xem sync history |
| **Kết quả mong đợi** | Hiển thị danh sách: timestamp, status, data size cho mỗi lần sync |
| **Kết quả test thực tế** | — |

### TC_GD_208: Bandwidth optimization: chỉ sync diff

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_208 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Thay đổi nhỏ (1 ingredient) |
| **Các bước thực hiện** | 1. Sync |
| **Kết quả mong đợi** | Chỉ upload phần thay đổi (diff), không toàn bộ data |
| **Kết quả test thực tế** | — |

### TC_GD_209: Force sync button (ignore debounce)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_209 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Debounce đang chờ |
| **Các bước thực hiện** | 1. Click Force Sync |
| **Kết quả mong đợi** | Sync ngay lập tức, không chờ debounce |
| **Kết quả test thực tế** | — |

### TC_GD_210: Sync encryption at rest (Drive)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_GD_210 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Data đã upload lên Drive |
| **Các bước thực hiện** | 1. Kiểm tra file trên Drive |
| **Kết quả mong đợi** | File được encrypt bởi Google Drive at-rest encryption |
| **Kết quả test thực tế** | — |

---

## Đề xuất Cải tiến

### Đề xuất 1: Real-time Multi-Device Sync
- **Vấn đề hiện tại**: Sync is file-based (upload/download whole file). Not real-time.
- **Giải pháp đề xuất**: WebSocket or Firebase Realtime DB for instant sync. Change on phone → appears on tablet immediately.
- **Lý do chi tiết**: Users expect real-time like Google Docs. File-based sync has delay and conflict issues.
- **Phần trăm cải thiện**: Sync speed +90%, Conflict incidents -80%
- **Mức độ ưu tiên**: Medium | **Effort**: XL

### Đề xuất 2: Granular Conflict Resolution
- **Vấn đề hiện tại**: Conflict = newer wins. No merge option.
- **Giải pháp đề xuất**: Per-item conflict: "Phone added Dish A, Tablet added Dish B" → keep both. Visual diff.
- **Lý do chi tiết**: Newer-wins loses valid changes. Per-item merge preserves all work.
- **Phần trăm cải thiện**: Data loss from conflicts -90%, User trust +40%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 3: Sync History & Rollback
- **Vấn đề hiện tại**: No history. Sync error → data potentially corrupted.
- **Giải pháp đề xuất**: Keep last 10 sync snapshots on Drive. One-click rollback to any snapshot.
- **Lý do chi tiết**: Safety net for sync issues. Rollback prevents permanent data loss.
- **Phần trăm cải thiện**: Data safety +80%, Recovery speed +90%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Offline-First Architecture
- **Vấn đề hiện tại**: Sync assumes online. Offline changes queued but not guaranteed.
- **Giải pháp đề xuất**: CRDTs (Conflict-free Replicated Data Types) for guaranteed offline merge without conflicts.
- **Lý do chi tiết**: True offline-first = works always, syncs when possible. Best UX for mobile.
- **Phần trăm cải thiện**: Offline reliability +100%, Conflict elimination +90%
- **Mức độ ưu tiên**: Low | **Effort**: XL

### Đề xuất 5: Share Data with Family
- **Vấn đề hiện tại**: Sync is single-user. Can't share meal plans with family.
- **Giải pháp đề xuất**: Family sharing: invite family members. Shared meal plan. Individual ingredient preferences.
- **Lý do chi tiết**: 60% of meal planning is family activity. Sharing enables collaborative planning.
- **Phần trăm cải thiện**: Family adoption +60%, Household value +80%
- **Mức độ ưu tiên**: Medium | **Effort**: XL

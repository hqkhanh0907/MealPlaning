# Plan: testCaseRefinementV2

## Tổng quan

Phân tích và cập nhật lại test cases V2 dựa trên các yêu cầu mới về nghiệp vụ và UX. Bao gồm cả thay đổi code cho các tính năng chưa được hỗ trợ.

---

## Kết quả phân tích hiện trạng code

| # | Yêu cầu | Trạng thái | Chi tiết |
|---|---------|-----------|---------|
| 1 | Week view hiển thị 7 ngày, vuốt chuyển tuần | ❌ Chưa hỗ trợ | `getWeekDates()` render ±14 ngày (29 ngày) scroll liên tục. Cần refactor sang paginated 7-day view |
| 2 | ING unit mặc định trống | ❌ Chưa hỗ trợ | `handleOpenModal()` hardcode `unit: 'g'`. Cần đổi sang `unit: ''` |
| 3 | ING validation hiển thị đỏ dưới field | ❌ Chưa hỗ trợ | Chỉ dùng HTML5 `required`, không có inline error messages |
| 4 | ING AI button disabled khi thiếu tên/unit | ✅ Đã hỗ trợ | `disabled={!formData.name \|\| !formData.unit \|\| isSearchingAI}` |
| 5 | ING AI error message kèm tên nguyên liệu | ❌ Chưa hỗ trợ | Toast chỉ hiện message chung |
| 6 | ING search clear → hiện lại danh sách | ✅ Đã hỗ trợ | Filter dùng `includes(searchQuery)`, query rỗng → match tất cả |
| 7 | DSH search clear → hiện lại danh sách | ✅ Đã hỗ trợ | Tương tự IngredientManager |
| 8 | Camera Android xin quyền | ❌ Chưa đầy đủ | AndroidManifest thiếu `CAMERA` permission, chưa cài `@capacitor/camera` |

---

## Phase 1: Sửa code (4 tasks)

### Task 1.1: DateSelector — Refactor Week View thành 7-ngày/tuần + nút chuyển tuần

**File:** `src/components/DateSelector.tsx`

**Hiện trạng:**
- `getWeekDates()` tạo 29 ngày (±14 ngày quanh `selectedDate`), render tất cả trong scroll container
- Không có concept "tuần hiện tại", chỉ scroll liên tục

**Thay đổi:**
- Thêm state `weekOffset` (0 = tuần chứa selectedDate, -1 = tuần trước, +1 = tuần sau)
- Thay `getWeekDates()` bằng `getCurrentWeekDates(selectedDate, weekOffset)` — chỉ trả 7 ngày (T2→CN)
- Thêm nút `◀` / `▶` để chuyển tuần (hoặc hỗ trợ swipe gesture)
- Hiển thị label tuần (ví dụ: "24/02 - 02/03")
- Reset `weekOffset = 0` khi `selectedDate` thay đổi từ calendar view hoặc nút "Hôm nay"
- Hỗ trợ touch swipe trái/phải trên mobile để chuyển tuần

**Logic tính tuần:**
```
getMonday(date): Tìm thứ 2 của tuần chứa date
  - day = date.getDay()
  - diff = day === 0 ? -6 : 1 - day (CN tính về tuần trước)
  - return new Date(date + diff)

getCurrentWeekDates(selectedDate, offset):
  - monday = getMonday(selectedDate) + (offset * 7 days)
  - return [monday, tuesday, ..., sunday] (7 ngày)
```

### Task 1.2: IngredientManager — Unit mặc định trống + Inline validation

**File:** `src/components/IngredientManager.tsx`

**Thay đổi 1 — Unit mặc định trống:**
- `handleOpenModal()` khi tạo mới: đổi `unit: 'g'` → `unit: ''`
- Khi sửa: giữ nguyên `unit` từ dữ liệu hiện có

**Thay đổi 2 — Inline validation errors:**
- Thêm state `formErrors: { name?: string; unit?: string }`
- Khi submit (`handleSubmit`):
  - Nếu `!formData.name.trim()` → `formErrors.name = 'Vui lòng nhập tên nguyên liệu'`
  - Nếu `!formData.unit.trim()` → `formErrors.unit = 'Vui lòng nhập đơn vị tính'`
  - Nếu có errors → `return` (không submit)
- UI: Dưới mỗi input, thêm `<p>` đỏ khi có error:
  ```
  {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
  ```
- Input border đổi sang đỏ khi error: `border-rose-500` thay vì `border-slate-200`
- Clear error khi user nhập: `onChange` cũng clear `formErrors.name = undefined`

### Task 1.3: IngredientManager — AI error message kèm tên nguyên liệu

**File:** `src/components/IngredientManager.tsx`

**Thay đổi:**
- Timeout error:
  - Cũ: `notify.warning('Phản hồi quá lâu', 'Hệ thống phản hồi quá lâu. Vui lòng thử lại sau.')`
  - Mới: `notify.warning('Phản hồi quá lâu', '"${formData.name}" — Hệ thống phản hồi quá lâu. Vui lòng thử lại sau.')`
- Generic error:
  - Cũ: `notify.error('Tra cứu thất bại', 'Không thể tìm thấy thông tin nguyên liệu. Vui lòng thử lại.')`
  - Mới: `notify.error('Tra cứu thất bại', '"${formData.name}" — Không thể tìm thấy thông tin. Vui lòng thử lại.')`

### Task 1.4: Android Camera Permission

**File 1:** `android/app/src/main/AndroidManifest.xml`

**Thay đổi:**
- Thêm permission trước `<application>`:
  ```xml
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-feature android:name="android.hardware.camera" android:required="false" />
  ```
- `required="false"` vì camera là tính năng phụ, app vẫn dùng được nếu không có camera

**File 2:** `src/components/AIImageAnalyzer.tsx`

**Thay đổi `startCamera()`:**
- Cập nhật error message cụ thể hơn cho Android:
  ```
  setCameraError("Không thể truy cập camera. Trên Android, hãy vào Cài đặt > Ứng dụng > Smart Meal Planner > Quyền > bật Camera. Trên trình duyệt, kiểm tra biểu tượng ổ khóa trên thanh địa chỉ.");
  ```
- Thêm check `navigator.mediaDevices` tồn tại trước khi gọi (một số WebView cũ không hỗ trợ):
  ```typescript
  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraError("Thiết bị không hỗ trợ camera. Vui lòng sử dụng tính năng Tải ảnh lên.");
    return;
  }
  ```

---

## Phase 2: Cập nhật Test Cases Document

### Thay đổi cho Section B2 (DateSelector — Week Scroll Mode)

**Xóa:** CAL_W_01~04 (logic cũ 29 ngày scroll liên tục)

**Thêm mới:**

| # | ID | Tên | Mô tả | Edge Case |
|---|-----|------|-------|-----------|
| 37 | CAL_W_01 | Hiển thị đúng 7 ngày (T2→CN) | Week view chỉ hiện 7 ô ngày, bắt đầu từ thứ 2 kết thúc Chủ nhật | |
| 38 | CAL_W_02 | Ngày chọn nằm trong tuần hiện tại | selectedDate = 25/02 (T4) → tuần 24/02–02/03 hiển thị, ngày 25 highlight | |
| 39 | CAL_W_03 | Nút "▶" chuyển tuần tiếp theo | Click → weekOffset++ → hiển thị 7 ngày tuần sau | |
| 40 | CAL_W_04 | Nút "◀" chuyển tuần trước | Click → weekOffset-- → hiển thị 7 ngày tuần trước | |
| — | CAL_W_05 | Swipe trái → tuần sau (mobile) | Touch swipe left → chuyển tuần tiếp | |
| — | CAL_W_06 | Swipe phải → tuần trước (mobile) | Touch swipe right → chuyển tuần trước | |
| — | CAL_W_07 | Click ngày trong week view → chọn ngày | Tương tự calendar grid, Summary + MealCards cập nhật | |
| — | CAL_W_08 | Click ngày đang chọn → mở TypeSelection | `isSelected && onPlanClick` | |
| — | CAL_W_09 | Nút "Hôm nay" reset weekOffset | Click "Hôm nay" → weekOffset=0 + selectedDate=today | |
| — | CAL_W_10 | Meal indicator dots | 3 dots (amber/blue/indigo) hiển thị trên mỗi ngày có plan | |
| — | CAL_W_11 | Tuần qua ranh giới tháng | T2=27/01, CN=02/02 → hiển thị đúng ngày tháng khác nhau | Edge |
| — | CAL_W_12 | Tuần qua ranh giới năm | T2=29/12/2025, CN=04/01/2026 | Edge |
| — | CAL_W_13 | Label tuần | Hiển thị range "24/02 - 02/03" hoặc tương tự | |

### Thay đổi cho Section E1 (CRUD Nguyên liệu)

**Cập nhật ING_C_01:**
- Cũ: "unit mặc định 'g'"
- Mới: "unit mặc định trống (placeholder 'g, ml, cái, quả...')"

**Cập nhật ING_C_02:**
- Cũ: "Submit không nhập tên → HTML5 required block"
- Mới: "Submit không nhập tên → hiển thị text đỏ 'Vui lòng nhập tên nguyên liệu' dưới field, border đỏ"

**Thêm mới:**

| ID | Tên | Mô tả |
|----|------|-------|
| ING_C_02b | Validation unit trống | Submit khi unit trống → hiển thị đỏ "Vui lòng nhập đơn vị tính" dưới field unit |
| ING_C_02c | Clear error khi nhập | User bắt đầu nhập vào field đang lỗi → error message biến mất, border trở về bình thường |
| ING_C_02d | Nhiều field lỗi cùng lúc | Cả tên lẫn unit trống → cả 2 field đều hiện error đỏ |

**Cập nhật ING_C_05:**
- Bổ sung: "Button disabled khi chưa nhập tên HOẶC unit trống (vì unit mặc định giờ là trống)"

**Cập nhật ING_C_06:**
- Cũ: `notify.warning('Phản hồi quá lâu', '...')`
- Mới: `notify.warning('Phản hồi quá lâu', '"Tên NL" — Hệ thống phản hồi quá lâu...')`

**Cập nhật ING_C_07:**
- Cũ: `notify.error('Tra cứu thất bại', '...')`
- Mới: `notify.error('Tra cứu thất bại', '"Tên NL" — Không thể tìm thấy thông tin...')`

**Cập nhật ING_U_02:**
- Thêm bước: "3. Xóa nội dung ô tìm kiếm → danh sách tất cả nguyên liệu hiển thị lại đầy đủ"

### Thay đổi cho Section F1 (CRUD Món ăn)

**Thêm mới:**

| ID | Tên | Mô tả |
|----|------|-------|
| DSH_U_05b | Search clear → hiện lại danh sách | Nhập "xyz" → empty state → xóa ô search → danh sách đầy đủ hiện lại |

### Thay đổi cho Section H1 (Upload & Camera)

**Cập nhật AI_U_02:**
- Thêm: "Trên Android, app phải khai báo CAMERA permission trong AndroidManifest"

**Cập nhật AI_U_03:**
- Cũ: "Camera bị từ chối quyền → error message + nút Đóng camera"
- Mới: Cụ thể hóa theo platform:
  - Android: "Không thể truy cập camera. Trên Android, hãy vào Cài đặt > Ứng dụng > Smart Meal Planner > Quyền > bật Camera"
  - Trình duyệt: "Kiểm tra biểu tượng ổ khóa trên thanh địa chỉ"

**Thêm mới:**

| ID | Tên | Mô tả | Edge Case |
|----|------|-------|-----------|
| AI_U_07 | Thiết bị không hỗ trợ camera | `navigator.mediaDevices` undefined → hiển thị "Thiết bị không hỗ trợ camera. Vui lòng sử dụng Tải ảnh lên" | WebView cũ |
| AI_U_08 | Android CAMERA permission trong Manifest | `<uses-permission android:name="android.permission.CAMERA"/>` + `<uses-feature required="false"/>` | |

---

## Phase 3: Thứ tự thực hiện

| Bước | Task | Ưu tiên | Lý do |
|------|------|---------|-------|
| 1 | Task 1.2: ING unit trống + validation | Cao | Thay đổi nhỏ, ảnh hưởng UX trực tiếp |
| 2 | Task 1.3: ING AI error message | Cao | Thay đổi nhỏ, 2 dòng code |
| 3 | Task 1.4: Android camera permission | Trung bình | Thay đổi config, cần build lại APK để test |
| 4 | Task 1.1: DateSelector week view | Cao | Refactor lớn nhất, cần test kỹ |
| 5 | Phase 2: Cập nhật test-cases-v2.md | Sau code | Đồng bộ tài liệu với code mới |


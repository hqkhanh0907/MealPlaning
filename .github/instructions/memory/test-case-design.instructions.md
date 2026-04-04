# Kinh nghiệm viết Test Case & Thiết kế Test — MealPlaning

> Tổng hợp từ nhiều session test thực chiến. Đọc kỹ trước khi tạo test case mới.

---

## 1. Nguyên tắc thiết kế Test Case

### 1.1 Expected values PHẢI tính động theo ngày test

**SAI**: Hard-code expected values dựa trên age cố định
**ĐÚNG**: Tính age từ DOB và ngày test hiện tại

```python
from datetime import date
dob = date(1996, 5, 15)
today = date.today()
age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
# 2026-04-04 → age=29, KHÔNG PHẢI 30
```

**Tại sao**: Sai 1 tuổi → BMR sai 5kcal → TDEE sai ~8kcal → Target sai ~8kcal → TOÀN BỘ assertions fail.

### 1.2 Test case phải có đầy đủ 4 phần

```
TC_ID:         Mã duy nhất (vd: TC_I_01)
Pre-condition: Trạng thái ban đầu (vd: "User đã onboard, weight=75kg")
Steps:         Từng bước cụ thể (vd: "1. Mở Settings 2. Click Health Profile...")
Expected:      Kết quả mong đợi CÓ CON SỐ CỤ THỂ (vd: "BMR=1704, TDEE=2641")
```

**KHÔNG BAO GIỜ** viết expected mơ hồ kiểu "BMR hiển thị đúng" — phải có số.

### 1.3 Mỗi assertion phải tự kiểm chứng được

```
Input:    Male, 75kg, 175cm, DOB=1996-05-15, moderate, cut-mod
Công thức: BMR = 10×75 + 6.25×175 - 5×age + 5
          = 750 + 1093.75 - 5×29 + 5
          = 1703.75 → round → 1704
TDEE:     1704 × 1.55 = 2641.2 → 2641
Target:   2641 - 550 = 2091
```

**Ghi rõ công thức** trong test case để reviewer verify mà không cần đọc code.

---

## 2. Thiết kế Test Data — Input Profiles

### 2.1 Chọn giá trị test phải cover edge cases

| Profile                            | Mục đích test                                                |
| ---------------------------------- | ------------------------------------------------------------ |
| Male, 75kg, moderate, cut-mod      | Happy path chuẩn                                             |
| Female, 55kg, light, maintain      | Giới tính khác + offset=0                                    |
| Male, 90kg, active, bulk-cons      | High multiplier + positive offset                            |
| Female, 65kg, sedentary, cut-agg   | Lowest multiplier + largest negative offset → macro overflow |
| Male, 68kg, extra_active, bulk-agg | Max multiplier + max offset                                  |
| BMR override = 1800                | Bỏ qua Mifflin-St Jeor                                       |
| Body fat = 25%                     | Katsmeyer-Jackson formula thay Mifflin                       |
| Protein ratio = 2.5g/kg            | Non-default protein → thay đổi macro split                   |

### 2.2 Seed data phải thuộc lòng

**10 Ingredients (per 100g):**
i1:Ức gà(165/31/0/4), i2:Trứng(155/13/1/11), i3:Yến mạch(389/17/66/7),
i4:Sữa chua(59/10/4/0), i5:Khoai lang(86/2/20/0), i6:Bông cải(34/3/7/0),
i7:Thịt bò(250/26/0/15), i8:Gạo lứt(111/3/23/1), i9:Cá hồi(208/20/0/13),
i10:Hạt chia(486/17/42/31)

**5 Dishes (total per serving):**
d1:Yến mạch sữa chua(332cal,25g) — Breakfast
d2:Ức gà áp chảo(330cal,62g) — Lunch/Dinner
d3:Khoai lang luộc(129cal,3g) — Lunch/Dinner
d4:Bông cải luộc(51cal,5g) — Lunch/Dinner
d5:Trứng ốp la(155cal,13g) — Breakfast/Dinner

### 2.3 Tổ hợp meals phải tính trước

```
Breakfast: d5(155) + d1(332) = 487 kcal, 38g pro
Lunch:     d2(330) + d4(51) + d3(129) = 510 kcal, 70g pro
Dinner:    d2(330) = 330 kcal, 62g pro
Total:     487 + 510 + 330 = 1327 kcal, 170g pro
```

---

## 3. Bẫy khi viết CDP Test Script

### 3.1 Onboarding form vs Settings form — KHÁC NHAU HOÀN TOÀN

|        | Onboarding form                   | Settings Health Profile               |
| ------ | --------------------------------- | ------------------------------------- |
| Name   | `id="ob-name"`                    | `data-testid="hp-name"`               |
| DOB    | `id="ob-dob"`                     | `data-testid="hp-dob"`                |
| Height | `id="ob-height"` (number)         | `data-testid="hp-height"` (**text!**) |
| Weight | `id="ob-weight"` (number)         | `data-testid="hp-weight"` (**text!**) |
| Gender | Button text "Nam"/"Nữ"            | Radio `name="gender"`                 |
| Next   | `data-testid="health-basic-next"` | `settings-detail-save`                |

**Bẫy**: Tìm `input[type="number"]` trong Settings form → KHÔNG TÌM THẤY (dùng type="text").

### 3.2 Bypass onboarding ≠ có seed data

- `localStorage.setItem("app-onboarding-storage",...)` → skip onboarding UI
- NHƯNG seed data (10 ingredients, 5 dishes) được load qua `createSchema()` **khi DB init**
- Bypass chỉ skip UI, DB vẫn init bình thường → seed data VẪN CÓ
- CÒN health profile thì **KHÔNG CÓ** — vì user chưa nhập qua onboarding
- **Kết quả**: BMR=0, TDEE=0, Target=0 nếu bypass

**Quy tắc**: Muốn test nutrition → PHẢI chạy full onboarding HOẶC set health profile qua Settings.

### 3.3 Onboarding sub-steps rất dài và thay đổi

Onboarding flow hiện tại (7 sections, ~15 clicks tối thiểu):

```
1. Welcome: "Tiếp tục" × 2 → "Bắt đầu"
2. Health Basic: Gender → Name → DOB → Height → Weight → "health-basic-next"
3. Activity: Click card text → "Tiếp tục"
4. Goal: Click goal → (auto rate) → "Tiếp tục"
5. Confirm: Check BMR/TDEE → "Xác nhận"
6. Training: 6-8 sub-steps (goal/exp/days/duration/equipment/sleep...) → "Tiếp tục" hoặc "Bỏ qua"
7. Strategy: "strategy-auto" → 13s computing → Plan Preview → "onboarding-complete"
```

**Bẫy Plan Preview**: Button "Bắt đầu tập luyện →" hoặc testid `onboarding-complete`. PHẢI click xong mới thấy nav tabs. Nếu script kết thúc trước bước này → app stuck, không test được gì.

### 3.4 PHẢI test toàn bộ trong 1 session

Do in-memory SQLite:

- `pm clear` → mất hết (cả localStorage lẫn SQLite)
- `force-stop` + restart → mất SQLite (localStorage còn)
- **KHÔNG ĐƯỢC** restart giữa test suite

**Pattern chuẩn**:

```python
# 1. pm clear (fresh install)
# 2. Launch app
# 3. Full onboarding
# 4. Test Group B (onboarding)
# 5. Test Group D (ingredients) — dùng seed data từ onboarding
# 6. Test Group E (meals) — add meals
# 7. Test Group H (dashboard) — verify totals
# 8. Test Group I (settings) — change settings, verify propagation
# 9. Test Group L (cross-tab) — verify consistency
# TẤT CẢ TRONG 1 WEBSOCKET SESSION
```

### 3.5 Timing rất quan trọng

| Thao tác            | Wait (s) | Lý do                         |
| ------------------- | -------- | ----------------------------- |
| `am start`          | 5-6      | WebView init + JS bundle load |
| `forward tcp`       | 2        | Socket binding                |
| `Page.reload`       | 4        | Full reload + React hydration |
| Click nav tab       | 1        | State update + re-render      |
| Click quick action  | 0.3-0.5  | Optimistic update             |
| `btn-confirm-plan`  | 2        | DB persistence                |
| Strategy computing  | 13-14    | Animation + AI calculation    |
| After save settings | 1        | Store update + re-render      |

**Bẫy**: Quá nhanh → element chưa render → click "none" → test fail giả.
**Bẫy**: Quá chậm → lãng phí thời gian, test suite chạy 5+ phút.

---

## 4. Thiết kế Propagation Test (quan trọng nhất)

### 4.1 Chuỗi propagation

```
Health Profile (weight/height/age/activity)
    → BMR (Mifflin-St Jeor)
        → TDEE (BMR × multiplier)
            → Target (TDEE + goal offset)
                → Macros (Protein → Fat → Carbs)
                    → Dashboard mini display
                    → EnergyDetailSheet
                    → Calendar Nutrition tab
                    → Calendar Meals bar
                    → Fitness bridge
```

### 4.2 Test propagation pattern

1. **Baseline**: Verify giá trị ban đầu ở TẤT CẢ locations
2. **Change 1 input**: Thay đổi 1 biến (vd: weight 75→80)
3. **Verify toàn chuỗi**: Check BMR→TDEE→Target→Macros ở mọi nơi
4. **Revert**: Đưa về giá trị ban đầu
5. **Verify revert**: Đảm bảo giá trị khớp với baseline

### 4.3 PHẢI test cả 3 loại thay đổi

| Loại          | Ví dụ               | Ảnh hưởng                                        |
| ------------- | ------------------- | ------------------------------------------------ |
| Health change | Weight 75→80        | BMR→TDEE→Target→Macros ALL thay đổi              |
| Goal change   | Cut→Maintain        | Chỉ Target→Macros thay đổi (BMR/TDEE giữ nguyên) |
| Rate change   | Moderate→Aggressive | Chỉ offset→Target→Macros thay đổi                |

---

## 5. Sai lầm đã mắc — Lessons Learned

### 5.1 Hard-code age=30 thay vì tính dynamic

**Triệu chứng**: Tất cả nutrition assertions fail (BMR expect 1699, actual 1704)
**Nguyên nhân**: DOB=1996-05-15, test date=2026-04-04 → age=29 (chưa qua sinh nhật)
**Fix**: Luôn tính age từ DOB + test date
**Thời gian mất**: 2 vòng test (~30 phút)

### 5.2 Tìm weight input bằng type="number"

**Triệu chứng**: `weight-not-found`, settings không thay đổi
**Nguyên nhân**: Settings form dùng `type="text"` cho số (không phải `type="number"`)
**Fix**: Dùng `data-testid="hp-weight"` thay vì `input[type="number"]`
**Thời gian mất**: 1 vòng debug (~15 phút)

### 5.3 Restart app giữa test suite

**Triệu chứng**: Dashboard eaten=0, health profile trống, BMR=0
**Nguyên nhân**: sql.js in-memory, force-stop mất hết SQLite data
**Fix**: KHÔNG restart, test tất cả trong 1 session
**Thời gian mất**: 1 vòng test (~20 phút) + thời gian investigate architecture

### 5.4 Onboarding không hoàn tất (stuck ở Plan Preview)

**Triệu chứng**: App hiện Plan Preview, không có nav tabs, tất cả test fail
**Nguyên nhân**: Script chạy loop click `onboarding-complete` quá sớm (trong computing animation), button chưa render
**Fix**: Wait 13-14s cho computing animation xong, rồi mới click
**Thời gian mất**: 2 lần retry (~25 phút)

### 5.5 Bypass onboarding nhưng expect có health data

**Triệu chứng**: BMR=0, TDEE=0, Target=0 dù seed data có
**Nguyên nhân**: Bypass localStorage chỉ skip UI, health profile chưa nhập
**Fix**: Hoặc full onboarding, hoặc phải set health profile qua Settings sau khi bypass
**Thời gian mất**: 1 vòng debug (~15 phút)

---

## 6. Template Python Test Script chuẩn

```python
import json, asyncio, websockets, urllib.request, base64, subprocess, time, os
from datetime import date

env = {**os.environ, "PATH": os.environ.get("PATH","") + ":/path/to/sdk/platform-tools"}
RESULTS = []

def calc_expected(weight, height, dob_str, gender, activity, goal, rate):
    """Tính expected values động theo ngày hiện tại"""
    dob = date.fromisoformat(dob_str)
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    s = 5 if gender == "male" else -161
    bmr = round(10 * weight + 6.25 * height - 5 * age + s)
    multipliers = {"sedentary":1.2,"light":1.375,"moderate":1.55,"active":1.725,"extra_active":1.9}
    tdee = round(bmr * multipliers[activity])
    offsets = {"cut":{"conservative":-275,"moderate":-550,"aggressive":-1100},
               "maintain":{"moderate":0},"bulk":{"conservative":275,"moderate":550,"aggressive":1100}}
    offset = offsets.get(goal, {}).get(rate, 0)
    target = tdee + offset
    return {"bmr": bmr, "tdee": tdee, "target": target, "age": age}

# Dùng: exp = calc_expected(75, 175, "1996-05-15", "male", "moderate", "cut", "moderate")
# → {"bmr": 1704, "tdee": 2641, "target": 2091, "age": 29}
```

---

## 7. Checklist trước khi chạy Test Suite

- [ ] Emulator đang chạy (`adb devices`)
- [ ] APK debug đã install (KHÔNG dùng release)
- [ ] `pm clear` trước khi bắt đầu (fresh state)
- [ ] Expected values tính đúng với ngày hôm nay
- [ ] Script có đủ wait times (đặc biệt onboarding computing 13s)
- [ ] Script KHÔNG restart app giữa chừng
- [ ] Screenshot được lưu cho mỗi bước quan trọng
- [ ] Tất cả testids đã verify bằng `document.querySelector` trước khi dùng

# GitHub Copilot Instructions — MealPlaning Project

## 🚨 QUY TẮC BẮT BUỘC #1: TUÂN THỦ SPEC 100% (Spec Compliance)

### Bài học từ lỗi thực tế (2026-06-28):

AI đã vi phạm spec khi implement Fitness Tab:
- Spec ghi 3 sub-tabs (Plan/Progress/History) → AI tự ý thêm tab thứ 4 ("Buổi tập")
- Spec ghi WorkoutLogger mở qua pushPage() (full-screen) → AI render inline trong sub-tab
- Spec ghi QuickConfirmCard thuộc về bên trong WorkoutLogger → AI đặt trên Plan sub-tab
- Kết quả: User bị trap trong WorkoutLogger, không navigate được, UX hỏng hoàn toàn

### Quy tắc KHÔNG ĐƯỢC vi phạm:

1. **KHÔNG tự ý thêm tính năng ngoài spec.** Nếu spec không mô tả → KHÔNG implement. Nếu nghĩ cần thêm → HỎI user trước.

2. **KHÔNG thay đổi kiến trúc navigation so với spec.** Spec định nghĩa bao nhiêu tabs, sub-tabs, full-screen pages → implement ĐÚNG số lượng và cấu trúc đó. Không được thêm/bớt/đổi chỗ.

3. **KHÔNG di chuyển component sang vị trí khác so với spec.** Nếu spec nói component X thuộc về page Y → đặt ở page Y, KHÔNG đặt ở page Z dù cảm thấy "tiện hơn".

4. **LUÔN cross-check với spec trước khi commit.** Trước khi hoàn thành 1 task, đọc lại phần spec tương ứng và so sánh:
   - Số lượng tabs/sub-tabs có đúng không?
   - Navigation flow có đúng không? (pushPage vs inline render)
   - Vị trí đặt component có đúng không?
   - Empty states có đúng spec §5.5.1 không?

5. **Nếu spec mâu thuẫn hoặc thiếu → HỎI USER.** Không tự ý đoán hoặc "sáng tạo" giải pháp.

### Checklist trước mỗi commit (Spec Compliance):

```
□ Đã đọc lại phần spec liên quan
□ Số lượng tabs/sub-tabs/pages khớp với spec
□ Navigation flow (pushPage vs inline) khớp với spec
□ Vị trí component khớp với spec
□ Empty states khớp với spec §5.5.1
□ Không thêm tính năng nào ngoài spec
□ Nếu có thay đổi so với spec → đã hỏi và được user chấp thuận
```

---

## 📁 Specs Location

Tất cả spec files nằm tại: `docs/superpowers/specs/`

Khi implement bất kỳ feature nào, BẮT BUỘC phải:
1. Tìm và đọc spec tương ứng trong `docs/superpowers/specs/`
2. Xác định đúng section liên quan (ví dụ: §5.1 Navigation Architecture)
3. Implement đúng 100% theo mô tả trong spec
4. Cross-check lại trước khi commit

---

## 🔧 Quality Gates

Mỗi lần thay đổi code PHẢI qua đủ các bước:

1. **ESLint** — 0 errors, KHÔNG dùng eslint-disable
2. **Unit Tests** — 0 new failures, coverage không giảm
3. **Build** — `npm run build` pass
4. **Manual Test** — Verify trên emulator/browser
5. **Spec Check** — Cross-check với spec document

---

## 📐 Architecture Rules

- Tab navigation: `useNavigationStore` (Zustand)
- Full-screen pages: Mở qua `pushPage()`, KHÔNG render inline
- Bottom sheets: Mở qua component mounting, KHÔNG thay thế page
- Sub-tabs: Render content inline trong tab panel
- State: Zustand stores + SQLite persistence
- i18n: Vietnamese translations trong `src/locales/vi.json`
- Styling: Tailwind CSS v4 + shadcn/ui components

---

## 🏗️ Project Structure

```
src/
├── components/     # Reusable UI components
├── features/       # Feature-based modules (fitness, health-profile, etc.)
├── hooks/          # Custom React hooks
├── store/          # Zustand global stores
├── locales/        # i18n translation files
├── services/       # Database and API services
├── __tests__/      # Test files
└── App.tsx         # Root component with tab navigation
```

---

## 🧪 Testing Standards

- Framework: Vitest + React Testing Library
- Coverage target: 100% cho code mới
- Test file location: `src/__tests__/` hoặc cùng thư mục với component
- Mock pattern: Mock stores và services, test behavior
- KHÔNG dùng `eslint-disable` trong test files

---

## 🌐 i18n — QUY TẮC BẮT BUỘC (Bài học từ lỗi thực tế 2026-03-29)

### Bài học:
AI đã tạo component sử dụng `t('dashboard.hero.scoreLabel.excellent')`, `t('health.activityLevel.sedentary')`, `t('common.sodium')` v.v. nhưng **KHÔNG thêm key tương ứng vào `src/locales/vi.json`**, khiến UI hiển thị raw key thay vì text tiếng Việt — bug nghiêm trọng.

### Quy tắc KHÔNG ĐƯỢC vi phạm:

1. **MỌI lần dùng `t('key')` trong code, BẮT BUỘC phải đồng thời thêm key vào `src/locales/vi.json`.**
   - Không bao giờ commit code có `t('some.key')` mà key đó chưa tồn tại trong vi.json.

2. **Kiểm tra CẢ dynamic keys** — các pattern `t(\`namespace.${variable}\`)`:
   - Liệt kê TẤT CẢ giá trị có thể có của `variable` (từ enum, const array, type union).
   - Đảm bảo MỖI giá trị đều có key tương ứng trong vi.json.
   - Ví dụ: `t(\`fitness.onboarding.${goal}\`)` với `goal: 'strength' | 'hypertrophy' | 'endurance' | 'general'` → cần 4 keys.

3. **Kiểm tra pluralization**: i18next dùng `_zero`, `_one`, `_other` suffix.
   - `t('key', { count: N })` cần `key_zero`, `key_one`, `key_other` (KHÔNG cần `key` gốc).

4. **Pre-commit checklist i18n:**
   ```
   □ Mọi t('key') mới đều có trong vi.json
   □ Mọi t(`dynamic.${var}`) đã cover hết enum values
   □ JSON hợp lệ (chạy: python3 -c "import json; json.load(open('src/locales/vi.json'))")
   □ Không có raw i18n key hiển thị trên UI
   ```

5. **Script kiểm tra nhanh** (chạy trước mỗi commit có thay đổi i18n):
   ```bash
   python3 -c "
   import json,re,glob
   vi=json.load(open('src/locales/vi.json'))
   def kx(d,p):
     for k in p.split('.'):
       if isinstance(d,dict) and k in d: d=d[k]
       else: return False
     return True
   missing=0
   for f in glob.glob('src/**/*.tsx',recursive=True)+glob.glob('src/**/*.ts',recursive=True):
     if '__tests__' in f or '.test.' in f: continue
     c=open(f).read()
     for m in re.findall(r\"t\(['\"]([^'\"]+)['\"]\",c):
       if not kx(vi,m) and not kx(vi,m+'_one') and not kx(vi,m+'_other'):
         print(f'❌ {f}: {m}'); missing+=1
   print(f'Missing: {missing}')
   "
   ```

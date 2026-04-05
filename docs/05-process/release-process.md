# Release Process — Smart Meal Planner

**Version:** 4.3  
**Date:** 2026-07-20

---

## 1. Quy trình tổng quan

```
Code changes
     │
     ▼
[1] TypeScript check (npx tsc --noEmit)
     │ ✅ 0 errors
     ▼
[2] Run linter (npx eslint src/)
     │ ✅ 0 errors (react-refresh warnings acceptable)
     ▼
[3] Run unit tests (npm test)
     │ ✅ 4661/4661 (184 files)
     ▼
[4] Run coverage check (npm run test:coverage)
     │ ✅ ≥98% Stmts
     ▼
[4.1] SonarQube scan (npm run sonar)
     │ ✅ 0 Bugs, 0 Vulnerabilities
     ▼
[5] Build web assets (npm run build)
     │ ✅ dist/ generated
     ▼
[6] Sync to Android (npx cap sync android)
     │ ✅ web assets in android/
     ▼
[7] Build APK (bash scripts/build-apk.sh)
     │ ✅ app-debug.apk generated
     ▼
[8] Chrome DevTools console check
     │ ✅ 0 errors, 0 warnings
     ▼
[9] Manual testing on mobile viewport (393×851)
     │ ✅ Critical flows verified
     ▼
[10] Run E2E tests (CI workflow_dispatch)
     │ ✅ 24/24 specs (183 test cases)
     ▼
[11] Run E2E deep integration (specs 23-24)
     │ ✅ Cross-feature cascade + cross-tab consistency
     ▼
[12] Git commit + tag
     │
     ▼
[13] Upload APK to Google Drive (optional)
```

---

## 2. Pre-release Checklist

Trước mỗi release, kiểm tra tất cả items:

```
□ npx tsc --noEmit      → 0 errors (TypeScript type-check)
□ npx eslint src/       → 0 errors (warnings from react-refresh are pre-existing and acceptable)
□ npm test              → 100% pass, 0 failures (currently 4661 tests, 184 files)
□ npm run test:coverage → statement coverage ≥98%
□ npm run sonar        → 0 Bugs, 0 Vulnerabilities (SonarQube mandatory)
□ No eslint-disable     → grep -r "eslint-disable" src/ phải trả về 0 kết quả
□ npm run build         → build thành công, không warnings
□ npx cap sync android  → sync OK
□ bash scripts/build-apk.sh     → APK tạo được (≈147MB)
□ npm run test:e2e      → 24/24 specs pass (183 test cases)
□ E2E deep integration → specs 23-24 pass (cascade + cross-tab)
□ adb install APK       → cài thành công trên emulator
□ Chrome DevTools Console → 0 errors, 0 warnings
□ Manual testing on mobile viewport (393×851) for critical flows:
  □ App mở được
  □ Tab navigation OK
  □ Thêm/sửa nguyên liệu OK
  □ Lên kế hoạch bữa ăn OK
  □ AI tab hiển thị OK
  □ Fitness tab hiển thị OK
  □ Favicon hiển thị đúng
  □ Safe areas hiển thị đúng (notch, home indicator)
□ git commit + push
```

### ⛔ Quality Gates (Mandatory — Bắt buộc trước mọi release)

Các quality gates sau **bắt buộc** pass trước khi merge hoặc release:

| #   | Gate          | Lệnh                                     | Tiêu chí                                         |
| --- | ------------- | ---------------------------------------- | ------------------------------------------------ |
| 1   | TypeScript    | `npx tsc --noEmit`                       | 0 errors                                         |
| 2   | ESLint        | `npx eslint src/`                        | 0 errors (react-refresh warnings acceptable)     |
| 3   | Unit Tests    | `npm test`                               | All 4661 tests pass (184 files)                  |
| 4   | Coverage      | `npm run test:coverage`                  | Statement coverage ≥98%                          |
| 5   | **SonarQube** | `npm run test:coverage && npm run sonar` | **0 Bugs, 0 Vulnerabilities, 0 Code Smells mới** |
| 6   | DevTools      | Chrome DevTools Console                  | 0 errors, 0 warnings                             |
| 7   | Mobile        | Manual test 393×851 viewport             | Critical flows pass                              |
| 8   | Store Persist | Verify all store actions persist SQLite  | Every state mutation has matching DB write       |

### ⛔ Chính sách No eslint-disable

**Tuyệt đối không sử dụng** `eslint-disable`, `eslint-disable-next-line`, hoặc `eslint-disable-line` trong thư mục `src/`. Mọi lỗi lint phải được sửa triệt để tại nguồn thay vì bị suppress.

- Nếu một rule gây false positive cho toàn bộ project → điều chỉnh rule trong `eslint.config.js` thông qua PR review
- Không chấp nhận PR nào chứa eslint-disable trong `src/`
- File test (`e2e/`) được phép sử dụng eslint-disable cho type casting khi cần thiết

### 🔍 SonarQube Integration (Mandatory)

SonarQube analysis **bắt buộc** trước mỗi release:

- Config: `sonar-project.properties` tại root project
- Script: `bash scripts/sonar-setup.sh`
- **Chạy analysis: TRƯỚC MỌI release** (không chỉ sau mỗi sprint)
- Quality Profile: Default + custom rules cho TypeScript/React
- **Gate: Phải pass SonarQube quality gate (0 new Bugs, 0 Vulnerabilities) trước khi release**
- Quy trình: `npm run test:coverage` → `npm run sonar` → kiểm tra dashboard `http://localhost:9000`

```bash
# Pipeline bắt buộc trước release
npm run test:coverage && npm run sonar

# Kiểm tra kết quả
curl -sf -u "$SONAR_TOKEN:" \
  "http://localhost:9000/api/issues/search?componentKeys=meal-planing&resolved=false&types=BUG,VULNERABILITY" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Issues: {d[\"total\"]}')"
# Phải trả về: Issues: 0
```

---

## 3. Build APK

### Nội dung `build-apk.sh`

```bash
#!/bin/bash
set -e

# 1. Build web
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Gradle build
cd android
./gradlew assembleDebug

echo "✅ APK: android/app/build/outputs/apk/debug/app-debug.apk"
```

### Chạy build

```bash
bash scripts/build-apk.sh
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk` (~147MB)

---

## 4. Versioning

### Version format: `MAJOR.MINOR.PATCH`

| Component | Khi nào tăng                                                            |
| --------- | ----------------------------------------------------------------------- |
| MAJOR     | Breaking change lớn (thay đổi storage schema không backward compatible) |
| MINOR     | Feature mới                                                             |
| PATCH     | Bug fix                                                                 |

### Cập nhật version

Trong `package.json`:

```json
{
  "version": "1.1.0"
}
```

Trong `android/app/build.gradle`:

```groovy
versionCode 2          // Tăng 1 mỗi release lên Google Play
versionName "1.1.0"    // Phải khớp package.json
```

### Git tag

```bash
git tag -a v1.1.0 -m "Release v1.1.0: AI meal suggestion preview"
git push origin v1.1.0
```

---

## 5. Commit Convention

Theo [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: thêm tính năng X
fix: sửa lỗi Y
docs: cập nhật tài liệu Z
test: thêm tests cho W
refactor: refactor module V
chore: cập nhật dependencies
```

### Ví dụ commit message

```
feat: add AI meal suggestion preview modal

- Thêm AISuggestionPreviewModal với 7 ngày thực đơn
- Cho phép edit từng bữa trước khi áp dụng
- Hiển thị tổng calo/protein cho tuần

Closes #42
```

---

## 6. Changelog

Cập nhật `CHANGELOG.md` hoặc tạo file session mới trong `docs/`:

```markdown
# CHANGELOG v1.1.0 — 2026-03-06

## Added

- AI meal suggestion preview modal #42
- Copy day feature in Calendar #38

## Fixed

- Scroll lock regression on modal close #35
- IngredientEditModal auto-focus on Android #36

## Tests

- Unit: 1201/1201 pass
- E2E: 24/24 pass (183 test cases, including deep integration)
- Coverage: 99.46% Stmts, 99.41% Funcs, 100% Lines, 92.51% Branch
```

---

## 7. Phân phối APK

### Phương pháp 1: Cài trực tiếp qua ADB

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Phương pháp 2: Upload APK lên Google Drive (tự động)

Script tự động upload APK lên Google Drive:

```bash
bash scripts/upload-apk-drive.sh
```

Script sử dụng Google Drive API với service account. File config: `metadata.json`

#### Setup Google Drive API

1. Tạo service account trong Google Cloud Console
2. Share folder Drive với email service account
3. Đặt credentials file path trong script

### Phương pháp 3: Google Drive thủ công

```bash
# Copy APK lên Google Drive (cần rclone hoặc Google Drive Desktop)
cp android/app/build/outputs/apk/debug/app-debug.apk \
   ~/Google\ Drive/MealPlaner-APKs/MealPlaner-v1.1.0.apk
```

### Phương pháp 4: Chia sẻ qua Android Share (trong app)

Dùng tính năng Export trong app để share file JSON backup.

---

## 8. Hotfix Process

Khi có bug nghiêm trọng sau release:

```
1. Tạo branch: git checkout -b fix/critical-bug-description
2. Fix bug
3. Viết test case reproduce bug
4. npm run test → pass
5. npm run test:e2e (hoặc targeted spec)
6. npx eslint src/ → 0 errors (no eslint-disable allowed)
7. npx tsc --noEmit → 0 errors
7. Bump PATCH version
8. git commit "fix: description of fix"
9. Merge vào main
10. Tag: git tag v1.0.1
11. Build APK và distribute
```

---

## Tài liệu liên quan

- [Deployment Guide](../06-operations/deployment.md) — Hướng dẫn triển khai chi tiết
- [Coding Guidelines](../03-developer-guide/coding-guidelines.md) — Quy tắc code và testing

---

## 9. CEO Audit — Quy trình kiểm tra chất lượng định kỳ

> **Phát sinh từ CEO Audit Q3/2026** — phát hiện 4 bugs (form validation, JSON resilience, i18n, logging) mà unit tests và linting không bắt được.

### 9.1 Tần suất

- **Hàng quý** (Q1/Q2/Q3/Q4) — hoặc sau mỗi milestone lớn (thêm module mới, refactor lớn)
- **Khoảng thời gian:** 1-2 ngày cho mỗi audit cycle

### 9.2 Phạm vi kiểm tra

| #   | Hạng mục                   | Mô tả                                                                                                      |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Form Validation Audit**  | Kiểm tra tất cả multi-step forms: `form.trigger()` có truyền field list? Cross-field validation hoạt động? |
| 2   | **Data Resilience Audit**  | Kiểm tra tất cả `JSON.parse` trong stores: có safe wrapper? Fallback values hợp lý?                        |
| 3   | **i18n Completeness**      | `grep` tìm hardcoded Vietnamese strings trong `src/components/` — phải trả về 0 kết quả                    |
| 4   | **Logging Standards**      | Kiểm tra `console.error`/`console.warn` trong stores — phải dùng structured `logger.*`                     |
| 5   | **useEffect Dependencies** | Kiểm tra useEffect thiếu/không có deps — phải có comment giải thích hoặc fix                               |
| 6   | **SonarQube Scan**         | Full scan — 0 Bugs, 0 Vulnerabilities, Code Smells dưới ngưỡng                                             |

### 9.3 Output

- **Audit Report**: Danh sách findings (severity P0-P3), root cause, proposed fix
- **Coding Guidelines Update**: Thêm rule mới vào `coding-guidelines.md` nếu phát hiện pattern bug mới
- **PRD Update**: Cập nhật NFR nếu phát hiện yêu cầu phi chức năng bị thiếu

### 9.4 Blocking Rule

- **P0/P1 findings từ CEO Audit phải được fix TRƯỚC release tiếp theo** — không được defer
- Findings được track trong `docs/bug-reports/` với prefix `AUD-`
- Mỗi fix phải kèm regression test

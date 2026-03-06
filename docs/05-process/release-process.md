# Release Process — Smart Meal Planner

**Version:** 2.0  
**Date:** 2026-03-06

---

## 1. Quy trình tổng quan

```
Code changes
     │
     ▼
[1] Run unit tests (npm run test)
     │ ✅ 863/863
     ▼
[2] Run linter (npm run lint)
     │ ✅ no errors, no warnings
     ▼
[3] Run coverage check (npm run test:coverage)
     │ ✅ 100% Stmts/Funcs/Lines
     ▼
[4] Build web assets (npm run build)
     │ ✅ dist/ generated
     ▼
[5] Sync to Android (npx cap sync android)
     │ ✅ web assets in android/
     ▼
[6] Build APK (bash build-apk.sh)
     │ ✅ app-debug.apk generated
     ▼
[7] Run E2E tests (npm run test:e2e)
     │ ✅ 10/10 specs (37 test cases)
     ▼
[8] Git commit + tag
     │
     ▼
[9] Upload APK to Google Drive (optional)
```

---

## 2. Pre-release Checklist

Trước mỗi release, kiểm tra tất cả items:

```
□ npm run test          → 863/863 pass
□ npm run lint          → 0 errors, 0 warnings
□ npm run test:coverage → 100% Stmts/Funcs/Lines, ≥93% Branch
□ npm run build         → build thành công, không warnings
□ npx cap sync android  → sync OK
□ bash build-apk.sh     → APK tạo được (≈147MB)
□ npm run test:e2e      → 10/10 specs pass (37 test cases)
□ adb install APK       → cài thành công trên emulator
□ DevTools Console      → 0 errors, 0 warnings
□ Smoke test manual:
  □ App mở được
  □ Tab navigation OK
  □ Thêm/sửa nguyên liệu OK
  □ Lên kế hoạch bữa ăn OK
  □ AI tab hiển thị OK
  □ Favicon hiển thị đúng
□ git commit + push
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
bash build-apk.sh
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk` (~147MB)

---

## 4. Versioning

### Version format: `MAJOR.MINOR.PATCH`

| Component | Khi nào tăng |
|-----------|-------------|
| MAJOR | Breaking change lớn (thay đổi storage schema không backward compatible) |
| MINOR | Feature mới |
| PATCH | Bug fix |

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
- Unit: 863/863 pass
- E2E: 10/10 pass (37 test cases)
- Coverage: 100% Stmts/Funcs/Lines, 93.99% Branch
```

---

## 7. Phân phối APK

### Phương pháp 1: Cài trực tiếp qua ADB

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Phương pháp 2: Google Drive upload

```bash
# Copy APK lên Google Drive (cần rclone hoặc Google Drive Desktop)
cp android/app/build/outputs/apk/debug/app-debug.apk \
   ~/Google\ Drive/MealPlaner-APKs/MealPlaner-v1.1.0.apk
```

### Phương pháp 3: Chia sẻ qua Android Share (trong app)

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
6. Bump PATCH version
7. git commit "fix: description of fix"
8. Merge vào main
9. Tag: git tag v1.0.1
10. Build APK và distribute
```

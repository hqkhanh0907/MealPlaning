# Changelog — Session 05/03/2026

> Dự án: **High Protein Meal Planner**  
> Khoảng thời gian: 05/03/2026 (session làm việc)  
> Commits: `156ab9c` → `2e459a7`  
> Tổng số test sau session: **663/663 passing** (tăng +14 so với đầu session)

---

## Mục lục

1. [BUG-002 — Snap-back tên nguyên liệu](#1-bug-002--snap-back-tên-nguyên-liệu)
2. [FEAT — Ngôn ngữ mặc định VI + Light theme khi cài lần đầu](#2-feat--ngôn-ngữ-mặc-định-vi--light-theme-khi-cài-lần-đầu)
3. [FIX — Desync theme giữa Settings tab và nút header](#3-fix--desync-theme-giữa-settings-tab-và-nút-header)
4. [FIX — geminiService: 12 cải tiến độ bền, hiệu suất, bảo mật](#4-fix--geminiservice-12-cải-tiến-độ-bền-hiệu-suất-bảo-mật)
5. [Tổng kết số liệu](#5-tổng-kết-số-liệu)

---

## 1. BUG-002 — Snap-back tên nguyên liệu

**Commit:** `156ab9c`  
**Loại:** `test` + `fix`  
**File thay đổi:**

- `src/components/modals/IngredientEditModal.tsx`
- `src/__tests__/ingredientEditModal.test.tsx`

### Mô tả lỗi

Khi người dùng xoá hết nội dung trong ô nhập tên nguyên liệu, giá trị bị "nhảy lại" (snap-back) về tên từ ngôn ngữ kia (VI/EN fallback), thay vì giữ nguyên trống.

**Root cause:** Logic `onChange` đang đọc giá trị từ `localizedString` khi input rỗng, gây ra fallback không mong muốn.

### Fix

Sửa `IngredientEditModal.tsx` để input rỗng không trigger fallback:

- Khi field trống → lưu chuỗi rỗng, không lấy giá trị ngôn ngữ khác.
- Khi xoá từng ký tự → trạng thái không bị ghi đè.

### Regression Tests (+2)

| Test                                 | Mô tả                                                 |
| ------------------------------------ | ----------------------------------------------------- |
| `clearing name stays empty`          | Xoá hết tên → field giữ nguyên trống, không snap-back |
| `can delete char-by-char and retype` | Xoá từng ký tự rồi nhập lại → hoạt động bình thường   |

---

## 2. FEAT — Ngôn ngữ mặc định VI + Light theme khi cài lần đầu

**Commit:** `93c0c95`  
**Loại:** `feat`  
**File thay đổi:**

- `src/i18n.ts`
- `src/hooks/useDarkMode.ts`
- `src/App.tsx`
- `src/__tests__/useDarkMode.test.ts`

### Thay đổi

#### `src/i18n.ts`

```ts
// Trước:
lng: 'en';

// Sau:
lng: 'vi';
```

Ứng dụng khởi động lần đầu sẽ dùng tiếng Việt mặc định (thay vì tiếng Anh).

#### `src/hooks/useDarkMode.ts`

```ts
// Trước: không rõ default
// Sau:
const getInitial = () => {
  const saved = localStorage.getItem('theme');
  return saved ? saved === 'dark' : false; // light theme là mặc định nếu chưa có lưu
};
```

Lần cài đặt đầu tiên (chưa có `localStorage`) → light theme.

#### `src/App.tsx` — Nút theme được tô màu theo trạng thái hiện tại

Nút chuyển dark/light mode trên header được styling có trạng thái (active color) thay vì luôn cùng một màu.

---

## 3. FIX — Desync theme giữa Settings tab và nút header

**Commit:** `bc16be3`  
**Loại:** `fix`  
**File thay đổi:**

- `src/App.tsx`
- `src/components/SettingsTab.tsx`
- `src/__tests__/settingsTab.test.tsx`

### Root Cause

`App.tsx` và `SettingsTab.tsx` mỗi nơi gọi `useDarkMode()` độc lập → 2 instance React state riêng biệt → thay đổi ở Settings không phản ánh lên nút header và ngược lại.

### Fix

**Lift state lên `App.tsx` làm Single Source of Truth:**

```tsx
// App.tsx — quản lý theme tập trung
const { isDark, setTheme } = useDarkMode();

// Truyền xuống SettingsTab qua props
<SettingsTab isDark={isDark} onThemeChange={setTheme} />;
```

`SettingsTab.tsx` **không còn gọi `useDarkMode()` nữa** — nhận `isDark` và `onThemeChange` qua props.

Kết quả: Nút header và nút trong Settings luôn đồng bộ.

---

## 4. FIX — geminiService: 12 cải tiến độ bền, hiệu suất, bảo mật

**Commit:** `2e459a7`  
**Loại:** `fix`  
**File thay đổi:**

- `src/services/geminiService.ts` (+294 dòng, tái cấu trúc toàn bộ)
- `src/types.ts` (+8 dòng)
- `src/hooks/useAISuggestion.ts` (cập nhật import)
- `src/__tests__/geminiService.test.ts` (+156 dòng, +14 test mới)

---

### Issue #2 — Prompt Injection Sanitization

**Vấn đề:** Tên nguyên liệu có thể chứa ký tự đặc biệt (backtick, dấu ngoặc kép, backslash) được đưa thẳng vào prompt AI.

```ts
// Thêm hàm sanitize
const sanitizeForPrompt = (input: string): string => input.replaceAll(/[`"\\]/g, "'").slice(0, 200);
```

---

### Issue #3 — Memory Leak: clearTimeout không được gọi

**Vấn đề:** `setTimeout` trong `callWithTimeout` không bị xoá khi promise hoàn thành → memory leak.

```ts
// Trước: không có clearTimeout
// Sau:
const callWithTimeout = <T>(promise, ms, label): Promise<T> => {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  timeout.catch(() => {}); // Suppress unhandled rejection khi race thắng
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
};
```

---

### Issue #4 — AI Singleton

**Vấn đề:** `GoogleGenAI` được khởi tạo lại mỗi lần gọi API.

```ts
let _ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!_ai) {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) throw new Error('VITE_GEMINI_API_KEY is not set');
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
};

export const _resetAISingleton = (): void => {
  _ai = null;
}; // dùng trong test
```

---

### Issue #5 — Retry với Exponential Backoff

**Vấn đề:** Không có cơ chế retry khi gặp lỗi mạng tạm thời.

```ts
const withRetry = async <T>(fn, signal?, MAX_RETRIES = 2): Promise<T> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === MAX_RETRIES || !isRetryableError(err) || signal?.aborted) throw err;
      await new Promise(r => setTimeout(r, 1_000 * Math.pow(2, attempt)));
      // attempt=0: 1s, attempt=1: 2s
    }
  }
};
```

**Không retry với:** `AbortError`, lỗi timeout, lỗi validation/empty, lỗi API key.

---

### Issue #6 — AbortSignal Support

**Vấn đề:** Người dùng không thể huỷ request AI đang chạy.

```ts
// Thêm signal?: AbortSignal vào signature của:
export const analyzeDishImage = async (base64Image, mimeType, signal?) => { ... }
export const suggestIngredientInfo = async (ingredientName, unit, signal?) => { ... }
```

---

### Issue #7 — Validators Chặt Hơn

**Vấn đề:** Validators không kiểm tra đủ các field → có thể trả về object thiếu data.

| Validator                | Field bổ sung                                                               |
| ------------------------ | --------------------------------------------------------------------------- |
| `isIngredientSuggestion` | Kiểm tra đủ 6 field: `calories`, `protein`, `carbs`, `fat`, `fiber`, `unit` |
| `isMealPlanSuggestion`   | Thêm kiểm tra field `reasoning`                                             |
| `isAnalyzedDishResult`   | Thêm kiểm tra field `description`                                           |

---

### Issue #8 — parseJSON Bao Gồm Raw Text Trong Lỗi

**Vấn đề:** Khi parse thất bại, error message không có raw response → khó debug.

```ts
const parseJSON = <T>(text, validator, label): T => {
  if (!text) throw new Error(`Empty response from AI for ${label}`);
  // ...
  throw new Error(`Invalid AI response for ${label}. Raw: ${text.slice(0, 200)}`);
};
```

---

### Issue #9 — Giới Hạn Token Prompt (Dish List)

**Vấn đề:** `availableDishes` có thể chứa hàng trăm món → prompt quá dài, tốn token.

```ts
// Trước: truyền cả object đầy đủ
// Sau: chỉ lấy 100 món đầu, chỉ các field cần thiết
const dishSummaries = availableDishes.slice(0, 100).map(d => ({
  id: d.id,
  name: d.name,
  tags: d.tags,
  cal: d.calories,
  pro: d.protein,
}));
```

---

### Issue #10 — ThinkingLevel.HIGH → MEDIUM

**Vấn đề:** `ThinkingLevel.HIGH` tốn nhiều token và chậm hơn cần thiết cho meal planning.

```ts
// Trước:
thinkingConfig: { thinkingBudget: -1, includeThoughts: false }

// Sau:
thinkingConfig: { thinkingBudget: ThinkingLevel.MEDIUM }
```

---

### Issue #11 — Cache Nutrition Với TTL 1 Giờ

**Vấn đề:** Mỗi lần gõ tên nguyên liệu đều gọi API → lãng phí quota.

```ts
type CacheEntry = { data: IngredientSuggestion; ts: number };
const nutritionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1_000; // 1 giờ

// Trong suggestIngredientInfo:
const cacheKey = `${ingredientName.toLowerCase().trim()}::${unit.toLowerCase().trim()}`;
const cached = nutritionCache.get(cacheKey);
if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
// ...sau khi có kết quả:
nutritionCache.set(cacheKey, { data: result, ts: Date.now() });

export const _clearNutritionCache = (): void => nutritionCache.clear();
```

---

### Issue #12 — Di Chuyển Type `AvailableDishInfo` Vào `types.ts`

**Vấn đề:** Type được define trong `geminiService.ts` nhưng được dùng ở `useAISuggestion.ts` → circular dependency tiềm ẩn.

```ts
// src/types.ts — thêm vào cuối file
export type AvailableDishInfo = {
  id: string;
  name: string;
  tags: MealType[];
  calories: number;
  protein: number;
};
```

```ts
// src/hooks/useAISuggestion.ts — cập nhật import
import { ..., AvailableDishInfo } from '../types'; // ← từ types.ts
import { suggestMealPlan } from '../services/geminiService'; // ← không còn import type
```

---

### Issue #13 — Telemetry / Logging

**Vấn đề:** Không có gì để theo dõi AI calls chậm hoặc thất bại.

```ts
const logAICall = (label: string, startMs: number, success: boolean): void => {
  const elapsed = Date.now() - startMs;
  if (!success || elapsed > 10_000) {
    console.warn(`[GeminiService] ${label} ${success ? 'slow' : 'FAILED'} (${elapsed}ms)`);
  }
};
```

- `console.warn` khi gọi thất bại hoặc mất hơn 10 giây.

---

### Test Cases Mới (+14)

| Describe Block                  | Tests | Nội dung                                                           |
| ------------------------------- | ----- | ------------------------------------------------------------------ |
| `parseJSON (via public API)`    | 3     | Raw text trong error, non-JSON throws, empty throws                |
| `retry`                         | 3     | Retry khi lỗi mạng, không retry khi timeout, không retry khi abort |
| `suggestIngredientInfo cache`   | 3     | Cache hit, key case-insensitive, different keys                    |
| `analyzeDishImage abort`        | 1     | Pre-aborted signal throws ngay lập tức                             |
| `suggestIngredientInfo abort`   | 1     | Pre-aborted signal throws ngay lập tức                             |
| `prompt injection sanitization` | 1     | Backtick/quote/backslash bị xoá khỏi prompt                        |
| `validator strictness`          | 3     | Thiếu `carbs`/`reasoning`/`description` → invalid                  |

---

## 5. Tổng kết số liệu

| Chỉ số                 | Trước session |                  Sau session                  |
| ---------------------- | :-----------: | :-------------------------------------------: |
| Tests passing          |      649      |                    **663**                    |
| Tests mới              |       —       |                      +14                      |
| ESLint errors          |       0       |                       0                       |
| SonarQube Quality Gate |      ✅       |                      ✅                       |
| Commits                |       —       |                 4 commits mới                 |
| APK build              |       —       | `MealPlaning_05-03-2026_20-07-39.apk` (147MB) |

### APK

| Thông tin    | Giá trị                                                                |
| ------------ | ---------------------------------------------------------------------- |
| File         | `MealPlaning_05-03-2026_20-07-39.apk`                                  |
| Kích thước   | 147 MB                                                                 |
| Google Drive | https://drive.google.com/file/d/1N2cZTwBL8-DU1FEQNpQE3AZx54I2GwBC/view |

### Commits trong session

| Hash      | Loại       | Mô tả ngắn                                              |
| --------- | ---------- | ------------------------------------------------------- |
| `156ab9c` | `test/fix` | BUG-002: ingredient name snap-back + 2 regression tests |
| `93c0c95` | `feat`     | Default VI language + light theme on first install      |
| `bc16be3` | `fix`      | Theme desync: lift state to App.tsx                     |
| `2e459a7` | `fix`      | geminiService: 12 improvements (#2–#13), +14 tests      |

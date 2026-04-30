# Phase 1.5B — AI Foundation

> **Trạng thái:** 🟡 Draft 1.2 (2026-04-30) — F-01 DONE; F-02 lock 8 design decisions Q1-Q8, chờ implementation.
>
> **Mục tiêu:** Build GeminiClient core + NutritionAi + 2 prompt templates (F-01 AI Lookup + F-02 AI Auto-fill) để F-01/F-02 PRD complete-done. Infra dùng lại cho Phase 2 (AI Meal Plan day/week) và Phase 5 (Image / Menu Suggest / Insight / Training Plan).

---

## 1. Scope

### 1.1 In scope

| # | Deliverable | Detail |
|---|-------------|--------|
| 1 | `GeminiClient` (core) | HTTP client gọi Gemini REST API, retry, JSON parsing, log vào `ai_chat_log`, network detection |
| 2 | `NutritionAi` (wrapper) | 2 method: `lookupIngredient(name)`, `autofillDish(name, dbIngredients)` |
| 3 | 2 prompt templates | §3.2 Dish Auto-fill + §3.9 Ingredient Lookup (xem `docs/5-ai/ai-strategy.md`) |
| 4 | UI: AI button trong `ingredient-add` + `dish-add` | Trigger AI flow + bottom sheet preview |
| 5 | Bottom sheet preview | Sau khi AI trả → hiển thị form pre-fill, user edit + Lưu |
| 6 | `<app-ai-offline-banner>` component | Hiển thị khi offline (Capacitor Network) |
| 7 | Error handling | Toast theo §5.1 ai-strategy.md (đã update theo phase này) |
| 8 | API key obfuscation build step | Theo D3 — XOR + base64, runtime decode |
| 9 | Auto-cleanup `ai_chat_log` | Xóa row > 30 ngày khi app khởi động |
| 10 | Test suite | Unit test GeminiClient (mock fetch) + NutritionAi + integration emulator |

### 1.2 Out of scope (Phase 5)

- F-05 Image Analysis (`generateContentWithImage`)
- F-06 Menu Suggestions
- F-07 Daily/Weekly Insight
- F-11 Training Plan
- Settings UI cho user paste API key (V2+)

### 1.3 Out of scope (Phase 2 — sẽ DÙNG infra này, không build trong 1.5B)

- F-03 AI Meal Plan day/week — Phase 2 sẽ thêm method `planDay` / `planWeek` trong `NutritionAi`, dùng lại `GeminiClient` infra
- F-04 Daily summary computation — Phase 2 (non-AI, chỉ aggregate dish_with_totals)

---

## 2. 10 Quyết định kiến trúc đã chốt

> Discussion ngày 2026-04-30 với user. Các quyết định này là source-of-truth cho implementation.

| # | Quyết định | Giá trị | Lý do |
|---|-----------|---------|-------|
| 1 | Service layer hierarchy | **2 layer**: `GeminiClient` (core HTTP/retry/log) + `NutritionAi` (business wrapper). **Style 2025**: không dùng `Service` suffix (CI guard `check-style-2025-naming.mjs` cấm). | Phase 5 thêm `FitnessAi` / `InsightAi` song song. |
| 2 | Gemini model | `gemini-2.5-flash` (cho cả 2 prompt) | Mới hơn 2.0-flash, accuracy tốt hơn cho tiếng Việt + ingredient matching, giá tương đương. |
| 3 | API key strategy | `environment.ts` + obfuscation (D3) | Ship dev key trong APK, XOR + base64. Không có Settings UI cho user paste key (V2+). |
| 4 | Quota limit | **Không quota** | Update D3 — Gemini paid tier không cap, dev tự chịu cost. Phù hợp với product-vision §248. |
| 5 | Logging strategy | Log full request/response + auto-cleanup row > 30 ngày | Cân bằng debug/audit + storage. Cleanup chạy trong `app.ts` (`class App`) qua `afterNextRender`. |
| 6 | Retry strategy | Exponential backoff: 1s → 2s → 4s, max 3 attempts, chỉ retry 5xx + network timeout | Update §5.2 ai-strategy.md (cũ là 1 retry). Không retry 4xx (400/401/403/429 = user/key error). |
| 7 | Network detection | `@capacitor/network` plugin + `NetworkStore` (signal-based) | Pre-emptive guard: offline → disable AI button + show banner ngay. |
| 8 | Output format | Structured Output JSON Schema (`responseMimeType: 'application/json'` + `responseSchema`) + zod validate sau parse | Giảm fail rate parse JSON. Zod validate là defense-in-depth. |
| 9 | F-02 ingredient matching | Pass full DB ingredient list `[{id, name, category}]` vào prompt → AI tự match `ingredient_id` | AI semantic match tốt hơn local Levenshtein. ~50-100 ingredients sau seed → token cost chấp nhận được. |
| 10 | Confirm UX | Bottom sheet preview, user edit mọi field + Lưu | Standard pattern (Cal AI, MyFitnessPal). Phân biệt rõ data từ AI. |

---

## 2-bis. 8 Quyết định F-02 (Q1-Q8) — chốt 2026-04-30

> Discussion ngày 2026-04-30 với user, sau khi F-01 đã DONE + QA pass. Các quyết định này bổ sung cho Decision #9 ở §2 và là source-of-truth riêng cho F-02.

| # | Topic | Chốt | Reasoning |
|---|-------|------|-----------|
| Q1 | UI entry point | **A** — Nút "🤖 AI tự điền" nằm TRONG form `dish-add` (giống F-01). FAB "AI tự điền từ tên món" ở `management.page.ts` → navigate sang `/tabs/management/dish/new`, user gõ tên rồi bấm nút trong page. | Nhất quán với F-01, reuse logic loading/offline banner/error toast. Khớp doc §4.2 nguyên văn. |
| Q2 | Duplicate dish detection | **A** — Check trùng TRƯỚC khi gọi AI (Vietnamese-aware: `removeAccents` + lowercase + trim). Nếu match → IonAlert 3 nút: Hủy / Tạo mới / **Cập nhật cũ**. "Cập nhật cũ" → sheet ở `mode='update'` với banner "Đang cập nhật '<tên>' đã có trong DB", khi Lưu sẽ UPDATE dish + DELETE/INSERT dish_ingredient trong cùng transaction. | Nhất quán F-01. User được cảnh báo sớm, không tốn token AI nếu chỉ muốn xem. |
| Q3 | Sheet edit scope (V1) | **B** — User có thể: (a) edit gram per row, (b) xóa row, (c) **thêm row mới** qua nút "+ Thêm nguyên liệu" mở picker chọn ingredient từ DB. KHÔNG cho edit tên dish, KHÔNG cho edit servings (giữ `=1` cứng theo §3.3). | Đủ dùng thực tế (AI thiếu ingredient → tự bổ sung), không phình scope. |
| Q4 | Edge cases dữ liệu | **B** — (4a) DB rỗng: vẫn gọi AI với `dbIngredients=[]`, mọi row đều `isInDb=false` → "+" hết. (4b) AI trả `ingredients: []`: mở sheet RỖNG với header tên dish + hint "AI không có gợi ý, hãy tự thêm" → user dùng nút "+ Thêm nguyên liệu" build dish. | Tận dụng UI sheet, không mất tên user đã gõ. Phụ thuộc Q3=B. |
| Q5 | Fuzzy match local sau AI | **C** — Post-process row có `isInDb=false`: normalize tên (lowercase + removeAccents + trim) so với DB ingredients (cache normalized). (a) **Match exact** (Levenshtein=0 sau normalize, chỉ khác dấu/khoảng trắng) → auto re-link silent + badge "✓ (auto)". (b) **Match mờ** (Levenshtein 1-2) → confirm modal "AI gợi ý '<x>'. Có phải '<y>' trong DB không? [Có / Không, tạo mới]". (c) Match nhiều / xa / không match → giữ "+". | Cân bằng giữa data sạch (DB không trùng do thiếu dấu) và tôn trọng intent user (case mơ hồ phải hỏi). |
| Q6 | Save behavior | **A + Q12-C confirm step** — Atomic transaction wrap toàn bộ flow Lưu. **TRƯỚC** commit, nếu có ≥ 1 row `+` (will-create), hiện **confirm modal**: checkbox list từng ingredient mới, default all-checked, footer info "Bỏ check = không tạo ingredient + không thêm vào món". Validation: tổng row được giữ (DB matched + checked new) phải ≥ 1, không thì button "Tiếp tục" disabled với hint "Món phải có ít nhất 1 nguyên liệu". User confirm → tx: (1) INSERT N ingredient được check (`source='ai'`), (2) INSERT/UPDATE dish, (3) DELETE old dish_ingredient (mode=update), (4) INSERT M dish_ingredient (chỉ cho row được giữ), (5) `ai_chat_log`. Bất kỳ bước fail → rollback toàn bộ → toast "Lưu thất bại, vui lòng thử lại", sheet vẫn mở. | Đồng bộ PRD §F-02 (UX prompt nguyên liệu mới). User toàn quyền pick từng row, không buộc all-or-none. Không bao giờ có orphan ingredient hoặc dish thiếu link. |
| Q7 | Nutrition + category cho ingredient mới | **B** — Mở rộng prompt template (`docs/5-ai/ai-strategy.md` §3.2 rev 1.4) + schema TS §3.3 dưới đây: với mỗi row `isInDb=false`, AI trả thêm `category`, `caloriesPer100g`, `proteinPer100g`, `carbsPer100g`, `fatPer100g`, `fiberPer100g`, **`confidence: 'high' \| 'medium' \| 'low'`**. Row `isInDb=true` không cần các field này (đã có sẵn trong DB). | 1 round-trip, dish nutrition đầy đủ ngay. Confidence per-ingredient giúp UI cảnh báo hallucinate (Q8). KHÔNG vi phạm RULE-DISH-TOTAL-04 (per-ingredient ≠ dish total). |
| Q8 | UI edit nutrition cho row "+" | **C** — Tap row "+" → mở **bottom sheet con** (stacked, tái dùng `AiLookupSheet` đã có ở F-01) hiển thị form edit đủ field (name + category + 5 nutrition + confidence). Save trong sheet con → trở về sheet chính với data đã update. Row "+" có icon ✏️ trigger. | Tái dùng component, không bùng code mới. Pattern user đã quen với F-01. |
| Q10 | Sync prompt template ai-strategy.md | **A** — Update `docs/5-ai/ai-strategy.md` §3.2 lên rev 1.4: mở rộng JSON schema cho row `is_in_db=false` (5 `*_per_100g` + `category` + `confidence`); ghi rõ KHÔNG vi phạm RULE-DISH-TOTAL-04 (per-ingredient ≠ dish total). | Canonical prompt template phải đồng bộ với schema TS §3.3. |
| Q11 | Sync UX prompt PRD §F-02 step 6 | **B** — Giữ UX "Hỏi user lưu N nguyên liệu mới vào DB". Triển khai qua confirm modal Q12-C trước commit transaction. PRD §F-02 step 6 vẫn giữ wording. | User mất kiểm soát nếu auto-insert silent. UX giữ transparency với data sạch. |
| Q12 | Cách hiện confirm modal nguyên liệu mới | **C** — Per-row checkbox + footer hint "Bỏ check = không tạo ingredient + không thêm vào món". Validation: tổng row giữ (matched DB + checked new) ≥ 1, nếu = 0 → disable "Tiếp tục" + hint "Món phải có ít nhất 1 nguyên liệu". User toàn quyền pick, dish không bao giờ rỗng. | Linh hoạt hơn all-or-none (Q12-A), explicit hơn auto-insert (Q11-A). Tích hợp gọn vào atomic tx Q6-A. |

---

## 3. Architecture Detail

### 3.1 Service Layer

```
features/management/ingredient-add (UI)
        │
        │ inject NutritionAi
        ▼
NutritionAi.lookupIngredient(name)
        │
        │ inject GeminiClient
        ▼
GeminiClient.generateContent(prompt, options)
        │
        ├──► HTTP fetch (with retry) ──► Gemini API
        │
        ├──► Log request/response vào ai_chat_log
        │
        └──► Parse JSON + zod validate
                │
                ▼
        Return IngredientLookupResult
```

### 3.2 GeminiClient — interface

```typescript
// src/app/core/services/ai/gemini-client.ts

export interface GeminiOptions {
  systemInstruction?: string;
  responseSchema?: object;       // JSON Schema cho Structured Output
  temperature?: number;          // default 0.2 (deterministic cho data extraction)
  maxOutputTokens?: number;      // default 2048
  feature: AiFeature;            // bắt buộc — log vào ai_chat_log.feature
}

export type AiFeature =
  | 'ingredient_lookup' | 'dish_autofill'
  | 'meal_plan_day' | 'meal_plan_week'              // Phase 2
  | 'image_analysis' | 'menu_suggestion'
  | 'daily_insight' | 'weekly_review' | 'training_plan';  // Phase 5

export class GeminiClient {
  generateContent<T>(prompt: string, options: GeminiOptions, schema: z.ZodType<T>): Promise<T>;
  cleanupOldLogs(daysToKeep: number = 30): Promise<void>;
}
```

### 3.3 NutritionAi — interface

```typescript
// src/app/core/services/ai/nutrition-ai.ts

export interface IngredientLookupResult {
  name: string;
  category: string;
  calories: number;       // kcal/100g
  protein: number;        // g/100g
  carbs: number;
  fat: number;
  fiber: number;
  confidence: 'high' | 'medium' | 'low';
  note?: string;
}

export interface DishAutofillResult {
  dishName: string;
  servings: 1;
  ingredients: Array<DishAutofillIngredient>;
}

/**
 * Ingredient row trong DishAutofillResult.
 * Q7-B: nutrition fields chỉ bắt buộc khi isInDb=false (AI tự cung cấp).
 *       Khi isInDb=true, dùng nutrition từ DB qua matchedIngredientId.
 */
export interface DishAutofillIngredient {
  name: string;
  gramWeight: number;        // 0.1–10000
  isInDb: boolean;
  matchedIngredientId?: string;   // chỉ có khi isInDb=true

  // Q7-B: chỉ có khi isInDb=false (sẽ tạo mới)
  category?: string;              // vd 'Thịt' | 'Hải sản' | 'Rau củ' | 'Trái cây' | 'Ngũ cốc' | 'Sữa & trứng' | 'Gia vị' | 'Đồ uống' | 'Khác'
  caloriesPer100g?: number;       // kcal/100g
  proteinPer100g?: number;        // g/100g
  carbsPer100g?: number;
  fatPer100g?: number;
  fiberPer100g?: number;
  confidence?: 'high' | 'medium' | 'low';   // Q7-B: per-ingredient confidence
}

export class NutritionAi {
  lookupIngredient(name: string): Promise<IngredientLookupResult>;
  autofillDish(dishName: string, dbIngredients: IngredientRef[]): Promise<DishAutofillResult>;
}
```

### 3.4 Retry algorithm

```
async function withRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (attempt >= 3) throw err;
    if (!isRetryable(err)) throw err;     // 4xx → no retry
    const delayMs = Math.pow(2, attempt - 1) * 1000;   // 1s, 2s, 4s
    await sleep(delayMs);
    return withRetry(fn, attempt + 1);
  }
}

function isRetryable(err: GeminiError): boolean {
  if (err.kind === 'network') return true;       // timeout, fetch fail
  if (err.kind === 'http' && err.status >= 500) return true;
  if (err.kind === 'parse') return true;          // JSON parse fail (rare with Structured Output)
  return false;                                    // 4xx, validation, abort
}
```

### 3.5 Error taxonomy

| Kind | Source | Retry? | Toast (Vietnamese) |
|------|--------|--------|--------------------|
| `network` | Capacitor Network offline / fetch timeout 15s | Yes (3×) | "Cần kết nối mạng để dùng AI" |
| `http_5xx` | Gemini 500, 502, 503, 504 | Yes (3×) | "AI đang bận, thử lại sau" |
| `http_429` | Rate limit | No | "Đã đạt giới hạn, thử lại sau" |
| `http_401` / `http_403` | API key invalid | No | "Lỗi cấu hình AI, vui lòng cập nhật app" |
| `http_400` | Prompt invalid | No | "Lỗi gửi yêu cầu AI" |
| `parse` | JSON parse fail / zod validation fail | Yes (3×) | "AI trả kết quả lạ, đang thử lại..." |
| `empty` | Response.candidates rỗng | No | "AI không có gợi ý, hãy thử lại" |

### 3.6 Network detection — NetworkStore

```typescript
// src/app/core/stores/network.store.ts
import { Network } from '@capacitor/network';

@Injectable({ providedIn: 'root' })
export class NetworkStore {
  private readonly _isOnline = signal(true);
  readonly isOnline = this._isOnline.asReadonly();

  constructor() {
    Network.getStatus().then((s) => this._isOnline.set(s.connected));
    // Root singleton — listener sống cùng app lifecycle.
    // Lưu handle để cleanup nếu service bị destroy (defensive).
    void Network.addListener('networkStatusChange', (s) =>
      this._isOnline.set(s.connected),
    );
  }
}
```

UI usage (Angular 21 default control-flow `@if`/`@for`/`@switch` — `*ngIf` cấm):
```html
@if (!network.isOnline()) {
  <app-ai-offline-banner />
}
<ion-button [disabled]="!network.isOnline() || loading()" (click)="onAiLookup()">
  🤖 AI Lookup
</ion-button>
```

### 3.7 API key obfuscation

```typescript
// scripts/obfuscate-key.mjs (build-time)
// Input:  process.env.GEMINI_API_KEY (plain)
// Output: src/environments/environment.prod.ts với obfuscated string

const OBF_KEY = 'HealthMate-2026';   // hard-coded XOR key
function obfuscate(plain) {
  const xored = Array.from(plain).map((ch, i) =>
    String.fromCharCode(ch.charCodeAt(0) ^ OBF_KEY.charCodeAt(i % OBF_KEY.length))
  ).join('');
  return Buffer.from(xored).toString('base64');
}

// Runtime decode:
// src/app/core/services/ai/gemini-key.ts
export function decodeApiKey(obfuscated: string): string {
  const xored = atob(obfuscated);
  return Array.from(xored).map((ch, i) =>
    String.fromCharCode(ch.charCodeAt(0) ^ OBF_KEY.charCodeAt(i % OBF_KEY.length))
  ).join('');
}
```

> **NOTE D3:** Đây là obfuscation, không phải encryption. Key vẫn extract được khỏi APK. Phù hợp cho V1 (alpha/internal) — V2+ có thể migrate sang user-provided key.

### 3.8 Auto-cleanup ai_chat_log

```typescript
// src/app/app.ts (entry point — class `App`, đã migrate Style 2025)
import { afterNextRender, inject } from '@angular/core';

export class App {
  private readonly gemini = inject(GeminiClient);

  constructor() {
    afterNextRender(() => {
      // Cleanup chạy 1 lần mỗi khi app khởi động (idle, không block UI).
      void this.gemini.cleanupOldLogs(30);
    });
  }
}

// src/app/core/services/ai/gemini-client.ts
async cleanupOldLogs(daysToKeep: number): Promise<void> {
  // S2 fix: ai_chat_log.created_at lưu format SQLite "YYYY-MM-DD HH:MM:SS"
  // (datetime('now')) — KHÔNG phải ISO 8601. Dùng SQL datetime() để so sánh
  // đúng lexicographic, tránh mismatch 'T' vs ' '.
  await this.db.execute(
    `DELETE FROM ai_chat_log WHERE created_at < datetime('now', ?)`,
    [`-${daysToKeep} days`],
  );
}
```

---

## 4. UX Flow

### 4.1 F-01 AI Lookup Flow (`ingredient-add` page)

```
[ingredient-add page]
     │
     │ 1. User nhập tên "Ức gà luộc"
     │ 2. User bấm 🤖 AI Lookup
     ▼
[network online?]──No──► Toast "Cần kết nối mạng để dùng AI"
     │ Yes
     ▼
[Show inline loader trên button]
     │
     │ NutritionAi.lookupIngredient("Ức gà luộc")
     │
     ├─► [Duplicate check trong DB by name (Vietnamese-aware)]
     │      │
     │      ├─ Match → Alert: "Đã tồn tại 'Ức gà'. [Cập nhật cũ / Tạo mới]"
     │      └─ No match → continue
     │
     ▼
[Bottom sheet preview]
  Tên:        [Ức gà luộc           ]
  Nhóm:       [Thịt              ▾]
  Calories:   [165 kcal/100g       ]
  Protein:    [31.0 g/100g          ]
  Carbs:      [0 g/100g             ]
  Fat:        [3.6 g/100g           ]
  Fiber:      [0 g/100g             ]
  Confidence: 🟢 High
  Note:       Số liệu USDA, đã nấu chín

  [Hủy]                       [Lưu]
     │
     │ User edit nếu cần
     │ User bấm "Lưu"
     ▼
[Insert ingredient với source='ai']
[Log vào ai_chat_log với feature='ingredient_lookup']
[Toast: "Đã lưu nguyên liệu"]
[Pop bottom sheet, refresh ingredient list]
```

### 4.2 F-02 AI Auto-fill Flow (`dish-add` page)

> Áp dụng 8 quyết định Q1-Q8 ở §2-bis. Flow này là source-of-truth cho implementation.

```
[FAB "AI tự điền từ tên món" trong tab Quản lý]
     │
     │ Navigate (giữ handler hiện tại)
     ▼
[dish-add page (Q1: nút AI nằm trong form)]
     │
     │ 1. User gõ tên "Phở bò"
     │ 2. User bấm 🤖 AI tự điền
     ▼
[Network online?]──No──► Toast "Cần kết nối mạng để dùng AI" + STOP
     │ Yes
     ▼
[Q2: Duplicate dish check TRƯỚC khi gọi AI]
  SELECT dish WHERE normalize(name) = normalize("Phở bò")
     │
     ├─ Match → IonAlert 3 nút:
     │           [Hủy]  → STOP
     │           [Tạo mới]   → mode='create', tiếp tục
     │           [Cập nhật cũ] → mode='update' + lưu existingDishId, tiếp tục
     └─ No match → mode='create', tiếp tục
     │
     ▼
[Lấy DB ingredient list: SELECT id, name, category]
  → dbIngredients[]  (Q4-4a: DB rỗng = mảng rỗng, vẫn gọi tiếp)
     │
     ▼
[Show inline loader trên button + log feature='dish_autofill']
     │
     │ NutritionAi.autofillDish("Phở bò", dbIngredients)
     │ Retry 3× cho 5xx (1s/2s/4s) — giống F-01.
     │
     ▼
[AI trả DishAutofillResult — schema mở rộng theo Q7]
     │
     │ result.ingredients = [
     │   {name:"Bánh phở", gramWeight:200, isInDb:true,  matchedIngredientId:"a1"},
     │   {name:"Thịt bò",  gramWeight:150, isInDb:true,  matchedIngredientId:"a2"},
     │   {name:"Quế",      gramWeight:3,   isInDb:false,
     │    category:"Gia vị", caloriesPer100g:247, proteinPer100g:4,
     │    carbsPer100g:51,   fatPer100g:1.2, fiberPer100g:53,
     │    confidence:'medium'},
     │   ...
     │ ]
     ▼
[Q5-C: Local fuzzy match post-process]
  Cho mỗi row có isInDb=false:
    norm = normalize(row.name)              // lowercase + removeAccents + trim
    candidates = dbIngredients filter where levenshtein(normalize(db.name), norm)
                                            (đã cache normalized name của DB)
    ┌─ Lev=0 (chỉ khác dấu/space) → AUTO RE-LINK silent
    │  row.isInDb = true; row.matchedIngredientId = match.id
    │  row.autoMatched = true   (UI: badge "✓ (auto)")
    │  bỏ nutrition fields (dùng DB)
    │
    ├─ Lev∈{1,2} & match đơn nhất → CONFIRM MODAL:
    │  "AI gợi ý '<row.name>'. Có phải '<match.name>' trong DB không?"
    │   [Có, dùng <match.name>] → re-link như Lev=0
    │   [Không, tạo mới]        → giữ "+", confidence + nutrition giữ nguyên
    │
    ├─ Lev∈{1,2} & nhiều match → giữ "+" (ambiguous, không guess)
    │
    └─ Lev>2 hoặc no match     → giữ "+" (sẽ tạo mới khi Lưu)
     │
     ▼
[Q4-4b: result.ingredients.length === 0?]
     │
     ├─ Yes → mở sheet RỖNG, header "<dishName> — 0 nguyên liệu"
     │        + hint "AI không có gợi ý, hãy tự thêm" + nút "+ Thêm nguyên liệu"
     │
     └─ No  → mở sheet với data
     │
     ▼
[AI Auto-fill Sheet — main]
  ┌──────────────────────────────────────────────┐
  │ Header:                                      │
  │   Tên: Phở bò                                │
  │   Servings: 1                                │
  │   [Banner update mode (Q2)]:                 │
  │     "Đang cập nhật 'Phở bò' đã có trong DB"  │
  │                                              │
  │ Nguyên liệu list:                            │
  │ ┌──────────────────────────────────────────┐ │
  │ │ ✓ Bánh phở          [200] g       [✕]    │ │ ← in DB
  │ │ ✓ Thịt bò           [150] g       [✕]    │ │
  │ │ ✓ Hành lá (auto)    [ 10] g       [✕]    │ │ ← Q5: auto re-link
  │ │ + Quế  🟡 Medium    [  3] g  ✏️   [✕]    │ │ ← will create + Q8 edit
  │ │ + Hồi  🟢 High      [  2] g  ✏️   [✕]    │ │
  │ └──────────────────────────────────────────┘ │
  │                                              │
  │ [+ Thêm nguyên liệu]   ← Q3-B                │
  │                                              │
  │ Hint: 2 nguyên liệu mới sẽ được tạo trong DB │
  │                                              │
  │ [Hủy]                                [Lưu]   │
  └──────────────────────────────────────────────┘
     │
     │ Q3-B actions:
     │  - Tap [✕] xóa row
     │  - Edit gram inline
     │  - Tap "+ Thêm nguyên liệu" → picker DB → append row mới
     │
     │ Q8-C action: tap ✏️ trên row "+"
     │  → mở bottom sheet con (stacked, reuse AiLookupSheet)
     │     • Edit name / category / 5 nutrition / confidence
     │     • [Hủy] / [Lưu]
     │  → Save sheet con → cập nhật row trong sheet chính
     │
     │ User bấm [Lưu]
     ▼
[Q11+Q12-C: Confirm modal nguyên liệu mới]
  Nếu có ≥ 1 row "+" (will-create):
    ┌──────────────────────────────────────────┐
    │ Lưu nguyên liệu mới vào DB?              │
    │                                          │
    │ ☑ Quế        🟡 Medium                   │
    │ ☑ Hồi        🟢 High                     │
    │                                          │
    │ Bỏ check = KHÔNG tạo ingredient và       │
    │ KHÔNG thêm vào món.                      │
    │                                          │
    │ [Hủy]                       [Tiếp tục]   │
    └──────────────────────────────────────────┘
  Validation: count(matched in DB) + count(checked new) >= 1
    │ Disabled "Tiếp tục" khi = 0 + hint "Món phải có ít nhất 1 nguyên liệu"
    │
    │ User bỏ check 1 row → row đó loại khỏi cả ingredient + dish_ingredient
    │ User bấm [Hủy] → đóng modal, sheet vẫn mở
    │ User bấm [Tiếp tục] → vào transaction
     ▼
[Q6-A: ATOMIC TRANSACTION]
  db.transaction(async (tx) => {
    const newIngredientsToCreate = rows.filter(r => !r.isInDb && r.checked);
    const dishIngredientRows = rows.filter(r => r.isInDb || r.checked);

    // 1. Tạo ingredient mới cho row "+" được CHECK
    for (row of newIngredientsToCreate) {
      const id = uuidv4();
      await tx.execute(`INSERT INTO ingredient (id, name, category_id,
        calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
        fiber_per_100g, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ai', datetime('now'))`,
        [id, row.name, lookupCategoryId(row.category),
         row.caloriesPer100g, row.proteinPer100g, row.carbsPer100g,
         row.fatPer100g, row.fiberPer100g]);
      row.matchedIngredientId = id;
    }

    // 2a. mode='create': INSERT dish
    // 2b. mode='update': UPDATE dish + DELETE existing dish_ingredient
    if (mode === 'create') {
      await tx.execute(`INSERT INTO dish (id, name, type, source, ...)
        VALUES (?, ?, 'ai_autofill', 'ai', ...)`, [dishId, name, ...]);
    } else {
      await tx.execute(`UPDATE dish SET ... WHERE id = ?`, [..., existingDishId]);
      await tx.execute(`DELETE FROM dish_ingredient WHERE dish_id = ?`,
        [existingDishId]);
      dishId = existingDishId;
    }

    // 3. INSERT dish_ingredient cho row được giữ (matched + checked-new)
    for (row of dishIngredientRows) {
      await tx.execute(`INSERT INTO dish_ingredient
        (id, dish_id, ingredient_id, gram_weight)
        VALUES (?, ?, ?, ?)`,
        [uuidv4(), dishId, row.matchedIngredientId, row.gramWeight]);
    }

    // 4. Log AI request/response — GeminiClient đã tự log nên có thể bỏ.
  });
     │
     ├─ Success → Toast "Đã lưu món" + pop sheet + refresh dish list
     │
     └─ Fail    → Rollback toàn bộ → toast "Lưu thất bại, vui lòng thử lại"
                  Sheet vẫn mở để user thử Lưu lại.
```

**Lưu ý implementation Q5-C fuzzy match:**

- Util `src/app/shared/utils/vietnamese-fuzzy-match.ts` (mới) export:
  - `normalize(name: string): string` — lowercase + removeAccents + trim + collapse spaces.
  - `levenshtein(a: string, b: string): number` — distance ≤ 2 thì return chính xác, > 2 return 3 (early exit).
  - `findFuzzyMatches(target: string, candidates: {id; name}[]): {match: ..., distance: number}[]`.
- DB ingredient list nên cache `normalize(name)` ở thời điểm query để tránh re-compute mỗi lần.

---

## 5. File List

### 5.1 New files

```
src/app/core/services/ai/
  ├─ gemini-client.ts                   # class GeminiClient (HTTP/retry/log)
  ├─ gemini-client.spec.ts
  ├─ gemini-key.ts                      # decodeApiKey runtime
  ├─ gemini-types.ts                    # AiFeature, GeminiError, GeminiOptions
  ├─ nutrition-ai.ts                    # class NutritionAi (lookupIngredient + autofillDish)
  ├─ nutrition-ai.spec.ts
  └─ prompts/
     ├─ ingredient-lookup.prompt.ts     # buildPrompt() + responseSchema + zodSchema
     ├─ ingredient-lookup.prompt.spec.ts
     ├─ dish-autofill.prompt.ts
     └─ dish-autofill.prompt.spec.ts

src/app/core/stores/
  ├─ network.store.ts                   # @capacitor/network signal store
  └─ network.store.spec.ts

src/app/shared/utils/
  ├─ vietnamese-fuzzy-match.ts         # Q5-C: normalize + levenshtein + findFuzzyMatches
  └─ vietnamese-fuzzy-match.spec.ts

src/app/shared/components/
  ├─ ai-offline-banner/
  │  ├─ ai-offline-banner.ts
  │  ├─ ai-offline-banner.html
  │  └─ ai-offline-banner.scss
  ├─ ai-lookup-sheet/                   # Bottom sheet F-01 preview (cũng dùng cho Q8-C edit row "+")
  │  ├─ ai-lookup-sheet.ts
  │  ├─ ai-lookup-sheet.html
  │  ├─ ai-lookup-sheet.scss
  │  └─ ai-lookup-sheet.spec.ts
  └─ ai-autofill-sheet/                 # Bottom sheet F-02 main (Q3-B + Q4-B + Q8-C trigger)
     ├─ ai-autofill-sheet.ts
     ├─ ai-autofill-sheet.html
     ├─ ai-autofill-sheet.scss
     └─ ai-autofill-sheet.spec.ts

scripts/
  └─ obfuscate-gemini-key.mjs           # Build-time key obfuscation

src/environments/
  ├─ environment.ts                     # plain key cho dev
  └─ environment.prod.ts                # obfuscated key cho prod
```

### 5.2 Modified files

```
src/app/features/management/ingredient-add/ingredient-add.page.{ts,html}
  → Thêm 🤖 AI Lookup button + integrate NutritionAi

src/app/features/management/dish-add/dish-add.page.{ts,html}
  → Thêm 🤖 AI Auto-fill button + integrate NutritionAi

src/app/app.ts (class `App`)
  → afterNextRender: gọi geminiClient.cleanupOldLogs(30)

docs/5-development/development-plan.md
  → Update D3: bỏ quota limit
  → Update §148-163 status (Phase 1.5B → in-progress)

docs/5-ai/ai-strategy.md
  → §4.3 Rate Limiting: bỏ "Internal quota limit 50/day", giữ "Không cap"
  → §4.4 API Key Management: clarify obfuscation = XOR + base64
  → §5.1 Error Types: cập nhật retry 3 lần exponential backoff
  → §5.2 Retry Strategy: cập nhật 1s → 2s → 4s, max 3
  → §1 Model: chốt gemini-2.5-flash
```

---

## 6. Test Plan

### 6.1 Unit tests (Karma + Jasmine)

| File | Test | Goal |
|------|------|------|
| `gemini-client.spec.ts` | Mock fetch → verify retry logic 5xx (1s→2s→4s, max 3) | Retry algorithm |
| `gemini-client.spec.ts` | Mock fetch → verify NO retry trên 4xx | Error classification |
| `gemini-client.spec.ts` | Mock DB → verify ai_chat_log insert sau success/fail | Logging |
| `gemini-client.spec.ts` | Mock DB → cleanupOldLogs(30) → verify DELETE WHERE created_at < datetime('now','-30 days') | Cleanup (S2 fix) |
| `gemini-client.spec.ts` | Mock fetch → invalid JSON → zod fail → retry → final throw | Parse error path |
| `gemini-key.spec.ts` | Round-trip obfuscate/decode | Key obfuscation |
| `nutrition-ai.spec.ts` | Mock GeminiClient → call lookupIngredient → assert prompt contains tên | Prompt building |
| `nutrition-ai.spec.ts` | Mock → call autofillDish → assert prompt contains DB ingredient list (Decision #9) | Pass-DB-list strategy |
| `nutrition-ai.spec.ts` | Mock AI trả row isInDb=false → assert có nutrition + category + confidence (Q7-B) | Schema mở rộng |
| `vietnamese-fuzzy-match.spec.ts` | normalize("Hành Lá ") === "hanh la" | Normalize util |
| `vietnamese-fuzzy-match.spec.ts` | levenshtein("hanh la","hanh la") = 0; ("hanh la","hành lá") = 0 sau normalize | Distance |
| `vietnamese-fuzzy-match.spec.ts` | findFuzzyMatches: Lev=0 unique → re-link; Lev∈{1,2} unique → return for confirm; > 2 → empty | Q5-C branches |
| `network.store.spec.ts` | Mock Capacitor Network → assert isOnline signal sync | NetworkStore |
| `ai-offline-banner.spec.ts` | Render khi `isOnline=false` | UI |
| `ai-lookup-sheet.spec.ts` | Render với data → user edit field → emit save (F-01 + Q8-C reuse cho row "+") | Bottom sheet F-01 + edit |
| `ai-autofill-sheet.spec.ts` | Render list ingredients → mark "✓"/"+" đúng → emit save | Bottom sheet F-02 main |
| `ai-autofill-sheet.spec.ts` | User xóa row → ingredient list cập nhật, KHÔNG insert ingredient đã xóa khi Lưu (Q3-B) | Edit scope |
| `ai-autofill-sheet.spec.ts` | User bấm "+ Thêm nguyên liệu" → picker → append row mới (Q3-B) | Add row |
| `ai-autofill-sheet.spec.ts` | Tap ✏️ row "+" → mở AiLookupSheet con → save → row chính cập nhật (Q8-C) | Edit nutrition row "+" |
| `ai-autofill-sheet.spec.ts` | mode='update' → banner "Đang cập nhật" hiện + Lưu → emit với existingDishId (Q2) | Update mode |
| `dish-add.page.spec.ts` | Tên trùng DB → IonAlert 3 nút Hủy/Tạo mới/Cập nhật cũ (Q2-A) | Duplicate check |
| `dish-add.page.spec.ts` | Q4-4a DB rỗng → vẫn gọi AI, mọi row "+" | Empty DB |
| `dish-add.page.spec.ts` | Q4-4b AI trả [] → sheet rỗng + nút thêm row | Empty result |
| `dish-add.page.spec.ts` | Q5-C Lev=0 → auto re-link, không show modal; Lev=1-2 → show confirm modal | Fuzzy match integration |
| `ai-autofill-sheet.spec.ts` | Q11+Q12-C confirm modal: render N row "+" + checkbox default-checked; uncheck 1 → emit save với row đó loại khỏi cả ingredient mới + dish_ingredient | New ingredient confirm |
| `ai-autofill-sheet.spec.ts` | Q12-C validation: uncheck hết + 0 row matched DB → "Tiếp tục" disabled + hint hiện | Empty dish guard |
| `dish-add.page.spec.ts` | Q6-A: mock tx fail giữa chừng → rollback → không có ingredient/dish nào trong DB | Atomic transaction |

### 6.2 Integration tests (emulator)

**F-01 (đã DONE):**
1. Cài app với dev key, ingredient-add → AI Lookup "Ức gà" → bottom sheet hiện lên với data
2. User edit calories → bấm Lưu → verify ingredient được insert với `source='ai'`
3. Duplicate check: tên trùng → alert Hủy/Tạo mới/Cập nhật cũ → cả 2 path hoạt động đúng
4. Tắt wifi → AI button disabled + offline banner hiện; bật lại → banner ẩn

**F-02 (Q1-Q8):**
5. Dish-add → AI tự điền "Phở bò" với DB có "Hành lá" → sheet hiện list, "Hành lá" auto-matched (Q5-C Lev=0)
6. Bấm Lưu → verify dish + dish_ingredient + ingredient mới ("Quế","Hồi") với `source='ai'` + nutrition đúng AI trả (Q7-B)
7. Duplicate dish: nhập "Phở bò" lần 2 → alert 3 nút (Q2-A); pick "Cập nhật cũ" → banner update + Lưu → UPDATE đúng dish cũ, không tạo mới (Q6-A)
8. AI trả "Hanh la" (thiếu dấu) khi DB có "Hành lá" → auto re-link silent, không hỏi (Q5-C Lev=0)
9. AI trả "Hanh la" khi DB có "Hành lá" và "Hành la khô" → confirm modal (Q5-C Lev∈{1,2}); pick "Có" → re-link
10. Q3-B: trong sheet, xóa 1 row + bấm "+ Thêm nguyên liệu" picker → save → DB phản ánh đúng
11. Q8-C: tap ✏️ row "+" → sheet con mở → edit calories → Save → row chính update; Lưu sheet chính → ingredient mới có nutrition đã edit
12. Q4-4b: nhập "abcxyz" → AI trả [] → sheet rỗng + hint "tự thêm" hiện
13. Q6-A rollback: simulate FK error giữa transaction → toast "Lưu thất bại", DB không có dish/ingredient mới (cần test bằng mock service)
14. Tắt wifi trong dish-add → button "AI tự điền" disabled + banner offline

### 6.3 Coverage target

- GeminiClient + NutritionAi: ≥ 90% line coverage (core infra)
- Bottom sheet components: ≥ 80%
- NetworkStore: 100%

---

## 7. Acceptance Criteria

**F-01 (đã DONE 2026-04-30, QA pass):**
- [x] User mở ingredient-add → nhập tên → bấm AI Lookup → bottom sheet hiện nutrition preview
- [x] User edit nutrition trong bottom sheet → Lưu → ingredient lưu vào DB với `source='ai'`
- [x] Duplicate ingredient AI lookup → alert cho user chọn cập nhật cũ / tạo mới
- [x] Offline → AI button disabled + `<app-ai-offline-banner>` hiện

**F-02 (chốt Q1-Q8, chờ implement):**
- [ ] Q1: User mở dish-add → nhập tên món → bấm 🤖 AI tự điền (nút trong form) → bottom sheet hiện ingredient list với DB matched
- [ ] Q2: Tên dish trùng DB → IonAlert 3 nút Hủy/Tạo mới/Cập nhật cũ; "Cập nhật cũ" → mode='update' → Lưu UPDATE đúng dish cũ + replace dish_ingredient
- [ ] Q3-B: Sheet cho phép edit gram, xóa row, "+ Thêm nguyên liệu" mở picker DB
- [ ] Q4-4a: DB rỗng vẫn gọi AI được (tất cả row "+")
- [ ] Q4-4b: AI trả [] → sheet rỗng + hint + nút thêm row
- [ ] Q5-C: Match exact (Lev=0 sau normalize) → auto re-link silent + badge "(auto)"; Match mờ (Lev 1-2) → confirm modal; Match xa → giữ "+"
- [ ] Q6-A + Q12-C: Trước commit hiện confirm modal "Lưu N nguyên liệu mới" với checkbox per row; uncheck → loại row khỏi cả ingredient + dish_ingredient; ràng buộc dish ≥ 1 ingredient sau filter; bất kỳ bước fail trong tx → rollback hoàn toàn, toast "Lưu thất bại"
- [ ] Q7-B: Mỗi ingredient mới được insert đầy đủ nutrition + category + source='ai'; dish total nutrition chính xác ngay sau Lưu
- [ ] Q8-C: Tap ✏️ row "+" mở `AiLookupSheet` con → edit nutrition → save → row chính update

**Common (cả F-01 + F-02):**
- [ ] HTTP 5xx → retry 3 lần exp backoff → fail thì toast "AI đang bận"
- [ ] Mọi request được log vào `ai_chat_log` với feature đúng (`ingredient_lookup` / `dish_autofill`)
- [ ] App khởi động → cleanup row `ai_chat_log` > 30 ngày
- [ ] `gemini-2.5-flash` model + Structured Output JSON Schema được dùng
- [ ] Key obfuscated trong APK production (verify bằng `unzip -p app.apk … | grep AIzaSy` → KHÔNG có)
- [ ] All tests pass: 247 cũ (F-01 đã có) + ~30 mới cho F-02
- [ ] Lint + guards + build pass
- [ ] APK install + manual smoke test pass cho cả F-01 + F-02

---

## 8. Out-of-scope risks (theo dõi cho Phase 2/5)

| Risk | Mitigation tương lai |
|------|----------------------|
| Token cost tăng khi DB ingredient list lớn (>200 items) | Phase 5: implement DB context pruning §4.2 ai-strategy.md (top-50 by recency) |
| AI confidence "low" rate cao | UX cảnh báo + khuyến khích user verify (đã trong flow §4.1 cho F-01; F-02 Q8-C cho phép edit row "+" trước Lưu) |
| Key bị extract khỏi APK → abuse | V2+: cho user paste key riêng trong Settings (Google API Console quota limit) |
| AI trả ingredient name không khớp Vietnamese chuẩn | **Đã giải quyết V1 qua Q5-C**: local fuzzy-match (normalize + Levenshtein) auto re-link Lev=0, confirm modal cho Lev∈{1,2}. |
| AI hallucinate nutrition cho ingredient lạ | **Mitigation V1 qua Q7-B + Q8-C**: confidence per ingredient + cho user edit nutrition trước Lưu qua sheet con. Phase 2: cross-check với F-01 lookup nếu confidence='low'. |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-30 | Initial draft — chốt 10 quyết định + scope + flow + file list + test plan |
| 1.1 | 2026-04-30 | Audit fix (9 findings): B1 class names không suffix `Service` (Style 2025 CI guard) → `GeminiClient` + `NutritionAi`. B2 entry point `app.ts` (`class App`), không còn `app.component.ts`. S1 `db.execute` thay `db.run`. S2 cleanup dùng SQL `datetime('now', '-N days')` thay JS `toISOString()` (mismatch format). S3 `*ngIf` → `@if`. M1 `ZodSchema` → `z.ZodType`. M2 NetworkStore listener pattern. M3 wording §1.3 F-04. |
| 1.2 | 2026-04-30 | Lock 8 + 4 F-02 design decisions Q1-Q12: §2-bis bảng quyết định mới (Q1-Q8 lần đầu, Q11-Q12 patch khi audit ngược PRD §F-02 + ai-strategy §3.2 phát hiện 2 mismatch); §3.3 mở rộng `DishAutofillIngredient` (Q7); §4.2 rewrite F-02 flow + Q11+Q12-C confirm modal nguyên liệu mới + Q6-A atomic tx revised; §5 thêm util `vietnamese-fuzzy-match` + ai-lookup-sheet reuse Q8-C; §6.1 thêm 15 unit test case mới + §6.2 14 integration scenarios; §7 split F-01/F-02/Common acceptance + Q12-C validation; §8 mark Q5-C/Q7-B/Q8-C đã giải quyết risks. F-01 mark DONE. Cross-link: ai-strategy.md rev 1.4, PRD §F-02 đồng bộ. |

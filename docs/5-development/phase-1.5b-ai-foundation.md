# Phase 1.5B — AI Foundation

> **Trạng thái:** 🟡 Draft 1.0 (2026-04-30) — chốt scope, chờ implementation.
>
> **Mục tiêu:** Build GeminiService core + NutritionAiService + 2 prompt templates (F-01 AI Lookup + F-02 AI Auto-fill) để F-01/F-02 PRD complete-done. Infra dùng lại cho Phase 2 (AI Meal Plan day/week) và Phase 5 (Image / Menu Suggest / Insight / Training Plan).

---

## 1. Scope

### 1.1 In scope

| # | Deliverable | Detail |
|---|-------------|--------|
| 1 | `GeminiService` (core) | HTTP client gọi Gemini REST API, retry, JSON parsing, log vào `ai_chat_log`, network detection |
| 2 | `NutritionAiService` (wrapper) | 2 method: `lookupIngredient(name)`, `autofillDish(name, dbIngredients)` |
| 3 | 2 prompt templates | §3.2 Dish Auto-fill + §3.9 Ingredient Lookup (xem `docs/5-ai/ai-strategy.md`) |
| 4 | UI: AI button trong `ingredient-add` + `dish-add` | Trigger AI flow + bottom sheet preview |
| 5 | Bottom sheet preview | Sau khi AI trả → hiển thị form pre-fill, user edit + Lưu |
| 6 | `<app-ai-offline-banner>` component | Hiển thị khi offline (Capacitor Network) |
| 7 | Error handling | Toast theo §5.1 ai-strategy.md (đã update theo phase này) |
| 8 | API key obfuscation build step | Theo D3 — XOR + base64, runtime decode |
| 9 | Auto-cleanup `ai_chat_log` | Xóa row > 30 ngày khi app khởi động |
| 10 | Test suite | Unit test GeminiService (mock fetch) + NutritionAiService + integration emulator |

### 1.2 Out of scope (Phase 5)

- F-05 Image Analysis (`generateContentWithImage`)
- F-06 Menu Suggestions
- F-07 Daily/Weekly Insight
- F-11 Training Plan
- Settings UI cho user paste API key (V2+)

### 1.3 Out of scope (Phase 2)

- F-03 AI Meal Plan day/week (sẽ dùng infra Phase 1.5B + thêm method `planDay` / `planWeek` trong NutritionAiService)
- F-04 Daily summary computation

---

## 2. 10 Quyết định kiến trúc đã chốt

> Discussion ngày 2026-04-30 với user. Các quyết định này là source-of-truth cho implementation.

| # | Quyết định | Giá trị | Lý do |
|---|-----------|---------|-------|
| 1 | Service layer hierarchy | **2 layer**: `GeminiService` (core HTTP/retry/log) + `NutritionAiService` (business wrapper) | Đúng theo development-plan.md §155-156. Phase 5 thêm `FitnessAiService` / `InsightAiService` song song. |
| 2 | Gemini model | `gemini-2.5-flash` (cho cả 2 prompt) | Mới hơn 2.0-flash, accuracy tốt hơn cho tiếng Việt + ingredient matching, giá tương đương. |
| 3 | API key strategy | `environment.ts` + obfuscation (D3) | Ship dev key trong APK, XOR + base64. Không có Settings UI cho user paste key (V2+). |
| 4 | Quota limit | **Không quota** | Update D3 — Gemini paid tier không cap, dev tự chịu cost. Phù hợp với product-vision §248. |
| 5 | Logging strategy | Log full request/response + auto-cleanup row > 30 ngày | Cân bằng debug/audit + storage. Cleanup chạy trong `app.component` lúc init. |
| 6 | Retry strategy | Exponential backoff: 1s → 2s → 4s, max 3 attempts, chỉ retry 5xx + network timeout | Update §5.2 ai-strategy.md (cũ là 1 retry). Không retry 4xx (400/401/403/429 = user/key error). |
| 7 | Network detection | `@capacitor/network` plugin + `NetworkStore` (signal-based) | Pre-emptive guard: offline → disable AI button + show banner ngay. |
| 8 | Output format | Structured Output JSON Schema (`responseMimeType: 'application/json'` + `responseSchema`) + zod validate sau parse | Giảm fail rate parse JSON. Zod validate là defense-in-depth. |
| 9 | F-02 ingredient matching | Pass full DB ingredient list `[{id, name, category}]` vào prompt → AI tự match `ingredient_id` | AI semantic match tốt hơn local Levenshtein. ~50-100 ingredients sau seed → token cost chấp nhận được. |
| 10 | Confirm UX | Bottom sheet preview, user edit mọi field + Lưu | Standard pattern (Cal AI, MyFitnessPal). Phân biệt rõ data từ AI. |

---

## 3. Architecture Detail

### 3.1 Service Layer

```
features/management/ingredient-add (UI)
        │
        │ inject NutritionAiService
        ▼
NutritionAiService.lookupIngredient(name)
        │
        │ inject GeminiService
        ▼
GeminiService.generateContent(prompt, options)
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

### 3.2 GeminiService — interface

```typescript
// src/app/core/services/ai/gemini-service.ts

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

export class GeminiService {
  generateContent<T>(prompt: string, options: GeminiOptions, schema: ZodSchema<T>): Promise<T>;
  cleanupOldLogs(daysToKeep: number = 30): Promise<void>;
}
```

### 3.3 NutritionAiService — interface

```typescript
// src/app/core/services/ai/nutrition-ai-service.ts

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
  ingredients: Array<{
    name: string;
    gramWeight: number;       // 0.1–10000
    isInDb: boolean;
    matchedIngredientId?: string;   // chỉ có khi isInDb=true
  }>;
}

export class NutritionAiService {
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
    Network.getStatus().then(s => this._isOnline.set(s.connected));
    Network.addListener('networkStatusChange', s => this._isOnline.set(s.connected));
  }
}
```

UI usage:
```html
<app-ai-offline-banner *ngIf="!network.isOnline()" />
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
// app.component.ts
async ngOnInit() {
  await this.geminiService.cleanupOldLogs(30);
}

// gemini-service.ts
async cleanupOldLogs(daysToKeep: number): Promise<void> {
  const cutoff = new Date(Date.now() - daysToKeep * 86400_000).toISOString();
  await this.db.run(`DELETE FROM ai_chat_log WHERE created_at < ?`, [cutoff]);
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
     │ NutritionAiService.lookupIngredient("Ức gà luộc")
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

```
[dish-add page]
     │
     │ 1. User nhập tên "Phở bò"
     │ 2. User bấm 🤖 AI Auto-fill
     ▼
[Lấy DB ingredient list (id + name + category)]
     │
     ▼
[GeminiService.generateContent với prompt §3.2]
     │
     ▼
[AI trả ingredient list]
     │
     │ Cho mỗi ingredient:
     │ - isInDb=true + matchedIngredientId → link luôn
     │ - isInDb=false → gắn flag "Sẽ tạo mới"
     ▼
[Bottom sheet preview "Phở bò"]
  Servings: 1

  Nguyên liệu:
  ┌─────────────────────────────────┐
  │ ✓ Bánh phở              200 g  │ ← in DB
  │ ✓ Thịt bò               150 g  │ ← in DB
  │ ✓ Hành lá                10 g  │ ← in DB
  │ + Quế                     3 g  │ ← will create
  │ + Hồi                     2 g  │ ← will create
  └─────────────────────────────────┘

  Hint: 2 nguyên liệu mới sẽ được tạo trong DB.

  [Hủy]                       [Lưu]
     │
     │ User edit gram/xóa row nếu cần
     │ User bấm "Lưu"
     ▼
[Tạo ingredient mới trong DB cho row "+" với source='ai']
[Insert dish (type='ai_autofill', source='ai')]
[Insert dish_ingredient rows]
[Log vào ai_chat_log với feature='dish_autofill']
[Toast: "Đã lưu món"]
[Pop bottom sheet, refresh dish list]
```

---

## 5. File List

### 5.1 New files

```
src/app/core/services/ai/
  ├─ gemini-service.ts                  # GeminiService (HTTP/retry/log)
  ├─ gemini-service.spec.ts
  ├─ gemini-key.ts                      # decodeApiKey runtime
  ├─ gemini-types.ts                    # AiFeature, GeminiError, GeminiOptions
  ├─ nutrition-ai-service.ts            # NutritionAiService (lookupIngredient + autofillDish)
  ├─ nutrition-ai-service.spec.ts
  └─ prompts/
     ├─ ingredient-lookup.prompt.ts     # buildPrompt() + responseSchema + zodSchema
     ├─ ingredient-lookup.prompt.spec.ts
     ├─ dish-autofill.prompt.ts
     └─ dish-autofill.prompt.spec.ts

src/app/core/stores/
  ├─ network.store.ts                   # @capacitor/network signal store
  └─ network.store.spec.ts

src/app/shared/components/
  ├─ ai-offline-banner/
  │  ├─ ai-offline-banner.ts
  │  ├─ ai-offline-banner.html
  │  └─ ai-offline-banner.scss
  ├─ ai-lookup-sheet/                   # Bottom sheet F-01 preview
  │  ├─ ai-lookup-sheet.ts
  │  ├─ ai-lookup-sheet.html
  │  ├─ ai-lookup-sheet.scss
  │  └─ ai-lookup-sheet.spec.ts
  └─ ai-autofill-sheet/                 # Bottom sheet F-02 preview
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
  → Thêm 🤖 AI Lookup button + integrate NutritionAiService

src/app/features/management/dish-add/dish-add.page.{ts,html}
  → Thêm 🤖 AI Auto-fill button + integrate NutritionAiService

src/app/app.component.ts
  → ngOnInit: gọi geminiService.cleanupOldLogs(30)

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
| `gemini-service.spec.ts` | Mock fetch → verify retry logic 5xx (1s→2s→4s, max 3) | Retry algorithm |
| `gemini-service.spec.ts` | Mock fetch → verify NO retry trên 4xx | Error classification |
| `gemini-service.spec.ts` | Mock DB → verify ai_chat_log insert sau success/fail | Logging |
| `gemini-service.spec.ts` | Mock DB → cleanupOldLogs(30) → verify DELETE WHERE created_at < cutoff | Cleanup |
| `gemini-service.spec.ts` | Mock fetch → invalid JSON → zod fail → retry → final throw | Parse error path |
| `gemini-key.spec.ts` | Round-trip obfuscate/decode | Key obfuscation |
| `nutrition-ai-service.spec.ts` | Mock GeminiService → call lookupIngredient → assert prompt contains tên | Prompt building |
| `nutrition-ai-service.spec.ts` | Mock → call autofillDish → assert prompt contains DB ingredient list | Pass-DB-list strategy |
| `network.store.spec.ts` | Mock Capacitor Network → assert isOnline signal sync | NetworkStore |
| `ai-offline-banner.spec.ts` | Render khi `isOnline=false` | UI |
| `ai-lookup-sheet.spec.ts` | Render với data → user edit field → emit save | Bottom sheet F-01 |
| `ai-autofill-sheet.spec.ts` | Render list ingredients → mark "+" cho new → emit save | Bottom sheet F-02 |

### 6.2 Integration tests (emulator)

1. Cài app với dev key, ingredient-add → AI Lookup "Ức gà" → bottom sheet hiện lên với data
2. User edit calories → bấm Lưu → verify ingredient được insert với `source='ai'`
3. Dish-add → AI Auto-fill "Phở bò" → bottom sheet hiện list với ingredients DB matched
4. Bấm Lưu → verify dish + dish_ingredient + ingredient mới (cho "+") được insert
5. Tắt wifi → AI button disabled + offline banner hiện
6. Bật lại wifi → banner ẩn + button enabled

### 6.3 Coverage target

- GeminiService + NutritionAiService: ≥ 90% line coverage (core infra)
- Bottom sheet components: ≥ 80%
- NetworkStore: 100%

---

## 7. Acceptance Criteria

- [ ] User mở ingredient-add → nhập tên → bấm AI Lookup → bottom sheet hiện nutrition preview
- [ ] User edit nutrition trong bottom sheet → Lưu → ingredient lưu vào DB với `source='ai'`
- [ ] User mở dish-add → nhập tên món → bấm AI Auto-fill → bottom sheet hiện ingredient list với DB matched
- [ ] Bấm Lưu → dish + ingredients được lưu, ingredient mới (`isInDb=false`) được tạo với `source='ai'`
- [ ] Offline → AI button disabled + `<app-ai-offline-banner>` hiện
- [ ] HTTP 5xx → retry 3 lần exp backoff → fail thì toast "AI đang bận"
- [ ] Duplicate ingredient AI lookup → alert cho user chọn cập nhật cũ / tạo mới
- [ ] Mọi request được log vào `ai_chat_log` với feature đúng
- [ ] App khởi động → cleanup row `ai_chat_log` > 30 ngày
- [ ] `gemini-2.5-flash` model + Structured Output JSON Schema được dùng
- [ ] Key obfuscated trong APK production (verify bằng `unzip -p app.apk … | grep AIzaSy` → KHÔNG có)
- [ ] All tests pass: 180 cũ + ~30 mới
- [ ] Lint + guards + build pass
- [ ] APK install + manual smoke test pass

---

## 8. Out-of-scope risks (theo dõi cho Phase 2/5)

| Risk | Mitigation tương lai |
|------|----------------------|
| Token cost tăng khi DB ingredient list lớn (>200 items) | Phase 5: implement DB context pruning §4.2 ai-strategy.md (top-50 by recency) |
| AI confidence "low" rate cao | UX cảnh báo + khuyến khích user verify (đã trong flow §4.1) |
| Key bị extract khỏi APK → abuse | V2+: cho user paste key riêng trong Settings (Google API Console quota limit) |
| AI trả ingredient name không khớp Vietnamese chuẩn | Post-process: dùng `removeAccents` + Levenshtein làm fallback nếu `is_in_db=false` nhưng tên gần với DB |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-30 | Initial draft — chốt 10 quyết định + scope + flow + file list + test plan |

# BUG-TRANSLATE-001: All English Food Names Identical to Vietnamese

## Summary
All ingredient and dish English names in localStorage were copies of the Vietnamese names instead of actual English translations.

## Severity
**High** — Core i18n feature completely non-functional.

## Environment
- OS: macOS (Apple Silicon M4 Pro)
- Browser: Chrome 136
- App: Smart Meal Planner (localhost:3000)
- Language: English (detected by i18next)

## Steps to Reproduce
1. Open the app at `localhost:3000`
2. Navigate to Library → Ingredients tab
3. Observe ingredient names — all display Vietnamese text even when UI language is English

## Expected Result
Ingredient names display in English (e.g., "Chicken breast", "Salmon", "Broccoli").

## Actual Result
All ingredient names display Vietnamese text (e.g., "Ức gà", "Cá hồi", "Bông cải xanh") even when the app language is set to English.

## Evidence

### localStorage data (before fix)
```json
[
  { "vi": "Ức gà",          "en": "Ức gà" },
  { "vi": "Trứng gà",       "en": "Trứng gà" },
  { "vi": "Yến mạch",       "en": "Yến mạch" },
  { "vi": "Sữa chua Hy Lạp","en": "Sữa chua Hy Lạp" },
  { "vi": "Khoai lang",     "en": "Khoai lang" },
  { "vi": "Bông cải xanh",  "en": "Bông cải xanh" },
  { "vi": "Thịt bò nạc",    "en": "Thịt bò nạc" },
  { "vi": "Gạo lứt",        "en": "Gạo lứt" },
  { "vi": "Cá hồi",         "en": "Cá hồi" },
  { "vi": "Hạt chia",       "en": "Hạt chia" },
  { "vi": "Rau bina",       "en": "Rau bina" },
  { "vi": "Cam tươi",       "en": "Cam tươi" },
  { "vi": "Đậu phụ",        "en": "Đậu phụ" }
]
```

## Root Cause Analysis

### Primary: WASM model never loaded
The translate worker uses `@xenova/transformers` to load opus-mt WASM models (~103MB per direction). The model loading fails silently — `workerReady` is set to `true` when the worker script initializes, but actual model inference fails. Since the ML pipeline was the only translation mechanism, all translations produced empty or identical results.

### Secondary: `scanMissing` logic gap
The `scanMissing` function in `translateQueueService.ts` only checked `!other` (empty string) to detect missing translations. When `name.en === name.vi` (both contain Vietnamese text), the condition evaluated to `false` because the EN field was truthy — so corrupted data was never re-queued for translation.

### Tertiary: Wrong translation direction
Even after fixing the detection logic, `scanMissing` with `currentLang='en'` would enqueue `en-vi` direction (translating "Ức gà" as if it were English). The Vietnamese text needs `vi-en` direction instead.

## Fix Applied

### 1. Static food dictionary (ADR 004)
Created `src/data/foodDictionary.ts` with 200+ bilingual entries. Dictionary lookup is ~0ms and covers all common food terms.

### 2. Instant translation at save time
Modified `App.tsx` to apply dictionary translations immediately when saving ingredients/dishes — no worker round-trip needed for known terms.

### 3. Worker fast-path
Modified `translate.worker.ts` to check the dictionary before attempting WASM model inference.

### 4. Fixed `scanMissing` detection
Updated `translateQueueService.ts`:
- Detects `name.en === name.vi` as untranslated (not just empty EN)
- When both names are identical, always translates `vi→en` (data originated in Vietnamese)

## Verification

### localStorage data (after fix)
```json
[
  { "vi": "Ức gà",          "en": "Chicken breast" },
  { "vi": "Trứng gà",       "en": "Chicken egg" },
  { "vi": "Yến mạch",       "en": "Oats" },
  { "vi": "Sữa chua Hy Lạp","en": "Greek yogurt" },
  { "vi": "Khoai lang",     "en": "Sweet potato" },
  { "vi": "Bông cải xanh",  "en": "Broccoli" },
  { "vi": "Thịt bò nạc",    "en": "Lean beef" },
  { "vi": "Gạo lứt",        "en": "Brown rice" },
  { "vi": "Cá hồi",         "en": "Salmon" },
  { "vi": "Hạt chia",       "en": "Chia seeds" },
  { "vi": "Rau bina",       "en": "Spinach" },
  { "vi": "Cam tươi",       "en": "Fresh orange" },
  { "vi": "Đậu phụ",        "en": "Tofu" }
]
```

Translation time: **0ms** (instant dictionary lookup).

## Files Changed
| File | Change |
|------|--------|
| `src/data/foodDictionary.ts` | NEW — 200+ entry bilingual dictionary |
| `src/__tests__/foodDictionary.test.ts` | NEW — 30 test cases |
| `src/workers/translate.worker.ts` | Dictionary fast-path before WASM |
| `src/App.tsx` | Instant dictionary translation on save |
| `src/services/translateQueueService.ts` | Fixed scanMissing detection + direction |

## Status
**CLOSED** — Fixed and verified. Commit `93fd037`.

# ADR 004: Food Dictionary for Instant Translation

## Status
Accepted

## Date
2026-03-08

## Context
The app uses `LocalizedString` (`{ vi, en }`) for ingredient and dish names. Background translation was handled by a Web Worker loading opus-mt WASM models (~103MB per direction) via `@xenova/transformers`. However:

1. **The WASM models never loaded successfully** — `workerReady` stayed `false`, silently failing.
2. **All English names were copies of Vietnamese** — e.g., `{ vi: "Ức gà", en: "Ức gà" }` instead of `{ vi: "Ức gà", en: "Chicken breast" }`.
3. **Model size is prohibitive** — 103MB per direction (206MB total) for a food planning app.
4. **Translation latency** — Even when working, WASM ML inference takes 500ms–2s per term.

Options considered:
1. **Fix WASM model loading** — Debug opus-mt model path/config. Still 206MB download, slow inference.
2. **Use online translation API** — Requires internet, API keys, latency, costs.
3. **Static bilingual dictionary** — Zero latency, zero download, covers 95%+ of food terms.
4. **Dictionary + WASM fallback** — Best of both worlds: instant for known terms, ML for rare terms.

## Decision
Use a **static bilingual food dictionary** (`src/data/foodDictionary.ts`) as the primary translation method, with the WASM model retained as an optional fallback for terms not in the dictionary.

## Rationale
- **Coverage**: 200+ common food terms cover virtually all ingredients and dishes users will add in a Vietnamese meal planning app.
- **Performance**: Dictionary lookup is O(1) via `Map.get()` — effectively 0ms vs 500ms–2s for ML inference.
- **Reliability**: No model loading, no ONNX runtime, no WebAssembly — just a plain TypeScript Map.
- **Bundle size**: Dictionary adds ~5KB vs 103MB+ for WASM models.
- **Maintainability**: Adding new terms is a one-line edit to the `RAW_ENTRIES` array.
- **Synonyms**: Multiple Vietnamese terms can map to the same English term (e.g., Đậu phụ/Đậu hũ/Tàu hũ → Tofu).

## Architecture

```
User saves ingredient/dish
        │
        ▼
  App.tsx — lookupFoodTranslation(text, direction)
        │
        ├── Dictionary HIT (~0ms) → Apply translation immediately
        │                           No worker round-trip needed
        │
        └── Dictionary MISS → enqueue to translateQueueService
                                  │
                                  ▼
                            translate.worker.ts
                                  │
                                  ├── Dictionary check (retry)
                                  └── WASM model fallback
```

## Translation Layers (priority order)

| Layer | Latency | Coverage | When |
|-------|---------|----------|------|
| 1. Dictionary at save-time (App.tsx) | ~0ms | 95%+ | On add/update ingredient/dish |
| 2. Dictionary in worker | ~0ms | 95%+ | On scanMissing / queued jobs |
| 3. WASM opus-mt model | 500ms–2s | ~100% | Fallback for unknown terms |

## Consequences
- New food terms must be added to `foodDictionary.ts` for instant translation.
- The WASM model files in `public/models/` can be removed if dictionary coverage is deemed sufficient.
- Dictionary entries should match `initialData.ts` names exactly.
- First entry wins for en→vi direction (handles synonyms gracefully).

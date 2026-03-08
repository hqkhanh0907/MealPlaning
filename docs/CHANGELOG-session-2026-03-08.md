# Changelog — Session 2026-03-08

## Summary

Instant food name translation via static dictionary. Fixed broken English translations (all EN names were copies of Vietnamese) by adding a 200+ entry bilingual dictionary for ~0ms lookups, eliminating dependency on the 103MB WASM opus-mt model for common food terms. Fixed `scanMissing` logic to detect and repair existing corrupted data on page load.

---

## Changes

### Features

- **Instant food dictionary** (`src/data/foodDictionary.ts`) — New static bilingual dictionary with 200+ Vietnamese↔English food terms
  - Covers: proteins, seafood, dairy, grains, vegetables, fruits, nuts/legumes, oils, condiments, common dishes
  - Case-insensitive, trimmed lookup via `lookupFoodTranslation(text, direction)`
  - Synonyms supported (e.g., Đậu phụ/Đậu hũ/Tàu hũ → Tofu)
  - First-entry-wins for en→vi reverse lookup (primary form preserved)

### Bug Fixes

- **BUG-TRANSLATE-001** — All English food names were identical to Vietnamese names (e.g., "Ức gà" → "Ức gà" instead of "Chicken breast")
  - Root cause: opus-mt WASM model (~103MB) never loaded successfully; `workerReady` stayed `false`
  - Fix: Dictionary fast-path in `translate.worker.ts` bypasses WASM model entirely for known terms
  - Fix: `App.tsx` now applies dictionary translations instantly at save time (no worker round-trip needed)
  - Fix: `scanMissing` in `translateQueueService.ts` now detects `name.en === name.vi` as untranslated and re-translates vi→en

### Code Changes

| File | Change |
|------|--------|
| `src/data/foodDictionary.ts` | **NEW** — Static bilingual food dictionary (200+ entries) |
| `src/__tests__/foodDictionary.test.ts` | **NEW** — 30 test cases for dictionary lookups |
| `src/workers/translate.worker.ts` | **MODIFIED** — Added dictionary fast-path before WASM model fallback |
| `src/App.tsx` | **MODIFIED** — Instant dictionary translation on save; skip worker for known terms |
| `src/services/translateQueueService.ts` | **MODIFIED** — `scanMissing` detects identical vi/en as untranslated |

### Documentation

- **ADR 004** — Food dictionary for instant translation
- **SAD** v2.1 — Updated Background Translation Architecture with dictionary layer
- **Sequence Diagrams** v1.2 — Updated SD-09 with dictionary fast-path
- **Test Report** v6.0 — Updated test counts (995→1046), coverage, BUG-TRANSLATE-001
- **localStorage Schema** v2.1 — Added `foodDictionary` reference
- **Changelog**: This file

---

## Test Results

| Metric | Result |
|--------|--------|
| Unit Tests | **1046 / 1046 Pass** ✅ |
| Test Files | **49 / 49 Pass** ✅ |
| Lint | **0 errors, 0 warnings** ✅ |
| Coverage (Stmts) | **99.53%** ✅ |
| Coverage (Branch) | **92.30%** ✅ |
| Coverage (Funcs) | **99.66%** ✅ |
| Coverage (Lines) | **100%** ✅ |

---

## Translation Verification

All 13 ingredients and 7 dishes now display correct English names:

| Vietnamese | English | Status |
|-----------|---------|--------|
| Ức gà | Chicken breast | ✅ |
| Trứng gà | Chicken egg | ✅ |
| Yến mạch | Oats | ✅ |
| Sữa chua Hy Lạp | Greek yogurt | ✅ |
| Khoai lang | Sweet potato | ✅ |
| Bông cải xanh | Broccoli | ✅ |
| Thịt bò nạc | Lean beef | ✅ |
| Gạo lứt | Brown rice | ✅ |
| Cá hồi | Salmon | ✅ |
| Hạt chia | Chia seeds | ✅ |
| Rau bina | Spinach | ✅ |
| Cam tươi | Fresh orange | ✅ |
| Đậu phụ | Tofu | ✅ |

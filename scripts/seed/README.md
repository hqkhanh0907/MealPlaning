# Vietnamese Core Seed Pipeline (Phase 1 §5.2)

This directory builds the offline seed shipped with the app: ~atomic VN ingredients,
composite recipes (broth/dipping sauce/base), and 20 curated Vietnamese dishes
(6 sáng / 7 trưa / 7 tối).

**Spec:** Code-canonical sau cleanup 2026-04-29. Tham chiếu:
- PRD F-01/F-02 — `docs/2-requirements/prd.md`
- Schema — `docs/3-design/data-model.md`
- Business rule — `docs/4-architecture/business-rules.md`
- Implementation — `src/app/features/management/` + `src/app/core/repositories/`

## Files

```
scripts/seed/
├── types.ts               # Shared TypeScript shapes
├── build.ts               # Orchestrator (npm run seed:build)
├── curated/
│   ├── vi-ingredients.ts  # Atomic ingredients
│   ├── vi-composites.ts   # Composite recipes (sum-derived macro)
│   ├── vi-dishes.ts       # 20 curated dishes
│   └── sources/
│       ├── vien-dinh-duong.md   # Citations to Bảng thành phần dinh dưỡng VN
│       └── wikipedia-vi.md      # Citations to Wikipedia VI / open sources
└── README.md (this file)
```

## Usage

```bash
npm run seed:typecheck   # Strict TS check on the seed scripts
npm run seed:build       # Rebuild the JSON artifacts in src/assets/seed/
```

The build is **fully offline** — no network calls, no API keys.

## Macro source policy

| Source | When to use | Citation requirement |
|--------|-------------|----------------------|
| `vien-dinh-duong` | Bảng thành phần dinh dưỡng thực phẩm Việt Nam (Viện Dinh Dưỡng) | Page + item code in `sources/vien-dinh-duong.md` |
| `wikipedia-vi` | Fallback when VDDT lacks per-100 detail | URL + permalink in `sources/wikipedia-vi.md` |
| `manual` | No public source available | `notes` explaining derivation; consider `is_approximate: true` |
| `derived` | Set automatically by `build-composites.ts` for composite ingredients | Generated, do not author by hand |

## Determinism

JSON output must be byte-identical between runs. Build scripts will sort
arrays by `id` and stringify with stable key order before writing. CI
verifies via `git diff --exit-code`.

## Status

- §5.2.1 ✅ scaffolding (this commit) — types + curated stubs + build skeleton
- §5.2.2 ⏭ build-ingredients.ts + AC1–AC5
- §5.2.3 ⏭ build-composites.ts + AC6–AC9
- §5.2.4 ⏭ build-dishes.ts + validate-seed.ts + AC10–AC15
- §5.2.5 ⏭ V5 migration (`seed_artifact` table)
- §5.2.6 ⏭ SeedLoaderService + idempotency tests
- §5.2.7 ⏭ App bootstrap integration
- §5.2.8 ⏭ Emulator smoke test

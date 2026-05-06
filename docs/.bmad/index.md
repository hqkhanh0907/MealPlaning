# HealthMate AI — Documentation Index

**Type:** Monolith (1 part)
**Primary Language:** TypeScript (strict, no `any`)
**Architecture:** Layered (core / shared / features) — Signal-driven, offline-first
**Last Updated:** 2026-05-06

> 📌 Đây là **AI-generated brownfield context** sinh bởi `bmad-document-project` (BMAD Method v6.6.0).
> Source-of-truth thật vẫn là 17 docs canonical trong `docs/`. File ở `docs/.bmad/` chỉ phục vụ AI agent (BMAD Mary/John/Winston/Sally/Amelia/Paige) khi cần grounding nhanh.
> **KHÔNG sửa file ở đây thủ công** — sửa canonical rồi re-run BMAD.

## Project Overview

HealthMate AI là **mobile app Android-only, offline-first, single-user** giúp người Việt lập kế hoạch ăn uống + tập luyện theo mục tiêu dinh dưỡng cá nhân hóa, có hỗ trợ AI (Google Gemini) auto-fill dish/recipe.

## Quick Reference

- **Tech Stack:** Angular 21 + Ionic 8 + Capacitor 8 + SQLite (sql.js WASM cho web/test, @capacitor-community/sqlite cho Android)
- **AI:** Google Gemini (dish autofill, nutrition lookup)
- **Entry Point:** `src/main.ts` → `AppComponent` (`IonApp + IonRouterOutlet`)
- **Architecture Pattern:** Layered standalone components, Signal-based state, repository pattern, dual-DB abstraction
- **Database:** SQLite local, schema version 6, 18 tables
- **Deployment:** Android APK (Gradle 8.14, AGP 8.13, compileSdk 36, minSdk 24)

## Generated Documentation (BMAD)

### Core Documentation
- [Project Overview](./project-overview.md) — Executive summary + tech stack table
- [Source Tree Analysis](./source-tree-analysis.md) — Annotated `src/` structure
- [Architecture](./architecture.md) — Layering, DI, dual-DB, AI integration
- [Data Models](./data-models.md) — 18 tables tóm tắt + ref ngược canonical
- [State Management](./state-management.md) — Signal stores pattern
- [UI Component Inventory](./ui-component-inventory.md) — 10 shared components + 6 feature areas

### Canonical Source Documents (in `docs/`)
> Đây là source-of-truth chính. BMAD chỉ tham chiếu, không đè.

#### 1. Vision
- [`docs/1-vision/product-vision.md`](../1-vision/product-vision.md)
- [`docs/1-vision/personas-jtbd.md`](../1-vision/personas-jtbd.md)

#### 2. Requirements
- [`docs/2-requirements/prd.md`](../2-requirements/prd.md) — Product Requirements

#### 3. Design
- [`docs/3-design/data-model.md`](../3-design/data-model.md) — Schema decision (100g canonical, dish-first)
- [`docs/3-design/design-system.md`](../3-design/design-system.md) — Tokens v2025
- [`docs/3-design/business-rules.md`](../3-design/business-rules.md)
- [`docs/3-design/mockups/`](../3-design/mockups/) — HTML mockups

#### 4. Architecture
- [`docs/4-architecture/architecture.md`](../4-architecture/architecture.md)
- [`docs/4-architecture/business-rules.md`](../4-architecture/business-rules.md)
- [`docs/4-architecture/coding-conventions.md`](../4-architecture/coding-conventions.md) — PC-1, naming, style

#### 5. AI & Development
- [`docs/5-ai/ai-strategy.md`](../5-ai/ai-strategy.md) — Gemini integration
- [`docs/5-development/development-plan.md`](../5-development/development-plan.md)
- [`docs/5-development/deferred-items.md`](../5-development/deferred-items.md)
- [`docs/5-development/signal-forms-migration-plan.md`](../5-development/signal-forms-migration-plan.md)
- [`docs/5-development/phase-1.5b-ai-foundation.md`](../5-development/phase-1.5b-ai-foundation.md)

## How to Use This Index

| Khi anh muốn... | Đọc... |
|---|---|
| BMAD agent có context nhanh để làm việc | `_bmad/project-context.md` (8 mục cô đọng) |
| Hiểu cấu trúc code thực tế | `source-tree-analysis.md` |
| Hiểu kiến trúc tổng thể | `architecture.md` (BMAD) → `docs/4-architecture/architecture.md` (canonical) |
| Tra schema DB | `data-models.md` (BMAD summary) → `docs/3-design/data-model.md` (canonical) → `src/app/core/services/database/schema.ts` (code) |
| Tra business rules | `docs/3-design/business-rules.md` (canonical) |
| Tra design tokens / UI rule | `docs/3-design/design-system.md` (canonical) |
| Bắt đầu PRD mới (brownfield) | Trỏ workflow `bmad-create-prd` vào `docs/.bmad/index.md` này |

## Verification After Generation

- ✅ `_bmad/_config/manifest.yaml` lists installed modules with versions/SHAs
- ✅ `.claude/skills/bmad-help/SKILL.md` readable
- ✅ Symlinks `~/.hermes/skills/bmad/bmad-*` (42 entries)
- ✅ Output ghi vào `docs/.bmad/` (KHÔNG đè canonical docs)

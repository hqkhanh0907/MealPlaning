---
title: 'ADR-001: Local Storage Only'
status: Active
version: 1.0
owner: Tech Leader
updated: 2026-04-12
related: []
---

# ADR 001: Local Storage Only — No Backend

## Status

**Superseded** — Replaced by SQLite dual-layer architecture (V1 rebuild, 2026-Q2).

> **⚠️ LEGACY ADR**: This decision was made for the initial prototype. The V1 rebuild uses **SQLite** as the persistence layer:
>
> - **Web/Tests**: `WebDatabaseService` (sql.js WASM, in-memory)
> - **Android**: `NativeDatabaseService` (@capacitor-community/sqlite, disk-based)
> - **Zustand persist** (localStorage) is only used for non-critical stores: `appOnboardingStore`, `fitnessStore` UI state.
>
> See `docs/4-architecture/sad.md` §2.3 for current architecture.

## Date

2025-01-01

## Context

Smart Meal Planner is a personal nutrition tracking app. We needed to decide on a data persistence strategy. Options considered:

1. **Remote backend** (e.g., Firebase, Supabase) — cloud-synced, multi-device.
2. **localStorage** — zero infrastructure, offline-first, instant reads/writes.
3. **IndexedDB** — more capacity, async API, more complex.

## Decision

Use **localStorage** as the sole persistence layer.

## Rationale

- **Zero cost**: No server, no database, no hosting fees.
- **Offline-first**: Works without internet. Only AI features require network.
- **Privacy**: All user data stays on-device. No PII leaves the browser.
- **Simplicity**: `usePersistedState` hook wraps `JSON.parse/stringify` — trivial to implement and test.
- **Sufficient capacity**: ~5MB per origin. Meal planning data is small (typically <100KB).

## Trade-offs

- No multi-device sync.
- Data lost if user clears browser storage (mitigated by export/import feature).
- No server-side backup (mitigated by manual JSON export).

## Consequences

- All state is managed via `usePersistedState` hook with `mp-*` prefixed keys.
- Migration logic (`dataService.ts`) handles schema evolution in localStorage.
- Export/Import feature in Settings provides manual backup capability.

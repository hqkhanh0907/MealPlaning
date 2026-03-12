# Scenario 24: Data Migration & Error Recovery

**Version:** 1.0  
**Date:** 2026-03-12  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Data Migration & Error Recovery bao gồm khả năng app xử lý data corruption, schema changes, localStorage quota limits, và recovery từ các trạng thái lỗi. Khi app update → schema có thể thay đổi → migration logic chuyển đổi dữ liệu cũ sang format mới. Error recovery xử lý corrupt data, missing keys, invalid states.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| App.tsx | App.tsx | Init & error boundary |
| usePersistedState | hooks/usePersistedState.ts | Data persistence |
| DataBackup | DataBackup.tsx | Backup/restore |
| ErrorBoundary | components/ | Error catching |

## Luồng nghiệp vụ

1. App starts → check localStorage data
2. If schema version mismatch → run migration
3. If data corrupt → attempt recovery → fallback to defaults
4. If localStorage full → warn user → suggest cleanup/export
5. Runtime errors → ErrorBoundary catches → show recovery UI

## Quy tắc nghiệp vụ

1. Schema version tracked in metadata
2. Migration: additive (new fields get defaults, no data loss)
3. Corrupt data: JSON parse fail → try partial recovery → fallback defaults
4. Missing keys: use defaults (not crash)
5. localStorage quota: ~5MB typical → warn at 80%
6. ErrorBoundary: catch render errors → show "Something went wrong" + retry

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_DME_01 | App starts with fresh localStorage | Positive | P0 |
| TC_DME_02 | App starts with valid existing data | Positive | P0 |
| TC_DME_03 | App starts with old schema version | Positive | P0 |
| TC_DME_04 | Migration: old → current schema | Positive | P0 |
| TC_DME_05 | Migration: new fields get defaults | Positive | P0 |
| TC_DME_06 | Migration: existing data preserved | Positive | P0 |
| TC_DME_07 | Migration: no data loss | Positive | P0 |
| TC_DME_08 | Migration: multi-version jump (v1→v3) | Edge | P1 |
| TC_DME_09 | Migration: sequential (v1→v2→v3) | Positive | P1 |
| TC_DME_10 | Migration success notification | Positive | P2 |
| TC_DME_11 | Corrupt JSON in localStorage | Negative | P0 |
| TC_DME_12 | Partial JSON (truncated) | Negative | P0 |
| TC_DME_13 | Empty localStorage | Positive | P1 |
| TC_DME_14 | Missing ingredients key | Edge | P1 |
| TC_DME_15 | Missing dishes key | Edge | P1 |
| TC_DME_16 | Missing plans key | Edge | P1 |
| TC_DME_17 | Missing settings key | Edge | P1 |
| TC_DME_18 | Missing goals key | Edge | P1 |
| TC_DME_19 | Missing templates key | Edge | P1 |
| TC_DME_20 | Extra unknown keys → ignored | Edge | P2 |
| TC_DME_21 | Null value for required field | Negative | P1 |
| TC_DME_22 | Undefined value handling | Negative | P1 |
| TC_DME_23 | Wrong type (string where number expected) | Negative | P1 |
| TC_DME_24 | Negative ID values | Negative | P2 |
| TC_DME_25 | Duplicate IDs | Negative | P1 |
| TC_DME_26 | Orphan references (dish refs deleted ingredient) | Edge | P1 |
| TC_DME_27 | Circular references | Edge | P2 |
| TC_DME_28 | Very large data (4.9MB approaching limit) | Boundary | P1 |
| TC_DME_29 | localStorage at quota → write fails | Negative | P0 |
| TC_DME_30 | Quota warning at 80% usage | Positive | P1 |
| TC_DME_31 | Quota exceeded → user notification | Positive | P0 |
| TC_DME_32 | Quota → suggest export/cleanup | Positive | P1 |
| TC_DME_33 | Quota → cleanup old data | Positive | P2 |
| TC_DME_34 | localStorage disabled (private browsing) | Negative | P1 |
| TC_DME_35 | localStorage blocked by browser | Negative | P2 |
| TC_DME_36 | Third-party cookie restrictions | Edge | P2 |
| TC_DME_37 | ErrorBoundary catches render error | Positive | P0 |
| TC_DME_38 | ErrorBoundary shows fallback UI | Positive | P0 |
| TC_DME_39 | ErrorBoundary retry button | Positive | P1 |
| TC_DME_40 | Retry → recovers from transient error | Positive | P1 |
| TC_DME_41 | Retry → still fails → show details | Positive | P1 |
| TC_DME_42 | Error details: component stack | Positive | P2 |
| TC_DME_43 | Error details: error message | Positive | P2 |
| TC_DME_44 | Reset app button in error UI | Positive | P1 |
| TC_DME_45 | Reset → clears corrupt data → fresh start | Positive | P1 |
| TC_DME_46 | Export data from error state | Positive | P1 |
| TC_DME_47 | Error reporting (if implemented) | Positive | P3 |
| TC_DME_48 | Ingredient with invalid nutrition values | Edge | P1 |
| TC_DME_49 | Dish with 0 ingredients after migration | Edge | P2 |
| TC_DME_50 | Plan referencing non-existent dish | Edge | P1 |
| TC_DME_51 | Template referencing deleted dishes | Edge | P1 |
| TC_DME_52 | Goal with NaN values | Edge | P1 |
| TC_DME_53 | Setting with invalid enum value | Edge | P2 |
| TC_DME_54 | Language setting invalid → default vi | Edge | P1 |
| TC_DME_55 | Theme setting invalid → default light | Edge | P1 |
| TC_DME_56 | Date strings invalid format | Edge | P1 |
| TC_DME_57 | UTF-8 encoding issues | Edge | P2 |
| TC_DME_58 | BOM character in data | Edge | P3 |
| TC_DME_59 | Data from different app version | Edge | P1 |
| TC_DME_60 | Data from different platform (iOS vs web) | Edge | P2 |
| TC_DME_61 | Recovery: auto-fix orphan refs | Positive | P2 |
| TC_DME_62 | Recovery: auto-fix invalid types | Positive | P2 |
| TC_DME_63 | Recovery: auto-fix duplicate IDs | Positive | P2 |
| TC_DME_64 | Recovery: auto-fix NaN values | Positive | P2 |
| TC_DME_65 | Recovery: auto-fix negative amounts | Positive | P2 |
| TC_DME_66 | Recovery log (what was fixed) | Positive | P3 |
| TC_DME_67 | Recovery preserves maximum data | Positive | P1 |
| TC_DME_68 | Recovery notification | Positive | P2 |
| TC_DME_69 | Partial recovery (some data saved) | Positive | P1 |
| TC_DME_70 | Full recovery failure → defaults | Positive | P1 |
| TC_DME_71 | Network error recovery | Positive | P1 |
| TC_DME_72 | API error recovery | Positive | P1 |
| TC_DME_73 | Sync conflict recovery | Positive | P2 |
| TC_DME_74 | Translation error recovery | Positive | P2 |
| TC_DME_75 | Image analysis error recovery | Positive | P2 |
| TC_DME_76 | File import error recovery | Positive | P1 |
| TC_DME_77 | Concurrent operation error | Edge | P2 |
| TC_DME_78 | Race condition handling | Edge | P2 |
| TC_DME_79 | Memory pressure handling | Edge | P2 |
| TC_DME_80 | CPU throttle handling | Edge | P3 |
| TC_DME_81 | Dark mode error state | Positive | P2 |
| TC_DME_82 | i18n error messages | Positive | P2 |
| TC_DME_83 | Mobile error layout | Positive | P2 |
| TC_DME_84 | Desktop error layout | Positive | P2 |
| TC_DME_85 | Error state accessibility | Positive | P3 |
| TC_DME_86 | Keyboard navigation in error UI | Positive | P3 |
| TC_DME_87 | Screen reader error announcement | Positive | P3 |
| TC_DME_88 | Auto-backup before migration | Positive | P1 |
| TC_DME_89 | Rollback migration if fails | Positive | P1 |
| TC_DME_90 | Migration dry-run (preview) | Positive | P3 |
| TC_DME_91 | Migration performance (<500ms) | Boundary | P2 |
| TC_DME_92 | Large data migration (1000 items) | Boundary | P2 |
| TC_DME_93 | Migration idempotent (run twice = same result) | Positive | P1 |
| TC_DME_94 | Multiple migrations in sequence | Positive | P2 |
| TC_DME_95 | Crash during migration → recover | Edge | P1 |
| TC_DME_96 | Power loss during write → recovery | Edge | P2 |
| TC_DME_97 | Browser crash recovery | Edge | P2 |
| TC_DME_98 | Tab close during operation → data consistent | Edge | P2 |
| TC_DME_99 | Multiple tabs open → data consistency | Edge | P1 |
| TC_DME_100 | Service worker cache invalidation | Edge | P3 |
| TC_DME_101 | IndexedDB fallback (if localStorage fails) | Positive | P3 |
| TC_DME_102 | Data validation on every write | Positive | P2 |
| TC_DME_103 | Integrity check on app start | Positive | P1 |
| TC_DME_104 | Health check dashboard | Positive | P3 |
| TC_DME_105 | Data corruption detection alert | Positive | P1 |

---

## Đề xuất Cải tiến

### Đề xuất 1: Automatic Data Health Check
- **Vấn đề hiện tại**: Data corruption discovered only when feature fails.
- **Giải pháp đề xuất**: Periodic integrity scan: check orphan refs, invalid types, consistency. Auto-fix minor issues. Alert for major.
- **Phần trăm cải thiện**: Corruption detection +80%, Silent data loss -90%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 2: Transaction-Based Writes
- **Vấn đề hiện tại**: localStorage writes not atomic. Crash mid-write = corrupt.
- **Giải pháp đề xuất**: Write-ahead log pattern: journal changes → apply → confirm. Crash → replay journal.
- **Phần trăm cải thiện**: Data safety +90%, Corruption from crashes -95%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 3: Storage Upgrade to IndexedDB
- **Vấn đề hiện tại**: localStorage limited to ~5MB. JSON serialization overhead.
- **Giải pháp đề xuất**: Migrate to IndexedDB: 50MB+ capacity, structured data, async operations.
- **Lý do chi tiết**: Power users hit localStorage limit with 200+ dishes. IndexedDB scales to thousands.
- **Phần trăm cải thiện**: Storage capacity +10x, Performance +30%
- **Mức độ ưu tiên**: Medium | **Effort**: XL

### Đề xuất 4: Multi-Tab Sync
- **Vấn đề hiện tại**: Multiple tabs can write simultaneously → data race.
- **Giải pháp đề xuất**: BroadcastChannel API for tab sync. Leader election. One writer at a time.
- **Phần trăm cải thiện**: Multi-tab consistency +100%, Data race elimination
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 5: Offline Recovery Queue
- **Vấn đề hiện tại**: Offline changes lost if app crashes before sync.
- **Giải pháp đề xuất**: Persistent operation queue (IndexedDB). Log every change. Replay on recovery/sync.
- **Phần trăm cải thiện**: Offline data safety +90%, Change durability +80%
- **Mức độ ưu tiên**: Medium | **Effort**: L

# Scenario 16: Data Backup & Import/Export

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Data Backup cho phép user export toàn bộ dữ liệu app (ingredients, dishes, plans, templates, settings, goals) thành JSON file và import lại. Backup button trong Settings tab. Export tạo downloadable file. Import validates schema trước khi replace.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| DataBackup | DataBackup.tsx | Backup/Import UI |
| SettingsTab | SettingsTab.tsx | Container |

## Luồng nghiệp vụ

1. Export: click "Export" → gather all localStorage data → create JSON → download
2. Import: click "Import" → file picker → validate JSON → confirm overwrite → replace data → reload
3. Validation: schema check, data integrity, version compatibility

## Quy tắc nghiệp vụ

1. Export includes ALL data: ingredients, dishes, plans, templates, settings, goals
2. Export file format: JSON with metadata (version, timestamp, app version)
3. Import validates schema before applying
4. Import is destructive: replaces ALL current data
5. Confirmation required before import
6. Invalid file → error message, no data change
7. Partial/corrupted file → reject entirely

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_DB_01 | Export button visible in Settings | Positive | P0 |
| TC_DB_02 | Import button visible in Settings | Positive | P0 |
| TC_DB_03 | Click Export → file download | Positive | P0 |
| TC_DB_04 | Export file is valid JSON | Positive | P0 |
| TC_DB_05 | Export includes ingredients | Positive | P0 |
| TC_DB_06 | Export includes dishes | Positive | P0 |
| TC_DB_07 | Export includes plans | Positive | P0 |
| TC_DB_08 | Export includes templates | Positive | P1 |
| TC_DB_09 | Export includes settings | Positive | P1 |
| TC_DB_10 | Export includes goals | Positive | P1 |
| TC_DB_11 | Export includes metadata | Positive | P1 |
| TC_DB_12 | Export filename format | Positive | P2 |
| TC_DB_13 | Export timestamp in metadata | Positive | P2 |
| TC_DB_14 | Export app version in metadata | Positive | P2 |
| TC_DB_15 | Click Import → file picker opens | Positive | P0 |
| TC_DB_16 | Select valid JSON → preview/confirm | Positive | P0 |
| TC_DB_17 | Confirm import → data replaced | Positive | P0 |
| TC_DB_18 | Cancel import → no changes | Positive | P1 |
| TC_DB_19 | Import → ingredients replaced | Positive | P1 |
| TC_DB_20 | Import → dishes replaced | Positive | P1 |
| TC_DB_21 | Import → plans replaced | Positive | P1 |
| TC_DB_22 | Import → templates replaced | Positive | P1 |
| TC_DB_23 | Import → settings replaced | Positive | P1 |
| TC_DB_24 | Import → goals replaced | Positive | P1 |
| TC_DB_25 | Import success notification | Positive | P1 |
| TC_DB_26 | App refreshes after import | Positive | P1 |
| TC_DB_27 | Invalid JSON → error | Negative | P0 |
| TC_DB_28 | Corrupted file → reject | Negative | P0 |
| TC_DB_29 | Empty file → error | Negative | P1 |
| TC_DB_30 | Non-JSON file (.txt) → error | Negative | P1 |
| TC_DB_31 | Image file → error | Negative | P2 |
| TC_DB_32 | Valid JSON wrong schema → error | Negative | P0 |
| TC_DB_33 | Missing required fields → error | Negative | P1 |
| TC_DB_34 | Extra unknown fields → ignored | Edge | P2 |
| TC_DB_35 | Null values in data → handled | Edge | P2 |
| TC_DB_36 | Empty arrays → accepted | Edge | P2 |
| TC_DB_37 | Very large file (10MB) | Boundary | P2 |
| TC_DB_38 | Very small file (empty data) | Boundary | P2 |
| TC_DB_39 | File with 0 ingredients | Edge | P2 |
| TC_DB_40 | File with 1000 ingredients | Boundary | P2 |
| TC_DB_41 | File with special characters in data | Edge | P2 |
| TC_DB_42 | File with Vietnamese text | Positive | P1 |
| TC_DB_43 | File with emoji in data | Edge | P2 |
| TC_DB_44 | Overwrite confirmation dialog | Positive | P0 |
| TC_DB_45 | Overwrite warning message | Positive | P1 |
| TC_DB_46 | Export → Import roundtrip (identical) | Positive | P0 |
| TC_DB_47 | Roundtrip: ingredients count match | Positive | P1 |
| TC_DB_48 | Roundtrip: dishes count match | Positive | P1 |
| TC_DB_49 | Roundtrip: plans count match | Positive | P1 |
| TC_DB_50 | Roundtrip: templates preserved | Positive | P1 |
| TC_DB_51 | Roundtrip: goals preserved | Positive | P1 |
| TC_DB_52 | Multiple export-import cycles | Positive | P2 |
| TC_DB_53 | Export from one browser → import another | Positive | P2 |
| TC_DB_54 | Export older version → import newer app | Edge | P1 |
| TC_DB_55 | Version migration on import | Edge | P1 |
| TC_DB_56 | Import → nutrition recalculated | Positive | P1 |
| TC_DB_57 | Import → grocery list recalculated | Positive | P1 |
| TC_DB_58 | Import → calendar refreshed | Positive | P1 |
| TC_DB_59 | Dark mode export/import UI | Positive | P2 |
| TC_DB_60 | i18n labels | Positive | P2 |
| TC_DB_61 | Mobile layout | Positive | P2 |
| TC_DB_62 | Desktop layout | Positive | P2 |
| TC_DB_63 | Export loading state | Positive | P2 |
| TC_DB_64 | Import loading state | Positive | P2 |
| TC_DB_65 | Export error handling | Negative | P1 |
| TC_DB_66 | Import error → rollback | Negative | P1 |
| TC_DB_67 | Import partial failure → full rollback | Negative | P1 |
| TC_DB_68 | Screen reader | Positive | P3 |
| TC_DB_69 | Keyboard accessible | Positive | P3 |
| TC_DB_70 | File drag-drop import | Positive | P3 |
| TC_DB_71 | Export includes grocery check state | Positive | P2 |
| TC_DB_72 | Export includes translation cache | Positive | P2 |
| TC_DB_73 | Export file size reasonable (<5MB typical) | Boundary | P2 |
| TC_DB_74 | Concurrent export-import | Edge | P2 |
| TC_DB_75 | Export during cloud sync | Edge | P2 |
| TC_DB_76 | Import during cloud sync | Edge | P2 |
| TC_DB_77 | Export from cleared app (empty data) | Edge | P2 |
| TC_DB_78 | Import to cleared app | Positive | P1 |
| TC_DB_79 | Export multiple times → same content | Positive | P2 |
| TC_DB_80 | Import same file twice | Edge | P2 |
| TC_DB_81 | Export button text/icon | Positive | P2 |
| TC_DB_82 | Import button text/icon | Positive | P2 |
| TC_DB_83 | File picker filter (.json only) | Positive | P2 |
| TC_DB_84 | Export file date in filename | Positive | P2 |
| TC_DB_85 | Backup reminder (if feature exists) | Positive | P3 |
| TC_DB_86 | Auto-backup before import | Positive | P2 |
| TC_DB_87 | Restore from auto-backup | Positive | P2 |
| TC_DB_88 | Backup history | Positive | P3 |
| TC_DB_89 | Scheduled backup | Positive | P3 |
| TC_DB_90 | Backup to Google Drive | Positive | P2 |
| TC_DB_91 | Restore from Google Drive | Positive | P2 |
| TC_DB_92 | Export as CSV option | Positive | P3 |
| TC_DB_93 | Export as PDF report | Positive | P3 |
| TC_DB_94 | Selective export (only ingredients) | Positive | P3 |
| TC_DB_95 | Selective import (merge specific data) | Positive | P3 |
| TC_DB_96 | Import preview (show data summary before confirm) | Positive | P2 |
| TC_DB_97 | Import diff (show what will change) | Positive | P3 |
| TC_DB_98 | Export encryption (optional) | Positive | P3 |
| TC_DB_99 | Import decryption | Positive | P3 |
| TC_DB_100 | Data integrity hash check | Positive | P2 |
| TC_DB_101 | Export progress for large data | Positive | P2 |
| TC_DB_102 | Import progress for large data | Positive | P2 |
| TC_DB_103 | Mobile: share exported file | Positive | P2 |
| TC_DB_104 | Export includes app preferences | Positive | P2 |
| TC_DB_105 | Backup size estimation | Positive | P3 |

---

## Chi tiết Test Cases (Grouped)

##### TC_DB_01–14: Export Flow
- Button, file download, JSON validity, data completeness, metadata

##### TC_DB_15–26: Import Flow
- File picker, validation, confirm, data replacement, notification, refresh

##### TC_DB_27–43: Validation & Edge Cases
- Invalid files, wrong schema, missing fields, boundaries, special characters

##### TC_DB_44–58: Roundtrip & Integration
- Overwrite confirm, export-import roundtrip, cross-browser, version migration, recalculations

##### TC_DB_59–70: UI/UX
- Dark mode, i18n, responsive, loading, error handling, accessibility

##### TC_DB_71–105: Advanced Features
- Grocery/translation state, concurrent operations, empty app, auto-backup, Google Drive, formats, encryption

---

## Đề xuất Cải tiến

### Đề xuất 1: Incremental Backup
- **Vấn đề hiện tại**: Full export every time. 5MB file for 1 change.
- **Giải pháp đề xuất**: Incremental backup: only changed data since last backup. Diff-based.
- **Lý do chi tiết**: Faster exports, smaller files, less bandwidth for cloud backup.
- **Phần trăm cải thiện**: Backup speed +80%, File size -70%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 2: Import Preview & Merge
- **Vấn đề hiện tại**: Import = full replace. Can't merge or preview.
- **Giải pháp đề xuất**: Before import: show diff. Options: "Replace All", "Merge (keep newer)", "Selective Import".
- **Lý do chi tiết**: Replace is dangerous. Merge enables combining data from multiple sources.
- **Phần trăm cải thiện**: Import flexibility +60%, Data preservation +50%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 3: Cloud Auto-Backup
- **Vấn đề hiện tại**: Manual export only. Users forget → data loss.
- **Giải pháp đề xuất**: Auto-backup to Google Drive daily. Keep last 7 backups. One-click restore.
- **Lý do chi tiết**: Auto-backup eliminates data loss risk. #1 user concern.
- **Phần trăm cải thiện**: Data loss incidents -95%, User confidence +60%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Cross-Device Sync
- **Vấn đề hiện tại**: Export/import = manual device transfer. No real-time sync.
- **Giải pháp đề xuất**: Real-time sync via Google Drive. Changes auto-replicated. Conflict resolution UI.
- **Lý do chi tiết**: Users expect data available on all devices. Sync is table stakes for modern apps.
- **Phần trăm cải thiện**: Multi-device usage +80%, User satisfaction +50%
- **Mức độ ưu tiên**: High | **Effort**: XL

### Đề xuất 5: Backup Encryption
- **Vấn đề hiện tại**: Export file in plaintext JSON. Anyone can read dietary data.
- **Giải pháp đề xuất**: Optional password encryption on export. AES-256. Decrypt on import.
- **Lý do chi tiết**: Health data is sensitive. Encryption protects privacy for shared devices/cloud.
- **Phần trăm cải thiện**: Data security +80%, Privacy confidence +50%
- **Mức độ ưu tiên**: Low | **Effort**: M

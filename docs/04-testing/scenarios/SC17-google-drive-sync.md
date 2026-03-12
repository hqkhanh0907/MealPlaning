# Scenario 17: Google Drive Cloud Sync

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Google Drive Cloud Sync cho phép đồng bộ dữ liệu app lên Google Drive. AuthContext quản lý Google OAuth. useAutoSync hook tự động sync sau mỗi data change (debounce 3s). Manual sync button cũng có. Data stored as JSON file on Drive.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| AuthContext | contexts/AuthContext.tsx | Google OAuth state |
| googleDriveService | services/googleDriveService.ts | Drive API wrapper |
| useAutoSync | hooks/useAutoSync.ts | Auto-sync logic |
| GoogleDriveSync | components/GoogleDriveSync.tsx | Sync UI |

## Luồng nghiệp vụ

1. User signs in with Google account
2. AuthContext stores auth state
3. Auto-sync enabled → useAutoSync listens for data changes
4. Data change → 3s debounce → upload to Drive
5. Manual sync: click "Sync Now" → immediate upload/download
6. Conflict: compare timestamps → newer wins (or user resolves)

## Quy tắc nghiệp vụ

1. Google sign-in required for sync
2. Auto-sync: 3s debounce after any data change
3. Immediate sync on auth (first sign-in)
4. Data stored as single JSON file in app-specific Drive folder
5. Upload: overwrite existing file
6. Download: merge or replace (configurable)
7. Offline changes: queue and sync when online

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_GD_01 | Google Sign In button visible | Positive | P0 |
| TC_GD_02 | Click Sign In → OAuth flow | Positive | P0 |
| TC_GD_03 | Successful sign in → user info displayed | Positive | P0 |
| TC_GD_04 | Sign Out button visible when signed in | Positive | P1 |
| TC_GD_05 | Click Sign Out → auth cleared | Positive | P0 |
| TC_GD_06 | Auth state persists reload | Positive | P0 |
| TC_GD_07 | Auth token refresh | Positive | P1 |
| TC_GD_08 | Expired token → re-auth | Positive | P1 |
| TC_GD_09 | Auto-sync toggle visible | Positive | P1 |
| TC_GD_10 | Enable auto-sync | Positive | P1 |
| TC_GD_11 | Disable auto-sync | Positive | P1 |
| TC_GD_12 | Auto-sync: data change → 3s debounce → upload | Positive | P0 |
| TC_GD_13 | Auto-sync: multiple changes within 3s → single upload | Positive | P1 |
| TC_GD_14 | Auto-sync: immediate on first sign-in | Positive | P1 |
| TC_GD_15 | Manual sync button visible | Positive | P1 |
| TC_GD_16 | Click Manual Sync → upload | Positive | P0 |
| TC_GD_17 | Sync status indicator | Positive | P1 |
| TC_GD_18 | Sync status: Syncing | Positive | P1 |
| TC_GD_19 | Sync status: Synced | Positive | P1 |
| TC_GD_20 | Sync status: Error | Positive | P1 |
| TC_GD_21 | Last sync timestamp | Positive | P1 |
| TC_GD_22 | Upload success → status updated | Positive | P1 |
| TC_GD_23 | Upload data → correct JSON on Drive | Positive | P0 |
| TC_GD_24 | Download data from Drive | Positive | P0 |
| TC_GD_25 | Download → local data updated | Positive | P0 |
| TC_GD_26 | Upload includes all data types | Positive | P1 |
| TC_GD_27 | Download → ingredients restored | Positive | P1 |
| TC_GD_28 | Download → dishes restored | Positive | P1 |
| TC_GD_29 | Download → plans restored | Positive | P1 |
| TC_GD_30 | Download → templates restored | Positive | P1 |
| TC_GD_31 | First sync → creates Drive file | Positive | P1 |
| TC_GD_32 | Subsequent sync → updates existing file | Positive | P1 |
| TC_GD_33 | App-specific folder on Drive | Positive | P2 |
| TC_GD_34 | Network error during upload | Negative | P0 |
| TC_GD_35 | Network error during download | Negative | P0 |
| TC_GD_36 | API quota exceeded | Negative | P1 |
| TC_GD_37 | Auth revoked externally | Negative | P1 |
| TC_GD_38 | Drive storage full | Negative | P2 |
| TC_GD_39 | Corrupted file on Drive | Negative | P1 |
| TC_GD_40 | Sync retry on failure | Positive | P1 |
| TC_GD_41 | Max retry attempts | Positive | P2 |
| TC_GD_42 | Offline → queue changes | Positive | P1 |
| TC_GD_43 | Come online → auto-sync queued | Positive | P1 |
| TC_GD_44 | Conflict: local newer → upload | Positive | P1 |
| TC_GD_45 | Conflict: remote newer → download | Positive | P1 |
| TC_GD_46 | Conflict resolution UI | Positive | P2 |
| TC_GD_47 | Sync add ingredient → synced | Positive | P1 |
| TC_GD_48 | Sync edit dish → synced | Positive | P1 |
| TC_GD_49 | Sync add plan → synced | Positive | P1 |
| TC_GD_50 | Sync delete → synced | Positive | P1 |
| TC_GD_51 | Sync save template → synced | Positive | P1 |
| TC_GD_52 | Sync change settings → synced | Positive | P2 |
| TC_GD_53 | Sync change goals → synced | Positive | P2 |
| TC_GD_54 | Large data sync (5MB+) | Boundary | P2 |
| TC_GD_55 | Sync time < 5s typical | Boundary | P2 |
| TC_GD_56 | Debounce: no upload during 3s window | Positive | P1 |
| TC_GD_57 | Debounce reset on new change | Positive | P2 |
| TC_GD_58 | Rapid changes: 10 edits in 5s → 1 upload | Positive | P1 |
| TC_GD_59 | Sync during translation | Edge | P2 |
| TC_GD_60 | Sync during import | Edge | P2 |
| TC_GD_61 | Sync during export | Edge | P2 |
| TC_GD_62 | Sync during AI call | Edge | P2 |
| TC_GD_63 | Multiple devices conflict | Edge | P2 |
| TC_GD_64 | Sync on app launch | Positive | P1 |
| TC_GD_65 | Sync on app close/background | Positive | P2 |
| TC_GD_66 | Dark mode sync UI | Positive | P2 |
| TC_GD_67 | i18n sync labels | Positive | P2 |
| TC_GD_68 | Mobile sync layout | Positive | P2 |
| TC_GD_69 | Desktop sync layout | Positive | P2 |
| TC_GD_70 | Sync progress indicator | Positive | P2 |
| TC_GD_71 | Sync error notification | Positive | P1 |
| TC_GD_72 | Sync success notification | Positive | P2 |
| TC_GD_73 | Screen reader sync status | Positive | P3 |
| TC_GD_74 | Keyboard trigger sync | Positive | P3 |
| TC_GD_75 | OAuth popup handling | Positive | P1 |
| TC_GD_76 | OAuth popup blocked | Negative | P2 |
| TC_GD_77 | OAuth cancel → handled | Positive | P1 |
| TC_GD_78 | Multiple accounts → select | Edge | P2 |
| TC_GD_79 | Switch accounts → data switch | Edge | P2 |
| TC_GD_80 | Sign out → stop auto-sync | Positive | P0 |
| TC_GD_81 | Sign out → clear auth tokens | Security | P0 |
| TC_GD_82 | Sign out → local data preserved | Positive | P0 |
| TC_GD_83 | Drive permissions: appDataFolder | Security | P1 |
| TC_GD_84 | No extra Drive permissions | Security | P1 |
| TC_GD_85 | Token storage secure | Security | P1 |
| TC_GD_86 | HTTPS only for API calls | Security | P0 |
| TC_GD_87 | Sync with cleared local data | Edge | P2 |
| TC_GD_88 | Sync with cleared Drive data | Edge | P2 |
| TC_GD_89 | Sync version mismatch handling | Edge | P2 |
| TC_GD_90 | Data migration on sync | Edge | P2 |
| TC_GD_91 | Sync bandwidth optimization | Boundary | P3 |
| TC_GD_92 | Sync on slow network (3G) | Boundary | P2 |
| TC_GD_93 | Sync on intermittent network | Edge | P2 |
| TC_GD_94 | Background sync on mobile | Positive | P2 |
| TC_GD_95 | Sync notification preferences | Positive | P3 |
| TC_GD_96 | Force sync button | Positive | P2 |
| TC_GD_97 | Sync log/history | Positive | P3 |
| TC_GD_98 | Sync conflict details | Positive | P3 |
| TC_GD_99 | Selective sync (only plans) | Positive | P3 |
| TC_GD_100 | Sync encryption | Positive | P3 |
| TC_GD_101 | Sync data integrity hash | Positive | P2 |
| TC_GD_102 | Sync with multiple app instances | Edge | P2 |
| TC_GD_103 | OAuth token in secure storage | Security | P1 |
| TC_GD_104 | Sync indicator in app header | Positive | P2 |
| TC_GD_105 | Sync conflict auto-resolution option | Positive | P3 |

---

## Chi tiết Test Cases (Grouped)

##### TC_GD_01–08: Authentication
- Sign in/out, auth state, token refresh, persistence

##### TC_GD_09–33: Core Sync Flow
- Auto-sync toggle, debounce, manual sync, status, upload/download, data types, Drive file management

##### TC_GD_34–46: Error Handling & Conflicts
- Network errors, quota, revoked auth, storage full, corrupt data, retry, offline queue, conflicts

##### TC_GD_47–58: Data Type Sync
- Each data type synced correctly, performance, debounce behavior

##### TC_GD_59–65: Concurrent Operations
- Sync during translation/import/export/AI, multi-device, app lifecycle

##### TC_GD_66–74: UI/UX
- Dark mode, i18n, responsive, progress, notifications, accessibility

##### TC_GD_75–90: OAuth & Security
- Popup handling, cancel, accounts, sign out, permissions, tokens, HTTPS

##### TC_GD_91–105: Advanced
- Bandwidth, slow network, background, selective sync, encryption, integrity

---

## Đề xuất Cải tiến

### Đề xuất 1: Real-time Multi-Device Sync
- **Vấn đề hiện tại**: Sync is file-based (upload/download whole file). Not real-time.
- **Giải pháp đề xuất**: WebSocket or Firebase Realtime DB for instant sync. Change on phone → appears on tablet immediately.
- **Lý do chi tiết**: Users expect real-time like Google Docs. File-based sync has delay and conflict issues.
- **Phần trăm cải thiện**: Sync speed +90%, Conflict incidents -80%
- **Mức độ ưu tiên**: Medium | **Effort**: XL

### Đề xuất 2: Granular Conflict Resolution
- **Vấn đề hiện tại**: Conflict = newer wins. No merge option.
- **Giải pháp đề xuất**: Per-item conflict: "Phone added Dish A, Tablet added Dish B" → keep both. Visual diff.
- **Lý do chi tiết**: Newer-wins loses valid changes. Per-item merge preserves all work.
- **Phần trăm cải thiện**: Data loss from conflicts -90%, User trust +40%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 3: Sync History & Rollback
- **Vấn đề hiện tại**: No history. Sync error → data potentially corrupted.
- **Giải pháp đề xuất**: Keep last 10 sync snapshots on Drive. One-click rollback to any snapshot.
- **Lý do chi tiết**: Safety net for sync issues. Rollback prevents permanent data loss.
- **Phần trăm cải thiện**: Data safety +80%, Recovery speed +90%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Offline-First Architecture
- **Vấn đề hiện tại**: Sync assumes online. Offline changes queued but not guaranteed.
- **Giải pháp đề xuất**: CRDTs (Conflict-free Replicated Data Types) for guaranteed offline merge without conflicts.
- **Lý do chi tiết**: True offline-first = works always, syncs when possible. Best UX for mobile.
- **Phần trăm cải thiện**: Offline reliability +100%, Conflict elimination +90%
- **Mức độ ưu tiên**: Low | **Effort**: XL

### Đề xuất 5: Share Data with Family
- **Vấn đề hiện tại**: Sync is single-user. Can't share meal plans with family.
- **Giải pháp đề xuất**: Family sharing: invite family members. Shared meal plan. Individual ingredient preferences.
- **Lý do chi tiết**: 60% of meal planning is family activity. Sharing enables collaborative planning.
- **Phần trăm cải thiện**: Family adoption +60%, Household value +80%
- **Mức độ ưu tiên**: Medium | **Effort**: XL

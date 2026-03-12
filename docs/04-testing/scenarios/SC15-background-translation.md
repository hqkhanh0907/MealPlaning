# Scenario 15: Background Translation

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Background Translation dịch toàn bộ nội dung app (labels, dish names, ingredient names) từ ngôn ngữ hiện tại sang ngôn ngữ đã chọn. Zustand queue quản lý translation tasks. Runs in background không block UI. Progress indicator hiển thị tiến trình.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| TranslateQueueService | services/translateQueueService.ts | Queue management |
| useTranslateWorker | hooks/useTranslateWorker.ts | Worker orchestration |
| useTranslateProcessor | hooks/useTranslateProcessor.ts | Translation processing |
| TranslationProgress | components/ | Progress indicator |
| geminiService | services/geminiService.ts | AI translation |

## Luồng nghiệp vụ

1. User changes language in Settings (vi → en or en → vi)
2. System queues all translatable content (dish names, ingredient names, custom labels)
3. Background worker processes queue items via Gemini API
4. Progress bar shows X/Y translated
5. Translated content stored and displayed
6. UI remains responsive during translation

## Quy tắc nghiệp vụ

1. Non-blocking: UI usable during translation
2. Queue-based: items processed one by one (or batched)
3. API key required (same as AI features)
4. Cache: already-translated items skipped
5. Error: failed items retried 3 times, then skipped with original
6. Progress: shows completed/total count
7. Cancel: user can cancel remaining translations

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_BT_01 | Language switch triggers translation | Positive | P0 |
| TC_BT_02 | Queue populated with items | Positive | P1 |
| TC_BT_03 | Progress bar appears | Positive | P1 |
| TC_BT_04 | Progress: 0/N initial | Positive | P1 |
| TC_BT_05 | Progress: X/N updating | Positive | P1 |
| TC_BT_06 | Progress: N/N complete | Positive | P1 |
| TC_BT_07 | UI remains responsive during translation | Positive | P0 |
| TC_BT_08 | Background processing (non-blocking) | Positive | P0 |
| TC_BT_09 | Translation result displayed | Positive | P0 |
| TC_BT_10 | Dish names translated | Positive | P1 |
| TC_BT_11 | Ingredient names translated | Positive | P1 |
| TC_BT_12 | UI labels translated (static) | Positive | P1 |
| TC_BT_13 | Cancel translation | Positive | P1 |
| TC_BT_14 | Cancel → remaining items kept original | Positive | P1 |
| TC_BT_15 | Cancel → progress bar disappears | Positive | P1 |
| TC_BT_16 | No API key → translation disabled | Negative | P0 |
| TC_BT_17 | API error → retry 3 times | Positive | P1 |
| TC_BT_18 | All retries fail → keep original | Negative | P1 |
| TC_BT_19 | Network error during translation | Negative | P1 |
| TC_BT_20 | API timeout | Negative | P1 |
| TC_BT_21 | Rate limit → queue pauses | Negative | P1 |
| TC_BT_22 | Cache: previously translated → skip | Positive | P1 |
| TC_BT_23 | Cache hit → instant display | Positive | P2 |
| TC_BT_24 | Cache invalidation on content change | Positive | P2 |
| TC_BT_25 | vi → en translation | Positive | P0 |
| TC_BT_26 | en → vi translation | Positive | P0 |
| TC_BT_27 | vi → en → vi roundtrip | Edge | P2 |
| TC_BT_28 | Translation quality (meaningful) | Positive | P2 |
| TC_BT_29 | Short text (1 word) | Positive | P2 |
| TC_BT_30 | Long text (100+ chars) | Positive | P2 |
| TC_BT_31 | Special characters preserved | Edge | P2 |
| TC_BT_32 | Numbers preserved in translation | Positive | P2 |
| TC_BT_33 | Empty string → skip | Edge | P2 |
| TC_BT_34 | Whitespace-only → skip | Edge | P2 |
| TC_BT_35 | Already in target language → skip | Edge | P2 |
| TC_BT_36 | Mixed language text | Edge | P2 |
| TC_BT_37 | HTML in content → sanitized | Security | P1 |
| TC_BT_38 | Queue: 1 item | Positive | P2 |
| TC_BT_39 | Queue: 10 items | Positive | P2 |
| TC_BT_40 | Queue: 100 items | Positive | P1 |
| TC_BT_41 | Queue: 500 items (stress) | Boundary | P2 |
| TC_BT_42 | Queue: 1000 items | Boundary | P2 |
| TC_BT_43 | Queue order: FIFO | Positive | P2 |
| TC_BT_44 | Queue pause/resume | Positive | P2 |
| TC_BT_45 | Batch processing (5 items per API call) | Positive | P2 |
| TC_BT_46 | Partial batch failure handling | Edge | P2 |
| TC_BT_47 | Zustand store state correct | Positive | P1 |
| TC_BT_48 | Zustand store reset after complete | Positive | P2 |
| TC_BT_49 | Zustand persist (if implemented) | Positive | P2 |
| TC_BT_50 | Translation stored in localStorage | Positive | P1 |
| TC_BT_51 | Translation persist after reload | Positive | P0 |
| TC_BT_52 | Mid-translation reload → resume | Edge | P2 |
| TC_BT_53 | Export includes translations | Positive | P2 |
| TC_BT_54 | Import includes translations | Positive | P2 |
| TC_BT_55 | Cloud sync translations | Positive | P2 |
| TC_BT_56 | Dark mode progress bar | Positive | P2 |
| TC_BT_57 | i18n progress labels | Positive | P2 |
| TC_BT_58 | Mobile progress layout | Positive | P2 |
| TC_BT_59 | Desktop progress layout | Positive | P2 |
| TC_BT_60 | Progress bar animation smooth | Positive | P3 |
| TC_BT_61 | Progress percentage accurate | Positive | P1 |
| TC_BT_62 | Progress ETA display | Positive | P3 |
| TC_BT_63 | Translation error notification | Positive | P1 |
| TC_BT_64 | Success notification on complete | Positive | P1 |
| TC_BT_65 | Partial success notification | Positive | P2 |
| TC_BT_66 | Screen reader progress | Positive | P3 |
| TC_BT_67 | Keyboard cancel | Positive | P3 |
| TC_BT_68 | Multiple language switches rapid | Edge | P1 |
| TC_BT_69 | Switch during active translation | Edge | P1 |
| TC_BT_70 | Translation during data edit | Edge | P2 |
| TC_BT_71 | Translation during AI suggestion | Edge | P2 |
| TC_BT_72 | Translation during cloud sync | Edge | P2 |
| TC_BT_73 | Memory usage during large queue | Boundary | P2 |
| TC_BT_74 | CPU usage non-excessive | Boundary | P2 |
| TC_BT_75 | Network bandwidth considerate | Boundary | P2 |
| TC_BT_76 | Translation time 100 items < 60s | Boundary | P2 |
| TC_BT_77 | New item added during translation → queued | Positive | P2 |
| TC_BT_78 | Item deleted during translation → removed from queue | Positive | P2 |
| TC_BT_79 | Item edited during translation → re-queue | Edge | P2 |
| TC_BT_80 | Complete → add new content → auto-translate | Positive | P2 |
| TC_BT_81 | Translation affects search results | Positive | P2 |
| TC_BT_82 | Translation affects sort order | Positive | P2 |
| TC_BT_83 | Translation affects grocery list | Positive | P2 |
| TC_BT_84 | Translation affects calendar display | Positive | P1 |
| TC_BT_85 | Translation affects nutrition labels | Positive | P2 |
| TC_BT_86 | Template names translated | Positive | P2 |
| TC_BT_87 | Goal labels translated | Positive | P2 |
| TC_BT_88 | Settings labels translated | Positive | P2 |
| TC_BT_89 | Error messages translated | Positive | P2 |
| TC_BT_90 | Placeholder text translated | Positive | P2 |
| TC_BT_91 | Button labels translated | Positive | P1 |
| TC_BT_92 | Modal titles translated | Positive | P2 |
| TC_BT_93 | Tab names translated | Positive | P1 |
| TC_BT_94 | Toast messages translated | Positive | P2 |
| TC_BT_95 | Date format localized | Positive | P2 |
| TC_BT_96 | Number format localized | Positive | P2 |
| TC_BT_97 | RTL support (if applicable) | Positive | P3 |
| TC_BT_98 | Font support for target language | Positive | P3 |
| TC_BT_99 | Translation log/history | Positive | P3 |
| TC_BT_100 | Manual re-translate button | Positive | P2 |
| TC_BT_101 | Selective translation (only dishes) | Positive | P3 |
| TC_BT_102 | Translation quality feedback | Positive | P3 |
| TC_BT_103 | Custom translation override | Positive | P3 |
| TC_BT_104 | Translation memory (TM) reuse | Positive | P3 |
| TC_BT_105 | Translation API cost tracking | Positive | P3 |

---

## Chi tiết Test Cases (Grouped)

##### TC_BT_01–15: Core Translation Flow
- Trigger, queue, progress, results, cancel

##### TC_BT_16–24: Error Handling & Cache
- No API key, errors, retries, rate limit, cache hit/miss/invalidation

##### TC_BT_25–37: Content Variations
- vi↔en, roundtrip, quality, text lengths, special chars, numbers, empty, security

##### TC_BT_38–49: Queue Management
- Queue sizes, FIFO order, pause/resume, batch processing, Zustand store

##### TC_BT_50–55: Persistence
- localStorage, reload, import/export, cloud sync

##### TC_BT_56–67: UI/UX
- Dark mode, responsive, animations, progress accuracy, ETA, notifications, accessibility

##### TC_BT_68–79: Concurrent Operations
- Rapid switches, during other operations, new/deleted/edited items during translation

##### TC_BT_80–105: Cross-Feature Impact & Advanced
- Translation effects on all features (search, sort, grocery, calendar, settings), localization details

---

## Đề xuất Cải tiến

### Đề xuất 1: Instant Translation Preview
- **Vấn đề hiện tại**: Translation takes time. User waits without seeing progress per item.
- **Giải pháp đề xuất**: Items update one by one in real-time as translated. Shimmer effect on pending items.
- **Lý do chi tiết**: Real-time feedback feels faster than batch reveal. Reduces perceived wait time 50%.
- **Phần trăm cải thiện**: Perceived speed +50%, User patience +40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 2: Offline Translation Pack
- **Vấn đề hiện tại**: Translation requires API call (online). Offline = no translation.
- **Giải pháp đề xuất**: Download language pack for offline use. Pre-translated common words. AI for custom content.
- **Lý do chi tiết**: Offline users can't switch language. Language pack enables offline i18n.
- **Phần trăm cải thiện**: Offline accessibility +80%, API cost -40%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 3: Translation Quality Control
- **Vấn đề hiện tại**: AI translation may be inaccurate. No way to report/fix.
- **Giải pháp đề xuất**: "Edit translation" option per item. Report bad translation. User-corrected translations cached.
- **Lý do chi tiết**: User corrections improve quality over time. Community-driven accuracy.
- **Phần trăm cải thiện**: Translation accuracy +20%, User control +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Priority Translation
- **Vấn đề hiện tại**: All items translated in FIFO order. Visible items may be last.
- **Giải pháp đề xuất**: Priority queue: visible items first, then background items. On-demand instant translate on view.
- **Lý do chi tiết**: Users see untranslated content while waiting. Priority reduces this by translating visible first.
- **Phần trăm cải thiện**: Visible content delay -70%, User experience +40%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 5: Multi-Language Support
- **Vấn đề hiện tại**: Only vi and en. International users excluded.
- **Giải pháp đề xuất**: Add Japanese, Korean, Chinese, Thai, French, Spanish via same AI pipeline.
- **Lý do chi tiết**: Regional expansion requires multi-language. AI makes adding languages near-zero cost.
- **Phần trăm cải thiện**: Addressable market +300%, International users +50%
- **Mức độ ưu tiên**: Low | **Effort**: M

# Scenario 23: Internationalization (i18n) & Language Switching

**Version:** 1.0  
**Date:** 2026-03-12  
**Total Test Cases:** 105

---

## Mô tả tổng quan

i18n hỗ trợ 2 ngôn ngữ: Tiếng Việt (vi) và English (en). Tất cả static labels, buttons, placeholders, error messages, toast notifications đều có 2 phiên bản. Toggle language trong Settings → toàn bộ UI chuyển đổi ngay lập tức. Language persist trong localStorage. Dynamic content (dish names, ingredient names) dịch qua Background Translation (SC15).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| useLanguage | hooks/useLanguage.ts | Language state & translations |
| SettingsTab | SettingsTab.tsx | Language toggle |
| i18n constants | constant/ | Translation strings |

## Luồng nghiệp vụ

1. User opens Settings → Language section
2. Toggle between vi and en
3. All static labels update immediately
4. Dynamic content queued for background translation (if API key available)
5. Language persists across sessions

## Quy tắc nghiệp vụ

1. Default language: vi (Vietnamese)
2. 2 supported languages: vi, en
3. Static labels: instant switch (no API needed)
4. Dynamic content: requires Gemini API for translation
5. Missing translation key → fallback to key name
6. Date format: vi = DD/MM/YYYY, en = MM/DD/YYYY
7. Number format: vi = 1.000,5 , en = 1,000.5

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_I18_01 | Language toggle visible in Settings | Positive | P0 |
| TC_I18_02 | Default language = vi | Positive | P0 |
| TC_I18_03 | Switch to en | Positive | P0 |
| TC_I18_04 | Switch back to vi | Positive | P0 |
| TC_I18_05 | Labels update immediately | Positive | P0 |
| TC_I18_06 | Language persist reload | Positive | P0 |
| TC_I18_07 | Calendar tab labels vi | Positive | P1 |
| TC_I18_08 | Calendar tab labels en | Positive | P1 |
| TC_I18_09 | Management tab labels vi | Positive | P1 |
| TC_I18_10 | Management tab labels en | Positive | P1 |
| TC_I18_11 | AI tab labels vi | Positive | P1 |
| TC_I18_12 | AI tab labels en | Positive | P1 |
| TC_I18_13 | Grocery tab labels vi | Positive | P1 |
| TC_I18_14 | Grocery tab labels en | Positive | P1 |
| TC_I18_15 | Settings tab labels vi | Positive | P1 |
| TC_I18_16 | Settings tab labels en | Positive | P1 |
| TC_I18_17 | Tab names vi (Lịch, Quản lý, AI, Mua sắm, Cài đặt) | Positive | P1 |
| TC_I18_18 | Tab names en (Calendar, Management, AI, Grocery, Settings) | Positive | P1 |
| TC_I18_19 | Button labels vi | Positive | P1 |
| TC_I18_20 | Button labels en | Positive | P1 |
| TC_I18_21 | Placeholder text vi | Positive | P1 |
| TC_I18_22 | Placeholder text en | Positive | P1 |
| TC_I18_23 | Error messages vi | Positive | P1 |
| TC_I18_24 | Error messages en | Positive | P1 |
| TC_I18_25 | Toast notifications vi | Positive | P1 |
| TC_I18_26 | Toast notifications en | Positive | P1 |
| TC_I18_27 | Modal titles vi | Positive | P1 |
| TC_I18_28 | Modal titles en | Positive | P1 |
| TC_I18_29 | Confirm dialog text vi | Positive | P1 |
| TC_I18_30 | Confirm dialog text en | Positive | P1 |
| TC_I18_31 | Empty state messages vi | Positive | P2 |
| TC_I18_32 | Empty state messages en | Positive | P2 |
| TC_I18_33 | Validation messages vi | Positive | P1 |
| TC_I18_34 | Validation messages en | Positive | P1 |
| TC_I18_35 | Tooltip text vi | Positive | P2 |
| TC_I18_36 | Tooltip text en | Positive | P2 |
| TC_I18_37 | Date format vi (DD/MM/YYYY) | Positive | P1 |
| TC_I18_38 | Date format en (MM/DD/YYYY) | Positive | P1 |
| TC_I18_39 | Day names vi (Thứ Hai, Thứ Ba...) | Positive | P1 |
| TC_I18_40 | Day names en (Monday, Tuesday...) | Positive | P1 |
| TC_I18_41 | Month names vi (Tháng 1...) | Positive | P1 |
| TC_I18_42 | Month names en (January...) | Positive | P1 |
| TC_I18_43 | Number format vi (1.000,5) | Positive | P2 |
| TC_I18_44 | Number format en (1,000.5) | Positive | P2 |
| TC_I18_45 | Currency format (if any) | Positive | P3 |
| TC_I18_46 | Unit labels vi (gram, ml) | Positive | P2 |
| TC_I18_47 | Unit labels en (gram, ml) | Positive | P2 |
| TC_I18_48 | Nutrition labels vi (Calo, Đạm, Tinh bột, Chất béo) | Positive | P1 |
| TC_I18_49 | Nutrition labels en (Calories, Protein, Carbs, Fat) | Positive | P1 |
| TC_I18_50 | Meal type labels vi (Sáng, Trưa, Tối) | Positive | P1 |
| TC_I18_51 | Meal type labels en (Breakfast, Lunch, Dinner) | Positive | P1 |
| TC_I18_52 | Missing translation key → fallback | Edge | P1 |
| TC_I18_53 | All keys have vi translation | Positive | P0 |
| TC_I18_54 | All keys have en translation | Positive | P0 |
| TC_I18_55 | No untranslated keys in UI | Positive | P0 |
| TC_I18_56 | Dynamic content: dish name display current language | Positive | P1 |
| TC_I18_57 | Dynamic content: ingredient name | Positive | P1 |
| TC_I18_58 | Dynamic: trigger background translation | Positive | P1 |
| TC_I18_59 | Dynamic: no API key → original text | Positive | P1 |
| TC_I18_60 | Long text vi (typically longer than en) | Edge | P2 |
| TC_I18_61 | Long text en → layout check | Edge | P2 |
| TC_I18_62 | Text overflow handling both languages | Positive | P2 |
| TC_I18_63 | Button width accommodates both languages | Positive | P2 |
| TC_I18_64 | Form label alignment both languages | Positive | P2 |
| TC_I18_65 | Table header width both languages | Positive | P2 |
| TC_I18_66 | Dark mode + vi | Positive | P2 |
| TC_I18_67 | Dark mode + en | Positive | P2 |
| TC_I18_68 | Mobile layout + vi | Positive | P2 |
| TC_I18_69 | Mobile layout + en | Positive | P2 |
| TC_I18_70 | Desktop layout + vi | Positive | P2 |
| TC_I18_71 | Desktop layout + en | Positive | P2 |
| TC_I18_72 | Vietnamese diacritics display | Positive | P1 |
| TC_I18_73 | Vietnamese special chars (ư, ơ, ă, đ) | Positive | P1 |
| TC_I18_74 | Font supports Vietnamese | Positive | P1 |
| TC_I18_75 | Font supports English | Positive | P1 |
| TC_I18_76 | Search in current language | Positive | P2 |
| TC_I18_77 | Sort in current locale | Positive | P2 |
| TC_I18_78 | Filter labels in current language | Positive | P2 |
| TC_I18_79 | Export file includes language setting | Positive | P2 |
| TC_I18_80 | Import preserves language setting | Positive | P2 |
| TC_I18_81 | Cloud sync includes language | Positive | P2 |
| TC_I18_82 | Switch language during AI call | Edge | P2 |
| TC_I18_83 | Switch language during sync | Edge | P2 |
| TC_I18_84 | Switch language while modal open | Edge | P2 |
| TC_I18_85 | Switch multiple times rapidly | Edge | P1 |
| TC_I18_86 | Switch then reload immediately | Edge | P2 |
| TC_I18_87 | localStorage key for language | Positive | P2 |
| TC_I18_88 | Corrupt localStorage language → default vi | Edge | P2 |
| TC_I18_89 | Unknown language value → default vi | Edge | P2 |
| TC_I18_90 | Screen reader language attribute | Positive | P3 |
| TC_I18_91 | html lang attribute updates | Positive | P2 |
| TC_I18_92 | ARIA labels in current language | Positive | P3 |
| TC_I18_93 | Keyboard shortcut for language switch | Positive | P3 |
| TC_I18_94 | Language indicator in header | Positive | P2 |
| TC_I18_95 | Language icon (🇻🇳/🇬🇧) | Positive | P2 |
| TC_I18_96 | Performance: switch time <100ms | Boundary | P2 |
| TC_I18_97 | Memory: no leak on repeated switches | Boundary | P2 |
| TC_I18_98 | Translation completeness audit vi | Positive | P1 |
| TC_I18_99 | Translation completeness audit en | Positive | P1 |
| TC_I18_100 | Translation consistency (same term = same translation) | Positive | P1 |
| TC_I18_101 | Plural handling (1 item vs 2 items) | Positive | P2 |
| TC_I18_102 | Gender-neutral translations | Positive | P3 |
| TC_I18_103 | Context-appropriate translations | Positive | P2 |
| TC_I18_104 | Translation testing tool/script | Positive | P3 |
| TC_I18_105 | All new features include both language keys | Positive | P1 |

---

## Đề xuất Cải tiến

### Đề xuất 1: Auto-Detect Browser Language
- **Vấn đề hiện tại**: Default vi. English users must find and switch manually.
- **Giải pháp đề xuất**: On first visit, detect navigator.language. Auto-set en for English browsers.
- **Phần trăm cải thiện**: First-time UX +50%, International user activation +40%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 2: Language-Specific Content
- **Vấn đề hiện tại**: Same dish/ingredient database regardless of language.
- **Giải pháp đề xuất**: Pre-loaded sample data in user's language. Vietnamese users get phở, English users get pasta.
- **Phần trăm cải thiện**: Relevance +40%, Onboarding quality +30%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Translation Contributors
- **Vấn đề hiện tại**: AI translations may be inaccurate. No community correction.
- **Giải pháp đề xuất**: "Suggest better translation" link on each label. Community-reviewed corrections.
- **Phần trăm cải thiện**: Translation quality +25%, Community engagement +30%
- **Mức độ ưu tiên**: Low | **Effort**: M

### Đề xuất 4: Additional Language Support
- **Vấn đề hiện tại**: Only vi and en. Large potential markets excluded.
- **Giải pháp đề xuất**: Add Japanese, Korean, Chinese, Thai. Leverage existing AI translation pipeline.
- **Phần trăm cải thiện**: Addressable market +200%, International downloads +60%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 5: In-Context Translation Preview
- **Vấn đề hiện tại**: Translators can't see how text looks in UI context.
- **Giải pháp đề xuất**: Dev mode: hover over text → show translation key + all language values. Edit inline.
- **Phần trăm cải thiện**: Translation workflow +50%, QA efficiency +40%
- **Mức độ ưu tiên**: Low | **Effort**: M

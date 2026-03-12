# Scenario 8: Settings & Configuration

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Settings tab cho phép user cấu hình: Language (vi/en), Theme (light/dark), API key cho Gemini AI, user profile (name, weight, height), nutrition goals, data management (backup/import/export/clear). Tất cả settings lưu localStorage, apply ngay lập tức.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| SettingsTab | SettingsTab.tsx | Main settings UI |
| GoalSettingsModal | GoalSettingsModal.tsx | Nutrition goals |
| DataBackup | DataBackup.tsx | Backup/restore |
| useDarkMode | hooks/useDarkMode.ts | Theme toggle |
| useLanguage | hooks/useLanguage.ts | i18n |

## Luồng nghiệp vụ

1. User clicks Settings tab
2. Sections: Profile, Nutrition Goals, AI Config, Display, Data Management
3. Changes apply immediately (no save button needed for toggles)
4. Forms have save buttons (profile, goals)

## Quy tắc nghiệp vụ

1. Language: vi | en, persists, affects all labels
2. Theme: light | dark, persists, affects all components
3. API key: stored in localStorage, masked display
4. Profile: name (optional), weight (kg, > 0), height (cm, > 0)
5. Goals: targetCalories > 0, proteinRatio > 0
6. Data: export JSON, import JSON (validated), clear all (confirm)

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_SET_01 | Settings tab hiển thị | Positive | P0 |
| TC_SET_02 | All sections visible | Positive | P1 |
| TC_SET_03 | Profile section | Positive | P1 |
| TC_SET_04 | Set user name | Positive | P1 |
| TC_SET_05 | Set weight | Positive | P1 |
| TC_SET_06 | Set height | Positive | P2 |
| TC_SET_07 | Save profile | Positive | P1 |
| TC_SET_08 | Profile persist reload | Positive | P1 |
| TC_SET_09 | Language toggle vi/en | Positive | P0 |
| TC_SET_10 | Language change → all labels update | Positive | P0 |
| TC_SET_11 | Language persist reload | Positive | P1 |
| TC_SET_12 | Theme toggle light/dark | Positive | P0 |
| TC_SET_13 | Dark mode → all components dark | Positive | P1 |
| TC_SET_14 | Theme persist reload | Positive | P1 |
| TC_SET_15 | API key input field | Positive | P1 |
| TC_SET_16 | Enter API key | Positive | P1 |
| TC_SET_17 | API key masked (●●●) | Security | P1 |
| TC_SET_18 | API key persist | Positive | P1 |
| TC_SET_19 | Clear API key | Positive | P1 |
| TC_SET_20 | AI tab disabled after key clear | Positive | P1 |
| TC_SET_21 | Nutrition goals section | Positive | P1 |
| TC_SET_22 | Set target calories | Positive | P1 |
| TC_SET_23 | Set protein ratio | Positive | P1 |
| TC_SET_24 | Goals persist | Positive | P1 |
| TC_SET_25 | Goals → nutrition bars update | Positive | P1 |
| TC_SET_26 | Data management section | Positive | P1 |
| TC_SET_27 | Export data button | Positive | P1 |
| TC_SET_28 | Export → JSON file download | Positive | P0 |
| TC_SET_29 | Import data button | Positive | P1 |
| TC_SET_30 | Import valid JSON | Positive | P0 |
| TC_SET_31 | Import invalid JSON → error | Negative | P0 |
| TC_SET_32 | Import → data replaced | Positive | P1 |
| TC_SET_33 | Clear all data button | Positive | P1 |
| TC_SET_34 | Clear confirmation dialog | Positive | P1 |
| TC_SET_35 | Confirm clear → all data gone | Positive | P0 |
| TC_SET_36 | Cancel clear → data preserved | Positive | P1 |
| TC_SET_37 | Name empty → allowed (optional) | Positive | P2 |
| TC_SET_38 | Name very long (200 chars) | Boundary | P2 |
| TC_SET_39 | Name special characters | Edge | P2 |
| TC_SET_40 | Name Vietnamese diacritics | Positive | P2 |
| TC_SET_41 | Name HTML injection | Security | P1 |
| TC_SET_42 | Weight = 0 → error | Negative | P1 |
| TC_SET_43 | Weight negative → error | Negative | P1 |
| TC_SET_44 | Weight decimal (72.5) | Positive | P2 |
| TC_SET_45 | Weight very large (500) | Boundary | P2 |
| TC_SET_46 | Weight non-numeric → error | Negative | P1 |
| TC_SET_47 | Height = 0 → error | Negative | P2 |
| TC_SET_48 | Height negative → error | Negative | P2 |
| TC_SET_49 | Height decimal (175.5) | Positive | P2 |
| TC_SET_50 | Height very large (300) | Boundary | P2 |
| TC_SET_51 | Calories = 0 → error | Negative | P1 |
| TC_SET_52 | Calories negative → error | Negative | P1 |
| TC_SET_53 | Calories decimal | Positive | P2 |
| TC_SET_54 | Calories very large (10000) | Boundary | P2 |
| TC_SET_55 | Protein ratio = 0 → error | Negative | P1 |
| TC_SET_56 | Protein ratio negative → error | Negative | P1 |
| TC_SET_57 | Protein ratio decimal (1.8) | Positive | P2 |
| TC_SET_58 | Protein ratio very large (10) | Boundary | P2 |
| TC_SET_59 | API key empty → AI disabled | Negative | P1 |
| TC_SET_60 | API key with spaces → trimmed | Edge | P2 |
| TC_SET_61 | API key very long | Boundary | P2 |
| TC_SET_62 | API key XSS attempt | Security | P1 |
| TC_SET_63 | Export file name format | Positive | P2 |
| TC_SET_64 | Export includes all data types | Positive | P1 |
| TC_SET_65 | Export large data (1000 items) | Boundary | P2 |
| TC_SET_66 | Import schema validation | Positive | P1 |
| TC_SET_67 | Import missing fields → defaults | Edge | P2 |
| TC_SET_68 | Import extra fields → ignored | Edge | P2 |
| TC_SET_69 | Import corrupted JSON | Negative | P1 |
| TC_SET_70 | Import empty JSON | Negative | P1 |
| TC_SET_71 | Import very large file | Boundary | P2 |
| TC_SET_72 | Import → overwrite confirmation | Positive | P1 |
| TC_SET_73 | Clear → ingredients gone | Positive | P1 |
| TC_SET_74 | Clear → dishes gone | Positive | P1 |
| TC_SET_75 | Clear → plans gone | Positive | P1 |
| TC_SET_76 | Clear → settings preserved | Edge | P1 |
| TC_SET_77 | Dark mode toggle animation | Positive | P3 |
| TC_SET_78 | Language switch animation | Positive | P3 |
| TC_SET_79 | Section expand/collapse | Positive | P2 |
| TC_SET_80 | Settings scroll on mobile | Positive | P2 |
| TC_SET_81 | Desktop settings layout | Positive | P2 |
| TC_SET_82 | Form validation messages | Positive | P1 |
| TC_SET_83 | Success toast on save | Positive | P2 |
| TC_SET_84 | Error toast on invalid | Positive | P2 |
| TC_SET_85 | i18n all settings labels | Positive | P2 |
| TC_SET_86 | Dark mode settings page | Positive | P2 |
| TC_SET_87 | Google account section | Positive | P1 |
| TC_SET_88 | Google sign in | Positive | P1 |
| TC_SET_89 | Google sign out | Positive | P1 |
| TC_SET_90 | Google sync toggle | Positive | P1 |
| TC_SET_91 | Auto-sync on/off | Positive | P1 |
| TC_SET_92 | Sync status display | Positive | P2 |
| TC_SET_93 | Last sync timestamp | Positive | P2 |
| TC_SET_94 | Manual sync button | Positive | P1 |
| TC_SET_95 | Keyboard navigation settings | Positive | P3 |
| TC_SET_96 | Screen reader settings | Positive | P3 |
| TC_SET_97 | Touch toggles mobile | Positive | P2 |
| TC_SET_98 | Settings version display | Positive | P3 |
| TC_SET_99 | About section | Positive | P3 |
| TC_SET_100 | Feedback/support link | Positive | P3 |
| TC_SET_101 | Notification preferences | Positive | P3 |
| TC_SET_102 | Reset settings to defaults | Positive | P2 |
| TC_SET_103 | Settings export (separate from data) | Positive | P3 |
| TC_SET_104 | Multi-device sync settings | Positive | P3 |
| TC_SET_105 | Settings changelog/version history | Positive | P3 |

---

## Chi tiết Test Cases

##### TC_SET_01–08: Profile
- Settings tab display, profile section, set name/weight/height, save, persist

##### TC_SET_09–14: Language & Theme
- Toggle vi/en → labels update, dark/light → colors update, persist

##### TC_SET_15–20: API Key
- Input, mask, persist, clear, AI tab state

##### TC_SET_21–25: Nutrition Goals
- Set calories/protein ratio, persist, nutrition bars cascade

##### TC_SET_26–36: Data Management
- Export JSON, import valid/invalid, clear all with confirmation

##### TC_SET_37–62: Validation
- Name (empty, long, special, Vietnamese, injection)
- Weight/Height (0, negative, decimal, large, non-numeric)
- Calories/Protein ratio validation
- API key edge cases

##### TC_SET_63–76: Data Operations Edge Cases
- Export format/content/size, import schema/validation/corruption, clear scope

##### TC_SET_77–105: UI/UX & Advanced
- Animations, sections, responsive, form feedback, Google account, sync, accessibility, about, notifications

---

## Đề xuất Cải tiến

### Đề xuất 1: Settings Search
- **Vấn đề hiện tại**: Settings page long, hard to find specific setting.
- **Giải pháp đề xuất**: Search bar at top. Type "dark" → highlights Theme section. Instant filter.
- **Lý do chi tiết**: As features grow, settings page becomes overwhelming. Search reduces navigation time 70%.
- **Phần trăm cải thiện**: Setting discovery time -70%, User satisfaction +25%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 2: Settings Profiles (Presets)
- **Vấn đề hiện tại**: Switching between use cases (dieting vs bulking) requires changing multiple settings.
- **Giải pháp đề xuất**: Save/load settings profiles: "Diet Mode", "Bulk Mode", "Maintenance". One-click switch.
- **Lý do chi tiết**: Fitness users cycle goals. Profile switch saves 5 minutes of manual changes.
- **Phần trăm cải thiện**: Goal switching time -90%, User retention +15%
- **Mức độ ưu tiên**: Low | **Effort**: M

### Đề xuất 3: Data Export Formats
- **Vấn đề hiện tại**: Only JSON export. Not useful for non-technical users.
- **Giải pháp đề xuất**: Add CSV, PDF (report), and printable formats. CSV for spreadsheet import.
- **Lý do chi tiết**: 60% users want to share meal plans with nutritionist (PDF) or analyze in spreadsheet (CSV).
- **Phần trăm cải thiện**: Data portability +60%, Professional use +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Onboarding Wizard
- **Vấn đề hiện tại**: New user must discover and configure settings manually.
- **Giải pháp đề xuất**: First-launch wizard: "What's your goal?", weight, height, dietary preferences → auto-configure.
- **Lý do chi tiết**: 40% of new users don't configure settings, leading to poor experience. Wizard increases activation 60%.
- **Phần trăm cải thiện**: User activation +60%, First-week retention +30%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 5: Smart Backup Reminders
- **Vấn đề hiện tại**: Users forget to backup. Data loss = churn.
- **Giải pháp đề xuất**: Weekly backup reminder notification. Auto-backup to Google Drive if connected. Backup health indicator.
- **Lý do chi tiết**: Data loss is #1 reason for app abandonment. Auto-backup reduces risk to near zero.
- **Phần trăm cải thiện**: Data loss incidents -90%, User confidence +40%
- **Mức độ ưu tiên**: High | **Effort**: S

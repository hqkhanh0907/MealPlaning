# Scenario 22: Dark Mode

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Dark Mode theme chuyển toàn bộ UI từ light theme sang dark theme. useDarkMode hook quản lý state và persist vào localStorage. Tailwind CSS dark: variants control styling. Toggle trong Settings tab. Affects all components, modals, forms, charts, progress bars.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| useDarkMode | hooks/useDarkMode.ts | Theme state |
| SettingsTab | SettingsTab.tsx | Toggle UI |
| All components | * | dark: variants |

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_DM_01 | Dark mode toggle visible | Positive | P0 |
| TC_DM_02 | Toggle off → light mode | Positive | P0 |
| TC_DM_03 | Toggle on → dark mode | Positive | P0 |
| TC_DM_04 | Persist after reload | Positive | P0 |
| TC_DM_05 | System preference detection | Positive | P2 |
| TC_DM_06 | Follow system preference | Positive | P2 |
| TC_DM_07 | Override system preference | Positive | P2 |
| TC_DM_08 | Background color dark | Positive | P1 |
| TC_DM_09 | Text color light | Positive | P1 |
| TC_DM_10 | Primary color adjusted | Positive | P1 |
| TC_DM_11 | Secondary color adjusted | Positive | P2 |
| TC_DM_12 | Border color adjusted | Positive | P2 |
| TC_DM_13 | Shadow adjusted | Positive | P2 |
| TC_DM_14 | Calendar tab dark | Positive | P1 |
| TC_DM_15 | Calendar grid dark | Positive | P1 |
| TC_DM_16 | Calendar date cells dark | Positive | P1 |
| TC_DM_17 | Today highlight visible dark | Positive | P1 |
| TC_DM_18 | Selected date visible dark | Positive | P1 |
| TC_DM_19 | Meal slots dark | Positive | P1 |
| TC_DM_20 | Management tab dark | Positive | P1 |
| TC_DM_21 | Ingredient list dark | Positive | P1 |
| TC_DM_22 | Dish list dark | Positive | P1 |
| TC_DM_23 | Item cards dark | Positive | P1 |
| TC_DM_24 | AI tab dark | Positive | P1 |
| TC_DM_25 | AI suggestion cards dark | Positive | P1 |
| TC_DM_26 | AI image analysis dark | Positive | P1 |
| TC_DM_27 | Grocery tab dark | Positive | P1 |
| TC_DM_28 | Grocery items dark | Positive | P1 |
| TC_DM_29 | Grocery checkboxes dark | Positive | P1 |
| TC_DM_30 | Settings tab dark | Positive | P1 |
| TC_DM_31 | Settings form dark | Positive | P1 |
| TC_DM_32 | Toggle switch dark | Positive | P1 |
| TC_DM_33 | Modal overlay dark | Positive | P1 |
| TC_DM_34 | Modal content dark | Positive | P1 |
| TC_DM_35 | Modal buttons dark | Positive | P1 |
| TC_DM_36 | Input fields dark | Positive | P1 |
| TC_DM_37 | Input focus ring dark | Positive | P2 |
| TC_DM_38 | Dropdown dark | Positive | P2 |
| TC_DM_39 | Toast notification dark | Positive | P1 |
| TC_DM_40 | Error toast dark | Positive | P1 |
| TC_DM_41 | Success toast dark | Positive | P1 |
| TC_DM_42 | Progress bars dark | Positive | P1 |
| TC_DM_43 | Nutrition bars colors dark | Positive | P1 |
| TC_DM_44 | Green/yellow/red visible dark | Positive | P1 |
| TC_DM_45 | Chart colors dark (if any) | Positive | P2 |
| TC_DM_46 | Icons dark theme | Positive | P1 |
| TC_DM_47 | Logo dark variant | Positive | P2 |
| TC_DM_48 | Tab bar dark | Positive | P1 |
| TC_DM_49 | Active tab indicator dark | Positive | P1 |
| TC_DM_50 | Desktop nav dark | Positive | P1 |
| TC_DM_51 | Bottom sheet dark | Positive | P2 |
| TC_DM_52 | Filter sheet dark | Positive | P2 |
| TC_DM_53 | Search bar dark | Positive | P2 |
| TC_DM_54 | Empty state dark | Positive | P2 |
| TC_DM_55 | Loading spinner dark | Positive | P2 |
| TC_DM_56 | Skeleton loader dark | Positive | P2 |
| TC_DM_57 | Confirm dialog dark | Positive | P1 |
| TC_DM_58 | Delete button dark (red visible) | Positive | P1 |
| TC_DM_59 | Disabled button dark | Positive | P2 |
| TC_DM_60 | Link color dark | Positive | P2 |
| TC_DM_61 | Hover state dark | Positive | P2 |
| TC_DM_62 | Focus state dark | Positive | P2 |
| TC_DM_63 | Scrollbar dark | Positive | P3 |
| TC_DM_64 | Selection highlight dark | Positive | P2 |
| TC_DM_65 | Text contrast ratio ≥ 4.5:1 | Positive | P1 |
| TC_DM_66 | Large text contrast ≥ 3:1 | Positive | P1 |
| TC_DM_67 | UI element contrast ≥ 3:1 | Positive | P1 |
| TC_DM_68 | No pure white on pure black | Positive | P2 |
| TC_DM_69 | Muted colors for reduced eye strain | Positive | P2 |
| TC_DM_70 | Transition animation smooth | Positive | P2 |
| TC_DM_71 | No flash on toggle | Positive | P2 |
| TC_DM_72 | Toggle instant (no delay) | Positive | P2 |
| TC_DM_73 | Toggle from any page | Positive | P1 |
| TC_DM_74 | Toggle while modal open | Edge | P2 |
| TC_DM_75 | Toggle during animation | Edge | P2 |
| TC_DM_76 | Toggle during translation | Edge | P2 |
| TC_DM_77 | Toggle during sync | Edge | P2 |
| TC_DM_78 | Mobile dark mode status bar | Positive | P2 |
| TC_DM_79 | iOS safe area dark | Edge | P2 |
| TC_DM_80 | Android nav bar dark | Edge | P2 |
| TC_DM_81 | Capacitor WebView dark | Positive | P2 |
| TC_DM_82 | Chrome dark mode compat | Positive | P2 |
| TC_DM_83 | Safari dark mode compat | Positive | P2 |
| TC_DM_84 | Firefox dark mode compat | Positive | P2 |
| TC_DM_85 | Image visibility dark bg | Positive | P2 |
| TC_DM_86 | SVG icon color dark | Positive | P2 |
| TC_DM_87 | Emoji visibility dark bg | Edge | P3 |
| TC_DM_88 | Date picker dark | Positive | P2 |
| TC_DM_89 | Quick preview panel dark | Positive | P2 |
| TC_DM_90 | Template manager dark | Positive | P2 |
| TC_DM_91 | Copy plan modal dark | Positive | P2 |
| TC_DM_92 | Clear plan modal dark | Positive | P2 |
| TC_DM_93 | Goal settings modal dark | Positive | P2 |
| TC_DM_94 | Save template modal dark | Positive | P2 |
| TC_DM_95 | Data backup UI dark | Positive | P2 |
| TC_DM_96 | Google Drive sync UI dark | Positive | P2 |
| TC_DM_97 | Translation progress dark | Positive | P2 |
| TC_DM_98 | Notification center dark | Positive | P2 |
| TC_DM_99 | About/version page dark | Positive | P3 |
| TC_DM_100 | Print: force light mode | Edge | P3 |
| TC_DM_101 | Screenshot: dark mode captured | Positive | P3 |
| TC_DM_102 | Dark mode with high contrast OS | Edge | P3 |
| TC_DM_103 | Dark mode + color-blind mode | Edge | P3 |
| TC_DM_104 | Dark mode energy savings display | Positive | P3 |
| TC_DM_105 | Dark mode CSS class: .dark on html | Positive | P1 |

---

## Đề xuất Cải tiến

### Đề xuất 1: Auto Dark Mode by Time
- **Vấn đề hiện tại**: Manual toggle only.
- **Giải pháp đề xuất**: Auto dark mode: 6 PM → dark, 6 AM → light. Follow system schedule or custom times.
- **Phần trăm cải thiện**: User comfort +30%, Eye strain -40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 2: Custom Theme Colors
- **Vấn đề hiện tại**: Only light/dark. No personalization.
- **Giải pháp đề xuất**: Color picker for primary accent color. Pre-built themes: "Ocean", "Forest", "Sunset".
- **Phần trăm cải thiện**: Personalization +60%, User satisfaction +30%
- **Mức độ ưu tiên**: Low | **Effort**: M

### Đề xuất 3: OLED Dark Mode
- **Vấn đề hiện tại**: Dark mode uses dark gray, not pure black. No OLED benefit.
- **Giải pháp đề xuất**: OLED mode option: true black (#000) backgrounds. Save 20-30% battery on OLED screens.
- **Phần trăm cải thiện**: Battery life +20%, OLED user satisfaction +40%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 4: Contrast Boost Mode
- **Vấn đề hiện tại**: Some users need higher contrast than standard dark mode.
- **Giải pháp đề xuất**: "High Contrast" toggle: bolder borders, brighter text, larger font option.
- **Phần trăm cải thiện**: Accessibility +50%, Vision-impaired usability +60%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 5: Per-Screen Theme
- **Vấn đề hiện tại**: Global dark mode. Some screens better in light mode.
- **Giải pháp đề xuất**: Per-screen theme override. E.g., always light for grocery shopping (outdoor), dark for night planning.
- **Phần trăm cải thiện**: Context-appropriate viewing +30%, Flexibility +40%
- **Mức độ ưu tiên**: Low | **Effort**: M

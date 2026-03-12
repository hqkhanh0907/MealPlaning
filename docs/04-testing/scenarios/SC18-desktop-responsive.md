# Scenario 18: Desktop Responsive Layout

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Desktop Responsive Layout adapts app UI cho màn hình lớn (>768px). useIsDesktop hook detects viewport. DesktopNav replaces bottom tabs. Side-by-side panels replace stacked mobile views. Calendar shows full week grid. Management shows split list/detail.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| useIsDesktop | hooks/useIsDesktop.ts | Viewport detection |
| DesktopNav | components/DesktopNav.tsx | Desktop sidebar nav |
| TabBar | components/TabBar.tsx | Mobile bottom tabs |

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_DL_01 | Desktop detected (>768px) | Positive | P0 |
| TC_DL_02 | Mobile detected (<=768px) | Positive | P0 |
| TC_DL_03 | Desktop nav sidebar visible | Positive | P0 |
| TC_DL_04 | Mobile bottom tabs visible | Positive | P0 |
| TC_DL_05 | Resize: mobile→desktop transitions | Positive | P1 |
| TC_DL_06 | Resize: desktop→mobile transitions | Positive | P1 |
| TC_DL_07 | Desktop nav: all tabs listed | Positive | P1 |
| TC_DL_08 | Desktop nav: Calendar tab | Positive | P1 |
| TC_DL_09 | Desktop nav: Management tab | Positive | P1 |
| TC_DL_10 | Desktop nav: AI Analysis tab | Positive | P1 |
| TC_DL_11 | Desktop nav: Grocery tab | Positive | P1 |
| TC_DL_12 | Desktop nav: Settings tab | Positive | P1 |
| TC_DL_13 | Active tab highlighted | Positive | P1 |
| TC_DL_14 | Click nav item → tab switch | Positive | P0 |
| TC_DL_15 | Calendar: week grid view | Positive | P1 |
| TC_DL_16 | Calendar: side-by-side day detail | Positive | P1 |
| TC_DL_17 | Calendar: nutrition panel on right | Positive | P2 |
| TC_DL_18 | Management: split list/detail | Positive | P1 |
| TC_DL_19 | Management: ingredient list left | Positive | P2 |
| TC_DL_20 | Management: ingredient detail right | Positive | P2 |
| TC_DL_21 | AI tab: wider prompt area | Positive | P2 |
| TC_DL_22 | AI tab: results in grid | Positive | P2 |
| TC_DL_23 | Grocery: wider list | Positive | P2 |
| TC_DL_24 | Settings: form centered | Positive | P2 |
| TC_DL_25 | Breakpoint 768px exact | Boundary | P1 |
| TC_DL_26 | Breakpoint 769px | Boundary | P2 |
| TC_DL_27 | Breakpoint 767px | Boundary | P2 |
| TC_DL_28 | Very wide screen (2560px) | Boundary | P2 |
| TC_DL_29 | Very narrow mobile (320px) | Boundary | P2 |
| TC_DL_30 | Tablet portrait (768px) | Boundary | P1 |
| TC_DL_31 | Tablet landscape (1024px) | Boundary | P1 |
| TC_DL_32 | 4K display (3840px) | Boundary | P2 |
| TC_DL_33 | Max-width container | Positive | P2 |
| TC_DL_34 | Content centered on wide screens | Positive | P2 |
| TC_DL_35 | No horizontal scroll | Positive | P1 |
| TC_DL_36 | Modal on desktop centered | Positive | P1 |
| TC_DL_37 | Modal on mobile full-screen | Positive | P1 |
| TC_DL_38 | Modal responsive transition | Positive | P2 |
| TC_DL_39 | Dark mode desktop layout | Positive | P2 |
| TC_DL_40 | Dark mode mobile layout | Positive | P2 |
| TC_DL_41 | Font size responsive | Positive | P2 |
| TC_DL_42 | Touch targets mobile (48px min) | Positive | P1 |
| TC_DL_43 | Click targets desktop | Positive | P2 |
| TC_DL_44 | Hover states desktop | Positive | P2 |
| TC_DL_45 | No hover on mobile | Positive | P2 |
| TC_DL_46 | Keyboard shortcuts desktop | Positive | P3 |
| TC_DL_47 | Mouse cursor styles | Positive | P3 |
| TC_DL_48 | Window resize real-time | Positive | P1 |
| TC_DL_49 | Orientation change mobile | Positive | P2 |
| TC_DL_50 | Portrait → landscape mobile | Positive | P2 |
| TC_DL_51 | Landscape → portrait mobile | Positive | P2 |
| TC_DL_52 | Split screen mobile | Edge | P3 |
| TC_DL_53 | Desktop sidebar collapse | Positive | P3 |
| TC_DL_54 | Desktop sidebar expand | Positive | P3 |
| TC_DL_55 | Desktop breadcrumb navigation | Positive | P3 |
| TC_DL_56 | Grid layout breakpoints | Positive | P2 |
| TC_DL_57 | Flex layout on mobile | Positive | P2 |
| TC_DL_58 | Grid → flex transition | Positive | P2 |
| TC_DL_59 | Image responsive sizing | Positive | P2 |
| TC_DL_60 | Icon sizes responsive | Positive | P2 |
| TC_DL_61 | Padding/margin responsive | Positive | P2 |
| TC_DL_62 | Text overflow handling | Positive | P2 |
| TC_DL_63 | Long text truncation mobile | Positive | P2 |
| TC_DL_64 | Long text wrapping desktop | Positive | P2 |
| TC_DL_65 | Table responsive (if any) | Positive | P2 |
| TC_DL_66 | Card layout responsive | Positive | P2 |
| TC_DL_67 | Form input width responsive | Positive | P2 |
| TC_DL_68 | Button width responsive | Positive | P2 |
| TC_DL_69 | Navigation state preserved on resize | Positive | P1 |
| TC_DL_70 | Data state preserved on resize | Positive | P1 |
| TC_DL_71 | Modal open → resize → layout correct | Edge | P2 |
| TC_DL_72 | Calendar view mode preserved | Positive | P2 |
| TC_DL_73 | Selected date preserved | Positive | P2 |
| TC_DL_74 | Form data preserved on resize | Positive | P2 |
| TC_DL_75 | Desktop: multi-panel interaction | Positive | P2 |
| TC_DL_76 | Desktop: click list → detail updates | Positive | P2 |
| TC_DL_77 | Mobile: full-screen detail | Positive | P2 |
| TC_DL_78 | Mobile: back button from detail | Positive | P2 |
| TC_DL_79 | Desktop: no back button needed | Positive | P2 |
| TC_DL_80 | Desktop: drag support | Positive | P3 |
| TC_DL_81 | Mobile: swipe navigation | Positive | P2 |
| TC_DL_82 | Desktop: right-click context menu | Positive | P3 |
| TC_DL_83 | Print layout desktop | Positive | P3 |
| TC_DL_84 | CSS media queries correct | Positive | P1 |
| TC_DL_85 | Tailwind responsive classes | Positive | P1 |
| TC_DL_86 | No overlapping elements | Positive | P1 |
| TC_DL_87 | Z-index correct (modal on top) | Positive | P1 |
| TC_DL_88 | Scroll behavior: smooth desktop | Positive | P2 |
| TC_DL_89 | Scroll behavior: momentum mobile | Positive | P2 |
| TC_DL_90 | Virtual keyboard mobile → layout adjust | Edge | P2 |
| TC_DL_91 | Notch safe area (iPhone) | Edge | P2 |
| TC_DL_92 | Status bar area (Android) | Edge | P2 |
| TC_DL_93 | PWA display mode | Edge | P3 |
| TC_DL_94 | Capacitor webview | Positive | P2 |
| TC_DL_95 | Chrome desktop | Positive | P1 |
| TC_DL_96 | Safari desktop | Positive | P2 |
| TC_DL_97 | Firefox desktop | Positive | P2 |
| TC_DL_98 | Chrome mobile | Positive | P1 |
| TC_DL_99 | Safari mobile (iOS) | Positive | P2 |
| TC_DL_100 | Samsung Internet | Positive | P3 |
| TC_DL_101 | Edge desktop | Positive | P3 |
| TC_DL_102 | CSS custom properties responsive | Positive | P2 |
| TC_DL_103 | Animation performance mobile | Boundary | P2 |
| TC_DL_104 | Render performance desktop | Boundary | P2 |
| TC_DL_105 | Memory usage mobile vs desktop | Boundary | P3 |

---

## Đề xuất Cải tiến

### Đề xuất 1: Adaptive Dashboard
- **Vấn đề hiện tại**: Same content arrangement on all desktop sizes.
- **Giải pháp đề xuất**: 3 breakpoints: tablet (768-1024), laptop (1024-1440), monitor (1440+). Each with optimized layout.
- **Phần trăm cải thiện**: Desktop usability +40%, Space utilization +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Desktop Keyboard Shortcuts
- **Vấn đề hiện tại**: No keyboard shortcuts. Mouse-only navigation.
- **Giải pháp đề xuất**: Cmd+1-5 for tabs, Cmd+N for new, Cmd+S for save, Cmd+F for search.
- **Phần trăm cải thiện**: Power user efficiency +50%, Desktop experience +40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 3: Drag & Drop Planning
- **Vấn đề hiện tại**: Desktop users can't drag dishes to calendar slots.
- **Giải pháp đề xuất**: Drag dish from list → drop on calendar slot. Drag to rearrange meals. Touch + mouse.
- **Phần trăm cải thiện**: Planning speed +60%, Desktop engagement +45%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 4: Multi-Panel View
- **Vấn đề hiện tại**: One active panel at a time.
- **Giải pháp đề xuất**: Resizable panels: Calendar + Grocery side by side. Or Management + AI. User configurable.
- **Phần trăm cải thiện**: Multitasking +60%, Desktop productivity +40%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 5: Desktop Notification Center
- **Vấn đề hiện tại**: Toast notifications disappear. No history.
- **Giải pháp đề xuất**: Notification center in sidebar. History of all actions. Undo from history.
- **Phần trăm cải thiện**: Action reversibility +40%, Awareness +30%
- **Mức độ ưu tiên**: Low | **Effort**: M

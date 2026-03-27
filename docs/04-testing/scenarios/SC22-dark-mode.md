# Scenario 22: Dark Mode

**Version:** 2.0  
**Date:** 2026-03-15  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Dark Mode chuyển đổi toàn bộ UI từ light theme sang dark theme. useDarkMode hook quản lý 4 chế độ: 'light', 'dark', 'system', 'schedule'. cycleTheme() xoay vòng qua các chế độ. Schedule mode tự động chuyển dark 18:00-06:00. System mode theo OS preference (prefers-color-scheme). Thêm/xóa class 'dark' trên document.documentElement. Persist trong localStorage key 'mp-theme'. Tất cả components dùng Tailwind dark: variants (dark:bg-slate-800, dark:text-slate-100).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| useDarkMode | hooks/useDarkMode.ts | Theme state: light/dark/system/schedule, cycleTheme(), persist |
| SettingsTab | pages/SettingsTab.tsx | Theme toggle UI trong Settings |
| All components | *.tsx | dark: Tailwind variants cho mỗi component |

## Luồng nghiệp vụ

1. User mở Settings → Theme section
2. Toggle theme: light → dark → system → schedule (cycle)
3. useDarkMode thêm/xóa class 'dark' trên html element
4. Tailwind dark: variants activate/deactivate
5. System mode: listen prefers-color-scheme media query
6. Schedule mode: check time 18:00-06:00 → dark, else → light
7. Theme persist trong localStorage key 'mp-theme'
8. Reload → đọc mp-theme → apply theme ngay lập tức (no flash)

## Quy tắc nghiệp vụ

1. 4 theme modes: light, dark, system, schedule
2. cycleTheme(): light → dark → system → schedule → light
3. System mode: follow OS prefers-color-scheme
4. Schedule mode: 18:00-06:00 = dark, 06:00-18:00 = light
5. Persist: localStorage key 'mp-theme'
6. DOM: class 'dark' on document.documentElement
7. No flash of wrong theme on load
8. Contrast ratio ≥ 4.5:1 cho body text (WCAG AA)
9. No pure white (#fff) on pure black (#000) - dùng slate tones


## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|---|---|---|---|
| TC_DM_001 | Toggle từ light sang dark | Positive | P0 |
| TC_DM_002 | Toggle từ dark sang system | Positive | P0 |
| TC_DM_003 | Toggle từ system sang schedule | Positive | P1 |
| TC_DM_004 | Toggle từ schedule sang light | Positive | P1 |
| TC_DM_005 | cycleTheme() full cycle | Positive | P1 |
| TC_DM_006 | Persist theme sau reload | Positive | P0 |
| TC_DM_007 | localStorage mp-theme = 'dark' | Positive | P1 |
| TC_DM_008 | localStorage mp-theme = 'system' | Positive | P2 |
| TC_DM_009 | localStorage mp-theme = 'schedule' | Positive | P2 |
| TC_DM_010 | System mode: OS dark → app dark | Positive | P1 |
| TC_DM_011 | System mode: OS light → app light | Positive | P1 |
| TC_DM_012 | System mode: thay đổi OS setting → app follow | Positive | P1 |
| TC_DM_013 | Schedule mode: 19:00 → dark | Positive | P2 |
| TC_DM_014 | Schedule mode: 10:00 → light | Positive | P2 |
| TC_DM_015 | Schedule mode: 18:00 exact → dark | Boundary | P2 |
| TC_DM_016 | Schedule mode: 06:00 exact → light | Boundary | P2 |
| TC_DM_017 | Toggle từ bất kỳ tab nào | Positive | P1 |
| TC_DM_018 | Toggle khi modal đang mở | Edge | P2 |
| TC_DM_019 | No flash of wrong theme on load | Positive | P0 |
| TC_DM_020 | Class 'dark' on html element | Positive | P1 |
| TC_DM_021 | Class 'dark' removed khi light | Positive | P1 |
| TC_DM_022 | Theme toggle accessible by keyboard | Positive | P3 |
| TC_DM_023 | Screen reader announces theme change | Positive | P3 |
| TC_DM_024 | Corrupt mp-theme value → default light | Edge | P2 |
| TC_DM_025 | mp-theme missing → default light | Positive | P1 |
| TC_DM_026 | Dark: main background dark | Positive | P1 |
| TC_DM_027 | Dark: card background | Positive | P1 |
| TC_DM_028 | Dark: modal background | Positive | P1 |
| TC_DM_029 | Dark: sidebar/nav background | Positive | P1 |
| TC_DM_030 | Dark: bottom sheet background | Positive | P1 |
| TC_DM_031 | Dark: header background | Positive | P1 |
| TC_DM_032 | Dark: dropdown background | Positive | P2 |
| TC_DM_033 | Dark: tooltip background | Positive | P2 |
| TC_DM_034 | Dark: toast background | Positive | P1 |
| TC_DM_035 | Light: tất cả background trắng/sáng | Positive | P1 |
| TC_DM_036 | Transition smooth khi toggle | Positive | P2 |
| TC_DM_037 | No flicker khi transition | Positive | P2 |
| TC_DM_038 | Dark: input field background | Positive | P1 |
| TC_DM_039 | Dark: select/dropdown field | Positive | P2 |
| TC_DM_040 | Dark: textarea background | Positive | P2 |
| TC_DM_041 | Dark: table background (nếu có) | Positive | P2 |
| TC_DM_042 | Dark: progress bar track | Positive | P2 |
| TC_DM_043 | Dark: scrollbar styling | Positive | P3 |
| TC_DM_044 | Dark: checkbox/radio background | Positive | P2 |
| TC_DM_045 | Dark: skeleton loader | Positive | P2 |
| TC_DM_046 | Dark: heading text light | Positive | P1 |
| TC_DM_047 | Dark: body text light | Positive | P1 |
| TC_DM_048 | Dark: muted/secondary text | Positive | P2 |
| TC_DM_049 | Dark: placeholder text | Positive | P2 |
| TC_DM_050 | Dark: link color | Positive | P2 |
| TC_DM_051 | Dark: error text red visible | Positive | P1 |
| TC_DM_052 | Dark: success text green | Positive | P1 |
| TC_DM_053 | Dark: warning text yellow | Positive | P2 |
| TC_DM_054 | Dark: icon colors adjusted | Positive | P1 |
| TC_DM_055 | Dark: emoji visibility trên dark bg | Positive | P2 |
| TC_DM_056 | Light: all dark text on light bg | Positive | P1 |
| TC_DM_057 | Contrast ≥ 4.5:1 body text dark | Positive | P0 |
| TC_DM_058 | Contrast ≥ 3:1 large text dark | Positive | P1 |
| TC_DM_059 | No pure white (#fff) on pure black (#000) | Positive | P2 |
| TC_DM_060 | Dark: label text in forms | Positive | P1 |
| TC_DM_061 | Dark: button text primary | Positive | P1 |
| TC_DM_062 | Dark: button text secondary | Positive | P2 |
| TC_DM_063 | Dark: button text danger/delete | Positive | P1 |
| TC_DM_064 | Dark: disabled text | Positive | P2 |
| TC_DM_065 | Dark: badge/tag text | Positive | P2 |
| TC_DM_066 | Calendar tab dark | Positive | P1 |
| TC_DM_067 | Calendar grid dark | Positive | P1 |
| TC_DM_068 | Calendar date cells dark | Positive | P1 |
| TC_DM_069 | Today highlight dark | Positive | P1 |
| TC_DM_070 | Selected date dark | Positive | P1 |
| TC_DM_071 | Meal slots dark | Positive | P1 |
| TC_DM_072 | Nutrition bars dark | Positive | P1 |
| TC_DM_073 | Date picker dark | Positive | P2 |
| TC_DM_074 | Quick preview panel dark | Positive | P1 |
| TC_DM_075 | Calendar header dark | Positive | P2 |
| TC_DM_076 | Week/month view dark | Positive | P2 |
| TC_DM_077 | Empty day dark | Positive | P2 |
| TC_DM_078 | Calendar navigation arrows dark | Positive | P2 |
| TC_DM_079 | Calendar plan all button dark | Positive | P2 |
| TC_DM_080 | Calendar sub-tabs dark | Positive | P2 |
| TC_DM_081 | Management tab dark | Positive | P1 |
| TC_DM_082 | Ingredient list dark | Positive | P1 |
| TC_DM_083 | Dish list dark | Positive | P1 |
| TC_DM_084 | Item cards dark | Positive | P1 |
| TC_DM_085 | Search bar dark | Positive | P2 |
| TC_DM_086 | Filter button dark | Positive | P2 |
| TC_DM_087 | ListToolbar dark | Positive | P2 |
| TC_DM_088 | Add button dark | Positive | P2 |
| TC_DM_089 | Edit form dark | Positive | P1 |
| TC_DM_090 | Delete confirm dark | Positive | P1 |
| TC_DM_091 | AI tab dark | Positive | P1 |
| TC_DM_092 | AI suggestion cards dark | Positive | P1 |
| TC_DM_093 | AI image preview dark | Positive | P2 |
| TC_DM_094 | AI loading dark | Positive | P2 |
| TC_DM_095 | Grocery tab dark | Positive | P1 |
| TC_DM_096 | Grocery items dark | Positive | P1 |
| TC_DM_097 | Grocery checkboxes dark | Positive | P1 |
| TC_DM_098 | Grocery category headers dark | Positive | P2 |
| TC_DM_099 | Settings tab dark | Positive | P1 |
| TC_DM_100 | Settings form inputs dark | Positive | P1 |
| TC_DM_101 | Settings toggle switches dark | Positive | P1 |
| TC_DM_102 | Settings section headers dark | Positive | P2 |
| TC_DM_103 | Fitness tab dark | Positive | P2 |
| TC_DM_104 | Dashboard tab dark | Positive | P2 |
| TC_DM_105 | Sync UI dark | Positive | P2 |
| TC_DM_106 | Template manager dark | Positive | P2 |
| TC_DM_107 | Copy plan modal dark | Positive | P2 |
| TC_DM_108 | Clear plan modal dark | Positive | P2 |
| TC_DM_109 | Goal settings dark | Positive | P2 |
| TC_DM_110 | About/version dark | Positive | P3 |
| TC_DM_111 | Data backup UI dark | Positive | P2 |
| TC_DM_112 | Notification center dark | Positive | P2 |
| TC_DM_113 | Translation UI dark | Positive | P2 |
| TC_DM_114 | Error boundary dark | Positive | P2 |
| TC_DM_115 | Loading spinner dark | Positive | P2 |
| TC_DM_116 | Modal overlay dark dim | Positive | P1 |
| TC_DM_117 | Modal content area dark | Positive | P1 |
| TC_DM_118 | Modal title text dark | Positive | P1 |
| TC_DM_119 | Primary button dark | Positive | P1 |
| TC_DM_120 | Secondary button dark | Positive | P2 |
| TC_DM_121 | Danger button dark | Positive | P1 |
| TC_DM_122 | Input fields dark | Positive | P1 |
| TC_DM_123 | Input focus ring dark | Positive | P2 |
| TC_DM_124 | Select dropdown dark | Positive | P2 |
| TC_DM_125 | Checkbox dark | Positive | P2 |
| TC_DM_126 | Radio button dark | Positive | P2 |
| TC_DM_127 | Textarea dark | Positive | P2 |
| TC_DM_128 | Validation error msg dark | Positive | P1 |
| TC_DM_129 | Toast success dark | Positive | P1 |
| TC_DM_130 | Toast error dark | Positive | P1 |
| TC_DM_131 | Toast warning dark | Positive | P2 |
| TC_DM_132 | Confirm dialog dark | Positive | P1 |
| TC_DM_133 | Bottom sheet dark | Positive | P2 |
| TC_DM_134 | Filter sheet dark | Positive | P2 |
| TC_DM_135 | Date picker dark | Positive | P2 |
| TC_DM_136 | Modal backdrop opacity | Positive | P2 |
| TC_DM_137 | Modal animation dark | Positive | P2 |
| TC_DM_138 | Form label dark | Positive | P1 |
| TC_DM_139 | Disabled input dark | Positive | P2 |
| TC_DM_140 | Empty state modal dark | Positive | P2 |
| TC_DM_141 | Calorie progress bar dark | Positive | P1 |
| TC_DM_142 | Protein progress bar dark | Positive | P1 |
| TC_DM_143 | Carbs progress bar dark | Positive | P2 |
| TC_DM_144 | Fat progress bar dark | Positive | P2 |
| TC_DM_145 | Fiber progress bar dark | Positive | P2 |
| TC_DM_146 | Bar green visible dark | Positive | P1 |
| TC_DM_147 | Bar yellow visible dark | Positive | P1 |
| TC_DM_148 | Bar red visible dark | Positive | P1 |
| TC_DM_149 | Bar track visible dark | Positive | P2 |
| TC_DM_150 | Bar labels dark | Positive | P2 |
| TC_DM_151 | Daily total bar dark | Positive | P1 |
| TC_DM_152 | Per-meal mini bars dark | Positive | P2 |
| TC_DM_153 | Progress percentage text dark | Positive | P2 |
| TC_DM_154 | Chart colors dark | Positive | P2 |
| TC_DM_155 | Chart axis labels dark | Positive | P2 |
| TC_DM_156 | Chart legend dark | Positive | P2 |
| TC_DM_157 | Chart grid lines dark | Positive | P3 |
| TC_DM_158 | Donut chart dark | Positive | P3 |
| TC_DM_159 | Bar chart dark | Positive | P3 |
| TC_DM_160 | Progress animation dark | Positive | P2 |
| TC_DM_161 | Transition animation light→dark smooth | Positive | P2 |
| TC_DM_162 | Transition animation dark→light smooth | Positive | P2 |
| TC_DM_163 | No flash on toggle | Positive | P2 |
| TC_DM_164 | Toggle instant | Positive | P2 |
| TC_DM_165 | Toggle không reset scroll position | Positive | P2 |
| TC_DM_166 | Toggle không đóng modal | Positive | P2 |
| TC_DM_167 | Toggle không mất form data | Positive | P1 |
| TC_DM_168 | Toggle khi đang sync | Edge | P2 |
| TC_DM_169 | Toggle khi AI loading | Edge | P2 |
| TC_DM_170 | Toggle nhiều lần nhanh | Edge | P2 |
| TC_DM_171 | Theme switch performance | Positive | P2 |
| TC_DM_172 | CSS variables update đúng | Positive | P2 |
| TC_DM_173 | Dark mode CSS class propagation | Positive | P1 |
| TC_DM_174 | Color scheme meta tag update | Positive | P2 |
| TC_DM_175 | Theme switch event fired | Positive | P2 |
| TC_DM_176 | Transition không ảnh hưởng animation khác | Positive | P2 |
| TC_DM_177 | Toggle từ quick settings | Positive | P2 |
| TC_DM_178 | Toggle với shortcut key | Positive | P3 |
| TC_DM_179 | First paint: đúng theme | Positive | P0 |
| TC_DM_180 | Theme flicker prevention script | Positive | P1 |
| TC_DM_181 | Chrome desktop: dark mode correct | Positive | P1 |
| TC_DM_182 | Safari desktop: dark mode correct | Positive | P2 |
| TC_DM_183 | Firefox: dark mode correct | Positive | P2 |
| TC_DM_184 | Chrome mobile: dark mode | Positive | P1 |
| TC_DM_185 | Safari iOS: dark mode | Positive | P2 |
| TC_DM_186 | Capacitor WebView: dark mode | Positive | P2 |
| TC_DM_187 | Mobile status bar dark | Positive | P2 |
| TC_DM_188 | iOS safe area dark | Edge | P2 |
| TC_DM_189 | Android nav bar dark | Edge | P2 |
| TC_DM_190 | Print: force light mode | Edge | P3 |
| TC_DM_191 | Screenshot captures dark mode | Positive | P3 |
| TC_DM_192 | High contrast OS + dark mode | Edge | P3 |
| TC_DM_193 | Color-blind friendly dark | Edge | P3 |
| TC_DM_194 | OLED dark (nếu có option) | Positive | P3 |
| TC_DM_195 | Energy saving display dark | Positive | P3 |
| TC_DM_196 | Dark mode + zoom 150% | Edge | P2 |
| TC_DM_197 | Dark mode + responsive resize | Positive | P2 |
| TC_DM_198 | Dark mode + language change | Positive | P2 |
| TC_DM_199 | Dark mode + sync | Positive | P2 |
| TC_DM_200 | Dark mode localStorage key 'mp-theme' | Positive | P1 |
| TC_DM_201 | Dark mode: empty state illustrations | Positive | P2 |
| TC_DM_202 | Dark mode: loading skeleton shimmer | Positive | P2 |
| TC_DM_203 | Dark mode: divider lines | Positive | P2 |
| TC_DM_204 | Dark mode: shadow adjusted | Positive | P2 |
| TC_DM_205 | Dark mode: gradient backgrounds | Positive | P2 |
| TC_DM_206 | Dark mode: selection highlight | Positive | P2 |
| TC_DM_207 | Dark mode: focus visible ring | Positive | P2 |
| TC_DM_208 | Dark mode: hover state subtle | Positive | P2 |
| TC_DM_209 | Dark mode: active/pressed state | Positive | P2 |
| TC_DM_210 | Dark mode: overall aesthetic quality | Positive | P1 |

---

## Chi tiết Test Cases

### Nhóm 1: Theme Toggle & Modes (Chuyển đổi theme) (TC_DM_001 – TC_DM_025)

### TC_DM_001: Toggle từ light sang dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_001 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Theme = light |
| **Các bước thực hiện** | 1. Mở Settings > Theme<br>2. Click toggle/cycle |
| **Kết quả mong đợi** | UI chuyển sang dark: nền tối, text sáng |
| **Kết quả test thực tế** | — |

### TC_DM_002: Toggle từ dark sang system

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_002 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Theme = dark |
| **Các bước thực hiện** | 1. Click cycle theme |
| **Kết quả mong đợi** | Chuyển sang system mode, follow OS |
| **Kết quả test thực tế** | — |

### TC_DM_003: Toggle từ system sang schedule

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_003 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = system |
| **Các bước thực hiện** | 1. Click cycle |
| **Kết quả mong đợi** | Chuyển sang schedule mode |
| **Kết quả test thực tế** | — |

### TC_DM_004: Toggle từ schedule sang light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_004 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = schedule |
| **Các bước thực hiện** | 1. Click cycle |
| **Kết quả mong đợi** | Quay về light mode |
| **Kết quả test thực tế** | — |

### TC_DM_005: cycleTheme() full cycle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_005 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = light |
| **Các bước thực hiện** | 1. Click cycle 4 lần |
| **Kết quả mong đợi** | light→dark→system→schedule→light |
| **Kết quả test thực tế** | — |

### TC_DM_006: Persist theme sau reload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_006 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Theme = dark |
| **Các bước thực hiện** | 1. Reload page (F5) |
| **Kết quả mong đợi** | Theme vẫn dark sau reload |
| **Kết quả test thực tế** | — |

### TC_DM_007: localStorage mp-theme = 'dark'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_007 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = dark |
| **Các bước thực hiện** | 1. Kiểm tra localStorage |
| **Kết quả mong đợi** | mp-theme = 'dark' |
| **Kết quả test thực tế** | — |

### TC_DM_008: localStorage mp-theme = 'system'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_008 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Theme = system |
| **Các bước thực hiện** | 1. Kiểm tra localStorage |
| **Kết quả mong đợi** | mp-theme = 'system' |
| **Kết quả test thực tế** | — |

### TC_DM_009: localStorage mp-theme = 'schedule'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_009 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Theme = schedule |
| **Các bước thực hiện** | 1. Kiểm tra localStorage |
| **Kết quả mong đợi** | mp-theme = 'schedule' |
| **Kết quả test thực tế** | — |

### TC_DM_010: System mode: OS dark → app dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_010 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = system, OS = dark |
| **Các bước thực hiện** | 1. Kiểm tra app theme |
| **Kết quả mong đợi** | App hiển thị dark mode |
| **Kết quả test thực tế** | — |

### TC_DM_011: System mode: OS light → app light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_011 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = system, OS = light |
| **Các bước thực hiện** | 1. Kiểm tra app theme |
| **Kết quả mong đợi** | App hiển thị light mode |
| **Kết quả test thực tế** | — |

### TC_DM_012: System mode: thay đổi OS setting → app follow

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_012 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = system |
| **Các bước thực hiện** | 1. Thay đổi OS dark mode setting |
| **Kết quả mong đợi** | App chuyển theo OS ngay lập tức |
| **Kết quả test thực tế** | — |

### TC_DM_013: Schedule mode: 19:00 → dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_013 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Theme = schedule, time = 19:00 |
| **Các bước thực hiện** | 1. Kiểm tra theme |
| **Kết quả mong đợi** | App ở dark mode (sau 18:00) |
| **Kết quả test thực tế** | — |

### TC_DM_014: Schedule mode: 10:00 → light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_014 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Theme = schedule, time = 10:00 |
| **Các bước thực hiện** | 1. Kiểm tra theme |
| **Kết quả mong đợi** | App ở light mode (trước 18:00) |
| **Kết quả test thực tế** | — |

### TC_DM_015: Schedule mode: 18:00 exact → dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_015 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Time = 18:00 |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | App chuyển sang dark |
| **Kết quả test thực tế** | — |

### TC_DM_016: Schedule mode: 06:00 exact → light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_016 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Time = 06:00 |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | App chuyển sang light |
| **Kết quả test thực tế** | — |

### TC_DM_017: Toggle từ bất kỳ tab nào

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_017 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Đang ở tab Quản lý |
| **Các bước thực hiện** | 1. Vào Settings, toggle theme |
| **Kết quả mong đợi** | Theme thay đổi, quay lại tab Quản lý → dark mode applied |
| **Kết quả test thực tế** | — |

### TC_DM_018: Toggle khi modal đang mở

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_018 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal đang mở |
| **Các bước thực hiện** | 1. Toggle theme qua shortcut (nếu có) |
| **Kết quả mong đợi** | Modal cũng chuyển theme |
| **Kết quả test thực tế** | — |

### TC_DM_019: No flash of wrong theme on load

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_019 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Theme = dark |
| **Các bước thực hiện** | 1. Reload<br>2. Quan sát |
| **Kết quả mong đợi** | Không flash light theme rồi mới chuyển dark |
| **Kết quả test thực tế** | — |

### TC_DM_020: Class 'dark' on html element

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_020 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = dark |
| **Các bước thực hiện** | 1. document.documentElement.classList |
| **Kết quả mong đợi** | Contains 'dark' |
| **Kết quả test thực tế** | — |

### TC_DM_021: Class 'dark' removed khi light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_021 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = light |
| **Các bước thực hiện** | 1. document.documentElement.classList |
| **Kết quả mong đợi** | Not contains 'dark' |
| **Kết quả test thực tế** | — |

### TC_DM_022: Theme toggle accessible by keyboard

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_022 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Desktop |
| **Các bước thực hiện** | 1. Tab đến toggle, Enter |
| **Kết quả mong đợi** | Theme cycle bằng keyboard |
| **Kết quả test thực tế** | — |

### TC_DM_023: Screen reader announces theme change

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_023 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Screen reader bật |
| **Các bước thực hiện** | 1. Toggle theme |
| **Kết quả mong đợi** | 'Đã chuyển sang chế độ tối' announced |
| **Kết quả test thực tế** | — |

### TC_DM_024: Corrupt mp-theme value → default light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_024 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage mp-theme = 'invalid' |
| **Các bước thực hiện** | 1. Reload app |
| **Kết quả mong đợi** | App dùng light mode (default) |
| **Kết quả test thực tế** | — |

### TC_DM_025: mp-theme missing → default light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_025 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage không có mp-theme |
| **Các bước thực hiện** | 1. Mở app lần đầu |
| **Kết quả mong đợi** | Light mode mặc định |
| **Kết quả test thực tế** | — |

### Nhóm 2: Background & Surface Colors (Màu nền) (TC_DM_026 – TC_DM_045)

### TC_DM_026: Dark: main background dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_026 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra body/main background |
| **Kết quả mong đợi** | Background dark (slate-800 hoặc tương tự) |
| **Kết quả test thực tế** | — |

### TC_DM_027: Dark: card background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_027 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra ingredient/dish cards |
| **Kết quả mong đợi** | Cards có dark background (slate-700) |
| **Kết quả test thực tế** | — |

### TC_DM_028: Dark: modal background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_028 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode, modal mở |
| **Các bước thực hiện** | 1. Kiểm tra modal |
| **Kết quả mong đợi** | Modal dark background |
| **Kết quả test thực tế** | — |

### TC_DM_029: Dark: sidebar/nav background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_029 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode, desktop |
| **Các bước thực hiện** | 1. Kiểm tra sidebar |
| **Kết quả mong đợi** | Sidebar dark |
| **Kết quả test thực tế** | — |

### TC_DM_030: Dark: bottom sheet background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_030 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode, mobile |
| **Các bước thực hiện** | 1. Mở bottom sheet |
| **Kết quả mong đợi** | Sheet dark |
| **Kết quả test thực tế** | — |

### TC_DM_031: Dark: header background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_031 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra header |
| **Kết quả mong đợi** | Header dark |
| **Kết quả test thực tế** | — |

### TC_DM_032: Dark: dropdown background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_032 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, dropdown mở |
| **Các bước thực hiện** | 1. Mở dropdown |
| **Kết quả mong đợi** | Dropdown dark |
| **Kết quả test thực tế** | — |

### TC_DM_033: Dark: tooltip background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_033 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, hover tooltip |
| **Các bước thực hiện** | 1. Hover element có tooltip |
| **Kết quả mong đợi** | Tooltip dark |
| **Kết quả test thực tế** | — |

### TC_DM_034: Dark: toast background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_034 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode, trigger toast |
| **Các bước thực hiện** | 1. Trigger notification |
| **Kết quả mong đợi** | Toast dark background |
| **Kết quả test thực tế** | — |

### TC_DM_035: Light: tất cả background trắng/sáng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_035 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Light mode |
| **Các bước thực hiện** | 1. Kiểm tra backgrounds |
| **Kết quả mong đợi** | Backgrounds white/light gray |
| **Kết quả test thực tế** | — |

### TC_DM_036: Transition smooth khi toggle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_036 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Toggle theme |
| **Các bước thực hiện** | 1. Quan sát transition |
| **Kết quả mong đợi** | Colors transition smooth (~200ms) |
| **Kết quả test thực tế** | — |

### TC_DM_037: No flicker khi transition

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_037 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Toggle theme |
| **Các bước thực hiện** | 1. Quan sát |
| **Kết quả mong đợi** | Không flicker hoặc flash sai màu |
| **Kết quả test thực tế** | — |

### TC_DM_038: Dark: input field background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_038 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode, form mở |
| **Các bước thực hiện** | 1. Kiểm tra inputs |
| **Kết quả mong đợi** | Input fields dark |
| **Kết quả test thực tế** | — |

### TC_DM_039: Dark: select/dropdown field

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_039 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Mở select |
| **Kết quả mong đợi** | Select dark background |
| **Kết quả test thực tế** | — |

### TC_DM_040: Dark: textarea background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_040 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, textarea |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Textarea dark |
| **Kết quả test thực tế** | — |

### TC_DM_041: Dark: table background (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_041 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, table view |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Table rows dark |
| **Kết quả test thực tế** | — |

### TC_DM_042: Dark: progress bar track

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_042 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra nutrition bars |
| **Kết quả mong đợi** | Track (background) visible dark |
| **Kết quả test thực tế** | — |

### TC_DM_043: Dark: scrollbar styling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_043 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra scrollbar |
| **Kết quả mong đợi** | Scrollbar dark (nếu styled) |
| **Kết quả test thực tế** | — |

### TC_DM_044: Dark: checkbox/radio background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_044 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, form |
| **Các bước thực hiện** | 1. Kiểm tra checkbox |
| **Kết quả mong đợi** | Checkbox border visible dark |
| **Kết quả test thực tế** | — |

### TC_DM_045: Dark: skeleton loader

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_045 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, loading |
| **Các bước thực hiện** | 1. Kiểm tra skeleton |
| **Kết quả mong đợi** | Skeleton dark shimmering |
| **Kết quả test thực tế** | — |

### Nhóm 3: Text & Icon Colors (Màu chữ & icon) (TC_DM_046 – TC_DM_065)

### TC_DM_046: Dark: heading text light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_046 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra h1/h2 |
| **Kết quả mong đợi** | Text light (slate-100) |
| **Kết quả test thực tế** | — |

### TC_DM_047: Dark: body text light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_047 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra body text |
| **Kết quả mong đợi** | Text readable light color |
| **Kết quả test thực tế** | — |

### TC_DM_048: Dark: muted/secondary text

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_048 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra secondary text |
| **Kết quả mong đợi** | Muted text visible (slate-400) |
| **Kết quả test thực tế** | — |

### TC_DM_049: Dark: placeholder text

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_049 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, input |
| **Các bước thực hiện** | 1. Kiểm tra placeholder |
| **Kết quả mong đợi** | Placeholder visible (slate-500) |
| **Kết quả test thực tế** | — |

### TC_DM_050: Dark: link color

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_050 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra links |
| **Kết quả mong đợi** | Links visible, distinct color |
| **Kết quả test thực tế** | — |

### TC_DM_051: Dark: error text red visible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_051 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode, validation error |
| **Các bước thực hiện** | 1. Trigger error |
| **Kết quả mong đợi** | Red text visible trên dark bg |
| **Kết quả test thực tế** | — |

### TC_DM_052: Dark: success text green

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_052 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode, success state |
| **Các bước thực hiện** | 1. Trigger success |
| **Kết quả mong đợi** | Green text visible |
| **Kết quả test thực tế** | — |

### TC_DM_053: Dark: warning text yellow

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_053 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, warning |
| **Các bước thực hiện** | 1. Trigger warning |
| **Kết quả mong đợi** | Yellow/amber text visible |
| **Kết quả test thực tế** | — |

### TC_DM_054: Dark: icon colors adjusted

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_054 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra icons |
| **Kết quả mong đợi** | Icons light color, visible |
| **Kết quả test thực tế** | — |

### TC_DM_055: Dark: emoji visibility trên dark bg

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_055 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra emojis (🌅🌤️🌙) |
| **Kết quả mong đợi** | Emojis visible trên dark bg |
| **Kết quả test thực tế** | — |

### TC_DM_056: Light: all dark text on light bg

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_056 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Light mode |
| **Các bước thực hiện** | 1. Kiểm tra text |
| **Kết quả mong đợi** | Dark text trên light background |
| **Kết quả test thực tế** | — |

### TC_DM_057: Contrast ≥ 4.5:1 body text dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_057 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Đo contrast ratio |
| **Kết quả mong đợi** | Body text contrast ≥ 4.5:1 (WCAG AA) |
| **Kết quả test thực tế** | — |

### TC_DM_058: Contrast ≥ 3:1 large text dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_058 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Đo contrast headings |
| **Kết quả mong đợi** | Large text ≥ 3:1 |
| **Kết quả test thực tế** | — |

### TC_DM_059: No pure white (#fff) on pure black (#000)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_059 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra colors |
| **Kết quả mong đợi** | Dùng slate tones (không pure white/black) |
| **Kết quả test thực tế** | — |

### TC_DM_060: Dark: label text in forms

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_060 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode, form |
| **Các bước thực hiện** | 1. Kiểm tra labels |
| **Kết quả mong đợi** | Labels readable |
| **Kết quả test thực tế** | — |

### TC_DM_061: Dark: button text primary

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_061 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra primary button |
| **Kết quả mong đợi** | Button text visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_062: Dark: button text secondary

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_062 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra secondary button |
| **Kết quả mong đợi** | Secondary button visible |
| **Kết quả test thực tế** | — |

### TC_DM_063: Dark: button text danger/delete

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_063 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra delete button |
| **Kết quả mong đợi** | Red button visible, text contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_064: Dark: disabled text

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_064 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, disabled element |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Disabled text muted but visible |
| **Kết quả test thực tế** | — |

### TC_DM_065: Dark: badge/tag text

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_065 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Kiểm tra tags |
| **Kết quả mong đợi** | Tag text visible trên dark chip bg |
| **Kết quả test thực tế** | — |

### Nhóm 4: Calendar & Management Dark (Calendar & Quản lý) (TC_DM_066 – TC_DM_090)

### TC_DM_066: Calendar tab dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_066 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Calendar tab trong dark mode |
| **Kết quả mong đợi** | Calendar tab hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_067: Calendar grid dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_067 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Calendar grid trong dark mode |
| **Kết quả mong đợi** | Calendar grid hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_068: Calendar date cells dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_068 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Calendar date cells trong dark mode |
| **Kết quả mong đợi** | Calendar date cells hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_069: Today highlight dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_069 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Today highlight trong dark mode |
| **Kết quả mong đợi** | Today highlight hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_070: Selected date dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_070 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Selected date trong dark mode |
| **Kết quả mong đợi** | Selected date hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_071: Meal slots dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_071 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Meal slots trong dark mode |
| **Kết quả mong đợi** | Meal slots hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_072: Nutrition bars dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_072 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Nutrition bars trong dark mode |
| **Kết quả mong đợi** | Nutrition bars hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_073: Date picker dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_073 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Date picker trong dark mode |
| **Kết quả mong đợi** | Date picker hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_074: Quick preview panel dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_074 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Quick preview panel trong dark mode |
| **Kết quả mong đợi** | Quick preview panel hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_075: Calendar header dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_075 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Calendar header trong dark mode |
| **Kết quả mong đợi** | Calendar header hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_076: Week/month view dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_076 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Week/month view trong dark mode |
| **Kết quả mong đợi** | Week/month view hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_077: Empty day dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_077 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Empty day trong dark mode |
| **Kết quả mong đợi** | Empty day hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_078: Calendar navigation arrows dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_078 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Calendar navigation arrows trong dark mode |
| **Kết quả mong đợi** | Calendar navigation arrows hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_079: Calendar plan all button dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_079 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Calendar plan all button trong dark mode |
| **Kết quả mong đợi** | Calendar plan all button hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_080: Calendar sub-tabs dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_080 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Calendar sub-tabs trong dark mode |
| **Kết quả mong đợi** | Calendar sub-tabs hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_081: Management tab dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_081 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Management tab trong dark mode |
| **Kết quả mong đợi** | Management tab hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_082: Ingredient list dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_082 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Ingredient list trong dark mode |
| **Kết quả mong đợi** | Ingredient list hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_083: Dish list dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_083 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Dish list trong dark mode |
| **Kết quả mong đợi** | Dish list hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_084: Item cards dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_084 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Item cards trong dark mode |
| **Kết quả mong đợi** | Item cards hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_085: Search bar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_085 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Search bar trong dark mode |
| **Kết quả mong đợi** | Search bar hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_086: Filter button dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_086 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Filter button trong dark mode |
| **Kết quả mong đợi** | Filter button hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_087: ListToolbar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_087 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra ListToolbar trong dark mode |
| **Kết quả mong đợi** | ListToolbar hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_088: Add button dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_088 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Add button trong dark mode |
| **Kết quả mong đợi** | Add button hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_089: Edit form dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_089 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Edit form trong dark mode |
| **Kết quả mong đợi** | Edit form hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### TC_DM_090: Delete confirm dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_090 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Delete confirm trong dark mode |
| **Kết quả mong đợi** | Delete confirm hiển thị đúng dark mode: nền tối, text sáng, elements visible |
| **Kết quả test thực tế** | — |

### Nhóm 5: Other Tabs Dark (Các tab khác) (TC_DM_091 – TC_DM_115)

### TC_DM_091: AI tab dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_091 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra AI tab trong dark mode |
| **Kết quả mong đợi** | AI tab hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_092: AI suggestion cards dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_092 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra AI suggestion cards trong dark mode |
| **Kết quả mong đợi** | AI suggestion cards hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_093: AI image preview dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_093 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra AI image preview trong dark mode |
| **Kết quả mong đợi** | AI image preview hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_094: AI loading dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_094 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra AI loading trong dark mode |
| **Kết quả mong đợi** | AI loading hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_095: Grocery tab dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_095 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Grocery tab trong dark mode |
| **Kết quả mong đợi** | Grocery tab hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_096: Grocery items dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_096 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Grocery items trong dark mode |
| **Kết quả mong đợi** | Grocery items hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_097: Grocery checkboxes dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_097 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Grocery checkboxes trong dark mode |
| **Kết quả mong đợi** | Grocery checkboxes hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_098: Grocery category headers dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_098 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Grocery category headers trong dark mode |
| **Kết quả mong đợi** | Grocery category headers hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_099: Settings tab dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_099 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Settings tab trong dark mode |
| **Kết quả mong đợi** | Settings tab hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_100: Settings form inputs dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_100 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Settings form inputs trong dark mode |
| **Kết quả mong đợi** | Settings form inputs hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_101: Settings toggle switches dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_101 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Settings toggle switches trong dark mode |
| **Kết quả mong đợi** | Settings toggle switches hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_102: Settings section headers dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_102 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Settings section headers trong dark mode |
| **Kết quả mong đợi** | Settings section headers hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_103: Fitness tab dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_103 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Fitness tab trong dark mode |
| **Kết quả mong đợi** | Fitness tab hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_104: Dashboard tab dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_104 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Dashboard tab trong dark mode |
| **Kết quả mong đợi** | Dashboard tab hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_105: Sync UI dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_105 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Sync UI trong dark mode |
| **Kết quả mong đợi** | Sync UI hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_106: Template manager dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_106 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Template manager trong dark mode |
| **Kết quả mong đợi** | Template manager hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_107: Copy plan modal dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_107 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Copy plan modal trong dark mode |
| **Kết quả mong đợi** | Copy plan modal hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_108: Clear plan modal dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_108 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Clear plan modal trong dark mode |
| **Kết quả mong đợi** | Clear plan modal hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_109: Goal settings dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_109 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Goal settings trong dark mode |
| **Kết quả mong đợi** | Goal settings hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_110: About/version dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_110 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra About/version trong dark mode |
| **Kết quả mong đợi** | About/version hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_111: Data backup UI dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_111 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Data backup UI trong dark mode |
| **Kết quả mong đợi** | Data backup UI hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_112: Notification center dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_112 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Notification center trong dark mode |
| **Kết quả mong đợi** | Notification center hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_113: Translation UI dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_113 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Translation UI trong dark mode |
| **Kết quả mong đợi** | Translation UI hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_114: Error boundary dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_114 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Error boundary trong dark mode |
| **Kết quả mong đợi** | Error boundary hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### TC_DM_115: Loading spinner dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_115 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Loading spinner trong dark mode |
| **Kết quả mong đợi** | Loading spinner hiển thị đúng: nền tối, elements visible, contrast OK |
| **Kết quả test thực tế** | — |

### Nhóm 6: Modals & Forms Dark (Modal & Form) (TC_DM_116 – TC_DM_140)

### TC_DM_116: Modal overlay dark dim

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_116 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Modal overlay dim<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Modal overlay dim: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_117: Modal content area dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_117 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Modal content area<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Modal content area: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_118: Modal title text dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_118 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Modal title text<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Modal title text: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_119: Primary button dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_119 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Primary button<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Primary button: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_120: Secondary button dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_120 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Secondary button<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Secondary button: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_121: Danger button dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_121 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Danger button<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Danger button: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_122: Input fields dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_122 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Input fields<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Input fields: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_123: Input focus ring dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_123 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Input focus ring<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Input focus ring: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_124: Select dropdown dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_124 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Select dropdown<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Select dropdown: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_125: Checkbox dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_125 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Checkbox<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Checkbox: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_126: Radio button dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_126 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Radio button<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Radio button: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_127: Textarea dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_127 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Textarea<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Textarea: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_128: Validation error msg dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_128 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Validation error msg<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Validation error msg: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_129: Toast success dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_129 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Toast success<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Toast success: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_130: Toast error dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_130 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Toast error<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Toast error: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_131: Toast warning dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_131 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Toast warning<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Toast warning: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_132: Confirm dialog dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_132 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Confirm dialog<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Confirm dialog: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_133: Bottom sheet dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_133 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Bottom sheet<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Bottom sheet: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_134: Filter sheet dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_134 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Filter sheet<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Filter sheet: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_135: Date picker dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_135 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Date picker<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Date picker: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_136: Modal backdrop opacity

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_136 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Modal backdrop opacity<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Modal backdrop opacity: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_137: Modal animation dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_137 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Modal animation<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Modal animation: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_138: Form label dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_138 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Form label<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Form label: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_139: Disabled input dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_139 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Disabled input<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Disabled input: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### TC_DM_140: Empty state modal dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_140 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở Empty state modal<br>2. Kiểm tra colors và visibility |
| **Kết quả mong đợi** | Empty state modal: hiển thị đúng dark mode, đủ contrast |
| **Kết quả test thực tế** | — |

### Nhóm 7: Progress Bars & Charts Dark (Thanh tiến trình & Biểu đồ) (TC_DM_141 – TC_DM_160)

### TC_DM_141: Calorie progress bar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_141 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Calorie progress bar |
| **Kết quả mong đợi** | Calorie progress bar: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_142: Protein progress bar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_142 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Protein progress bar |
| **Kết quả mong đợi** | Protein progress bar: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_143: Carbs progress bar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_143 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Carbs progress bar |
| **Kết quả mong đợi** | Carbs progress bar: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_144: Fat progress bar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_144 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Fat progress bar |
| **Kết quả mong đợi** | Fat progress bar: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_145: Fiber progress bar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_145 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Fiber progress bar |
| **Kết quả mong đợi** | Fiber progress bar: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_146: Bar green visible dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_146 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Bar green visible |
| **Kết quả mong đợi** | Bar green visible: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_147: Bar yellow visible dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_147 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Bar yellow visible |
| **Kết quả mong đợi** | Bar yellow visible: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_148: Bar red visible dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_148 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Bar red visible |
| **Kết quả mong đợi** | Bar red visible: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_149: Bar track visible dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_149 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Bar track visible |
| **Kết quả mong đợi** | Bar track visible: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_150: Bar labels dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_150 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Bar labels |
| **Kết quả mong đợi** | Bar labels: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_151: Daily total bar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_151 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Daily total bar |
| **Kết quả mong đợi** | Daily total bar: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_152: Per-meal mini bars dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_152 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Per-meal mini bars |
| **Kết quả mong đợi** | Per-meal mini bars: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_153: Progress percentage text dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_153 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Progress percentage text |
| **Kết quả mong đợi** | Progress percentage text: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_154: Chart colors dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_154 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Chart colors |
| **Kết quả mong đợi** | Chart colors: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_155: Chart axis labels dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_155 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Chart axis labels |
| **Kết quả mong đợi** | Chart axis labels: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_156: Chart legend dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_156 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Chart legend |
| **Kết quả mong đợi** | Chart legend: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_157: Chart grid lines dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_157 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Chart grid lines |
| **Kết quả mong đợi** | Chart grid lines: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_158: Donut chart dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_158 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Donut chart |
| **Kết quả mong đợi** | Donut chart: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_159: Bar chart dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_159 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Bar chart |
| **Kết quả mong đợi** | Bar chart: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_DM_160: Progress animation dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_160 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra Progress animation |
| **Kết quả mong đợi** | Progress animation: colors visible và distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### Nhóm 8: Transitions & Toggle Behavior (Chuyển đổi) (TC_DM_161 – TC_DM_180)

### TC_DM_161: Transition animation light→dark smooth

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_161 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Transition animation light→dark smooth |
| **Kết quả mong đợi** | Transition animation light→dark smooth hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_162: Transition animation dark→light smooth

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_162 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Transition animation dark→light smooth |
| **Kết quả mong đợi** | Transition animation dark→light smooth hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_163: No flash on toggle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_163 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: No flash on toggle |
| **Kết quả mong đợi** | No flash on toggle hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_164: Toggle instant

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_164 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Toggle instant (< 100ms) |
| **Kết quả mong đợi** | Toggle instant (< 100ms) hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_165: Toggle không reset scroll position

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_165 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Toggle không reset scroll position |
| **Kết quả mong đợi** | Toggle không reset scroll position hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_166: Toggle không đóng modal

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_166 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Toggle không đóng modal |
| **Kết quả mong đợi** | Toggle không đóng modal hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_167: Toggle không mất form data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_167 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Toggle không mất form data |
| **Kết quả mong đợi** | Toggle không mất form data hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_168: Toggle khi đang sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_168 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Toggle khi đang sync |
| **Kết quả mong đợi** | Toggle khi đang sync hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_169: Toggle khi AI loading

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_169 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Toggle khi AI loading |
| **Kết quả mong đợi** | Toggle khi AI loading hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_170: Toggle nhiều lần nhanh

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_170 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Toggle nhiều lần nhanh |
| **Kết quả mong đợi** | Toggle nhiều lần nhanh hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_171: Theme switch performance

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_171 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Theme switch performance (no jank) |
| **Kết quả mong đợi** | Theme switch performance (no jank) hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_172: CSS variables update đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_172 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: CSS variables update đúng |
| **Kết quả mong đợi** | CSS variables update đúng hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_173: Dark mode CSS class propagation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_173 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Dark mode CSS class propagation |
| **Kết quả mong đợi** | Dark mode CSS class propagation hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_174: Color scheme meta tag update

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_174 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Color scheme meta tag update |
| **Kết quả mong đợi** | Color scheme meta tag update hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_175: Theme switch event fired

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_175 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Theme switch event fired |
| **Kết quả mong đợi** | Theme switch event fired hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_176: Transition không ảnh hưởng animation khác

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_176 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Transition không ảnh hưởng animation khác |
| **Kết quả mong đợi** | Transition không ảnh hưởng animation khác hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_177: Toggle từ quick settings

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_177 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Toggle từ quick settings (nếu có) |
| **Kết quả mong đợi** | Toggle từ quick settings (nếu có) hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_178: Toggle với shortcut key

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_178 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Toggle với shortcut key (nếu có) |
| **Kết quả mong đợi** | Toggle với shortcut key (nếu có) hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_179: First paint: đúng theme

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_179 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: First paint: đúng theme |
| **Kết quả mong đợi** | First paint: đúng theme hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DM_180: Theme flicker prevention script

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_180 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Thực hiện: Theme flicker prevention script |
| **Kết quả mong đợi** | Theme flicker prevention script hoạt động đúng |
| **Kết quả test thực tế** | — |

### Nhóm 9: Browser Compatibility & Edge Cases (Tương thích & Biên) (TC_DM_181 – TC_DM_200)

### TC_DM_181: Chrome desktop: dark mode correct

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_181 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Chrome latest |
| **Các bước thực hiện** | 1. Test dark mode trên Chrome |
| **Kết quả mong đợi** | Tất cả dark styles apply đúng |
| **Kết quả test thực tế** | — |

### TC_DM_182: Safari desktop: dark mode correct

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_182 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Safari macOS |
| **Các bước thực hiện** | 1. Test dark mode |
| **Kết quả mong đợi** | Dark styles đúng |
| **Kết quả test thực tế** | — |

### TC_DM_183: Firefox: dark mode correct

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_183 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Firefox |
| **Các bước thực hiện** | 1. Test dark mode |
| **Kết quả mong đợi** | Dark styles đúng |
| **Kết quả test thực tế** | — |

### TC_DM_184: Chrome mobile: dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_184 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Chrome Android |
| **Các bước thực hiện** | 1. Test dark mode mobile |
| **Kết quả mong đợi** | Dark UI đúng |
| **Kết quả test thực tế** | — |

### TC_DM_185: Safari iOS: dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_185 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Safari iOS |
| **Các bước thực hiện** | 1. Test dark mode |
| **Kết quả mong đợi** | Dark mode đúng, safe area OK |
| **Kết quả test thực tế** | — |

### TC_DM_186: Capacitor WebView: dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_186 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Capacitor build |
| **Các bước thực hiện** | 1. Test dark mode trong WebView |
| **Kết quả mong đợi** | Dark mode render đúng |
| **Kết quả test thực tế** | — |

### TC_DM_187: Mobile status bar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_187 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, mobile |
| **Các bước thực hiện** | 1. Kiểm tra status bar |
| **Kết quả mong đợi** | Status bar dark hoặc light text |
| **Kết quả test thực tế** | — |

### TC_DM_188: iOS safe area dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_188 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | iPhone, dark mode |
| **Các bước thực hiện** | 1. Kiểm tra safe area |
| **Kết quả mong đợi** | Safe area background đúng color |
| **Kết quả test thực tế** | — |

### TC_DM_189: Android nav bar dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_189 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Android, dark mode |
| **Các bước thực hiện** | 1. Kiểm tra nav bar |
| **Kết quả mong đợi** | Navigation bar dark |
| **Kết quả test thực tế** | — |

### TC_DM_190: Print: force light mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_190 |
| **Loại** | Edge |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Dark mode, print |
| **Các bước thực hiện** | 1. Print page |
| **Kết quả mong đợi** | Print output light mode |
| **Kết quả test thực tế** | — |

### TC_DM_191: Screenshot captures dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_191 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Take screenshot |
| **Kết quả mong đợi** | Screenshot hiển thị dark mode |
| **Kết quả test thực tế** | — |

### TC_DM_192: High contrast OS + dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_192 |
| **Loại** | Edge |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | OS high contrast ON |
| **Các bước thực hiện** | 1. Kiểm tra app |
| **Kết quả mong đợi** | App readable, không conflict |
| **Kết quả test thực tế** | — |

### TC_DM_193: Color-blind friendly dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_193 |
| **Loại** | Edge |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Color blind user |
| **Các bước thực hiện** | 1. Kiểm tra color distinctions |
| **Kết quả mong đợi** | Colors distinguishable cho color-blind |
| **Kết quả test thực tế** | — |

### TC_DM_194: OLED dark (nếu có option)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_194 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | OLED dark option |
| **Các bước thực hiện** | 1. Bật OLED dark |
| **Kết quả mong đợi** | True black backgrounds |
| **Kết quả test thực tế** | — |

### TC_DM_195: Energy saving display dark

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_195 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | OLED screen, dark mode |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Dark mode giảm battery usage |
| **Kết quả test thực tế** | — |

### TC_DM_196: Dark mode + zoom 150%

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_196 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, zoom 150% |
| **Các bước thực hiện** | 1. Zoom browser 150% |
| **Kết quả mong đợi** | Layout và colors đúng sau zoom |
| **Kết quả test thực tế** | — |

### TC_DM_197: Dark mode + responsive resize

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_197 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode |
| **Các bước thực hiện** | 1. Resize mobile→desktop |
| **Kết quả mong đợi** | Dark mode preserved qua resize |
| **Kết quả test thực tế** | — |

### TC_DM_198: Dark mode + language change

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_198 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Đổi ngôn ngữ |
| **Kết quả mong đợi** | Theme không bị reset |
| **Kết quả test thực tế** | — |

### TC_DM_199: Dark mode + sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_199 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Sync data |
| **Kết quả mong đợi** | Theme không bị ảnh hưởng bởi sync |
| **Kết quả test thực tế** | — |

### TC_DM_200: Dark mode localStorage key 'mp-theme'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_200 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Theme = dark |
| **Các bước thực hiện** | 1. Kiểm tra localStorage |
| **Kết quả mong đợi** | Key 'mp-theme' = 'dark' |
| **Kết quả test thực tế** | — |

### Nhóm 10: Additional Visual Elements (Các yếu tố visual khác) (TC_DM_201 – TC_DM_210)

### TC_DM_201: Dark mode: empty state illustrations

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_201 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra empty state illustrations |
| **Kết quả mong đợi** | Illustrations visible trên dark bg |
| **Kết quả test thực tế** | — |

### TC_DM_202: Dark mode: loading skeleton shimmer

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_202 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra skeleton shimmer color |
| **Kết quả mong đợi** | Shimmer visible trên dark bg |
| **Kết quả test thực tế** | — |

### TC_DM_203: Dark mode: divider lines

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_203 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra dividers |
| **Kết quả mong đợi** | Dividers visible (subtle) trên dark |
| **Kết quả test thực tế** | — |

### TC_DM_204: Dark mode: shadow adjusted

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_204 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra shadows |
| **Kết quả mong đợi** | Shadows adjusted cho dark bg |
| **Kết quả test thực tế** | — |

### TC_DM_205: Dark mode: gradient backgrounds

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_205 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra gradients |
| **Kết quả mong đợi** | Gradients visible trên dark |
| **Kết quả test thực tế** | — |

### TC_DM_206: Dark mode: selection highlight

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_206 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Select text<br>2. Kiểm tra highlight |
| **Kết quả mong đợi** | Selection highlight visible dark |
| **Kết quả test thực tế** | — |

### TC_DM_207: Dark mode: focus visible ring

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_207 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Tab key navigation |
| **Kết quả mong đợi** | Focus ring visible dark |
| **Kết quả test thực tế** | — |

### TC_DM_208: Dark mode: hover state subtle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_208 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Hover elements |
| **Kết quả mong đợi** | Hover state visible nhưng subtle |
| **Kết quả test thực tế** | — |

### TC_DM_209: Dark mode: active/pressed state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_209 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Click button |
| **Kết quả mong đợi** | Active state visible dark |
| **Kết quả test thực tế** | — |

### TC_DM_210: Dark mode: overall aesthetic quality

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DM_210 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Review toàn bộ app dark mode |
| **Kết quả mong đợi** | Dark mode aesthetic, consistent, professional |
| **Kết quả test thực tế** | — |

---

## Đề xuất Cải tiến

### Đề xuất 1: Auto Dark Mode by Time
- **Vấn đề hiện tại**: Schedule mode uses fixed 18:00-06:00.
- **Giải pháp đề xuất**: Custom time picker cho schedule. Or follow sunrise/sunset by location.
- **Phần trăm cải thiện**: User comfort +30%, Flexibility +40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 2: Custom Accent Colors
- **Vấn đề hiện tại**: Only light/dark. No color personalization.
- **Giải pháp đề xuất**: Color picker for accent. Pre-built themes: Ocean, Forest, Sunset.
- **Phần trăm cải thiện**: Personalization +60%, Satisfaction +30%
- **Mức độ ưu tiên**: Low | **Effort**: M

### Đề xuất 3: OLED Dark Mode
- **Vấn đề hiện tại**: Dark mode uses dark gray. No OLED benefit.
- **Giải pháp đề xuất**: True black (#000) backgrounds for OLED screens.
- **Phần trăm cải thiện**: Battery +20%, OLED satisfaction +40%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 4: Contrast Boost Mode
- **Vấn đề hiện tại**: Standard contrast may not be enough for some users.
- **Giải pháp đề xuất**: High Contrast toggle: bolder borders, brighter text.
- **Phần trăm cải thiện**: Accessibility +50%, Vision-impaired usability +60%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 5: Per-Screen Theme Override
- **Vấn đề hiện tại**: Global dark mode for all screens.
- **Giải pháp đề xuất**: Override per screen: light for Grocery (outdoor), dark for Calendar (night).
- **Phần trăm cải thiện**: Context viewing +30%, Flexibility +40%
- **Mức độ ưu tiên**: Low | **Effort**: M

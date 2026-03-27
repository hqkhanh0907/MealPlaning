# Scenario 18: Desktop Responsive Layout

**Version:** 2.0  
**Date:** 2026-03-15  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Desktop Responsive Layout adapts app UI cho mọi kích thước màn hình. useIsDesktop hook (min-width: 1024px) xác định layout mode. Tailwind CSS responsive classes (sm:, md:, lg:, xl:) kiểm soát styling. Mobile (<1024px): bottom tab bar, stacked layouts, bottom sheet modals, touch targets ≥44px. Desktop (≥1024px): sidebar navigation, split panels, centered modals, hover effects. Calendar hiển thị side-by-side trên desktop, stacked trên mobile. Management tab có split list/detail trên desktop.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| useIsDesktop | hooks/useIsDesktop.ts | Viewport detection (1024px breakpoint) |
| TabBar | components/TabBar.tsx | Mobile bottom tab navigation |
| DesktopNav | components/DesktopNav.tsx | Desktop sidebar navigation (nếu có) |
| QuickPreviewPanel | components/QuickPreviewPanel.tsx | Responsive preview panel |
| ListToolbar | components/shared/ListToolbar.tsx | Responsive toolbar (sort/filter/view) |
| FilterBottomSheet | components/shared/FilterBottomSheet.tsx | Responsive filter UI |

## Luồng nghiệp vụ

1. App load → useIsDesktop check viewport width với matchMedia
2. viewport ≥ 1024px → isDesktop = true → render desktop layout
3. viewport < 1024px → isDesktop = false → render mobile layout
4. Desktop: sidebar nav, split panels, centered modals, hover effects
5. Mobile: bottom tabs, stacked layout, bottom sheet modals, touch feedback
6. Resize browser → matchMedia listener fire → re-render layout
7. Navigation state preserved khi chuyển đổi layout
8. Tailwind responsive classes apply tại breakpoints: sm(640), md(768), lg(1024), xl(1280)

## Quy tắc nghiệp vụ

1. Breakpoint chính: 1024px (useIsDesktop threshold)
2. Mobile: bottom tab bar với 5 tabs, icons + labels
3. Desktop: sidebar navigation thay thế bottom tabs
4. Modals: bottom sheet (mobile) vs centered (desktop)
5. Touch targets: ≥44px trên mobile (WCAG 2.5.5)
6. Input font size: ≥16px trên mobile (tránh iOS zoom)
7. Grid columns: 1 (mobile), 2 (tablet), 3+ (desktop)
8. Text: truncate trên mobile, wrap trên desktop
9. Safe area: padding cho notch devices (env(safe-area-inset-*))
10. Performance: layout switch không gây re-render nặng

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|---|---|---|---|
| TC_DL_001 | Viewport 320px → useIsDesktop=false (iPhone SE) | Boundary | P1 |
| TC_DL_002 | Viewport 375px → useIsDesktop=false (iPhone 12) | Boundary | P1 |
| TC_DL_003 | Viewport 414px → useIsDesktop=false (iPhone Plus) | Boundary | P1 |
| TC_DL_004 | Viewport 768px → useIsDesktop=false (iPad portrait) | Boundary | P1 |
| TC_DL_005 | Viewport 1023px → useIsDesktop=false (ngay dưới breakpoint) | Boundary | P1 |
| TC_DL_006 | Viewport 1024px → useIsDesktop=true (đúng breakpoint) | Boundary | P1 |
| TC_DL_007 | Viewport 1025px → useIsDesktop=true (ngay trên breakpoint) | Boundary | P1 |
| TC_DL_008 | Viewport 1280px → useIsDesktop=true (laptop) | Boundary | P1 |
| TC_DL_009 | Viewport 1440px → useIsDesktop=true (desktop) | Boundary | P1 |
| TC_DL_010 | Viewport 1920px → useIsDesktop=true (Full HD) | Boundary | P1 |
| TC_DL_011 | Viewport 2560px → useIsDesktop=true (2K) | Boundary | P1 |
| TC_DL_012 | Viewport 3840px → useIsDesktop=true (4K) | Boundary | P1 |
| TC_DL_013 | Resize từ 375px → 1440px: chuyển mobile→desktop | Positive | P0 |
| TC_DL_014 | Resize từ 1440px → 375px: chuyển desktop→mobile | Positive | P0 |
| TC_DL_015 | matchMedia listener phản hồi real-time | Positive | P1 |
| TC_DL_016 | Initial render đúng layout theo viewport | Positive | P0 |
| TC_DL_017 | Initial render mobile đúng | Positive | P0 |
| TC_DL_018 | Tailwind sm: breakpoint 640px | Positive | P1 |
| TC_DL_019 | Tailwind md: breakpoint 768px | Positive | P1 |
| TC_DL_020 | Tailwind lg: breakpoint 1024px | Positive | P1 |
| TC_DL_021 | Tailwind xl: breakpoint 1280px | Positive | P1 |
| TC_DL_022 | useIsDesktop cleanup khi unmount | Positive | P2 |
| TC_DL_023 | Resize nhanh liên tục không crash | Boundary | P2 |
| TC_DL_024 | Orientation change trên tablet | Positive | P2 |
| TC_DL_025 | Zoom 200% ảnh hưởng effective viewport | Edge | P2 |
| TC_DL_026 | Mobile: bottom tabs hiển thị khi viewport < 1024px | Positive | P0 |
| TC_DL_027 | Desktop: sidebar nav hiển thị khi viewport >= 1024px | Positive | P0 |
| TC_DL_028 | Bottom tabs: tất cả 5 tabs hiển thị | Positive | P1 |
| TC_DL_029 | Desktop nav: tất cả tabs listed | Positive | P1 |
| TC_DL_030 | Active tab highlighted đúng (mobile) | Positive | P1 |
| TC_DL_031 | Active tab highlighted đúng (desktop) | Positive | P1 |
| TC_DL_032 | Click tab → chuyển tab (mobile) | Positive | P0 |
| TC_DL_033 | Click tab → chuyển tab (desktop) | Positive | P0 |
| TC_DL_034 | Tab icons hiển thị đúng (mobile) | Positive | P1 |
| TC_DL_035 | Tab labels hiển thị đúng (mobile) | Positive | P1 |
| TC_DL_036 | Desktop nav: icons + labels cạnh nhau | Positive | P2 |
| TC_DL_037 | Resize: bottom tabs ↔ sidebar transition smooth | Positive | P1 |
| TC_DL_038 | TabBar và DesktopNav exclusive | Positive | P0 |
| TC_DL_039 | Navigation state preserved khi resize | Positive | P1 |
| TC_DL_040 | Desktop nav width cố định | Positive | P2 |
| TC_DL_041 | Bottom tabs height cố định | Positive | P2 |
| TC_DL_042 | Bottom tabs safe area cho iPhone notch | Positive | P2 |
| TC_DL_043 | Desktop nav scrollable khi nhiều items | Positive | P3 |
| TC_DL_044 | Tab badge/indicator (notifications) | Positive | P2 |
| TC_DL_045 | Desktop nav hover effect | Positive | P2 |
| TC_DL_046 | Mobile tab tap feedback | Positive | P2 |
| TC_DL_047 | Desktop nav keyboard navigation | Positive | P3 |
| TC_DL_048 | Mobile bottom bar dark mode | Positive | P2 |
| TC_DL_049 | Desktop sidebar dark mode | Positive | P2 |
| TC_DL_050 | Navigation không bị ẩn bởi virtual keyboard | Edge | P2 |
| TC_DL_051 | Calendar mobile: layout stacked dọc | Positive | P1 |
| TC_DL_052 | Calendar desktop: layout side-by-side | Positive | P1 |
| TC_DL_053 | Calendar mobile: sub-tabs cho nutrition | Positive | P1 |
| TC_DL_054 | Calendar desktop: nutrition panel luôn visible | Positive | P1 |
| TC_DL_055 | Calendar week grid mobile: scroll ngang | Positive | P2 |
| TC_DL_056 | Calendar week grid desktop: full 7 ngày visible | Positive | P1 |
| TC_DL_057 | Date picker mobile: compact | Positive | P2 |
| TC_DL_058 | Date picker desktop: popup dropdown | Positive | P2 |
| TC_DL_059 | Meal slots mobile: full-width cards | Positive | P1 |
| TC_DL_060 | Meal slots desktop: side-by-side hoặc grid | Positive | P1 |
| TC_DL_061 | Quick preview panel mobile: bottom sheet | Positive | P1 |
| TC_DL_062 | Quick preview panel desktop: inline panel | Positive | P1 |
| TC_DL_063 | Calendar header responsive | Positive | P2 |
| TC_DL_064 | Calendar navigation arrows mobile | Positive | P2 |
| TC_DL_065 | Calendar date cell mobile: đủ lớn để tap | Positive | P1 |
| TC_DL_066 | Calendar date cell desktop: hover effect | Positive | P2 |
| TC_DL_067 | Calendar today highlight visible cả 2 layout | Positive | P1 |
| TC_DL_068 | Calendar selected date visible cả 2 layout | Positive | P1 |
| TC_DL_069 | Calendar month view mobile | Positive | P2 |
| TC_DL_070 | Calendar month view desktop | Positive | P2 |
| TC_DL_071 | Calendar plan all button mobile | Positive | P2 |
| TC_DL_072 | Calendar plan all button desktop | Positive | P2 |
| TC_DL_073 | Calendar add meal button mobile | Positive | P2 |
| TC_DL_074 | Calendar nutrition bars mobile | Positive | P2 |
| TC_DL_075 | Calendar nutrition bars desktop: rộng hơn | Positive | P2 |
| TC_DL_076 | Calendar empty state mobile | Positive | P2 |
| TC_DL_077 | Calendar empty state desktop | Positive | P2 |
| TC_DL_078 | Calendar scroll behavior mobile | Positive | P2 |
| TC_DL_079 | Calendar scroll behavior desktop | Positive | P2 |
| TC_DL_080 | Calendar landscape orientation mobile | Positive | P2 |
| TC_DL_081 | Management mobile: full-screen ingredient list | Positive | P1 |
| TC_DL_082 | Management desktop: split list/detail | Positive | P1 |
| TC_DL_083 | Management mobile: tap item → full-screen detail | Positive | P1 |
| TC_DL_084 | Management desktop: click item → detail panel update | Positive | P1 |
| TC_DL_085 | Management mobile: back button từ detail | Positive | P1 |
| TC_DL_086 | Management desktop: không cần back button | Positive | P2 |
| TC_DL_087 | Card layout mobile: 1 cột | Positive | P1 |
| TC_DL_088 | Card layout tablet: 2 cột | Positive | P1 |
| TC_DL_089 | Card layout desktop: 3 cột | Positive | P1 |
| TC_DL_090 | ListToolbar mobile: compact layout | Positive | P2 |
| TC_DL_091 | ListToolbar desktop: inline layout | Positive | P2 |
| TC_DL_092 | Filter bottom sheet mobile | Positive | P1 |
| TC_DL_093 | Filter sidebar/popup desktop | Positive | P1 |
| TC_DL_094 | Search bar mobile: full-width | Positive | P2 |
| TC_DL_095 | Search bar desktop: fixed width | Positive | P2 |
| TC_DL_096 | Add button mobile: FAB hoặc full-width | Positive | P2 |
| TC_DL_097 | Add button desktop: inline button | Positive | P2 |
| TC_DL_098 | Form inputs mobile: full-width | Positive | P1 |
| TC_DL_099 | Form inputs desktop: constrained width | Positive | P2 |
| TC_DL_100 | Ingredient list empty state mobile | Positive | P2 |
| TC_DL_101 | Dish list responsive | Positive | P1 |
| TC_DL_102 | Management tab switching (Ingredients/Dishes) mobile | Positive | P1 |
| TC_DL_103 | Management tab switching desktop | Positive | P1 |
| TC_DL_104 | Delete confirmation dialog mobile | Positive | P2 |
| TC_DL_105 | Delete confirmation dialog desktop | Positive | P2 |
| TC_DL_106 | Pagination/infinite scroll mobile | Positive | P2 |
| TC_DL_107 | Pagination/infinite scroll desktop | Positive | P2 |
| TC_DL_108 | Image trong card mobile | Positive | P2 |
| TC_DL_109 | Image trong card desktop | Positive | P2 |
| TC_DL_110 | Management loading skeleton responsive | Positive | P2 |
| TC_DL_111 | Modal mobile: bottom sheet slide up | Positive | P1 |
| TC_DL_112 | Modal desktop: centered với overlay | Positive | P1 |
| TC_DL_113 | Modal mobile: full-width | Positive | P1 |
| TC_DL_114 | Modal desktop: max-width constrained | Positive | P1 |
| TC_DL_115 | Modal mobile: swipe down to close | Positive | P2 |
| TC_DL_116 | Modal desktop: ESC to close | Positive | P1 |
| TC_DL_117 | Modal desktop: click overlay to close | Positive | P1 |
| TC_DL_118 | Modal close button position mobile | Positive | P2 |
| TC_DL_119 | Modal close button position desktop | Positive | P2 |
| TC_DL_120 | Confirm dialog mobile | Positive | P1 |
| TC_DL_121 | Confirm dialog desktop | Positive | P1 |
| TC_DL_122 | Form modal mobile: scroll nếu dài | Positive | P2 |
| TC_DL_123 | Form modal desktop: fit content | Positive | P2 |
| TC_DL_124 | SyncConflictModal mobile | Positive | P2 |
| TC_DL_125 | SyncConflictModal desktop | Positive | P2 |
| TC_DL_126 | AI suggestion modal mobile | Positive | P2 |
| TC_DL_127 | AI suggestion modal desktop | Positive | P2 |
| TC_DL_128 | Modal với keyboard mở (mobile) | Edge | P2 |
| TC_DL_129 | Multiple modal layers (modal trên modal) | Edge | P2 |
| TC_DL_130 | Toast notification mobile: full-width top | Positive | P2 |
| TC_DL_131 | Toast notification desktop: top-right corner | Positive | P2 |
| TC_DL_132 | Modal backdrop dim đúng | Positive | P2 |
| TC_DL_133 | Modal animation mobile: slide up | Positive | P2 |
| TC_DL_134 | Modal animation desktop: fade in | Positive | P2 |
| TC_DL_135 | Modal focus trap | Positive | P1 |
| TC_DL_136 | Touch targets mobile ≥44px | Positive | P0 |
| TC_DL_137 | Hover states chỉ trên desktop | Positive | P1 |
| TC_DL_138 | Không có hover effect trên mobile | Positive | P2 |
| TC_DL_139 | Click targets desktop adequate | Positive | P2 |
| TC_DL_140 | Swipe gestures mobile | Positive | P2 |
| TC_DL_141 | Long-press mobile cho context menu | Positive | P3 |
| TC_DL_142 | Right-click desktop | Positive | P3 |
| TC_DL_143 | Scroll momentum mobile | Positive | P2 |
| TC_DL_144 | Scroll smooth desktop | Positive | P2 |
| TC_DL_145 | Pinch zoom disabled (nếu PWA) | Positive | P2 |
| TC_DL_146 | Double-tap không zoom | Positive | P2 |
| TC_DL_147 | Touch feedback (ripple effect) | Positive | P2 |
| TC_DL_148 | Cursor pointer trên interactive elements desktop | Positive | P2 |
| TC_DL_149 | Cursor default trên non-interactive desktop | Positive | P3 |
| TC_DL_150 | Drag support desktop (nếu có) | Positive | P3 |
| TC_DL_151 | Swipe to delete mobile (nếu có) | Positive | P3 |
| TC_DL_152 | Scroll snap mobile calendar | Positive | P2 |
| TC_DL_153 | Mouse wheel horizontal scroll desktop | Positive | P3 |
| TC_DL_154 | Tab key navigation desktop | Positive | P1 |
| TC_DL_155 | Enter key activation desktop | Positive | P1 |
| TC_DL_156 | Space key activation desktop | Positive | P2 |
| TC_DL_157 | Focus visible ring desktop | Positive | P1 |
| TC_DL_158 | Focus ring ẩn khi dùng mouse | Positive | P2 |
| TC_DL_159 | Pull-to-refresh mobile (nếu có) | Positive | P3 |
| TC_DL_160 | Scroll position preserved khi resize | Positive | P2 |
| TC_DL_161 | Font size h1 mobile vs desktop | Positive | P2 |
| TC_DL_162 | Font size body text mobile | Positive | P2 |
| TC_DL_163 | Font size body text desktop | Positive | P2 |
| TC_DL_164 | Line height responsive | Positive | P2 |
| TC_DL_165 | Padding responsive: sm:p-6 | Positive | P2 |
| TC_DL_166 | Margin responsive | Positive | P2 |
| TC_DL_167 | Text truncation mobile: tên dài bị cắt | Positive | P2 |
| TC_DL_168 | Text wrapping desktop: tên dài wrap | Positive | P2 |
| TC_DL_169 | Vietnamese diacritics hiển thị đúng mọi kích thước | Positive | P1 |
| TC_DL_170 | Button text size mobile | Positive | P2 |
| TC_DL_171 | Button text size desktop | Positive | P2 |
| TC_DL_172 | Label text size form mobile | Positive | P2 |
| TC_DL_173 | Number/nutrition values responsive | Positive | P2 |
| TC_DL_174 | Input font size mobile ≥16px | Positive | P1 |
| TC_DL_175 | Spacing giữa items responsive | Positive | P2 |
| TC_DL_176 | Heading hierarchy đúng (h1>h2>h3) | Positive | P2 |
| TC_DL_177 | Badge text size responsive | Positive | P3 |
| TC_DL_178 | Toast text responsive | Positive | P2 |
| TC_DL_179 | Empty state text responsive | Positive | P2 |
| TC_DL_180 | Max-width cho text content desktop | Positive | P2 |
| TC_DL_181 | Grid 1 column mobile (375px) | Positive | P1 |
| TC_DL_182 | Grid 2 columns tablet (768px) | Positive | P1 |
| TC_DL_183 | Grid 3 columns desktop (1440px) | Positive | P1 |
| TC_DL_184 | Card width responsive | Positive | P2 |
| TC_DL_185 | Card image responsive | Positive | P2 |
| TC_DL_186 | Card content truncation mobile | Positive | P2 |
| TC_DL_187 | Card content full desktop | Positive | P2 |
| TC_DL_188 | Grid gap responsive | Positive | P2 |
| TC_DL_189 | Grid → flex transition | Positive | P2 |
| TC_DL_190 | Image aspect ratio 16:9 hoặc 4:3 | Positive | P2 |
| TC_DL_191 | Card hover elevation desktop | Positive | P2 |
| TC_DL_192 | Card tap feedback mobile | Positive | P2 |
| TC_DL_193 | Empty state layout mobile | Positive | P2 |
| TC_DL_194 | Empty state layout desktop | Positive | P2 |
| TC_DL_195 | 0 items grid: empty state hiển thị | Positive | P1 |
| TC_DL_196 | 1 item grid mobile: centered hoặc left-aligned | Positive | P2 |
| TC_DL_197 | 10 items grid: hiển thị đúng | Positive | P2 |
| TC_DL_198 | 50 items grid: performance OK | Boundary | P2 |
| TC_DL_199 | 100 items grid: performance OK | Boundary | P2 |
| TC_DL_200 | Card min-height consistent | Positive | P2 |
| TC_DL_201 | Chrome desktop compatible | Positive | P1 |
| TC_DL_202 | Safari desktop compatible | Positive | P2 |
| TC_DL_203 | Firefox desktop compatible | Positive | P2 |
| TC_DL_204 | Chrome mobile compatible | Positive | P1 |
| TC_DL_205 | Safari iOS compatible | Positive | P2 |
| TC_DL_206 | Samsung Internet compatible | Positive | P3 |
| TC_DL_207 | Edge desktop compatible | Positive | P3 |
| TC_DL_208 | Capacitor WebView compatible | Positive | P2 |
| TC_DL_209 | PWA display mode | Edge | P3 |
| TC_DL_210 | iOS safe area inset handling | Edge | P2 |

---

## Chi tiết Test Cases

### Nhóm 1: Breakpoint Detection & Hook (Phát hiện breakpoint) (TC_DL_001 – TC_DL_025)

### TC_DL_001: Viewport 320px → useIsDesktop=false (iPhone SE)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_001 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 320px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về false tại viewport 320px |
| **Kết quả test thực tế** | — |

### TC_DL_002: Viewport 375px → useIsDesktop=false (iPhone 12)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_002 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 375px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về false tại viewport 375px |
| **Kết quả test thực tế** | — |

### TC_DL_003: Viewport 414px → useIsDesktop=false (iPhone Plus)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_003 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 414px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về false tại viewport 414px |
| **Kết quả test thực tế** | — |

### TC_DL_004: Viewport 768px → useIsDesktop=false (iPad portrait)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_004 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 768px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về false tại viewport 768px |
| **Kết quả test thực tế** | — |

### TC_DL_005: Viewport 1023px → useIsDesktop=false (ngay dưới breakpoint)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_005 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 1023px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về false tại viewport 1023px |
| **Kết quả test thực tế** | — |

### TC_DL_006: Viewport 1024px → useIsDesktop=true (đúng breakpoint)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_006 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 1024px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về true tại viewport 1024px |
| **Kết quả test thực tế** | — |

### TC_DL_007: Viewport 1025px → useIsDesktop=true (ngay trên breakpoint)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_007 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 1025px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về true tại viewport 1025px |
| **Kết quả test thực tế** | — |

### TC_DL_008: Viewport 1280px → useIsDesktop=true (laptop)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_008 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 1280px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về true tại viewport 1280px |
| **Kết quả test thực tế** | — |

### TC_DL_009: Viewport 1440px → useIsDesktop=true (desktop)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_009 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 1440px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về true tại viewport 1440px |
| **Kết quả test thực tế** | — |

### TC_DL_010: Viewport 1920px → useIsDesktop=true (Full HD)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_010 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 1920px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về true tại viewport 1920px |
| **Kết quả test thực tế** | — |

### TC_DL_011: Viewport 2560px → useIsDesktop=true (2K)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_011 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 2560px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về true tại viewport 2560px |
| **Kết quả test thực tế** | — |

### TC_DL_012: Viewport 3840px → useIsDesktop=true (4K)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_012 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy tại localhost:3000 |
| **Các bước thực hiện** | 1. Đặt viewport width = 3840px bằng DevTools Device Toolbar<br>2. Kiểm tra hook useIsDesktop trong React DevTools |
| **Kết quả mong đợi** | useIsDesktop trả về true tại viewport 3840px |
| **Kết quả test thực tế** | — |

### TC_DL_013: Resize từ 375px → 1440px: chuyển mobile→desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_013 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App đang ở viewport 375px |
| **Các bước thực hiện** | 1. Kéo resize browser từ 375px lên 1440px<br>2. Quan sát UI chuyển đổi |
| **Kết quả mong đợi** | Bottom tabs ẩn, sidebar nav hiển thị, layout chuyển desktop |
| **Kết quả test thực tế** | — |

### TC_DL_014: Resize từ 1440px → 375px: chuyển desktop→mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_014 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App đang ở viewport 1440px |
| **Các bước thực hiện** | 1. Kéo resize browser từ 1440px xuống 375px<br>2. Quan sát UI |
| **Kết quả mong đợi** | Sidebar ẩn, bottom tabs hiển thị, layout chuyển mobile |
| **Kết quả test thực tế** | — |

### TC_DL_015: matchMedia listener phản hồi real-time

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_015 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Resize browser chậm qua breakpoint 1024px<br>2. Quan sát hook cập nhật |
| **Kết quả mong đợi** | useIsDesktop cập nhật ngay khi vượt qua breakpoint |
| **Kết quả test thực tế** | — |

### TC_DL_016: Initial render đúng layout theo viewport

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_016 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Browser width = 1440px |
| **Các bước thực hiện** | 1. Mở app lần đầu |
| **Kết quả mong đợi** | Render trực tiếp desktop layout, không flash mobile layout |
| **Kết quả test thực tế** | — |

### TC_DL_017: Initial render mobile đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_017 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Browser width = 375px |
| **Các bước thực hiện** | 1. Mở app lần đầu |
| **Kết quả mong đợi** | Render trực tiếp mobile layout, không flash desktop |
| **Kết quả test thực tế** | — |

### TC_DL_018: Tailwind sm: breakpoint 640px

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_018 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy |
| **Các bước thực hiện** | 1. Đặt viewport 640px<br>2. Kiểm tra classes có sm: prefix |
| **Kết quả mong đợi** | Các class sm: được áp dụng đúng |
| **Kết quả test thực tế** | — |

### TC_DL_019: Tailwind md: breakpoint 768px

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_019 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy |
| **Các bước thực hiện** | 1. Đặt viewport 768px<br>2. Kiểm tra classes có md: prefix |
| **Kết quả mong đợi** | Các class md: được áp dụng |
| **Kết quả test thực tế** | — |

### TC_DL_020: Tailwind lg: breakpoint 1024px

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_020 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy |
| **Các bước thực hiện** | 1. Đặt viewport 1024px<br>2. Kiểm tra classes có lg: prefix |
| **Kết quả mong đợi** | Các class lg: được áp dụng |
| **Kết quả test thực tế** | — |

### TC_DL_021: Tailwind xl: breakpoint 1280px

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_021 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App chạy |
| **Các bước thực hiện** | 1. Đặt viewport 1280px<br>2. Kiểm tra classes có xl: prefix |
| **Kết quả mong đợi** | Các class xl: được áp dụng |
| **Kết quả test thực tế** | — |

### TC_DL_022: useIsDesktop cleanup khi unmount

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_022 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Component có useIsDesktop |
| **Các bước thực hiện** | 1. Unmount component<br>2. Kiểm tra memory leaks |
| **Kết quả mong đợi** | matchMedia listener được remove đúng cách |
| **Kết quả test thực tế** | — |

### TC_DL_023: Resize nhanh liên tục không crash

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_023 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Resize browser nhanh 20 lần qua lại breakpoint |
| **Kết quả mong đợi** | App không crash, không memory leak, layout đúng |
| **Kết quả test thực tế** | — |

### TC_DL_024: Orientation change trên tablet

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_024 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | iPad viewport |
| **Các bước thực hiện** | 1. Xoay từ portrait (768px) → landscape (1024px) |
| **Kết quả mong đợi** | Layout chuyển từ mobile sang desktop |
| **Kết quả test thực tế** | — |

### TC_DL_025: Zoom 200% ảnh hưởng effective viewport

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_025 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Browser zoom 200% |
| **Các bước thực hiện** | 1. Zoom browser lên 200%<br>2. Kiểm tra effective viewport |
| **Kết quả mong đợi** | Layout responsive theo effective viewport (không phải physical) |
| **Kết quả test thực tế** | — |

### Nhóm 2: Navigation Layout (Bố cục điều hướng) (TC_DL_026 – TC_DL_050)

### TC_DL_026: Mobile: bottom tabs hiển thị khi viewport < 1024px

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_026 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Mở app<br>2. Kiểm tra phần dưới màn hình |
| **Kết quả mong đợi** | Bottom tab bar hiển thị với 5 tabs: Lịch, Quản lý, AI, Mua sắm, Cài đặt |
| **Kết quả test thực tế** | — |

### TC_DL_027: Desktop: sidebar nav hiển thị khi viewport >= 1024px

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_027 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Mở app<br>2. Kiểm tra bên trái màn hình |
| **Kết quả mong đợi** | Sidebar navigation hiển thị với tất cả tab items |
| **Kết quả test thực tế** | — |

### TC_DL_028: Bottom tabs: tất cả 5 tabs hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_028 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport mobile 375px |
| **Các bước thực hiện** | 1. Đếm tabs trong bottom bar |
| **Kết quả mong đợi** | 5 tabs: Lịch, Quản lý, AI Phân tích, Mua sắm, Cài đặt |
| **Kết quả test thực tế** | — |

### TC_DL_029: Desktop nav: tất cả tabs listed

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_029 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport desktop 1440px |
| **Các bước thực hiện** | 1. Đếm items trong sidebar |
| **Kết quả mong đợi** | Tất cả tabs hiển thị trong sidebar |
| **Kết quả test thực tế** | — |

### TC_DL_030: Active tab highlighted đúng (mobile)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_030 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport mobile, đang ở tab Lịch |
| **Các bước thực hiện** | 1. Kiểm tra tab Lịch |
| **Kết quả mong đợi** | Tab Lịch có highlight color/bold, các tab khác normal |
| **Kết quả test thực tế** | — |

### TC_DL_031: Active tab highlighted đúng (desktop)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_031 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport desktop, đang ở tab Quản lý |
| **Các bước thực hiện** | 1. Kiểm tra sidebar |
| **Kết quả mong đợi** | Item Quản lý có background highlight hoặc bold |
| **Kết quả test thực tế** | — |

### TC_DL_032: Click tab → chuyển tab (mobile)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_032 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Viewport mobile |
| **Các bước thực hiện** | 1. Click tab Quản lý trong bottom bar |
| **Kết quả mong đợi** | Chuyển sang nội dung tab Quản lý |
| **Kết quả test thực tế** | — |

### TC_DL_033: Click tab → chuyển tab (desktop)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_033 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Viewport desktop |
| **Các bước thực hiện** | 1. Click item AI trong sidebar |
| **Kết quả mong đợi** | Chuyển sang nội dung tab AI Phân tích |
| **Kết quả test thực tế** | — |

### TC_DL_034: Tab icons hiển thị đúng (mobile)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_034 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport mobile |
| **Các bước thực hiện** | 1. Kiểm tra icons trong bottom bar |
| **Kết quả mong đợi** | Mỗi tab có icon phù hợp (calendar, list, brain, cart, gear) |
| **Kết quả test thực tế** | — |

### TC_DL_035: Tab labels hiển thị đúng (mobile)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_035 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport mobile |
| **Các bước thực hiện** | 1. Kiểm tra text labels |
| **Kết quả mong đợi** | Tên tab hiển thị dưới icon bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_DL_036: Desktop nav: icons + labels cạnh nhau

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_036 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport desktop |
| **Các bước thực hiện** | 1. Kiểm tra sidebar items |
| **Kết quả mong đợi** | Icon và label hiển thị ngang hàng trong sidebar |
| **Kết quả test thực tế** | — |

### TC_DL_037: Resize: bottom tabs ↔ sidebar transition smooth

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_037 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Resize chậm qua breakpoint 1024px |
| **Kết quả mong đợi** | Transition mượt mà, không flash/flicker |
| **Kết quả test thực tế** | — |

### TC_DL_038: TabBar và DesktopNav exclusive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_038 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App đang chạy |
| **Các bước thực hiện** | 1. Kiểm tra DOM ở 375px và 1440px |
| **Kết quả mong đợi** | Chỉ 1 trong 2 (TabBar hoặc DesktopNav) hiển thị tại mỗi thời điểm |
| **Kết quả test thực tế** | — |

### TC_DL_039: Navigation state preserved khi resize

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_039 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Đang ở tab AI, viewport mobile |
| **Các bước thực hiện** | 1. Resize lên desktop |
| **Kết quả mong đợi** | Vẫn ở tab AI sau khi chuyển layout |
| **Kết quả test thực tế** | — |

### TC_DL_040: Desktop nav width cố định

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_040 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport desktop |
| **Các bước thực hiện** | 1. Kiểm tra sidebar width |
| **Kết quả mong đợi** | Sidebar có width cố định (ví dụ 200-250px), không thay đổi theo content |
| **Kết quả test thực tế** | — |

### TC_DL_041: Bottom tabs height cố định

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_041 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport mobile |
| **Các bước thực hiện** | 1. Kiểm tra bottom bar height |
| **Kết quả mong đợi** | Bottom bar height cố định (~56-64px) |
| **Kết quả test thực tế** | — |

### TC_DL_042: Bottom tabs safe area cho iPhone notch

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_042 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | iPhone với notch/dynamic island |
| **Các bước thực hiện** | 1. Kiểm tra bottom bar padding |
| **Kết quả mong đợi** | Có padding-bottom cho safe-area-inset-bottom |
| **Kết quả test thực tế** | — |

### TC_DL_043: Desktop nav scrollable khi nhiều items

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_043 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport desktop, nhiều tab items |
| **Các bước thực hiện** | 1. Kiểm tra sidebar overflow |
| **Kết quả mong đợi** | Sidebar có scroll nếu content vượt quá height |
| **Kết quả test thực tế** | — |

### TC_DL_044: Tab badge/indicator (notifications)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_044 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Có notifications/badge |
| **Các bước thực hiện** | 1. Kiểm tra tabs |
| **Kết quả mong đợi** | Badge số hiển thị đúng trên cả mobile bottom bar và desktop sidebar |
| **Kết quả test thực tế** | — |

### TC_DL_045: Desktop nav hover effect

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_045 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport desktop |
| **Các bước thực hiện** | 1. Hover chuột lên nav item |
| **Kết quả mong đợi** | Item có hover background color hoặc underline |
| **Kết quả test thực tế** | — |

### TC_DL_046: Mobile tab tap feedback

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_046 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport mobile |
| **Các bước thực hiện** | 1. Tap vào tab |
| **Kết quả mong đợi** | Có tap feedback (ripple hoặc color change tạm thời) |
| **Kết quả test thực tế** | — |

### TC_DL_047: Desktop nav keyboard navigation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_047 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport desktop |
| **Các bước thực hiện** | 1. Tab qua sidebar items bằng keyboard |
| **Kết quả mong đợi** | Có thể navigate bằng Tab key, Enter để chọn |
| **Kết quả test thực tế** | — |

### TC_DL_048: Mobile bottom bar dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_048 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport mobile, dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra bottom bar |
| **Kết quả mong đợi** | Bottom bar có dark background, icons/labels sáng |
| **Kết quả test thực tế** | — |

### TC_DL_049: Desktop sidebar dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_049 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport desktop, dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra sidebar |
| **Kết quả mong đợi** | Sidebar dark background, text/icons sáng |
| **Kết quả test thực tế** | — |

### TC_DL_050: Navigation không bị ẩn bởi virtual keyboard

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_050 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mobile, đang nhập text |
| **Các bước thực hiện** | 1. Tap vào input field<br>2. Virtual keyboard mở |
| **Kết quả mong đợi** | Bottom tabs vẫn accessible (scroll hoặc ẩn tạm) |
| **Kết quả test thực tế** | — |

### Nhóm 3: Calendar Responsive (Lịch responsive) (TC_DL_051 – TC_DL_080)

### TC_DL_051: Calendar mobile: layout stacked dọc

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_051 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px, tab Lịch |
| **Các bước thực hiện** | 1. Mở tab Lịch |
| **Kết quả mong đợi** | Calendar hiển thị stacked: header → date grid → meal details dưới |
| **Kết quả test thực tế** | — |

### TC_DL_052: Calendar desktop: layout side-by-side

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_052 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px, tab Lịch |
| **Các bước thực hiện** | 1. Mở tab Lịch |
| **Kết quả mong đợi** | Calendar grid bên trái, nutrition/detail panel bên phải |
| **Kết quả test thực tế** | — |

### TC_DL_053: Calendar mobile: sub-tabs cho nutrition

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_053 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px, tab Lịch |
| **Các bước thực hiện** | 1. Kiểm tra sub-navigation |
| **Kết quả mong đợi** | Có sub-tabs hoặc scroll sections cho Bữa ăn / Dinh dưỡng |
| **Kết quả test thực tế** | — |

### TC_DL_054: Calendar desktop: nutrition panel luôn visible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_054 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra bên phải |
| **Kết quả mong đợi** | Nutrition panel hiển thị bên phải không cần click sub-tab |
| **Kết quả test thực tế** | — |

### TC_DL_055: Calendar week grid mobile: scroll ngang

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_055 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra calendar week view |
| **Kết quả mong đợi** | 7 ngày hiển thị có thể scroll ngang hoặc compact |
| **Kết quả test thực tế** | — |

### TC_DL_056: Calendar week grid desktop: full 7 ngày visible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_056 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra calendar week view |
| **Kết quả mong đợi** | Tất cả 7 ngày hiển thị trên 1 hàng không cần scroll |
| **Kết quả test thực tế** | — |

### TC_DL_057: Date picker mobile: compact

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_057 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Mở date picker |
| **Kết quả mong đợi** | Date picker full-width hoặc bottom sheet |
| **Kết quả test thực tế** | — |

### TC_DL_058: Date picker desktop: popup dropdown

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_058 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Mở date picker |
| **Kết quả mong đợi** | Date picker hiển thị dạng popup dropdown nhỏ |
| **Kết quả test thực tế** | — |

### TC_DL_059: Meal slots mobile: full-width cards

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_059 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra meal slots |
| **Kết quả mong đợi** | Breakfast/Lunch/Dinner cards full-width, stacked dọc |
| **Kết quả test thực tế** | — |

### TC_DL_060: Meal slots desktop: side-by-side hoặc grid

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_060 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra meal slots |
| **Kết quả mong đợi** | 3 meal slots có thể hiển thị cạnh nhau hoặc grid 3 cột |
| **Kết quả test thực tế** | — |

### TC_DL_061: Quick preview panel mobile: bottom sheet

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_061 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px, tap ngày |
| **Các bước thực hiện** | 1. Tap vào 1 ngày trên calendar |
| **Kết quả mong đợi** | Quick preview panel slide up từ dưới (bottom sheet) |
| **Kết quả test thực tế** | — |

### TC_DL_062: Quick preview panel desktop: inline panel

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_062 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px, click ngày |
| **Các bước thực hiện** | 1. Click vào 1 ngày trên calendar |
| **Kết quả mong đợi** | Quick preview hiển thị inline bên phải hoặc dưới calendar |
| **Kết quả test thực tế** | — |

### TC_DL_063: Calendar header responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_063 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra header Lịch ở 375px và 1440px |
| **Kết quả mong đợi** | Header text và navigation arrows fit đúng ở cả 2 kích thước |
| **Kết quả test thực tế** | — |

### TC_DL_064: Calendar navigation arrows mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_064 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra arrows tháng trước/sau |
| **Kết quả mong đợi** | Arrows đủ lớn (≥44px touch target) và dễ bấm |
| **Kết quả test thực tế** | — |

### TC_DL_065: Calendar date cell mobile: đủ lớn để tap

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_065 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra kích thước date cells |
| **Kết quả mong đợi** | Mỗi cell ≥44px chiều rộng và cao |
| **Kết quả test thực tế** | — |

### TC_DL_066: Calendar date cell desktop: hover effect

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_066 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Hover chuột lên date cell |
| **Kết quả mong đợi** | Cell có hover effect (background highlight) |
| **Kết quả test thực tế** | — |

### TC_DL_067: Calendar today highlight visible cả 2 layout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_067 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Cả mobile và desktop |
| **Các bước thực hiện** | 1. Kiểm tra ngày hôm nay |
| **Kết quả mong đợi** | Today cell có highlight rõ ràng ở cả 2 layout |
| **Kết quả test thực tế** | — |

### TC_DL_068: Calendar selected date visible cả 2 layout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_068 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Cả mobile và desktop |
| **Các bước thực hiện** | 1. Click/tap chọn ngày |
| **Kết quả mong đợi** | Selected date có visual indicator rõ ràng |
| **Kết quả test thực tế** | — |

### TC_DL_069: Calendar month view mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_069 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Chuyển sang month view |
| **Kết quả mong đợi** | Tháng hiển thị compact, fit 375px width |
| **Kết quả test thực tế** | — |

### TC_DL_070: Calendar month view desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_070 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Chuyển sang month view |
| **Kết quả mong đợi** | Tháng hiển thị đầy đủ với space cho nutrition info |
| **Kết quả test thực tế** | — |

### TC_DL_071: Calendar plan all button mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_071 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra nút Plan All |
| **Kết quả mong đợi** | Nút hiển thị full-width hoặc dễ nhìn trên mobile |
| **Kết quả test thực tế** | — |

### TC_DL_072: Calendar plan all button desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_072 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra nút Plan All |
| **Kết quả mong đợi** | Nút hiển thị phù hợp layout desktop |
| **Kết quả test thực tế** | — |

### TC_DL_073: Calendar add meal button mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_073 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra nút thêm bữa ăn |
| **Kết quả mong đợi** | Nút có kích thước touch-friendly (≥44px) |
| **Kết quả test thực tế** | — |

### TC_DL_074: Calendar nutrition bars mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_074 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra nutrition progress bars |
| **Kết quả mong đợi** | Bars hiển thị đầy đủ, không bị cắt |
| **Kết quả test thực tế** | — |

### TC_DL_075: Calendar nutrition bars desktop: rộng hơn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_075 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra nutrition progress bars |
| **Kết quả mong đợi** | Bars rộng hơn, có thể hiển thị labels bên cạnh |
| **Kết quả test thực tế** | — |

### TC_DL_076: Calendar empty state mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_076 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra empty state |
| **Kết quả mong đợi** | Empty state message hiển thị centered, CTA button dễ nhìn |
| **Kết quả test thực tế** | — |

### TC_DL_077: Calendar empty state desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_077 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra empty state |
| **Kết quả mong đợi** | Empty state trong panel bên phải, layout đẹp |
| **Kết quả test thực tế** | — |

### TC_DL_078: Calendar scroll behavior mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_078 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, nhiều nội dung |
| **Các bước thực hiện** | 1. Scroll lên xuống |
| **Kết quả mong đợi** | Smooth scroll, momentum scroll trên mobile |
| **Kết quả test thực tế** | — |

### TC_DL_079: Calendar scroll behavior desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_079 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Scroll |
| **Kết quả mong đợi** | Smooth scroll, có thể dùng mouse wheel |
| **Kết quả test thực tế** | — |

### TC_DL_080: Calendar landscape orientation mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_080 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport mobile landscape |
| **Các bước thực hiện** | 1. Xoay phone ngang |
| **Kết quả mong đợi** | Calendar hiển thị phù hợp landscape (nhiều cột hơn hoặc scroll) |
| **Kết quả test thực tế** | — |

### Nhóm 4: Management Tab Responsive (Quản lý responsive) (TC_DL_081 – TC_DL_110)

### TC_DL_081: Management mobile: full-screen ingredient list

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_081 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px, tab Quản lý |
| **Các bước thực hiện** | 1. Mở tab Quản lý > Nguyên liệu |
| **Kết quả mong đợi** | Danh sách nguyên liệu full-width, mỗi item 1 hàng |
| **Kết quả test thực tế** | — |

### TC_DL_082: Management desktop: split list/detail

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_082 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px, tab Quản lý |
| **Các bước thực hiện** | 1. Mở tab Quản lý |
| **Kết quả mong đợi** | List bên trái (1/3), detail panel bên phải (2/3) |
| **Kết quả test thực tế** | — |

### TC_DL_083: Management mobile: tap item → full-screen detail

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_083 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Tap vào 1 ingredient |
| **Kết quả mong đợi** | Navigate sang full-screen detail page |
| **Kết quả test thực tế** | — |

### TC_DL_084: Management desktop: click item → detail panel update

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_084 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Click vào 1 ingredient |
| **Kết quả mong đợi** | Detail panel bên phải cập nhật nội dung |
| **Kết quả test thực tế** | — |

### TC_DL_085: Management mobile: back button từ detail

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_085 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px, đang xem detail |
| **Các bước thực hiện** | 1. Nhấn back button |
| **Kết quả mong đợi** | Quay lại list view |
| **Kết quả test thực tế** | — |

### TC_DL_086: Management desktop: không cần back button

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_086 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra detail panel |
| **Kết quả mong đợi** | Không có back button (vì list luôn visible) |
| **Kết quả test thực tế** | — |

### TC_DL_087: Card layout mobile: 1 cột

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_087 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra grid layout |
| **Kết quả mong đợi** | Cards hiển thị 1 cột, full-width |
| **Kết quả test thực tế** | — |

### TC_DL_088: Card layout tablet: 2 cột

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_088 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 768px |
| **Các bước thực hiện** | 1. Kiểm tra grid layout |
| **Kết quả mong đợi** | Cards hiển thị 2 cột |
| **Kết quả test thực tế** | — |

### TC_DL_089: Card layout desktop: 3 cột

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_089 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra grid layout |
| **Kết quả mong đợi** | Cards hiển thị 3 hoặc 4 cột |
| **Kết quả test thực tế** | — |

### TC_DL_090: ListToolbar mobile: compact layout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_090 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra toolbar trên list |
| **Kết quả mong đợi** | Sort/filter/view buttons compact, có thể wrap |
| **Kết quả test thực tế** | — |

### TC_DL_091: ListToolbar desktop: inline layout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_091 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra toolbar |
| **Kết quả mong đợi** | Sort, filter, view switcher hiển thị inline 1 hàng |
| **Kết quả test thực tế** | — |

### TC_DL_092: Filter bottom sheet mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_092 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Click nút Filter |
| **Kết quả mong đợi** | Filter panel mở dạng bottom sheet |
| **Kết quả test thực tế** | — |

### TC_DL_093: Filter sidebar/popup desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_093 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Click nút Filter |
| **Kết quả mong đợi** | Filter panel mở dạng sidebar hoặc dropdown |
| **Kết quả test thực tế** | — |

### TC_DL_094: Search bar mobile: full-width

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_094 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra search bar |
| **Kết quả mong đợi** | Search bar full-width, input đủ lớn |
| **Kết quả test thực tế** | — |

### TC_DL_095: Search bar desktop: fixed width

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_095 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra search bar |
| **Kết quả mong đợi** | Search bar có max-width, không quá rộng |
| **Kết quả test thực tế** | — |

### TC_DL_096: Add button mobile: FAB hoặc full-width

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_096 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra nút Thêm |
| **Kết quả mong đợi** | Nút Thêm dạng FAB (floating) hoặc full-width button |
| **Kết quả test thực tế** | — |

### TC_DL_097: Add button desktop: inline button

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_097 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra nút Thêm |
| **Kết quả mong đợi** | Nút Thêm inline trong toolbar |
| **Kết quả test thực tế** | — |

### TC_DL_098: Form inputs mobile: full-width

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_098 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px, mở form thêm ingredient |
| **Các bước thực hiện** | 1. Kiểm tra input fields |
| **Kết quả mong đợi** | Inputs full-width, font size ≥16px (tránh zoom iOS) |
| **Kết quả test thực tế** | — |

### TC_DL_099: Form inputs desktop: constrained width

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_099 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, mở form |
| **Các bước thực hiện** | 1. Kiểm tra input fields |
| **Kết quả mong đợi** | Inputs có max-width, form centered |
| **Kết quả test thực tế** | — |

### TC_DL_100: Ingredient list empty state mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_100 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, 0 ingredients |
| **Các bước thực hiện** | 1. Kiểm tra empty state |
| **Kết quả mong đợi** | Empty state message + CTA button dễ nhìn |
| **Kết quả test thực tế** | — |

### TC_DL_101: Dish list responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_101 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra dish list ở 375px và 1440px |
| **Kết quả mong đợi** | Dish list responsive: cards 1-col mobile, multi-col desktop |
| **Kết quả test thực tế** | — |

### TC_DL_102: Management tab switching (Ingredients/Dishes) mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_102 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Chuyển giữa tab Nguyên liệu và Món ăn |
| **Kết quả mong đợi** | Sub-tab switcher responsive, dễ bấm |
| **Kết quả test thực tế** | — |

### TC_DL_103: Management tab switching desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_103 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Chuyển giữa tabs |
| **Kết quả mong đợi** | Tab switcher inline, highlight active tab |
| **Kết quả test thực tế** | — |

### TC_DL_104: Delete confirmation dialog mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_104 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Click xóa ingredient |
| **Kết quả mong đợi** | Dialog full-width bottom hoặc centered, nút đủ lớn |
| **Kết quả test thực tế** | — |

### TC_DL_105: Delete confirmation dialog desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_105 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Click xóa |
| **Kết quả mong đợi** | Dialog centered, max-width ~400px |
| **Kết quả test thực tế** | — |

### TC_DL_106: Pagination/infinite scroll mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_106 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, nhiều items |
| **Các bước thực hiện** | 1. Scroll đến cuối list |
| **Kết quả mong đợi** | Load more hoặc infinite scroll smooth |
| **Kết quả test thực tế** | — |

### TC_DL_107: Pagination/infinite scroll desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_107 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, nhiều items |
| **Các bước thực hiện** | 1. Scroll đến cuối |
| **Kết quả mong đợi** | Pagination hoặc infinite scroll, performance tốt |
| **Kết quả test thực tế** | — |

### TC_DL_108: Image trong card mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_108 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, card có ảnh |
| **Các bước thực hiện** | 1. Kiểm tra ảnh trong card |
| **Kết quả mong đợi** | Ảnh responsive, không bị méo, aspect ratio đúng |
| **Kết quả test thực tế** | — |

### TC_DL_109: Image trong card desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_109 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra ảnh |
| **Kết quả mong đợi** | Ảnh kích thước phù hợp card desktop |
| **Kết quả test thực tế** | — |

### TC_DL_110: Management loading skeleton responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_110 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi, đang load |
| **Các bước thực hiện** | 1. Kiểm tra skeleton loader |
| **Kết quả mong đợi** | Skeleton responsive theo layout (1-col mobile, multi-col desktop) |
| **Kết quả test thực tế** | — |

### Nhóm 5: Modal & Dialog (Modal và hộp thoại) (TC_DL_111 – TC_DL_135)

### TC_DL_111: Modal mobile: bottom sheet slide up

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_111 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Mở modal (thêm ingredient) |
| **Kết quả mong đợi** | Modal slide up từ dưới, chiếm ~90% height |
| **Kết quả test thực tế** | — |

### TC_DL_112: Modal desktop: centered với overlay

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_112 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Mở modal |
| **Kết quả mong đợi** | Modal centered, max-width ~500px, dark overlay |
| **Kết quả test thực tế** | — |

### TC_DL_113: Modal mobile: full-width

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_113 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra modal width |
| **Kết quả mong đợi** | Modal width = 100% (hoặc gần 100%) |
| **Kết quả test thực tế** | — |

### TC_DL_114: Modal desktop: max-width constrained

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_114 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra modal width |
| **Kết quả mong đợi** | Modal có max-width (400-600px), centered |
| **Kết quả test thực tế** | — |

### TC_DL_115: Modal mobile: swipe down to close

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_115 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, modal mở |
| **Các bước thực hiện** | 1. Swipe xuống trên modal handle |
| **Kết quả mong đợi** | Modal slide down và đóng |
| **Kết quả test thực tế** | — |

### TC_DL_116: Modal desktop: ESC to close

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_116 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px, modal mở |
| **Các bước thực hiện** | 1. Nhấn ESC |
| **Kết quả mong đợi** | Modal đóng |
| **Kết quả test thực tế** | — |

### TC_DL_117: Modal desktop: click overlay to close

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_117 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px, modal mở |
| **Các bước thực hiện** | 1. Click vào overlay (vùng tối bên ngoài modal) |
| **Kết quả mong đợi** | Modal đóng |
| **Kết quả test thực tế** | — |

### TC_DL_118: Modal close button position mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_118 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra nút đóng modal |
| **Kết quả mong đợi** | Nút X ở góc trên phải, ≥44px touch target |
| **Kết quả test thực tế** | — |

### TC_DL_119: Modal close button position desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_119 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra nút đóng |
| **Kết quả mong đợi** | Nút X ở góc trên phải modal |
| **Kết quả test thực tế** | — |

### TC_DL_120: Confirm dialog mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_120 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Trigger confirm dialog (delete) |
| **Kết quả mong đợi** | Dialog compact, nút Xác nhận/Hủy dễ bấm |
| **Kết quả test thực tế** | — |

### TC_DL_121: Confirm dialog desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_121 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Trigger confirm dialog |
| **Kết quả mong đợi** | Dialog centered, nút rõ ràng |
| **Kết quả test thực tế** | — |

### TC_DL_122: Form modal mobile: scroll nếu dài

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_122 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, form dài |
| **Các bước thực hiện** | 1. Mở form modal với nhiều fields |
| **Kết quả mong đợi** | Modal scrollable, nút Submit luôn visible (sticky bottom) |
| **Kết quả test thực tế** | — |

### TC_DL_123: Form modal desktop: fit content

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_123 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Mở form modal |
| **Kết quả mong đợi** | Modal auto-height theo content, max-height constraint |
| **Kết quả test thực tế** | — |

### TC_DL_124: SyncConflictModal mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_124 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, conflict detected |
| **Các bước thực hiện** | 1. Trigger sync conflict |
| **Kết quả mong đợi** | Modal hiển thị đúng trên mobile, nút chọn dễ bấm |
| **Kết quả test thực tế** | — |

### TC_DL_125: SyncConflictModal desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_125 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Trigger sync conflict |
| **Kết quả mong đợi** | Modal centered, options rõ ràng |
| **Kết quả test thực tế** | — |

### TC_DL_126: AI suggestion modal mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_126 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Mở AI suggestion modal |
| **Kết quả mong đợi** | Modal bottom sheet, danh sách suggestions scrollable |
| **Kết quả test thực tế** | — |

### TC_DL_127: AI suggestion modal desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_127 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Mở AI suggestion modal |
| **Kết quả mong đợi** | Modal wide hơn, grid layout cho suggestions |
| **Kết quả test thực tế** | — |

### TC_DL_128: Modal với keyboard mở (mobile)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_128 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, modal có input |
| **Các bước thực hiện** | 1. Tap vào input trong modal |
| **Kết quả mong đợi** | Modal adjust để input visible khi virtual keyboard mở |
| **Kết quả test thực tế** | — |

### TC_DL_129: Multiple modal layers (modal trên modal)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_129 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal 1 mở, trigger modal 2 |
| **Các bước thực hiện** | 1. Mở confirm dialog từ trong form modal |
| **Kết quả mong đợi** | Modal 2 hiển thị trên modal 1, z-index đúng |
| **Kết quả test thực tế** | — |

### TC_DL_130: Toast notification mobile: full-width top

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_130 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Trigger toast notification |
| **Kết quả mong đợi** | Toast hiển thị full-width ở trên, dễ đọc |
| **Kết quả test thực tế** | — |

### TC_DL_131: Toast notification desktop: top-right corner

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_131 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Trigger toast |
| **Kết quả mong đợi** | Toast hiển thị ở góc trên phải, max-width constrained |
| **Kết quả test thực tế** | — |

### TC_DL_132: Modal backdrop dim đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_132 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Kiểm tra overlay opacity |
| **Kết quả mong đợi** | Overlay dim 50-70%, content phía sau mờ |
| **Kết quả test thực tế** | — |

### TC_DL_133: Modal animation mobile: slide up

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_133 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Mở modal |
| **Kết quả mong đợi** | Animation slide up smooth ~200ms |
| **Kết quả test thực tế** | — |

### TC_DL_134: Modal animation desktop: fade in

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_134 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Mở modal |
| **Kết quả mong đợi** | Animation fade in hoặc scale up smooth |
| **Kết quả test thực tế** | — |

### TC_DL_135: Modal focus trap

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_135 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Modal mở, dùng keyboard |
| **Các bước thực hiện** | 1. Tab qua các elements trong modal |
| **Kết quả mong đợi** | Focus bị trap trong modal, không escape ra content phía sau |
| **Kết quả test thực tế** | — |

### Nhóm 6: Touch & Mouse Interaction (Tương tác cảm ứng & chuột) (TC_DL_136 – TC_DL_160)

### TC_DL_136: Touch targets mobile ≥44px

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_136 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra tất cả buttons, links, interactive elements |
| **Kết quả mong đợi** | Tất cả touch targets ≥44px width và height |
| **Kết quả test thực tế** | — |

### TC_DL_137: Hover states chỉ trên desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_137 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Desktop viewport |
| **Các bước thực hiện** | 1. Hover chuột lên buttons, cards, links |
| **Kết quả mong đợi** | Hover effect hiển thị (background change, underline, elevation) |
| **Kết quả test thực tế** | — |

### TC_DL_138: Không có hover effect trên mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_138 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mobile viewport, touch device |
| **Các bước thực hiện** | 1. Tap elements |
| **Kết quả mong đợi** | Không có sticky hover state sau khi tap |
| **Kết quả test thực tế** | — |

### TC_DL_139: Click targets desktop adequate

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_139 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra click targets |
| **Kết quả mong đợi** | Buttons, links đủ lớn để click chính xác (≥32px) |
| **Kết quả test thực tế** | — |

### TC_DL_140: Swipe gestures mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_140 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Swipe trái/phải trên calendar |
| **Kết quả mong đợi** | Swipe chuyển ngày/tuần hoạt động smooth |
| **Kết quả test thực tế** | — |

### TC_DL_141: Long-press mobile cho context menu

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_141 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Long-press vào item |
| **Kết quả mong đợi** | Context menu hoặc action sheet hiển thị (nếu có) |
| **Kết quả test thực tế** | — |

### TC_DL_142: Right-click desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_142 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Right-click vào item |
| **Kết quả mong đợi** | Browser context menu hoặc custom menu (nếu có) |
| **Kết quả test thực tế** | — |

### TC_DL_143: Scroll momentum mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_143 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Swipe scroll nhanh |
| **Kết quả mong đợi** | Scroll có momentum (inertia), dừng dần |
| **Kết quả test thực tế** | — |

### TC_DL_144: Scroll smooth desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_144 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Scroll bằng mouse wheel |
| **Kết quả mong đợi** | Smooth scroll, không giật |
| **Kết quả test thực tế** | — |

### TC_DL_145: Pinch zoom disabled (nếu PWA)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_145 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mobile, PWA mode |
| **Các bước thực hiện** | 1. Pinch zoom 2 ngón tay |
| **Kết quả mong đợi** | Zoom bị disabled (viewport meta tag) |
| **Kết quả test thực tế** | — |

### TC_DL_146: Double-tap không zoom

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_146 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Double-tap vào content |
| **Kết quả mong đợi** | Không trigger zoom (touch-action: manipulation) |
| **Kết quả test thực tế** | — |

### TC_DL_147: Touch feedback (ripple effect)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_147 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Tap vào button |
| **Kết quả mong đợi** | Có visual feedback (ripple, color flash, hoặc scale) |
| **Kết quả test thực tế** | — |

### TC_DL_148: Cursor pointer trên interactive elements desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_148 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Hover chuột lên buttons, links |
| **Kết quả mong đợi** | Cursor thay đổi thành pointer |
| **Kết quả test thực tế** | — |

### TC_DL_149: Cursor default trên non-interactive desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_149 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Hover lên text, background |
| **Kết quả mong đợi** | Cursor là default (arrow) |
| **Kết quả test thực tế** | — |

### TC_DL_150: Drag support desktop (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_150 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Thử drag item |
| **Kết quả mong đợi** | Drag and drop hoạt động trên desktop (nếu feature có) |
| **Kết quả test thực tế** | — |

### TC_DL_151: Swipe to delete mobile (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_151 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Swipe trái trên list item |
| **Kết quả mong đợi** | Swipe reveal delete button (nếu feature có) |
| **Kết quả test thực tế** | — |

### TC_DL_152: Scroll snap mobile calendar

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_152 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Scroll qua các ngày |
| **Kết quả mong đợi** | Scroll snap vào ngày gần nhất |
| **Kết quả test thực tế** | — |

### TC_DL_153: Mouse wheel horizontal scroll desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_153 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 1440px, horizontal content |
| **Các bước thực hiện** | 1. Shift + mouse wheel |
| **Kết quả mong đợi** | Horizontal scroll hoạt động |
| **Kết quả test thực tế** | — |

### TC_DL_154: Tab key navigation desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_154 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Nhấn Tab key nhiều lần |
| **Kết quả mong đợi** | Focus di chuyển qua các interactive elements theo thứ tự DOM |
| **Kết quả test thực tế** | — |

### TC_DL_155: Enter key activation desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_155 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px, focus trên button |
| **Các bước thực hiện** | 1. Nhấn Enter |
| **Kết quả mong đợi** | Button được activate giống click |
| **Kết quả test thực tế** | — |

### TC_DL_156: Space key activation desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_156 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, focus trên checkbox |
| **Các bước thực hiện** | 1. Nhấn Space |
| **Kết quả mong đợi** | Checkbox toggle giống click |
| **Kết quả test thực tế** | — |

### TC_DL_157: Focus visible ring desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_157 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px, dùng keyboard |
| **Các bước thực hiện** | 1. Tab qua elements |
| **Kết quả mong đợi** | Focus ring visible rõ ràng |
| **Kết quả test thực tế** | — |

### TC_DL_158: Focus ring ẩn khi dùng mouse

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_158 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Click bằng mouse |
| **Kết quả mong đợi** | Focus ring không hiển thị khi click mouse |
| **Kết quả test thực tế** | — |

### TC_DL_159: Pull-to-refresh mobile (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_159 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Pull down từ top |
| **Kết quả mong đợi** | Refresh indicator hiển thị (nếu feature có) |
| **Kết quả test thực tế** | — |

### TC_DL_160: Scroll position preserved khi resize

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_160 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Đang scroll giữa trang |
| **Các bước thực hiện** | 1. Resize viewport |
| **Kết quả mong đợi** | Scroll position giữ nguyên hoặc adjust hợp lý |
| **Kết quả test thực tế** | — |

### Nhóm 7: Typography & Spacing (Typography & Spacing) (TC_DL_161 – TC_DL_180)

### TC_DL_161: Font size h1 mobile vs desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_161 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. So sánh h1 font size ở 375px và 1440px |
| **Kết quả mong đợi** | h1 nhỏ hơn trên mobile (ví dụ 20px) vs desktop (ví dụ 28px) |
| **Kết quả test thực tế** | — |

### TC_DL_162: Font size body text mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_162 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra body text size |
| **Kết quả mong đợi** | Body text ≥14px, dễ đọc trên mobile |
| **Kết quả test thực tế** | — |

### TC_DL_163: Font size body text desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_163 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra body text size |
| **Kết quả mong đợi** | Body text 14-16px, comfortable reading |
| **Kết quả test thực tế** | — |

### TC_DL_164: Line height responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_164 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. So sánh line-height |
| **Kết quả mong đợi** | Line-height phù hợp: 1.4-1.6 cho body text |
| **Kết quả test thực tế** | — |

### TC_DL_165: Padding responsive: sm:p-6

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_165 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra padding ở 375px và 1440px |
| **Kết quả mong đợi** | Padding nhỏ hơn mobile, lớn hơn desktop (sm:p-6 áp dụng) |
| **Kết quả test thực tế** | — |

### TC_DL_166: Margin responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_166 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra margins |
| **Kết quả mong đợi** | Margins adjust theo viewport |
| **Kết quả test thực tế** | — |

### TC_DL_167: Text truncation mobile: tên dài bị cắt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_167 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, ingredient tên dài |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | Tên bị truncate với ellipsis (...) trên mobile |
| **Kết quả test thực tế** | — |

### TC_DL_168: Text wrapping desktop: tên dài wrap

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_168 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, ingredient tên dài |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | Tên wrap sang dòng mới trên desktop (có đủ space) |
| **Kết quả test thực tế** | — |

### TC_DL_169: Vietnamese diacritics hiển thị đúng mọi kích thước

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_169 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra text với dấu tiếng Việt ở 375px, 768px, 1440px |
| **Kết quả mong đợi** | Dấu hiển thị đúng không bị cắt mất (đ, ă, â, ê, ô, ơ, ư) |
| **Kết quả test thực tế** | — |

### TC_DL_170: Button text size mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_170 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra button text |
| **Kết quả mong đợi** | Button text ≥14px, đọc được rõ |
| **Kết quả test thực tế** | — |

### TC_DL_171: Button text size desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_171 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra button text |
| **Kết quả mong đợi** | Button text 14-16px |
| **Kết quả test thực tế** | — |

### TC_DL_172: Label text size form mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_172 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, form mở |
| **Các bước thực hiện** | 1. Kiểm tra form labels |
| **Kết quả mong đợi** | Labels ≥12px, rõ ràng |
| **Kết quả test thực tế** | — |

### TC_DL_173: Number/nutrition values responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_173 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra nutrition numbers |
| **Kết quả mong đợi** | Số liệu dinh dưỡng hiển thị đúng, không bị cắt |
| **Kết quả test thực tế** | — |

### TC_DL_174: Input font size mobile ≥16px

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_174 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px (iOS) |
| **Các bước thực hiện** | 1. Kiểm tra input font size |
| **Kết quả mong đợi** | Font size ≥16px (tránh auto-zoom trên iOS) |
| **Kết quả test thực tế** | — |

### TC_DL_175: Spacing giữa items responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_175 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra gap giữa cards/items |
| **Kết quả mong đợi** | Gap nhỏ hơn mobile, lớn hơn desktop |
| **Kết quả test thực tế** | — |

### TC_DL_176: Heading hierarchy đúng (h1>h2>h3)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_176 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra heading sizes |
| **Kết quả mong đợi** | h1 > h2 > h3 ở cả mobile và desktop |
| **Kết quả test thực tế** | — |

### TC_DL_177: Badge text size responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_177 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra tag/badge text |
| **Kết quả mong đợi** | Badge text đọc được ở cả 2 kích thước |
| **Kết quả test thực tế** | — |

### TC_DL_178: Toast text responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_178 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Trigger toast |
| **Kết quả mong đợi** | Toast text đọc được, không quá dài trên mobile |
| **Kết quả test thực tế** | — |

### TC_DL_179: Empty state text responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_179 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi, list trống |
| **Các bước thực hiện** | 1. Kiểm tra empty state message |
| **Kết quả mong đợi** | Text centered, font size phù hợp |
| **Kết quả test thực tế** | — |

### TC_DL_180: Max-width cho text content desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_180 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1920px |
| **Các bước thực hiện** | 1. Kiểm tra text blocks |
| **Kết quả mong đợi** | Text không quá rộng (max ~80ch/dòng) cho readability |
| **Kết quả test thực tế** | — |

### Nhóm 8: Grid & Card Layout (Grid & Card) (TC_DL_181 – TC_DL_200)

### TC_DL_181: Grid 1 column mobile (375px)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_181 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px, dish list |
| **Các bước thực hiện** | 1. Kiểm tra grid layout |
| **Kết quả mong đợi** | 1 cột, cards full-width |
| **Kết quả test thực tế** | — |

### TC_DL_182: Grid 2 columns tablet (768px)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_182 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 768px |
| **Các bước thực hiện** | 1. Kiểm tra grid layout |
| **Kết quả mong đợi** | 2 cột, cards chia đều |
| **Kết quả test thực tế** | — |

### TC_DL_183: Grid 3 columns desktop (1440px)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_183 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra grid layout |
| **Kết quả mong đợi** | 3 hoặc 4 cột |
| **Kết quả test thực tế** | — |

### TC_DL_184: Card width responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_184 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra card width ở 375/768/1440 |
| **Kết quả mong đợi** | Cards adjust width theo grid columns |
| **Kết quả test thực tế** | — |

### TC_DL_185: Card image responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_185 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Card có ảnh |
| **Các bước thực hiện** | 1. Kiểm tra ảnh ở 375/1440 |
| **Kết quả mong đợi** | Ảnh responsive, aspect ratio giữ nguyên |
| **Kết quả test thực tế** | — |

### TC_DL_186: Card content truncation mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_186 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, card có text dài |
| **Các bước thực hiện** | 1. Kiểm tra card content |
| **Kết quả mong đợi** | Description truncated 2-3 dòng |
| **Kết quả test thực tế** | — |

### TC_DL_187: Card content full desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_187 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra card content |
| **Kết quả mong đợi** | Description hiển thị nhiều hơn |
| **Kết quả test thực tế** | — |

### TC_DL_188: Grid gap responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_188 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra gap giữa cards |
| **Kết quả mong đợi** | Gap nhỏ hơn mobile, lớn hơn desktop |
| **Kết quả test thực tế** | — |

### TC_DL_189: Grid → flex transition

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_189 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Resize qua breakpoints |
| **Các bước thực hiện** | 1. Resize và quan sát layout change |
| **Kết quả mong đợi** | Grid columns thay đổi smooth khi resize |
| **Kết quả test thực tế** | — |

### TC_DL_190: Image aspect ratio 16:9 hoặc 4:3

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_190 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Cards có ảnh |
| **Các bước thực hiện** | 1. Kiểm tra aspect ratio |
| **Kết quả mong đợi** | Aspect ratio cố định, ảnh không méo |
| **Kết quả test thực tế** | — |

### TC_DL_191: Card hover elevation desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_191 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Hover chuột lên card |
| **Kết quả mong đợi** | Card có shadow hoặc elevation tăng khi hover |
| **Kết quả test thực tế** | — |

### TC_DL_192: Card tap feedback mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_192 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Tap vào card |
| **Kết quả mong đợi** | Card có tap feedback (opacity change hoặc scale) |
| **Kết quả test thực tế** | — |

### TC_DL_193: Empty state layout mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_193 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, 0 items |
| **Các bước thực hiện** | 1. Kiểm tra empty state |
| **Kết quả mong đợi** | Centered illustration + text + CTA button |
| **Kết quả test thực tế** | — |

### TC_DL_194: Empty state layout desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_194 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, 0 items |
| **Các bước thực hiện** | 1. Kiểm tra empty state |
| **Kết quả mong đợi** | Centered within content area |
| **Kết quả test thực tế** | — |

### TC_DL_195: 0 items grid: empty state hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_195 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 0 items |
| **Các bước thực hiện** | 1. Kiểm tra list |
| **Kết quả mong đợi** | Empty state thay vì empty grid |
| **Kết quả test thực tế** | — |

### TC_DL_196: 1 item grid mobile: centered hoặc left-aligned

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_196 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, 1 item |
| **Các bước thực hiện** | 1. Kiểm tra layout |
| **Kết quả mong đợi** | 1 card hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_DL_197: 10 items grid: hiển thị đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_197 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 10 items |
| **Các bước thực hiện** | 1. Kiểm tra grid ở 375px và 1440px |
| **Kết quả mong đợi** | Grid hiển thị 10 items đúng layout |
| **Kết quả test thực tế** | — |

### TC_DL_198: 50 items grid: performance OK

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_198 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 50 items |
| **Các bước thực hiện** | 1. Scroll qua 50 items |
| **Kết quả mong đợi** | Scroll smooth, không lag |
| **Kết quả test thực tế** | — |

### TC_DL_199: 100 items grid: performance OK

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_199 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 100 items |
| **Các bước thực hiện** | 1. Scroll qua 100 items |
| **Kết quả mong đợi** | Render performance acceptable (<100ms) |
| **Kết quả test thực tế** | — |

### TC_DL_200: Card min-height consistent

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_200 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Cards có content khác nhau |
| **Các bước thực hiện** | 1. Kiểm tra card heights |
| **Kết quả mong đợi** | Cards trong cùng row có min-height consistent |
| **Kết quả test thực tế** | — |

### Nhóm 9: Browser & Platform Compatibility (Tương thích trình duyệt) (TC_DL_201 – TC_DL_210)

### TC_DL_201: Chrome desktop compatible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_201 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Chrome latest, viewport 1440px |
| **Các bước thực hiện** | 1. Mở app trên Chrome desktop<br>2. Test tất cả main features |
| **Kết quả mong đợi** | Tất cả features hoạt động đúng trên Chrome |
| **Kết quả test thực tế** | — |

### TC_DL_202: Safari desktop compatible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_202 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Safari latest, macOS |
| **Các bước thực hiện** | 1. Mở app trên Safari<br>2. Test main features |
| **Kết quả mong đợi** | Layout và features hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DL_203: Firefox desktop compatible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_203 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Firefox latest |
| **Các bước thực hiện** | 1. Mở app trên Firefox<br>2. Test main features |
| **Kết quả mong đợi** | Layout và features hoạt động đúng |
| **Kết quả test thực tế** | — |

### TC_DL_204: Chrome mobile compatible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_204 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Chrome Android |
| **Các bước thực hiện** | 1. Mở app trên Chrome mobile<br>2. Test touch interactions |
| **Kết quả mong đợi** | Touch targets, layout mobile đúng |
| **Kết quả test thực tế** | — |

### TC_DL_205: Safari iOS compatible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_205 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Safari iOS latest |
| **Các bước thực hiện** | 1. Mở app trên Safari iOS<br>2. Test features |
| **Kết quả mong đợi** | Layout đúng, safe area handled, no iOS quirks |
| **Kết quả test thực tế** | — |

### TC_DL_206: Samsung Internet compatible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_206 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Samsung Internet browser |
| **Các bước thực hiện** | 1. Mở app<br>2. Test basic features |
| **Kết quả mong đợi** | Features chính hoạt động |
| **Kết quả test thực tế** | — |

### TC_DL_207: Edge desktop compatible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_207 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Microsoft Edge |
| **Các bước thực hiện** | 1. Mở app<br>2. Test features |
| **Kết quả mong đợi** | Hoạt động đúng (Chromium-based) |
| **Kết quả test thực tế** | — |

### TC_DL_208: Capacitor WebView compatible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_208 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App chạy qua Capacitor |
| **Các bước thực hiện** | 1. Build và chạy trên Android/iOS qua Capacitor |
| **Kết quả mong đợi** | WebView render đúng layout, touch hoạt động |
| **Kết quả test thực tế** | — |

### TC_DL_209: PWA display mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_209 |
| **Loại** | Edge |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | App installed as PWA |
| **Các bước thực hiện** | 1. Install PWA<br>2. Mở từ home screen |
| **Kết quả mong đợi** | Display standalone, không có browser chrome |
| **Kết quả test thực tế** | — |

### TC_DL_210: iOS safe area inset handling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_DL_210 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | iPhone với notch/Dynamic Island |
| **Các bước thực hiện** | 1. Kiểm tra top và bottom safe areas |
| **Kết quả mong đợi** | Content không bị che bởi notch/home indicator |
| **Kết quả test thực tế** | — |

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
- **Giải pháp đề xuất**: Drag dish from list → drop on calendar slot. Drag to rearrange meals.
- **Phần trăm cải thiện**: Planning speed +60%, Desktop engagement +45%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 4: Multi-Panel View
- **Vấn đề hiện tại**: One active panel at a time.
- **Giải pháp đề xuất**: Resizable panels: Calendar + Grocery side by side. User configurable.
- **Phần trăm cải thiện**: Multitasking +60%, Desktop productivity +40%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 5: Desktop Notification Center
- **Vấn đề hiện tại**: Toast notifications disappear. No history.
- **Giải pháp đề xuất**: Notification center in sidebar. History of all actions. Undo from history.
- **Phần trăm cải thiện**: Action reversibility +40%, Awareness +30%
- **Mức độ ưu tiên**: Low | **Effort**: M

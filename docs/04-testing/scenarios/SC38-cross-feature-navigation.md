# Scenario 38: Cross-Feature Navigation

**Version:** 1.0  
**Date:** 2026-06-12  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Cross-Feature Navigation là scenario kiểm thử toàn diện cơ chế điều hướng xuyên suốt ứng dụng Smart Meal Planner. Ứng dụng sử dụng Zustand store (`navigationStore`) để quản lý trạng thái điều hướng gồm: chuyển đổi giữa 5 main tabs (Calendar, Library, AI-Analysis, Fitness, Dashboard), hệ thống page stack với giới hạn tối đa 2 tầng (`MAX_PAGE_STACK_DEPTH = 2`), cơ chế hiển thị/ẩn bottom navigation bar, và lưu trữ/khôi phục vị trí scroll cho từng tab.

Các component tham gia vào luồng điều hướng chính bao gồm: `QuickActionsBar` cung cấp 3 nút thao tác nhanh trên Dashboard (với 9 loại action type: log-weight, log-breakfast/lunch/dinner/meal/snack, start-workout, log-cardio, view-results), `TodaysPlanCard` hiển thị thông tin kế hoạch hôm nay với 4 trạng thái (training-pending, training-completed, rest-day, no-plan) kèm các CTA điều hướng tới WorkoutLogger/WeightLogger/CardioLogger/FitnessOnboarding thông qua `pushPage()`, và `FitnessTab` với 4 sub-tabs (plan, workout, history, progress) cùng onboarding gate và workout mode toggle.

Scenario này tập trung kiểm thử tính nhất quán của state khi chuyển đổi giữa các feature, đảm bảo page stack hoạt động đúng giới hạn, bottom nav ẩn/hiện chính xác, scroll position được bảo toàn, và luồng Android back button tuân thủ quy tắc: đóng page → quay tab trước → thoát app.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| useNavigationStore | src/store/navigationStore.ts | Zustand store quản lý activeTab, pageStack, showBottomNav, tabScrollPositions |
| QuickActionsBar | src/features/dashboard/components/QuickActionsBar.tsx | Thanh thao tác nhanh 3 nút trên Dashboard, dispatch navigation actions |
| useQuickActions | src/features/dashboard/hooks/useQuickActions.ts | Hook cung cấp danh sách actions và handleAction cho QuickActionsBar |
| TodaysPlanCard | src/features/dashboard/components/TodaysPlanCard.tsx | Card kế hoạch hôm nay, 4 trạng thái với CTA pushPage tới các logger |
| useTodaysPlan | src/features/dashboard/hooks/useTodaysPlan.ts | Hook cung cấp dữ liệu kế hoạch hôm nay (state, workout, meals) |
| FitnessTab | src/features/fitness/components/FitnessTab.tsx | Container chính tab Fitness, 4 sub-tabs với onboarding gate |
| FitnessOnboarding | src/features/fitness/components/FitnessOnboarding.tsx | Form onboarding Fitness, target của pushPage từ TodaysPlanCard |
| WorkoutLogger | src/features/fitness/components/WorkoutLogger.tsx | Logger tập luyện strength, target của pushPage từ Dashboard |
| CardioLogger | src/features/fitness/components/CardioLogger.tsx | Logger cardio, target của pushPage từ Dashboard |
| WeightLogger | src/features/fitness/components/WeightLogger.tsx | Logger cân nặng, target của pushPage từ TodaysPlanCard rest-day |
| SubTabBar | src/components/shared/SubTabBar.tsx | Thanh sub-tab navigation dùng chung cho FitnessTab |
| MainTab (type) | src/components/navigation/types.ts | Type union: 'calendar' \| 'library' \| 'ai-analysis' \| 'fitness' \| 'dashboard' |

## Luồng nghiệp vụ

1. Mở app → activeTab mặc định = 'calendar', pageStack = [], showBottomNav = true
2. Click tab trên bottom nav → `navigateTab(tab)` → set activeTab, clear pageStack, show bottomNav
3. Từ Dashboard → QuickActionsBar hiển thị 3 action buttons (left, center, right) → click action → handleAction dispatch navigation tương ứng
4. Từ Dashboard → TodaysPlanCard hiển thị theo state (training-pending/completed/rest-day/no-plan):
   - training-pending: "Bắt đầu" CTA → `pushPage({id: 'workout-logger', component: 'WorkoutLogger'})`
   - rest-day: "Ghi cân nặng" chip → `pushPage({id: 'weight-logger', component: 'WeightLogger'})`, "Ghi cardio" chip → `pushPage({id: 'cardio-logger', component: 'CardioLogger'})`
   - no-plan: "Tạo kế hoạch" CTA → `pushPage({id: 'fitness-onboarding', component: 'FitnessOnboarding'})`
5. pushPage → thêm page vào stack (tối đa 2), ẩn bottomNav
6. Nếu stack đã có 2 page → pushPage thay thế page cuối (không thêm mới)
7. popPage → xóa page cuối khỏi stack; nếu stack rỗng → hiện bottomNav
8. Chuyển tab Fitness → FitnessTab kiểm tra isOnboarded:
   - false → hiển thị FitnessOnboarding thay vì sub-tabs
   - true → hiển thị SubTabBar với 4 sub-tabs, mặc định 'plan'
9. FitnessTab sub-tab workout → toggle Strength/Cardio (radiogroup)
10. handleWorkoutComplete → chuyển sub-tab sang 'history'; handleWorkoutBack → chuyển sang 'plan'
11. Android back button: canGoBack() = true → popPage(); canGoBack() = false → quay tab trước hoặc thoát app

## Quy tắc nghiệp vụ

1. MAX_PAGE_STACK_DEPTH = 2 — pageStack không bao giờ vượt quá 2 phần tử
2. Default activeTab = 'calendar' khi khởi tạo app
3. navigateTab() luôn reset pageStack về [] và set showBottomNav = true
4. pushPage() ẩn bottomNav (showBottomNav = false) ngay khi thêm page đầu tiên
5. pushPage() khi stack.length >= 2: thay thế page cuối bằng page mới (slice(0, -1) + page)
6. popPage() trên stack rỗng: trả về state hiện tại, không thay đổi gì
7. popPage() hiện bottomNav khi stack trở về rỗng (newStack.length === 0)
8. canGoBack() = pageStack.length > 0
9. tabScrollPositions lưu trữ vị trí scroll theo key tab, mặc định 0 nếu chưa có
10. QuickActionsBar luôn render đúng 3 buttons: [left, center, right] từ mảng actions
11. Primary button: height 56px, bg-emerald-500, glow shadow, rounded-full
12. Secondary button: height 48px, white/slate bg, border
13. TodaysPlanCard có 4 trạng thái: training-pending, training-completed, rest-day, no-plan (default)
14. MealsSection hiện "Log [meal]" CTA chỉ khi nextMealToLog tồn tại VÀ hasReachedTarget = false
15. FitnessTab default activeSubTab = 'plan', default workoutMode = 'strength'
16. FitnessTab onboarding gate: !isOnboarded → chỉ render FitnessOnboarding, ẩn toàn bộ sub-tabs
17. Workout mode toggle sử dụng role="radiogroup" với aria-checked trên mỗi radio button
18. Mỗi tab panel sử dụng role="tabpanel" với id="tabpanel-{subTabId}"
19. PageEntry cấu trúc: { id: string, component: string, props?: Record<string, unknown> }
20. Android back button flow: close page (popPage) → quay tab trước → thoát app

## Test Cases (55 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_NAV_01 | Default state khi khởi tạo app: activeTab='calendar', pageStack=[], showBottomNav=true | Positive | P0 |
| TC_NAV_02 | Chuyển tab Calendar → Library qua bottom nav | Positive | P0 |
| TC_NAV_03 | Chuyển tab Library → AI-Analysis qua bottom nav | Positive | P0 |
| TC_NAV_04 | Chuyển tab AI-Analysis → Fitness qua bottom nav | Positive | P0 |
| TC_NAV_05 | Chuyển tab Fitness → Dashboard qua bottom nav | Positive | P0 |
| TC_NAV_06 | Chuyển từ bất kỳ tab nào về Calendar | Positive | P1 |
| TC_NAV_07 | navigateTab reset pageStack về [] khi chuyển tab | Positive | P0 |
| TC_NAV_08 | navigateTab luôn set showBottomNav = true | Positive | P0 |
| TC_NAV_09 | pushPage thêm page vào stack khi stack rỗng | Positive | P0 |
| TC_NAV_10 | pushPage ẩn bottomNav khi thêm page đầu tiên | Positive | P0 |
| TC_NAV_11 | pushPage thêm page thứ 2 vào stack (depth = 2) | Positive | P1 |
| TC_NAV_12 | pushPage khi stack đã đầy (2 page) — thay thế page cuối | Boundary | P0 |
| TC_NAV_13 | popPage xóa page cuối khỏi stack | Positive | P0 |
| TC_NAV_14 | popPage hiện bottomNav khi stack trở về rỗng | Positive | P0 |
| TC_NAV_15 | popPage giữ bottomNav ẩn khi stack còn 1 page | Positive | P1 |
| TC_NAV_16 | popPage trên stack rỗng — không thay đổi state | Negative | P1 |
| TC_NAV_17 | canGoBack() trả về true khi stack có ≥1 page | Positive | P1 |
| TC_NAV_18 | canGoBack() trả về false khi stack rỗng | Positive | P1 |
| TC_NAV_19 | setScrollPosition lưu vị trí scroll cho tab 'calendar' | Positive | P1 |
| TC_NAV_20 | getScrollPosition trả về 0 cho tab chưa lưu | Positive | P1 |
| TC_NAV_21 | Scroll position được khôi phục khi quay lại tab đã scroll | Positive | P1 |
| TC_NAV_22 | Scroll position độc lập giữa các tab khác nhau | Positive | P2 |
| TC_NAV_23 | QuickActionsBar render đúng 3 buttons | Positive | P0 |
| TC_NAV_24 | QuickActionsBar primary button: height 56px, bg-emerald-500, glow shadow | Positive | P1 |
| TC_NAV_25 | QuickActionsBar secondary buttons: height 48px, white/slate bg, border | Positive | P1 |
| TC_NAV_26 | QuickActionsBar accessibility: nav có aria-label, buttons có aria-label, icons aria-hidden | Positive | P1 |
| TC_NAV_27 | QuickActionsBar data-testid đúng format: quick-action-${action.id} | Positive | P2 |
| TC_NAV_28 | QuickActionsBar click action → handleAction dispatch chính xác | Positive | P1 |
| TC_NAV_29 | TodaysPlanCard state training-pending: hiện workout info + "Bắt đầu" CTA | Positive | P0 |
| TC_NAV_30 | TodaysPlanCard "Bắt đầu" CTA → pushPage WorkoutLogger | Positive | P0 |
| TC_NAV_31 | TodaysPlanCard state training-completed: hiện summary (duration, sets, PR) | Positive | P1 |
| TC_NAV_32 | TodaysPlanCard state rest-day: hiện recovery tips + tomorrow preview | Positive | P1 |
| TC_NAV_33 | TodaysPlanCard rest-day "Ghi cân nặng" chip → pushPage WeightLogger | Positive | P0 |
| TC_NAV_34 | TodaysPlanCard rest-day "Ghi cardio" chip → pushPage CardioLogger | Positive | P0 |
| TC_NAV_35 | TodaysPlanCard state no-plan: hiện empty state + "Tạo kế hoạch" CTA | Positive | P1 |
| TC_NAV_36 | TodaysPlanCard "Tạo kế hoạch" CTA → pushPage FitnessOnboarding | Positive | P0 |
| TC_NAV_37 | MealsSection hiện "Log meal" CTA khi nextMealToLog tồn tại và chưa đạt target | Positive | P1 |
| TC_NAV_38 | MealsSection ẩn "Log meal" CTA khi hasReachedTarget = true | Negative | P1 |
| TC_NAV_39 | MealsSection ẩn "Log meal" CTA khi nextMealToLog = undefined | Negative | P1 |
| TC_NAV_40 | Dashboard → pushPage WorkoutLogger → popPage → quay về Dashboard với bottomNav visible | Positive | P0 |
| TC_NAV_41 | Dashboard → pushPage page A → pushPage page B → stack = [A, B], depth = 2 | Positive | P1 |
| TC_NAV_42 | Stack đầy [A, B] → pushPage C → stack = [A, C], B bị thay thế | Boundary | P0 |
| TC_NAV_43 | FitnessTab onboarding gate: !isOnboarded → chỉ hiện FitnessOnboarding | Positive | P1 |
| TC_NAV_44 | FitnessTab sau onboarding: hiện 4 sub-tabs, default 'plan' | Positive | P1 |
| TC_NAV_45 | FitnessTab handleWorkoutComplete → chuyển sang sub-tab 'history' | Positive | P1 |
| TC_NAV_46 | FitnessTab handleWorkoutBack → chuyển sang sub-tab 'plan' | Positive | P1 |
| TC_NAV_47 | FitnessTab workout mode toggle Strength ↔ Cardio | Positive | P1 |
| TC_NAV_48 | Dashboard → Fitness tab transition: navigateTab('fitness') reset state đúng | Positive | P1 |
| TC_NAV_49 | Fitness → Dashboard tab transition: navigateTab('dashboard') reset state đúng | Positive | P1 |
| TC_NAV_50 | Rapid tab switching 20 lần liên tiếp — state nhất quán, không crash | Edge | P1 |
| TC_NAV_51 | Rapid pushPage/popPage 10 lần liên tiếp — stack không vượt MAX_PAGE_STACK_DEPTH | Edge | P1 |
| TC_NAV_52 | Android back button: page stack có page → popPage đóng page trên cùng | Positive | P0 |
| TC_NAV_53 | Android back button: page stack rỗng → quay về tab trước đó | Positive | P1 |
| TC_NAV_54 | Android back button: tab Calendar + stack rỗng → thoát app | Positive | P1 |
| TC_NAV_55 | Deep link vào page cụ thể → pushPage đúng component, popPage quay về tab gốc | Edge | P2 |
| TC_NAV_56 | Click tab Calendar → content Calendar hiển thị | Positive | P0 |
| TC_NAV_57 | Click tab Library → content Library hiển thị | Positive | P0 |
| TC_NAV_58 | Click tab AI-Analysis → content AI-Analysis hiển thị | Positive | P0 |
| TC_NAV_59 | Click tab Fitness → content Fitness hiển thị | Positive | P0 |
| TC_NAV_60 | Click tab Dashboard → content Dashboard hiển thị | Positive | P0 |
| TC_NAV_61 | Tab switch Calendar→Library: Calendar ẩn, Library hiện | Positive | P0 |
| TC_NAV_62 | Tab switch Calendar→AI-Analysis: đúng content | Positive | P0 |
| TC_NAV_63 | Tab switch Calendar→Fitness: đúng content | Positive | P0 |
| TC_NAV_64 | Tab switch Calendar→Dashboard: đúng content | Positive | P0 |
| TC_NAV_65 | Tab switch Library→Calendar: quay lại Calendar | Positive | P0 |
| TC_NAV_66 | Tab switch Library→AI-Analysis: đúng content | Positive | P1 |
| TC_NAV_67 | Tab switch Library→Fitness: đúng content | Positive | P1 |
| TC_NAV_68 | Tab switch Library→Dashboard: đúng content | Positive | P1 |
| TC_NAV_69 | Tab switch AI-Analysis→Calendar: đúng content | Positive | P1 |
| TC_NAV_70 | Tab switch AI-Analysis→Library: đúng content | Positive | P1 |
| TC_NAV_71 | Tab switch AI-Analysis→Fitness: đúng content | Positive | P1 |
| TC_NAV_72 | Tab switch AI-Analysis→Dashboard: đúng content | Positive | P1 |
| TC_NAV_73 | Tab switch Fitness→Calendar: đúng content | Positive | P1 |
| TC_NAV_74 | Tab switch Fitness→Library: đúng content | Positive | P1 |
| TC_NAV_75 | Tab switch Fitness→AI-Analysis: đúng content | Positive | P1 |
| TC_NAV_76 | Tab switch Fitness→Dashboard: đúng content | Positive | P1 |
| TC_NAV_77 | Tab switch Dashboard→Calendar: đúng content | Positive | P1 |
| TC_NAV_78 | Tab switch Dashboard→Library: đúng content | Positive | P1 |
| TC_NAV_79 | Tab switch Dashboard→AI-Analysis: đúng content | Positive | P1 |
| TC_NAV_80 | Tab switch Dashboard→Fitness: đúng content | Positive | P1 |
| TC_NAV_81 | Rapid tab switch 1→2→3→4→5→1 trong < 2 giây | Edge | P0 |
| TC_NAV_82 | Rapid tab switch 10 lần liên tiếp → state nhất quán | Edge | P1 |
| TC_NAV_83 | Tab switch 50 lần → không memory leak | Performance | P2 |
| TC_NAV_84 | Active tab indicator: Calendar active → Calendar tab highlighted | Positive | P0 |
| TC_NAV_85 | Active tab indicator: Library active → Library tab highlighted | Positive | P0 |
| TC_NAV_86 | Active tab indicator: AI-Analysis active → đúng tab highlighted | Positive | P0 |
| TC_NAV_87 | Active tab indicator: Fitness active → đúng tab highlighted | Positive | P0 |
| TC_NAV_88 | Active tab indicator: Dashboard active → đúng tab highlighted | Positive | P0 |
| TC_NAV_89 | Chỉ 1 tab active tại mọi thời điểm | Positive | P0 |
| TC_NAV_90 | Tab switch không tạo console error/warning | Positive | P0 |
| TC_NAV_91 | Calendar state preserved: scroll position giữ nguyên sau switch away/back | Positive | P0 |
| TC_NAV_92 | Library state preserved: scroll position giữ nguyên | Positive | P0 |
| TC_NAV_93 | AI-Analysis state preserved: scroll position giữ nguyên | Positive | P1 |
| TC_NAV_94 | Fitness state preserved: scroll position giữ nguyên | Positive | P1 |
| TC_NAV_95 | Dashboard state preserved: scroll position giữ nguyên | Positive | P1 |
| TC_NAV_96 | setScrollPosition lưu đúng giá trị cho mỗi tab | Positive | P0 |
| TC_NAV_97 | getScrollPosition trả về 0 cho tab chưa scroll | Positive | P1 |
| TC_NAV_98 | getScrollPosition trả về giá trị đã lưu cho tab đã scroll | Positive | P0 |
| TC_NAV_99 | Dashboard→Fitness→Dashboard: Dashboard state intact | Positive | P0 |
| TC_NAV_100 | Calendar→Library→Calendar: Calendar state intact | Positive | P0 |
| TC_NAV_101 | pushPage thêm 1 page → pageStack.length = 1 | Positive | P0 |
| TC_NAV_102 | pushPage thêm 2 pages → pageStack.length = 2 | Positive | P0 |
| TC_NAV_103 | pushPage khi stack đã có 2 pages → thay thế page cuối (length vẫn = 2) | Boundary | P0 |
| TC_NAV_104 | pushPage: showBottomNav chuyển false khi thêm page đầu tiên | Positive | P0 |
| TC_NAV_105 | pushPage: bottom nav ẩn khi có bất kỳ page nào trong stack | Positive | P0 |
| TC_NAV_106 | popPage: xóa page cuối → pageStack giảm 1 | Positive | P0 |
| TC_NAV_107 | popPage: stack từ 2→1, showBottomNav vẫn false | Positive | P0 |
| TC_NAV_108 | popPage: stack từ 1→0, showBottomNav chuyển true | Positive | P0 |
| TC_NAV_109 | popPage trên stack rỗng → state không thay đổi | Boundary | P0 |
| TC_NAV_110 | canGoBack() = true khi stack có 1 page | Positive | P0 |
| TC_NAV_111 | canGoBack() = true khi stack có 2 pages | Positive | P0 |
| TC_NAV_112 | canGoBack() = false khi stack rỗng | Positive | P0 |
| TC_NAV_113 | navigateTab reset pageStack về [] | Positive | P0 |
| TC_NAV_114 | navigateTab set showBottomNav = true | Positive | P0 |
| TC_NAV_115 | pushPage với id='workout-logger', component='WorkoutLogger' | Positive | P0 |
| TC_NAV_116 | pushPage với id='weight-logger', component='WeightLogger' | Positive | P0 |
| TC_NAV_117 | pushPage với id='cardio-logger', component='CardioLogger' | Positive | P1 |
| TC_NAV_118 | pushPage với id='fitness-onboarding', component='FitnessOnboarding' | Positive | P1 |
| TC_NAV_119 | pushPage với props: {workoutId: 'abc123'} | Positive | P1 |
| TC_NAV_120 | Page stack overflow protection: pushPage lần 3 thay thế lần 2 | Boundary | P0 |
| TC_NAV_121 | QuickActionsBar render đúng 3 buttons (left, center, right) | Positive | P0 |
| TC_NAV_122 | Primary button (center) có bg-emerald-500 và height 56px | Positive | P1 |
| TC_NAV_123 | Secondary buttons có white/slate bg và height 48px | Positive | P1 |
| TC_NAV_124 | Primary button có glow shadow effect | Positive | P2 |
| TC_NAV_125 | QuickAction 'log-weight' → pushPage WeightLogger | Positive | P0 |
| TC_NAV_126 | QuickAction 'start-workout' → pushPage WorkoutLogger | Positive | P0 |
| TC_NAV_127 | QuickAction 'log-breakfast' → navigate Calendar tab và log breakfast | Positive | P0 |
| TC_NAV_128 | QuickAction 'log-lunch' → navigate Calendar và log lunch | Positive | P1 |
| TC_NAV_129 | QuickAction 'log-dinner' → navigate Calendar và log dinner | Positive | P1 |
| TC_NAV_130 | QuickAction 'log-meal' → navigate Calendar và log meal | Positive | P1 |
| TC_NAV_131 | QuickAction 'log-snack' → navigate Calendar và log snack | Positive | P1 |
| TC_NAV_132 | QuickAction 'log-cardio' → pushPage CardioLogger | Positive | P1 |
| TC_NAV_133 | QuickAction 'view-results' → navigate phù hợp | Positive | P1 |
| TC_NAV_134 | QuickActionsBar aria-label đúng i18n key | Positive | P1 |
| TC_NAV_135 | Mỗi action button có aria-label từ i18n | Positive | P1 |
| TC_NAV_136 | Action button icons có aria-hidden='true' | Positive | P1 |
| TC_NAV_137 | Click action button → bottom nav ẩn (vì pushPage) | Positive | P0 |
| TC_NAV_138 | QuickActionsBar: icon mapping đúng cho mỗi action type | Positive | P1 |
| TC_NAV_139 | QuickActionsBar: 3 actions từ useQuickActions hook | Positive | P1 |
| TC_NAV_140 | QuickActionsBar: primary action (isPrimary=true) ở vị trí center | Positive | P1 |
| TC_NAV_141 | TodaysPlanCard state='training-pending': CTA 'Bắt đầu' hiển thị | Positive | P0 |
| TC_NAV_142 | TodaysPlanCard 'Bắt đầu' CTA → pushPage WorkoutLogger | Positive | P0 |
| TC_NAV_143 | TodaysPlanCard state='training-completed': summary hiển thị | Positive | P0 |
| TC_NAV_144 | TodaysPlanCard state='rest-day': recovery tips hiển thị | Positive | P0 |
| TC_NAV_145 | TodaysPlanCard rest-day: 'Ghi cân nặng' chip → pushPage WeightLogger | Positive | P0 |
| TC_NAV_146 | TodaysPlanCard rest-day: 'Ghi cardio' chip → pushPage CardioLogger | Positive | P1 |
| TC_NAV_147 | TodaysPlanCard state='no-plan': empty state với 'Tạo kế hoạch' | Positive | P0 |
| TC_NAV_148 | TodaysPlanCard 'Tạo kế hoạch' → pushPage FitnessOnboarding | Positive | P0 |
| TC_NAV_149 | TodaysPlanCard training-pending: MealsSection hiển thị progress | Positive | P1 |
| TC_NAV_150 | TodaysPlanCard MealsSection: 'Log bữa sáng' CTA khi nextMealToLog='breakfast' | Positive | P1 |
| TC_NAV_151 | TodaysPlanCard MealsSection: 'Log bữa trưa' CTA khi nextMealToLog='lunch' | Positive | P1 |
| TC_NAV_152 | TodaysPlanCard MealsSection: 'Log bữa tối' CTA khi nextMealToLog='dinner' | Positive | P1 |
| TC_NAV_153 | TodaysPlanCard MealsSection ẩn CTA khi hasReachedTarget=true | Negative | P1 |
| TC_NAV_154 | TodaysPlanCard MealsSection ẩn CTA khi nextMealToLog=null | Negative | P1 |
| TC_NAV_155 | TodaysPlanCard rest-day: hiển thị tomorrow preview | Positive | P2 |
| TC_NAV_156 | TodaysPlanCard training-completed: hiển thị duration, sets, PR flag | Positive | P1 |
| TC_NAV_157 | TodaysPlanCard training-completed + PR: PR badge hiển thị | Positive | P1 |
| TC_NAV_158 | TodaysPlanCard icons đều có aria-hidden='true' | Positive | P1 |
| TC_NAV_159 | TodaysPlanCard: semantic h3 title | Positive | P1 |
| TC_NAV_160 | TodaysPlanCard: không crash khi useTodaysPlan trả về null data | Negative | P1 |
| TC_NAV_161 | FitnessTab default activeSubTab = 'plan' | Positive | P0 |
| TC_NAV_162 | FitnessTab sub-tab switch: plan → workout | Positive | P0 |
| TC_NAV_163 | FitnessTab sub-tab switch: workout → history | Positive | P0 |
| TC_NAV_164 | FitnessTab sub-tab switch: history → progress | Positive | P0 |
| TC_NAV_165 | FitnessTab sub-tab switch: progress → plan | Positive | P0 |
| TC_NAV_166 | FitnessTab: 4 sub-tabs render đúng | Positive | P0 |
| TC_NAV_167 | FitnessTab onboarding gate: !isOnboarded → chỉ render FitnessOnboarding | Positive | P0 |
| TC_NAV_168 | FitnessTab onboarding gate: isOnboarded → render SubTabBar + panels | Positive | P0 |
| TC_NAV_169 | FitnessTab workout mode default = 'strength' | Positive | P0 |
| TC_NAV_170 | FitnessTab workout mode toggle: strength → cardio | Positive | P0 |
| TC_NAV_171 | FitnessTab workout mode toggle: cardio → strength | Positive | P0 |
| TC_NAV_172 | FitnessTab handleWorkoutComplete → sub-tab chuyển sang 'history' | Positive | P0 |
| TC_NAV_173 | FitnessTab handleWorkoutBack → sub-tab chuyển sang 'plan' | Positive | P0 |
| TC_NAV_174 | FitnessTab role='tabpanel' trên mỗi tab content area | Positive | P0 |
| TC_NAV_175 | FitnessTab role='radiogroup' trên workout mode toggle | Positive | P0 |
| TC_NAV_176 | FitnessTab role='radio' trên mỗi mode option | Positive | P1 |
| TC_NAV_177 | FitnessTab aria-checked đúng trên radio buttons | Positive | P1 |
| TC_NAV_178 | FitnessTab tabpanel id='tabpanel-{subTabId}' format đúng | Positive | P1 |
| TC_NAV_179 | FitnessTab: onboarding complete → chuyển từ onboarding sang sub-tabs | Positive | P0 |
| TC_NAV_180 | FitnessTab: giữ sub-tab state khi switch main tab away và back | Positive | P1 |
| TC_NAV_181 | Dashboard → QuickAction start-workout → WorkoutLogger → popPage → Dashboard | Positive | P0 |
| TC_NAV_182 | Dashboard → TodaysPlanCard → WeightLogger → popPage → Dashboard | Positive | P0 |
| TC_NAV_183 | Dashboard → pushPage WorkoutLogger → navigateTab Fitness → pageStack cleared | Positive | P0 |
| TC_NAV_184 | Dashboard action → Fitness sub-tab workout → complete → history sub-tab | Positive | P1 |
| TC_NAV_185 | Calendar → Library → Calendar: scroll position restored | Positive | P0 |
| TC_NAV_186 | Settings page: open from header → pushPage → close → return to previous tab | Positive | P1 |
| TC_NAV_187 | Deep nav: Dashboard → WorkoutLogger → SetEditor (2 deep) → popPage → WorkoutLogger | Positive | P1 |
| TC_NAV_188 | Deep nav: pushPage 3 lần → stack vẫn chỉ có 2 pages | Boundary | P0 |
| TC_NAV_189 | navigateTab trong khi page stack có pages → stack cleared | Positive | P0 |
| TC_NAV_190 | Page stack: pushPage A → pushPage B → popPage → A còn trong stack | Positive | P0 |
| TC_NAV_191 | Page stack: pushPage A → pushPage B → pushPage C → B replaced by C | Boundary | P1 |
| TC_NAV_192 | Navigation timing: tab switch < 100ms (Performance) | Performance | P1 |
| TC_NAV_193 | Navigation: không có console errors sau 20 tab switches | Positive | P1 |
| TC_NAV_194 | URL không thay đổi khi navigate (no react-router) | Positive | P1 |
| TC_NAV_195 | URL stays at / hoặc base path sau mọi navigation | Positive | P1 |
| TC_NAV_196 | Android back: page stack 2 pages → popPage → stack 1 page | Positive | P0 |
| TC_NAV_197 | Android back: page stack 1 page → popPage → stack 0, bottomNav hiện | Positive | P0 |
| TC_NAV_198 | Android back: stack rỗng, activeTab='dashboard' → quay tab trước | Positive | P1 |
| TC_NAV_199 | Android back: stack rỗng, activeTab='fitness' → quay tab trước | Positive | P1 |
| TC_NAV_200 | Android back: stack rỗng, activeTab='calendar' → thoát app | Positive | P0 |
| TC_NAV_201 | Android back nhanh 5 lần liên tiếp → state đúng | Edge | P1 |
| TC_NAV_202 | Focus management: sau pushPage, focus di chuyển tới page mới | Positive | P1 |
| TC_NAV_203 | Focus management: sau popPage, focus quay lại tab content | Positive | P1 |
| TC_NAV_204 | Focus management: sau navigateTab, focus di chuyển tới tab content mới | Positive | P1 |
| TC_NAV_205 | Bottom nav hiển thị 5 tab icons/labels | Positive | P0 |
| TC_NAV_206 | Bottom nav ẩn hoàn toàn khi page stack không rỗng | Positive | P0 |
| TC_NAV_207 | Bottom nav hiện lại animation smooth khi stack trở về rỗng | Positive | P2 |
| TC_NAV_208 | Tab switch giữa 5 tabs: mỗi tab render đúng component chính | Positive | P0 |
| TC_NAV_209 | PageEntry structure: id, component, props optional | Positive | P1 |
| TC_NAV_210 | navigateTab với giá trị invalid (not in MainTab type) → ignored/error | Negative | P2 |

---

## Chi tiết Test Cases

##### TC_NAV_01: Default state khi khởi tạo app
- **Pre-conditions**: App vừa được khởi tạo lần đầu, chưa có bất kỳ thao tác điều hướng nào
- **Steps**:
  1. Mở app tại localhost:3000
  2. Kiểm tra state của useNavigationStore
- **Expected Result**: activeTab = 'calendar', pageStack = [] (mảng rỗng), showBottomNav = true, tabScrollPositions = {} (object rỗng). Bottom navigation bar hiển thị đầy đủ 5 tabs (Calendar, Library, AI-Analysis, Fitness, Dashboard) với tab Calendar đang active
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_02: Chuyển tab Calendar → Library qua bottom nav
- **Pre-conditions**: App đang ở tab Calendar (default), bottom nav hiển thị
- **Steps**:
  1. Click vào icon/label "Library" trên bottom navigation bar
  2. Quan sát state thay đổi trong store
- **Expected Result**: activeTab = 'library', pageStack = [] (không thay đổi vì đã rỗng), showBottomNav = true. Nội dung Library tab hiển thị, Calendar tab bị ẩn. Tab Library trên bottom nav có trạng thái active (highlight)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_03: Chuyển tab Library → AI-Analysis qua bottom nav
- **Pre-conditions**: activeTab = 'library', bottom nav hiển thị
- **Steps**:
  1. Click vào icon/label "AI-Analysis" trên bottom navigation bar
  2. Quan sát state thay đổi
- **Expected Result**: activeTab = 'ai-analysis', pageStack = [], showBottomNav = true. Nội dung AI-Analysis tab render, Library tab bị ẩn. Icon AI-Analysis trên bottom nav active
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_04: Chuyển tab AI-Analysis → Fitness qua bottom nav
- **Pre-conditions**: activeTab = 'ai-analysis', bottom nav hiển thị
- **Steps**:
  1. Click vào icon/label "Fitness" trên bottom navigation bar
  2. Quan sát state thay đổi và nội dung render
- **Expected Result**: activeTab = 'fitness', pageStack = [], showBottomNav = true. FitnessTab component render (hiện FitnessOnboarding nếu !isOnboarded, hoặc sub-tabs nếu isOnboarded). Tab Fitness trên bottom nav active
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_05: Chuyển tab Fitness → Dashboard qua bottom nav
- **Pre-conditions**: activeTab = 'fitness', bottom nav hiển thị
- **Steps**:
  1. Click vào icon/label "Dashboard" trên bottom navigation bar
  2. Quan sát state thay đổi và nội dung render
- **Expected Result**: activeTab = 'dashboard', pageStack = [], showBottomNav = true. Dashboard hiển thị với QuickActionsBar và TodaysPlanCard. Tab Dashboard trên bottom nav active
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_06: Chuyển từ bất kỳ tab nào về Calendar
- **Pre-conditions**: activeTab = 'dashboard' (hoặc bất kỳ tab nào khác calendar)
- **Steps**:
  1. Click vào icon/label "Calendar" trên bottom navigation bar
  2. Quan sát state thay đổi
  3. Lặp lại từ các tab Library, AI-Analysis, Fitness
- **Expected Result**: Từ mọi tab, click Calendar đều chuyển activeTab = 'calendar', pageStack = [], showBottomNav = true. Nội dung Calendar hiển thị đúng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_07: navigateTab reset pageStack về [] khi chuyển tab
- **Pre-conditions**: activeTab = 'dashboard', pageStack có 1 page (ví dụ: đã pushPage WorkoutLogger)
- **Steps**:
  1. Từ Dashboard, pushPage({id: 'workout-logger', component: 'WorkoutLogger'}) → pageStack = [{id: 'workout-logger', ...}]
  2. Click tab "Calendar" trên bottom nav (nếu visible) hoặc gọi navigateTab('calendar')
  3. Kiểm tra state
- **Expected Result**: activeTab = 'calendar', pageStack = [] (đã bị clear hoàn toàn), showBottomNav = true. Page WorkoutLogger không còn trong stack
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_08: navigateTab luôn set showBottomNav = true
- **Pre-conditions**: showBottomNav = false (do đã pushPage trước đó), pageStack có 1+ page
- **Steps**:
  1. pushPage bất kỳ → xác nhận showBottomNav = false
  2. Gọi navigateTab('library')
  3. Kiểm tra showBottomNav
- **Expected Result**: showBottomNav = true sau khi navigateTab, bất kể trạng thái trước đó là gì. Bottom navigation bar hiển thị trở lại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_09: pushPage thêm page vào stack khi stack rỗng
- **Pre-conditions**: pageStack = [], showBottomNav = true, activeTab = 'dashboard'
- **Steps**:
  1. Gọi pushPage({id: 'workout-logger', component: 'WorkoutLogger'})
  2. Kiểm tra pageStack
- **Expected Result**: pageStack = [{id: 'workout-logger', component: 'WorkoutLogger'}], pageStack.length = 1. Page WorkoutLogger được render trong overlay/page container
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_10: pushPage ẩn bottomNav khi thêm page đầu tiên
- **Pre-conditions**: pageStack = [], showBottomNav = true
- **Steps**:
  1. Gọi pushPage({id: 'weight-logger', component: 'WeightLogger'})
  2. Kiểm tra showBottomNav
- **Expected Result**: showBottomNav = false. Bottom navigation bar bị ẩn hoàn toàn khỏi viewport. Khu vực hiển thị mở rộng toàn màn hình cho page WeightLogger
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_11: pushPage thêm page thứ 2 vào stack (depth = 2)
- **Pre-conditions**: pageStack = [{id: 'workout-logger', component: 'WorkoutLogger'}], pageStack.length = 1
- **Steps**:
  1. Gọi pushPage({id: 'weight-logger', component: 'WeightLogger'})
  2. Kiểm tra pageStack
- **Expected Result**: pageStack = [{id: 'workout-logger', component: 'WorkoutLogger'}, {id: 'weight-logger', component: 'WeightLogger'}], pageStack.length = 2. Page WeightLogger render ở trên cùng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_12: pushPage khi stack đã đầy (2 page) — thay thế page cuối
- **Pre-conditions**: pageStack = [{id: 'page-a', component: 'ComponentA'}, {id: 'page-b', component: 'ComponentB'}], pageStack.length = 2
- **Steps**:
  1. Gọi pushPage({id: 'page-c', component: 'ComponentC'})
  2. Kiểm tra pageStack
- **Expected Result**: pageStack = [{id: 'page-a', component: 'ComponentA'}, {id: 'page-c', component: 'ComponentC'}], pageStack.length vẫn = 2. Page B bị thay thế bởi Page C. showBottomNav vẫn = false. Stack không bao giờ vượt quá MAX_PAGE_STACK_DEPTH = 2
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_NAV_13: popPage xóa page cuối khỏi stack
- **Pre-conditions**: pageStack = [{id: 'page-a', component: 'A'}, {id: 'page-b', component: 'B'}], pageStack.length = 2
- **Steps**:
  1. Gọi popPage()
  2. Kiểm tra pageStack
- **Expected Result**: pageStack = [{id: 'page-a', component: 'A'}], pageStack.length = 1. Page B bị xóa, Page A hiển thị. showBottomNav vẫn = false (vì stack chưa rỗng)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_14: popPage hiện bottomNav khi stack trở về rỗng
- **Pre-conditions**: pageStack = [{id: 'page-a', component: 'A'}], pageStack.length = 1, showBottomNav = false
- **Steps**:
  1. Gọi popPage()
  2. Kiểm tra showBottomNav và pageStack
- **Expected Result**: pageStack = [], showBottomNav = true. Bottom navigation bar hiển thị trở lại. Nội dung tab hiện tại (activeTab) render thay vì page overlay
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_15: popPage giữ bottomNav ẩn khi stack còn 1 page
- **Pre-conditions**: pageStack = [{id: 'a', component: 'A'}, {id: 'b', component: 'B'}], pageStack.length = 2
- **Steps**:
  1. Gọi popPage()
  2. Kiểm tra showBottomNav
- **Expected Result**: pageStack.length = 1, showBottomNav = false. Bottom nav vẫn ẩn vì còn page trong stack. newStack.length > 0 nên điều kiện hiện bottomNav chưa thỏa mãn
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_16: popPage trên stack rỗng — không thay đổi state
- **Pre-conditions**: pageStack = [], showBottomNav = true
- **Steps**:
  1. Gọi popPage()
  2. Kiểm tra toàn bộ state
- **Expected Result**: State không thay đổi: pageStack = [], showBottomNav = true, activeTab giữ nguyên. Không có lỗi, exception hay warning trong console. Hàm trả về state hiện tại (return state)
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_NAV_17: canGoBack() trả về true khi stack có ≥1 page
- **Pre-conditions**: pageStack có 1 hoặc 2 page
- **Steps**:
  1. pushPage 1 page → kiểm tra canGoBack()
  2. pushPage thêm 1 page → kiểm tra canGoBack()
- **Expected Result**: canGoBack() = true trong cả 2 trường hợp. Giá trị dựa trên pageStack.length > 0
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_18: canGoBack() trả về false khi stack rỗng
- **Pre-conditions**: pageStack = []
- **Steps**:
  1. Kiểm tra canGoBack() khi stack rỗng
  2. pushPage rồi popPage → kiểm tra canGoBack() lần nữa
- **Expected Result**: canGoBack() = false trong cả 2 trường hợp (stack rỗng ban đầu và sau khi pop hết). pageStack.length = 0
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_19: setScrollPosition lưu vị trí scroll cho tab 'calendar'
- **Pre-conditions**: tabScrollPositions = {} (object rỗng)
- **Steps**:
  1. Gọi setScrollPosition('calendar', 350)
  2. Kiểm tra tabScrollPositions
  3. Gọi getScrollPosition('calendar')
- **Expected Result**: tabScrollPositions = { calendar: 350 }. getScrollPosition('calendar') trả về 350. Giá trị được persist trong store
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_20: getScrollPosition trả về 0 cho tab chưa lưu
- **Pre-conditions**: tabScrollPositions = {} hoặc không chứa key 'library'
- **Steps**:
  1. Gọi getScrollPosition('library')
  2. Quan sát giá trị trả về
- **Expected Result**: Trả về 0 (giá trị mặc định). Sử dụng nullish coalescing: `tabScrollPositions[tab] ?? 0`. Không throw error, không trả về undefined
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_21: Scroll position được khôi phục khi quay lại tab đã scroll
- **Pre-conditions**: Tab calendar đã scroll xuống vị trí 500px và đã gọi setScrollPosition('calendar', 500)
- **Steps**:
  1. Từ tab Calendar (đã scroll 500px), chuyển sang tab Library
  2. Scroll Library xuống 200px → setScrollPosition('library', 200)
  3. Chuyển lại tab Calendar
  4. Gọi getScrollPosition('calendar')
- **Expected Result**: getScrollPosition('calendar') = 500 (vị trí cũ được bảo toàn). getScrollPosition('library') = 200. Mỗi tab giữ vị trí scroll độc lập
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_22: Scroll position độc lập giữa các tab khác nhau
- **Pre-conditions**: App mới khởi tạo, tất cả scroll positions = 0
- **Steps**:
  1. setScrollPosition('calendar', 100)
  2. setScrollPosition('library', 200)
  3. setScrollPosition('fitness', 300)
  4. setScrollPosition('dashboard', 400)
  5. setScrollPosition('ai-analysis', 500)
  6. Kiểm tra từng giá trị
- **Expected Result**: Mỗi tab có scroll position riêng: calendar=100, library=200, fitness=300, dashboard=400, ai-analysis=500. Các giá trị không ảnh hưởng lẫn nhau. tabScrollPositions chứa đúng 5 keys
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_NAV_23: QuickActionsBar render đúng 3 buttons
- **Pre-conditions**: activeTab = 'dashboard', Dashboard đang hiển thị, useQuickActions() trả về actions array với 3 phần tử
- **Steps**:
  1. Mở tab Dashboard
  2. Tìm element với data-testid="quick-actions-bar"
  3. Đếm số button con trong nav element
- **Expected Result**: QuickActionsBar render đúng 3 buttons: [left, center, right]. Element `<nav>` với data-testid="quick-actions-bar" chứa chính xác 3 `<button>`. Mỗi button có data-testid="quick-action-${action.id}", aria-label, và icon với aria-hidden="true"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_24: QuickActionsBar primary button: height 56px, bg-emerald-500, glow shadow
- **Pre-conditions**: Dashboard hiển thị, QuickActionsBar render, center action có isPrimary = true
- **Steps**:
  1. Xác định primary button (isPrimary = true) trong QuickActionsBar
  2. Kiểm tra computed styles
- **Expected Result**: Primary button có height = 56px, background-color tương ứng bg-emerald-500 (#10b981), boxShadow = 'var(--shadow-glow)', class chứa 'rounded-full bg-emerald-500'. Icon bên trong có size = 24px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_25: QuickActionsBar secondary buttons: height 48px, white/slate bg, border
- **Pre-conditions**: Dashboard hiển thị, QuickActionsBar render, left và right actions có isPrimary = false
- **Steps**:
  1. Xác định 2 secondary buttons trong QuickActionsBar
  2. Kiểm tra computed styles
- **Expected Result**: Secondary buttons có height = 48px, class chứa 'border border-gray-200 bg-white' (light mode) hoặc 'dark:border-slate-600 dark:bg-slate-800' (dark mode). Icon bên trong có size = 20px. Text color emerald-600 (light) hoặc emerald-400 (dark)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_26: QuickActionsBar accessibility: nav có aria-label, buttons có aria-label, icons aria-hidden
- **Pre-conditions**: Dashboard hiển thị, QuickActionsBar render
- **Steps**:
  1. Kiểm tra `<nav>` element có aria-label
  2. Kiểm tra mỗi button có aria-label
  3. Kiểm tra mỗi icon (SVG) có aria-hidden="true"
- **Expected Result**: `<nav aria-label={t('quickActions.ariaLabel')}>` present. Mỗi `<button>` có aria-label={t(action.label)}. Tất cả icon elements có aria-hidden="true". Không có accessibility warning trong DevTools audit
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_27: QuickActionsBar data-testid đúng format: quick-action-${action.id}
- **Pre-conditions**: Dashboard hiển thị, QuickActionsBar render với 3 actions
- **Steps**:
  1. Kiểm tra data-testid trên container: "quick-actions-bar"
  2. Kiểm tra data-testid trên mỗi button: format "quick-action-{actionId}"
  3. Thử query bằng các testid cụ thể (ví dụ: quick-action-log-weight, quick-action-start-workout)
- **Expected Result**: Container có data-testid="quick-actions-bar". Mỗi button có data-testid="quick-action-${action.id}" chính xác. Có thể query thành công bằng các test ID này trong test framework
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_NAV_28: QuickActionsBar click action → handleAction dispatch chính xác
- **Pre-conditions**: Dashboard hiển thị, QuickActionsBar render, handleAction function được bind
- **Steps**:
  1. Click vào primary action button (center)
  2. Quan sát handleAction được gọi với đúng action object
  3. Kiểm tra navigation state thay đổi tương ứng với action type
- **Expected Result**: handleAction được gọi 1 lần với đúng QuickAction object tương ứng button đã click. Navigation dispatch chính xác (ví dụ: start-workout → pushPage WorkoutLogger, log-weight → pushPage WeightLogger). Không có double-dispatch hay race condition
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_29: TodaysPlanCard state training-pending: hiện workout info + "Bắt đầu" CTA
- **Pre-conditions**: useTodaysPlan() trả về data.state = 'training-pending', data.workoutType và data.exerciseCount có giá trị
- **Steps**:
  1. Mở Dashboard
  2. Tìm element data-testid="todays-plan-card"
  3. Kiểm tra nội dung workout-section và meals-section
- **Expected Result**: Card hiển thị với data-testid="todays-plan-card". Workout section (data-testid="workout-section") hiện: workout-name, exercise-count, và nút "Bắt đầu" (data-testid="start-workout-cta") với icon Play. Meals section (data-testid="meals-section") hiện meal progress
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_30: TodaysPlanCard "Bắt đầu" CTA → pushPage WorkoutLogger
- **Pre-conditions**: TodaysPlanCard đang ở state training-pending, pageStack = []
- **Steps**:
  1. Click nút "Bắt đầu" (data-testid="start-workout-cta")
  2. Kiểm tra pageStack trong navigation store
- **Expected Result**: pushPage được gọi với {id: 'workout-logger', component: 'WorkoutLogger'}. pageStack = [{id: 'workout-logger', component: 'WorkoutLogger'}]. showBottomNav = false. WorkoutLogger component render
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_31: TodaysPlanCard state training-completed: hiện summary (duration, sets, PR)
- **Pre-conditions**: useTodaysPlan() trả về data.state = 'training-completed', data.completedWorkout có durationMin, totalSets, hasPR = true
- **Steps**:
  1. Mở Dashboard
  2. Tìm data-testid="todays-plan-card"
  3. Kiểm tra workout-summary section
- **Expected Result**: Card hiển thị section data-testid="workout-summary" với icon CheckCircle (emerald). Hiện: data-testid="workout-duration" với số phút, data-testid="workout-sets" với tổng sets, data-testid="pr-highlight" (badge amber) khi hasPR = true. Meals section hiện bên cạnh
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_32: TodaysPlanCard state rest-day: hiện recovery tips + tomorrow preview
- **Pre-conditions**: useTodaysPlan() trả về data.state = 'rest-day', data.tomorrowWorkoutType có giá trị
- **Steps**:
  1. Mở Dashboard
  2. Tìm data-testid="todays-plan-card"
  3. Kiểm tra recovery-tips và tomorrow-preview sections
- **Expected Result**: Card hiển thị title "rest day". data-testid="recovery-tips" hiện 2 recovery tips (🚶 và 💧). data-testid="tomorrow-preview" hiện tên workout ngày mai + số exercises. Quick actions area (data-testid="quick-actions") hiện 2 chips: log-weight-chip và log-cardio-chip
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_33: TodaysPlanCard rest-day "Ghi cân nặng" chip → pushPage WeightLogger
- **Pre-conditions**: TodaysPlanCard state = 'rest-day', pageStack = []
- **Steps**:
  1. Click chip "Ghi cân nặng" (data-testid="log-weight-chip")
  2. Kiểm tra pageStack
- **Expected Result**: pushPage được gọi với {id: 'weight-logger', component: 'WeightLogger'}. pageStack = [{id: 'weight-logger', component: 'WeightLogger'}]. showBottomNav = false. WeightLogger component render toàn màn hình
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_34: TodaysPlanCard rest-day "Ghi cardio" chip → pushPage CardioLogger
- **Pre-conditions**: TodaysPlanCard state = 'rest-day', pageStack = []
- **Steps**:
  1. Click chip "Ghi cardio" (data-testid="log-cardio-chip")
  2. Kiểm tra pageStack
- **Expected Result**: pushPage được gọi với {id: 'cardio-logger', component: 'CardioLogger'}. pageStack = [{id: 'cardio-logger', component: 'CardioLogger'}]. showBottomNav = false. CardioLogger component render toàn màn hình
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_35: TodaysPlanCard state no-plan: hiện empty state + "Tạo kế hoạch" CTA
- **Pre-conditions**: useTodaysPlan() trả về data.state = 'no-plan' (default, không match training-pending/completed/rest-day)
- **Steps**:
  1. Mở Dashboard
  2. Tìm data-testid="todays-plan-card"
  3. Kiểm tra no-plan-section
- **Expected Result**: Card hiển thị data-testid="no-plan-section" với icon Dumbbell lớn (48x48, slate-300), text "chưa có kế hoạch", và nút "Tạo kế hoạch" (data-testid="create-plan-cta") với icon ChevronRight. MealsSection hiện bên dưới phân cách border-t
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_36: TodaysPlanCard "Tạo kế hoạch" CTA → pushPage FitnessOnboarding
- **Pre-conditions**: TodaysPlanCard state = 'no-plan', pageStack = []
- **Steps**:
  1. Click nút "Tạo kế hoạch" (data-testid="create-plan-cta")
  2. Kiểm tra pageStack
- **Expected Result**: pushPage được gọi với {id: 'fitness-onboarding', component: 'FitnessOnboarding'}. pageStack = [{id: 'fitness-onboarding', component: 'FitnessOnboarding'}]. showBottomNav = false. FitnessOnboarding form render toàn màn hình
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_37: MealsSection hiện "Log meal" CTA khi nextMealToLog tồn tại và chưa đạt target
- **Pre-conditions**: TodaysPlanCard render MealsSection với nextMealToLog = 'lunch', hasReachedTarget = false
- **Steps**:
  1. Mở Dashboard
  2. Tìm data-testid="meals-section"
  3. Kiểm tra sự hiện diện của log-meal-cta
- **Expected Result**: Button data-testid="log-meal-cta" hiển thị với text tương ứng key 'dashboard.todaysPlan.logLunch'. Button có class text-blue-600 (light) hoặc text-blue-400 (dark). Meals progress hiện "{logged}/{total} meals logged"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_38: MealsSection ẩn "Log meal" CTA khi hasReachedTarget = true
- **Pre-conditions**: MealsSection với nextMealToLog = 'dinner', hasReachedTarget = true
- **Steps**:
  1. Render MealsSection với hasReachedTarget = true
  2. Tìm data-testid="log-meal-cta"
- **Expected Result**: Button log-meal-cta KHÔNG hiển thị (không tồn tại trong DOM). Thay vào đó, hiện badge "Đã đạt target" với icon CheckCircle emerald. Điều kiện: `nextMealKey && !hasReachedTarget` = false nên không render button
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_NAV_39: MealsSection ẩn "Log meal" CTA khi nextMealToLog = undefined
- **Pre-conditions**: MealsSection với nextMealToLog = undefined, hasReachedTarget = false
- **Steps**:
  1. Render MealsSection với nextMealToLog = undefined
  2. Tìm data-testid="log-meal-cta"
- **Expected Result**: Button log-meal-cta KHÔNG hiển thị. nextMealKey = undefined → điều kiện `nextMealKey && !hasReachedTarget` = false. Chỉ hiện meals progress text, không có CTA
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_NAV_40: Dashboard → pushPage WorkoutLogger → popPage → quay về Dashboard với bottomNav visible
- **Pre-conditions**: activeTab = 'dashboard', pageStack = [], showBottomNav = true
- **Steps**:
  1. Click "Bắt đầu" CTA trên TodaysPlanCard → pushPage WorkoutLogger
  2. Xác nhận: pageStack.length = 1, showBottomNav = false, WorkoutLogger render
  3. Click nút Back hoặc gọi popPage()
  4. Kiểm tra state sau popPage
- **Expected Result**: Sau popPage: pageStack = [], showBottomNav = true, activeTab vẫn = 'dashboard'. Dashboard hiển thị lại với QuickActionsBar và TodaysPlanCard. Bottom nav visible với 5 tabs. WorkoutLogger không còn render
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_41: Dashboard → pushPage page A → pushPage page B → stack = [A, B], depth = 2
- **Pre-conditions**: activeTab = 'dashboard', pageStack = []
- **Steps**:
  1. pushPage({id: 'workout-logger', component: 'WorkoutLogger'})
  2. Xác nhận pageStack.length = 1
  3. pushPage({id: 'weight-logger', component: 'WeightLogger'})
  4. Kiểm tra pageStack
- **Expected Result**: pageStack = [{id: 'workout-logger', component: 'WorkoutLogger'}, {id: 'weight-logger', component: 'WeightLogger'}]. pageStack.length = 2 (= MAX_PAGE_STACK_DEPTH). showBottomNav = false. WeightLogger render trên cùng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_42: Stack đầy [A, B] → pushPage C → stack = [A, C], B bị thay thế
- **Pre-conditions**: pageStack = [{id: 'a', component: 'A'}, {id: 'b', component: 'B'}], pageStack.length = 2
- **Steps**:
  1. pushPage({id: 'c', component: 'C'})
  2. Kiểm tra pageStack chi tiết
- **Expected Result**: pageStack = [{id: 'a', component: 'A'}, {id: 'c', component: 'C'}]. pageStack.length vẫn = 2. Page B đã bị thay thế hoàn toàn bởi Page C. Logic: stack.slice(0, -1) + [page] = [{id: 'a'}, {id: 'c'}]. showBottomNav vẫn = false
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_NAV_43: FitnessTab onboarding gate: !isOnboarded → chỉ hiện FitnessOnboarding
- **Pre-conditions**: useFitnessStore.isOnboarded = false, activeTab = 'fitness'
- **Steps**:
  1. Chuyển sang tab Fitness
  2. Kiểm tra DOM render
- **Expected Result**: FitnessOnboarding component render (data-testid="fitness-onboarding" hoặc tương đương). SubTabBar KHÔNG render. Không thấy bất kỳ sub-tab content nào (plan, workout, history, progress). Chỉ có form onboarding với onComplete callback
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_44: FitnessTab sau onboarding: hiện 4 sub-tabs, default 'plan'
- **Pre-conditions**: useFitnessStore.isOnboarded = true, activeTab = 'fitness'
- **Steps**:
  1. Chuyển sang tab Fitness
  2. Kiểm tra SubTabBar và active sub-tab
- **Expected Result**: data-testid="fitness-tab" visible. SubTabBar render 4 tabs: Kế hoạch (ClipboardList icon), Tập luyện (Dumbbell icon), Lịch sử (History icon), Tiến trình (BarChart3 icon). Default active sub-tab = 'plan'. data-testid="plan-subtab-content" render với role="tabpanel" id="tabpanel-plan". TrainingPlanView render bên trong
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_45: FitnessTab handleWorkoutComplete → chuyển sang sub-tab 'history'
- **Pre-conditions**: FitnessTab isOnboarded = true, activeSubTab = 'workout', đang ở WorkoutLogger
- **Steps**:
  1. Thực hiện hoàn thành workout (trigger onComplete callback)
  2. Kiểm tra activeSubTab
- **Expected Result**: activeSubTab chuyển sang 'history'. data-testid="history-subtab-content" render với role="tabpanel" id="tabpanel-history". WorkoutHistory component hiển thị. Tab "Lịch sử" active trên SubTabBar
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_46: FitnessTab handleWorkoutBack → chuyển sang sub-tab 'plan'
- **Pre-conditions**: FitnessTab isOnboarded = true, activeSubTab = 'workout'
- **Steps**:
  1. Từ WorkoutLogger, click nút Back (trigger onBack callback)
  2. Kiểm tra activeSubTab
- **Expected Result**: activeSubTab chuyển sang 'plan'. data-testid="plan-subtab-content" render. TrainingPlanView hiển thị. Tab "Kế hoạch" active trên SubTabBar
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_47: FitnessTab workout mode toggle Strength ↔ Cardio
- **Pre-conditions**: FitnessTab isOnboarded = true, activeSubTab = 'workout', workoutMode = 'strength'
- **Steps**:
  1. Kiểm tra radiogroup hiển thị với 2 radio buttons
  2. Xác nhận data-testid="workout-mode-strength" có aria-checked="true"
  3. Click data-testid="workout-mode-cardio"
  4. Xác nhận aria-checked đổi
  5. Click lại data-testid="workout-mode-strength"
- **Expected Result**: Ban đầu: strength aria-checked="true", cardio aria-checked="false", WorkoutLogger render. Sau click Cardio: cardio aria-checked="true", strength aria-checked="false", CardioLogger render. Click lại Strength: quay về trạng thái ban đầu. Radiogroup có role="radiogroup" với aria-label
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_48: Dashboard → Fitness tab transition: navigateTab('fitness') reset state đúng
- **Pre-conditions**: activeTab = 'dashboard', có page trong pageStack (ví dụ: đã pushPage WorkoutLogger)
- **Steps**:
  1. Xác nhận pageStack.length > 0, showBottomNav = false
  2. Gọi navigateTab('fitness') hoặc click tab Fitness (nếu bottom nav visible)
  3. Kiểm tra state
- **Expected Result**: activeTab = 'fitness', pageStack = [] (cleared), showBottomNav = true. FitnessTab render (onboarding hoặc sub-tabs tùy isOnboarded). Trạng thái Dashboard page stack hoàn toàn bị xóa sạch
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_49: Fitness → Dashboard tab transition: navigateTab('dashboard') reset state đúng
- **Pre-conditions**: activeTab = 'fitness', FitnessTab đang hiển thị sub-tabs
- **Steps**:
  1. Gọi navigateTab('dashboard') hoặc click tab Dashboard
  2. Kiểm tra state
- **Expected Result**: activeTab = 'dashboard', pageStack = [], showBottomNav = true. Dashboard render với QuickActionsBar và TodaysPlanCard. FitnessTab sub-tab state (activeSubTab, workoutMode) là local state nên không bị reset bởi navigateTab — nhưng sẽ reset khi FitnessTab unmount/remount
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_50: Rapid tab switching 20 lần liên tiếp — state nhất quán, không crash
- **Pre-conditions**: App đang chạy ổn định, bất kỳ tab nào active
- **Steps**:
  1. Nhanh chóng click chuyển tab 20 lần liên tiếp theo thứ tự: Calendar → Library → AI-Analysis → Fitness → Dashboard → Calendar → ... (lặp 4 vòng)
  2. Sau mỗi click, quan sát có lỗi không
  3. Sau 20 lần, kiểm tra state cuối cùng
- **Expected Result**: Không crash, không freeze, không có JavaScript error trong Console. activeTab chính xác = tab cuối cùng được click. pageStack = [] (vì mỗi navigateTab đều clear). showBottomNav = true. Rendering mượt mà, không flicker
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_NAV_51: Rapid pushPage/popPage 10 lần liên tiếp — stack không vượt MAX_PAGE_STACK_DEPTH
- **Pre-conditions**: activeTab = 'dashboard', pageStack = []
- **Steps**:
  1. Nhanh chóng thực hiện 10 lần pushPage/popPage xen kẽ:
     pushPage(A) → popPage → pushPage(B) → pushPage(C) → popPage → pushPage(D) → pushPage(E) → pushPage(F) → popPage → popPage
  2. Kiểm tra pageStack sau mỗi thao tác
  3. Xác nhận pageStack.length không bao giờ > 2
- **Expected Result**: Tại mọi thời điểm, pageStack.length ≤ 2 (MAX_PAGE_STACK_DEPTH). Kết quả cuối: pushPage(A)[1] → pop[0] → pushPage(B)[1] → pushPage(C)[2] → pop[1:B] → pushPage(D)[2:B,D] → pushPage(E)[2:B,E replace D] → pushPage(F)[2:B,F replace E] → pop[1:B] → pop[0]. pageStack = [], showBottomNav = true
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_NAV_52: Android back button: page stack có page → popPage đóng page trên cùng
- **Pre-conditions**: Chạy trên Android (Capacitor), activeTab = 'dashboard', pageStack = [{id: 'workout-logger', component: 'WorkoutLogger'}]
- **Steps**:
  1. Nhấn nút Back vật lý trên Android
  2. Kiểm tra behavior: canGoBack() = true → popPage()
  3. Kiểm tra state sau back
- **Expected Result**: popPage() được gọi → pageStack = []. showBottomNav = true. Quay về Dashboard view. WorkoutLogger bị đóng. Không thoát app vì còn page để pop
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_53: Android back button: page stack rỗng → quay về tab trước đó
- **Pre-conditions**: Chạy trên Android (Capacitor), activeTab = 'dashboard', pageStack = [], tab trước đó là 'fitness'
- **Steps**:
  1. Nhấn nút Back vật lý trên Android
  2. Kiểm tra behavior: canGoBack() = false → xử lý quay tab trước
- **Expected Result**: Vì pageStack rỗng và canGoBack() = false, hệ thống xử lý back ở cấp tab. Nếu activeTab không phải 'calendar' (tab gốc), chuyển về tab trước đó trong history. activeTab thay đổi, bottomNav vẫn hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_54: Android back button: tab Calendar + stack rỗng → thoát app
- **Pre-conditions**: Chạy trên Android (Capacitor), activeTab = 'calendar', pageStack = []
- **Steps**:
  1. Đảm bảo đang ở tab Calendar với stack rỗng
  2. Nhấn nút Back vật lý trên Android
- **Expected Result**: Vì đang ở tab gốc (Calendar) và pageStack rỗng, Android back button trigger thoát app (hoặc minimize). App không crash. Trạng thái được lưu trữ (nếu có persist) để khôi phục khi mở lại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_55: Deep link vào page cụ thể → pushPage đúng component, popPage quay về tab gốc
- **Pre-conditions**: App hỗ trợ deep linking (Capacitor App plugin hoặc tương đương)
- **Steps**:
  1. Mở deep link dẫn tới WorkoutLogger (ví dụ: mealplanner://workout-logger)
  2. Kiểm tra navigation state
  3. popPage từ WorkoutLogger
  4. Kiểm tra state sau pop
- **Expected Result**: Deep link → navigateTab('dashboard') hoặc tab phù hợp → pushPage({id: 'workout-logger', component: 'WorkoutLogger'}). pageStack chứa đúng page entry. showBottomNav = false. Sau popPage: quay về tab gốc, pageStack = [], showBottomNav = true. Luồng back hoạt động tự nhiên
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P2


##### TC_NAV_56: Click tab Calendar → content Calendar hiển thị
- **Pre-conditions**: App đã khởi tạo, bottom nav hiển thị
- **Steps**:
  1. Click tab Calendar trên bottom nav
  2. Kiểm tra content area
- **Expected**: Calendar content hiển thị đầy đủ. activeTab='calendar'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_57: Click tab Library → content Library hiển thị
- **Pre-conditions**: App đã khởi tạo
- **Steps**:
  1. Click tab Library trên bottom nav
  2. Kiểm tra content area
- **Expected**: Library content hiển thị. activeTab='library'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_58: Click tab AI-Analysis → content AI-Analysis hiển thị
- **Pre-conditions**: App đã khởi tạo
- **Steps**:
  1. Click tab AI-Analysis trên bottom nav
  2. Kiểm tra content area
- **Expected**: AI-Analysis content hiển thị. activeTab='ai-analysis'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_59: Click tab Fitness → content Fitness hiển thị
- **Pre-conditions**: App đã khởi tạo
- **Steps**:
  1. Click tab Fitness trên bottom nav
  2. Kiểm tra content area
- **Expected**: Fitness content hiển thị. activeTab='fitness'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_60: Click tab Dashboard → content Dashboard hiển thị
- **Pre-conditions**: App đã khởi tạo
- **Steps**:
  1. Click tab Dashboard trên bottom nav
  2. Kiểm tra content area
- **Expected**: Dashboard content hiển thị. activeTab='dashboard'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_61: Tab switch Calendar→Library: Calendar ẩn, Library hiện
- **Pre-conditions**: activeTab='calendar'
- **Steps**:
  1. Click tab Library
  2. Kiểm tra Calendar content ẩn
  3. Kiểm tra Library content hiện
- **Expected**: Calendar unmount/ẩn, Library mount/hiện. activeTab='library'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_62: Tab switch Calendar→AI-Analysis: đúng content
- **Pre-conditions**: activeTab='calendar'
- **Steps**:
  1. Click tab AI-Analysis
  2. Kiểm tra content switch
- **Expected**: Calendar ẩn, AI-Analysis hiện. activeTab='ai-analysis'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_63: Tab switch Calendar→Fitness: đúng content
- **Pre-conditions**: activeTab='calendar'
- **Steps**:
  1. Click tab Fitness
  2. Kiểm tra content switch
- **Expected**: Calendar ẩn, Fitness hiện. activeTab='fitness'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_64: Tab switch Calendar→Dashboard: đúng content
- **Pre-conditions**: activeTab='calendar'
- **Steps**:
  1. Click tab Dashboard
  2. Kiểm tra content switch
- **Expected**: Calendar ẩn, Dashboard hiện. activeTab='dashboard'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_65: Tab switch Library→Calendar: quay lại Calendar
- **Pre-conditions**: activeTab='library'
- **Steps**:
  1. Click tab Calendar
  2. Kiểm tra content switch
- **Expected**: Library ẩn, Calendar hiện. activeTab='calendar'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_66: Tab switch Library→AI-Analysis: đúng content
- **Pre-conditions**: activeTab='library'
- **Steps**:
  1. Click tab AI-Analysis
- **Expected**: Library ẩn, AI-Analysis hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_67: Tab switch Library→Fitness: đúng content
- **Pre-conditions**: activeTab='library'
- **Steps**:
  1. Click tab Fitness
- **Expected**: Library ẩn, Fitness hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_68: Tab switch Library→Dashboard: đúng content
- **Pre-conditions**: activeTab='library'
- **Steps**:
  1. Click tab Dashboard
- **Expected**: Library ẩn, Dashboard hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_69: Tab switch AI-Analysis→Calendar: đúng content
- **Pre-conditions**: activeTab='ai-analysis'
- **Steps**:
  1. Click tab Calendar
- **Expected**: AI-Analysis ẩn, Calendar hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_70: Tab switch AI-Analysis→Library: đúng content
- **Pre-conditions**: activeTab='ai-analysis'
- **Steps**:
  1. Click tab Library
- **Expected**: AI-Analysis ẩn, Library hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_71: Tab switch AI-Analysis→Fitness: đúng content
- **Pre-conditions**: activeTab='ai-analysis'
- **Steps**:
  1. Click tab Fitness
- **Expected**: AI-Analysis ẩn, Fitness hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_72: Tab switch AI-Analysis→Dashboard: đúng content
- **Pre-conditions**: activeTab='ai-analysis'
- **Steps**:
  1. Click tab Dashboard
- **Expected**: AI-Analysis ẩn, Dashboard hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_73: Tab switch Fitness→Calendar: đúng content
- **Pre-conditions**: activeTab='fitness'
- **Steps**:
  1. Click tab Calendar
- **Expected**: Fitness ẩn, Calendar hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_74: Tab switch Fitness→Library: đúng content
- **Pre-conditions**: activeTab='fitness'
- **Steps**:
  1. Click tab Library
- **Expected**: Fitness ẩn, Library hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_75: Tab switch Fitness→AI-Analysis: đúng content
- **Pre-conditions**: activeTab='fitness'
- **Steps**:
  1. Click tab AI-Analysis
- **Expected**: Fitness ẩn, AI-Analysis hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_76: Tab switch Fitness→Dashboard: đúng content
- **Pre-conditions**: activeTab='fitness'
- **Steps**:
  1. Click tab Dashboard
- **Expected**: Fitness ẩn, Dashboard hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_77: Tab switch Dashboard→Calendar: đúng content
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. Click tab Calendar
- **Expected**: Dashboard ẩn, Calendar hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_78: Tab switch Dashboard→Library: đúng content
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. Click tab Library
- **Expected**: Dashboard ẩn, Library hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_79: Tab switch Dashboard→AI-Analysis: đúng content
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. Click tab AI-Analysis
- **Expected**: Dashboard ẩn, AI-Analysis hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_80: Tab switch Dashboard→Fitness: đúng content
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. Click tab Fitness
- **Expected**: Dashboard ẩn, Fitness hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_81: Rapid tab switch 1→2→3→4→5→1 trong < 2 giây
- **Pre-conditions**: App ở tab Calendar
- **Steps**:
  1. Click nhanh liên tiếp: Library → AI-Analysis → Fitness → Dashboard → Calendar trong < 2s
  2. Kiểm tra final state
- **Expected**: activeTab='calendar', pageStack=[], showBottomNav=true. Không crash, không error
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P0

##### TC_NAV_82: Rapid tab switch 10 lần liên tiếp → state nhất quán
- **Pre-conditions**: App ở bất kỳ tab nào
- **Steps**:
  1. Click 10 tab switches ngẫu nhiên liên tiếp nhanh
  2. Kiểm tra final state consistency
- **Expected**: activeTab khớp với tab cuối cùng click. pageStack=[]. showBottomNav=true. State nhất quán
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_NAV_83: Tab switch 50 lần → không memory leak
- **Pre-conditions**: App vừa khởi tạo
- **Steps**:
  1. Thực hiện 50 tab switches
  2. Kiểm tra memory usage (DevTools → Performance → Memory)
- **Expected**: Memory không tăng liên tục (no leak). Heap size ổn định sau khi GC
- **Kết quả test thực tế**: —
- **Type**: Performance | **Priority**: P2

##### TC_NAV_84: Active tab indicator: Calendar active → Calendar tab highlighted
- **Pre-conditions**: activeTab='calendar'
- **Steps**:
  1. Kiểm tra CSS class/style trên tab Calendar trong bottom nav
- **Expected**: Tab Calendar có class active (highlighted/selected state). Các tab khác ở inactive state
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_85: Active tab indicator: Library active → Library tab highlighted
- **Pre-conditions**: activeTab='library'
- **Steps**:
  1. Kiểm tra CSS class/style trên tab Library
- **Expected**: Tab Library highlighted. Các tab khác inactive
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_86: Active tab indicator: AI-Analysis active → đúng tab highlighted
- **Pre-conditions**: activeTab='ai-analysis'
- **Steps**:
  1. Kiểm tra CSS class/style trên tab AI-Analysis
- **Expected**: Tab AI-Analysis highlighted
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_87: Active tab indicator: Fitness active → đúng tab highlighted
- **Pre-conditions**: activeTab='fitness'
- **Steps**:
  1. Kiểm tra CSS class/style trên tab Fitness
- **Expected**: Tab Fitness highlighted
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_88: Active tab indicator: Dashboard active → đúng tab highlighted
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. Kiểm tra CSS class/style trên tab Dashboard
- **Expected**: Tab Dashboard highlighted
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_89: Chỉ 1 tab active tại mọi thời điểm
- **Pre-conditions**: Bất kỳ tab nào active
- **Steps**:
  1. Kiểm tra tất cả 5 tabs
  2. Đếm số tab có active state
- **Expected**: Chính xác 1 tab có active state tại mọi thời điểm
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_90: Tab switch không tạo console error/warning
- **Pre-conditions**: App đã khởi tạo
- **Steps**:
  1. Mở DevTools Console
  2. Thực hiện chuyển tab 5 lần
  3. Kiểm tra console
- **Expected**: Console không có error hoặc warning liên quan navigation
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_91: Calendar state preserved: scroll position giữ nguyên sau switch away/back
- **Pre-conditions**: activeTab='calendar', đã scroll xuống 500px
- **Steps**:
  1. Ghi nhận scroll position
  2. Switch sang Library
  3. Switch về Calendar
  4. Kiểm tra scroll position
- **Expected**: Scroll position trở về 500px (hoặc giá trị đã lưu). Content hiển thị đúng vị trí
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_92: Library state preserved: scroll position giữ nguyên
- **Pre-conditions**: activeTab='library', đã scroll xuống 300px
- **Steps**:
  1. Switch sang tab khác
  2. Switch về Library
  3. Kiểm tra scroll
- **Expected**: Scroll position restored = 300px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_93: AI-Analysis state preserved: scroll position giữ nguyên
- **Pre-conditions**: activeTab='ai-analysis', đã scroll xuống 200px
- **Steps**:
  1. Switch away và back
  2. Kiểm tra scroll
- **Expected**: Scroll position restored = 200px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_94: Fitness state preserved: scroll position giữ nguyên
- **Pre-conditions**: activeTab='fitness', đã scroll xuống 400px
- **Steps**:
  1. Switch away và back
  2. Kiểm tra scroll
- **Expected**: Scroll position restored = 400px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_95: Dashboard state preserved: scroll position giữ nguyên
- **Pre-conditions**: activeTab='dashboard', đã scroll xuống 600px
- **Steps**:
  1. Switch away và back
  2. Kiểm tra scroll
- **Expected**: Scroll position restored = 600px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_96: setScrollPosition lưu đúng giá trị cho mỗi tab
- **Pre-conditions**: App đã khởi tạo
- **Steps**:
  1. setScrollPosition('calendar', 250)
  2. setScrollPosition('library', 100)
  3. Kiểm tra tabScrollPositions
- **Expected**: tabScrollPositions = {'calendar': 250, 'library': 100}
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_97: getScrollPosition trả về 0 cho tab chưa scroll
- **Pre-conditions**: App vừa khởi tạo, chưa scroll tab nào
- **Steps**:
  1. Gọi getScrollPosition('calendar')
- **Expected**: Trả về 0 (default value cho tab chưa có scroll data)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_98: getScrollPosition trả về giá trị đã lưu cho tab đã scroll
- **Pre-conditions**: Đã gọi setScrollPosition('dashboard', 350)
- **Steps**:
  1. Gọi getScrollPosition('dashboard')
- **Expected**: Trả về 350
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_99: Dashboard→Fitness→Dashboard: Dashboard state intact
- **Pre-conditions**: Dashboard có state nội bộ (ví dụ: card expanded)
- **Steps**:
  1. Chuyển sang Fitness
  2. Chuyển về Dashboard
  3. Kiểm tra state
- **Expected**: Dashboard state intact: card vẫn expanded, scroll position đúng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_100: Calendar→Library→Calendar: Calendar state intact
- **Pre-conditions**: Calendar có state nội bộ
- **Steps**:
  1. Chuyển sang Library
  2. Chuyển về Calendar
- **Expected**: Calendar state intact
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_101: pushPage thêm 1 page → pageStack.length = 1
- **Pre-conditions**: pageStack=[], showBottomNav=true
- **Steps**:
  1. pushPage({id: 'workout-logger', component: 'WorkoutLogger'})
  2. Kiểm tra state
- **Expected**: pageStack.length = 1. pageStack[0] = {id: 'workout-logger', component: 'WorkoutLogger'}
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_102: pushPage thêm 2 pages → pageStack.length = 2
- **Pre-conditions**: pageStack có 1 page
- **Steps**:
  1. pushPage({id: 'set-editor', component: 'SetEditor'})
  2. Kiểm tra state
- **Expected**: pageStack.length = 2. Page mới ở cuối stack
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_103: pushPage khi stack đã có 2 pages → thay thế page cuối (length vẫn = 2)
- **Pre-conditions**: pageStack đã có 2 pages: [A, B]
- **Steps**:
  1. pushPage({id: 'C', component: 'PageC'})
  2. Kiểm tra state
- **Expected**: pageStack.length vẫn = 2. Stack = [A, C]. Page B bị thay thế bởi C (slice(0,-1) + newPage)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_NAV_104: pushPage: showBottomNav chuyển false khi thêm page đầu tiên
- **Pre-conditions**: pageStack=[], showBottomNav=true
- **Steps**:
  1. pushPage page đầu tiên
  2. Kiểm tra showBottomNav
- **Expected**: showBottomNav = false. Bottom nav ẩn ngay lập tức
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_105: pushPage: bottom nav ẩn khi có bất kỳ page nào trong stack
- **Pre-conditions**: pageStack có 1 page, showBottomNav=false
- **Steps**:
  1. pushPage page thứ 2
  2. Kiểm tra showBottomNav
- **Expected**: showBottomNav vẫn = false
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_106: popPage: xóa page cuối → pageStack giảm 1
- **Pre-conditions**: pageStack = [pageA, pageB]
- **Steps**:
  1. popPage()
  2. Kiểm tra state
- **Expected**: pageStack = [pageA]. length giảm từ 2 → 1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_107: popPage: stack từ 2→1, showBottomNav vẫn false
- **Pre-conditions**: pageStack = [pageA, pageB]
- **Steps**:
  1. popPage()
  2. Kiểm tra showBottomNav
- **Expected**: showBottomNav = false (vì stack vẫn còn 1 page)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_108: popPage: stack từ 1→0, showBottomNav chuyển true
- **Pre-conditions**: pageStack = [pageA]
- **Steps**:
  1. popPage()
  2. Kiểm tra state
- **Expected**: pageStack = []. showBottomNav = true. Bottom nav hiện lại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_109: popPage trên stack rỗng → state không thay đổi
- **Pre-conditions**: pageStack = []
- **Steps**:
  1. popPage()
  2. Kiểm tra state
- **Expected**: State không thay đổi. pageStack vẫn = []. showBottomNav vẫn = true. Không crash
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_NAV_110: canGoBack() = true khi stack có 1 page
- **Pre-conditions**: pageStack = [{id:'test'}]
- **Steps**:
  1. Gọi canGoBack()
- **Expected**: Trả về true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_111: canGoBack() = true khi stack có 2 pages
- **Pre-conditions**: pageStack = [{id:'a'}, {id:'b'}]
- **Steps**:
  1. Gọi canGoBack()
- **Expected**: Trả về true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_112: canGoBack() = false khi stack rỗng
- **Pre-conditions**: pageStack = []
- **Steps**:
  1. Gọi canGoBack()
- **Expected**: Trả về false
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_113: navigateTab reset pageStack về []
- **Pre-conditions**: pageStack = [pageA, pageB], activeTab='dashboard'
- **Steps**:
  1. navigateTab('fitness')
  2. Kiểm tra pageStack
- **Expected**: pageStack = []. Tất cả pages bị xóa khi chuyển tab
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_114: navigateTab set showBottomNav = true
- **Pre-conditions**: pageStack = [pageA], showBottomNav=false
- **Steps**:
  1. navigateTab('calendar')
  2. Kiểm tra showBottomNav
- **Expected**: showBottomNav = true. Bottom nav hiện lại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_115: pushPage với id='workout-logger', component='WorkoutLogger'
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. pushPage({id: 'workout-logger', component: 'WorkoutLogger'})
  2. Kiểm tra pageStack[0]
- **Expected**: pageStack[0] = {id: 'workout-logger', component: 'WorkoutLogger'}
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_116: pushPage với id='weight-logger', component='WeightLogger'
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. pushPage({id: 'weight-logger', component: 'WeightLogger'})
- **Expected**: pageStack chứa WeightLogger entry
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_117: pushPage với id='cardio-logger', component='CardioLogger'
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. pushPage({id: 'cardio-logger', component: 'CardioLogger'})
- **Expected**: pageStack chứa CardioLogger entry
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_118: pushPage với id='fitness-onboarding', component='FitnessOnboarding'
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. pushPage({id: 'fitness-onboarding', component: 'FitnessOnboarding'})
- **Expected**: pageStack chứa FitnessOnboarding entry
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_119: pushPage với props: {workoutId: 'abc123'}
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. pushPage({id: 'workout-logger', component: 'WorkoutLogger', props: {workoutId: 'abc123'}})
  2. Kiểm tra pageStack[0].props
- **Expected**: pageStack[0].props = {workoutId: 'abc123'}
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_120: Page stack overflow protection: pushPage lần 3 thay thế lần 2
- **Pre-conditions**: pageStack = [pageA, pageB]
- **Steps**:
  1. pushPage(pageC)
  2. Kiểm tra stack
- **Expected**: Stack = [pageA, pageC]. length = 2. pageB replaced. Overflow protected
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_NAV_121: QuickActionsBar render đúng 3 buttons (left, center, right)
- **Pre-conditions**: Dashboard active, QuickActionsBar mounted
- **Steps**:
  1. Kiểm tra số lượng buttons render
- **Expected**: Chính xác 3 buttons render: left, center, right
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_122: Primary button (center) có bg-emerald-500 và height 56px
- **Pre-conditions**: QuickActionsBar rendered
- **Steps**:
  1. Kiểm tra primary button (isPrimary=true) CSS
- **Expected**: Primary button: bg-emerald-500, height ~56px, text-white
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_123: Secondary buttons có white/slate bg và height 48px
- **Pre-conditions**: QuickActionsBar rendered
- **Steps**:
  1. Kiểm tra secondary buttons CSS
- **Expected**: Secondary buttons: white/slate bg, height ~48px, border visible
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_124: Primary button có glow shadow effect
- **Pre-conditions**: QuickActionsBar rendered
- **Steps**:
  1. Kiểm tra primary button shadow
- **Expected**: Primary button có shadow/glow effect (box-shadow emerald)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_NAV_125: QuickAction 'log-weight' → pushPage WeightLogger
- **Pre-conditions**: Dashboard active, QuickActionsBar có action 'log-weight'
- **Steps**:
  1. Click action 'log-weight'
  2. Kiểm tra navigation state
- **Expected**: pushPage gọi với {id: 'weight-logger', component: 'WeightLogger'}. pageStack updated
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_126: QuickAction 'start-workout' → pushPage WorkoutLogger
- **Pre-conditions**: Dashboard active, action 'start-workout'
- **Steps**:
  1. Click action button
  2. Kiểm tra navigation
- **Expected**: pushPage gọi với {id: 'workout-logger', component: 'WorkoutLogger'}
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_127: QuickAction 'log-breakfast' → navigate Calendar tab và log breakfast
- **Pre-conditions**: Dashboard active, action 'log-breakfast'
- **Steps**:
  1. Click action button
  2. Kiểm tra navigation
- **Expected**: Navigate tới Calendar tab hoặc pushPage cho meal logging
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_128: QuickAction 'log-lunch' → navigate Calendar và log lunch
- **Pre-conditions**: Dashboard, action 'log-lunch'
- **Steps**:
  1. Click action
  2. Kiểm tra navigation
- **Expected**: Navigate tới Calendar + lunch logging
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_129: QuickAction 'log-dinner' → navigate Calendar và log dinner
- **Pre-conditions**: Dashboard, action 'log-dinner'
- **Steps**:
  1. Click action
- **Expected**: Navigate tới Calendar + dinner logging
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_130: QuickAction 'log-meal' → navigate Calendar và log meal
- **Pre-conditions**: Dashboard, action 'log-meal'
- **Steps**:
  1. Click action
- **Expected**: Navigate tới Calendar + meal logging
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_131: QuickAction 'log-snack' → navigate Calendar và log snack
- **Pre-conditions**: Dashboard, action 'log-snack'
- **Steps**:
  1. Click action
- **Expected**: Navigate tới Calendar + snack logging
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_132: QuickAction 'log-cardio' → pushPage CardioLogger
- **Pre-conditions**: Dashboard, action 'log-cardio'
- **Steps**:
  1. Click action
- **Expected**: pushPage CardioLogger
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_133: QuickAction 'view-results' → navigate phù hợp
- **Pre-conditions**: Dashboard, action 'view-results'
- **Steps**:
  1. Click action
- **Expected**: Navigate tới trang kết quả tương ứng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_134: QuickActionsBar aria-label đúng i18n key
- **Pre-conditions**: QuickActionsBar rendered
- **Steps**:
  1. Kiểm tra nav element aria-label
- **Expected**: Nav element có aria-label = t('quickActions.ariaLabel')
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_135: Mỗi action button có aria-label từ i18n
- **Pre-conditions**: QuickActionsBar rendered
- **Steps**:
  1. Kiểm tra từng button aria-label
- **Expected**: Mỗi button có aria-label = t(action.label)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_136: Action button icons có aria-hidden='true'
- **Pre-conditions**: QuickActionsBar rendered
- **Steps**:
  1. Kiểm tra icons trong buttons
- **Expected**: Tất cả icons có aria-hidden='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_137: Click action button → bottom nav ẩn (vì pushPage)
- **Pre-conditions**: Dashboard, click QuickAction → pushPage
- **Steps**:
  1. Click bất kỳ QuickAction pushPage
  2. Kiểm tra bottom nav
- **Expected**: showBottomNav = false, bottom nav ẩn
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_138: QuickActionsBar: icon mapping đúng cho mỗi action type
- **Pre-conditions**: QuickActionsBar rendered
- **Steps**:
  1. Kiểm tra icon cho mỗi action type
- **Expected**: Mỗi action type map đúng icon từ ACTION_ICON_MAP
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_139: QuickActionsBar: 3 actions từ useQuickActions hook
- **Pre-conditions**: QuickActionsBar mounted
- **Steps**:
  1. Kiểm tra useQuickActions hook return
- **Expected**: Hook trả về mảng 3 actions
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_140: QuickActionsBar: primary action (isPrimary=true) ở vị trí center
- **Pre-conditions**: QuickActionsBar rendered
- **Steps**:
  1. Tìm button có isPrimary=true
  2. Kiểm tra position
- **Expected**: Primary button ở vị trí center (index 1 trong mảng)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_141: TodaysPlanCard state='training-pending': CTA 'Bắt đầu' hiển thị
- **Pre-conditions**: useTodaysPlan trả về state='training-pending'
- **Steps**:
  1. Render TodaysPlanCard
  2. Kiểm tra CTA button
- **Expected**: CTA 'Bắt đầu' (Play icon) hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_142: TodaysPlanCard 'Bắt đầu' CTA → pushPage WorkoutLogger
- **Pre-conditions**: TodaysPlanCard state='training-pending'
- **Steps**:
  1. Click CTA 'Bắt đầu'
  2. Kiểm tra navigation
- **Expected**: pushPage({id: 'workout-logger', component: 'WorkoutLogger'}) được gọi
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_143: TodaysPlanCard state='training-completed': summary hiển thị
- **Pre-conditions**: useTodaysPlan state='training-completed'
- **Steps**:
  1. Render TodaysPlanCard
- **Expected**: Hiển thị workout summary: duration, sets count, optional PR flag
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_144: TodaysPlanCard state='rest-day': recovery tips hiển thị
- **Pre-conditions**: useTodaysPlan state='rest-day'
- **Steps**:
  1. Render TodaysPlanCard
- **Expected**: Recovery tips hiển thị: walking, hydration suggestions
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_145: TodaysPlanCard rest-day: 'Ghi cân nặng' chip → pushPage WeightLogger
- **Pre-conditions**: TodaysPlanCard state='rest-day'
- **Steps**:
  1. Click chip 'Ghi cân nặng'
- **Expected**: pushPage({id: 'weight-logger', component: 'WeightLogger'})
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_146: TodaysPlanCard rest-day: 'Ghi cardio' chip → pushPage CardioLogger
- **Pre-conditions**: TodaysPlanCard state='rest-day'
- **Steps**:
  1. Click chip 'Ghi cardio'
- **Expected**: pushPage({id: 'cardio-logger', component: 'CardioLogger'})
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_147: TodaysPlanCard state='no-plan': empty state với 'Tạo kế hoạch'
- **Pre-conditions**: useTodaysPlan state='no-plan'
- **Steps**:
  1. Render TodaysPlanCard
- **Expected**: Empty state hiển thị với button 'Tạo kế hoạch'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_148: TodaysPlanCard 'Tạo kế hoạch' → pushPage FitnessOnboarding
- **Pre-conditions**: TodaysPlanCard state='no-plan'
- **Steps**:
  1. Click 'Tạo kế hoạch'
- **Expected**: pushPage({id: 'fitness-onboarding', component: 'FitnessOnboarding'})
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_149: TodaysPlanCard training-pending: MealsSection hiển thị progress
- **Pre-conditions**: TodaysPlanCard state='training-pending', có meals data
- **Steps**:
  1. Render MealsSection
- **Expected**: MealsSection hiển thị progress bar cho từng bữa
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_150: TodaysPlanCard MealsSection: 'Log bữa sáng' CTA khi nextMealToLog='breakfast'
- **Pre-conditions**: nextMealToLog='breakfast', hasReachedTarget=false
- **Steps**:
  1. Render MealsSection
- **Expected**: CTA 'Log bữa sáng' hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_151: TodaysPlanCard MealsSection: 'Log bữa trưa' CTA khi nextMealToLog='lunch'
- **Pre-conditions**: nextMealToLog='lunch', hasReachedTarget=false
- **Steps**:
  1. Render MealsSection
- **Expected**: CTA 'Log bữa trưa' hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_152: TodaysPlanCard MealsSection: 'Log bữa tối' CTA khi nextMealToLog='dinner'
- **Pre-conditions**: nextMealToLog='dinner', hasReachedTarget=false
- **Steps**:
  1. Render MealsSection
- **Expected**: CTA 'Log bữa tối' hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_153: TodaysPlanCard MealsSection ẩn CTA khi hasReachedTarget=true
- **Pre-conditions**: hasReachedTarget=true
- **Steps**:
  1. Render MealsSection
- **Expected**: CTA log meal KHÔNG hiển thị vì đã đạt target
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_NAV_154: TodaysPlanCard MealsSection ẩn CTA khi nextMealToLog=null
- **Pre-conditions**: nextMealToLog=null
- **Steps**:
  1. Render MealsSection
- **Expected**: CTA log meal KHÔNG hiển thị vì không có meal tiếp theo
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_NAV_155: TodaysPlanCard rest-day: hiển thị tomorrow preview
- **Pre-conditions**: TodaysPlanCard state='rest-day'
- **Steps**:
  1. Kiểm tra tomorrow preview section
- **Expected**: Preview ngày mai hiển thị thông tin workout/rest planned
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_NAV_156: TodaysPlanCard training-completed: hiển thị duration, sets, PR flag
- **Pre-conditions**: TodaysPlanCard state='training-completed', workout có PR
- **Steps**:
  1. Render card
- **Expected**: Duration, sets count, và PR flag/badge hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_157: TodaysPlanCard training-completed + PR: PR badge hiển thị
- **Pre-conditions**: TodaysPlanCard state='training-completed', hasPR=true
- **Steps**:
  1. Kiểm tra PR badge
- **Expected**: PR badge/icon hiển thị rõ ràng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_158: TodaysPlanCard icons đều có aria-hidden='true'
- **Pre-conditions**: TodaysPlanCard rendered
- **Steps**:
  1. Kiểm tra tất cả icons
- **Expected**: Dumbbell, UtensilsCrossed, CheckCircle, Play, ChevronRight đều có aria-hidden='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_159: TodaysPlanCard: semantic h3 title
- **Pre-conditions**: TodaysPlanCard rendered
- **Steps**:
  1. Kiểm tra heading
- **Expected**: Title sử dụng semantic h3 tag
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_160: TodaysPlanCard: không crash khi useTodaysPlan trả về null data
- **Pre-conditions**: useTodaysPlan trả về null/undefined data
- **Steps**:
  1. Render TodaysPlanCard
- **Expected**: Component không crash, hiển thị default state (no-plan) hoặc empty state
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_NAV_161: FitnessTab default activeSubTab = 'plan'
- **Pre-conditions**: FitnessTab mounted, isOnboarded=true
- **Steps**:
  1. Kiểm tra default sub-tab
- **Expected**: activeSubTab = 'plan'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_162: FitnessTab sub-tab switch: plan → workout
- **Pre-conditions**: FitnessTab, activeSubTab='plan'
- **Steps**:
  1. Click sub-tab 'workout'
- **Expected**: activeSubTab = 'workout', workout panel hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_163: FitnessTab sub-tab switch: workout → history
- **Pre-conditions**: activeSubTab='workout'
- **Steps**:
  1. Click sub-tab 'history'
- **Expected**: activeSubTab = 'history', history panel hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_164: FitnessTab sub-tab switch: history → progress
- **Pre-conditions**: activeSubTab='history'
- **Steps**:
  1. Click sub-tab 'progress'
- **Expected**: activeSubTab = 'progress', progress panel hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_165: FitnessTab sub-tab switch: progress → plan
- **Pre-conditions**: activeSubTab='progress'
- **Steps**:
  1. Click sub-tab 'plan'
- **Expected**: activeSubTab = 'plan', plan panel hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_166: FitnessTab: 4 sub-tabs render đúng
- **Pre-conditions**: FitnessTab mounted, isOnboarded=true
- **Steps**:
  1. Kiểm tra SubTabBar render
- **Expected**: 4 sub-tabs hiển thị: plan, workout, history, progress
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_167: FitnessTab onboarding gate: !isOnboarded → chỉ render FitnessOnboarding
- **Pre-conditions**: FitnessTab mounted, isOnboarded=false
- **Steps**:
  1. Kiểm tra render output
- **Expected**: Chỉ FitnessOnboarding render. SubTabBar và panels KHÔNG render
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_168: FitnessTab onboarding gate: isOnboarded → render SubTabBar + panels
- **Pre-conditions**: FitnessTab, isOnboarded=true
- **Steps**:
  1. Kiểm tra render output
- **Expected**: SubTabBar + tabpanels render. FitnessOnboarding KHÔNG render
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_169: FitnessTab workout mode default = 'strength'
- **Pre-conditions**: FitnessTab, isOnboarded=true, sub-tab='workout'
- **Steps**:
  1. Kiểm tra workoutMode
- **Expected**: Default workoutMode = 'strength'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_170: FitnessTab workout mode toggle: strength → cardio
- **Pre-conditions**: FitnessTab, workoutMode='strength'
- **Steps**:
  1. Toggle workout mode sang 'cardio'
- **Expected**: workoutMode = 'cardio'. Cardio component render
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_171: FitnessTab workout mode toggle: cardio → strength
- **Pre-conditions**: FitnessTab, workoutMode='cardio'
- **Steps**:
  1. Toggle workout mode sang 'strength'
- **Expected**: workoutMode = 'strength'. Strength component render
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_172: FitnessTab handleWorkoutComplete → sub-tab chuyển sang 'history'
- **Pre-conditions**: FitnessTab, activeSubTab='workout'
- **Steps**:
  1. Trigger handleWorkoutComplete
- **Expected**: activeSubTab chuyển sang 'history'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_173: FitnessTab handleWorkoutBack → sub-tab chuyển sang 'plan'
- **Pre-conditions**: FitnessTab, activeSubTab='workout'
- **Steps**:
  1. Trigger handleWorkoutBack
- **Expected**: activeSubTab chuyển sang 'plan'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_174: FitnessTab role='tabpanel' trên mỗi tab content area
- **Pre-conditions**: FitnessTab, isOnboarded=true
- **Steps**:
  1. Kiểm tra role attribute trên content areas
- **Expected**: Mỗi tab content area có role='tabpanel'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_175: FitnessTab role='radiogroup' trên workout mode toggle
- **Pre-conditions**: FitnessTab, sub-tab='workout'
- **Steps**:
  1. Kiểm tra workout mode toggle container
- **Expected**: Container có role='radiogroup'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_176: FitnessTab role='radio' trên mỗi mode option
- **Pre-conditions**: FitnessTab workout mode toggle
- **Steps**:
  1. Kiểm tra mỗi option
- **Expected**: Mỗi option có role='radio'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_177: FitnessTab aria-checked đúng trên radio buttons
- **Pre-conditions**: workoutMode='strength'
- **Steps**:
  1. Kiểm tra aria-checked trên radio buttons
- **Expected**: Strength radio: aria-checked='true'. Cardio radio: aria-checked='false'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_178: FitnessTab tabpanel id='tabpanel-{subTabId}' format đúng
- **Pre-conditions**: FitnessTab, activeSubTab='plan'
- **Steps**:
  1. Kiểm tra tabpanel id
- **Expected**: Panel có id='tabpanel-plan'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_179: FitnessTab: onboarding complete → chuyển từ onboarding sang sub-tabs
- **Pre-conditions**: FitnessTab, isOnboarded=false, complete onboarding
- **Steps**:
  1. Complete onboarding flow
  2. Kiểm tra render
- **Expected**: FitnessOnboarding biến mất. SubTabBar + panels hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_180: FitnessTab: giữ sub-tab state khi switch main tab away và back
- **Pre-conditions**: FitnessTab, activeSubTab='workout', chuyển main tab away
- **Steps**:
  1. navigateTab('calendar')
  2. navigateTab('fitness')
  3. Kiểm tra activeSubTab
- **Expected**: activeSubTab vẫn = 'workout' (state preserved)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_181: Dashboard → QuickAction start-workout → WorkoutLogger → popPage → Dashboard
- **Pre-conditions**: Dashboard active
- **Steps**:
  1. Click QuickAction start-workout
  2. Verify WorkoutLogger render
  3. popPage
  4. Verify Dashboard render
- **Expected**: Luồng: Dashboard → WorkoutLogger → pop → Dashboard. State nhất quán
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_182: Dashboard → TodaysPlanCard → WeightLogger → popPage → Dashboard
- **Pre-conditions**: Dashboard active, TodaysPlanCard rest-day
- **Steps**:
  1. Click 'Ghi cân nặng'
  2. Verify WeightLogger
  3. popPage
  4. Verify Dashboard
- **Expected**: Dashboard → WeightLogger → pop → Dashboard
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_183: Dashboard → pushPage WorkoutLogger → navigateTab Fitness → pageStack cleared
- **Pre-conditions**: Dashboard, pageStack=[WorkoutLogger]
- **Steps**:
  1. navigateTab('fitness')
  2. Kiểm tra pageStack
- **Expected**: pageStack = []. showBottomNav = true. Fitness tab render
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_184: Dashboard action → Fitness sub-tab workout → complete → history sub-tab
- **Pre-conditions**: Dashboard active
- **Steps**:
  1. Trigger QuickAction start-workout
  2. navigateTab('fitness')
  3. Switch sub-tab workout
  4. Complete workout
  5. Kiểm tra sub-tab
- **Expected**: Full flow: Dashboard → WorkoutLogger → Fitness → workout → complete → history
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_185: Calendar → Library → Calendar: scroll position restored
- **Pre-conditions**: Calendar, scrolled 500px
- **Steps**:
  1. navigateTab('library')
  2. navigateTab('calendar')
  3. Kiểm tra scroll
- **Expected**: Scroll position = 500px restored
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_186: Settings page: open from header → pushPage → close → return to previous tab
- **Pre-conditions**: activeTab='dashboard'
- **Steps**:
  1. Open settings (pushPage settings)
  2. Close settings (popPage)
  3. Kiểm tra activeTab
- **Expected**: activeTab vẫn = 'dashboard'. Settings page closed
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_187: Deep nav: Dashboard → WorkoutLogger → SetEditor (2 deep) → popPage → WorkoutLogger
- **Pre-conditions**: Dashboard active
- **Steps**:
  1. pushPage WorkoutLogger
  2. pushPage SetEditor
  3. Kiểm tra stack depth
- **Expected**: Stack = [WorkoutLogger, SetEditor], depth = 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_188: Deep nav: pushPage 3 lần → stack vẫn chỉ có 2 pages
- **Pre-conditions**: pageStack = [A, B]
- **Steps**:
  1. pushPage C
  2. Kiểm tra stack
- **Expected**: Stack = [A, C]. B replaced. Length = 2
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_NAV_189: navigateTab trong khi page stack có pages → stack cleared
- **Pre-conditions**: pageStack = [WorkoutLogger], activeTab='dashboard'
- **Steps**:
  1. navigateTab('calendar')
- **Expected**: pageStack = []. activeTab = 'calendar'. showBottomNav = true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_190: Page stack: pushPage A → pushPage B → popPage → A còn trong stack
- **Pre-conditions**: pageStack = []
- **Steps**:
  1. pushPage A
  2. pushPage B
  3. popPage
  4. Kiểm tra stack
- **Expected**: Stack = [A]. B removed. A still present
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_191: Page stack: pushPage A → pushPage B → pushPage C → B replaced by C
- **Pre-conditions**: pageStack = [A, B]
- **Steps**:
  1. pushPage C
  2. Kiểm tra stack
- **Expected**: Stack = [A, C]. B replaced by C (overflow protection)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_NAV_192: Navigation timing: tab switch < 100ms (Performance)
- **Pre-conditions**: App idle
- **Steps**:
  1. Measure time: navigateTab('library')
  2. Kiểm tra timing
- **Expected**: Tab switch hoàn tất trong < 100ms
- **Kết quả test thực tế**: —
- **Type**: Performance | **Priority**: P1

##### TC_NAV_193: Navigation: không có console errors sau 20 tab switches
- **Pre-conditions**: App đã khởi tạo, Console mở
- **Steps**:
  1. Thực hiện 20 tab switches liên tiếp
  2. Kiểm tra console
- **Expected**: Console không có errors hoặc warnings liên quan đến navigation
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_194: URL không thay đổi khi navigate (no react-router)
- **Pre-conditions**: Bất kỳ navigation action
- **Steps**:
  1. Kiểm tra URL trước và sau navigation
- **Expected**: URL không thay đổi, stays at base path (app sử dụng Zustand không phải react-router)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_195: URL stays at / hoặc base path sau mọi navigation
- **Pre-conditions**: Thực hiện nhiều navigations
- **Steps**:
  1. pushPage, popPage, navigateTab
  2. Kiểm tra URL
- **Expected**: URL luôn = '/' hoặc base path
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_196: Android back: page stack 2 pages → popPage → stack 1 page
- **Pre-conditions**: Android, pageStack=[A, B]
- **Steps**:
  1. Nhấn Back vật lý
  2. Kiểm tra stack
- **Expected**: popPage gọi → stack = [A]. showBottomNav = false
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_197: Android back: page stack 1 page → popPage → stack 0, bottomNav hiện
- **Pre-conditions**: Android, pageStack=[A]
- **Steps**:
  1. Nhấn Back vật lý
  2. Kiểm tra stack
- **Expected**: popPage gọi → stack = []. showBottomNav = true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_198: Android back: stack rỗng, activeTab='dashboard' → quay tab trước
- **Pre-conditions**: Android, pageStack=[], activeTab='dashboard'
- **Steps**:
  1. Nhấn Back vật lý
- **Expected**: canGoBack()=false → quay tab trước trong history
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_199: Android back: stack rỗng, activeTab='fitness' → quay tab trước
- **Pre-conditions**: Android, pageStack=[], activeTab='fitness'
- **Steps**:
  1. Nhấn Back vật lý
- **Expected**: Quay về tab trước (ví dụ: dashboard hoặc calendar)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_200: Android back: stack rỗng, activeTab='calendar' → thoát app
- **Pre-conditions**: Android, pageStack=[], activeTab='calendar'
- **Steps**:
  1. Nhấn Back vật lý
- **Expected**: Tab gốc + stack rỗng → thoát app (hoặc minimize)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_201: Android back nhanh 5 lần liên tiếp → state đúng
- **Pre-conditions**: Android, pageStack=[A, B]
- **Steps**:
  1. Nhấn Back 5 lần nhanh liên tiếp
  2. Kiểm tra final state
- **Expected**: Stack cleared, quay về tab, behavior đúng quy tắc. Không crash
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_NAV_202: Focus management: sau pushPage, focus di chuyển tới page mới
- **Pre-conditions**: pushPage WorkoutLogger
- **Steps**:
  1. Verify focus element sau pushPage
- **Expected**: Focus di chuyển tới WorkoutLogger content area
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_203: Focus management: sau popPage, focus quay lại tab content
- **Pre-conditions**: pageStack=[WorkoutLogger], popPage
- **Steps**:
  1. Verify focus element sau popPage
- **Expected**: Focus quay lại tab content hoặc trigger element
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_204: Focus management: sau navigateTab, focus di chuyển tới tab content mới
- **Pre-conditions**: navigateTab('fitness')
- **Steps**:
  1. Verify focus element sau tab switch
- **Expected**: Focus di chuyển tới Fitness tab content area
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_205: Bottom nav hiển thị 5 tab icons/labels
- **Pre-conditions**: App đã khởi tạo
- **Steps**:
  1. Kiểm tra bottom nav render
- **Expected**: 5 tab items render: Calendar, Library, AI-Analysis, Fitness, Dashboard
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_206: Bottom nav ẩn hoàn toàn khi page stack không rỗng
- **Pre-conditions**: pageStack = [WorkoutLogger]
- **Steps**:
  1. Kiểm tra bottom nav visibility
- **Expected**: Bottom nav ẩn hoàn toàn (display:none hoặc transform off-screen)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_207: Bottom nav hiện lại animation smooth khi stack trở về rỗng
- **Pre-conditions**: pageStack=[A] → popPage → stack=[]
- **Steps**:
  1. Kiểm tra bottom nav animation
- **Expected**: Bottom nav hiện lại với animation smooth (slide up hoặc fade in)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_NAV_208: Tab switch giữa 5 tabs: mỗi tab render đúng component chính
- **Pre-conditions**: App đã khởi tạo
- **Steps**:
  1. Lần lượt click 5 tabs
  2. Kiểm tra mỗi tab render component chính
- **Expected**: Calendar→CalendarView, Library→LibraryView, AI-Analysis→AIView, Fitness→FitnessTab, Dashboard→DashboardTab
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_NAV_209: PageEntry structure: id, component, props optional
- **Pre-conditions**: navigationStore
- **Steps**:
  1. Kiểm tra PageEntry interface
- **Expected**: PageEntry có: id (string, required), component (string, required), props (Record<string,unknown>, optional)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_NAV_210: navigateTab với giá trị invalid (not in MainTab type) → ignored/error
- **Pre-conditions**: App đã khởi tạo
- **Steps**:
  1. Gọi navigateTab('invalid-tab' as MainTab)
  2. Kiểm tra behavior
- **Expected**: TypeScript type guard ngăn giá trị invalid. Runtime: ignored hoặc fallback về default tab
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P2

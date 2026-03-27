# Scenario 39: WCAG Accessibility

**Version:** 1.0  
**Date:** 2026-06-12  
**Total Test Cases:** 210

---

## Mô tả tổng quan

WCAG Accessibility là scenario kiểm thử toàn diện tính năng trợ năng (accessibility) của ứng dụng Smart Meal Planner theo tiêu chuẩn WCAG 2.1 Level AA. Ứng dụng triển khai hệ thống ARIA phong phú trải dài trên 16+ component chính bao gồm: `aria-label`, `aria-hidden`, `aria-expanded`, `aria-checked`, `aria-pressed`, `aria-valuenow/min/max`, `aria-modal`, `aria-current` cùng các semantic role như `progressbar`, `alert`, `dialog`, `radiogroup`, `radio`, `tabpanel`, `button`. Hệ thống hỗ trợ điều hướng bàn phím đầy đủ (Enter/Space trên role="button", Escape đóng modal theo stack), quản lý focus chuyên nghiệp (focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2), touch target tối thiểu 44px (min-h-11, h-11 w-11), và tôn trọng chế độ giảm chuyển động (prefers-reduced-motion) thông qua hook useReducedMotion(). ModalBackdrop triển khai scroll lock reference-counted và Escape key stack-based đảm bảo chỉ modal trên cùng phản hồi. Tất cả icon/SVG trang trí đều được đánh dấu aria-hidden="true", text ẩn cho screen reader sử dụng class sr-only. Scenario này xác thực rằng mọi thành phần UI đều tuân thủ các tiêu chí WCAG: 1.1.1 (text alternatives), 1.3.1 (semantic structure), 1.4.1 (color not sole indicator), 1.4.3 (contrast ratio), 2.1.1 (keyboard accessible), 2.4.7 (focus visible), 2.5.5 (touch target size), 4.1.2 (name/role/value).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| WorkoutHistory | src/features/fitness/components/WorkoutHistory.tsx | Lịch sử tập luyện — aria-expanded, aria-pressed, aria-label trên filter/toggle, aria-hidden trên icon |
| ProgressDashboard | src/features/fitness/components/ProgressDashboard.tsx | Dashboard tiến trình — role="progressbar" với aria-valuenow/min/max, aria-label metric cards, aria-hidden icons |
| RestTimer | src/features/fitness/components/RestTimer.tsx | Bộ đếm nghỉ — role="dialog" aria-modal="true", role="progressbar" trên SVG ring, aria-label |
| PRToast | src/features/fitness/components/PRToast.tsx | Thông báo PR mới — role="alert", tabIndex={0}, keyboard Enter/Space dismiss |
| MilestonesList | src/features/fitness/components/MilestonesList.tsx | Danh sách mốc — aria-expanded, role="progressbar" với ARIA values, aria-hidden icons |
| TrainingPlanView | src/features/fitness/components/TrainingPlanView.tsx | Kế hoạch tập — aria-hidden trên SVG trang trí, aria-current="date" cho ngày hiện tại |
| TodaysPlanCard | src/features/dashboard/components/TodaysPlanCard.tsx | Card kế hoạch hôm nay — aria-hidden trên tất cả icon/emoji trang trí |
| StreakMini | src/features/dashboard/components/StreakMini.tsx | Widget streak — role="button", tabIndex={0}, aria-label, keyboard Enter/Space, focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 |
| WeightQuickLog | src/features/dashboard/components/WeightQuickLog.tsx | Ghi cân nhanh — role="dialog", aria-label, touch targets 44px (h-11 w-11), aria-label trên stepper buttons |
| AutoAdjustBanner | src/features/dashboard/components/AutoAdjustBanner.tsx | Banner cảnh báo — role="alert", aria-label, aria-hidden icons |
| AdjustmentHistory | src/features/dashboard/components/AdjustmentHistory.tsx | Lịch sử điều chỉnh — aria-expanded, aria-hidden trên tất cả SVG icons |
| EnergyBalanceMini | src/components/nutrition/EnergyBalanceMini.tsx | Cân bằng năng lượng — conditional role="button", tabIndex, aria-label, keyboard Enter, focus:ring-2 |
| ModalBackdrop | src/components/shared/ModalBackdrop.tsx | Nền modal — aria-modal="true", stack-based Escape, reference-counted scroll lock, tabIndex={-1} backdrop |
| FilterBottomSheet | src/components/shared/FilterBottomSheet.tsx | Bottom sheet lọc — kế thừa ModalBackdrop a11y, touch targets min-h-11 (44px) |
| FitnessTab | src/features/fitness/components/FitnessTab.tsx | Tab fitness — role="tabpanel", role="radiogroup", role="radio", aria-checked |
| DashboardTab | src/features/dashboard/components/DashboardTab.tsx | Tab dashboard — useReducedMotion() hook, prefers-reduced-motion: reduce, conditional animation |
| useReducedMotion | src/features/dashboard/components/DashboardTab.tsx | Hook phát hiện prefers-reduced-motion: reduce, tắt stagger animations |

## Luồng nghiệp vụ

1. Screen reader đọc trang → gặp landmark regions, headings, và ARIA labels trên mọi interactive element
2. User điều hướng bằng Tab → focus di chuyển tuần tự qua các interactive elements với focus ring visible (emerald-500)
3. Gặp role="button" (StreakMini, EnergyBalanceMini) → nhấn Enter hoặc Space để kích hoạt
4. Gặp role="radiogroup" (FitnessTab goal/experience/workout mode) → dùng arrow keys hoặc click để chọn, aria-checked cập nhật
5. Gặp role="progressbar" (ProgressDashboard, RestTimer, MilestonesList) → screen reader đọc aria-valuenow/min/max
6. Mở modal/dialog (RestTimer, WeightQuickLog) → focus trap, aria-modal="true", Escape đóng modal trên cùng (stack-based)
7. Toast alert xuất hiện (PRToast, AutoAdjustBanner) → role="alert" tự động announce cho screen reader
8. Toggle expand/collapse (WorkoutHistory, AdjustmentHistory, MilestonesList) → aria-expanded cập nhật true/false
9. Tất cả decorative icons/SVGs/emojis → aria-hidden="true" ẩn khỏi screen reader
10. User bật prefers-reduced-motion: reduce → DashboardTab tắt stagger animations, trả về empty style
11. Touch targets trên mobile → tất cả buttons tối thiểu 44×44px (min-h-11, h-11 w-11)
12. Color contrast → active buttons emerald-500 text-white đảm bảo ratio ≥ 4.5:1

## Quy tắc nghiệp vụ

1. **WCAG 1.1.1 — Non-text Content**: Mọi icon SVG trang trí phải có aria-hidden="true"; text ẩn cho screen reader dùng class sr-only
2. **WCAG 1.3.1 — Info and Relationships**: Sử dụng semantic roles chính xác: tabpanel cho tab content, radiogroup/radio cho selection groups, progressbar cho progress indicators, dialog cho modals, alert cho thông báo
3. **WCAG 1.4.1 — Use of Color**: Không dùng màu sắc làm phương tiện duy nhất truyền tải thông tin; kết hợp icon, text, và aria-label
4. **WCAG 1.4.3 — Contrast (Minimum)**: Text contrast ratio ≥ 4.5:1 cho normal text, ≥ 3:1 cho large text; emerald-500 (#10b981) trên white background đạt chuẩn
5. **WCAG 2.1.1 — Keyboard**: Mọi chức năng khả dụng qua bàn phím — Enter/Space kích hoạt role="button", Escape đóng modal (stack-based), Tab di chuyển focus
6. **WCAG 2.4.7 — Focus Visible**: Interactive elements phải có focus indicator rõ ràng: focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
7. **WCAG 2.5.5 — Target Size**: Touch targets tối thiểu 44×44 CSS pixels — buttons dùng min-h-11 (44px) hoặc h-11 w-11
8. **WCAG 4.1.2 — Name, Role, Value**: Mọi interactive element phải có accessible name (aria-label), role phù hợp, và value state cập nhật đúng (aria-checked, aria-expanded, aria-pressed, aria-valuenow)
9. **Modal Accessibility**: Dialog phải có role="dialog", aria-modal="true", Escape key handler (stack-based chỉ modal trên cùng phản hồi), scroll lock reference-counted
10. **Reduced Motion**: Khi prefers-reduced-motion: reduce active, tắt mọi animation — useReducedMotion() trả về true → animationDelay empty, loại bỏ class dashboard-stagger
11. **Decorative Elements**: Tất cả emoji, icon trang trí (Flame, Trophy, ChevronDown, AlertTriangle, etc.) phải có aria-hidden="true"
12. **Alert Announcements**: role="alert" elements tự động được screen reader announce khi xuất hiện trong DOM, không cần focus

## Test Cases (55 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_A11Y_01 | WorkoutHistory: aria-expanded toggle khi mở/đóng chi tiết workout | Positive | P0 |
| TC_A11Y_02 | WorkoutHistory: aria-pressed cập nhật trên filter buttons | Positive | P1 |
| TC_A11Y_03 | WorkoutHistory: aria-label mô tả chính xác trên workout toggle | Positive | P1 |
| TC_A11Y_04 | WorkoutHistory: aria-hidden="true" trên tất cả decorative icons | Positive | P1 |
| TC_A11Y_05 | ProgressDashboard: role="progressbar" với aria-valuenow/min/max trên cycle progress | Positive | P0 |
| TC_A11Y_06 | ProgressDashboard: aria-label trên metric cards chứa text mô tả | Positive | P1 |
| TC_A11Y_07 | ProgressDashboard: aria-hidden="true" trên trend icons (TrendingUp/Down/Minus) | Positive | P1 |
| TC_A11Y_08 | ProgressDashboard: aria-valuenow cập nhật dynamic khi progress thay đổi | Positive | P0 |
| TC_A11Y_09 | RestTimer: role="dialog" aria-modal="true" trên timer overlay | Positive | P0 |
| TC_A11Y_10 | RestTimer: role="progressbar" trên SVG progress ring với ARIA values | Positive | P0 |
| TC_A11Y_11 | RestTimer: aria-label i18n mô tả đúng ngôn ngữ hiện tại | Positive | P1 |
| TC_A11Y_12 | RestTimer: aria-hidden="true" trên Timer icon trang trí | Positive | P2 |
| TC_A11Y_13 | PRToast: role="alert" announce tự động khi toast xuất hiện | Positive | P0 |
| TC_A11Y_14 | PRToast: tabIndex={0} cho phép focus bằng Tab | Positive | P1 |
| TC_A11Y_15 | PRToast: keyboard Enter dismiss toast | Positive | P0 |
| TC_A11Y_16 | PRToast: keyboard Space dismiss toast | Positive | P1 |
| TC_A11Y_17 | PRToast: aria-hidden="true" trên Trophy icon | Positive | P2 |
| TC_A11Y_18 | MilestonesList: aria-expanded toggle expand/collapse | Positive | P1 |
| TC_A11Y_19 | MilestonesList: role="progressbar" với aria-valuenow chính xác | Positive | P0 |
| TC_A11Y_20 | MilestonesList: aria-hidden="true" trên CheckCircle và ChevronDown icons | Positive | P2 |
| TC_A11Y_21 | TrainingPlanView: aria-hidden="true" trên decorative SVGs | Positive | P1 |
| TC_A11Y_22 | TrainingPlanView: aria-current="date" đánh dấu ngày hiện tại | Positive | P1 |
| TC_A11Y_23 | TodaysPlanCard: aria-hidden="true" trên tất cả icon/emoji trang trí | Positive | P1 |
| TC_A11Y_24 | StreakMini: role="button" trên interactive container | Positive | P0 |
| TC_A11Y_25 | StreakMini: tabIndex={0} cho phép focus bằng keyboard | Positive | P0 |
| TC_A11Y_26 | StreakMini: keyboard Enter kích hoạt action | Positive | P0 |
| TC_A11Y_27 | StreakMini: keyboard Space kích hoạt action | Positive | P1 |
| TC_A11Y_28 | StreakMini: focus:ring-2 focus:ring-emerald-500 visible khi focus | Positive | P0 |
| TC_A11Y_29 | StreakMini: aria-label mô tả streak count và trạng thái | Positive | P1 |
| TC_A11Y_30 | StreakMini: aria-label khác nhau cho empty state vs active state | Positive | P1 |
| TC_A11Y_31 | WeightQuickLog: role="dialog" aria-label trên modal | Positive | P0 |
| TC_A11Y_32 | WeightQuickLog: touch targets ≥ 44px (h-11 w-11) trên close/stepper buttons | Positive | P0 |
| TC_A11Y_33 | WeightQuickLog: aria-label mô tả chức năng trên decrease/increase buttons | Positive | P1 |
| TC_A11Y_34 | WeightQuickLog: aria-label dynamic trên quick select weight chips | Positive | P1 |
| TC_A11Y_35 | AutoAdjustBanner: role="alert" announce khi banner xuất hiện | Positive | P0 |
| TC_A11Y_36 | AutoAdjustBanner: aria-label mô tả nội dung cảnh báo | Positive | P1 |
| TC_A11Y_37 | AutoAdjustBanner: aria-hidden="true" trên AlertTriangle icon | Positive | P2 |
| TC_A11Y_38 | AdjustmentHistory: aria-expanded cập nhật khi toggle collapse | Positive | P1 |
| TC_A11Y_39 | AdjustmentHistory: aria-hidden="true" trên tất cả status icons (Check, X, TrendingUp/Down) | Positive | P1 |
| TC_A11Y_40 | EnergyBalanceMini: conditional role="button" khi có onTapDetail handler | Positive | P0 |
| TC_A11Y_41 | EnergyBalanceMini: tabIndex={0} chỉ khi interactive | Positive | P1 |
| TC_A11Y_42 | EnergyBalanceMini: keyboard Enter kích hoạt onTapDetail | Positive | P0 |
| TC_A11Y_43 | EnergyBalanceMini: focus:ring-2 visible khi component interactive | Positive | P1 |
| TC_A11Y_44 | EnergyBalanceMini: không có role/tabIndex khi không interactive | Negative | P1 |
| TC_A11Y_45 | ModalBackdrop: aria-modal="true" trên dialog element | Positive | P0 |
| TC_A11Y_46 | ModalBackdrop: Escape key đóng modal trên cùng (stack-based) | Positive | P0 |
| TC_A11Y_47 | ModalBackdrop: nested modals — Escape chỉ đóng modal trên cùng | Edge | P0 |
| TC_A11Y_48 | ModalBackdrop: scroll lock reference-counted — body không scroll khi modal mở | Positive | P1 |
| TC_A11Y_49 | ModalBackdrop: backdrop tabIndex={-1} loại khỏi tab order | Positive | P1 |
| TC_A11Y_50 | FilterBottomSheet: touch targets min-h-11 (44px) trên filter options | Positive | P1 |
| TC_A11Y_51 | FitnessTab: role="tabpanel" trên mỗi tab content area | Positive | P0 |
| TC_A11Y_52 | FitnessTab: role="radiogroup" role="radio" aria-checked trên workout mode toggle | Positive | P0 |
| TC_A11Y_53 | DashboardTab: useReducedMotion() trả về true khi prefers-reduced-motion: reduce | Positive | P0 |
| TC_A11Y_54 | DashboardTab: animations bị tắt hoàn toàn khi reduced motion active | Positive | P0 |
| TC_A11Y_55 | DashboardTab: animations hoạt động bình thường khi reduced motion inactive | Positive | P1 |
| TC_A11Y_56 | DailyScoreHero: text contrast trên gradient background ≥ 4.5:1 | Positive | P0 |
| TC_A11Y_57 | DailyScoreHero: score number contrast trên background ≥ 3:1 (large text) | Positive | P0 |
| TC_A11Y_58 | Progress bar labels: text contrast trên colored bars ≥ 4.5:1 | Positive | P0 |
| TC_A11Y_59 | Muted/secondary text: slate-500 trên white ≥ 4.5:1 | Positive | P0 |
| TC_A11Y_60 | Badge text: text trên colored badge backgrounds ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_61 | Button text: emerald-500 text trên white button ≥ 4.5:1 | Positive | P0 |
| TC_A11Y_62 | Button text: white text trên emerald-500 button ≥ 4.5:1 | Positive | P0 |
| TC_A11Y_63 | Tab label active: contrast trên active tab background ≥ 4.5:1 | Positive | P0 |
| TC_A11Y_64 | Tab label inactive: contrast trên inactive background ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_65 | Toast text: PRToast text contrast trên background ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_66 | Modal text: WeightQuickLog text contrast ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_67 | Card title: TodaysPlanCard title contrast ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_68 | Card body text: contrast ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_69 | Insight card text: AiInsightCard title trên colored bg ≥ 4.5:1 | Positive | P0 |
| TC_A11Y_70 | Insight card message: contrast trên colored bg ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_71 | Banner text: AutoAdjustBanner text contrast ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_72 | History text: AdjustmentHistory text contrast ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_73 | Streak text: StreakMini number contrast ≥ 3:1 (large text) | Positive | P1 |
| TC_A11Y_74 | Form label text: contrast ≥ 4.5:1 trong FitnessOnboarding | Positive | P1 |
| TC_A11Y_75 | Error message text: red text contrast ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_76 | Placeholder text: input placeholder contrast ≥ 4.5:1 | Positive | P2 |
| TC_A11Y_77 | Link text: contrast ≥ 4.5:1 và distinguishable | Positive | P1 |
| TC_A11Y_78 | Disabled button text: contrast ≥ 3:1 (ngoại lệ WCAG) | Positive | P2 |
| TC_A11Y_79 | Dark mode: text contrast vẫn ≥ 4.5:1 | Positive | P1 |
| TC_A11Y_80 | Dark mode: all colored elements maintain contrast ratios | Positive | P1 |
| TC_A11Y_81 | Score tiers: color + label text + icon phân biệt tier | Positive | P0 |
| TC_A11Y_82 | Streak dots: color + icon (✓/🌙/📍/○) phân biệt trạng thái | Positive | P0 |
| TC_A11Y_83 | Progress bars: color + percentage text hiển thị tiến độ | Positive | P0 |
| TC_A11Y_84 | Filter active state: color + underline/bold phân biệt | Positive | P0 |
| TC_A11Y_85 | Applied/Declined status: color + icon (Check/X) phân biệt | Positive | P0 |
| TC_A11Y_86 | Trend indicators: color + icon (TrendingUp/Down) phân biệt | Positive | P1 |
| TC_A11Y_87 | Tab active: color + visual indicator (underline/bold) phân biệt | Positive | P0 |
| TC_A11Y_88 | Workout mode toggle: color + text label + aria-checked phân biệt | Positive | P0 |
| TC_A11Y_89 | PR flag: color + icon + text 'PR' phân biệt | Positive | P1 |
| TC_A11Y_90 | Error state: color + icon + text message phân biệt | Positive | P1 |
| TC_A11Y_91 | Success state: color + icon + text phân biệt | Positive | P1 |
| TC_A11Y_92 | Insight priority: color + type text + icon phân biệt | Positive | P1 |
| TC_A11Y_93 | Badge types: color + text label phân biệt 'Tự động'/'Thủ công' | Positive | P1 |
| TC_A11Y_94 | Milestone complete: color + check icon + text phân biệt | Positive | P1 |
| TC_A11Y_95 | Rest day vs training day: color + icon + text phân biệt | Positive | P1 |
| TC_A11Y_96 | Bottom nav tab buttons: height ≥ 44px | Positive | P0 |
| TC_A11Y_97 | QuickActionsBar primary button: height ≥ 44px (56px actual) | Positive | P0 |
| TC_A11Y_98 | QuickActionsBar secondary buttons: height ≥ 44px (48px actual) | Positive | P0 |
| TC_A11Y_99 | TodaysPlanCard CTA buttons: height ≥ 44px | Positive | P0 |
| TC_A11Y_100 | WeightQuickLog stepper buttons (+/-): size ≥ 44×44px (h-11 w-11) | Positive | P0 |
| TC_A11Y_101 | RestTimer control buttons: size ≥ 44×44px | Positive | P0 |
| TC_A11Y_102 | PRToast dismiss area: touch target ≥ 44px | Positive | P1 |
| TC_A11Y_103 | WorkoutHistory toggle buttons: height ≥ 44px | Positive | P0 |
| TC_A11Y_104 | WorkoutHistory filter buttons: height ≥ 44px (min-h-11) | Positive | P0 |
| TC_A11Y_105 | AdjustmentHistory toggle button: height ≥ 44px | Positive | P1 |
| TC_A11Y_106 | AiInsightCard dismiss button: size ≥ 44×44px | Positive | P0 |
| TC_A11Y_107 | AiInsightCard action button: height ≥ 44px | Positive | P0 |
| TC_A11Y_108 | AutoAdjustBanner buttons (Áp dụng/Bỏ qua): height ≥ 44px | Positive | P0 |
| TC_A11Y_109 | FitnessOnboarding radio buttons: size ≥ 44px | Positive | P0 |
| TC_A11Y_110 | FitnessOnboarding checkbox items: size ≥ 44px | Positive | P0 |
| TC_A11Y_111 | Modal close button: size ≥ 44×44px | Positive | P0 |
| TC_A11Y_112 | FilterBottomSheet option items: height ≥ 44px (min-h-11) | Positive | P0 |
| TC_A11Y_113 | StreakMini button: touch target ≥ 44px | Positive | P1 |
| TC_A11Y_114 | EnergyBalanceMini clickable area: ≥ 44px | Positive | P1 |
| TC_A11Y_115 | SubTabBar tab items: height ≥ 44px | Positive | P0 |
| TC_A11Y_116 | SetEditor RPE buttons: size ≥ 44px | Positive | P1 |
| TC_A11Y_117 | WeightLogger input stepper: ≥ 44px | Positive | P1 |
| TC_A11Y_118 | CardioLogger buttons: ≥ 44px | Positive | P1 |
| TC_A11Y_119 | TrainingPlanView day buttons: ≥ 44px | Positive | P1 |
| TC_A11Y_120 | MilestonesList expand buttons: ≥ 44px | Positive | P1 |
| TC_A11Y_121 | Tab key: focus cycles qua tất cả interactive elements trên Dashboard | Positive | P0 |
| TC_A11Y_122 | Tab key: focus cycles qua tất cả interactive elements trên Fitness tab | Positive | P0 |
| TC_A11Y_123 | Focus ring visible: emerald-500 ring trên focused button | Positive | P0 |
| TC_A11Y_124 | Focus ring: focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 | Positive | P0 |
| TC_A11Y_125 | Focus order: matches visual order trên Dashboard | Positive | P0 |
| TC_A11Y_126 | Focus order: matches visual order trên Fitness tab | Positive | P0 |
| TC_A11Y_127 | Modal focus trap: RestTimer — Tab không thoát ra ngoài modal | Positive | P0 |
| TC_A11Y_128 | Modal focus trap: WeightQuickLog — Tab cycle trong modal | Positive | P0 |
| TC_A11Y_129 | Modal focus trap: FilterBottomSheet — focus trapped | Positive | P0 |
| TC_A11Y_130 | Focus returns: đóng RestTimer → focus quay lại trigger button | Positive | P0 |
| TC_A11Y_131 | Focus returns: đóng WeightQuickLog → focus quay lại trigger | Positive | P0 |
| TC_A11Y_132 | Focus returns: đóng FilterBottomSheet → focus quay lại trigger | Positive | P1 |
| TC_A11Y_133 | StreakMini: role='button' → Enter kích hoạt | Positive | P0 |
| TC_A11Y_134 | StreakMini: role='button' → Space kích hoạt | Positive | P0 |
| TC_A11Y_135 | EnergyBalanceMini: conditional role='button' → keyboard accessible | Positive | P1 |
| TC_A11Y_136 | PRToast: tabIndex={0} → focusable | Positive | P1 |
| TC_A11Y_137 | PRToast: Enter/Space → dismiss toast | Positive | P1 |
| TC_A11Y_138 | Escape key: đóng modal trên cùng (stack-based) | Positive | P0 |
| TC_A11Y_139 | Escape key: 2 modals open → chỉ đóng modal trên cùng | Positive | P0 |
| TC_A11Y_140 | Escape key: 1 modal open → đóng, focus quay về | Positive | P0 |
| TC_A11Y_141 | ModalBackdrop: scroll lock reference-counted | Positive | P1 |
| TC_A11Y_142 | ModalBackdrop: 2 modals → scroll lock vẫn active sau đóng 1 | Positive | P1 |
| TC_A11Y_143 | ModalBackdrop: đóng modal cuối → scroll unlock | Positive | P1 |
| TC_A11Y_144 | ModalBackdrop: tabIndex={-1} trên backdrop (không focusable) | Positive | P1 |
| TC_A11Y_145 | Shift+Tab: focus di chuyển ngược đúng thứ tự | Positive | P1 |
| TC_A11Y_146 | AutoAdjustBanner: role='alert' tự động announce cho screen reader | Positive | P0 |
| TC_A11Y_147 | AiInsightCard: role='region' với aria-label descriptive | Positive | P0 |
| TC_A11Y_148 | RestTimer: role='dialog' aria-modal='true' | Positive | P0 |
| TC_A11Y_149 | WeightQuickLog: role='dialog' aria-label descriptive | Positive | P0 |
| TC_A11Y_150 | PRToast: role='alert' announce khi xuất hiện | Positive | P0 |
| TC_A11Y_151 | ProgressDashboard cycle: role='progressbar' aria-valuenow/min/max | Positive | P0 |
| TC_A11Y_152 | RestTimer ring: role='progressbar' aria-valuenow cập nhật countdown | Positive | P0 |
| TC_A11Y_153 | MilestonesList progress: role='progressbar' với ARIA values | Positive | P0 |
| TC_A11Y_154 | FitnessTab: role='tabpanel' trên content areas | Positive | P0 |
| TC_A11Y_155 | FitnessTab: role='radiogroup' trên goal selector | Positive | P0 |
| TC_A11Y_156 | FitnessTab: role='radio' trên goal options | Positive | P0 |
| TC_A11Y_157 | FitnessTab: aria-checked cập nhật khi select option | Positive | P0 |
| TC_A11Y_158 | FitnessTab: role='radiogroup' trên experience selector | Positive | P1 |
| TC_A11Y_159 | FitnessTab: role='radiogroup' trên workout days selector | Positive | P1 |
| TC_A11Y_160 | FitnessTab: role='checkbox' trên equipment selection | Positive | P1 |
| TC_A11Y_161 | WorkoutHistory: aria-expanded toggle đúng true/false | Positive | P0 |
| TC_A11Y_162 | AdjustmentHistory: aria-expanded toggle đúng | Positive | P0 |
| TC_A11Y_163 | MilestonesList: aria-expanded trên milestone items | Positive | P1 |
| TC_A11Y_164 | TrainingPlanView: aria-current='date' cho ngày hiện tại | Positive | P1 |
| TC_A11Y_165 | WorkoutHistory: aria-pressed trên active filter | Positive | P1 |
| TC_A11Y_166 | SetEditor: role='group' với aria-label trên RPE section | Positive | P1 |
| TC_A11Y_167 | Icon-only button: WeightQuickLog +/- buttons có aria-label | Positive | P0 |
| TC_A11Y_168 | Icon-only button: AiInsightCard dismiss có aria-label | Positive | P0 |
| TC_A11Y_169 | Icon-only button: modal close button có aria-label | Positive | P0 |
| TC_A11Y_170 | Icon-only button: filter toggle có aria-label | Positive | P1 |
| TC_A11Y_171 | Dashboard heading hierarchy: h1 → h2 → h3 đúng thứ tự | Positive | P0 |
| TC_A11Y_172 | Fitness heading hierarchy: h1/h2/h3 đúng thứ tự | Positive | P0 |
| TC_A11Y_173 | Không skip heading level (ví dụ: h1 → h3 thiếu h2) | Positive | P1 |
| TC_A11Y_174 | Lists: repeated items dùng ul/li hoặc ol/li | Positive | P1 |
| TC_A11Y_175 | Navigation: bottom nav dùng nav element | Positive | P1 |
| TC_A11Y_176 | Main content: sử dụng main element | Positive | P1 |
| TC_A11Y_177 | Decorative: AlertTriangle icon có aria-hidden='true' | Positive | P0 |
| TC_A11Y_178 | Decorative: Flame icon có aria-hidden='true' | Positive | P1 |
| TC_A11Y_179 | Decorative: Trophy icon có aria-hidden='true' | Positive | P1 |
| TC_A11Y_180 | Decorative: tất cả Lucide icons trang trí có aria-hidden='true' | Positive | P0 |
| TC_A11Y_181 | Decorative: emoji trong TodaysPlanCard có aria-hidden='true' | Positive | P1 |
| TC_A11Y_182 | Decorative: emoji trong recovery tips có aria-hidden='true' | Positive | P1 |
| TC_A11Y_183 | sr-only class: text ẩn cho screen reader sử dụng đúng | Positive | P1 |
| TC_A11Y_184 | Images: meaningful images có alt text | Positive | P0 |
| TC_A11Y_185 | Images: decorative images có aria-hidden='true' hoặc alt='' | Positive | P0 |
| TC_A11Y_186 | Live regions: toast notifications có role='alert' | Positive | P0 |
| TC_A11Y_187 | Live regions: score updates announce cho screen reader | Positive | P1 |
| TC_A11Y_188 | Buttons: interactive elements dùng button tag hoặc role='button' | Positive | P0 |
| TC_A11Y_189 | Forms: input fields có associated labels | Positive | P0 |
| TC_A11Y_190 | Forms: required fields có aria-required='true' | Positive | P1 |
| TC_A11Y_191 | prefers-reduced-motion: reduce → useReducedMotion() trả về true | Positive | P0 |
| TC_A11Y_192 | prefers-reduced-motion: no-preference → useReducedMotion() trả về false | Positive | P0 |
| TC_A11Y_193 | Reduced motion active: DashboardTab tắt stagger animations | Positive | P0 |
| TC_A11Y_194 | Reduced motion active: animationDelay trả về empty style | Positive | P0 |
| TC_A11Y_195 | Reduced motion active: loại bỏ class 'dashboard-stagger' | Positive | P0 |
| TC_A11Y_196 | Reduced motion active: tất cả CSS transitions instant (duration=0) | Positive | P1 |
| TC_A11Y_197 | Reduced motion active: progress bar animations disabled | Positive | P1 |
| TC_A11Y_198 | Reduced motion active: toast entrance animation disabled | Positive | P1 |
| TC_A11Y_199 | Reduced motion active: modal open/close animation disabled | Positive | P1 |
| TC_A11Y_200 | Reduced motion inactive: animations hoạt động bình thường | Positive | P0 |
| TC_A11Y_201 | Reduced motion inactive: stagger delays áp dụng đúng | Positive | P1 |
| TC_A11Y_202 | Dark mode: tất cả text vẫn readable (contrast ≥ 4.5:1) | Positive | P1 |
| TC_A11Y_203 | Dark mode: focus rings vẫn visible | Positive | P1 |
| TC_A11Y_204 | Dark mode: decorative icons vẫn có aria-hidden='true' | Positive | P2 |
| TC_A11Y_205 | Screen reader: DashboardTab content đọc được đầy đủ | Positive | P0 |
| TC_A11Y_206 | Screen reader: FitnessTab navigation đọc được | Positive | P0 |
| TC_A11Y_207 | Screen reader: progressbar values đọc đúng (aria-valuenow) | Positive | P0 |
| TC_A11Y_208 | Screen reader: alert messages tự động announce | Positive | P0 |
| TC_A11Y_209 | Screen reader: dialog content accessible sau focus trap | Positive | P0 |
| TC_A11Y_210 | Toàn bộ app: không có ARIA misuse (invalid roles/properties) | Positive | P0 |

---

## Chi tiết Test Cases

##### TC_A11Y_01: WorkoutHistory — aria-expanded toggle khi mở/đóng chi tiết workout
- **Pre-conditions**: Tab Fitness active, sub-tab "Lịch sử" hiển thị, có ít nhất 1 workout entry trong danh sách
- **Steps**:
  1. Mở app tại localhost:3000, chuyển sang tab Fitness → sub-tab "Lịch sử"
  2. Xác nhận workout entry có nút toggle với attribute aria-expanded="false"
  3. Click nút toggle để mở chi tiết workout
  4. Kiểm tra attribute aria-expanded trên nút toggle
  5. Click lại nút toggle để đóng chi tiết
  6. Kiểm tra lại attribute aria-expanded
- **Expected Result**: Ban đầu aria-expanded="false". Sau khi click mở → aria-expanded="true". Sau khi click đóng → aria-expanded="false". Giá trị phản ánh chính xác trạng thái hiển thị nội dung chi tiết. Screen reader announce "expanded" hoặc "collapsed" tương ứng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_02: WorkoutHistory — aria-pressed cập nhật trên filter buttons
- **Pre-conditions**: Tab "Lịch sử" hiển thị, có nhiều filter buttons (ví dụ: All, Strength, Cardio)
- **Steps**:
  1. Quan sát tất cả filter buttons, xác nhận mỗi button có attribute aria-pressed
  2. Xác nhận filter mặc định có aria-pressed="true", các filter còn lại aria-pressed="false"
  3. Click một filter khác (ví dụ: "Strength")
  4. Kiểm tra aria-pressed trên tất cả filter buttons
- **Expected Result**: Filter vừa click có aria-pressed="true", tất cả filter khác có aria-pressed="false". Chỉ đúng 1 filter có aria-pressed="true" tại mọi thời điểm. Screen reader đọc được trạng thái pressed/not pressed
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_03: WorkoutHistory — aria-label mô tả chính xác trên workout toggle
- **Pre-conditions**: Tab "Lịch sử" hiển thị, có workout entries
- **Steps**:
  1. Inspect nút toggle của workout entry bằng DevTools
  2. Đọc giá trị aria-label
  3. Đổi ngôn ngữ sang tiếng Anh
  4. Kiểm tra lại aria-label
- **Expected Result**: aria-label chứa thông tin mô tả workout (ví dụ: tên bài tập, ngày tập) bằng ngôn ngữ hiện tại. Khi đổi ngôn ngữ, aria-label cập nhật theo ngôn ngữ mới thông qua hệ thống i18n
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_04: WorkoutHistory — aria-hidden="true" trên tất cả decorative icons
- **Pre-conditions**: Tab "Lịch sử" hiển thị đầy đủ nội dung
- **Steps**:
  1. Inspect tất cả icon SVGs trong WorkoutHistory: ClipboardList, ChevronUp, ChevronDown, Clock, StickyNote
  2. Kiểm tra attribute aria-hidden trên từng icon
  3. Xác nhận không có icon trang trí nào thiếu aria-hidden
- **Expected Result**: Tất cả decorative icons có aria-hidden="true". Screen reader bỏ qua hoàn toàn các icons này, chỉ đọc text content có ý nghĩa. Không có icon nào bị thiếu attribute aria-hidden
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_05: ProgressDashboard — role="progressbar" với aria-valuenow/min/max trên cycle progress
- **Pre-conditions**: Tab Fitness → sub-tab "Tiến trình" hiển thị, có dữ liệu cycle progress
- **Steps**:
  1. Mở sub-tab "Tiến trình" trong FitnessTab
  2. Tìm cycle progress bar element
  3. Kiểm tra attribute role trên progress bar
  4. Kiểm tra attributes aria-valuenow, aria-valuemin, aria-valuemax
  5. Xác nhận giá trị aria-valuenow phản ánh đúng phần trăm hiện tại
- **Expected Result**: Progress bar có role="progressbar", aria-valuemin="0", aria-valuemax="100", aria-valuenow={percentComplete} là số từ 0-100 phản ánh đúng tiến trình thực tế. Có aria-label mô tả ý nghĩa (ví dụ: "Tiến trình chu kỳ"). Screen reader đọc "progressbar, X percent"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_06: ProgressDashboard — aria-label trên metric cards chứa text mô tả
- **Pre-conditions**: Sub-tab "Tiến trình" hiển thị, có dữ liệu metrics
- **Steps**:
  1. Inspect từng metric card (ví dụ: Total Volume, Max Weight, Workout Count)
  2. Kiểm tra attribute aria-label trên container card
  3. Xác nhận text trong aria-label mô tả đầy đủ metric và giá trị
- **Expected Result**: Mỗi metric card có aria-label chứa translation key tương ứng từ hệ thống i18n, mô tả rõ tên metric. Screen reader đọc được ý nghĩa card mà không cần nhìn visual layout
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_07: ProgressDashboard — aria-hidden="true" trên trend icons
- **Pre-conditions**: Sub-tab "Tiến trình" hiển thị, metric cards có trend indicators
- **Steps**:
  1. Quan sát trend icons: TrendingUp (↑), TrendingDown (↓), Minus (−)
  2. Inspect attribute aria-hidden trên từng trend icon
  3. Xác nhận thông tin trend được truyền tải qua cách khác (text hoặc aria-label)
- **Expected Result**: Tất cả trend icons (TrendingUp, TrendingDown, Minus) có aria-hidden="true". Thông tin xu hướng được truyền tải qua text content hoặc aria-label trên parent element, không chỉ qua màu sắc/icon (tuân thủ WCAG 1.4.1)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_08: ProgressDashboard — aria-valuenow cập nhật dynamic khi progress thay đổi
- **Pre-conditions**: Sub-tab "Tiến trình" hiển thị, cycle progress đang tracking
- **Steps**:
  1. Ghi nhận giá trị aria-valuenow ban đầu trên progressbar
  2. Thực hiện hành động tăng progress (log workout mới)
  3. Quay lại sub-tab "Tiến trình"
  4. Kiểm tra giá trị aria-valuenow mới
- **Expected Result**: aria-valuenow cập nhật phản ánh đúng phần trăm tiến trình mới sau khi log workout. Giá trị luôn nằm trong khoảng [aria-valuemin, aria-valuemax] tức [0, 100]. Screen reader announce giá trị mới khi re-read element
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_09: RestTimer — role="dialog" aria-modal="true" trên timer overlay
- **Pre-conditions**: Đang trong phiên tập luyện, có thể trigger rest timer
- **Steps**:
  1. Bắt đầu rest timer sau khi hoàn thành một set
  2. Kiểm tra rest timer overlay element xuất hiện
  3. Inspect attribute role và aria-modal trên overlay container
  4. Xác nhận dialog che phủ nội dung phía dưới
- **Expected Result**: Rest timer overlay có role="dialog" và aria-modal="true". Screen reader announce đây là modal dialog. Focus bị giới hạn trong dialog, không thoát ra ngoài bằng Tab. Nội dung phía sau bị ẩn khỏi assistive technology
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_10: RestTimer — role="progressbar" trên SVG progress ring với ARIA values
- **Pre-conditions**: Rest timer đang hiển thị và đếm ngược
- **Steps**:
  1. Inspect SVG progress ring trong rest timer
  2. Kiểm tra attribute role="progressbar"
  3. Kiểm tra aria-valuenow, aria-valuemin="0", aria-valuemax="100"
  4. Quan sát aria-valuenow thay đổi khi timer đếm ngược
- **Expected Result**: SVG ring có role="progressbar", aria-valuemin="0", aria-valuemax="100". aria-valuenow = Math.round(progress * 100) cập nhật realtime khi timer đếm. Có aria-label mô tả đây là timer nghỉ. Screen reader có thể đọc phần trăm thời gian còn lại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_11: RestTimer — aria-label i18n mô tả đúng ngôn ngữ hiện tại
- **Pre-conditions**: Rest timer hiển thị
- **Steps**:
  1. Kiểm tra aria-label trên dialog container khi ngôn ngữ là tiếng Việt
  2. Đổi ngôn ngữ sang tiếng Anh trong Settings
  3. Trigger rest timer lại
  4. Kiểm tra aria-label trên dialog container
- **Expected Result**: aria-label sử dụng translation key t('fitness.timer.rest'), hiển thị đúng ngôn ngữ: tiếng Việt → "Nghỉ giữa hiệp" (hoặc tương tự), tiếng Anh → "Rest Timer" (hoặc tương tự). Label luôn có ý nghĩa trong ngôn ngữ hiện tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_12: RestTimer — aria-hidden="true" trên Timer icon trang trí
- **Pre-conditions**: Rest timer hiển thị
- **Steps**:
  1. Inspect Timer icon (lucide-react Timer) trong rest timer header
  2. Kiểm tra attribute aria-hidden
- **Expected Result**: Timer icon có aria-hidden="true". Screen reader không đọc icon này, chỉ đọc text label đi kèm
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_A11Y_13: PRToast — role="alert" announce tự động khi toast xuất hiện
- **Pre-conditions**: Đang trong phiên tập, đạt PR mới (personal record)
- **Steps**:
  1. Thực hiện hành động trigger PR mới (vượt max weight/reps)
  2. Quan sát PRToast xuất hiện
  3. Inspect attribute role trên toast element
  4. Kiểm tra screen reader có tự động announce nội dung toast
- **Expected Result**: PRToast element có role="alert". Khi toast xuất hiện trong DOM, screen reader tự động announce nội dung mà không cần user focus vào element. Đây là live region implicit (role="alert" = aria-live="assertive")
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_14: PRToast — tabIndex={0} cho phép focus bằng Tab
- **Pre-conditions**: PRToast đang hiển thị
- **Steps**:
  1. Khi toast hiển thị, nhấn Tab nhiều lần để navigate
  2. Xác nhận focus đến được toast element
  3. Inspect tabIndex attribute trên toast element
- **Expected Result**: Toast element có tabIndex={0}, nằm trong tab order tự nhiên. User có thể Tab đến toast. Khi focus, toast hiển thị focus indicator (outline hoặc ring)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_15: PRToast — keyboard Enter dismiss toast
- **Pre-conditions**: PRToast đang hiển thị và đang có focus
- **Steps**:
  1. Focus vào PRToast element (Tab đến toast)
  2. Nhấn phím Enter
  3. Quan sát toast sau khi nhấn Enter
- **Expected Result**: Nhấn Enter khi focus trên toast → toast bị dismiss (biến mất hoặc trigger animation close). Hành vi tương đương click vào toast. Không có side effect không mong muốn
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_16: PRToast — keyboard Space dismiss toast
- **Pre-conditions**: PRToast đang hiển thị và đang có focus
- **Steps**:
  1. Focus vào PRToast element (Tab đến toast)
  2. Nhấn phím Space
  3. Quan sát toast sau khi nhấn Space
- **Expected Result**: Nhấn Space khi focus trên toast → toast bị dismiss giống như nhấn Enter. Cả Enter và Space đều hoạt động trên role="alert" có keyboard handler, tuân thủ WCAG 2.1.1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_17: PRToast — aria-hidden="true" trên Trophy icon
- **Pre-conditions**: PRToast đang hiển thị
- **Steps**:
  1. Inspect Trophy icon (lucide-react Trophy) trong toast
  2. Kiểm tra attribute aria-hidden
- **Expected Result**: Trophy icon có aria-hidden="true". Screen reader chỉ đọc text content của toast (thông báo PR mới), bỏ qua icon trang trí
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_A11Y_18: MilestonesList — aria-expanded toggle expand/collapse
- **Pre-conditions**: Tab "Tiến trình" hiển thị, MilestonesList có ít nhất 1 milestone
- **Steps**:
  1. Tìm nút toggle của MilestonesList
  2. Kiểm tra aria-expanded ban đầu (collapsed state)
  3. Click nút toggle để expand
  4. Kiểm tra aria-expanded
  5. Click lại để collapse
  6. Kiểm tra aria-expanded
- **Expected Result**: Collapsed state → aria-expanded="false". Expanded state → aria-expanded="true". Giá trị toggle chính xác theo trạng thái hiển thị danh sách milestones
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_19: MilestonesList — role="progressbar" với aria-valuenow chính xác
- **Pre-conditions**: MilestonesList expanded, có milestone với progress data
- **Steps**:
  1. Tìm progress bar element trong MilestonesList
  2. Kiểm tra role="progressbar"
  3. Kiểm tra aria-valuenow, aria-valuemin, aria-valuemax
  4. So sánh aria-valuenow với phần trăm progress hiển thị trên UI
- **Expected Result**: Progress bar có role="progressbar", aria-valuemin="0", aria-valuemax="100". aria-valuenow phản ánh đúng phần trăm tiến trình milestone hiện tại. Có aria-label mô tả (ví dụ: t('fitness.gamification.nextMilestone'))
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_20: MilestonesList — aria-hidden="true" trên CheckCircle và ChevronDown icons
- **Pre-conditions**: MilestonesList hiển thị
- **Steps**:
  1. Inspect CheckCircle icon (completed milestone indicator)
  2. Inspect ChevronDown icon (expand/collapse indicator)
  3. Kiểm tra aria-hidden trên từng icon
- **Expected Result**: CheckCircle và ChevronDown icons đều có aria-hidden="true". Trạng thái completed/expand được truyền tải qua text hoặc aria attributes khác, không phụ thuộc vào icon
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_A11Y_21: TrainingPlanView — aria-hidden="true" trên decorative SVGs
- **Pre-conditions**: Tab Fitness → sub-tab "Kế hoạch" hiển thị
- **Steps**:
  1. Inspect tất cả decorative SVG/icon elements trong TrainingPlanView
  2. Kiểm tra aria-hidden attribute trên từng element
  3. Đếm số icons và so sánh với số aria-hidden="true"
- **Expected Result**: Tất cả decorative SVG icons có aria-hidden="true". Không có icon trang trí nào bị thiếu attribute. Screen reader chỉ đọc text content có ý nghĩa trong training plan view
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_22: TrainingPlanView — aria-current="date" đánh dấu ngày hiện tại
- **Pre-conditions**: TrainingPlanView hiển thị calendar strip
- **Steps**:
  1. Inspect calendar strip/day pills trong TrainingPlanView
  2. Tìm element cho ngày hiện tại (today)
  3. Kiểm tra attribute aria-current
  4. Xác nhận chỉ có 1 element duy nhất có aria-current="date"
- **Expected Result**: Đúng 1 element (ngày hiện tại) có aria-current="date". Các ngày khác không có attribute aria-current. Screen reader announce "current date" khi navigate đến ngày hiện tại, giúp user biết vị trí temporal
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_23: TodaysPlanCard — aria-hidden="true" trên tất cả icon/emoji trang trí
- **Pre-conditions**: Dashboard hiển thị, TodaysPlanCard visible
- **Steps**:
  1. Inspect tất cả icons trong TodaysPlanCard: UtensilsCrossed, Dumbbell, CheckCircle, Play
  2. Inspect tất cả emoji elements (nếu có)
  3. Kiểm tra aria-hidden attribute trên từng element trang trí
  4. Đếm tổng decorative elements vs aria-hidden="true" count
- **Expected Result**: Tất cả decorative icons và emojis có aria-hidden="true" (xác nhận ≥ 6 instances). Screen reader bỏ qua hoàn toàn, chỉ đọc text labels và CTA buttons
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_24: StreakMini — role="button" trên interactive container
- **Pre-conditions**: Dashboard hiển thị, StreakMini widget visible
- **Steps**:
  1. Inspect StreakMini container element
  2. Kiểm tra attribute role
  3. Xác nhận element không phải native <button> nhưng có role="button"
- **Expected Result**: Container element có role="button". Screen reader announce đây là button, cho user biết element có thể tương tác được. role="button" present ở cả empty state và active state
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_25: StreakMini — tabIndex={0} cho phép focus bằng keyboard
- **Pre-conditions**: Dashboard hiển thị, StreakMini visible
- **Steps**:
  1. Từ element trước StreakMini, nhấn Tab
  2. Xác nhận focus di chuyển đến StreakMini
  3. Inspect tabIndex attribute
- **Expected Result**: StreakMini có tabIndex={0}, nằm trong natural tab order. Khi focus, element hiển thị focus ring visible. User có thể navigate đến widget chỉ bằng keyboard
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_26: StreakMini — keyboard Enter kích hoạt action
- **Pre-conditions**: StreakMini có focus (tabbed to)
- **Steps**:
  1. Focus vào StreakMini bằng Tab
  2. Nhấn phím Enter
  3. Quan sát hành vi sau khi nhấn Enter
- **Expected Result**: Nhấn Enter trigger cùng hành vi như click (navigate hoặc toggle detail). onKeyDown handler xử lý event.key === 'Enter' → gọi onClick handler. Không có side effect không mong muốn
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_27: StreakMini — keyboard Space kích hoạt action
- **Pre-conditions**: StreakMini có focus (tabbed to)
- **Steps**:
  1. Focus vào StreakMini bằng Tab
  2. Nhấn phím Space
  3. Quan sát hành vi sau khi nhấn Space
- **Expected Result**: Nhấn Space trigger cùng hành vi như Enter và click. Trang không scroll xuống (default behavior của Space bị preventDefault). Cả Enter và Space đều hoạt động trên role="button" theo WCAG 2.1.1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_28: StreakMini — focus:ring-2 focus:ring-emerald-500 visible khi focus
- **Pre-conditions**: StreakMini visible trên dashboard
- **Steps**:
  1. Tab đến StreakMini
  2. Quan sát visual focus indicator
  3. Kiểm tra CSS classes trên element: focus:ring-2, focus:ring-emerald-500, focus:ring-offset-2
  4. Xác nhận ring color contrasts với background
- **Expected Result**: Khi focus, hiển thị ring 2px màu emerald-500 (#10b981) với offset 2px. Focus ring rõ ràng, phân biệt được với background cả light mode và dark mode. Tuân thủ WCAG 2.4.7 — focus indicator visible với contrast ratio đủ
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_29: StreakMini — aria-label mô tả streak count và trạng thái
- **Pre-conditions**: StreakMini hiển thị với streak data (ví dụ: 5 ngày streak)
- **Steps**:
  1. Inspect StreakMini container
  2. Đọc giá trị aria-label
  3. Xác nhận label chứa thông tin streak count
- **Expected Result**: aria-label sử dụng translation key t('dashboard.streakMini.a11y', {...}) với interpolated values bao gồm streak count và trạng thái. Screen reader đọc thông tin đầy đủ (ví dụ: "Streak 5 ngày liên tiếp")
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_30: StreakMini — aria-label khác nhau cho empty state vs active state
- **Pre-conditions**: Có thể toggle giữa empty streak (0 ngày) và active streak
- **Steps**:
  1. Khi streak = 0, inspect aria-label → ghi nhận label A
  2. Log workout để tạo streak
  3. Khi streak > 0, inspect aria-label → ghi nhận label B
  4. So sánh label A và label B
- **Expected Result**: Empty state sử dụng translation key t('dashboard.streakMini.a11yEmpty') — khác với active state t('dashboard.streakMini.a11y', {...}). Hai label khác nhau, cung cấp context phù hợp cho từng trạng thái. Screen reader phân biệt được widget chưa có data vs đang tracking
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_31: WeightQuickLog — role="dialog" aria-label trên modal
- **Pre-conditions**: Dashboard hiển thị, có thể mở WeightQuickLog modal
- **Steps**:
  1. Click vào weight widget để mở WeightQuickLog
  2. Inspect modal container element
  3. Kiểm tra role attribute
  4. Kiểm tra aria-label attribute
- **Expected Result**: Modal container có role="dialog" và aria-label sử dụng t('fitness.weight.quickLogTitle'). Screen reader announce "dialog, [title]" khi modal mở. Nội dung phía sau bị ẩn khỏi assistive technology
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_32: WeightQuickLog — touch targets ≥ 44px trên close/stepper buttons
- **Pre-conditions**: WeightQuickLog modal đang mở
- **Steps**:
  1. Inspect nút close (X button) — kiểm tra computed height/width
  2. Inspect nút decrease (−) — kiểm tra computed height/width
  3. Inspect nút increase (+) — kiểm tra computed height/width
  4. Sử dụng DevTools để measure actual pixel sizes
- **Expected Result**: Tất cả buttons có kích thước tối thiểu 44×44 CSS pixels (class h-11 w-11 = 44px). Touch target đủ lớn cho ngón tay thao tác trên mobile. Tuân thủ WCAG 2.5.5 — Target Size (Enhanced). Không có button nào nhỏ hơn 44px ở bất kỳ chiều nào
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_33: WeightQuickLog — aria-label mô tả chức năng trên decrease/increase buttons
- **Pre-conditions**: WeightQuickLog modal đang mở
- **Steps**:
  1. Inspect nút decrease (−)
  2. Kiểm tra aria-label → ghi nhận label
  3. Inspect nút increase (+)
  4. Kiểm tra aria-label → ghi nhận label
  5. Xác nhận labels mô tả rõ chức năng
- **Expected Result**: Nút decrease có aria-label=t('common.decrease') (ví dụ: "Giảm" hoặc "Decrease"). Nút increase có aria-label=t('common.increase') (ví dụ: "Tăng" hoặc "Increase"). Labels i18n-aware, thay đổi theo ngôn ngữ. Screen reader đọc chức năng rõ ràng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_34: WeightQuickLog — aria-label dynamic trên quick select weight chips
- **Pre-conditions**: WeightQuickLog modal đang mở, có danh sách weight chips (ví dụ: 50, 55, 60, 65 kg)
- **Steps**:
  1. Inspect từng weight chip button
  2. Kiểm tra aria-label trên mỗi chip
  3. Xác nhận label chứa giá trị cân nặng và đơn vị
- **Expected Result**: Mỗi chip có aria-label dynamic dạng `${t('fitness.weight.selectWeight')} ${w} ${t('fitness.weight.kg')}` (ví dụ: "Chọn cân nặng 60 kg"). Label unique cho mỗi chip, chứa giá trị cụ thể. Screen reader đọc đầy đủ thông tin khi navigate qua các chips
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_35: AutoAdjustBanner — role="alert" announce khi banner xuất hiện
- **Pre-conditions**: Điều kiện trigger auto-adjust banner (ví dụ: calorie target cần điều chỉnh)
- **Steps**:
  1. Thực hiện hành động trigger AutoAdjustBanner hiển thị
  2. Inspect banner element
  3. Kiểm tra attribute role
  4. Kiểm tra screen reader có tự động announce nội dung
- **Expected Result**: Banner element có role="alert". Khi banner mount vào DOM, screen reader tự động announce nội dung (assertive live region). User không cần Tab đến banner để biết có cảnh báo. Nội dung alert mô tả rõ lý do điều chỉnh
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_36: AutoAdjustBanner — aria-label mô tả nội dung cảnh báo
- **Pre-conditions**: AutoAdjustBanner đang hiển thị
- **Steps**:
  1. Inspect banner container
  2. Kiểm tra aria-label attribute
  3. Xác nhận label mô tả ý nghĩa cảnh báo
- **Expected Result**: Banner có aria-label=t('adjustBanner.ariaLabel') mô tả đầy đủ nội dung cảnh báo bằng ngôn ngữ hiện tại. Label bổ sung cho role="alert" content, giúp screen reader cung cấp context đầy đủ
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_37: AutoAdjustBanner — aria-hidden="true" trên AlertTriangle icon
- **Pre-conditions**: AutoAdjustBanner đang hiển thị
- **Steps**:
  1. Inspect AlertTriangle icon trong banner
  2. Kiểm tra aria-hidden attribute
- **Expected Result**: AlertTriangle icon có aria-hidden="true". Screen reader không đọc icon, chỉ đọc text nội dung cảnh báo. Ý nghĩa cảnh báo đã được truyền tải qua role="alert" và text content
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_A11Y_38: AdjustmentHistory — aria-expanded cập nhật khi toggle collapse
- **Pre-conditions**: Dashboard hiển thị, AdjustmentHistory component visible
- **Steps**:
  1. Tìm nút toggle của AdjustmentHistory
  2. Kiểm tra aria-expanded ban đầu (ví dụ: collapsed → aria-expanded="false")
  3. Click toggle để expand
  4. Kiểm tra aria-expanded → "true"
  5. Click toggle để collapse
  6. Kiểm tra aria-expanded → "false"
- **Expected Result**: aria-expanded phản ánh chính xác trạng thái hiển thị: collapsed = false, expanded = true (note: component dùng !collapsed nên logic đảo). Toggle hoạt động nhất quán. Screen reader announce state change
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_39: AdjustmentHistory — aria-hidden="true" trên tất cả status icons
- **Pre-conditions**: AdjustmentHistory expanded, hiển thị lịch sử điều chỉnh
- **Steps**:
  1. Inspect tất cả status icons: Check (✓), X (✗), TrendingUp (↑), TrendingDown (↓)
  2. Inspect ChevronDown/ChevronUp toggle icons
  3. Kiểm tra aria-hidden trên từng icon
  4. Đếm tổng icons vs aria-hidden count
- **Expected Result**: Tất cả status icons và decorative icons có aria-hidden="true". Trạng thái điều chỉnh (approved/rejected, tăng/giảm) được truyền tải qua text content, không chỉ qua icon. 100% icons được đánh dấu aria-hidden
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_40: EnergyBalanceMini — conditional role="button" khi có onTapDetail handler
- **Pre-conditions**: Dashboard hiển thị, EnergyBalanceMini có prop onTapDetail được truyền vào
- **Steps**:
  1. Inspect EnergyBalanceMini container khi component nhận onTapDetail prop
  2. Kiểm tra attribute role
  3. Xác nhận role="button" present
- **Expected Result**: Khi onTapDetail prop truthy → container có role="button". Component trở thành interactive element, screen reader announce đây là button. Conditional logic: role={onTapDetail ? 'button' : undefined}
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_41: EnergyBalanceMini — tabIndex={0} chỉ khi interactive
- **Pre-conditions**: EnergyBalanceMini có onTapDetail handler
- **Steps**:
  1. Khi onTapDetail truthy, inspect tabIndex → ghi nhận giá trị
  2. Nhấn Tab, xác nhận focus đến được element
- **Expected Result**: Khi onTapDetail truthy → tabIndex={0}, element nằm trong tab order. Kết hợp với role="button" và keyboard handler, tạo thành fully accessible interactive element
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_42: EnergyBalanceMini — keyboard Enter kích hoạt onTapDetail
- **Pre-conditions**: EnergyBalanceMini interactive (có onTapDetail), element có focus
- **Steps**:
  1. Tab đến EnergyBalanceMini
  2. Nhấn Enter
  3. Quan sát hành vi (navigate đến detail view)
- **Expected Result**: Nhấn Enter trigger onTapDetail callback, hành vi giống click. handleKeyDown xử lý event.key === 'Enter'. Keyboard user có thể truy cập đầy đủ chức năng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_43: EnergyBalanceMini — focus:ring-2 visible khi component interactive
- **Pre-conditions**: EnergyBalanceMini interactive, có focus ring CSS classes
- **Steps**:
  1. Tab đến EnergyBalanceMini
  2. Quan sát visual focus indicator
  3. Inspect CSS classes: focus:ring-2, focus:ring-emerald-500, focus:ring-offset-2
- **Expected Result**: Focus ring emerald-500 2px visible khi element nhận focus. Ring offset 2px tạo khoảng cách giữa element và ring. Focus indicator rõ ràng trên cả light và dark backgrounds. Tuân thủ WCAG 2.4.7
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_44: EnergyBalanceMini — không có role/tabIndex khi không interactive
- **Pre-conditions**: EnergyBalanceMini render KHÔNG có onTapDetail prop (display-only mode)
- **Steps**:
  1. Render EnergyBalanceMini mà không truyền onTapDetail
  2. Inspect container element
  3. Kiểm tra attribute role → should be undefined
  4. Kiểm tra tabIndex → should be undefined
  5. Nhấn Tab, xác nhận focus KHÔNG dừng tại element
- **Expected Result**: Khi onTapDetail falsy: role=undefined (không có attribute role), tabIndex=undefined (không trong tab order), aria-label=undefined. Element là static display, không gây nhầm lẫn cho screen reader. Conditional: role={onTapDetail ? 'button' : undefined}
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_A11Y_45: ModalBackdrop — aria-modal="true" trên dialog element
- **Pre-conditions**: Bất kỳ modal nào sử dụng ModalBackdrop đang mở (ví dụ: WeightQuickLog, FilterBottomSheet)
- **Steps**:
  1. Trigger mở một modal sử dụng ModalBackdrop
  2. Inspect <dialog> element
  3. Kiểm tra attribute open, aria-modal
- **Expected Result**: Dialog element có attribute open (native dialog) và aria-modal="true". Kết hợp tạo accessible modal: screen reader biết đây là modal dialog, content phía sau bị ẩn khỏi accessibility tree
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_46: ModalBackdrop — Escape key đóng modal trên cùng (stack-based)
- **Pre-conditions**: Một modal sử dụng ModalBackdrop đang mở
- **Steps**:
  1. Mở modal
  2. Nhấn phím Escape
  3. Quan sát modal đóng
  4. Xác nhận không có side effect (page không navigate, không có error)
- **Expected Result**: Nhấn Escape → modal trên cùng đóng. Stack-based handler đảm bảo chỉ modal cuối cùng mở phản hồi Escape. Sau khi đóng, focus trở về element đã trigger mở modal (focus restoration). WCAG 2.1.1 compliance
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_47: ModalBackdrop — nested modals — Escape chỉ đóng modal trên cùng
- **Pre-conditions**: Có khả năng mở 2 modals chồng nhau (ví dụ: modal A → trigger modal B)
- **Steps**:
  1. Mở modal A (ví dụ: FilterBottomSheet)
  2. Từ modal A, trigger mở modal B (nếu có nested flow)
  3. Xác nhận cả 2 modals hiển thị (B phía trên A)
  4. Nhấn Escape lần 1
  5. Quan sát: chỉ modal B đóng, modal A vẫn hiển thị
  6. Nhấn Escape lần 2
  7. Quan sát: modal A đóng
- **Expected Result**: Escape lần 1 → chỉ modal B (trên cùng) đóng, modal A vẫn active. Escape lần 2 → modal A đóng. Stack-based Escape handling: mỗi modal đăng ký vào stack khi mount, unregister khi unmount. Chỉ handler trên cùng stack thực thi. Scroll lock reference-counted — body scroll chỉ restore khi tất cả modals đóng
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P0

##### TC_A11Y_48: ModalBackdrop — scroll lock reference-counted
- **Pre-conditions**: Trang có nội dung scroll được, modal sử dụng ModalBackdrop
- **Steps**:
  1. Scroll trang xuống một khoảng
  2. Mở modal A → body scroll bị lock
  3. Mở modal B (nested) → body scroll vẫn lock
  4. Đóng modal B → body scroll VẪN lock (modal A còn mở)
  5. Đóng modal A → body scroll RESTORE
  6. Xác nhận scroll position được giữ nguyên
- **Expected Result**: Scroll lock sử dụng reference counting: mỗi modal mount tăng counter, unmount giảm counter. Body overflow chỉ restore khi counter = 0 (tất cả modals đóng). Scroll position giữ nguyên sau khi đóng tất cả modals. iOS Safari compatible (position:fixed approach). Không có scroll jump
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_49: ModalBackdrop — backdrop tabIndex={-1} loại khỏi tab order
- **Pre-conditions**: Modal đang mở, backdrop overlay visible
- **Steps**:
  1. Mở modal
  2. Inspect backdrop button element (overlay phía sau modal content)
  3. Kiểm tra tabIndex attribute
  4. Nhấn Tab nhiều lần, xác nhận focus KHÔNG dừng tại backdrop
- **Expected Result**: Backdrop button có tabIndex={-1} — bị loại khỏi natural tab order. User không thể Tab đến backdrop. Focus chỉ cycle trong modal content. Click backdrop vẫn hoạt động (đóng modal via aria-label=t('common.close')). Thiết kế này prevent focus escape khỏi modal
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_50: FilterBottomSheet — touch targets min-h-11 (44px) trên filter options
- **Pre-conditions**: FilterBottomSheet đang mở, hiển thị filter options
- **Steps**:
  1. Inspect từng filter option button
  2. Kiểm tra CSS class min-h-11 hoặc computed min-height
  3. Sử dụng DevTools ruler để measure actual pixel size
  4. Test trên mobile viewport (375px width)
- **Expected Result**: Tất cả filter option buttons có min-height: 44px (class min-h-11 = 2.75rem = 44px). Touch targets đủ lớn theo WCAG 2.5.5. Trên mobile viewport, buttons không bị thu nhỏ dưới 44px. Khoảng cách giữa buttons đủ để tránh miss-tap
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_51: FitnessTab — role="tabpanel" trên mỗi tab content area
- **Pre-conditions**: FitnessTab hiển thị (isOnboarded=true), sub-tabs visible
- **Steps**:
  1. Inspect content area của tab "Kế hoạch" → kiểm tra role="tabpanel" và id="tabpanel-plan"
  2. Click tab "Tập luyện" → inspect content area → kiểm tra role="tabpanel" và id="tabpanel-workout"
  3. Click tab "Lịch sử" → inspect content area → kiểm tra role="tabpanel" và id tương ứng
  4. Click tab "Tiến trình" → inspect content area → kiểm tra role="tabpanel" và id tương ứng
- **Expected Result**: Mỗi tab content area có role="tabpanel" với id unique (tabpanel-plan, tabpanel-workout, etc.). Screen reader announce "tab panel" khi navigate vào content area. Semantic relationship giữa tab và tabpanel rõ ràng. Tuân thủ WCAG 1.3.1 — Info and Relationships
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_52: FitnessTab — role="radiogroup" role="radio" aria-checked trên workout mode toggle
- **Pre-conditions**: Tab "Tập luyện" active, workout mode selector visible
- **Steps**:
  1. Inspect container của mode selector → kiểm tra role="radiogroup" và aria-label
  2. Inspect nút "Strength" → kiểm tra role="radio" và aria-checked
  3. Inspect nút "Cardio" → kiểm tra role="radio" và aria-checked
  4. Click "Cardio" → kiểm tra aria-checked cập nhật trên cả 2 nút
  5. Click "Strength" → kiểm tra aria-checked cập nhật
- **Expected Result**: Container có role="radiogroup" với aria-label mô tả. Mỗi option có role="radio". Chỉ đúng 1 option có aria-checked="true" tại mọi thời điểm. Click → aria-checked toggle chính xác: selected = "true", unselected = "false". Screen reader announce "radio group" → "radio, checked/not checked"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_53: DashboardTab — useReducedMotion() trả về true khi prefers-reduced-motion: reduce
- **Pre-conditions**: Dashboard hiển thị, có thể simulate prefers-reduced-motion
- **Steps**:
  1. Mở Chrome DevTools → Rendering panel
  2. Enable "Emulate CSS media feature prefers-reduced-motion" → chọn "reduce"
  3. Quan sát DashboardTab re-render
  4. Kiểm tra useReducedMotion() hook trả về true (observe behavior: no animations)
  5. Disable emulation (chọn "No emulation")
  6. Quan sát DashboardTab re-render với animations
- **Expected Result**: Khi prefers-reduced-motion: reduce → useReducedMotion() trả về true. Hook lắng nghe MediaQueryList 'change' event, reactive update. useState khởi tạo từ matchMedia result. useEffect đăng ký listener, cleanup on unmount. Phản hồi tức thì khi user thay đổi OS setting
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_54: DashboardTab — animations bị tắt hoàn toàn khi reduced motion active
- **Pre-conditions**: prefers-reduced-motion: reduce được emulate
- **Steps**:
  1. Enable prefers-reduced-motion: reduce trong DevTools Rendering
  2. Reload/navigate đến Dashboard
  3. Kiểm tra staggerStyle function → nên trả về empty object {}
  4. Kiểm tra class "dashboard-stagger" → nên KHÔNG có trên elements
  5. Inspect style attributes trên dashboard cards → không có animationDelay
  6. Xác nhận không có hiệu ứng animation visible
- **Expected Result**: reducedMotion = true → staggerStyle() trả về {} (empty object, no animationDelay). Class dashboard-stagger không được apply (conditional: reducedMotion ? '' : 'dashboard-stagger'). Tất cả cards hiển thị static, không có stagger entrance animation. Tuân thủ WCAG 2.3.3 — Animation from Interactions. User với vestibular disorders không bị ảnh hưởng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_55: DashboardTab — animations hoạt động bình thường khi reduced motion inactive
- **Pre-conditions**: prefers-reduced-motion KHÔNG active (default setting)
- **Steps**:
  1. Đảm bảo không emulate prefers-reduced-motion (hoặc set "No emulation")
  2. Navigate đến Dashboard
  3. Quan sát entrance animations trên dashboard cards
  4. Kiểm tra staggerStyle function trả về object có animationDelay
  5. Kiểm tra class "dashboard-stagger" present trên elements
- **Expected Result**: reducedMotion = false → staggerStyle(delayMs) trả về { animationDelay: `${delayMs}ms` }. Class dashboard-stagger được apply trên cards. Cards xuất hiện với stagger animation (lần lượt từ trên xuống). Animation smooth, không flicker. Đây là behavior mặc định cho users không yêu cầu reduced motion
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1


##### TC_A11Y_56: DailyScoreHero: text contrast trên gradient background ≥ 4.5:1
- **Pre-conditions**: DailyScoreHero component render trên Dashboard
- **Steps**:
  1. Sử dụng Chrome DevTools Accessibility hoặc axe-core
  2. Đo contrast ratio text chính trên gradient bg
  3. So sánh với WCAG 4.5:1
- **Expected**: Text contrast ratio ≥ 4.5:1 cho normal text trên gradient background
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_57: DailyScoreHero: score number contrast trên background ≥ 3:1 (large text)
- **Pre-conditions**: DailyScoreHero với score number lớn
- **Steps**:
  1. Đo contrast ratio score number (large text ≥ 24px)
  2. So sánh với WCAG 3:1
- **Expected**: Score number contrast ≥ 3:1 (WCAG large text threshold)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_58: Progress bar labels: text contrast trên colored bars ≥ 4.5:1
- **Pre-conditions**: Progress bars hiển thị trên Dashboard/Fitness
- **Steps**:
  1. Đo contrast labels trên colored bars
  2. Kiểm tra percentage text readability
- **Expected**: Labels và percentage text đạt contrast ≥ 4.5:1 trên bar backgrounds
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_59: Muted/secondary text: slate-500 trên white ≥ 4.5:1
- **Pre-conditions**: UI có muted/secondary text (slate-500)
- **Steps**:
  1. Đo contrast slate-500 (#64748b) trên white (#fff)
  2. Tính ratio
- **Expected**: Contrast ratio = ~5.4:1 ≥ 4.5:1. PASS
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_60: Badge text: text trên colored badge backgrounds ≥ 4.5:1
- **Pre-conditions**: Badges hiển thị trên các components
- **Steps**:
  1. Kiểm tra text contrast trên badge backgrounds
  2. Đo từng loại badge
- **Expected**: Tất cả badge text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_61: Button text: emerald-500 text trên white button ≥ 4.5:1
- **Pre-conditions**: Button với emerald-500 text trên white bg
- **Steps**:
  1. Đo contrast emerald-500 (#10b981) trên #fff
  2. Tính ratio
- **Expected**: Contrast ratio ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_62: Button text: white text trên emerald-500 button ≥ 4.5:1
- **Pre-conditions**: Button primary với white text trên emerald-500 bg
- **Steps**:
  1. Đo contrast #fff trên #10b981
- **Expected**: Contrast ratio ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_63: Tab label active: contrast trên active tab background ≥ 4.5:1
- **Pre-conditions**: Tab active state
- **Steps**:
  1. Kiểm tra active tab text contrast
- **Expected**: Active tab text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_64: Tab label inactive: contrast trên inactive background ≥ 4.5:1
- **Pre-conditions**: Tab inactive state
- **Steps**:
  1. Kiểm tra inactive tab text contrast
- **Expected**: Inactive tab text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_65: Toast text: PRToast text contrast trên background ≥ 4.5:1
- **Pre-conditions**: PRToast hiển thị
- **Steps**:
  1. Kiểm tra toast text contrast
- **Expected**: Toast text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_66: Modal text: WeightQuickLog text contrast ≥ 4.5:1
- **Pre-conditions**: WeightQuickLog modal mở
- **Steps**:
  1. Kiểm tra text contrast trong modal
- **Expected**: Modal text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_67: Card title: TodaysPlanCard title contrast ≥ 4.5:1
- **Pre-conditions**: TodaysPlanCard render
- **Steps**:
  1. Kiểm tra card title contrast
- **Expected**: Title text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_68: Card body text: contrast ≥ 4.5:1
- **Pre-conditions**: TodaysPlanCard body text
- **Steps**:
  1. Kiểm tra body text contrast
- **Expected**: Body text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_69: Insight card text: AiInsightCard title trên colored bg ≥ 4.5:1
- **Pre-conditions**: AiInsightCard render với colored bg
- **Steps**:
  1. Kiểm tra title text trên bg-amber-50, bg-blue-50, bg-emerald-50, bg-slate-50
- **Expected**: Title text đạt contrast ≥ 4.5:1 trên tất cả color schemes
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_70: Insight card message: contrast trên colored bg ≥ 4.5:1
- **Pre-conditions**: AiInsightCard message text
- **Steps**:
  1. Kiểm tra message text contrast trên mỗi color scheme
- **Expected**: Message text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_71: Banner text: AutoAdjustBanner text contrast ≥ 4.5:1
- **Pre-conditions**: AutoAdjustBanner render
- **Steps**:
  1. Kiểm tra banner text contrast
- **Expected**: Banner text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_72: History text: AdjustmentHistory text contrast ≥ 4.5:1
- **Pre-conditions**: AdjustmentHistory expanded
- **Steps**:
  1. Kiểm tra history item text contrast
- **Expected**: History text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_73: Streak text: StreakMini number contrast ≥ 3:1 (large text)
- **Pre-conditions**: StreakMini hiển thị streak number
- **Steps**:
  1. Đo contrast streak number (large text)
  2. So sánh 3:1 threshold
- **Expected**: Streak number (large text) ≥ 3:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_74: Form label text: contrast ≥ 4.5:1 trong FitnessOnboarding
- **Pre-conditions**: FitnessOnboarding form render
- **Steps**:
  1. Kiểm tra form label contrast
- **Expected**: Labels đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_75: Error message text: red text contrast ≥ 4.5:1
- **Pre-conditions**: Error message hiển thị (validation)
- **Steps**:
  1. Kiểm tra red error text contrast
- **Expected**: Red error text đạt contrast ≥ 4.5:1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_76: Placeholder text: input placeholder contrast ≥ 4.5:1
- **Pre-conditions**: Input fields với placeholder text
- **Steps**:
  1. Kiểm tra placeholder text contrast
- **Expected**: Placeholder text đạt contrast ≥ 4.5:1 (WCAG không bắt buộc nhưng best practice)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_A11Y_77: Link text: contrast ≥ 4.5:1 và distinguishable
- **Pre-conditions**: Links trong content
- **Steps**:
  1. Kiểm tra link text contrast
  2. Xác nhận link distinguishable từ regular text
- **Expected**: Link text ≥ 4.5:1 contrast và phân biệt được (underline hoặc khác biệt rõ)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_78: Disabled button text: contrast ≥ 3:1 (ngoại lệ WCAG)
- **Pre-conditions**: Disabled buttons
- **Steps**:
  1. Kiểm tra disabled button text contrast
- **Expected**: Disabled text ≥ 3:1 (WCAG cho phép ngoại lệ nhưng vẫn đảm bảo readable)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_A11Y_79: Dark mode: text contrast vẫn ≥ 4.5:1
- **Pre-conditions**: Bật dark mode preference
- **Steps**:
  1. Kiểm tra text contrast trong dark mode
- **Expected**: Tất cả text vẫn đạt ≥ 4.5:1 trong dark mode
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_80: Dark mode: all colored elements maintain contrast ratios
- **Pre-conditions**: Dark mode active
- **Steps**:
  1. Kiểm tra colored elements: buttons, badges, progress bars
- **Expected**: Tất cả colored elements maintain WCAG contrast requirements
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_81: Score tiers: color + label text + icon phân biệt tier
- **Pre-conditions**: Score tiers hiển thị trên Dashboard
- **Steps**:
  1. Kiểm tra mỗi tier có label text
  2. Kiểm tra có icon phân biệt
  3. Xác nhận không chỉ dùng màu
- **Expected**: Mỗi score tier phân biệt bằng: color + label text + icon. Screen reader đọc được tier level
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_82: Streak dots: color + icon (✓/🌙/📍/○) phân biệt trạng thái
- **Pre-conditions**: StreakMini dots hiển thị
- **Steps**:
  1. Kiểm tra mỗi dot type
  2. Xác nhận icons: ✓/🌙/📍/○
- **Expected**: Mỗi streak status phân biệt bằng: color + icon shape. Không chỉ dùng màu
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_83: Progress bars: color + percentage text hiển thị tiến độ
- **Pre-conditions**: Progress bars trong ProgressDashboard
- **Steps**:
  1. Kiểm tra percentage text hiển thị cạnh bar
  2. Xác nhận color không phải indicator duy nhất
- **Expected**: Progress thể hiện bằng: colored bar + percentage text. Accessible cho color-blind users
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_84: Filter active state: color + underline/bold phân biệt
- **Pre-conditions**: Filter buttons trong WorkoutHistory
- **Steps**:
  1. Kiểm tra active filter có visual indicator ngoài color
  2. Ví dụ: underline, bold, border
- **Expected**: Active filter phân biệt bằng: color + underline/bold/border. aria-pressed cũng active
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_85: Applied/Declined status: color + icon (Check/X) phân biệt
- **Pre-conditions**: AdjustmentHistory items
- **Steps**:
  1. Kiểm tra applied/declined không chỉ phân biệt bằng color
  2. Xác nhận có icon Check/X
- **Expected**: Applied = green + ✓ icon. Declined = gray + ✗ icon. Phân biệt rõ không cần nhìn màu
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_86: Trend indicators: color + icon (TrendingUp/Down) phân biệt
- **Pre-conditions**: History trend indicators
- **Steps**:
  1. Kiểm tra trend icon kèm màu
- **Expected**: TrendingUp (emerald + icon) vs TrendingDown (red + icon). Có icon shape khác nhau
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_87: Tab active: color + visual indicator (underline/bold) phân biệt
- **Pre-conditions**: Tab navigation active state
- **Steps**:
  1. Kiểm tra active tab có indicator ngoài color
- **Expected**: Active tab: color + underline/bold/different font weight
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_88: Workout mode toggle: color + text label + aria-checked phân biệt
- **Pre-conditions**: FitnessTab workout mode toggle
- **Steps**:
  1. Kiểm tra selected mode phân biệt
- **Expected**: Selected mode: color + text label + aria-checked='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_89: PR flag: color + icon + text 'PR' phân biệt
- **Pre-conditions**: PR flag trong workout summary
- **Steps**:
  1. Kiểm tra PR indicator
- **Expected**: PR = color + icon + text 'PR'. Không chỉ dùng color
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_90: Error state: color + icon + text message phân biệt
- **Pre-conditions**: Error state trong forms
- **Steps**:
  1. Kiểm tra error indicator
- **Expected**: Error = red color + icon + error message text
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_91: Success state: color + icon + text phân biệt
- **Pre-conditions**: Success state
- **Steps**:
  1. Kiểm tra success indicator
- **Expected**: Success = green color + check icon + success text
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_92: Insight priority: color + type text + icon phân biệt
- **Pre-conditions**: Insight priority types
- **Steps**:
  1. Kiểm tra phân biệt giữa alert, action, remind, etc.
- **Expected**: Mỗi type: unique color + unique icon + type text
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_93: Badge types: color + text label phân biệt 'Tự động'/'Thủ công'
- **Pre-conditions**: Badge types trong History
- **Steps**:
  1. Kiểm tra badge phân biệt
- **Expected**: 'Tự động' vs 'Thủ công': color + text label
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_94: Milestone complete: color + check icon + text phân biệt
- **Pre-conditions**: MilestonesList complete state
- **Steps**:
  1. Kiểm tra milestone complete indicator
- **Expected**: Complete: green + check icon + text. Not just color
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_95: Rest day vs training day: color + icon + text phân biệt
- **Pre-conditions**: Rest day vs training day
- **Steps**:
  1. Kiểm tra TodaysPlanCard state indicators
- **Expected**: Rest day: unique icon + text. Training: unique icon + text
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_96: Bottom nav tab buttons: height ≥ 44px
- **Pre-conditions**: Bottom nav rendered
- **Steps**:
  1. Đo chiều cao mỗi tab button bằng DevTools
  2. Kiểm tra ≥ 44px
- **Expected**: Tất cả tab buttons ≥ 44px height
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_97: QuickActionsBar primary button: height ≥ 44px (56px actual)
- **Pre-conditions**: QuickActionsBar primary button
- **Steps**:
  1. Đo dimensions bằng DevTools
- **Expected**: Height = 56px ≥ 44px. PASS
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_98: QuickActionsBar secondary buttons: height ≥ 44px (48px actual)
- **Pre-conditions**: QuickActionsBar secondary buttons
- **Steps**:
  1. Đo dimensions
- **Expected**: Height = 48px ≥ 44px. PASS
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_99: TodaysPlanCard CTA buttons: height ≥ 44px
- **Pre-conditions**: TodaysPlanCard CTA buttons
- **Steps**:
  1. Đo dimensions mỗi CTA
- **Expected**: Tất cả CTAs ≥ 44px height
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_100: WeightQuickLog stepper buttons (+/-): size ≥ 44×44px (h-11 w-11)
- **Pre-conditions**: WeightQuickLog stepper buttons
- **Steps**:
  1. Đo dimensions (+) và (-) buttons
- **Expected**: Buttons h-11 w-11 = 44×44px. PASS
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_101: RestTimer control buttons: size ≥ 44×44px
- **Pre-conditions**: RestTimer buttons
- **Steps**:
  1. Đo control button dimensions
- **Expected**: ≥ 44×44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_102: PRToast dismiss area: touch target ≥ 44px
- **Pre-conditions**: PRToast dismiss area
- **Steps**:
  1. Đo touch target
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_103: WorkoutHistory toggle buttons: height ≥ 44px
- **Pre-conditions**: WorkoutHistory toggles
- **Steps**:
  1. Đo toggle button heights
- **Expected**: ≥ 44px (min-h-11)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_104: WorkoutHistory filter buttons: height ≥ 44px (min-h-11)
- **Pre-conditions**: WorkoutHistory filters
- **Steps**:
  1. Đo filter button heights
- **Expected**: ≥ 44px (min-h-11)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_105: AdjustmentHistory toggle button: height ≥ 44px
- **Pre-conditions**: AdjustmentHistory toggle
- **Steps**:
  1. Đo toggle button
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_106: AiInsightCard dismiss button: size ≥ 44×44px
- **Pre-conditions**: AiInsightCard dismiss button
- **Steps**:
  1. Đo dimensions
- **Expected**: ≥ 44×44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_107: AiInsightCard action button: height ≥ 44px
- **Pre-conditions**: AiInsightCard action button
- **Steps**:
  1. Đo dimensions
- **Expected**: ≥ 44px height
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_108: AutoAdjustBanner buttons (Áp dụng/Bỏ qua): height ≥ 44px
- **Pre-conditions**: AutoAdjustBanner buttons
- **Steps**:
  1. Đo 'Áp dụng' và 'Bỏ qua' buttons
- **Expected**: Cả 2 buttons ≥ 44px height
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_109: FitnessOnboarding radio buttons: size ≥ 44px
- **Pre-conditions**: FitnessOnboarding radio buttons
- **Steps**:
  1. Đo mỗi radio button touch target
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_110: FitnessOnboarding checkbox items: size ≥ 44px
- **Pre-conditions**: FitnessOnboarding checkboxes
- **Steps**:
  1. Đo checkbox touch targets
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_111: Modal close button: size ≥ 44×44px
- **Pre-conditions**: Modal close buttons
- **Steps**:
  1. Đo close button dimensions
- **Expected**: ≥ 44×44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_112: FilterBottomSheet option items: height ≥ 44px (min-h-11)
- **Pre-conditions**: FilterBottomSheet options
- **Steps**:
  1. Đo option item heights
- **Expected**: min-h-11 = 44px. PASS
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_113: StreakMini button: touch target ≥ 44px
- **Pre-conditions**: StreakMini
- **Steps**:
  1. Đo clickable area
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_114: EnergyBalanceMini clickable area: ≥ 44px
- **Pre-conditions**: EnergyBalanceMini
- **Steps**:
  1. Đo clickable area khi role='button'
- **Expected**: ≥ 44px khi interactive
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_115: SubTabBar tab items: height ≥ 44px
- **Pre-conditions**: SubTabBar items
- **Steps**:
  1. Đo sub-tab button heights
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_116: SetEditor RPE buttons: size ≥ 44px
- **Pre-conditions**: SetEditor RPE buttons
- **Steps**:
  1. Đo RPE selection buttons
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_117: WeightLogger input stepper: ≥ 44px
- **Pre-conditions**: WeightLogger stepper
- **Steps**:
  1. Đo input stepper buttons
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_118: CardioLogger buttons: ≥ 44px
- **Pre-conditions**: CardioLogger buttons
- **Steps**:
  1. Đo action buttons
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_119: TrainingPlanView day buttons: ≥ 44px
- **Pre-conditions**: TrainingPlanView day buttons
- **Steps**:
  1. Đo day selection buttons
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_120: MilestonesList expand buttons: ≥ 44px
- **Pre-conditions**: MilestonesList expand buttons
- **Steps**:
  1. Đo expand/collapse buttons
- **Expected**: ≥ 44px
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_121: Tab key: focus cycles qua tất cả interactive elements trên Dashboard
- **Pre-conditions**: Dashboard tab active
- **Steps**:
  1. Nhấn Tab nhiều lần
  2. Track focus movement
- **Expected**: Focus di chuyển tuần tự qua: header → cards → buttons → footer. Mọi interactive element nhận focus
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_122: Tab key: focus cycles qua tất cả interactive elements trên Fitness tab
- **Pre-conditions**: Fitness tab active
- **Steps**:
  1. Nhấn Tab nhiều lần
  2. Track focus
- **Expected**: Focus di chuyển qua sub-tabs → content → buttons. Full keyboard navigation
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_123: Focus ring visible: emerald-500 ring trên focused button
- **Pre-conditions**: Focus trên bất kỳ button
- **Steps**:
  1. Tab tới button
  2. Kiểm tra visual focus indicator
- **Expected**: Ring emerald-500 visible rõ ràng quanh button
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_124: Focus ring: focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
- **Pre-conditions**: Focus trên interactive element
- **Steps**:
  1. Inspect CSS khi focused
- **Expected**: Classes: focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_125: Focus order: matches visual order trên Dashboard
- **Pre-conditions**: Dashboard visible
- **Steps**:
  1. Tab qua elements
  2. So sánh focus order vs visual order
- **Expected**: Focus order match visual layout: top→bottom, left→right
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_126: Focus order: matches visual order trên Fitness tab
- **Pre-conditions**: Fitness tab visible
- **Steps**:
  1. Tab qua elements
- **Expected**: Focus order match visual layout
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_127: Modal focus trap: RestTimer — Tab không thoát ra ngoài modal
- **Pre-conditions**: RestTimer modal mở
- **Steps**:
  1. Nhấn Tab nhiều lần
  2. Kiểm tra focus không thoát modal
- **Expected**: Focus cycle trong RestTimer: buttons → input → buttons. Không escape ra ngoài
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_128: Modal focus trap: WeightQuickLog — Tab cycle trong modal
- **Pre-conditions**: WeightQuickLog modal mở
- **Steps**:
  1. Nhấn Tab
  2. Kiểm tra focus trap
- **Expected**: Focus trapped trong modal. Tab cycle qua close, input, stepper, submit
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_129: Modal focus trap: FilterBottomSheet — focus trapped
- **Pre-conditions**: FilterBottomSheet mở
- **Steps**:
  1. Nhấn Tab
  2. Kiểm tra focus trap
- **Expected**: Focus trapped trong bottom sheet
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_130: Focus returns: đóng RestTimer → focus quay lại trigger button
- **Pre-conditions**: RestTimer mở rồi đóng
- **Steps**:
  1. Đóng RestTimer (Escape hoặc button)
  2. Kiểm tra focus
- **Expected**: Focus quay lại button/element đã trigger mở RestTimer
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_131: Focus returns: đóng WeightQuickLog → focus quay lại trigger
- **Pre-conditions**: WeightQuickLog mở rồi đóng
- **Steps**:
  1. Đóng modal
  2. Kiểm tra focus
- **Expected**: Focus quay lại trigger element
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_132: Focus returns: đóng FilterBottomSheet → focus quay lại trigger
- **Pre-conditions**: FilterBottomSheet mở rồi đóng
- **Steps**:
  1. Đóng sheet
  2. Kiểm tra focus
- **Expected**: Focus quay lại trigger
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_133: StreakMini: role='button' → Enter kích hoạt
- **Pre-conditions**: Focus trên StreakMini
- **Steps**:
  1. Nhấn Enter
- **Expected**: StreakMini action kích hoạt (show detail/navigate)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_134: StreakMini: role='button' → Space kích hoạt
- **Pre-conditions**: Focus trên StreakMini
- **Steps**:
  1. Nhấn Space
- **Expected**: StreakMini action kích hoạt
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_135: EnergyBalanceMini: conditional role='button' → keyboard accessible
- **Pre-conditions**: EnergyBalanceMini khi interactive (role='button')
- **Steps**:
  1. Tab tới element
  2. Nhấn Enter
- **Expected**: Action kích hoạt. Keyboard accessible khi có role='button'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_136: PRToast: tabIndex={0} → focusable
- **Pre-conditions**: PRToast hiển thị
- **Steps**:
  1. Tab tới toast
  2. Kiểm tra focusable
- **Expected**: Toast focusable (tabIndex=0)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_137: PRToast: Enter/Space → dismiss toast
- **Pre-conditions**: Focus trên PRToast
- **Steps**:
  1. Nhấn Enter hoặc Space
- **Expected**: Toast dismissed
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_138: Escape key: đóng modal trên cùng (stack-based)
- **Pre-conditions**: 1 modal open, nhấn Escape
- **Steps**:
  1. Mở modal
  2. Nhấn Escape
- **Expected**: Modal đóng. Stack-based handler xử lý
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_139: Escape key: 2 modals open → chỉ đóng modal trên cùng
- **Pre-conditions**: 2 modals open (nested)
- **Steps**:
  1. Mở modal 1
  2. Mở modal 2 (nested)
  3. Nhấn Escape
- **Expected**: Chỉ modal 2 (trên cùng) đóng. Modal 1 vẫn open
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_140: Escape key: 1 modal open → đóng, focus quay về
- **Pre-conditions**: 1 modal open
- **Steps**:
  1. Nhấn Escape
  2. Kiểm tra focus
- **Expected**: Modal đóng, focus quay về trigger
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_141: ModalBackdrop: scroll lock reference-counted
- **Pre-conditions**: ModalBackdrop mount
- **Steps**:
  1. Kiểm tra scroll behavior
- **Expected**: Body scroll disabled (reference count = 1)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_142: ModalBackdrop: 2 modals → scroll lock vẫn active sau đóng 1
- **Pre-conditions**: 2 ModalBackdrops mount
- **Steps**:
  1. Đóng 1 ModalBackdrop
  2. Kiểm tra scroll
- **Expected**: Scroll vẫn disabled (reference count = 1 > 0)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_143: ModalBackdrop: đóng modal cuối → scroll unlock
- **Pre-conditions**: 1 ModalBackdrop mount rồi unmount
- **Steps**:
  1. Unmount last backdrop
  2. Kiểm tra scroll
- **Expected**: Scroll unlocked (reference count = 0)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_144: ModalBackdrop: tabIndex={-1} trên backdrop (không focusable)
- **Pre-conditions**: ModalBackdrop rendered
- **Steps**:
  1. Kiểm tra backdrop tabIndex
- **Expected**: tabIndex={-1} trên backdrop element
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_145: Shift+Tab: focus di chuyển ngược đúng thứ tự
- **Pre-conditions**: Dashboard, nhiều interactive elements
- **Steps**:
  1. Nhấn Shift+Tab
  2. Track focus
- **Expected**: Focus di chuyển ngược: bottom→top, right→left. Đúng reverse order
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_146: AutoAdjustBanner: role='alert' tự động announce cho screen reader
- **Pre-conditions**: AutoAdjustBanner hiển thị
- **Steps**:
  1. Kiểm tra role attribute
- **Expected**: role='alert' → screen reader auto-announce
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_147: AiInsightCard: role='region' với aria-label descriptive
- **Pre-conditions**: AiInsightCard hiển thị
- **Steps**:
  1. Kiểm tra role và aria-label
- **Expected**: role='region', aria-label = '{emoji} {title}'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_148: RestTimer: role='dialog' aria-modal='true'
- **Pre-conditions**: RestTimer mở
- **Steps**:
  1. Kiểm tra ARIA attributes
- **Expected**: role='dialog', aria-modal='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_149: WeightQuickLog: role='dialog' aria-label descriptive
- **Pre-conditions**: WeightQuickLog mở
- **Steps**:
  1. Kiểm tra ARIA attributes
- **Expected**: role='dialog', aria-label descriptive
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_150: PRToast: role='alert' announce khi xuất hiện
- **Pre-conditions**: PRToast xuất hiện
- **Steps**:
  1. Kiểm tra role
- **Expected**: role='alert' → auto-announce
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_151: ProgressDashboard cycle: role='progressbar' aria-valuenow/min/max
- **Pre-conditions**: ProgressDashboard render
- **Steps**:
  1. Kiểm tra cycle progress ARIA
- **Expected**: role='progressbar', aria-valuenow/min/max correct values
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_152: RestTimer ring: role='progressbar' aria-valuenow cập nhật countdown
- **Pre-conditions**: RestTimer counting
- **Steps**:
  1. Kiểm tra SVG ring ARIA
  2. Verify valuenow updates
- **Expected**: role='progressbar', aria-valuenow decrements mỗi giây
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_153: MilestonesList progress: role='progressbar' với ARIA values
- **Pre-conditions**: MilestonesList progress
- **Steps**:
  1. Kiểm tra progress ARIA
- **Expected**: role='progressbar' với correct min/max/now values
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_154: FitnessTab: role='tabpanel' trên content areas
- **Pre-conditions**: FitnessTab content areas
- **Steps**:
  1. Kiểm tra role trên tab panels
- **Expected**: role='tabpanel' trên mỗi panel
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_155: FitnessTab: role='radiogroup' trên goal selector
- **Pre-conditions**: FitnessOnboarding goal selector
- **Steps**:
  1. Kiểm tra container role
- **Expected**: role='radiogroup'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_156: FitnessTab: role='radio' trên goal options
- **Pre-conditions**: Goal options trong FitnessOnboarding
- **Steps**:
  1. Kiểm tra mỗi option role
- **Expected**: role='radio' trên mỗi option
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_157: FitnessTab: aria-checked cập nhật khi select option
- **Pre-conditions**: Select goal option
- **Steps**:
  1. Click option
  2. Kiểm tra aria-checked
- **Expected**: Selected: aria-checked='true'. Others: aria-checked='false'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_158: FitnessTab: role='radiogroup' trên experience selector
- **Pre-conditions**: FitnessOnboarding experience selector
- **Steps**:
  1. Kiểm tra role
- **Expected**: role='radiogroup'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_159: FitnessTab: role='radiogroup' trên workout days selector
- **Pre-conditions**: FitnessOnboarding workout days
- **Steps**:
  1. Kiểm tra role
- **Expected**: role='radiogroup'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_160: FitnessTab: role='checkbox' trên equipment selection
- **Pre-conditions**: FitnessOnboarding equipment
- **Steps**:
  1. Kiểm tra role
- **Expected**: role='checkbox'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_161: WorkoutHistory: aria-expanded toggle đúng true/false
- **Pre-conditions**: WorkoutHistory toggle
- **Steps**:
  1. Click expand/collapse
  2. Kiểm tra aria-expanded
- **Expected**: true↔false toggle đúng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_162: AdjustmentHistory: aria-expanded toggle đúng
- **Pre-conditions**: AdjustmentHistory toggle
- **Steps**:
  1. Click expand/collapse
  2. Kiểm tra aria-expanded
- **Expected**: true↔false toggle đúng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_163: MilestonesList: aria-expanded trên milestone items
- **Pre-conditions**: MilestonesList item toggle
- **Steps**:
  1. Click expand
  2. Kiểm tra aria-expanded
- **Expected**: aria-expanded cập nhật
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_164: TrainingPlanView: aria-current='date' cho ngày hiện tại
- **Pre-conditions**: TrainingPlanView current day
- **Steps**:
  1. Kiểm tra aria-current
- **Expected**: Ngày hiện tại có aria-current='date'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_165: WorkoutHistory: aria-pressed trên active filter
- **Pre-conditions**: WorkoutHistory active filter
- **Steps**:
  1. Click filter
  2. Kiểm tra aria-pressed
- **Expected**: Active filter: aria-pressed='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_166: SetEditor: role='group' với aria-label trên RPE section
- **Pre-conditions**: SetEditor RPE section
- **Steps**:
  1. Kiểm tra ARIA
- **Expected**: role='group', aria-label mô tả RPE
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_167: Icon-only button: WeightQuickLog +/- buttons có aria-label
- **Pre-conditions**: WeightQuickLog + button
- **Steps**:
  1. Kiểm tra aria-label
- **Expected**: aria-label mô tả 'Tăng cân nặng' hoặc tương đương
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_168: Icon-only button: AiInsightCard dismiss có aria-label
- **Pre-conditions**: AiInsightCard dismiss
- **Steps**:
  1. Kiểm tra aria-label
- **Expected**: aria-label = t('insightCard.dismiss')
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_169: Icon-only button: modal close button có aria-label
- **Pre-conditions**: Modal close button
- **Steps**:
  1. Kiểm tra aria-label
- **Expected**: aria-label = 'Đóng' hoặc tương đương
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_170: Icon-only button: filter toggle có aria-label
- **Pre-conditions**: Filter toggle button
- **Steps**:
  1. Kiểm tra aria-label
- **Expected**: aria-label mô tả filter action
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_171: Dashboard heading hierarchy: h1 → h2 → h3 đúng thứ tự
- **Pre-conditions**: Dashboard page
- **Steps**:
  1. Inspect heading hierarchy
  2. Verify h1 → h2 → h3
- **Expected**: Heading levels sequential, không skip
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_172: Fitness heading hierarchy: h1/h2/h3 đúng thứ tự
- **Pre-conditions**: Fitness page
- **Steps**:
  1. Inspect heading hierarchy
- **Expected**: Heading levels sequential
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_173: Không skip heading level (ví dụ: h1 → h3 thiếu h2)
- **Pre-conditions**: Toàn bộ app
- **Steps**:
  1. Scan tất cả headings
  2. Kiểm tra không skip level
- **Expected**: Không có h1 → h3 thiếu h2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_174: Lists: repeated items dùng ul/li hoặc ol/li
- **Pre-conditions**: Lists trong app
- **Steps**:
  1. Kiểm tra repeated items dùng ul/ol
- **Expected**: Workout lists, meal lists, ingredient lists dùng semantic list elements
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_175: Navigation: bottom nav dùng nav element
- **Pre-conditions**: Bottom navigation
- **Steps**:
  1. Kiểm tra HTML element
- **Expected**: Sử dụng nav element hoặc role='navigation'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_176: Main content: sử dụng main element
- **Pre-conditions**: Main content area
- **Steps**:
  1. Kiểm tra HTML element
- **Expected**: main element wraps primary content
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_177: Decorative: AlertTriangle icon có aria-hidden='true'
- **Pre-conditions**: AutoAdjustBanner AlertTriangle icon
- **Steps**:
  1. Kiểm tra aria-hidden
- **Expected**: aria-hidden='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_178: Decorative: Flame icon có aria-hidden='true'
- **Pre-conditions**: Flame icon trong insights
- **Steps**:
  1. Kiểm tra aria-hidden
- **Expected**: aria-hidden='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_179: Decorative: Trophy icon có aria-hidden='true'
- **Pre-conditions**: Trophy icon trong insights
- **Steps**:
  1. Kiểm tra aria-hidden
- **Expected**: aria-hidden='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_180: Decorative: tất cả Lucide icons trang trí có aria-hidden='true'
- **Pre-conditions**: Tất cả Lucide icons trang trí
- **Steps**:
  1. Scan tất cả SVG icons
  2. Kiểm tra aria-hidden
- **Expected**: Tất cả decorative icons có aria-hidden='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_181: Decorative: emoji trong TodaysPlanCard có aria-hidden='true'
- **Pre-conditions**: TodaysPlanCard emojis
- **Steps**:
  1. Kiểm tra emoji elements
- **Expected**: aria-hidden='true' trên tất cả emojis
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_182: Decorative: emoji trong recovery tips có aria-hidden='true'
- **Pre-conditions**: Recovery tips emojis
- **Steps**:
  1. Kiểm tra emoji elements trong rest-day tips
- **Expected**: aria-hidden='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_183: sr-only class: text ẩn cho screen reader sử dụng đúng
- **Pre-conditions**: Hidden text cho screen reader
- **Steps**:
  1. Tìm sr-only class elements
- **Expected**: sr-only class áp dụng đúng cho screen-reader-only text
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_184: Images: meaningful images có alt text
- **Pre-conditions**: Meaningful images
- **Steps**:
  1. Tìm img tags có nội dung ý nghĩa
- **Expected**: Có alt text mô tả nội dung
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_185: Images: decorative images có aria-hidden='true' hoặc alt=''
- **Pre-conditions**: Decorative images
- **Steps**:
  1. Tìm decorative img tags
- **Expected**: alt='' hoặc aria-hidden='true'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_186: Live regions: toast notifications có role='alert'
- **Pre-conditions**: Toast notifications
- **Steps**:
  1. Khi toast xuất hiện, kiểm tra role
- **Expected**: role='alert' tự động announce
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_187: Live regions: score updates announce cho screen reader
- **Pre-conditions**: Score updates
- **Steps**:
  1. Khi score thay đổi
  2. Kiểm tra announcement
- **Expected**: Screen reader announce score update via live region
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_188: Buttons: interactive elements dùng button tag hoặc role='button'
- **Pre-conditions**: Interactive elements
- **Steps**:
  1. Kiểm tra tất cả clickable elements
- **Expected**: Dùng <button> tag hoặc role='button' + tabIndex + keyboard handler
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_189: Forms: input fields có associated labels
- **Pre-conditions**: Form inputs
- **Steps**:
  1. Kiểm tra input fields trong WeightQuickLog, FitnessOnboarding
- **Expected**: Mỗi input có associated label (htmlFor hoặc aria-label)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_190: Forms: required fields có aria-required='true'
- **Pre-conditions**: Required fields
- **Steps**:
  1. Kiểm tra required inputs
- **Expected**: Required fields có aria-required='true' hoặc required attribute
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_191: prefers-reduced-motion: reduce → useReducedMotion() trả về true
- **Pre-conditions**: System setting: prefers-reduced-motion: reduce
- **Steps**:
  1. Set OS reduced motion
  2. Mount DashboardTab
  3. Gọi useReducedMotion()
- **Expected**: Hook trả về true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_192: prefers-reduced-motion: no-preference → useReducedMotion() trả về false
- **Pre-conditions**: System setting: prefers-reduced-motion: no-preference
- **Steps**:
  1. Set OS normal motion
  2. Gọi useReducedMotion()
- **Expected**: Hook trả về false
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_193: Reduced motion active: DashboardTab tắt stagger animations
- **Pre-conditions**: Reduced motion active
- **Steps**:
  1. Render DashboardTab
  2. Kiểm tra stagger animations
- **Expected**: Stagger animations KHÔNG áp dụng. Elements hiển thị ngay lập tức
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_194: Reduced motion active: animationDelay trả về empty style
- **Pre-conditions**: Reduced motion active
- **Steps**:
  1. Kiểm tra animationDelay return
- **Expected**: animationDelay trả về {} (empty style object)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_195: Reduced motion active: loại bỏ class 'dashboard-stagger'
- **Pre-conditions**: Reduced motion active
- **Steps**:
  1. Kiểm tra DOM classes
- **Expected**: Class 'dashboard-stagger' KHÔNG tồn tại trên elements
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_196: Reduced motion active: tất cả CSS transitions instant (duration=0)
- **Pre-conditions**: Reduced motion active
- **Steps**:
  1. Kiểm tra CSS transitions
- **Expected**: Tất cả transition-duration = 0s hoặc transitions disabled
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_197: Reduced motion active: progress bar animations disabled
- **Pre-conditions**: Reduced motion active
- **Steps**:
  1. Kiểm tra progress bar animations
- **Expected**: Progress bars hiển thị ngay ở final value, không animate
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_198: Reduced motion active: toast entrance animation disabled
- **Pre-conditions**: Reduced motion active
- **Steps**:
  1. Trigger toast notification
  2. Kiểm tra entrance animation
- **Expected**: Toast xuất hiện ngay, không slide/fade animation
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_199: Reduced motion active: modal open/close animation disabled
- **Pre-conditions**: Reduced motion active
- **Steps**:
  1. Mở modal
  2. Kiểm tra open animation
- **Expected**: Modal xuất hiện ngay, không transition
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_200: Reduced motion inactive: animations hoạt động bình thường
- **Pre-conditions**: Reduced motion inactive
- **Steps**:
  1. Render DashboardTab
  2. Kiểm tra animations
- **Expected**: Animations hoạt động bình thường: stagger, transitions, transforms
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_201: Reduced motion inactive: stagger delays áp dụng đúng
- **Pre-conditions**: Reduced motion inactive
- **Steps**:
  1. Kiểm tra stagger delays
- **Expected**: Mỗi element có animationDelay tăng dần theo index
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_202: Dark mode: tất cả text vẫn readable (contrast ≥ 4.5:1)
- **Pre-conditions**: Dark mode enabled
- **Steps**:
  1. Bật dark mode
  2. Kiểm tra text contrast
- **Expected**: Tất cả text vẫn ≥ 4.5:1 contrast
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_203: Dark mode: focus rings vẫn visible
- **Pre-conditions**: Dark mode, focus trên element
- **Steps**:
  1. Tab tới button trong dark mode
- **Expected**: Focus ring vẫn visible và rõ ràng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_A11Y_204: Dark mode: decorative icons vẫn có aria-hidden='true'
- **Pre-conditions**: Dark mode
- **Steps**:
  1. Kiểm tra decorative icons
- **Expected**: aria-hidden='true' vẫn present
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_A11Y_205: Screen reader: DashboardTab content đọc được đầy đủ
- **Pre-conditions**: Screen reader + Dashboard
- **Steps**:
  1. Navigate DashboardTab với screen reader
- **Expected**: Tất cả content đọc được: headings, cards, scores, insights
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_206: Screen reader: FitnessTab navigation đọc được
- **Pre-conditions**: Screen reader + Fitness
- **Steps**:
  1. Navigate FitnessTab với screen reader
- **Expected**: Sub-tabs, content, forms đọc được
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_207: Screen reader: progressbar values đọc đúng (aria-valuenow)
- **Pre-conditions**: Screen reader + progressbar
- **Steps**:
  1. Navigate tới progressbar
- **Expected**: Screen reader đọc: role, label, current value, min, max
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_208: Screen reader: alert messages tự động announce
- **Pre-conditions**: Screen reader + alert
- **Steps**:
  1. Alert xuất hiện (banner/toast)
- **Expected**: Screen reader tự động announce alert content
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_209: Screen reader: dialog content accessible sau focus trap
- **Pre-conditions**: Screen reader + dialog
- **Steps**:
  1. Mở modal
  2. Navigate trong dialog
- **Expected**: Dialog content fully accessible, focus trapped
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_A11Y_210: Toàn bộ app: không có ARIA misuse (invalid roles/properties)
- **Pre-conditions**: Chạy axe-core hoặc lighthouse audit
- **Steps**:
  1. Run accessibility audit toàn app
  2. Kiểm tra ARIA violations
- **Expected**: 0 ARIA misuse violations. Tất cả roles, properties sử dụng đúng spec
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

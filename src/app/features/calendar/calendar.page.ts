import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  AlertController,
  ToastController,
  GestureController,
  type Gesture,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  chevronBack,
  chevronDown,
  chevronForward,
  close,
  copyOutline,
  settingsOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { localIsoDate, parseLocalDate, shiftIsoDate } from '../../core/utils/local-date';
import {
  MAX_PLANNED_SERVINGS,
  MEAL_LABELS,
  MEAL_TYPES,
  MIN_PLANNED_SERVINGS,
} from '../../core/models/meal-plan.types';
import type {
  DeletedDishSnapshot,
  MealSlotWithDishes,
  MealType,
  PlannedDishWithEffective,
} from '../../core/models/meal-plan.types';
import type { DishListItem } from '../../core/repositories/dish.repository';
import { CalendarStore, type PendingMealTarget } from '../../core/stores/calendar.store';
import { DayPlanRepository } from '../../core/repositories/day-plan.repository';
import { DishStore } from '../../core/stores/dish.store';
import { NetworkStore } from '../../core/stores/network.store';
import { NutritionStore } from '../../core/stores/nutrition.store';
import {
  loggedMealContext,
  MealPlanAi,
  MealPlanBudgetError,
} from '../../core/services/ai/meal-plan-ai';
import { MenuSuggestionAi, type MenuSuggestion } from '../../core/services/ai/menu-suggestion-ai';
import { aiErrorMessage } from '../../core/services/ai/ai-generation';
import { AiAvailability } from '../../shared/ai-availability';
import { UndoToastQueue } from '../../core/services/undo-toast-queue';
import { relativeDateLabel } from '../../core/utils/relative-date-label';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import {
  ConfirmEatModal,
  type ConfirmEatMode,
} from '../../shared/components/confirm-eat-modal/confirm-eat-modal';
import { DatePickerModal } from '../../shared/components/date-picker-modal/date-picker-modal';
import {
  DishContextMenuModal,
  type DishContextMenuAction,
} from '../../shared/components/dish-context-menu-modal/dish-context-menu-modal';
import { MealSlotPickerModal } from '../../shared/components/meal-slot-picker-modal/meal-slot-picker-modal';
import { DaySummaryCard } from './components/day-summary-card/day-summary-card';
import { DayRow } from './components/day-row/day-row';
import { EmptyDayState } from './components/empty-day-state/empty-day-state';
import { LoggingModal, type LoggingDishSelection } from './components/logging-modal/logging-modal';
import { MealSlotCard } from './components/meal-slot-card/meal-slot-card';

const SWIPE_THRESHOLD_PX = 60;
const UNDO_DURATION_MS = 8_000;

interface PendingConfirm {
  mode: ConfirmEatMode;
  plannedDishId: string;
  dishName: string;
}

interface ContextMenuState {
  plannedDishId: string;
  dishName: string;
  mealType: MealType;
  date: string;
}

interface PendingDishAction extends ContextMenuState {
  action: 'move' | 'copy';
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    ConfirmDialog,
    ConfirmEatModal,
    DatePickerModal,
    DishContextMenuModal,
    MealSlotPickerModal,
    DayRow,
    DaySummaryCard,
    EmptyDayState,
    LoggingModal,
    MealSlotCard,
  ],
})
export default class CalendarPage implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly gestureCtrl = inject(GestureController);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dayPlanRepo = inject(DayPlanRepository);
  private readonly mealPlanAi = inject(MealPlanAi);
  private readonly menuSuggestionAi = inject(MenuSuggestionAi);
  private readonly nutritionStore = inject(NutritionStore);
  private readonly undoQueue = inject(UndoToastQueue);
  protected readonly dishStore = inject(DishStore);
  protected readonly network = inject(NetworkStore);
  protected readonly ai = inject(AiAvailability);
  protected readonly store = inject(CalendarStore);

  private readonly today = localIsoDate();
  private gesture: Gesture | undefined;
  private lastToast: HTMLIonToastElement | undefined;
  private readonly swipeTarget = viewChild<ElementRef<HTMLElement>>('swipeArea');
  private readonly pendingMealFocus = signal<PendingMealTarget | null>(null);
  private readonly viewEntered = signal(false);

  readonly headerLabel = computed<string>(() =>
    relativeDateLabel(this.store.currentDate(), this.today),
  );

  /** Inclusive range of the active week (Mon → Sun), e.g. "11 – 17 tháng 5". */
  readonly weekRangeLabel = computed<string>(() => {
    const days = this.store.weekDays();
    if (days.length !== 7) return '';
    const a = parseLocalDate(days[0]);
    const b = parseLocalDate(days[6]);
    const monthLabel = (m: number): string => `tháng ${m + 1}`;
    const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    if (sameMonth) return `${a.getDate()} – ${b.getDate()} ${monthLabel(b.getMonth())}`;
    return `${a.getDate()} ${monthLabel(a.getMonth())} – ${b.getDate()} ${monthLabel(b.getMonth())}`;
  });

  onWeekNav(delta: -7 | 7): void {
    this.store.setDate(shiftIsoDate(this.store.currentDate(), delta));
  }

  readonly slotsInOrder = computed<MealSlotWithDishes[]>(() => {
    const dp = this.store.dayPlan();
    if (!dp) return [];
    const byType = new Map(dp.meal_slots.map((s) => [s.meal_type, s]));
    return MEAL_TYPES.map((mt) => byType.get(mt)).filter(
      (s): s is MealSlotWithDishes => s !== undefined,
    );
  });

  readonly isEmpty = computed<boolean>(
    () =>
      this.store.dayPlan() !== null &&
      this.slotsInOrder().every((s) => s.planned_dishes.length === 0),
  );

  readonly mealOrder = MEAL_TYPES;

  readonly pendingConfirm = signal<PendingConfirm | null>(null);
  readonly confirmModalOpen = computed<boolean>(() => this.pendingConfirm() !== null);
  readonly confirmMode = computed<ConfirmEatMode>(() => this.pendingConfirm()?.mode ?? 'mark');
  readonly confirmDishName = computed<string>(() => this.pendingConfirm()?.dishName ?? '');

  // Story 3.7 modal state ----------------------------------------------------
  readonly datePickerOpen = signal(false);
  readonly contextMenu = signal<ContextMenuState | null>(null);
  readonly contextMenuOpen = computed<boolean>(() => this.contextMenu() !== null);
  readonly contextMenuDishName = computed<string>(() => this.contextMenu()?.dishName ?? '');
  readonly contextMenuCanEditServings = computed(() => {
    const ctx = this.contextMenu();
    return ctx !== null && this.findDish(ctx.plannedDishId)?.is_completed === 0;
  });

  private readonly pendingDishAction = signal<PendingDishAction | null>(null);
  readonly slotPickerOpen = computed<boolean>(() => this.pendingDishAction()?.action === 'move');
  readonly slotPickerCurrent = computed<MealType | null>(
    () => this.pendingDishAction()?.mealType ?? null,
  );
  readonly copyToDatePickerOpen = computed<boolean>(
    () => this.pendingDishAction()?.action === 'copy',
  );

  private readonly pendingCopyWeekStart = signal<string | null>(null);
  readonly copyWeekConfirmationOpen = computed(() => this.pendingCopyWeekStart() !== null);
  readonly copyingPreviousWeek = signal(false);

  readonly loggingModalOpen = signal(false);
  readonly choosingNewMeal = signal(false);
  readonly loggingMealType = signal<MealType>('breakfast');
  readonly loggingLoading = signal(false);
  readonly recentLoggedDishes = signal<readonly DishListItem[]>([]);
  readonly loggingAiSuggestions = signal<readonly MenuSuggestion[]>([]);
  readonly loggingAiLoading = signal(false);
  readonly loggingAiDisabledReason = computed<string | null>(() =>
    this.network.online() ? this.ai.textIssue() : 'Cần kết nối mạng để AI gợi ý món.',
  );
  readonly loggingMealLabel = computed<string>(() => this.mealLabel(this.loggingMealType()));
  readonly aiPlanning = signal(false);

  /** Active undo toast (head of FIFO queue) — drives the bottom toast UI. */
  readonly activeUndo = this.undoQueue.activeToast;

  constructor() {
    addIcons({
      calendarOutline,
      chevronBack,
      chevronDown,
      chevronForward,
      close,
      copyOutline,
      settingsOutline,
      sparklesOutline,
    });
    // Probe yesterday whenever current date changes so canCopyYesterday stays accurate.
    effect(() => {
      const today = this.store.currentDate();
      void this.probeYesterday(today);
    });
    afterRenderEffect(() => this.revealPendingMeal());
  }

  private async probeYesterday(today: string): Promise<void> {
    const yesterday = shiftIsoDate(today, -1);
    const dp = await this.dayPlanRepo.findByDate(yesterday);
    const hasDishes = !!dp && dp.meal_slots.some((s) => s.planned_dishes.length > 0);
    this.store.yesterdayHint.set(hasDishes);
  }

  ngAfterViewInit(): void {
    const el = this.swipeTarget()?.nativeElement;
    if (!el) return;
    this.gesture = this.gestureCtrl.create({
      el,
      gestureName: 'calendar-day-swipe',
      threshold: 30,
      onEnd: (ev) => {
        if (Math.abs(ev.deltaX) < SWIPE_THRESHOLD_PX) return;
        const delta = ev.deltaX < 0 ? 1 : -1;
        this.store.setDate(shiftIsoDate(this.store.currentDate(), delta));
      },
    });
    this.gesture.enable(true);
    this.destroyRef.onDestroy(() => {
      this.gesture?.destroy();
      this.undoQueue.clear();
    });
  }

  openSettings(): void {
    void this.router.navigate(['/settings']);
  }

  ionViewWillEnter(): void {
    const pendingMeal = this.store.pendingMealNavigation();
    this.pendingMealFocus.set(pendingMeal);
    this.store.pendingMealNavigation.set(null);
    const date = pendingMeal?.date ?? this.store.addMealForDate();
    if (!date) return;
    this.store.addMealForDate.set(null);
    this.store.setDate(date);
    this.store.setView('day');
    this.choosingNewMeal.set(pendingMeal === null);
  }

  ionViewDidEnter(): void {
    this.viewEntered.set(true);
  }

  ionViewWillLeave(): void {
    this.viewEntered.set(false);
    this.pendingMealFocus.set(null);
  }

  private revealPendingMeal(): void {
    const target = this.pendingMealFocus();
    if (!target || !this.viewEntered()) return;
    if (this.store.currentDate() !== target.date || this.store.currentView() !== 'day') {
      this.pendingMealFocus.set(null);
      return;
    }
    const plan = this.store.dayPlan();
    if (plan?.date !== target.date) return;
    const action = this.swipeTarget()?.nativeElement.querySelector<HTMLButtonElement>(
      `[data-meal="${target.mealType}"] [data-planned-dish-action="${CSS.escape(target.plannedDishId)}"]`,
    );
    if (!action) return;

    this.pendingMealFocus.set(null);
    action.scrollIntoView({ block: 'center', behavior: 'instant' });
    action.focus({ preventScroll: true });
  }

  async addToChosenMeal(meal: MealType): Promise<void> {
    this.choosingNewMeal.set(false);
    await this.onMealAddTap(meal);
  }

  // -- Date picker (AC-1) ----------------------------------------------------
  onDateChipTap(): void {
    this.datePickerOpen.set(true);
  }

  onDatePicked(date: string): void {
    this.datePickerOpen.set(false);
    this.store.setDate(date);
  }

  onDatePickerDismiss(): void {
    this.datePickerOpen.set(false);
  }

  onWeekToggle(): void {
    this.store.setView(this.store.currentView() === 'day' ? 'week' : 'day');
  }

  onWeekDayTap(date: string): void {
    this.store.setDate(date);
    this.store.setView('day');
  }

  onCopyPreviousWeek(): void {
    if (!this.copyingPreviousWeek()) {
      this.pendingCopyWeekStart.set(this.store.weekDays()[0]);
    }
  }

  onCancelCopyPreviousWeek(): void {
    this.pendingCopyWeekStart.set(null);
  }

  async onConfirmCopyPreviousWeek(): Promise<void> {
    const weekStart = this.pendingCopyWeekStart();
    this.onCancelCopyPreviousWeek();
    if (!weekStart || this.store.weekDays()[0] !== weekStart) return;

    this.copyingPreviousWeek.set(true);
    try {
      const result = await this.store.copyPreviousWeek();
      if (result.copiedCount === 0) {
        void this.showToast('Tuần trước không có món để sao chép');
      } else {
        void this.showToast(
          `Đã sao chép ${result.copiedCount} món từ tuần trước (${result.daysAffected} ngày)`,
        );
      }
    } catch {
      void this.showToast('Không thể sao chép tuần trước. Vui lòng thử lại.');
    } finally {
      this.copyingPreviousWeek.set(false);
    }
  }

  async onAiCta(): Promise<void> {
    if (this.aiPlanning()) {
      return;
    }
    if (!this.network.online()) {
      void this.showToast('Cần kết nối mạng để AI chọn món');
      return;
    }

    const requestedDate = this.store.currentDate();
    this.aiPlanning.set(true);
    try {
      await this.dishStore.load();
      const dishes = this.dishStore.dishes();
      if (dishes.length === 0) {
        void this.showToast('Chưa có món trong thư viện. Hãy tạo món trước khi dùng AI');
        return;
      }

      const before = loggedMealContext(await this.dayPlanRepo.findByDate(requestedDate));
      const targets = this.nutritionStore.targets();
      if (requestedDate !== this.store.currentDate()) return;
      const suggestions = await this.mealPlanAi.planDay({
        date: requestedDate,
        targets,
        logged: before.logged,
        loggedMeals: before.loggedMeals,
        dishes,
      });
      const after = loggedMealContext(await this.dayPlanRepo.findByDate(requestedDate));
      if (
        requestedDate !== this.store.currentDate() ||
        before.key !== after.key ||
        targets !== this.nutritionStore.targets()
      ) {
        void this.showToast('Ngày, mục tiêu hoặc bữa đã ghi đã thay đổi. Hãy tạo lại gợi ý.');
        return;
      }
      if (!suggestions.length) {
        void this.showToast('Đã đạt mục tiêu đang áp dụng. Lịch ăn hiện tại được giữ nguyên.');
        return;
      }
      const inserted = await this.store.replaceCurrentDatePlan(
        suggestions.map((item) => ({
          mealType: item.mealType,
          dishId: item.dishId,
          servings: item.servings,
        })),
      );
      void this.showToast(`AI đã chọn ${inserted} món cho ngày này`);
    } catch (err) {
      console.warn('[CalendarPage] AI meal plan failed:', err);
      void this.showToast(
        err instanceof MealPlanBudgetError
          ? err.message
          : aiErrorMessage(err, 'AI chưa tạo được kế hoạch, vui lòng thử lại'),
      );
    } finally {
      this.aiPlanning.set(false);
    }
  }

  async onMealAddTap(mealType: MealType): Promise<void> {
    this.loggingMealType.set(mealType);
    this.loggingAiSuggestions.set([]);
    this.loggingModalOpen.set(true);
    this.loggingLoading.set(true);
    try {
      await this.dishStore.load();
      this.recentLoggedDishes.set(await this.store.listRecentLoggedDishes(20));
    } finally {
      this.loggingLoading.set(false);
    }
  }

  async onLoggingDishSelected(selection: LoggingDishSelection): Promise<void> {
    const mealType = this.loggingMealType();
    await this.store.addDishToMeal(mealType, selection.dishId, selection.servings);
    this.loggingModalOpen.set(false);
    void this.showToast(
      `Đã thêm "${selection.dishName}" vào ${this.mealLabel(mealType)} (${selection.servings} khẩu phần)`,
    );
  }

  async onLoggingAiSuggestionsRequested(): Promise<void> {
    if (this.loggingAiLoading()) {
      return;
    }
    if (!this.network.online()) {
      void this.showToast('Cần kết nối mạng để AI gợi ý món');
      return;
    }
    const date = this.store.currentDate();
    const mealType = this.loggingMealType();
    this.loggingAiLoading.set(true);
    try {
      await this.dishStore.load();
      const dishes = this.dishStore.dishes();
      if (dishes.length === 0) {
        void this.showToast('Chưa có món trong thư viện. Hãy tạo món trước khi dùng AI');
        return;
      }
      const suggestions = await this.menuSuggestionAi.suggest({
        date,
        mealType,
        targets: this.nutritionStore.targets(),
        currentTotals: this.nutritionStore.today(),
        dishes,
      });
      if (
        !this.loggingModalOpen() ||
        date !== this.store.currentDate() ||
        mealType !== this.loggingMealType()
      )
        return;
      this.loggingAiSuggestions.set(suggestions);
      void this.showToast(`AI đã gợi ý ${suggestions.length} món cho ${this.loggingMealLabel()}`);
    } catch (err) {
      console.warn('[CalendarPage] AI menu suggestion failed:', err);
      void this.showToast(aiErrorMessage(err, 'AI chưa gợi ý được món, vui lòng thử lại'));
    } finally {
      this.loggingAiLoading.set(false);
    }
  }

  onLoggingDismiss(): void {
    this.loggingModalOpen.set(false);
    this.loggingAiSuggestions.set([]);
  }

  onCreateDishRequested(): void {
    this.loggingModalOpen.set(false);
    void this.router.navigate(['/tabs/management/dish/new']);
  }

  onMarkEaten(plannedDishId: string): void {
    const dish = this.findDish(plannedDishId);
    if (!dish) return;
    this.pendingConfirm.set({
      mode: 'mark',
      plannedDishId,
      dishName: dish.dish_name,
    });
  }

  onUnmarkEaten(plannedDishId: string): void {
    const dish = this.findDish(plannedDishId);
    if (!dish) return;
    this.pendingConfirm.set({
      mode: 'unmark',
      plannedDishId,
      dishName: dish.dish_name,
    });
  }

  async onConfirm(): Promise<void> {
    const pending = this.pendingConfirm();
    if (!pending) return;
    this.pendingConfirm.set(null);
    if (pending.mode === 'mark') {
      await this.store.markEaten(pending.plannedDishId);
    } else {
      await this.store.unmarkEaten(pending.plannedDishId);
    }
  }

  onCancel(): void {
    this.pendingConfirm.set(null);
  }

  onPlanFromEmpty(): void {
    this.onMealAddTap('breakfast');
  }

  // -- Empty-state copy-from-yesterday (AC-2) --------------------------------
  async onCopyFromYesterday(): Promise<void> {
    if (this.store.copyingYesterday()) return;
    const date = this.store.currentDate();
    try {
      const { copiedCount } = await this.store.copyFromYesterday();
      if (date !== this.store.currentDate()) return;
      void this.showToast(
        copiedCount > 0
          ? `Đã sao chép ${copiedCount} món từ hôm qua`
          : 'Không có món mới để sao chép.',
      );
    } catch {
      if (date === this.store.currentDate())
        void this.showToast('Chưa thể sao chép món. Hãy thử lại.');
    }
  }

  onAiFromEmpty(): void {
    this.onAiCta();
  }

  // -- Long-press → context menu (AC-3) --------------------------------------
  onDishLongPress(plannedDishId: string, mealType: MealType): void {
    const date = this.store.dayPlan()?.date;
    if (this.pendingDishAction() || date !== this.store.currentDate()) return;
    const dish = this.findDish(plannedDishId);
    if (!dish) return;
    this.contextMenu.set({
      plannedDishId,
      dishName: dish.dish_name,
      mealType,
      date,
    });
  }

  onContextMenuDismiss(): void {
    this.contextMenu.set(null);
  }

  onContextAction(action: DishContextMenuAction): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    this.contextMenu.set(null);
    if (action === 'delete') {
      void this.handleDelete(ctx);
    } else if (action === 'servings') {
      void this.openServingsEditor(ctx);
    } else {
      this.pendingDishAction.set({ ...ctx, action });
    }
  }

  private async openServingsEditor(ctx: ContextMenuState): Promise<void> {
    const dish = this.findDish(ctx.plannedDishId);
    if (dish?.is_completed !== 0) return;

    let saving = false;
    const alert = await this.alertCtrl.create({
      header: 'Sửa khẩu phần',
      message: 'Nhập số phần từ 0,1 đến 20.',
      inputs: [
        {
          name: 'servings',
          type: 'number',
          value: dish.servings,
          min: MIN_PLANNED_SERVINGS,
          max: MAX_PLANNED_SERVINGS,
          attributes: { inputmode: 'decimal', step: 'any', 'aria-label': 'Khẩu phần' },
        },
      ],
      buttons: [
        { text: 'Hủy', role: 'cancel' },
        {
          text: 'Lưu khẩu phần',
          handler: async (values: { servings: string }) => {
            const servings = Number(values.servings);
            if (
              !Number.isFinite(servings) ||
              servings < MIN_PLANNED_SERVINGS ||
              servings > MAX_PLANNED_SERVINGS
            ) {
              void this.showToast('Nhập khẩu phần từ 0,1 đến 20.');
              return false;
            }
            if (saving) return false;
            if (
              this.store.currentDate() !== ctx.date ||
              this.store.dayPlan()?.date !== ctx.date ||
              this.findDish(ctx.plannedDishId)?.is_completed !== 0
            ) {
              void this.showToast('Món đã thay đổi. Hãy mở lại tùy chọn.');
              return true;
            }

            saving = true;
            try {
              await this.store.editServings(ctx.plannedDishId, servings);
              return true;
            } catch {
              void this.showToast('Không thể lưu khẩu phần. Vui lòng thử lại.');
              return false;
            } finally {
              saving = false;
            }
          },
        },
      ],
    });
    await alert.present();
  }

  // -- Move flow -------------------------------------------------------------
  async onSlotPicked(target: MealType): Promise<void> {
    const ctx = this.pendingDishAction();
    if (ctx?.action !== 'move') return;
    this.pendingDishAction.set(null);
    if (
      ctx.mealType === target ||
      ctx.date !== this.store.currentDate() ||
      ctx.date !== this.store.dayPlan()?.date
    ) {
      return;
    }

    const targetSlot = this.slotsInOrder().find((s) => s.meal_type === target);
    if (!targetSlot) {
      void this.showToast('Bữa đích không tồn tại');
      return;
    }
    try {
      await this.store.moveDish(ctx.plannedDishId, targetSlot.id);
      void this.showToast(`Đã chuyển "${ctx.dishName}" sang ${this.mealLabel(target)}`);
    } catch {
      void this.showToast('Không thể di chuyển món. Vui lòng thử lại.');
    }
  }

  onSlotPickerDismiss(): void {
    if (this.slotPickerOpen()) this.pendingDishAction.set(null);
  }

  // -- Copy flow -------------------------------------------------------------
  async onCopyDatePicked(targetDate: string): Promise<void> {
    const ctx = this.pendingDishAction();
    if (ctx?.action !== 'copy') return;
    if (ctx.date === targetDate) {
      void this.showToast('Chọn một ngày khác để sao chép món.');
      return;
    }
    this.pendingDishAction.set(null);
    try {
      await this.store.copyToDate(ctx.plannedDishId, targetDate, ctx.mealType);
      void this.showToast(`Đã sao chép "${ctx.dishName}" sang ${targetDate}`);
    } catch {
      void this.showToast('Không thể sao chép món. Vui lòng thử lại.');
    }
  }

  onCopyDatePickerDismiss(): void {
    if (this.copyToDatePickerOpen()) this.pendingDishAction.set(null);
  }

  // -- Delete + undo (AC-4, AC-5) --------------------------------------------
  private async handleDelete(ctx: ContextMenuState): Promise<void> {
    const snapshot = await this.store.deleteDish(ctx.plannedDishId);
    if (!snapshot) {
      void this.showToast(`Đã xoá "${ctx.dishName}"`);
      return;
    }
    this.enqueueUndo(ctx.dishName, snapshot);
  }

  private enqueueUndo(dishName: string, snapshot: DeletedDishSnapshot): void {
    const id = `undo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.undoQueue.enqueue({
      id,
      message: `Đã xoá "${dishName}"`,
      durationMs: UNDO_DURATION_MS,
      undo: async () => {
        await this.store.restoreDish(snapshot);
        void this.showToast(`Đã hoàn tác xoá "${dishName}"`);
      },
    });
  }

  async onUndoTap(): Promise<void> {
    const head = this.activeUndo();
    if (!head) return;
    await this.undoQueue.undo(head.id);
  }

  onUndoDismiss(): void {
    const head = this.activeUndo();
    if (!head) return;
    this.undoQueue.expire(head.id);
  }

  // -- helpers ---------------------------------------------------------------
  private findDish(plannedDishId: string): PlannedDishWithEffective | undefined {
    for (const slot of this.slotsInOrder()) {
      const found = slot.planned_dishes.find((d) => d.id === plannedDishId);
      if (found) return found;
    }
    return undefined;
  }

  private mealLabel(type: MealType): string {
    return MEAL_LABELS[type].toLocaleLowerCase('vi');
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      positionAnchor:
        document.querySelector<HTMLElement>('app-calendar .undo-toast') ??
        document.querySelector('ion-tab-bar') ??
        undefined,
    });
    const previous = this.lastToast;
    this.lastToast = toast;
    await previous?.dismiss();
    await toast.present();
  }
}

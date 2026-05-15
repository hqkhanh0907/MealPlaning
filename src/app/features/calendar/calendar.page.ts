import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
  ToastController,
  GestureController,
  type Gesture,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronDown, settingsOutline, sparklesOutline } from 'ionicons/icons';
import type {
  DeletedDishSnapshot,
  MealSlotWithDishes,
  MealType,
  PlannedDishWithEffective,
} from '../../core/models/meal-plan.types';
import type { DishListItem } from '../../core/repositories/dish.repository';
import { CalendarStore } from '../../core/stores/calendar.store';
import { DayPlanRepository } from '../../core/repositories/day-plan.repository';
import { DishStore } from '../../core/stores/dish.store';
import { NetworkStore } from '../../core/stores/network.store';
import { NutritionStore } from '../../core/stores/nutrition.store';
import { MealPlanAi } from '../../core/services/ai/meal-plan-ai';
import { MenuSuggestionAi, type MenuSuggestion } from '../../core/services/ai/menu-suggestion-ai';
import { GEMINI_ERROR_TOAST, GeminiError } from '../../core/services/ai/gemini-types';
import { UndoToastQueue } from '../../core/services/undo-toast-queue';
import { relativeDateLabel } from '../../core/utils/relative-date-label';
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

const MEAL_ORDER: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const SWIPE_THRESHOLD_PX = 60;
const DAY_MS = 86_400_000;
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
}

type SlotPickerMode = 'move' | null;

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftIsoDate(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map((p) => Number.parseInt(p, 10));
  const dt = new Date(y, m - 1, d);
  dt.setTime(dt.getTime() + deltaDays * DAY_MS);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
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
  protected readonly store = inject(CalendarStore);

  private readonly today = todayIso();
  private gesture: Gesture | undefined;
  private readonly swipeTarget = viewChild<ElementRef<HTMLElement>>('swipeArea');

  readonly headerLabel = computed<string>(() =>
    relativeDateLabel(this.store.currentDate(), this.today),
  );

  readonly slotsInOrder = computed<MealSlotWithDishes[]>(() => {
    const dp = this.store.dayPlan();
    if (!dp) return [];
    const byType = new Map(dp.meal_slots.map((s) => [s.meal_type, s]));
    return MEAL_ORDER.map((mt) => byType.get(mt)).filter(
      (s): s is MealSlotWithDishes => s !== undefined,
    );
  });

  readonly isEmpty = computed<boolean>(
    () =>
      this.store.dayPlan() !== null &&
      this.slotsInOrder().every((s) => s.planned_dishes.length === 0),
  );

  readonly mealOrder = MEAL_ORDER;

  readonly pendingConfirm = signal<PendingConfirm | null>(null);
  readonly confirmModalOpen = computed<boolean>(() => this.pendingConfirm() !== null);
  readonly confirmMode = computed<ConfirmEatMode>(() => this.pendingConfirm()?.mode ?? 'mark');
  readonly confirmDishName = computed<string>(() => this.pendingConfirm()?.dishName ?? '');

  // Story 3.7 modal state ----------------------------------------------------
  readonly datePickerOpen = signal(false);
  readonly contextMenu = signal<ContextMenuState | null>(null);
  readonly contextMenuOpen = computed<boolean>(() => this.contextMenu() !== null);
  readonly contextMenuDishName = computed<string>(() => this.contextMenu()?.dishName ?? '');

  /**
   * When set, the meal-slot picker is open. `move` is the only consumer for
   * now (copy uses date picker first, then implicit same-meal-type copy).
   */
  readonly slotPickerMode = signal<SlotPickerMode>(null);
  readonly slotPickerOpen = computed<boolean>(() => this.slotPickerMode() !== null);
  readonly slotPickerCurrent = computed<MealType | null>(
    () => this.contextMenu()?.mealType ?? null,
  );

  /** Date picker for "copy to date" flow. */
  readonly copyToDatePickerOpen = signal(false);

  readonly loggingModalOpen = signal(false);
  readonly loggingMealType = signal<MealType>('breakfast');
  readonly loggingLoading = signal(false);
  readonly recentLoggedDishes = signal<readonly DishListItem[]>([]);
  readonly loggingAiSuggestions = signal<readonly MenuSuggestion[]>([]);
  readonly loggingAiLoading = signal(false);
  readonly loggingAiDisabledReason = computed<string | null>(() =>
    this.network.online() ? null : 'Cần kết nối mạng để AI gợi ý món.',
  );
  readonly loggingMealLabel = computed<string>(() => this.mealLabel(this.loggingMealType()));
  readonly aiPlanning = signal(false);

  /** Active undo toast (head of FIFO queue) — drives the bottom toast UI. */
  readonly activeUndo = this.undoQueue.activeToast;

  constructor() {
    addIcons({ calendarOutline, chevronDown, settingsOutline, sparklesOutline });
    // Probe yesterday whenever current date changes so canCopyYesterday stays accurate.
    effect(() => {
      const today = this.store.currentDate();
      void this.probeYesterday(today);
    });
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

  async onCopyPreviousWeek(): Promise<void> {
    const result = await this.store.copyPreviousWeek();
    if (result.copiedCount === 0) {
      void this.showToast('Tuần trước không có món để sao chép');
    } else {
      void this.showToast(
        `Đã sao chép ${result.copiedCount} món từ tuần trước (${result.daysAffected} ngày)`,
      );
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

    this.aiPlanning.set(true);
    try {
      await this.dishStore.load();
      const dishes = this.dishStore.dishes();
      if (dishes.length === 0) {
        void this.showToast('Chưa có món trong thư viện. Hãy tạo món trước khi dùng AI');
        return;
      }

      const suggestions = await this.mealPlanAi.planDay({
        date: this.store.currentDate(),
        targets: this.nutritionStore.targets(),
        dishes,
      });
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
        err instanceof GeminiError
          ? GEMINI_ERROR_TOAST[err.kind]
          : 'AI chưa tạo được kế hoạch, vui lòng thử lại',
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
    this.loggingAiLoading.set(true);
    try {
      await this.dishStore.load();
      const dishes = this.dishStore.dishes();
      if (dishes.length === 0) {
        void this.showToast('Chưa có món trong thư viện. Hãy tạo món trước khi dùng AI');
        return;
      }
      const suggestions = await this.menuSuggestionAi.suggest({
        date: this.store.currentDate(),
        mealType: this.loggingMealType(),
        targets: this.nutritionStore.targets(),
        currentTotals: this.nutritionStore.today(),
        dishes,
      });
      this.loggingAiSuggestions.set(suggestions);
      void this.showToast(`AI đã gợi ý ${suggestions.length} món cho ${this.loggingMealLabel()}`);
    } catch (err) {
      console.warn('[CalendarPage] AI menu suggestion failed:', err);
      void this.showToast(
        err instanceof GeminiError
          ? GEMINI_ERROR_TOAST[err.kind]
          : 'AI chưa gợi ý được món, vui lòng thử lại',
      );
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
    const result = await this.store.copyFromYesterday();
    if (result.copiedCount === 0) {
      void this.showToast('Hôm qua không có món để sao chép');
    } else {
      void this.showToast(`Đã sao chép ${result.copiedCount} món từ hôm qua`);
    }
  }

  onAiFromEmpty(): void {
    this.onAiCta();
  }

  // -- Long-press → context menu (AC-3) --------------------------------------
  onDishLongPress(plannedDishId: string, mealType: MealType): void {
    const dish = this.findDish(plannedDishId);
    if (!dish) return;
    this.contextMenu.set({ plannedDishId, dishName: dish.dish_name, mealType });
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
    } else if (action === 'move') {
      this.slotPickerMode.set('move');
    } else if (action === 'copy') {
      this.copyToDatePickerOpen.set(true);
    }
  }

  // -- Move flow -------------------------------------------------------------
  async onSlotPicked(target: MealType): Promise<void> {
    const ctx = this.contextMenu();
    const mode = this.slotPickerMode();
    this.slotPickerMode.set(null);
    if (!ctx || mode !== 'move') {
      this.contextMenu.set(null);
      return;
    }
    if (target === ctx.mealType) {
      // No-op: same slot. Just close.
      this.contextMenu.set(null);
      return;
    }
    const targetSlot = this.slotsInOrder().find((s) => s.meal_type === target);
    if (!targetSlot) {
      void this.showToast('Bữa đích không tồn tại');
      this.contextMenu.set(null);
      return;
    }
    await this.store.moveDish(ctx.plannedDishId, targetSlot.id);
    void this.showToast(`Đã chuyển "${ctx.dishName}" sang ${this.mealLabel(target)}`);
    this.contextMenu.set(null);
  }

  onSlotPickerDismiss(): void {
    this.slotPickerMode.set(null);
  }

  // -- Copy flow -------------------------------------------------------------
  async onCopyDatePicked(targetDate: string): Promise<void> {
    const ctx = this.contextMenu();
    this.copyToDatePickerOpen.set(false);
    if (!ctx) return;
    await this.store.copyToDate(ctx.plannedDishId, targetDate, ctx.mealType);
    void this.showToast(`Đã sao chép "${ctx.dishName}" sang ${targetDate}`);
    this.contextMenu.set(null);
  }

  onCopyDatePickerDismiss(): void {
    this.copyToDatePickerOpen.set(false);
    this.contextMenu.set(null);
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

  private mealLabel(t: MealType): string {
    switch (t) {
      case 'breakfast':
        return 'bữa sáng';
      case 'lunch':
        return 'bữa trưa';
      case 'dinner':
        return 'bữa chiều';
      case 'snack':
        return 'bữa phụ';
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}

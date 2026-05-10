import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
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
import { calendarOutline, settingsOutline, sparklesOutline } from 'ionicons/icons';
import type { MealSlotWithDishes, MealType } from '../../core/models/meal-plan.types';
import { CalendarStore } from '../../core/stores/calendar.store';
import { relativeDateLabel } from '../../core/utils/relative-date-label';
import {
  ConfirmEatModal,
  type ConfirmEatMode,
} from '../../shared/components/confirm-eat-modal/confirm-eat-modal';
import { DaySummaryCard } from './components/day-summary-card/day-summary-card';
import { EmptyDayState } from './components/empty-day-state/empty-day-state';
import { MealSlotCard } from './components/meal-slot-card/meal-slot-card';

const MEAL_ORDER: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const SWIPE_THRESHOLD_PX = 60;
const DAY_MS = 86_400_000;

interface PendingConfirm {
  mode: ConfirmEatMode;
  plannedDishId: string;
  dishName: string;
}

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
    DaySummaryCard,
    EmptyDayState,
    MealSlotCard,
  ],
})
export default class CalendarPage implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly gestureCtrl = inject(GestureController);
  private readonly destroyRef = inject(DestroyRef);
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

  constructor() {
    addIcons({ calendarOutline, settingsOutline, sparklesOutline });
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
    this.destroyRef.onDestroy(() => this.gesture?.destroy());
  }

  openSettings(): void {
    void this.router.navigate(['/settings']);
  }

  onDateChipTap(): void {
    void this.showToast('Date picker sẽ ra mắt ở Story 3.7');
  }

  onWeekToggle(): void {
    void this.showToast('Week View sẽ ra mắt ở Story 3.6');
  }

  onAiCta(): void {
    void this.showToast('Tính năng AI sẽ ra mắt Phase 5');
  }

  onMealAddTap(_mealType: MealType): void {
    void this.showToast('Modal thêm món sẽ ra mắt ở Epic 4');
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

  onCopyFromYesterdayDeferred(): void {
    void this.showToast('Sao chép từ hôm qua sẽ ra mắt ở Story 3.7');
  }

  onAiFromEmpty(): void {
    this.onAiCta();
  }

  private findDish(plannedDishId: string) {
    for (const slot of this.slotsInOrder()) {
      const found = slot.planned_dishes.find((d) => d.id === plannedDishId);
      if (found) return found;
    }
    return undefined;
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

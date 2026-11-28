import {
  Component,
  DestroyRef,
  ElementRef,
  LOCALE_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  GestureController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { CalendarBody } from './calendar-body';
import {
  addCircleOutline,
  alertCircleOutline,
  calendarClearOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  ellipseOutline,
  ellipsisHorizontal,
  lockClosedOutline,
  radioButtonOnOutline,
  removeCircleOutline,
} from 'ionicons/icons';
import { LocalDay } from '../../../core/stores/local-day';
import { NutritionStore } from '../../../core/stores/nutrition.store';
import type { PendingMealTarget } from '../../../core/stores/calendar.store';
import { shiftIsoDate } from '../../../core/utils/local-date';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ConfirmEatModal } from '../../../shared/components/confirm-eat-modal/confirm-eat-modal';
import { DatePickerModal } from '../../../shared/components/date-picker-modal/date-picker-modal';
import { DishContextMenuModal } from '../../../shared/components/dish-context-menu-modal/dish-context-menu-modal';
import { MealSlotPickerModal } from '../../../shared/components/meal-slot-picker-modal/meal-slot-picker-modal';
import { UndoToastQueue } from '../../../core/services/undo-toast-queue';
import { LoggingPicker } from './logging/logging-picker';
import CalendarPage from '../calendar.page';
import {
  loadCalendarRenderer,
  type CalendarAction,
  type CalendarHandle,
} from './calendar-renderer';

@Component({
  selector: 'app-leptos-calendar',
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CalendarBody,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    ConfirmDialog,
    ConfirmEatModal,
    DatePickerModal,
    DishContextMenuModal,
    MealSlotPickerModal,
    LoggingPicker,
  ],
})
export default class LeptosCalendarPage extends CalendarPage {
  private readonly controls = viewChild.required<ElementRef<HTMLElement>>('controls');
  private readonly body = viewChild.required<CalendarBody, ElementRef<HTMLElement>>('body', {
    read: ElementRef,
  });
  private readonly undo = viewChild.required<ElementRef<HTMLElement>>('undo');
  private readonly scope = inject(DestroyRef);
  private readonly calendarDay = inject(LocalDay);
  private readonly nutrition = inject(NutritionStore);
  private readonly gestures = inject(GestureController);
  private readonly undoService = inject(UndoToastQueue);
  private readonly locale = inject(LOCALE_ID);
  protected readonly renderer = signal<CalendarHandle | null>(null);
  private requested: PendingMealTarget | null = null;
  private visible = false;
  private frame: number | undefined;
  private readonly state = computed(() =>
    JSON.stringify({
      date: this.store.currentDate(),
      today: this.calendarDay.iso(),
      view: this.store.currentView(),
      locale: this.locale,
      weekDays: this.store.weekDays(),
      week: this.store.weekData(),
      summary: {
        totals: this.nutrition.today(),
        targets: this.nutrition.targets(),
        primaryMetric: this.nutrition.keyMetric(),
        loading: this.nutrition.loading(),
      },
      plan: this.store.dayPlan(),
      online: this.network.online(),
      aiIssue: this.ai.textIssue(),
      aiPlanning: this.aiPlanning(),
      copyingYesterday: this.store.copyingYesterday(),
      copyingWeek: this.copyingPreviousWeek(),
      undo: this.activeUndo()?.message ?? null,
    }),
  );

  constructor() {
    super();
    addIcons({
      addCircleOutline,
      alertCircleOutline,
      calendarClearOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      ellipseOutline,
      ellipsisHorizontal,
      lockClosedOutline,
      radioButtonOnOutline,
      removeCircleOutline,
    });
    afterNextRender(async () => {
      const module = await loadCalendarRenderer();
      if (this.scope.destroyed) return;
      const handle = module.mountCalendar(
        this.controls().nativeElement,
        this.body().nativeElement,
        this.undo().nativeElement,
        this.state(),
        (action) => this.dispatch(action),
      );
      this.renderer.set(handle);
    });
    effect(() => {
      const handle = this.renderer();
      if (!handle) return;
      handle.update(this.state());
      this.queueFocus();
    });
    this.scope.onDestroy(() => {
      if (this.frame !== undefined) cancelAnimationFrame(this.frame);
      this.renderer()?.free();
    });
  }

  override ngAfterViewInit(): void {
    const gesture = this.gestures.create({
      el: this.body().nativeElement,
      gestureName: 'calendar-day-swipe',
      threshold: 30,
      canStart: () => this.store.currentView() === 'day',
      onEnd: ({ deltaX }) => {
        if (Math.abs(deltaX) >= 60)
          this.store.setDate(shiftIsoDate(this.store.currentDate(), deltaX < 0 ? 1 : -1));
      },
    });
    gesture.enable(true);
    this.scope.onDestroy(() => {
      gesture.destroy();
      this.undoService.clear();
    });
  }
  override ionViewWillEnter(): void {
    this.requested = this.store.pendingMealNavigation();
    super.ionViewWillEnter();
  }
  override ionViewDidEnter(): void {
    super.ionViewDidEnter();
    this.visible = true;
    this.queueFocus();
  }
  override ionViewWillLeave(): void {
    super.ionViewWillLeave();
    this.visible = false;
    this.requested = null;
  }
  private queueFocus(): void {
    const target = this.requested;
    if (!this.visible || !target) return;
    if (this.store.currentDate() !== target.date || this.store.currentView() !== 'day') {
      this.requested = null;
      return;
    }
    if (this.store.dayPlan()?.date !== target.date) return;
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      this.frame = undefined;
      if (
        this.visible &&
        this.requested === target &&
        this.store.currentDate() === target.date &&
        this.store.currentView() === 'day' &&
        this.store.dayPlan()?.date === target.date &&
        this.renderer()?.focusPending(target.mealType, target.plannedDishId)
      )
        this.requested = null;
    });
  }
  private dispatch(a: CalendarAction): void {
    switch (a.type) {
      case 'datePicker':
        this.onDateChipTap();
        break;
      case 'toggleView':
        this.onWeekToggle();
        break;
      case 'weekDay':
        this.onWeekDayTap(a.date);
        break;
      case 'weekNav':
        this.onWeekNav(a.delta);
        break;
      case 'copyWeek':
        this.onCopyPreviousWeek();
        break;
      case 'plan':
        this.onPlanFromEmpty();
        break;
      case 'copyYesterday':
        void this.onCopyFromYesterday();
        break;
      case 'ai':
        void this.onAiCta();
        break;
      case 'add':
        void this.onMealAddTap(a.meal);
        break;
      case 'mark':
        this.onMarkEaten(a.id);
        break;
      case 'unmark':
        this.onUnmarkEaten(a.id);
        break;
      case 'options':
        this.onDishLongPress(a.id, a.meal);
        break;
      case 'undo':
        void this.onUndoTap();
        break;
      case 'dismissUndo':
        this.onUndoDismiss();
        break;
    }
  }
}

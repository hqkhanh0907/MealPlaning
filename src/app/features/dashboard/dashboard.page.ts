import { DatePipe, DecimalPipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  cameraOutline,
  chevronForwardOutline,
  fitnessOutline,
  flameOutline,
  scaleOutline,
  settingsOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { DashboardStore } from '../../core/stores/dashboard.store';
import { CalendarStore, type PendingMealTarget } from '../../core/stores/calendar.store';
import { MEAL_LABELS, MEAL_TYPES, type MealType } from '../../core/models/meal-plan.types';
import { MAX_PHOTO_GRAMS, portionNutrition, validPhotoGrams } from '../../core/models/photo-meal';
import { aiErrorMessage } from '../../core/services/ai/ai-generation';
import { AiAvailability } from '../../shared/ai-availability';
import { AiOfflineBanner } from '../../shared/components/ai-offline-banner/ai-offline-banner';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    DatePipe,
    RouterLink,
    AiOfflineBanner,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonButtons,
    IonButton,
    IonIcon,
  ],
})
export default class DashboardPage {
  private readonly router = inject(Router);
  private readonly calendar = inject(CalendarStore);
  private readonly toastCtrl = inject(ToastController);
  protected readonly dashboard = inject(DashboardStore);
  protected readonly ai = inject(AiAvailability);
  protected readonly maxPhotoGrams = MAX_PHOTO_GRAMS;
  protected readonly portionNutrition = portionNutrition;
  protected readonly isFinite = Number.isFinite;
  protected readonly validPhotoGrams = validPhotoGrams;
  protected readonly photoError = signal('');
  protected readonly insightError = signal('');
  private readonly insightTitle = viewChild<ElementRef<HTMLElement>>('insightTitle');
  private readonly reviewTitle = viewChild<ElementRef<HTMLElement>>('reviewTitle');
  private readonly injector = inject(Injector);
  protected readonly mealLabels = MEAL_LABELS;
  protected readonly mealTypes = MEAL_TYPES;

  constructor() {
    addIcons({
      calendarOutline,
      cameraOutline,
      chevronForwardOutline,
      fitnessOutline,
      flameOutline,
      scaleOutline,
      settingsOutline,
      sparklesOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.dashboard.refresh();
  }

  openSettings(): void {
    void this.router.navigate(['/settings']);
  }

  async addMeal(): Promise<void> {
    this.calendar.addMealForDate.set(this.dashboard.todayIso());
    if (!(await this.router.navigate(['/tabs/calendar']))) this.calendar.addMealForDate.set(null);
  }

  async openPendingMeal(event: MouseEvent, target: PendingMealTarget): Promise<void> {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    this.calendar.pendingMealNavigation.set(target);
    let reachedCalendar = false;
    try {
      reachedCalendar =
        (await this.router.navigate(['/tabs/calendar'])) && this.router.url === '/tabs/calendar';
    } finally {
      if (!reachedCalendar && this.calendar.pendingMealNavigation() === target) {
        this.calendar.pendingMealNavigation.set(null);
      }
    }
  }

  confidenceLabel(value: 'high' | 'medium' | 'low'): string {
    switch (value) {
      case 'high':
        return 'cao';
      case 'medium':
        return 'vừa';
      case 'low':
        return 'thấp';
    }
  }

  async generateDailyInsight(): Promise<void> {
    this.insightError.set('');
    try {
      const insight = await this.dashboard.generateDailyAiInsight();
      if (insight) this.focusResult(this.insightTitle);
    } catch (err) {
      this.insightError.set(aiErrorMessage(err, 'AI chưa tạo được nhận xét. Vui lòng thử lại.'));
    }
  }

  async analyzeMealPhoto(): Promise<void> {
    this.photoError.set('');
    try {
      await this.dashboard.analyzeMealPhoto();
      this.focusResult(this.reviewTitle);
    } catch (err) {
      if (err instanceof Error && /cancelled|canceled/i.test(err.message)) return;
      this.photoError.set(aiErrorMessage(err, 'Chưa phân tích được ảnh. Hãy thử lại.'));
    }
  }

  selectPhotoMeal(value: string): void {
    if (Object.hasOwn(this.mealLabels, value)) this.dashboard.setPhotoMealType(value as MealType);
  }

  cancelPhoto(): void {
    this.dashboard.discardPhoto();
    this.photoError.set('');
  }

  async savePhoto(): Promise<void> {
    this.photoError.set('');
    try {
      if (await this.dashboard.savePhoto()) void this.showToast('Đã lưu bữa ăn vào nhật ký.');
    } catch {
      this.photoError.set('Chưa lưu được bữa ăn. Khẩu phần vừa sửa vẫn còn để thử lại.');
    }
  }

  private focusResult(heading: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(
      () => {
        const element = heading()?.nativeElement;
        element?.scrollIntoView({ block: 'start' });
        element?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      position: 'bottom',
      positionAnchor: 'ion-tab-bar',
    });
    await toast.present();
  }
}

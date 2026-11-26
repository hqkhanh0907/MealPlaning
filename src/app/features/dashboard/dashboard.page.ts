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
  IonCheckbox,
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
import {
  MAX_PHOTO_GRAMS,
  MAX_PHOTO_NAME_LENGTH,
  portionNutrition,
  validPhotoGrams,
  validPhotoName,
} from '../../core/models/photo-meal';
import { aiErrorMessage } from '../../core/services/ai/ai-generation';
import { AiAvailability } from '../../shared/ai-availability';
import { AiOfflineBanner } from '../../shared/components/ai-offline-banner/ai-offline-banner';
import { AppFormField } from '../../shared/forms/form-field/form-field';

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
    AppFormField,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonButtons,
    IonButton,
    IonCheckbox,
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
  protected readonly maxPhotoNameLength = MAX_PHOTO_NAME_LENGTH;
  protected readonly portionNutrition = portionNutrition;
  protected readonly isFinite = Number.isFinite;
  protected readonly validPhotoGrams = validPhotoGrams;
  protected readonly validPhotoName = validPhotoName;
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
    await this.openMealPicker(this.dashboard.todayIso());
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

  async enterPhotoMealManually(): Promise<void> {
    if (this.dashboard.photoSaving()) return;
    const draft = this.dashboard.photoDraft();
    this.photoError.set('');
    const opened = await this.openMealPicker(draft?.date ?? this.dashboard.todayIso()).catch(
      () => false,
    );
    if (opened) this.cancelPhoto();
    else this.photoError.set('Chưa mở được màn ghi tay. Vui lòng thử lại.');
  }

  async savePhoto(): Promise<void> {
    this.photoError.set('');
    try {
      if (await this.dashboard.savePhoto()) void this.showToast('Đã lưu bữa ăn vào nhật ký.');
    } catch {
      this.photoError.set('Chưa lưu được bữa ăn. Khẩu phần vừa sửa vẫn còn để thử lại.');
    }
  }

  private async openMealPicker(date: string): Promise<boolean> {
    this.calendar.addMealForDate.set(date);
    let opened = false;
    try {
      opened =
        (await this.router.navigate(['/tabs/calendar'])) && this.router.url === '/tabs/calendar';
      return opened;
    } finally {
      if (!opened && this.calendar.addMealForDate() === date) {
        this.calendar.addMealForDate.set(null);
      }
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

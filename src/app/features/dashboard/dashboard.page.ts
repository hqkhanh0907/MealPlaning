import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  bodyOutline,
  calendarOutline,
  cameraOutline,
  chevronForwardOutline,
  fitnessOutline,
  flameOutline,
  refreshOutline,
  restaurantOutline,
  scaleOutline,
  settingsOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { DashboardStore } from '../../core/stores/dashboard.store';
import { NetworkStore } from '../../core/stores/network.store';
import { GEMINI_ERROR_TOAST, GeminiError } from '../../core/services/ai/gemini-types';
import { AiOfflineBanner } from '../../shared/components/ai-offline-banner/ai-offline-banner';
import { CalorieRing } from '../../shared/components/calorie-ring/calorie-ring';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AiOfflineBanner,
    CalorieRing,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
  ],
})
export default class DashboardPage {
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  protected readonly dashboard = inject(DashboardStore);
  protected readonly network = inject(NetworkStore);

  constructor() {
    addIcons({
      barbellOutline,
      bodyOutline,
      calendarOutline,
      cameraOutline,
      chevronForwardOutline,
      fitnessOutline,
      flameOutline,
      refreshOutline,
      restaurantOutline,
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

  refresh(): void {
    void this.dashboard.refresh();
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
    try {
      const insight = await this.dashboard.generateDailyAiInsight();
      void this.showToast(`AI đã tạo insight: ${insight.action}`);
    } catch (err) {
      console.warn('[DashboardPage] AI daily insight failed:', err);
      void this.showToast(this.aiErrorMessage(err, 'AI chưa tạo được insight, vui lòng thử lại'));
    }
  }

  async analyzeMealPhoto(): Promise<void> {
    try {
      const result = await this.dashboard.analyzeMealPhoto();
      void this.showToast(`AI đã phân tích ${result.items.length} mục trong ảnh`);
    } catch (err) {
      console.warn('[DashboardPage] AI food image analysis failed:', err);
      void this.showToast(this.aiErrorMessage(err, 'AI chưa phân tích được ảnh, vui lòng thử lại'));
    }
  }

  private aiErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof GeminiError) {
      return GEMINI_ERROR_TOAST[err.kind];
    }
    if (err instanceof Error && err.message.includes('requires network')) {
      return 'Cần kết nối mạng để dùng AI';
    }
    return fallback;
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      position: 'bottom',
    });
    await toast.present();
  }
}

import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonProgressBar,
  IonText,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, arrowBackOutline, checkmarkOutline } from 'ionicons/icons';
import { ProfileStore } from '../../core/stores/profile.store';
import { UserProfile } from '../../core/models/user-profile.model';

type Goal = UserProfile['goal'];
type Gender = UserProfile['gender'];
type FitnessLevel = UserProfile['fitness_level'];

/** Gym experience options mapped to fitness_level */
type GymExperience = 'never' | 'under_6m' | '6m_2y' | 'over_2y';

const GYM_TO_LEVEL: Record<GymExperience, FitnessLevel> = {
  never: 'beginner',
  under_6m: 'beginner',
  '6m_2y': 'intermediate',
  over_2y: 'advanced',
};

const PROTEIN_MULTIPLIER: Record<Goal, number> = {
  lose_weight: 2.2,
  gain_muscle: 2.2,
  maintain: 1.6,
  performance: 2.0,
};

const CALORIE_ADJUSTMENT: Record<Goal, number> = {
  lose_weight: -500,
  gain_muscle: 300,
  maintain: 0,
  performance: 200,
};

@Component({
  selector: 'app-onboarding',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ step() === 1 ? 'Mục tiêu' : 'Thông tin' }}</ion-title>
      </ion-toolbar>
      <ion-progress-bar [value]="step() / 2" />
    </ion-header>

    <ion-content class="ion-padding">
      <!-- STEP 1: Goal Selection -->
      @if (step() === 1) {
        <div class="step-content">
          <h1 class="step-title">Mục tiêu của bạn?</h1>
          <p class="step-subtitle">Chọn 1 mục tiêu chính</p>

          <ion-radio-group [value]="goal()" (ionChange)="goal.set($event.detail.value)">
            <ion-item lines="none" class="goal-item">
              <ion-radio value="lose_weight" labelPlacement="end"> 🏃 Giảm cân </ion-radio>
            </ion-item>
            <ion-item lines="none" class="goal-item">
              <ion-radio value="gain_muscle" labelPlacement="end"> 💪 Tăng cơ </ion-radio>
            </ion-item>
            <ion-item lines="none" class="goal-item">
              <ion-radio value="maintain" labelPlacement="end"> ⚖️ Duy trì </ion-radio>
            </ion-item>
            <ion-item lines="none" class="goal-item">
              <ion-radio value="performance" labelPlacement="end"> 🏋️ Tăng sức mạnh </ion-radio>
            </ion-item>
          </ion-radio-group>

          @if (step1Error()) {
            <ion-text color="danger">
              <p class="error-text">{{ step1Error() }}</p>
            </ion-text>
          }

          <ion-button expand="block" class="cta-button" (click)="nextStep()">
            Tiếp tục
            <ion-icon slot="end" name="arrow-forward-outline" />
          </ion-button>
        </div>
      }

      <!-- STEP 2: Profile Info -->
      @if (step() === 2) {
        <div class="step-content">
          <h1 class="step-title">Thông tin cơ bản</h1>
          <p class="step-subtitle">Hoàn thành để tính mục tiêu dinh dưỡng</p>

          <ion-item>
            <ion-input
              label="Chiều cao (cm)"
              labelPlacement="floating"
              type="number"
              [value]="heightCm()"
              (ionInput)="heightCm.set(+$event.detail.value!)"
              min="130"
              max="250"
            />
          </ion-item>

          <ion-item>
            <ion-input
              label="Cân nặng (kg)"
              labelPlacement="floating"
              type="number"
              [value]="weightKg()"
              (ionInput)="weightKg.set(+$event.detail.value!)"
              min="30"
              max="200"
            />
          </ion-item>

          <ion-item>
            <ion-input
              label="Tuổi"
              labelPlacement="floating"
              type="number"
              [value]="age()"
              (ionInput)="age.set(+$event.detail.value!)"
              min="13"
              max="120"
            />
          </ion-item>

          <ion-item>
            <ion-select
              label="Giới tính"
              labelPlacement="floating"
              [value]="gender()"
              (ionChange)="gender.set($event.detail.value)"
            >
              <ion-select-option value="male">Nam</ion-select-option>
              <ion-select-option value="female">Nữ</ion-select-option>
            </ion-select>
          </ion-item>

          <p class="section-label">Kinh nghiệm tập gym?</p>
          <ion-radio-group
            [value]="gymExperience()"
            (ionChange)="gymExperience.set($event.detail.value)"
          >
            <ion-item lines="none">
              <ion-radio value="never" labelPlacement="end"> Chưa bao giờ </ion-radio>
            </ion-item>
            <ion-item lines="none">
              <ion-radio value="under_6m" labelPlacement="end"> Dưới 6 tháng </ion-radio>
            </ion-item>
            <ion-item lines="none">
              <ion-radio value="6m_2y" labelPlacement="end"> 6 tháng — 2 năm </ion-radio>
            </ion-item>
            <ion-item lines="none">
              <ion-radio value="over_2y" labelPlacement="end"> Trên 2 năm </ion-radio>
            </ion-item>
          </ion-radio-group>

          @if (step2Error()) {
            <ion-text color="danger">
              <p class="error-text">{{ step2Error() }}</p>
            </ion-text>
          }

          <div class="button-row">
            <ion-button fill="outline" (click)="step.set(1)">
              <ion-icon slot="start" name="arrow-back-outline" />
              Quay lại
            </ion-button>
            <ion-button class="cta-button" (click)="complete()" [disabled]="saving()">
              {{ saving() ? 'Đang lưu...' : 'Hoàn tất' }}
              <ion-icon slot="end" name="checkmark-outline" />
            </ion-button>
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [
    `
      .step-content {
        max-width: 428px;
        margin: 0 auto;
      }
      .step-title {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .step-subtitle {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 20px;
      }
      .goal-item {
        --padding-start: 0;
        margin-bottom: 8px;
      }
      .section-label {
        font-size: 14px;
        font-weight: 500;
        margin-top: 16px;
        margin-bottom: 8px;
      }
      .error-text {
        font-size: 13px;
        margin-top: 8px;
      }
      .cta-button {
        --background: var(--ion-color-secondary);
        --color: #fff;
        margin-top: 24px;
      }
      .button-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 24px;
      }
      .button-row ion-button {
        flex: 1;
      }
      ion-item {
        --padding-start: 0;
        margin-bottom: 4px;
      }
    `,
  ],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonProgressBar,
    IonText,
  ],
})
export default class OnboardingPage {
  private readonly router = inject(Router);
  private readonly profileStore = inject(ProfileStore);

  // Wizard state
  readonly step = signal(1);
  readonly saving = signal(false);

  // Step 1
  readonly goal = signal<Goal | null>(null);
  readonly step1Error = signal('');

  // Step 2
  readonly heightCm = signal<number>(0);
  readonly weightKg = signal<number>(0);
  readonly age = signal<number>(0);
  readonly gender = signal<Gender | null>(null);
  readonly gymExperience = signal<GymExperience | null>(null);
  readonly step2Error = signal('');

  constructor() {
    addIcons({ arrowForwardOutline, arrowBackOutline, checkmarkOutline });
  }

  nextStep(): void {
    if (!this.goal()) {
      this.step1Error.set('Vui lòng chọn mục tiêu');
      return;
    }
    this.step1Error.set('');
    this.step.set(2);
  }

  async complete(): Promise<void> {
    const error = this.validateStep2();
    if (error) {
      this.step2Error.set(error);
      return;
    }
    this.step2Error.set('');
    this.saving.set(true);

    const goal = this.goal()!;
    const gender = this.gender()!;
    const heightCm = this.heightCm();
    const weightKg = this.weightKg();
    const age = this.age();
    const fitnessLevel = GYM_TO_LEVEL[this.gymExperience()!];

    // Mifflin-St Jeor formula
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161);

    const activityFactor = 1.55;
    const tdee = Math.round(bmr * activityFactor);
    const targetCalories = Math.round(tdee + CALORIE_ADJUSTMENT[goal]);
    const targetProtein = Math.round(weightKg * PROTEIN_MULTIPLIER[goal]);

    await this.profileStore.saveOnboardingProfile({
      height_cm: heightCm,
      weight_kg: weightKg,
      age,
      gender,
      goal,
      fitness_level: fitnessLevel,
      activity_factor: activityFactor,
      bmr: Math.round(bmr),
      tdee,
      target_calories: targetCalories,
      target_protein: targetProtein,
      target_carbs: null,
      target_fat: null,
      theme: 'system',
      notif_morning: 1,
      notif_lunch: 1,
      notif_evening: 1,
      notif_weekly: 1,
      onboarding_completed: 1,
    });

    void this.router.navigate(['/']);
  }

  private validateStep2(): string {
    const h = this.heightCm();
    const w = this.weightKg();
    const a = this.age();

    if (!h || h < 130 || h > 250) return 'Chiều cao phải từ 130-250 cm';
    if (!w || w < 30 || w > 200) return 'Cân nặng phải từ 30-200 kg';
    if (!a || a < 13 || a > 120) return 'Tuổi phải từ 13-120';
    if (!this.gender()) return 'Vui lòng chọn giới tính';
    if (!this.gymExperience()) return 'Vui lòng chọn kinh nghiệm tập gym';
    return '';
  }
}

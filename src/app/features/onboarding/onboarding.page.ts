import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
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
import {
  arrowBackOutline,
  bodyOutline,
  barbellOutline,
  scaleOutline,
  trophyOutline,
} from 'ionicons/icons';
import { ProfileStore } from '../../core/stores/profile.store';
import { UserProfile } from '../../core/models/user-profile.model';

type Goal = UserProfile['goal'];
type Gender = UserProfile['gender'];
type FitnessLevel = UserProfile['fitness_level'];

/** Gym experience options mapped to fitness_level + activity_factor */
export type GymExperience = 'never' | 'under_6m' | '6m_2y' | 'over_2y';

export const GYM_TO_LEVEL: Record<GymExperience, FitnessLevel> = {
  never: 'beginner',
  under_6m: 'beginner',
  '6m_2y': 'intermediate',
  over_2y: 'advanced',
};

/** PRD §6: Activity factors derived from gym experience */
export const GYM_TO_ACTIVITY_FACTOR: Record<GymExperience, number> = {
  never: 1.2,
  under_6m: 1.375,
  '6m_2y': 1.55,
  over_2y: 1.725,
};

export const PROTEIN_MULTIPLIER: Record<Goal, number> = {
  lose_weight: 2.2,
  gain_muscle: 2.2,
  maintain: 1.6,
  performance: 2.0,
};

export const CALORIE_ADJUSTMENT: Record<Goal, number> = {
  lose_weight: -500,
  gain_muscle: 300,
  maintain: 0,
  performance: 200,
};

/** Per-field error state for Step 2 */
interface Step2Errors {
  heightCm: string;
  weightKg: string;
  age: string;
  gender: string;
  gymExperience: string;
}

const EMPTY_ERRORS: Step2Errors = {
  heightCm: '',
  weightKg: '',
  age: '',
  gender: '',
  gymExperience: '',
};

@Component({
  selector: 'app-onboarding',
  template: `
    <ion-header>
      <ion-toolbar>
        @if (step() === 2) {
          <ion-button fill="clear" slot="start" (click)="goBack()" class="back-button">
            <ion-icon slot="icon-only" name="arrow-back-outline" />
          </ion-button>
        }
        <ion-title>{{ step() === 1 ? 'Mục tiêu' : 'Thông tin' }}</ion-title>
      </ion-toolbar>
      <ion-progress-bar [value]="step() / 2" class="onboarding-progress" />
    </ion-header>

    <ion-content>
      <div class="page-container">
        <!-- STEP 1: Goal Selection -->
        @if (step() === 1) {
          <div class="step-content">
            <h1 #step1Heading class="step-title" tabindex="-1">Mục tiêu của bạn?</h1>
            <p class="step-subtitle">Chọn 1 mục tiêu chính</p>

            <ion-radio-group
              [value]="goal()"
              (ionChange)="onGoalChange($event.detail.value)"
              aria-label="Chọn mục tiêu"
            >
              <ion-item lines="none" class="goal-item" [class.selected]="goal() === 'lose_weight'">
                <ion-icon name="body-outline" slot="start" class="goal-icon" />
                <ion-radio value="lose_weight" justify="start" labelPlacement="end"
                  >Giảm cân</ion-radio
                >
              </ion-item>
              <ion-item lines="none" class="goal-item" [class.selected]="goal() === 'gain_muscle'">
                <ion-icon name="barbell-outline" slot="start" class="goal-icon" />
                <ion-radio value="gain_muscle" justify="start" labelPlacement="end"
                  >Tăng cơ</ion-radio
                >
              </ion-item>
              <ion-item lines="none" class="goal-item" [class.selected]="goal() === 'maintain'">
                <ion-icon name="scale-outline" slot="start" class="goal-icon" />
                <ion-radio value="maintain" justify="start" labelPlacement="end">Duy trì</ion-radio>
              </ion-item>
              <ion-item lines="none" class="goal-item" [class.selected]="goal() === 'performance'">
                <ion-icon name="trophy-outline" slot="start" class="goal-icon" />
                <ion-radio value="performance" justify="start" labelPlacement="end"
                  >Tăng sức mạnh</ion-radio
                >
              </ion-item>
            </ion-radio-group>

            @if (step1Error()) {
              <div class="error-toast" role="alert" aria-live="assertive">
                <ion-text color="danger">{{ step1Error() }}</ion-text>
              </div>
            }

            <ion-button expand="block" color="secondary" class="cta-button" (click)="nextStep()">
              Tiếp tục
            </ion-button>
          </div>
        }

        <!-- STEP 2: Profile Info -->
        @if (step() === 2) {
          <div class="step-content">
            <h1 #step2Heading class="step-title" tabindex="-1">Thông tin cơ bản</h1>
            <p class="step-subtitle">Hoàn thành để tính mục tiêu dinh dưỡng</p>

            <ion-input
              #heightInput
              label="Chiều cao (cm)"
              labelPlacement="floating"
              fill="outline"
              type="number"
              [value]="heightCm() ?? ''"
              (ionInput)="heightCm.set($event.detail.value ? +$event.detail.value : null)"
              min="130"
              max="250"
              [class.ion-invalid]="step2Errors().heightCm"
              [attr.aria-invalid]="step2Errors().heightCm ? 'true' : null"
              [attr.aria-describedby]="step2Errors().heightCm ? 'err-height' : null"
            />
            @if (step2Errors().heightCm) {
              <div id="err-height" class="field-error" role="alert">
                {{ step2Errors().heightCm }}
              </div>
            }

            <ion-input
              #weightInput
              label="Cân nặng (kg)"
              labelPlacement="floating"
              fill="outline"
              type="number"
              [value]="weightKg() ?? ''"
              (ionInput)="weightKg.set($event.detail.value ? +$event.detail.value : null)"
              min="30"
              max="200"
              [class.ion-invalid]="step2Errors().weightKg"
              [attr.aria-invalid]="step2Errors().weightKg ? 'true' : null"
              [attr.aria-describedby]="step2Errors().weightKg ? 'err-weight' : null"
            />
            @if (step2Errors().weightKg) {
              <div id="err-weight" class="field-error" role="alert">
                {{ step2Errors().weightKg }}
              </div>
            }

            <ion-input
              #ageInput
              label="Tuổi"
              labelPlacement="floating"
              fill="outline"
              type="number"
              [value]="age() ?? ''"
              (ionInput)="age.set($event.detail.value ? +$event.detail.value : null)"
              min="13"
              max="120"
              [class.ion-invalid]="step2Errors().age"
              [attr.aria-invalid]="step2Errors().age ? 'true' : null"
              [attr.aria-describedby]="step2Errors().age ? 'err-age' : null"
            />
            @if (step2Errors().age) {
              <div id="err-age" class="field-error" role="alert">{{ step2Errors().age }}</div>
            }

            <ion-select
              label="Giới tính"
              labelPlacement="floating"
              fill="outline"
              [value]="gender()"
              (ionChange)="gender.set($event.detail.value)"
              [class.ion-invalid]="step2Errors().gender"
              [attr.aria-invalid]="step2Errors().gender ? 'true' : null"
              [attr.aria-describedby]="step2Errors().gender ? 'err-gender' : null"
            >
              <ion-select-option value="male">Nam</ion-select-option>
              <ion-select-option value="female">Nữ</ion-select-option>
            </ion-select>
            @if (step2Errors().gender) {
              <div id="err-gender" class="field-error" role="alert">{{ step2Errors().gender }}</div>
            }

            <p class="section-label">Kinh nghiệm tập gym?</p>
            <ion-radio-group
              [value]="gymExperience()"
              (ionChange)="gymExperience.set($event.detail.value)"
              aria-label="Kinh nghiệm tập gym"
            >
              <ion-item
                lines="none"
                class="gym-item"
                [class.selected]="gymExperience() === 'never'"
              >
                <ion-radio value="never" justify="start" labelPlacement="end"
                  >Chưa bao giờ</ion-radio
                >
              </ion-item>
              <ion-item
                lines="none"
                class="gym-item"
                [class.selected]="gymExperience() === 'under_6m'"
              >
                <ion-radio value="under_6m" justify="start" labelPlacement="end"
                  >Dưới 6 tháng</ion-radio
                >
              </ion-item>
              <ion-item
                lines="none"
                class="gym-item"
                [class.selected]="gymExperience() === '6m_2y'"
              >
                <ion-radio value="6m_2y" justify="start" labelPlacement="end"
                  >6 tháng — 2 năm</ion-radio
                >
              </ion-item>
              <ion-item
                lines="none"
                class="gym-item"
                [class.selected]="gymExperience() === 'over_2y'"
              >
                <ion-radio value="over_2y" justify="start" labelPlacement="end"
                  >Trên 2 năm</ion-radio
                >
              </ion-item>
            </ion-radio-group>
            @if (step2Errors().gymExperience) {
              <div class="field-error" role="alert">{{ step2Errors().gymExperience }}</div>
            }

            @if (saveError()) {
              <div class="error-toast" role="alert" aria-live="assertive">
                <ion-text color="danger">{{ saveError() }}</ion-text>
              </div>
            }

            <div class="button-row">
              <ion-button fill="outline" (click)="goBack()" [disabled]="saving()">
                Quay lại
              </ion-button>
              <ion-button
                color="secondary"
                class="cta-button"
                (click)="complete()"
                [disabled]="saving()"
              >
                {{ saving() ? 'Đang lưu...' : 'Hoàn tất' }}
              </ion-button>
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page-container {
        padding: 12px 16px 16px;
      }
      .step-content {
        max-width: 428px;
        margin: 0 auto;
      }
      .step-title {
        font: 700 22px/1.3 var(--ion-font-family);
        color: var(--text-primary);
        margin-bottom: 4px;
        outline: none;
      }
      .step-subtitle {
        font: 500 16px/1.4 var(--ion-font-family);
        color: var(--text-tertiary);
        margin-bottom: 24px;
      }
      .section-label {
        font: 500 14px/1.4 var(--ion-font-family);
        color: var(--text-primary);
        margin: 16px 0 8px;
      }
      .goal-item,
      .gym-item {
        --padding-start: 16px;
        --border-radius: 12px;
        --background: var(--bg-card);
        margin-bottom: 8px;
        transition: background 0.15s ease;
      }
      .goal-item:hover,
      .gym-item:hover {
        --background: var(--primary-50, #e3f2fd);
      }
      .goal-item.selected,
      .gym-item.selected {
        --background: var(--primary-50, #e3f2fd);
        font-weight: 600;
      }
      .goal-item ion-radio,
      .gym-item ion-radio {
        min-width: 0;
        margin: 0;
      }
      .goal-icon {
        color: var(--ion-color-primary);
        font-size: 22px;
        margin-right: 8px;
      }
      ion-item {
        --padding-start: 16px;
        margin-bottom: 4px;
      }
      ion-item.ion-invalid {
        --highlight-color-invalid: var(--ion-color-danger);
      }
      ion-input[fill],
      ion-select[fill] {
        margin-bottom: 4px;
      }
      ion-input.ion-invalid,
      ion-select.ion-invalid {
        --border-color: var(--ion-color-danger);
      }
      .field-error {
        font: 400 12px/1.4 var(--ion-font-family);
        color: var(--ion-color-danger);
        padding-left: 4px;
        margin-bottom: 8px;
      }
      .error-toast {
        margin-top: 8px;
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(var(--ion-color-danger-rgb), 0.08);
        font-size: 13px;
      }
      .cta-button {
        --border-radius: 10px;
        margin-top: 24px;
        font-weight: 500;
        text-transform: none;
      }
      .back-button {
        --color: #fff;
      }
      ion-button[fill='outline'] {
        --border-radius: 10px;
        font-weight: 500;
        text-transform: none;
      }
      .button-row {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      .button-row ion-button {
        flex: 1;
        --height: 48px;
        margin-top: 0;
        margin-bottom: 0;
      }
      .onboarding-progress {
        --progress-background: rgba(255, 255, 255, 0.3);
        --buffer-background: transparent;
        height: 4px;
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

  readonly step1Heading = viewChild<ElementRef>('step1Heading');
  readonly step2Heading = viewChild<ElementRef>('step2Heading');

  // Wizard state
  readonly step = signal(1);
  readonly saving = signal(false);

  // Step 1
  readonly goal = signal<Goal | null>(null);
  readonly step1Error = signal('');

  // Step 2
  readonly heightCm = signal<number | null>(null);
  readonly weightKg = signal<number | null>(null);
  readonly age = signal<number | null>(null);
  readonly gender = signal<Gender | null>(null);
  readonly gymExperience = signal<GymExperience | null>(null);
  readonly step2Errors = signal<Step2Errors>({ ...EMPTY_ERRORS });
  readonly saveError = signal('');

  constructor() {
    addIcons({
      arrowBackOutline,
      bodyOutline,
      barbellOutline,
      scaleOutline,
      trophyOutline,
    });
  }

  onGoalChange(value: Goal): void {
    this.goal.set(value);
    this.step1Error.set('');
  }

  nextStep(): void {
    if (!this.goal()) {
      this.step1Error.set('Vui lòng chọn mục tiêu');
      return;
    }
    this.step1Error.set('');
    this.step.set(2);
    this.focusHeadingAfterRender('step2Heading');
  }

  goBack(): void {
    this.step.set(1);
    this.focusHeadingAfterRender('step1Heading');
  }

  async complete(): Promise<void> {
    const errors = this.validateStep2();
    const hasErrors = Object.values(errors).some((e) => e !== '');

    this.step2Errors.set(errors);
    if (hasErrors) {
      this.focusFirstInvalidField(errors);
      return;
    }

    this.saving.set(true);
    this.saveError.set('');

    try {
      const goal = this.goal()!;
      const gender = this.gender()!;
      const heightCm = this.heightCm()!;
      const weightKg = this.weightKg()!;
      const age = this.age()!;
      const gym = this.gymExperience()!;
      const fitnessLevel = GYM_TO_LEVEL[gym];
      const activityFactor = GYM_TO_ACTIVITY_FACTOR[gym];

      // Mifflin-St Jeor formula
      const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161);
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
    } catch {
      this.saveError.set('Lưu thất bại. Vui lòng thử lại.');
    } finally {
      this.saving.set(false);
    }
  }

  private validateStep2(): Step2Errors {
    const errors: Step2Errors = { ...EMPTY_ERRORS };
    const h = this.heightCm();
    const w = this.weightKg();
    const a = this.age();

    if (!h || h < 130 || h > 250) errors.heightCm = 'Chiều cao phải từ 130–250 cm';
    if (!w || w < 30 || w > 200) errors.weightKg = 'Cân nặng phải từ 30–200 kg';
    if (!a || a < 13 || a > 120) errors.age = 'Tuổi phải từ 13–120';
    if (!this.gender()) errors.gender = 'Vui lòng chọn giới tính';
    if (!this.gymExperience()) errors.gymExperience = 'Vui lòng chọn kinh nghiệm tập gym';

    return errors;
  }

  private focusHeadingAfterRender(ref: 'step1Heading' | 'step2Heading'): void {
    setTimeout(() => {
      const heading = this[ref]();
      if (heading) {
        heading.nativeElement.focus();
      }
    });
  }

  private focusFirstInvalidField(errors: Step2Errors): void {
    const fieldOrder: (keyof Step2Errors)[] = [
      'heightCm',
      'weightKg',
      'age',
      'gender',
      'gymExperience',
    ];
    const firstError = fieldOrder.find((f) => errors[f] !== '');
    if (!firstError) return;

    const idMap: Record<keyof Step2Errors, string> = {
      heightCm: 'err-height',
      weightKg: 'err-weight',
      age: 'err-age',
      gender: 'err-gender',
      gymExperience: '',
    };

    setTimeout(() => {
      const errorEl = document.getElementById(idMap[firstError]);
      errorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}

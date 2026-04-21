import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
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
  checkmark,
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

/** Activity level options for TDEE calculation (independent of gym experience) */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy';

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: 'Ít vận động',
  light: 'Nhẹ (1-3 ngày/tuần)',
  moderate: 'Trung bình (3-5 ngày/tuần)',
  heavy: 'Nặng (6-7 ngày/tuần)',
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

/** Per-field error state for Step 2a (body info) */
interface Step2aErrors {
  heightCm: string;
  weightKg: string;
  age: string;
  gender: string;
}

/** Per-field error state for Step 2b (activity info) */
interface Step2bErrors {
  activityLevel: string;
  gymExperience: string;
}

const EMPTY_2A: Step2aErrors = { heightCm: '', weightKg: '', age: '', gender: '' };
const EMPTY_2B: Step2bErrors = { activityLevel: '', gymExperience: '' };

@Component({
  selector: 'app-onboarding',
  template: `
    <!-- ============================== HEADER ============================== -->
    <ion-header>
      <ion-toolbar>
        @if (step() > 1) {
          <ion-buttons slot="start">
            <ion-button fill="clear" (click)="goBack()" class="back-button">
              <ion-icon slot="icon-only" name="arrow-back-outline" />
            </ion-button>
          </ion-buttons>
        }
        <ion-title>{{ toolbarTitle() }}</ion-title>
      </ion-toolbar>
      <ion-progress-bar [value]="progressValue()" class="onboarding-progress" />
    </ion-header>

    <ion-content>
      <div class="page-container">
        <!-- ======================== STEP 1: MỤC TIÊU ======================== -->
        @if (step() === 1) {
          <div class="step-content">
            <h1 #step1Heading class="step-title" tabindex="-1">Mục tiêu của bạn?</h1>
            <p class="step-subtitle">Chọn 1 mục tiêu chính</p>

            <div role="radiogroup" aria-label="Chọn mục tiêu">
              <div
                class="radio-item"
                [class.selected]="goal() === 'lose_weight'"
                (click)="goal.set('lose_weight')"
                role="radio"
                tabindex="0"
                [attr.aria-checked]="goal() === 'lose_weight'"
                (keydown.enter)="goal.set('lose_weight')"
                (keydown.space)="goal.set('lose_weight'); $event.preventDefault()"
              >
                <span class="radio-circle"></span>
                <ion-icon name="body-outline" class="radio-icon" />
                <span class="radio-label">Giảm cân</span>
                @if (goal() === 'lose_weight') {
                  <ion-icon name="checkmark" class="check-icon" />
                }
              </div>
              <div
                class="radio-item"
                [class.selected]="goal() === 'gain_muscle'"
                (click)="goal.set('gain_muscle')"
                role="radio"
                tabindex="0"
                [attr.aria-checked]="goal() === 'gain_muscle'"
                (keydown.enter)="goal.set('gain_muscle')"
                (keydown.space)="goal.set('gain_muscle'); $event.preventDefault()"
              >
                <span class="radio-circle"></span>
                <ion-icon name="barbell-outline" class="radio-icon" />
                <span class="radio-label">Tăng cơ</span>
                @if (goal() === 'gain_muscle') {
                  <ion-icon name="checkmark" class="check-icon" />
                }
              </div>
              <div
                class="radio-item"
                [class.selected]="goal() === 'maintain'"
                (click)="goal.set('maintain')"
                role="radio"
                tabindex="0"
                [attr.aria-checked]="goal() === 'maintain'"
                (keydown.enter)="goal.set('maintain')"
                (keydown.space)="goal.set('maintain'); $event.preventDefault()"
              >
                <span class="radio-circle"></span>
                <ion-icon name="scale-outline" class="radio-icon" />
                <span class="radio-label">Duy trì</span>
                @if (goal() === 'maintain') {
                  <ion-icon name="checkmark" class="check-icon" />
                }
              </div>
              <div
                class="radio-item"
                [class.selected]="goal() === 'performance'"
                (click)="goal.set('performance')"
                role="radio"
                tabindex="0"
                [attr.aria-checked]="goal() === 'performance'"
                (keydown.enter)="goal.set('performance')"
                (keydown.space)="goal.set('performance'); $event.preventDefault()"
              >
                <span class="radio-circle"></span>
                <ion-icon name="trophy-outline" class="radio-icon" />
                <span class="radio-label">Tăng sức mạnh</span>
                @if (goal() === 'performance') {
                  <ion-icon name="checkmark" class="check-icon" />
                }
              </div>
            </div>

            <ion-button
              expand="block"
              color="secondary"
              class="cta-button"
              [disabled]="!goal()"
              (click)="nextFromStep1()"
            >
              Tiếp tục
            </ion-button>
          </div>
        }

        <!-- ==================== STEP 2a: THÔNG TIN CƠ THỂ ==================== -->
        @if (step() === 2) {
          <div class="step-content">
            <h1 #step2aHeading class="step-title" tabindex="-1">Thông tin cơ thể</h1>
            <p class="step-subtitle">Hoàn thành để tính mục tiêu dinh dưỡng</p>

            <div class="form-field">
              <div class="input-wrapper" [class.invalid]="step2aErrors().heightCm">
                <label
                  for="field-height"
                  class="input-label"
                  [class.invalid]="step2aErrors().heightCm"
                  >Chiều cao (cm)</label
                >
                <input
                  #heightInput
                  id="field-height"
                  type="number"
                  inputmode="decimal"
                  class="input-native"
                  [value]="heightCm() ?? ''"
                  (input)="heightCm.set(heightInput.value ? +heightInput.value : null)"
                  min="130"
                  max="250"
                  [attr.aria-invalid]="step2aErrors().heightCm ? 'true' : null"
                  [attr.aria-describedby]="step2aErrors().heightCm ? 'err-height' : null"
                />
              </div>
              @if (step2aErrors().heightCm) {
                <div id="err-height" class="field-error" role="alert">
                  {{ step2aErrors().heightCm }}
                </div>
              }
            </div>

            <div class="form-field">
              <div class="input-wrapper" [class.invalid]="step2aErrors().weightKg">
                <label
                  for="field-weight"
                  class="input-label"
                  [class.invalid]="step2aErrors().weightKg"
                  >Cân nặng (kg)</label
                >
                <input
                  #weightInput
                  id="field-weight"
                  type="number"
                  inputmode="decimal"
                  class="input-native"
                  [value]="weightKg() ?? ''"
                  (input)="weightKg.set(weightInput.value ? +weightInput.value : null)"
                  min="30"
                  max="200"
                  [attr.aria-invalid]="step2aErrors().weightKg ? 'true' : null"
                  [attr.aria-describedby]="step2aErrors().weightKg ? 'err-weight' : null"
                />
              </div>
              @if (step2aErrors().weightKg) {
                <div id="err-weight" class="field-error" role="alert">
                  {{ step2aErrors().weightKg }}
                </div>
              }
            </div>

            <div class="form-field">
              <div class="input-wrapper" [class.invalid]="step2aErrors().age">
                <label for="field-age" class="input-label" [class.invalid]="step2aErrors().age"
                  >Tuổi</label
                >
                <input
                  #ageInput
                  id="field-age"
                  type="number"
                  inputmode="numeric"
                  class="input-native"
                  [value]="age() ?? ''"
                  (input)="age.set(ageInput.value ? +ageInput.value : null)"
                  min="13"
                  max="120"
                  [attr.aria-invalid]="step2aErrors().age ? 'true' : null"
                  [attr.aria-describedby]="step2aErrors().age ? 'err-age' : null"
                />
              </div>
              @if (step2aErrors().age) {
                <div id="err-age" class="field-error" role="alert">{{ step2aErrors().age }}</div>
              }
            </div>

            <div class="form-field">
              <div class="select-wrapper" [class.invalid]="step2aErrors().gender">
                <div class="select-inner">
                  <label
                    for="field-gender"
                    class="input-label"
                    [class.invalid]="step2aErrors().gender"
                    >Giới tính</label
                  >
                  <select
                    #genderSelect
                    id="field-gender"
                    class="select-native"
                    (change)="onGenderChange(genderSelect.value)"
                    [attr.aria-invalid]="step2aErrors().gender ? 'true' : null"
                    [attr.aria-describedby]="step2aErrors().gender ? 'err-gender' : null"
                  >
                    <option value="" [selected]="!gender()"></option>
                    <option value="male" [selected]="gender() === 'male'">Nam</option>
                    <option value="female" [selected]="gender() === 'female'">Nữ</option>
                  </select>
                </div>
                <span class="select-arrow">▾</span>
              </div>
              @if (step2aErrors().gender) {
                <div id="err-gender" class="field-error" role="alert">
                  {{ step2aErrors().gender }}
                </div>
              }
            </div>

            <div class="button-row">
              <ion-button fill="outline" class="btn-outline" (click)="goBack()">
                Quay lại
              </ion-button>
              <ion-button color="secondary" class="cta-button row-cta" (click)="nextFromStep2a()">
                Tiếp tục
              </ion-button>
            </div>
          </div>
        }

        <!-- ==================== STEP 2b: MỨC HOẠT ĐỘNG ==================== -->
        @if (step() === 3) {
          <div class="step-content">
            <h1 #step2bHeading class="step-title" tabindex="-1">Mức hoạt động</h1>
            <p class="step-subtitle">Giúp chúng tôi tính nhu cầu calo phù hợp</p>

            <div class="form-field">
              <div class="select-wrapper" [class.invalid]="step2bErrors().activityLevel">
                <div class="select-inner">
                  <label
                    for="field-activity"
                    class="input-label"
                    [class.invalid]="step2bErrors().activityLevel"
                    >Mức vận động</label
                  >
                  <select
                    #activitySelect
                    id="field-activity"
                    class="select-native"
                    (change)="onActivityChange(activitySelect.value)"
                    [attr.aria-invalid]="step2bErrors().activityLevel ? 'true' : null"
                    [attr.aria-describedby]="step2bErrors().activityLevel ? 'err-activity' : null"
                  >
                    <option value="" [selected]="!activityLevel()"></option>
                    <option value="sedentary" [selected]="activityLevel() === 'sedentary'">
                      Ít vận động
                    </option>
                    <option value="light" [selected]="activityLevel() === 'light'">
                      Nhẹ (1-3 ngày/tuần)
                    </option>
                    <option value="moderate" [selected]="activityLevel() === 'moderate'">
                      Trung bình (3-5 ngày/tuần)
                    </option>
                    <option value="heavy" [selected]="activityLevel() === 'heavy'">
                      Nặng (6-7 ngày/tuần)
                    </option>
                  </select>
                </div>
                <span class="select-arrow">▾</span>
              </div>
              @if (step2bErrors().activityLevel) {
                <div id="err-activity" class="field-error" role="alert">
                  {{ step2bErrors().activityLevel }}
                </div>
              }
            </div>

            <p class="section-label">Kinh nghiệm tập gym?</p>
            <div role="radiogroup" aria-label="Kinh nghiệm tập gym">
              <div
                class="radio-item"
                [class.selected]="gymExperience() === 'never'"
                (click)="gymExperience.set('never')"
                role="radio"
                tabindex="0"
                [attr.aria-checked]="gymExperience() === 'never'"
                (keydown.enter)="gymExperience.set('never')"
                (keydown.space)="gymExperience.set('never'); $event.preventDefault()"
              >
                <span class="radio-circle"></span>
                <span class="radio-label">Chưa bao giờ</span>
                @if (gymExperience() === 'never') {
                  <ion-icon name="checkmark" class="check-icon" />
                }
              </div>
              <div
                class="radio-item"
                [class.selected]="gymExperience() === 'under_6m'"
                (click)="gymExperience.set('under_6m')"
                role="radio"
                tabindex="0"
                [attr.aria-checked]="gymExperience() === 'under_6m'"
                (keydown.enter)="gymExperience.set('under_6m')"
                (keydown.space)="gymExperience.set('under_6m'); $event.preventDefault()"
              >
                <span class="radio-circle"></span>
                <span class="radio-label">Dưới 6 tháng</span>
                @if (gymExperience() === 'under_6m') {
                  <ion-icon name="checkmark" class="check-icon" />
                }
              </div>
              <div
                class="radio-item"
                [class.selected]="gymExperience() === '6m_2y'"
                (click)="gymExperience.set('6m_2y')"
                role="radio"
                tabindex="0"
                [attr.aria-checked]="gymExperience() === '6m_2y'"
                (keydown.enter)="gymExperience.set('6m_2y')"
                (keydown.space)="gymExperience.set('6m_2y'); $event.preventDefault()"
              >
                <span class="radio-circle"></span>
                <span class="radio-label">6 tháng — 2 năm</span>
                @if (gymExperience() === '6m_2y') {
                  <ion-icon name="checkmark" class="check-icon" />
                }
              </div>
              <div
                class="radio-item"
                [class.selected]="gymExperience() === 'over_2y'"
                (click)="gymExperience.set('over_2y')"
                role="radio"
                tabindex="0"
                [attr.aria-checked]="gymExperience() === 'over_2y'"
                (keydown.enter)="gymExperience.set('over_2y')"
                (keydown.space)="gymExperience.set('over_2y'); $event.preventDefault()"
              >
                <span class="radio-circle"></span>
                <span class="radio-label">Trên 2 năm</span>
                @if (gymExperience() === 'over_2y') {
                  <ion-icon name="checkmark" class="check-icon" />
                }
              </div>
            </div>
            @if (step2bErrors().gymExperience) {
              <div class="field-error" role="alert">{{ step2bErrors().gymExperience }}</div>
            }

            @if (saveError()) {
              <div class="error-toast" role="alert" aria-live="assertive">
                <ion-text color="danger">{{ saveError() }}</ion-text>
              </div>
            }

            <div class="button-row">
              <ion-button
                fill="outline"
                class="btn-outline"
                [disabled]="saving()"
                (click)="goBack()"
              >
                Quay lại
              </ion-button>
              <ion-button
                color="secondary"
                class="cta-button row-cta"
                [disabled]="saving()"
                (click)="complete()"
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
      /* ====================================================================
         PAGE CONTAINER — DS §4 spacing: 12px top, 16px horizontal
         ==================================================================== */
      .page-container {
        padding: 12px 16px 16px;
      }
      .step-content {
        max-width: 428px;
        margin: 0 auto;
      }

      /* ====================================================================
         TYPOGRAPHY — matches mockup exactly
         ==================================================================== */
      .step-title {
        font: 700 22px/1.3 var(--ion-font-family);
        color: var(--text-primary);
        margin: 0 0 4px;
        outline: none;
      }
      .step-subtitle {
        font: 500 16px/1.4 var(--ion-font-family);
        color: var(--text-tertiary);
        margin: 0 0 24px;
      }
      .section-label {
        font: 600 14px/1.4 var(--ion-font-family);
        color: var(--text-primary);
        margin: 16px 0 8px;
      }

      /* ====================================================================
         RADIO ITEMS — matches mockup HTML structure exactly:
         display:flex, gap:12px, padding:12px 16px, radius:12px, mb:8px
         ==================================================================== */
      .radio-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--radius-sm);
        margin-bottom: 8px;
        cursor: pointer;
        background: var(--bg-card);
        transition: background 0.2s var(--ease-out-quart);
      }

      /* Selected state — mockup: #E3F2FD light / #1A237E dark */
      .radio-item.selected {
        background: var(--primary-50, #e3f2fd);
      }
      @media (prefers-color-scheme: dark) {
        .radio-item {
          background: var(--bg-card);
        }
        .radio-item.selected {
          background: #1a237e;
        }
      }

      /* ====================================================================
         RADIO CIRCLE — 18px, 2px border, centered white dot when selected
         ==================================================================== */
      .radio-circle {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid var(--input-border-color);
        flex-shrink: 0;
        box-sizing: border-box;
        position: relative;
      }
      .radio-item.selected .radio-circle {
        background: var(--ion-color-primary);
        border-color: var(--ion-color-primary);
      }
      .radio-item.selected .radio-circle::after {
        content: '';
        width: 8px;
        height: 8px;
        background: #fff;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      @media (prefers-color-scheme: dark) {
        .radio-circle {
          border-color: #5f6575;
        }
      }

      /* ====================================================================
         RADIO ICON — 22px, primary color (Step 1 goals only)
         ==================================================================== */
      .radio-icon {
        font-size: 22px;
        color: var(--ion-color-primary);
        flex-shrink: 0;
      }

      /* ====================================================================
         RADIO LABEL — 16px/400, primary text, 700 when selected
         ==================================================================== */
      .radio-label {
        font: 400 16px/1.5 var(--ion-font-family);
        color: var(--text-primary);
        flex: 1;
      }
      .radio-item.selected .radio-label {
        font-weight: 700;
      }
      @media (prefers-color-scheme: dark) {
        .radio-label {
          color: var(--text-secondary);
        }
      }

      /* ====================================================================
         CHECKMARK ICON — 22px, primary color, right side of selected item
         ==================================================================== */
      .check-icon {
        font-size: 22px;
        color: var(--ion-color-primary);
        flex-shrink: 0;
      }

      /* ====================================================================
         FORM FIELDS — native inputs matching mockup exactly:
         .input-wrapper: border 1px solid, padding 20px 16px 8px, radius 12px
         .input-label: absolute top 6px left 16px, font 12px/400
         ==================================================================== */
      .form-field {
        margin-bottom: 16px;
      }
      .input-wrapper {
        position: relative;
        padding: 20px 16px 8px;
        border: 1px solid var(--input-border-color);
        border-radius: var(--radius-sm);
        min-height: 56px;
        background: var(--bg-card);
        box-sizing: border-box;
      }
      .input-wrapper.invalid {
        border-color: var(--ion-color-danger);
      }
      .input-label {
        position: absolute;
        top: 6px;
        left: 16px;
        font: 400 12px/1.4 var(--ion-font-family);
        color: var(--text-tertiary);
      }
      .input-label.invalid {
        color: var(--ion-color-danger);
      }
      .input-native {
        font: 400 16px/1.5 var(--ion-font-family);
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
        border: none;
        outline: none;
        background: transparent;
        width: 100%;
        padding: 0;
        -moz-appearance: textfield;
      }
      .input-native::-webkit-outer-spin-button,
      .input-native::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* SELECT — matches mockup .select-wrapper exactly */
      .select-wrapper {
        position: relative;
        padding: 20px 16px 8px;
        border: 1px solid var(--input-border-color);
        border-radius: var(--radius-sm);
        min-height: 56px;
        background: var(--bg-card);
        box-sizing: border-box;
        display: flex;
        align-items: center;
      }
      .select-wrapper.invalid {
        border-color: var(--ion-color-danger);
      }
      .select-inner {
        flex: 1;
      }
      .select-native {
        font: 400 16px/1.5 var(--ion-font-family);
        color: var(--text-primary);
        border: none;
        outline: none;
        background: transparent;
        width: 100%;
        padding: 0;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }
      .select-native option {
        color: var(--text-primary);
        background: var(--bg-card);
      }
      .select-arrow {
        font-size: 16px;
        color: var(--text-tertiary);
        margin-left: 8px;
        flex-shrink: 0;
      }
      @media (prefers-color-scheme: dark) {
        .input-wrapper,
        .select-wrapper {
          background: var(--bg-card);
          border-color: #444850;
        }
        .input-wrapper.invalid,
        .select-wrapper.invalid {
          border-color: #ef5350;
        }
        .input-native,
        .select-native {
          color: #fff;
        }
        .input-label.invalid {
          color: #ef5350;
        }
      }

      /* ====================================================================
         FIELD ERROR — 12px, danger color, per-field
         ==================================================================== */
      .field-error {
        font: 400 12px/1.4 var(--ion-font-family);
        color: var(--ion-color-danger);
        padding: 4px 4px 0;
        margin-bottom: 4px;
      }

      /* ====================================================================
         ERROR TOAST — form-level save error
         ==================================================================== */
      .error-toast {
        margin-top: 8px;
        padding: 8px 12px;
        border-radius: var(--radius-xs);
        background: rgba(var(--ion-color-danger-rgb), 0.08);
        font-size: 13px;
      }

      /* ====================================================================
         BUTTONS — CTA (secondary/orange), Outline (primary border)
         Mockup: padding 14px, 12px radius, 16px font, weight 500
         ==================================================================== */
      .cta-button {
        --border-radius: var(--radius-sm);
        --padding-top: 14px;
        --padding-bottom: 14px;
        margin-top: 24px;
        font-size: 16px;
        font-weight: 500;
        text-transform: none;
        height: 48px;
      }
      .cta-button.row-cta {
        margin-top: 0;
      }
      .btn-outline {
        --border-radius: var(--radius-sm);
        --padding-top: 14px;
        --padding-bottom: 14px;
        font-size: 16px;
        font-weight: 500;
        text-transform: none;
        height: 48px;
      }

      /* ====================================================================
         BUTTON ROW — flex row, gap 12px, margin-top 24px
         ==================================================================== */
      .button-row {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      .button-row ion-button {
        flex: 1;
        margin: 0;
      }

      /* ====================================================================
         TOOLBAR — title centered (mockup spec), back button white, progress bar
         ==================================================================== */
      ion-title {
        text-align: center;
        font-size: 18px;
        font-weight: 500;
      }

      /* ====================================================================
         TOOLBAR — back button white, progress bar styling
         ==================================================================== */
      .back-button {
        --color: #fff;
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
    IonButtons,
    IonIcon,
    IonProgressBar,
    IonText,
  ],
})
export default class OnboardingPage {
  private readonly router = inject(Router);
  private readonly profileStore = inject(ProfileStore);

  readonly step1Heading = viewChild<ElementRef>('step1Heading');
  readonly step2aHeading = viewChild<ElementRef>('step2aHeading');
  readonly step2bHeading = viewChild<ElementRef>('step2bHeading');

  /** 3-step wizard: 1 = Goal, 2 = Body info, 3 = Activity */
  readonly step = signal(1);
  readonly saving = signal(false);

  /** Computed toolbar title per step (mockup spec) */
  readonly toolbarTitle = computed(() => {
    switch (this.step()) {
      case 1:
        return 'Mục tiêu';
      case 2:
        return 'Thông tin cơ thể';
      case 3:
        return 'Mức hoạt động';
      default:
        return '';
    }
  });

  /** Computed progress: 33%, 67%, 100% */
  readonly progressValue = computed(() => this.step() / 3);

  // Step 1 — Goal
  readonly goal = signal<Goal | null>(null);

  // Step 2a — Body info
  readonly heightCm = signal<number | null>(null);
  readonly weightKg = signal<number | null>(null);
  readonly age = signal<number | null>(null);
  readonly gender = signal<Gender | null>(null);
  readonly step2aErrors = signal<Step2aErrors>({ ...EMPTY_2A });

  // Step 2b — Activity info
  readonly activityLevel = signal<ActivityLevel | null>(null);
  readonly gymExperience = signal<GymExperience | null>(null);
  readonly step2bErrors = signal<Step2bErrors>({ ...EMPTY_2B });
  readonly saveError = signal('');

  constructor() {
    addIcons({
      arrowBackOutline,
      bodyOutline,
      barbellOutline,
      scaleOutline,
      trophyOutline,
      checkmark,
    });
  }

  /** Type-safe handler for native gender select */
  onGenderChange(value: string): void {
    this.gender.set((value || null) as Gender | null);
  }

  /** Type-safe handler for native activity select */
  onActivityChange(value: string): void {
    this.activityLevel.set((value || null) as ActivityLevel | null);
  }

  /** Step 1 → Step 2a (CTA disabled prevents calling without goal) */
  nextFromStep1(): void {
    if (!this.goal()) return;
    this.step.set(2);
    this.focusHeading('step2aHeading');
  }

  /** Step 2a → Step 2b (validate body info first) */
  nextFromStep2a(): void {
    const errors = this.validateStep2a();
    this.step2aErrors.set(errors);
    if (Object.values(errors).some((e) => e !== '')) {
      this.focusFirstInvalidField2a(errors);
      return;
    }
    this.step.set(3);
    this.focusHeading('step2bHeading');
  }

  goBack(): void {
    if (this.step() === 2) {
      this.step.set(1);
      this.focusHeading('step1Heading');
    } else if (this.step() === 3) {
      this.step.set(2);
      this.focusHeading('step2aHeading');
    }
  }

  async complete(): Promise<void> {
    const errors = this.validateStep2b();
    this.step2bErrors.set(errors);
    if (Object.values(errors).some((e) => e !== '')) {
      this.focusFirstInvalidField2b(errors);
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
      const activityFactor = ACTIVITY_FACTOR[this.activityLevel()!];

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

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private validateStep2a(): Step2aErrors {
    const errors: Step2aErrors = { ...EMPTY_2A };
    const h = this.heightCm();
    const w = this.weightKg();
    const a = this.age();

    if (!h || h < 130 || h > 250) errors.heightCm = 'Chiều cao phải từ 130–250 cm';
    if (!w || w < 30 || w > 200) errors.weightKg = 'Cân nặng phải từ 30–200 kg';
    if (!a || a < 13 || a > 120) errors.age = 'Tuổi phải từ 13–120';
    if (!this.gender()) errors.gender = 'Vui lòng chọn giới tính';

    return errors;
  }

  private validateStep2b(): Step2bErrors {
    const errors: Step2bErrors = { ...EMPTY_2B };

    if (!this.activityLevel()) errors.activityLevel = 'Vui lòng chọn mức vận động';
    if (!this.gymExperience()) errors.gymExperience = 'Vui lòng chọn kinh nghiệm gym';

    return errors;
  }

  // ===========================================================================
  // FOCUS MANAGEMENT (A11y)
  // ===========================================================================

  private focusHeading(ref: 'step1Heading' | 'step2aHeading' | 'step2bHeading'): void {
    setTimeout(() => {
      const heading = this[ref]();
      heading?.nativeElement.focus();
    });
  }

  private focusFirstInvalidField2a(errors: Step2aErrors): void {
    const order: (keyof Step2aErrors)[] = ['heightCm', 'weightKg', 'age', 'gender'];
    const idMap: Record<keyof Step2aErrors, string> = {
      heightCm: 'err-height',
      weightKg: 'err-weight',
      age: 'err-age',
      gender: 'err-gender',
    };
    const first = order.find((f) => errors[f] !== '');
    if (!first) return;
    setTimeout(() =>
      document
        .getElementById(idMap[first])
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  }

  private focusFirstInvalidField2b(errors: Step2bErrors): void {
    if (errors.activityLevel) {
      setTimeout(() =>
        document
          .getElementById('err-activity')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
    }
  }
}

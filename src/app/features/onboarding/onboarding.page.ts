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
import { FormField, form } from '@angular/forms/signals';
import { AppFormField } from '../../shared/forms';
import {
  EMPTY_ONBOARDING_STEP2A_FORM,
  type OnboardingStep2aFormValue,
} from './onboarding-form.types';
import { onboardingStep2aSchema } from '../../shared/forms/schemas/onboarding-step2a-form.schema';
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
import { ActivityLevel, Gender, Goal, GymExperience } from '../../core/models/user-profile.types';
import {
  calculateBmr,
  calculateTargetCalories,
  calculateTargetProtein,
  calculateTdee,
  deriveFitnessLevel,
  getActivityFactor,
} from './onboarding-calculation';
import { EMPTY_2B, Step2bErrors, validateStep2b } from './onboarding-validation';
import { activityLabelLong } from '../../core/services/profile/activity-label';

/**
 * @deprecated Use `activityLabelLong` / `activityLabelShort` from
 * `core/services/profile/activity-label`. Kept as a re-export shim during the
 * Story 2.4 migration; remove once no callsites import this symbol.
 */
export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: activityLabelLong('sedentary'),
  light: activityLabelLong('light'),
  moderate: activityLabelLong('moderate'),
  heavy: activityLabelLong('heavy'),
};

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
  imports: [
    FormField,
    AppFormField,
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

  // Step 2a — Body info (Signal Forms FieldTree, see B4 in
  // docs/5-development/signal-forms-migration-plan.md)
  protected readonly step2aFormSignal = signal<OnboardingStep2aFormValue>({
    ...EMPTY_ONBOARDING_STEP2A_FORM,
  });
  protected readonly step2aForm = form(this.step2aFormSignal, onboardingStep2aSchema);
  /** True after first submit attempt — gates live error rendering. */
  protected readonly showStep2aErrors = signal(false);

  /**
   * Helper for templates: returns the first error message for a Step 2a field,
   * or `''` if the form hasn't been submitted yet. Drives both
   * `<app-form-field [errorMessage]>` and the gender segment-control error UI.
   */
  protected step2aFieldError(field: 'heightCm' | 'weightKg' | 'age' | 'gender'): string {
    if (!this.showStep2aErrors()) return '';
    return this.step2aForm[field]().errors()[0]?.message ?? '';
  }

  /**
   * Step 2a presence check — is every required field filled in?
   * Used to disable the "Tiếp tục" CTA until the user has typed something
   * in each of the four inputs. Note: this is intentionally weaker than
   * the schema (which checks ranges); range validation runs on submit
   * via `step2aForm().valid()` and shows inline errors — but the CTA
   * itself only needs presence so the user gets the "press is now
   * meaningful" affordance.
   */
  protected readonly step2aValid = computed(() => {
    const v = this.step2aFormSignal();
    return v.heightCm != null && v.weightKg != null && v.age != null && v.gender != null;
  });

  // Step 2b — Activity info
  readonly activityLevel = signal<ActivityLevel | null>(null);
  readonly gymExperience = signal<GymExperience | null>(null);

  /** Step 2b presence check — both selects picked. */
  protected readonly step2bValid = computed(
    () => this.activityLevel() != null && this.gymExperience() != null,
  );
  readonly step2bErrors = signal<Step2bErrors>({ ...EMPTY_2B });
  readonly saveError = signal('');

  /** Activity level options rendered as radio cards (§8.6c: N=4 → radio) */
  readonly activityLevels: readonly ActivityLevel[] = ['sedentary', 'light', 'moderate', 'heavy'];
  /** Expose label map to template */
  readonly ACTIVITY_LABEL_MAP = ACTIVITY_LABEL;

  constructor() {
    addIcons({
      arrowBackOutline,
      bodyOutline,
      barbellOutline,
      scaleOutline,
      trophyOutline,
      checkmark,
    });
    // Live error updates are reactive via FieldTree.errors() — no effect needed.
  }

  /** Set gender from segment control */
  onGenderChange(value: Gender): void {
    this.step2aFormSignal.update((v) => ({ ...v, gender: value }));
  }

  /** Set activity level from radio card */
  onActivityChange(value: ActivityLevel): void {
    this.activityLevel.set(value);
  }

  /** Step 1 → Step 2a (CTA disabled prevents calling without goal) */
  nextFromStep1(): void {
    if (!this.goal()) return;
    this.step.set(2);
    this.focusHeading('step2aHeading');
  }

  /** Step 2a → Step 2b (validate body info via Signal Forms schema) */
  nextFromStep2a(): void {
    this.showStep2aErrors.set(true);
    if (!this.step2aForm().valid()) {
      this.focusFirstInvalidField2a();
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
    const errors = validateStep2b({
      activityLevel: this.activityLevel(),
      gymExperience: this.gymExperience(),
    });
    this.step2bErrors.set(errors);
    if (Object.values(errors).some((e) => e !== '')) {
      this.focusFirstInvalidField2b(errors);
      return;
    }

    this.saving.set(true);
    this.saveError.set('');

    try {
      const goal = this.goal()!;
      const v = this.step2aFormSignal();
      const gender = v.gender!;
      const heightCm = v.heightCm!;
      const weightKg = v.weightKg!;
      const age = v.age!;
      const gym = this.gymExperience()!;
      const activityLevel = this.activityLevel()!;
      const fitnessLevel = deriveFitnessLevel(gym);
      const bmr = calculateBmr({ weightKg, heightCm, age, gender });
      const tdee = calculateTdee(bmr, activityLevel);
      const targetCalories = calculateTargetCalories(tdee, goal);
      const targetProtein = calculateTargetProtein(weightKg, goal);

      await this.profileStore.saveOnboardingProfile({
        height_cm: heightCm,
        weight_kg: weightKg,
        age,
        gender,
        goal,
        fitness_level: fitnessLevel,
        activity_factor: getActivityFactor(activityLevel),
        bmr,
        tdee,
        target_calories: targetCalories,
        target_protein: targetProtein,
        target_carbs: null,
        target_fat: null,
        theme: 'light',
        notif_morning: 1,
        notif_lunch: 1,
        notif_evening: 1,
        notif_weekly: 1,
        onboarding_completed: 1,
      });

      // Replace history entry so Android hardware-back from inside the app
      // doesn't pop back into the onboarding wizard once completed.
      void this.router.navigateByUrl('/', { replaceUrl: true });
    } catch {
      this.saveError.set('Lưu thất bại. Vui lòng thử lại.');
    } finally {
      this.saving.set(false);
    }
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

  private focusFirstInvalidField2a(): void {
    type Step2aField = 'heightCm' | 'weightKg' | 'age' | 'gender';
    const order: Step2aField[] = ['heightCm', 'weightKg', 'age', 'gender'];
    const idMap: Record<Step2aField, string> = {
      heightCm: 'err-height',
      weightKg: 'err-weight',
      age: 'err-age',
      gender: 'err-gender',
    };
    const first = order.find((f) => !this.step2aForm[f]().valid());
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

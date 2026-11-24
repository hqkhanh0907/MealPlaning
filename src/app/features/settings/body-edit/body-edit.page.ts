import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { SaveAndClose } from '../../../shared/forms/save-and-close';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonFooter,
} from '@ionic/angular/standalone';
import type { UserProfile } from '../../../core/models/user-profile.model';
import { ProfileStore } from '../../../core/stores/profile.store';
import { recalcTargets } from '../../../core/services/profile/recalc-targets';
import { activitySummaryForFactor } from '../../../core/services/profile/activity-label';
import {
  BODY_MEASUREMENT_LIMITS,
  bodyMeasurementError,
  isProfileGender,
} from '../../../core/models/body-measurements';
import { GENDER_LABELS, type Gender } from '../../../core/models/user-profile.types';
import { ageOnDate } from '../../../core/services/profile/profile-birth-date';
import {
  ProfileAgeField,
  type ProfileAgeInput,
} from '../../../shared/forms/profile-age-field/profile-age-field';
import { AppFormField } from '../../../shared/forms/form-field/form-field';

@Component({
  selector: 'app-body-edit',
  templateUrl: './body-edit.page.html',
  styleUrl: './body-edit.page.scss',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonFooter,
    AppFormField,
    ProfileAgeField,
  ],
})
export default class BodyEditPage implements OnInit {
  private readonly profileStore = inject(ProfileStore);
  private readonly location = inject(Location);
  readonly submission = new SaveAndClose(
    () => this.location.back(),
    'Chưa lưu được thông tin cơ thể. Hãy thử lại.',
  );

  readonly height = signal<number | null>(null);
  readonly weight = signal<number | null>(null);
  readonly age = signal<number | null>(null);
  readonly gender = signal<Gender>('male');
  readonly birthDate = signal('');
  readonly limits = BODY_MEASUREMENT_LIMITS;
  readonly genderLabels = GENDER_LABELS;
  private initial: UserProfile | null = null;

  displayedAge(): number | null {
    const date = this.birthDate();
    return date ? ageOnDate(date) : this.age();
  }

  onAgeEdit(value: ProfileAgeInput): void {
    this.birthDate.set(value.birthDate);
    this.age.set(value.age);
  }

  ngOnInit(): void {
    const p = this.profileStore.profile();
    if (!p) return;
    this.height.set(p.height_cm);
    this.weight.set(p.weight_kg);
    this.age.set(p.age);
    this.initial = p;
    this.birthDate.set(p.birth_date ?? '');
    this.gender.set(p.gender);
  }

  readonly heightError = computed(() => bodyMeasurementError('heightCm', this.height()));
  readonly weightError = computed(() => bodyMeasurementError('weightKg', this.weight()));
  readonly ageError = computed(() => {
    const age = this.displayedAge();
    if (age !== null && age > this.limits.age.max && this.birthDate() === this.initial?.birth_date)
      return null;
    return bodyMeasurementError('age', age);
  });
  readonly heightInvalid = computed(() => !!this.heightError());
  readonly weightInvalid = computed(() => !!this.weightError());
  readonly ageInvalid = computed(() => !!this.ageError());
  readonly formInvalid = computed(
    () =>
      this.heightInvalid() ||
      this.weightInvalid() ||
      this.ageInvalid() ||
      !isProfileGender(this.gender()),
  );

  readonly preview = computed(() => {
    const p = this.profileStore.profile();
    if (!p || this.formInvalid()) return null;
    return recalcTargets({
      height_cm: this.height()!,
      weight_kg: this.weight()!,
      age: this.displayedAge()!,
      gender: this.gender(),
      goal: p.goal,
      activity_factor: p.activity_factor,
    });
  });

  readonly activityLabel = computed(() => {
    const p = this.profileStore.profile();
    if (!p) return '';
    return activitySummaryForFactor(p.activity_factor);
  });

  async save(): Promise<void> {
    const initial = this.initial;
    if (!initial || this.formInvalid()) return;
    const patch: Partial<UserProfile> = {};
    if (this.height() !== initial.height_cm) patch.height_cm = this.height()!;
    if (this.weight() !== initial.weight_kg) patch.weight_kg = this.weight()!;
    if (this.gender() !== initial.gender) patch.gender = this.gender();
    const date = this.birthDate() || null;
    if (date !== (initial.birth_date ?? null)) patch.birth_date = date;
    if (!date && (this.age() !== initial.age || initial.birth_date)) patch.age = this.age()!;
    await this.submission.submit(async () => {
      if (Object.keys(patch).length) await this.profileStore.updateProfile(patch);
    });
  }
}

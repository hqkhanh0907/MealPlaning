import { LocalDay } from '../../../core/stores/local-day';
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
import {
  profileCalculationInput,
  recalcTargets,
} from '../../../core/services/profile/recalc-targets';
import { activitySummaryForFactor } from '../../../core/services/profile/activity-label';
import {
  BODY_MEASUREMENT_LIMITS,
  bodyMeasurementError,
  isProfileGender,
} from '../../../core/models/body-measurements';
import { GENDER_LABELS, type Gender } from '../../../core/models/user-profile.types';
import { birthDateError } from '../../../core/services/profile/profile-birth-date';
import { BirthDateField } from '../../../shared/forms/birth-date-field/birth-date-field';
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
    BirthDateField,
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
  private readonly day = inject(LocalDay);
  readonly gender = signal<Gender>('male');
  readonly birthDate = signal('');
  readonly limits = BODY_MEASUREMENT_LIMITS;
  readonly genderLabels = GENDER_LABELS;
  private initial: UserProfile | null = null;

  ngOnInit(): void {
    const p = this.profileStore.profile();
    if (!p) return;
    this.height.set(p.height_cm);
    this.weight.set(p.weight_kg);
    this.initial = p;
    this.birthDate.set(p.birth_date ?? '');
    this.gender.set(p.gender);
  }

  readonly heightError = computed(() => bodyMeasurementError('heightCm', this.height()));
  readonly weightError = computed(() => bodyMeasurementError('weightKg', this.weight()));
  readonly dateError = computed(() => {
    if (this.birthDate() && this.birthDate() === this.initial?.birth_date) return null;
    return birthDateError(this.birthDate(), this.day.date());
  });
  readonly heightInvalid = computed(() => !!this.heightError());
  readonly weightInvalid = computed(() => !!this.weightError());
  readonly formInvalid = computed(
    () =>
      this.heightInvalid() ||
      this.weightInvalid() ||
      !!this.dateError() ||
      !isProfileGender(this.gender()),
  );

  readonly preview = computed(() => {
    const p = this.profileStore.profile();
    if (!p || this.formInvalid()) return null;
    return recalcTargets(
      profileCalculationInput(
        {
          height_cm: this.height()!,
          weight_kg: this.weight()!,
          birth_date: this.birthDate(),
          gender: this.gender(),
          goal: p.goal,
          activity_factor: p.activity_factor,
        },
        this.day.date(),
      ),
    );
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
    if (this.birthDate() !== initial.birth_date) patch.birth_date = this.birthDate();
    await this.submission.submit(async () => {
      if (Object.keys(patch).length) await this.profileStore.updateProfile(patch);
    });
  }
}

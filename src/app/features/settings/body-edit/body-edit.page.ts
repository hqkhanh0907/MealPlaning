import { Component, computed, inject, signal, OnInit } from '@angular/core';
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
import { ProfileStore } from '../../../core/stores/profile.store';
import { recalcTargets } from '../../../core/services/profile/recalc-targets';
import { ACTIVITY_LABEL } from '../../onboarding/onboarding.page';
import { getActivityLevelFromFactor } from '../../onboarding/onboarding-calculation';

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
  ],
})
export default class BodyEditPage implements OnInit {
  private readonly profileStore = inject(ProfileStore);
  private readonly location = inject(Location);

  readonly height = signal(0);
  readonly weight = signal(0);
  readonly age = signal(0);
  readonly gender = signal<'male' | 'female'>('male');

  ngOnInit(): void {
    const p = this.profileStore.profile();
    if (!p) return;
    this.height.set(p.height_cm);
    this.weight.set(p.weight_kg);
    this.age.set(p.age);
    this.gender.set(p.gender);
  }

  readonly heightInvalid = computed(() => this.height() < 100 || this.height() > 250);
  readonly weightInvalid = computed(() => this.weight() < 30 || this.weight() > 300);
  readonly ageInvalid = computed(() => this.age() < 10 || this.age() > 120);
  readonly formInvalid = computed(
    () => this.heightInvalid() || this.weightInvalid() || this.ageInvalid(),
  );

  readonly preview = computed(() => {
    const p = this.profileStore.profile();
    if (!p || this.formInvalid()) return null;
    return recalcTargets({
      height_cm: this.height(),
      weight_kg: this.weight(),
      age: this.age(),
      gender: this.gender(),
      goal: p.goal,
      activity_factor: p.activity_factor,
    });
  });

  readonly activityLabel = computed(() => {
    const p = this.profileStore.profile();
    if (!p) return '';
    const level = getActivityLevelFromFactor(p.activity_factor) ?? 'moderate';
    return ACTIVITY_LABEL[level];
  });

  async save(): Promise<void> {
    const p = this.profileStore.profile();
    const r = this.preview();
    if (!p || !r) return;
    const currentRecalc = recalcTargets({
      height_cm: p.height_cm,
      weight_kg: p.weight_kg,
      age: p.age,
      gender: p.gender,
      goal: p.goal,
      activity_factor: p.activity_factor,
    });
    const wasAutoCals = p.target_calories === currentRecalc.target_calories;
    const wasAutoProtein = p.target_protein === currentRecalc.target_protein;

    await this.profileStore.updateProfile({
      height_cm: this.height(),
      weight_kg: this.weight(),
      age: this.age(),
      gender: this.gender(),
      bmr: r.bmr,
      tdee: r.tdee,
      ...(wasAutoCals ? { target_calories: r.target_calories } : {}),
      ...(wasAutoProtein ? { target_protein: r.target_protein } : {}),
    });
    this.location.back();
  }
}

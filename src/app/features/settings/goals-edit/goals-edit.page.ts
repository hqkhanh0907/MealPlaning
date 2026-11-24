import { LocalDay } from '../../../core/stores/local-day';
import { Component, computed, effect, inject, signal, OnInit } from '@angular/core';
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
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';
import { ProfileStore } from '../../../core/stores/profile.store';
import {
  profileCalculationInput,
  recalcTargets,
} from '../../../core/services/profile/recalc-targets';
import {
  manualTargetLimits,
  validManualTarget,
} from '../../../core/services/profile/manual-targets';
import { GOAL_LABELS, type Goal } from '../../../core/models/user-profile.types';
import { AppFormField } from '../../../shared/forms/form-field/form-field';

interface GoalOption {
  readonly value: Goal;
  readonly label: string;
}

@Component({
  selector: 'app-goals-edit',
  templateUrl: './goals-edit.page.html',
  styleUrl: './goals-edit.page.scss',
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
    IonIcon,
    AppFormField,
  ],
})
export default class GoalsEditPage implements OnInit {
  private readonly day = inject(LocalDay);
  private readonly profileStore = inject(ProfileStore);
  private readonly location = inject(Location);
  readonly submission = new SaveAndClose(
    () => this.location.back(),
    'Chưa lưu được mục tiêu. Hãy thử lại.',
  );

  readonly goal = signal<Goal>('maintain');
  readonly calo = signal<number | null>(0);
  readonly calorieMode = signal<'auto' | 'manual'>('auto');
  readonly protein = signal<number | null>(null);
  readonly carbs = signal<number | null>(null);
  readonly fat = signal<number | null>(null);

  private readonly proteinMode = signal<'auto' | 'manual'>('auto');

  private previousDay = this.day.iso();
  private prevGoal: Goal | null = null;

  readonly goalOptions: readonly GoalOption[] = (Object.keys(GOAL_LABELS) as Goal[]).map(
    (value) => ({ value, label: GOAL_LABELS[value] }),
  );

  readonly limits = manualTargetLimits;
  readonly caloInvalid = computed(() => !validManualTarget('calories', this.calo()));
  readonly proteinInvalid = computed(() => !validManualTarget('protein', this.protein()));
  readonly carbsInvalid = computed(() => !validManualTarget('carbs', this.carbs()));
  readonly fatInvalid = computed(() => !validManualTarget('fat', this.fat()));
  readonly formInvalid = computed(
    () => this.caloInvalid() || this.proteinInvalid() || this.carbsInvalid() || this.fatInvalid(),
  );

  constructor() {
    addIcons({ checkmarkCircle });
    effect(() => {
      const g = this.goal();
      const p = this.profileStore.profile();
      const prev = this.prevGoal;
      const day = this.day.iso();
      const sameDay = this.previousDay === day;
      this.previousDay = day;
      this.prevGoal = g;
      if (!p || prev === null || (prev === g && sameDay)) return;
      const r = recalcTargets(profileCalculationInput({ ...p, goal: g }, this.day.date()));
      if (this.calorieMode() === 'auto') this.calo.set(r.target_calories || null);
      if (this.proteinMode() === 'auto') this.protein.set(r.target_protein || null);
    });
  }

  ngOnInit(): void {
    const p = this.profileStore.profile();
    if (!p) return;
    this.prevGoal = p.goal;
    this.goal.set(p.goal);
    this.calo.set(p.target_calories || null);
    this.calorieMode.set(p.calorie_target_mode ?? 'auto');
    this.protein.set(p.target_protein || null);
    this.proteinMode.set(p.protein_target_mode ?? 'auto');
    this.carbs.set(p.target_carbs ?? null);
    this.fat.set(p.target_fat ?? null);
  }

  setGoal(g: Goal): void {
    this.goal.set(g);
  }

  setCalo(v: number | null): void {
    this.calorieMode.set('manual');
    this.calo.set(v);
  }

  setProtein(v: number | null): void {
    this.proteinMode.set('manual');
    this.protein.set(v);
  }

  setCarbs(v: number | null): void {
    // Treat empty/NaN/0-string as null so we persist "unset" rather than 0.
    const norm = v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : v;
    this.carbs.set(norm);
  }

  setFat(v: number | null): void {
    const norm = v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : v;
    this.fat.set(norm);
  }

  reset(): void {
    const p = this.profileStore.profile();
    if (!p) return;
    const r = recalcTargets(profileCalculationInput({ ...p, goal: this.goal() }, this.day.date()));
    this.calorieMode.set('auto');
    this.calo.set(r.target_calories || null);
    this.protein.set(r.target_protein || null);
    this.proteinMode.set('auto');
  }

  async save(): Promise<void> {
    if (this.formInvalid()) return;
    await this.submission.submit(() =>
      this.profileStore.updateProfile({
        goal: this.goal(),
        target_calories: this.calo() ?? 0,
        calorie_target_mode: this.calorieMode(),
        target_protein: this.protein() ?? 0,
        protein_target_mode: this.proteinMode(),
        target_carbs: this.carbs(),
        target_fat: this.fat(),
      }),
    );
  }
}

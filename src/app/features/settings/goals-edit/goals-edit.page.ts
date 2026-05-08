import { Component, computed, effect, inject, signal, OnInit } from '@angular/core';
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
import { recalcTargets } from '../../../core/services/profile/recalc-targets';
import { Goal } from '../../../core/models/user-profile.types';

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
  ],
})
export default class GoalsEditPage implements OnInit {
  private readonly profileStore = inject(ProfileStore);
  private readonly location = inject(Location);

  readonly goal = signal<Goal>('maintain');
  readonly calo = signal(0);
  readonly protein = signal(0);
  readonly carbs = signal<number | null>(null);
  readonly fat = signal<number | null>(null);

  // Tracks whether user manually edited targets in this session.
  // While false, changing the goal auto-suggests new targets via recalc.
  private readonly userTouchedTargets = signal(false);

  // Tracks last seen goal so the effect only auto-fills on actual goal CHANGES,
  // not on the initial load (which would otherwise overwrite stored manual targets).
  private prevGoal: Goal | null = null;

  readonly goalOptions: readonly GoalOption[] = [
    { value: 'lose_weight', label: 'Giảm cân' },
    { value: 'maintain', label: 'Duy trì' },
    { value: 'gain_muscle', label: 'Tăng cơ' },
    { value: 'performance', label: 'Tăng sức mạnh' },
  ];

  readonly caloInvalid = computed(() => this.calo() < 800 || this.calo() > 6000);
  readonly proteinInvalid = computed(() => this.protein() < 20 || this.protein() > 400);
  readonly carbsInvalid = computed(() => {
    const v = this.carbs();
    return v !== null && (v < 0 || v > 1000);
  });
  readonly fatInvalid = computed(() => {
    const v = this.fat();
    return v !== null && (v < 0 || v > 1000);
  });
  readonly formInvalid = computed(
    () => this.caloInvalid() || this.proteinInvalid() || this.carbsInvalid() || this.fatInvalid(),
  );

  constructor() {
    addIcons({ checkmarkCircle });
    // Auto-suggest calo/protein when goal CHANGES (not on initial run),
    // unless user has manually edited targets.
    effect(() => {
      const g = this.goal();
      const p = this.profileStore.profile();
      const prev = this.prevGoal;
      this.prevGoal = g;
      if (!p || prev === null || prev === g) return;
      if (this.userTouchedTargets()) return;
      const r = recalcTargets({
        height_cm: p.height_cm,
        weight_kg: p.weight_kg,
        age: p.age,
        gender: p.gender,
        goal: g,
        activity_factor: p.activity_factor,
      });
      this.calo.set(r.target_calories);
      this.protein.set(r.target_protein);
    });
  }

  ngOnInit(): void {
    const p = this.profileStore.profile();
    if (!p) return;
    // Seed prevGoal BEFORE goal.set so the auto-suggest effect treats this as
    // "no change" and skips recalc. Otherwise stored manual target_calories/
    // target_protein would be overwritten on every load when persisted goal
    // differs from the signal default ('maintain').
    this.prevGoal = p.goal;
    this.goal.set(p.goal);
    this.calo.set(p.target_calories);
    this.protein.set(p.target_protein);
    this.carbs.set(p.target_carbs ?? null);
    this.fat.set(p.target_fat ?? null);
  }

  setGoal(g: Goal): void {
    this.goal.set(g);
  }

  setCalo(v: number): void {
    this.userTouchedTargets.set(true);
    this.calo.set(v);
  }

  setProtein(v: number): void {
    this.userTouchedTargets.set(true);
    this.protein.set(v);
  }

  setCarbs(v: number | null): void {
    // Treat empty/NaN/0-string as null so we persist "unset" rather than 0.
    const norm = v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : v;
    if (norm !== null) this.userTouchedTargets.set(true);
    this.carbs.set(norm);
  }

  setFat(v: number | null): void {
    const norm = v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : v;
    if (norm !== null) this.userTouchedTargets.set(true);
    this.fat.set(norm);
  }

  reset(): void {
    const p = this.profileStore.profile();
    if (!p) return;
    const r = recalcTargets({
      height_cm: p.height_cm,
      weight_kg: p.weight_kg,
      age: p.age,
      gender: p.gender,
      goal: this.goal(),
      activity_factor: p.activity_factor,
    });
    this.calo.set(r.target_calories);
    this.protein.set(r.target_protein);
    this.userTouchedTargets.set(false);
  }

  async save(): Promise<void> {
    if (this.formInvalid()) return;
    await this.profileStore.updateProfile({
      goal: this.goal(),
      target_calories: this.calo(),
      target_protein: this.protein(),
      target_carbs: this.carbs(),
      target_fat: this.fat(),
    });
    this.location.back();
  }
}

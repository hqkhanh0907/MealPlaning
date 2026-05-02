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
} from '@ionic/angular/standalone';
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
  ],
})
export default class GoalsEditPage implements OnInit {
  private readonly profileStore = inject(ProfileStore);
  private readonly location = inject(Location);

  readonly goal = signal<Goal>('maintain');
  readonly calo = signal(0);
  readonly protein = signal(0);

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
    { value: 'performance', label: 'Tăng hiệu suất' },
  ];

  readonly caloInvalid = computed(() => this.calo() < 800 || this.calo() > 6000);
  readonly proteinInvalid = computed(() => this.protein() < 20 || this.protein() > 400);
  readonly formInvalid = computed(() => this.caloInvalid() || this.proteinInvalid());

  constructor() {
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
    this.goal.set(p.goal);
    this.calo.set(p.target_calories);
    this.protein.set(p.target_protein);
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
    });
    this.location.back();
  }
}

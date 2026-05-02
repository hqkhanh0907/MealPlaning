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
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { ProfileStore } from '../../../core/stores/profile.store';
import { recalcTargets } from '../../../core/services/profile/recalc-targets';

interface ActivityOption {
  readonly factor: number;
  readonly label: string;
  readonly desc: string;
}

@Component({
  selector: 'app-activity-edit',
  templateUrl: './activity-edit.page.html',
  styleUrl: './activity-edit.page.scss',
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
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonLabel,
    IonList,
  ],
})
export default class ActivityEditPage implements OnInit {
  private readonly profileStore = inject(ProfileStore);
  private readonly location = inject(Location);

  readonly factor = signal(1.55);

  readonly options: readonly ActivityOption[] = [
    { factor: 1.2, label: 'Ít vận động', desc: 'Ngồi nhiều, ít hoặc không tập' },
    { factor: 1.375, label: 'Nhẹ', desc: 'Tập nhẹ 1–3 buổi/tuần' },
    { factor: 1.55, label: 'Vừa', desc: 'Tập vừa 3–5 buổi/tuần' },
    { factor: 1.725, label: 'Nặng', desc: 'Tập nặng 6–7 buổi/tuần' },
  ];

  ngOnInit(): void {
    const p = this.profileStore.profile();
    if (!p) return;
    this.factor.set(p.activity_factor);
  }

  readonly preview = computed(() => {
    const p = this.profileStore.profile();
    if (!p) return null;
    return recalcTargets({
      height_cm: p.height_cm,
      weight_kg: p.weight_kg,
      age: p.age,
      gender: p.gender,
      goal: p.goal,
      activity_factor: this.factor(),
    });
  });

  readonly activeLabel = computed(
    () => this.options.find((o) => o.factor === this.factor())?.label ?? '',
  );

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
      activity_factor: this.factor(),
      bmr: r.bmr,
      tdee: r.tdee,
      ...(wasAutoCals ? { target_calories: r.target_calories } : {}),
      ...(wasAutoProtein ? { target_protein: r.target_protein } : {}),
    });
    this.location.back();
  }
}

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
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { ProfileStore } from '../../../core/stores/profile.store';
import { recalcTargets } from '../../../core/services/profile/recalc-targets';
import { activityLabelShort } from '../../../core/services/profile/activity-label';
import {
  DEFAULT_ACTIVITY_LEVEL,
  getActivityFactor,
} from '../../../core/services/profile/energy-targets';
import {
  ACTIVITY_LEVELS,
  FITNESS_LEVEL_LABELS,
  FITNESS_LEVELS,
  type ActivityLevel,
  type FitnessLevel,
} from '../../../core/models/user-profile.types';

interface ActivityOption {
  readonly factor: number;
  readonly label: string;
  readonly desc: string;
}

/**
 * Long-form descriptions for the activity option cards. Kept here (not in the
 * shared `activity-label` module) because they're surface-specific copy: only
 * the picker screen uses them.
 */
const ACTIVITY_DESCRIPTIONS: Readonly<Record<ActivityLevel, string>> = {
  sedentary: 'Ngồi nhiều, ít hoặc không tập',
  light: 'Tập nhẹ 1–3 buổi/tuần',
  moderate: 'Tập vừa 3–5 buổi/tuần',
  heavy: 'Tập nặng 6–7 buổi/tuần',
};

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
  readonly submission = new SaveAndClose(
    () => this.location.back(),
    'Chưa lưu được mức vận động và trình độ tập. Hãy thử lại.',
  );

  readonly factor = signal(getActivityFactor(DEFAULT_ACTIVITY_LEVEL));
  readonly fitnessLevel = signal<FitnessLevel>('beginner');
  readonly levels = FITNESS_LEVELS;
  readonly levelLabels = FITNESS_LEVEL_LABELS;

  readonly options: readonly ActivityOption[] = ACTIVITY_LEVELS.map((level) => ({
    factor: getActivityFactor(level),
    label: activityLabelShort(level),
    desc: ACTIVITY_DESCRIPTIONS[level],
  }));

  ngOnInit(): void {
    const p = this.profileStore.profile();
    if (!p) return;
    this.factor.set(p.activity_factor);
    this.fitnessLevel.set(p.fitness_level);
  }

  readonly preview = computed(() => {
    const p = this.profileStore.profile();
    if (!p) return null;
    return recalcTargets({ ...p, activity_factor: this.factor() });
  });

  readonly activeLabel = computed(
    () => this.options.find((o) => o.factor === this.factor())?.label ?? '',
  );
  readonly isDirty = computed(() => {
    const p = this.profileStore.profile();
    return !!p && (p.activity_factor !== this.factor() || p.fitness_level !== this.fitnessLevel());
  });

  async save(): Promise<void> {
    const p = this.profileStore.profile();
    if (!p) return;
    await this.submission.submit(() => {
      if (!this.isDirty()) return;
      return this.profileStore.updateProfile({
        ...(p.fitness_level !== this.fitnessLevel() ? { fitness_level: this.fitnessLevel() } : {}),
        ...(p.activity_factor !== this.factor() ? { activity_factor: this.factor() } : {}),
      });
    });
  }
}

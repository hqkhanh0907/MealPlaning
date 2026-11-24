import {
  addCalendarDays,
  localIsoDate,
  mondayOfWeek,
  parseLocalDate,
} from '../../../core/utils/local-date';
import { isLoggedSet } from '../../../core/models/fitness-workout-set';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  calendarOutline,
  chevronDownOutline,
  timerOutline,
  listOutline,
} from 'ionicons/icons';
import { WorkoutRepository } from '../../../core/repositories/workout.repository';
import {
  setValueLabel,
  workoutNumber,
  type WorkoutSessionDetail,
} from '../../../core/models/fitness.types';

interface HistoryWeekGroup {
  weekLabel: string;
  weekStartIso: string;
  sessions: WorkoutSessionDetail[];
}

@Component({
  selector: 'app-fitness-history',
  templateUrl: './history.page.html',
  styleUrl: './history.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class FitnessHistoryPage implements OnInit {
  protected readonly setValue = setValueLabel;
  private readonly workoutRepo = inject(WorkoutRepository);

  readonly loading = signal(true);
  readonly groups = signal<HistoryWeekGroup[]>([]);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ barbellOutline, calendarOutline, chevronDownOutline, timerOutline, listOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const sessions = await this.workoutRepo.recentSessions(20);
      this.groups.set(this.groupByIsoWeek(sessions));
    } catch {
      this.errorMessage.set('Không tải được lịch sử buổi tập.');
    } finally {
      this.loading.set(false);
    }
  }

  formatSessionDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  formatDuration(minutes: number | null): string {
    if (minutes === null) return '—';
    if (minutes < 60) return `${minutes} phút`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
  }

  formatVolume(volume: number): string {
    return `${workoutNumber.format(volume)} kg`;
  }

  setCount(session: WorkoutSessionDetail): number {
    return session.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter(isLoggedSet).length,
      0,
    );
  }

  trackByGroup(_: number, group: HistoryWeekGroup): string {
    return group.weekStartIso;
  }

  trackBySession(_: number, session: WorkoutSessionDetail): string {
    return session.id;
  }

  private groupByIsoWeek(sessions: WorkoutSessionDetail[]): HistoryWeekGroup[] {
    const buckets = new Map<string, HistoryWeekGroup>();
    for (const session of sessions) {
      const weekStartIso = FitnessHistoryPage._isoWeekStart(session.date);
      const existing = buckets.get(weekStartIso);
      if (existing) {
        existing.sessions.push(session);
      } else {
        buckets.set(weekStartIso, {
          weekStartIso,
          weekLabel: this.weekLabel(weekStartIso),
          sessions: [session],
        });
      }
    }
    return Array.from(buckets.values()).sort((a, b) =>
      b.weekStartIso.localeCompare(a.weekStartIso),
    );
  }

  static _isoWeekStart(iso: string): string {
    return localIsoDate(mondayOfWeek(parseLocalDate(iso)));
  }

  static readonly _formatLocalIsoDate = localIsoDate;

  private weekLabel(weekStartIso: string): string {
    const monday = parseLocalDate(weekStartIso);
    const sunday = addCalendarDays(monday, 6);
    const fmt = (d: Date): string =>
      d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
    return `Tuần ${fmt(monday)} – ${fmt(sunday)}`;
  }
}

export default FitnessHistoryPage;

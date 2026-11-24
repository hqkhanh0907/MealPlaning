import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  IonBackButton,
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
  trophyOutline,
} from 'ionicons/icons';
import { WorkoutRepository } from '../../../core/repositories/workout.repository';
import type { WorkoutSessionDetail } from '../../../core/models/fitness.types';

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
  private readonly workoutRepo = inject(WorkoutRepository);

  readonly loading = signal(true);
  readonly groups = signal<HistoryWeekGroup[]>([]);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ barbellOutline, calendarOutline, chevronDownOutline, timerOutline, trophyOutline });
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
    } catch (err) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Không tải được lịch sử buổi tập.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  formatSessionDate(iso: string): string {
    // ISO date -> "Th 2, 12 thg 5" — relies on browser locale for VN labels.
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
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
    return m === 0 ? `${h} giờ` : `${h}g ${m}p`;
  }

  formatVolume(volume: number): string {
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)} t`;
    return `${Math.round(volume)} kg`;
  }

  setCount(session: WorkoutSessionDetail): number {
    return session.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter((set) => set.status === 'logged').length,
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
      const weekStartIso = this.isoWeekStart(session.date);
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

  private isoWeekStart(isoDate: string): string {
    return FitnessHistoryPage._isoWeekStart(isoDate);
  }

  /** F-016 spec hook — pure helper, tests bypass component DI. */
  static _isoWeekStart(isoDate: string): string {
    // Monday-start ISO week. Returns YYYY-MM-DD of the Monday.
    // F-016 fix: format local components — toISOString() converts to UTC and
    // shifts the date by 1 day in GMT+7 locales (Mon midnight local → Sun 17:00 UTC).
    const d = new Date(`${isoDate}T00:00:00`);
    const dow = d.getDay(); // 0=Sun..6=Sat
    const diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    return FitnessHistoryPage._formatLocalIsoDate(d);
  }

  private formatLocalIsoDate(d: Date): string {
    return FitnessHistoryPage._formatLocalIsoDate(d);
  }

  /** F-016 spec hook. */
  static _formatLocalIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private weekLabel(weekStartIso: string): string {
    const monday = new Date(`${weekStartIso}T00:00:00`);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
    return `Tuần ${fmt(monday)} – ${fmt(sunday)}`;
  }
}

export default FitnessHistoryPage;

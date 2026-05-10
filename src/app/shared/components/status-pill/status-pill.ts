import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusPillStatus = 'planned' | 'logged';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-pill.html',
  styleUrl: './status-pill.scss',
})
export class StatusPill {
  readonly status = input.required<StatusPillStatus>();
  readonly completedAt = input<string | null>(null);

  readonly icon = computed<string>(() => (this.status() === 'logged' ? '🔒' : '📌'));

  readonly label = computed<string>(() => {
    if (this.status() === 'planned') return 'Kế hoạch';
    const formatted = this.formatTime(this.completedAt());
    return formatted ? `Đã ăn lúc ${formatted}` : 'Đã ăn';
  });

  private formatTime(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  }
}

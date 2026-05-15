import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';

export type ConfirmEatMode = 'mark' | 'unmark';

@Component({
  selector: 'app-confirm-eat-modal',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-eat-modal.html',
  styleUrl: './confirm-eat-modal.scss',
})
export class ConfirmEatModal {
  constructor() {
    addIcons({ informationCircleOutline });
  }

  readonly isOpen = input<boolean>(false);
  readonly dishName = input.required<string>();
  readonly mode = input.required<ConfirmEatMode>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly title = computed<string>(() =>
    this.mode() === 'mark'
      ? `Đánh dấu "${this.dishName()}" đã ăn?`
      : `Bỏ đánh dấu "${this.dishName()}"?`,
  );

  readonly body = computed<string>(() =>
    this.mode() === 'mark'
      ? 'Số liệu sẽ được lưu cố định.'
      : 'Số liệu hiện tại sẽ bị xoá và quay về realtime theo recipe.',
  );

  /** Microcopy explaining Hybrid policy — only shown for mark mode (see F-03 §6.2). */
  readonly hybridMicrocopy = computed<string | null>(() =>
    this.mode() === 'mark'
      ? 'Khi đã đánh dấu, calo & dinh dưỡng tại thời điểm này được snapshot, không đổi khi recipe thay đổi.'
      : null,
  );

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

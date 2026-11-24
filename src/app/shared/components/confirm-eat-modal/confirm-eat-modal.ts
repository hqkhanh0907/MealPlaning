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
      ? 'Lưu calo và dinh dưỡng của bữa này.'
      : 'Món trở về trạng thái dự kiến. Lịch ăn tính lại theo công thức hiện tại.',
  );

  /** Microcopy explaining Hybrid policy — only shown for mark mode (see F-03 §6.2). */
  readonly hybridMicrocopy = computed<string | null>(() =>
    this.mode() === 'mark' ? 'Số liệu đã ăn giữ nguyên khi bạn sửa công thức.' : null,
  );

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

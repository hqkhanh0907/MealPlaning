import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { chevronDownOutline } from 'ionicons/icons';
import { LocalDay } from '../../../core/stores/local-day';
import { ageOnDate } from '../../../core/services/profile/profile-birth-date';
import { parseLocalDate } from '../../../core/utils/local-date';
import { AppFormField } from '../form-field/form-field';

const birthDateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

@Component({
  selector: 'app-birth-date-field',
  imports: [AppFormField, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './birth-date-field.html',
  styleUrl: './birth-date-field.scss',
})
export class BirthDateField {
  protected readonly calendarChevron = chevronDownOutline;
  readonly birthDate = input.required<string>();
  readonly idPrefix = input.required<string>();
  readonly errorId = input.required<string>();
  readonly errorMessage = input<string | null>('');
  readonly edited = output<string>();
  protected readonly touched = signal(false);
  protected readonly visibleError = computed(
    () =>
      this.errorMessage() ||
      (this.touched() && !this.birthDate() ? 'Vui lòng nhập ngày sinh.' : ''),
  );
  protected readonly day = inject(LocalDay);
  protected readonly age = computed(() => ageOnDate(this.birthDate(), this.day.date()));
  protected readonly displayDate = computed(() => {
    const date = parseLocalDate(this.birthDate());
    return Number.isNaN(date.getTime()) ? '' : birthDateFormat.format(date);
  });
}

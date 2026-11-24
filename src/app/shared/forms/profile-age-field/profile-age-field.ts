import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BODY_MEASUREMENT_LIMITS } from '../../../core/models/body-measurements';
import { ageOnDate } from '../../../core/services/profile/profile-birth-date';
import { localIsoDate } from '../../../core/utils/local-date';
import { AppFormField } from '../form-field/form-field';

export interface ProfileAgeInput {
  birthDate: string;
  age: number | null;
}

@Component({
  selector: 'app-profile-age-field',
  imports: [AppFormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-age-field.html',
  styleUrl: './profile-age-field.scss',
})
export class ProfileAgeField {
  readonly age = input.required<number | null>();
  readonly birthDate = input.required<string>();
  readonly idPrefix = input.required<string>();
  readonly ageTestId = input<string>();
  readonly errorId = input.required<string>();
  readonly errorMessage = input<string | null>('');
  readonly edited = output<ProfileAgeInput>();
  protected readonly limits = BODY_MEASUREMENT_LIMITS.age;
  protected readonly today = localIsoDate;

  protected changeDate(value: string): void {
    this.edited.emit({ birthDate: value, age: value ? ageOnDate(value) : this.age() });
  }

  protected changeAge(value: number): void {
    if (!this.birthDate()) {
      this.edited.emit({ birthDate: '', age: Number.isFinite(value) ? value : null });
    }
  }
}

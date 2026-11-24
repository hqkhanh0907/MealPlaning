import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { GENDER_LABELS, type Gender } from '../../../core/models/user-profile.types';
import { BirthDateField } from '../birth-date-field/birth-date-field';

@Component({
  selector: 'app-body-fields',
  imports: [BirthDateField],
  templateUrl: './body-fields.html',
  styleUrl: './body-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodyFields {
  readonly idPrefix = input.required<string>();
  readonly errorPrefix = input('err');
  readonly birthDate = input.required<string>();
  readonly dateError = input<string | null>(null);
  readonly gender = input.required<Gender | null>();
  readonly genderError = input('');
  readonly birthDateChange = output<string>();
  readonly genderChange = output<Gender>();
  protected readonly options = ['male', 'female'] as const;
  protected readonly labels = GENDER_LABELS;
}

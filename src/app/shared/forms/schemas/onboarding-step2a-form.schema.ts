import { MAX, MIN, metadata, schema, validate } from '@angular/forms/signals';
import {
  BODY_MEASUREMENT_LIMITS,
  bodyMeasurementError,
  isProfileGender,
  type BodyMeasurementsDraft,
} from '../../../core/models/body-measurements';

export const onboardingStep2aSchema = schema<BodyMeasurementsDraft>((path) => {
  for (const field of ['heightCm', 'weightKg', 'age'] as const) {
    metadata(path[field], MIN, () => BODY_MEASUREMENT_LIMITS[field].min);
    metadata(path[field], MAX, () => BODY_MEASUREMENT_LIMITS[field].max);
    validate(path[field], ({ value }) => {
      const message = bodyMeasurementError(field, value());
      return message ? { kind: 'range', message } : null;
    });
  }
  validate(path.gender, ({ value }) =>
    isProfileGender(value()) ? null : { kind: 'required', message: 'Vui lòng chọn giới tính' },
  );
});

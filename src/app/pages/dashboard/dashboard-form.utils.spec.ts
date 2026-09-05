import { FormControl, FormGroup } from '@angular/forms';
import {
  chronologicalDateRangeValidator,
  decimalValidator,
  richTextRequiredValidator,
  toIsoDate,
} from './dashboard-form.utils';

describe('dashboard form utilities', () => {
  it('validates exact decimal precision without converting to floating point', () => {
    const validator = decimalValidator(2);
    expect(validator(new FormControl('125.50'))).toBeNull();
    expect(validator(new FormControl('125.501'))).toEqual({ decimal: true });
    expect(validator(new FormControl('-1.00'))).toEqual({ decimal: true });
  });

  it('requires visible rich text', () => {
    expect(richTextRequiredValidator(new FormControl('<p><br></p>'))).toEqual({ required: true });
    expect(richTextRequiredValidator(new FormControl('<p><strong>Reto</strong></p>'))).toBeNull();
  });

  it('converts local date values to UTC ISO strings', () => {
    expect(toIsoDate('not-a-date')).toBeNull();
    expect(toIsoDate('2027-01-01T09:00')).toMatch(/^2027-01-01T/);
  });

  it('requires the end date to be later than the start date', () => {
    const form = new FormGroup(
      {
        startAt: new FormControl('2027-01-02T09:00'),
        endAt: new FormControl('2027-01-01T09:00'),
      },
      chronologicalDateRangeValidator,
    );

    expect(form.errors).toEqual({ dateRange: true });
    form.controls.endAt.setValue('2027-01-03T09:00');
    expect(form.errors).toBeNull();
  });
});

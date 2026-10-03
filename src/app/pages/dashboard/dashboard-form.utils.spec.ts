import { FormControl, FormGroup } from '@angular/forms';
import {
  chronologicalDateRangeValidator,
  decimalValidator,
  richTextRequiredValidator,
  toDateOnly,
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

  it('accepts calendar dates without a time', () => {
    expect(toDateOnly('not-a-date')).toBeNull();
    expect(toDateOnly('2027-02-29')).toBeNull();
    expect(toDateOnly('2027-01-01')).toBe('2027-01-01');
  });

  it('requires the end date to be later than the start date', () => {
    const form = new FormGroup(
      {
        startAt: new FormControl('2027-01-02'),
        endAt: new FormControl('2027-01-01'),
      },
      chronologicalDateRangeValidator,
    );

    expect(form.errors).toEqual({ dateRange: true });
    form.controls.endAt.setValue('2027-01-03');
    expect(form.errors).toBeNull();
  });
});

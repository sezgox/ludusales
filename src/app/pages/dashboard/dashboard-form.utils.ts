import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const maxScaledValue = 9_000_000_000_000;

export const decimalValidator = (precision: number): ValidatorFn => (control: AbstractControl): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value.trim() : '';
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);

  if (!match || (match[2]?.length ?? 0) > precision) {
    return { decimal: true };
  }

  const scaled = Number(`${match[1]}${(match[2] ?? '').padEnd(precision, '0')}`);
  return Number.isSafeInteger(scaled) && scaled <= maxScaledValue ? null : { decimal: true };
};

export const richTextRequiredValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value : '';
  const visibleText = value.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/gi, ' ').trim();
  return visibleText ? null : { required: true };
};

export const chronologicalDateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const startAt = control.get('startAt')?.value;
  const endAt = control.get('endAt')?.value;

  if (typeof startAt !== 'string' || typeof endAt !== 'string' || !startAt || !endAt) return null;
  const start = toIsoDate(startAt);
  const end = toIsoDate(endAt);
  return start && end && end > start ? null : { dateRange: true };
};

export const toIsoDate = (localValue: string): string | null => {
  const date = new Date(localValue);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

export const toLocalDateTime = (isoValue: string): string => {
  const date = new Date(isoValue);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

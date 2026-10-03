import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const maxScaledValue = 9_000_000_000_000;

export const decimalValidator = (precision: number): ValidatorFn => (control: AbstractControl): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value.trim() : '';
  if (!value) return null;
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
  const start = toDateOnly(startAt);
  const end = toDateOnly(endAt);
  return start && end && end > start ? null : { dateRange: true };
};

export const toDateOnly = (value: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
};

export const toDateInputValue = (value: string): string => {
  const date = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0] ?? '';
  return toDateOnly(date) ?? '';
};

export const todayDate = (now = new Date()): string => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

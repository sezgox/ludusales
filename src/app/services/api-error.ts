import { HttpErrorResponse } from '@angular/common/http';

export const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof HttpErrorResponse && typeof error.error === 'object' && error.error !== null) {
    const message = Reflect.get(error.error, 'error');

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

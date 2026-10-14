import { formatCurrency } from '@angular/common';
import './app.config';

describe('appConfig', () => {
  it('registers Spanish locale data for currency formatting', () => {
    expect(() => formatCurrency(150, 'es-ES', '€')).not.toThrow();
  });
});

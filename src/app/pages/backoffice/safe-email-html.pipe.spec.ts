import { describe, expect, it } from 'vitest';
import { sanitizeEmailHtml } from './safe-email-html.pipe';

describe('sanitizeEmailHtml', () => {
  it('keeps safe inline email styles', () => {
    const html = sanitizeEmailHtml('<p style="color:#1e5125;font-weight:800;margin:0;">Hola</p>');

    expect(html).toContain('style=');
    expect(html).toContain('color:#1e5125');
    expect(html).toContain('font-weight:800');
  });

  it('removes executable html, unsafe urls, and dangerous css', () => {
    const html = sanitizeEmailHtml(`
      <script>alert(1)</script>
      <a href="javascript:alert(1)" onclick="alert(1)">Abrir</a>
      <p style="position:fixed;color:#278537;background:url(javascript:alert(1));">Texto</p>
    `);

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('position:fixed');
    expect(html).toContain('color:#278537');
  });
});

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-social',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="social">
      <a href="https://www.linkedin.com/company/ludus-sales/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Ludus Sales"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21H9z"/></svg></a>
      <a href="https://www.instagram.com/ludus.sales/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Ludus Sales"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg></a>
      <a href="https://www.facebook.com/profile.php?id=61596245528532" target="_blank" rel="noopener noreferrer" aria-label="Facebook de Ludus Sales"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8.5h2.9l.4-3.4h-3.3V8c0-1 .3-1.6 1.7-1.6h1.8v-3A24 24 0 0 0 14.4 3c-2.6 0-4.3 1.6-4.3 4.5v2.6H7.2v3.4h2.9V22z"/></svg></a>
    </div>
  `,
  styles: `
    .social { display:flex; gap:10px; margin-top:14px }
    a { width:38px; height:38px; border-radius:10px; display:grid; place-items:center; background:var(--sunk,#eaf4dc); color:var(--fg,#14361c) }
    a:hover { background:#2e8b3a; color:#fff }
    a:focus-visible { outline:3px solid #ffb900; outline-offset:3px }
    svg { width:18px; height:18px }
    :host-context(footer) a { background:rgba(255,255,255,.08); color:#fff }
    :host-context(footer) a:hover { background:#ffb900; color:#1f1a00 }
  `,
})
export class LandingSocial {}

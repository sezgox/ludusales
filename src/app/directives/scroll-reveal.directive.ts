import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';

export type ScrollRevealVariant =
  | 'fade'
  | 'fade-up'
  | 'fade-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'tilt-left'
  | 'tilt-right';

@Directive({
  selector: '[appScrollReveal]',
  host: {
    '[attr.data-reveal]': 'variant()',
    '[class.reveal-pending]': 'isPending()',
    '[class.reveal-visible]': 'isVisible()',
    '[style.--reveal-delay]': 'delayStyle()',
  },
})
export class ScrollRevealDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly variant = input<ScrollRevealVariant>('fade-up', { alias: 'appScrollReveal' });
  readonly revealDelay = input(0, { alias: 'revealDelay' });

  protected readonly isPending = signal(false);
  protected readonly isVisible = signal(false);

  protected delayStyle(): string {
    return `${this.revealDelay()}ms`;
  }

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      this.isVisible.set(true);
      return;
    }

    afterNextRender(() => {
      const element = this.elementRef.nativeElement;

      if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.isVisible.set(true);
        return;
      }

      this.isPending.set(true);

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.12) {
              continue;
            }

            this.isPending.set(false);
            this.isVisible.set(true);
            observer.unobserve(element);
            break;
          }
        },
        {
          threshold: [0, 0.12, 0.2, 0.35],
          rootMargin: '0px 0px -8% 0px',
        },
      );

      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}

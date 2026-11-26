import { DatePipe, DecimalPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, of, startWith, switchMap, timer } from 'rxjs';
import { ChallengeDataService } from '../../services/challenge-data.service';

const titles = ['Clasificación', 'Meta y zonas', 'Novedades'] as const;

@Component({
  selector: 'app-public-tv',
  imports: [DatePipe, DecimalPipe],
  template: `
    <main #screen>
      @if (data(); as view) {
        <header>
          <h1>{{ view.title }}</h1>
          <div class="actions">
            <button type="button" (click)="move(-1)">Anterior</button>
            <button type="button" [attr.aria-pressed]="paused()" (click)="paused.set(!paused())">Pausar</button>
            <button type="button" (click)="move(1)">Siguiente</button>
            <button type="button" (click)="fullscreen(screen)">Pantalla completa</button>
          </div>
        </header>
        @if (view.updatedAt) { <p>Actualizado el {{ view.updatedAt | date:'d MMM yyyy, HH:mm' }}</p> }
        @if (fullscreenError()) {<p role="alert">El navegador no permitió cambiar a pantalla completa.</p>}
        <section aria-labelledby="tv-title">
          <h2 id="tv-title">{{ title() }}</h2>
          @switch (slide()) {
            @case (0) {
              <ol>@for (entry of view.ranking; track $index) {
                <li><span>{{ entry.position }}.º</span><strong>{{ entry.name }}</strong><span>{{ entry.score | number:digits() }} {{ view.rankingUnit }}</span></li>
              } @empty {<li>Aún no hay puntuaciones publicadas.</li>}</ol>
            }
            @case (1) {
              @if (view.goal) {
                <p class="total">{{ view.goalTotal | number:digits() }} de {{ view.goal | number:digits() }} {{ view.goalUnit }}</p>
                <progress [value]="view.goalTotal" [max]="view.goal" aria-label="Meta colectiva"></progress>
              }
              <ul>@for (team of view.teams; track team.name) {<li><strong>{{ team.name }}</strong><span>{{ team.average | number:'1.0-2' }} {{ view.rankingUnit }} por persona</span></li>}</ul>
              @if (!view.goal && !view.teams.length) {<p>Aún no hay resultados para esta vista.</p>}
            }
            @case (2) { <ul>@for (item of view.news; track $index) {<li>{{ item }}</li>} @empty {<li>Aún no hay novedades publicadas.</li>}</ul> }
          }
        </section>
      } @else if (data() === null) {<h1>Pantalla no disponible</h1><p>Solicita un enlace activo al equipo de Ludus Sales.</p>}
      @else {<p role="status">Cargando pantalla…</p>}
    </main>
  `,
  styles: [`
    :host { display: block; background: #10261a; color: #fff; font: 600 18px/1.4 Figtree, system-ui, sans-serif; }
    main { box-sizing: border-box; overflow: auto; background: #10261a; min-height: 100dvh; padding: clamp(16px, 4vw, 60px); width: 100%; max-width: 1300px; margin: auto; }
    main:fullscreen { max-width: none; }
    header, .actions { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; }
    h1, h2 { line-height: 1.1; margin: 0; }
    h1 { font-size: clamp(28px, 4vw, 58px); }
    h2 { font-size: clamp(26px, 3vw, 42px); color: #ffc72c; }
    button { min-height: 44px; padding: 6px 12px; border: 1px solid #b9cbbb; border-radius: 8px; background: #10261a; color: #fff; font: inherit; cursor: pointer; }
    button[aria-pressed=true] { background: #ffc72c; color: #10261a; }
    button:focus-visible { outline: 3px solid #ffc72c; outline-offset: 3px; }
    section { border: 2px solid #778f7b; border-radius: 16px; padding: clamp(14px, 3vw, 32px); margin-top: 24px; }
    ul, ol { list-style: none; padding: 0; margin-bottom: 0; }
    li { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; justify-content: space-between; padding-block: 10px; border-bottom: 1px solid #778f7b; font-size: clamp(17px, 2.1vw, 28px); }
    .total { font-size: clamp(24px, 4vw, 50px); }
    progress { accent-color: #ffc72c; width: 100%; height: 20px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicTv {
  private readonly api = inject(ChallengeDataService);
  private readonly document = inject(DOCUMENT);
  readonly slide = signal(0);
  readonly paused = signal(false);
  readonly fullscreenError = signal(false);
  readonly title = computed(() => titles[this.slide()]);
  readonly data = toSignal(inject(ActivatedRoute).fragment.pipe(switchMap((token) => token ? timer(0, 15_000).pipe(
    switchMap(() => this.api.readTv(token).pipe(catchError(() => of(null)))), startWith(undefined),
  ) : of(null))));
  readonly digits = computed(() => `1.0-${this.data()?.valuePrecision ?? 0}`);
  private readonly seconds = computed(() => this.data()?.seconds);

  constructor() {
    effect((cleanup) => {
      const seconds = this.seconds();
      if (!seconds || this.paused()) return;
      const id = globalThis.setInterval(() => this.move(1), seconds * 1000);
      cleanup(() => globalThis.clearInterval(id));
    });
  }

  move(step: number): void { this.slide.update((slide) => (slide + titles.length + step) % titles.length); }

  async fullscreen(screen: HTMLElement): Promise<void> {
    this.fullscreenError.set(false);
    try {
      if (this.document.fullscreenElement) await this.document.exitFullscreen();
      else await screen.requestFullscreen();
    } catch {
      this.fullscreenError.set(true);
    }
  }
}

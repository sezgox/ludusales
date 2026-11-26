import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, distinctUntilChanged, map, of, startWith, Subject, switchMap, type Observable } from 'rxjs';
import { BlogApi } from '../../../services/blog-api.service';
import { LandingLanguage } from '../../../services/landing-language.service';

type LoadState<T> = { status: 'loading' | 'error' | 'missing' } | { status: 'ready'; value: T };

function load<T>(request: Observable<T>): Observable<LoadState<T>> {
  return request.pipe(
    map((value): LoadState<T> => ({ status: 'ready', value })),
    catchError((error: unknown): Observable<LoadState<T>> =>
      of({ status: error instanceof HttpErrorResponse && error.status === 404 ? 'missing' : 'error' })),
    startWith({ status: 'loading' } as const),
  );
}

@Component({
  selector: 'app-landing-blog',
  imports: [RouterLink, NgTemplateOutlet, DatePipe],
  templateUrl: './landing-blog.html',
  styleUrl: './landing-blog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingBlog {
  private readonly api = inject(BlogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly reload = new Subject<void>();
  private readonly reload$ = this.reload.pipe(startWith(undefined));
  private readonly slug$ = this.route.paramMap.pipe(map((params) => params.get('slug')), distinctUntilChanged());

  readonly i18n = inject(LandingLanguage);
  readonly slug = toSignal(this.slug$, { initialValue: this.route.snapshot.paramMap.get('slug') });
  readonly selectedCategory = signal<string | null>(null);
  readonly list = toSignal(this.reload$.pipe(switchMap(() => load(this.api.list()))), { requireSync: true });
  readonly detail = toSignal(combineLatest([this.slug$, this.reload$]).pipe(
    switchMap(([slug]) => slug ? load(this.api.detail(slug)) : of(null)),
  ));
  readonly posts = computed(() => {
    const state = this.list();
    return state.status === 'ready' ? state.value : [];
  });
  readonly categories = computed(() => Array.from(new Map(this.posts().map((post) => [post.category, post.categoryEn]))));
  readonly filteredPosts = computed(() => this.posts().filter((post) =>
    this.selectedCategory() === null || post.category === this.selectedCategory()));
  readonly relatedPosts = computed(() => this.posts().filter((post) => post.slug !== this.slug()).slice(0, 2));

  retry(): void {
    this.reload.next();
  }
}

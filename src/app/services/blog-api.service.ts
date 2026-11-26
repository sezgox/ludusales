import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiUrlService } from './api-url.service';

export type BlogPostSummary = {
  slug: string;
  category: string;
  categoryEn: string;
  author: string;
  publishedAt: string;
  featured: boolean;
  readingMinutes: number;
  coverLabel: string;
  coverColor: string;
  coverStripe: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
};

export type BlogPost = BlogPostSummary & { body: string; bodyEn: string };

@Injectable({ providedIn: 'root' })
export class BlogApi {
  private readonly http = inject(HttpClient);
  private readonly urls = inject(ApiUrlService);

  list() {
    return this.http.get<{ posts: BlogPostSummary[] }>(this.urls.endpoint('/blog')).pipe(map(({ posts }) => posts));
  }

  detail(slug: string) {
    return this.http.get<{ post: BlogPost }>(this.urls.endpoint(`/blog/${encodeURIComponent(slug)}`))
      .pipe(map(({ post }) => post));
  }
}

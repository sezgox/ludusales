import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LandingLanguage } from '../../../services/landing-language.service';
import { BLOG_POSTS } from '../blog-posts';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-landing-blog',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './landing-blog.html',
  styleUrl: './landing-blog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingBlog {
  readonly i18n = inject(LandingLanguage);
  readonly posts = BLOG_POSTS;
  readonly selectedCategory = signal('Todos');
  readonly categories = ['Todos', 'Motivación', 'Diseño de juego', 'Guías'];
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  readonly post = computed(() => BLOG_POSTS.find(post => post.id === this.params()?.get('slug')));
  readonly filteredPosts = computed(() => this.posts.filter(post => this.selectedCategory() === 'Todos' || post.cat === this.selectedCategory()));
  readonly relatedPosts = computed(() => this.posts.filter(post => post !== this.post()).slice(0, 2));

  category(category: string): string {
    const english: Record<string, string> = { Todos: 'All', Motivación: 'Motivation', 'Diseño de juego': 'Game design', Guías: 'Guides' };
    return this.i18n.text(category, english[category] ?? category);
  }
}

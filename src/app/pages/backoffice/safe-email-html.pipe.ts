import { isPlatformBrowser } from '@angular/common';
import { Pipe, PipeTransform, PLATFORM_ID, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const blockedTags = 'script,iframe,object,embed,link,meta,base,form,input,button,textarea,select,option,svg,math';
const urlAttributes = new Set(['href', 'src', 'poster', 'background', 'xlink:href']);
const blockedStyleProperties = new Set(['behavior', '-moz-binding', 'position', 'z-index']);

@Pipe({
  name: 'safeEmailHtml',
})
export class SafeEmailHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);

  transform(value: string | null | undefined): SafeHtml {
    const html = value ?? '';
    const sanitizedHtml = isPlatformBrowser(this.platformId) ? sanitizeEmailHtml(html) : sanitizeEmailHtmlFallback(html);

    return this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml);
  }
}

export const sanitizeEmailHtml = (html: string): string => {
  const documentRef = globalThis.document;

  if (!documentRef) {
    return sanitizeEmailHtmlFallback(html);
  }

  const template = documentRef.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll(blockedTags).forEach((element) => element.remove());
  template.content.querySelectorAll('*').forEach((element) => sanitizeElement(element));

  return template.innerHTML;
};

const sanitizeElement = (element: Element): void => {
  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value.trim();

    if (name.startsWith('on') || name === 'srcdoc') {
      element.removeAttribute(attribute.name);
      continue;
    }

    if (name === 'style') {
      const cleanStyle = sanitizeInlineStyle(value);

      if (cleanStyle) {
        element.setAttribute(attribute.name, cleanStyle);
      } else {
        element.removeAttribute(attribute.name);
      }

      continue;
    }

    if (urlAttributes.has(name) && !isSafeEmailUrl(value)) {
      element.removeAttribute(attribute.name);
    }
  }
};

const sanitizeInlineStyle = (style: string): string =>
  style
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => {
      const separatorIndex = declaration.indexOf(':');

      if (separatorIndex < 1) {
        return false;
      }

      const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
      const value = declaration.slice(separatorIndex + 1).trim().toLowerCase();

      return !blockedStyleProperties.has(property) && !hasUnsafeStyleValue(value);
    })
    .join('; ');

const hasUnsafeStyleValue = (value: string): boolean =>
  /expression\s*\(/i.test(value) ||
  /@import/i.test(value) ||
  (/url\s*\(/i.test(value) && !/url\s*\(\s*['"]?(https?:|cid:|data:image\/)/i.test(value));

const isSafeEmailUrl = (value: string): boolean => {
  if (!value || value.startsWith('#')) {
    return true;
  }

  return /^(https?:|mailto:|tel:|cid:|data:image\/)/i.test(value);
};

const sanitizeEmailHtmlFallback = (html: string): string =>
  html
    .replace(/<\s*(script|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math)\b[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src|poster|background|xlink:href)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '');

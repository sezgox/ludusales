import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

export type BackofficeAuth =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      user: {
        email: string;
        publicEmail: string;
        role: 'owner';
        name: string | null;
      };
    };

export type BackofficeMessageSummary = {
  messageKey: string;
  subject: string;
  bodyPreview: string;
  from: {
    name: string;
    email: string;
  };
  replyToEmail: string | null;
  receivedAt: string;
  isRead: boolean;
  evidence: string;
};

export type BackofficeMessageDetail = BackofficeMessageSummary & {
  bodyHtml: string;
  threadSegments: MessageThreadSegment[];
  threadMessages: MessageThreadMessage[];
  internetMessageId: string | null;
  referencesHeader: string | null;
};

export type MessageThreadSegment = {
  kind: 'latest' | 'quoted';
  label: string;
  html: string;
};

export type MessageThreadMessage = {
  messageKey: string;
  direction: 'inbound' | 'outbound' | 'quoted';
  from: {
    name: string;
    email: string;
  };
  receivedAt: string;
  bodyHtml: string;
  isSelected: boolean;
};

export type BackofficeMessagesResponse = {
  messages: BackofficeMessageSummary[];
};

export type BackofficeMessageResponse = {
  message: BackofficeMessageDetail;
};

export type BackofficeReplyResponse = {
  ok: boolean;
  id: string | null;
  createdAt: string;
};

@Injectable({
  providedIn: 'root',
})
export class BackofficeService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly auth = signal<BackofficeAuth | null>(null);

  loadAuth(): Observable<BackofficeAuth> {
    return this.http.get<BackofficeAuth>(this.endpoint('/auth/me'), { withCredentials: true }).pipe(
      tap((auth) => this.auth.set(auth)),
      catchError(() => {
        const auth: BackofficeAuth = { authenticated: false };
        this.auth.set(auth);

        return of(auth);
      }),
    );
  }

  microsoftLoginUrl(): string {
    return this.endpoint('/auth/microsoft/start');
  }

  logout(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(this.endpoint('/auth/logout'), {}, { withCredentials: true }).pipe(
      tap(() => this.auth.set({ authenticated: false })),
    );
  }

  listMessages(): Observable<BackofficeMessagesResponse> {
    return this.http.get<BackofficeMessagesResponse>(this.endpoint('/backoffice/messages'), { withCredentials: true });
  }

  getMessage(messageKey: string): Observable<BackofficeMessageResponse> {
    return this.http.get<BackofficeMessageResponse>(this.endpoint(`/backoffice/messages/${encodeURIComponent(messageKey)}`), {
      withCredentials: true,
    });
  }

  replyToMessage(messageKey: string, message: string): Observable<BackofficeReplyResponse> {
    return this.http.post<BackofficeReplyResponse>(
      this.endpoint(`/backoffice/messages/${encodeURIComponent(messageKey)}/reply`),
      { message },
      { withCredentials: true },
    );
  }

  private endpoint(path: string): string {
    if (isPlatformBrowser(this.platformId)) {
      const hostname = globalThis.location?.hostname;

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:8787${path}`;
      }
    }

    return `https://api.ludusales.com${path}`;
  }
}

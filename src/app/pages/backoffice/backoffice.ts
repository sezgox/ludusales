import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BackofficeMessageDetail, BackofficeMessageSummary, BackofficeService } from './backoffice.service';

@Component({
  selector: 'app-backoffice',
  imports: [DatePipe],
  templateUrl: './backoffice.html',
  styleUrl: './backoffice.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Backoffice {
  private readonly backoffice = inject(BackofficeService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly auth = this.backoffice.auth;
  readonly messages = signal<BackofficeMessageSummary[]>([]);
  readonly selectedMessage = signal<BackofficeMessageDetail | null>(null);
  readonly loadingMessages = signal(false);
  readonly loadingDetail = signal(false);
  readonly sendingReply = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly replyText = signal('');
  readonly selectedMessageKey = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.auth()?.authenticated === true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      void this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    const auth = this.auth() ?? (await firstValueFrom(this.backoffice.loadAuth()));

    if (auth.authenticated) {
      await this.loadMessages();
    }
  }

  login(): void {
    if (isPlatformBrowser(this.platformId)) {
      globalThis.location.href = this.backoffice.microsoftLoginUrl();
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.backoffice.logout());
    this.messages.set([]);
    this.selectedMessage.set(null);
    this.selectedMessageKey.set(null);
  }

  async loadMessages(): Promise<void> {
    this.error.set(null);
    this.notice.set(null);
    this.loadingMessages.set(true);

    try {
      const response = await firstValueFrom(this.backoffice.listMessages());
      this.messages.set(response.messages);

      if (!this.selectedMessageKey() && response.messages.length > 0) {
        await this.openMessage(response.messages[0]);
      }
    } catch {
      this.error.set('No se han podido cargar los correos de Outlook.');
    } finally {
      this.loadingMessages.set(false);
    }
  }

  async openMessage(message: BackofficeMessageSummary): Promise<void> {
    this.error.set(null);
    this.notice.set(null);
    this.loadingDetail.set(true);
    this.selectedMessageKey.set(message.messageKey);

    try {
      const response = await firstValueFrom(this.backoffice.getMessage(message.messageKey));
      this.selectedMessage.set(response.message);
      this.replyText.set('');
    } catch {
      this.error.set('No se ha podido abrir el correo seleccionado.');
    } finally {
      this.loadingDetail.set(false);
    }
  }

  updateReplyText(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLTextAreaElement) {
      this.replyText.set(target.value);
    }
  }

  async sendReply(): Promise<void> {
    const message = this.selectedMessage();
    const text = this.replyText().trim();

    if (!message || !text || this.sendingReply()) {
      return;
    }

    this.error.set(null);
    this.notice.set(null);
    this.sendingReply.set(true);

    try {
      const response = await firstValueFrom(this.backoffice.replyToMessage(message.messageKey, text));
      this.appendSentReply(message, text, response.id, response.createdAt);
      this.replyText.set('');
      this.notice.set('Respuesta enviada con Resend.');
    } catch {
      this.error.set('No se ha podido enviar la respuesta.');
    } finally {
      this.sendingReply.set(false);
    }
  }

  private appendSentReply(message: BackofficeMessageDetail, text: string, resendId: string | null, createdAt: string): void {
    const currentMessage = this.selectedMessage();
    const auth = this.auth();

    if (!currentMessage || currentMessage.messageKey !== message.messageKey) {
      return;
    }

    const sentReply = {
      messageKey: `pending-outbound-${resendId ?? createdAt}`,
      direction: 'outbound' as const,
      from: {
        name: 'Ludus Sales',
        email: auth?.authenticated ? auth.user.publicEmail : '',
      },
      receivedAt: createdAt,
      bodyHtml: this.textToHtml(text),
      isSelected: false,
    };

    this.selectedMessage.set({
      ...currentMessage,
      threadMessages: [...currentMessage.threadMessages, sentReply].sort(
        (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
      ),
    });
  }

  private textToHtml(text: string): string {
    return text
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${this.escapeHtml(paragraph).replaceAll('\n', '<br />')}</p>`)
      .join('');
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}

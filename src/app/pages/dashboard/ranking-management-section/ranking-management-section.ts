import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { GamificationDetail, RankingEntry } from '../../../models/gamification';
import { apiErrorMessage } from '../../../services/api-error';
import { GamificationApiService } from '../../../services/gamification-api.service';
import { ImageProcessingService } from '../../../services/image-processing.service';
import { decimalValidator } from '../dashboard-form.utils';

@Component({
  selector: 'app-ranking-management-section',
  imports: [ReactiveFormsModule],
  templateUrl: './ranking-management-section.html',
  styleUrl: './ranking-management-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingManagementSection {
  private readonly api = inject(GamificationApiService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly imageProcessing = inject(ImageProcessingService);

  readonly gamification = input.required<GamificationDetail>();
  readonly isSuperuser = input.required<boolean>();
  readonly changed = output<void>();
  readonly isSaving = signal(false);
  readonly editingParticipantId = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly createPicture = signal<File | null>(null);
  readonly canEdit = computed(() => this.isSuperuser());
  readonly isFull = computed(() => this.gamification().ranking.length >= 1000);
  readonly podiumEntries = computed(() => this.gamification().ranking.slice(0, 3));
  readonly remainingEntries = computed(() => this.gamification().ranking.slice(3));
  readonly participantForm = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.maxLength(160)]],
    score: ['0', Validators.required],
  });
  readonly editForm = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.maxLength(160)]],
    score: ['0', Validators.required],
  });

  constructor() {
    effect(() => {
      const precision = this.gamification().valuePrecision;
      this.participantForm.controls.score.setValidators([Validators.required, decimalValidator(precision)]);
      this.editForm.controls.score.setValidators([Validators.required, decimalValidator(precision)]);
      this.participantForm.controls.score.updateValueAndValidity({ emitEvent: false });
      this.editForm.controls.score.updateValueAndValidity({ emitEvent: false });
    });
  }

  selectCreatePicture(event: Event): void {
    const inputElement = event.target;
    this.createPicture.set(inputElement instanceof HTMLInputElement ? (inputElement.files?.[0] ?? null) : null);
  }

  async addParticipant(): Promise<void> {
    if (this.participantForm.invalid || this.isFull()) {
      this.participantForm.markAllAsTouched();
      this.feedback.set(this.isFull() ? 'El ranking admite un máximo de 1.000 personas.' : this.validationMessage());
      return;
    }
    const value = this.participantForm.getRawValue();
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      const participantId = globalThis.crypto.randomUUID();
      await firstValueFrom(this.api.upsertRankingEntry(this.gamification().publicId, participantId, {
        fullName: value.fullName.trim(), score: value.score.trim(),
      }));
      this.participantForm.reset({ fullName: '', score: this.zeroScore() });
      const picture = this.createPicture();
      this.createPicture.set(null);
      this.changed.emit();

      if (picture) {
        try {
          const webp = await this.imageProcessing.toUploadableWebp(picture);
          await firstValueFrom(this.api.uploadRankingParticipantPicture(this.gamification().publicId, participantId, webp));
          this.changed.emit();
        } catch (error) {
          this.feedback.set(`Participante aÃ±adido sin foto. ${apiErrorMessage(error, 'Reintenta la subida.')}`);
        }
      }
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo añadir la persona.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  editParticipant(entry: RankingEntry): void {
    this.editForm.reset({ fullName: entry.fullName, score: entry.score });
    this.feedback.set(null);
    this.editingParticipantId.set(entry.externalParticipantId);
  }

  cancelEdit(): void { this.editingParticipantId.set(null); this.feedback.set(null); }

  async saveParticipant(entry: RankingEntry): Promise<void> {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.feedback.set(this.validationMessage());
      return;
    }
    const value = this.editForm.getRawValue();
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      await firstValueFrom(this.api.upsertRankingEntry(this.gamification().publicId, entry.externalParticipantId, {
        fullName: value.fullName.trim(), score: value.score.trim(),
      }));
      this.editingParticipantId.set(null);
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo actualizar la persona.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteParticipant(entry: RankingEntry): Promise<void> {
    if (!globalThis.confirm(`¿Eliminar a “${entry.fullName}” del ranking?`)) return;
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      await firstValueFrom(this.api.deleteRankingEntry(this.gamification().publicId, entry.externalParticipantId));
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo eliminar la persona.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async uploadPicture(entry: RankingEntry, event: Event): Promise<void> {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement) || !inputElement.files?.[0]) return;
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      const webp = await this.imageProcessing.toUploadableWebp(inputElement.files[0]);
      await firstValueFrom(this.api.uploadRankingParticipantPicture(this.gamification().publicId, entry.externalParticipantId, webp));
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo subir la foto.'));
    } finally {
      inputElement.value = '';
      this.isSaving.set(false);
    }
  }

  async deletePicture(entry: RankingEntry): Promise<void> {
    if (!globalThis.confirm(`Â¿Quitar la foto de â€œ${entry.fullName}â€?`)) return;
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      await firstValueFrom(this.api.deleteRankingParticipantPicture(this.gamification().publicId, entry.externalParticipantId));
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo quitar la foto.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  initials(fullName: string): string {
    return fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('es-ES');
  }

  private validationMessage(): string { return `Usa un nombre y un score no negativo con máximo ${this.gamification().valuePrecision} decimales.`; }
  private zeroScore(): string { const precision = this.gamification().valuePrecision; return precision ? `0.${'0'.repeat(precision)}` : '0'; }
}

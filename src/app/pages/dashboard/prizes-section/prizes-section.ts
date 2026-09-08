import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { GamificationDetail, Prize, PrizePayload } from '../../../models/gamification';
import { apiErrorMessage } from '../../../services/api-error';
import { GamificationApiService } from '../../../services/gamification-api.service';
import { ImageProcessingService } from '../../../services/image-processing.service';

@Component({
  selector: 'app-prizes-section',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './prizes-section.html',
  styleUrl: './prizes-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrizesSection {
  private readonly api = inject(GamificationApiService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly imageProcessing = inject(ImageProcessingService);

  readonly gamification = input.required<GamificationDetail>();
  readonly isSuperuser = input.required<boolean>();
  readonly changed = output<void>();
  readonly isCreating = signal(false);
  readonly pendingPrizeId = signal<string | null>(null);
  readonly editingPrizeId = signal<string | null>(null);
  readonly createPicture = signal<File | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly canEdit = computed(() => this.isSuperuser() && this.gamification().status !== 'closed');
  readonly createForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    rankingPosition: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
    estimatedValue: ['', Validators.pattern(/^\d+(?:\.\d{1,2})?$/)],
  });
  readonly editForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    rankingPosition: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
    estimatedValue: ['', Validators.pattern(/^\d+(?:\.\d{1,2})?$/)],
  });

  selectCreatePicture(event: Event): void {
    const inputElement = event.target;
    this.createPicture.set(inputElement instanceof HTMLInputElement ? (inputElement.files?.[0] ?? null) : null);
  }

  async createPrize(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.feedback.set('Escribe un nombre para el premio.');
      return;
    }

    this.isCreating.set(true);
    this.feedback.set(null);

    try {
      const response = await firstValueFrom(
        this.api.createPrize(this.gamification().publicId, this.prizePayload(this.createForm.getRawValue())),
      );
      const picture = this.createPicture();
      this.createForm.reset({ name: '', rankingPosition: 1, estimatedValue: '' });
      this.createPicture.set(null);
      this.changed.emit();

      if (picture) {
        try {
          const webp = await this.imageProcessing.toUploadableWebp(picture);
          await firstValueFrom(this.api.uploadPrizePicture(response.prize.publicId, webp));
          this.changed.emit();
        } catch (error) {
          this.feedback.set(
            `Premio creado sin imagen. ${apiErrorMessage(error, 'Reintenta la subida.')}`,
          );
        }
      }
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo crear el premio.'));
    } finally {
      this.isCreating.set(false);
    }
  }

  editPrize(prize: Prize): void {
    this.editForm.controls.name.setValue(prize.name);
    this.editForm.controls.rankingPosition.setValue(prize.rankingPosition);
    this.editForm.controls.estimatedValue.setValue(prize.estimatedValue === null ? '' : String(prize.estimatedValue));
    this.feedback.set(null);
    this.editingPrizeId.set(prize.publicId);
  }

  cancelEdit(): void {
    this.editingPrizeId.set(null);
    this.feedback.set(null);
  }

  async savePrize(prize: Prize): Promise<void> {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.feedback.set('Escribe un nombre válido para el premio.');
      return;
    }

    this.pendingPrizeId.set(prize.publicId);
    this.feedback.set(null);

    try {
      await firstValueFrom(this.api.updatePrize(prize.publicId, this.prizePayload(this.editForm.getRawValue())));
      this.editingPrizeId.set(null);
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo actualizar el premio.'));
    } finally {
      this.pendingPrizeId.set(null);
    }
  }

  async uploadPicture(prize: Prize, event: Event): Promise<void> {
    const inputElement = event.target;

    if (!(inputElement instanceof HTMLInputElement) || !inputElement.files?.[0]) return;
    this.pendingPrizeId.set(prize.publicId);
    this.feedback.set(null);

    try {
      const webp = await this.imageProcessing.toUploadableWebp(inputElement.files[0]);
      await firstValueFrom(this.api.uploadPrizePicture(prize.publicId, webp));
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo subir la imagen.'));
    } finally {
      inputElement.value = '';
      this.pendingPrizeId.set(null);
    }
  }

  async deletePicture(prize: Prize): Promise<void> {
    if (!globalThis.confirm(`¿Eliminar la imagen de “${prize.name}”?`)) return;
    await this.runPrizeOperation(prize.publicId, () => firstValueFrom(this.api.deletePrizePicture(prize.publicId)), 'No se pudo eliminar la imagen.');
  }

  async deletePrize(prize: Prize): Promise<void> {
    if (!globalThis.confirm(`¿Eliminar el premio “${prize.name}”?`)) return;
    await this.runPrizeOperation(prize.publicId, () => firstValueFrom(this.api.deletePrize(prize.publicId)), 'No se pudo eliminar el premio.');
  }

  private async runPrizeOperation(prizeId: string, operation: () => Promise<unknown>, fallback: string): Promise<void> {
    this.pendingPrizeId.set(prizeId);
    this.feedback.set(null);

    try {
      await operation();
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, fallback));
    } finally {
      this.pendingPrizeId.set(null);
    }
  }

  private prizePayload(value: { name: string; rankingPosition: number; estimatedValue: string }): PrizePayload {
    return {
      name: value.name.trim(),
      rankingPosition: value.rankingPosition,
      estimatedValue: value.estimatedValue === '' ? null : Number(value.estimatedValue),
    };
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RichTextEditor } from '../../../components/rich-text-editor/rich-text-editor';
import { GamificationDetail } from '../../../models/gamification';
import { apiErrorMessage } from '../../../services/api-error';
import { GamificationApiService } from '../../../services/gamification-api.service';
import { ImageProcessingService } from '../../../services/image-processing.service';
import { richTextRequiredValidator } from '../dashboard-form.utils';

@Component({
  selector: 'app-information-section',
  imports: [ReactiveFormsModule, RichTextEditor],
  templateUrl: './information-section.html',
  styleUrl: './information-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationSection {
  private readonly api = inject(GamificationApiService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly imageProcessing = inject(ImageProcessingService);

  readonly gamification = input.required<GamificationDetail>();
  readonly isSuperuser = input.required<boolean>();
  readonly changed = output<void>();
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly isUploading = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly coverFeedback = signal<string | null>(null);
  readonly canEdit = computed(() => this.isSuperuser() && this.gamification().status !== 'closed');
  readonly descriptionForm = this.formBuilder.group({
    description: ['', [Validators.maxLength(20_000), richTextRequiredValidator]],
  });

  constructor() {
    effect(() => {
      const description = this.gamification().description;

      if (!this.isEditing()) {
        this.descriptionForm.controls.description.setValue(description, { emitEvent: false });
      }
    });
  }

  editDescription(): void {
    this.descriptionForm.controls.description.setValue(this.gamification().description);
    this.feedback.set(null);
    this.isEditing.set(true);
  }

  cancelDescription(): void {
    this.descriptionForm.controls.description.setValue(this.gamification().description);
    this.feedback.set(null);
    this.isEditing.set(false);
  }

  async saveDescription(): Promise<void> {
    if (this.descriptionForm.invalid) {
      this.descriptionForm.markAllAsTouched();
      this.feedback.set('Escribe una descripción válida de hasta 20.000 caracteres.');
      return;
    }

    this.isSaving.set(true);
    this.feedback.set(null);

    try {
      await firstValueFrom(
        this.api.update(this.gamification().publicId, {
          description: this.descriptionForm.controls.description.value,
        }),
      );
      this.isEditing.set(false);
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo guardar la descripción.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async uploadCover(event: Event): Promise<void> {
    const inputElement = event.target;

    if (!(inputElement instanceof HTMLInputElement) || !inputElement.files?.[0]) {
      return;
    }

    this.isUploading.set(true);
    this.coverFeedback.set(null);

    try {
      const webp = await this.imageProcessing.toUploadableWebp(inputElement.files[0]);
      await firstValueFrom(this.api.uploadCover(this.gamification().publicId, webp));
      this.coverFeedback.set('Portada actualizada.');
      this.changed.emit();
    } catch (error) {
      this.coverFeedback.set(apiErrorMessage(error, 'No se pudo subir la portada.'));
    } finally {
      inputElement.value = '';
      this.isUploading.set(false);
    }
  }

  async deleteCover(): Promise<void> {
    if (!globalThis.confirm('¿Eliminar la portada de esta gamificación?')) {
      return;
    }

    this.isUploading.set(true);
    this.coverFeedback.set(null);

    try {
      await firstValueFrom(this.api.deleteCover(this.gamification().publicId));
      this.coverFeedback.set('Portada eliminada.');
      this.changed.emit();
    } catch (error) {
      this.coverFeedback.set(apiErrorMessage(error, 'No se pudo eliminar la portada.'));
    } finally {
      this.isUploading.set(false);
    }
  }
}

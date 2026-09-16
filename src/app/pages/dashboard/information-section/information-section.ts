import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RichTextEditor } from '../../../components/rich-text-editor/rich-text-editor';
import { GamificationDetail } from '../../../models/gamification';
import { apiErrorMessage } from '../../../services/api-error';
import { GamificationApiService } from '../../../services/gamification-api.service';
import { ImageProcessingService } from '../../../services/image-processing.service';
import { chronologicalDateRangeValidator, decimalValidator, richTextRequiredValidator, toIsoDate, toLocalDateTime } from '../dashboard-form.utils';

@Component({
  selector: 'app-information-section',
  imports: [DatePipe, ReactiveFormsModule, RichTextEditor, RouterLink],
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
  readonly isEditingConfiguration = signal(false);
  readonly isSavingConfiguration = signal(false);
  readonly configurationAttempted = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly coverFeedback = signal<string | null>(null);
  readonly configurationFeedback = signal<string | null>(null);
  readonly canEdit = computed(() => this.isSuperuser());
  readonly descriptionForm = this.formBuilder.group({
    description: ['', [Validators.maxLength(20_000), richTextRequiredValidator]],
  });
  readonly configurationForm = this.formBuilder.group(
    {
      title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(160)]],
      startAt: ['', Validators.required],
      endAt: ['', Validators.required],
      goal: ['0', Validators.required],
      valuePrecision: [0, [Validators.required, Validators.min(0), Validators.max(6)]],
      goalUnit: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(40)]],
      maxLiveRanking: [5, [Validators.required, Validators.min(3), Validators.max(1000)]],
    },
    { validators: chronologicalDateRangeValidator },
  );

  constructor() {
    this.configurationForm.controls.valuePrecision.valueChanges.pipe(takeUntilDestroyed()).subscribe((precision) => {
      this.setGoalValidator(precision);
    });
    this.setGoalValidator(0);

    effect(() => {
      const gamification = this.gamification();

      if (!this.isEditing()) {
        this.descriptionForm.controls.description.setValue(gamification.description, { emitEvent: false });
      }

      if (!this.isEditingConfiguration()) {
        this.resetConfigurationForm(gamification);
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

  editConfiguration(): void {
    this.resetConfigurationForm(this.gamification());
    this.configurationFeedback.set(null);
    this.configurationAttempted.set(false);
    this.isEditingConfiguration.set(true);
  }

  cancelConfiguration(): void {
    this.resetConfigurationForm(this.gamification());
    this.configurationFeedback.set(null);
    this.configurationAttempted.set(false);
    this.isEditingConfiguration.set(false);
  }

  async saveConfiguration(): Promise<void> {
    this.configurationAttempted.set(true);

    if (this.configurationForm.invalid) {
      this.configurationForm.markAllAsTouched();
      this.configurationFeedback.set('Revisa los campos marcados antes de guardar.');
      return;
    }

    const value = this.configurationForm.getRawValue();
    const startAt = toIsoDate(value.startAt);
    const endAt = toIsoDate(value.endAt);

    if (!startAt || !endAt || endAt <= startAt) {
      this.configurationFeedback.set('Revisa los campos marcados antes de guardar.');
      return;
    }

    this.isSavingConfiguration.set(true);
    this.configurationFeedback.set(null);

    try {
      await firstValueFrom(this.api.update(this.gamification().publicId, {
        title: value.title.trim(),
        startAt,
        endAt,
        goal: value.goal.trim(),
        valuePrecision: value.valuePrecision,
        goalUnit: value.goalUnit.trim(),
        maxLiveRanking: value.maxLiveRanking,
      }));
      this.configurationAttempted.set(false);
      this.isEditingConfiguration.set(false);
      this.changed.emit();
    } catch (error) {
      this.configurationFeedback.set(apiErrorMessage(error, 'No se pudo guardar la configuración.'));
    } finally {
      this.isSavingConfiguration.set(false);
    }
  }

  showConfigurationError(control: AbstractControl): boolean {
    return this.configurationAttempted() && control.invalid;
  }

  showConfigurationDateRangeError(): boolean {
    return this.configurationAttempted() && this.configurationForm.hasError('dateRange');
  }

  private setGoalValidator(precision: number): void {
    this.configurationForm.controls.goal.setValidators([Validators.required, decimalValidator(precision)]);
    this.configurationForm.controls.goal.updateValueAndValidity({ emitEvent: false });
  }

  private resetConfigurationForm(gamification: GamificationDetail): void {
    this.configurationForm.reset({
      title: gamification.title,
      startAt: toLocalDateTime(gamification.startAt),
      endAt: toLocalDateTime(gamification.endAt),
      goal: gamification.goal,
      valuePrecision: gamification.valuePrecision,
      goalUnit: gamification.goalUnit,
      maxLiveRanking: gamification.maxLiveRanking,
    }, { emitEvent: false });
    this.setGoalValidator(gamification.valuePrecision);
    this.configurationForm.controls.valuePrecision[gamification.ranking.length ? 'disable' : 'enable']({ emitEvent: false });
  }
}

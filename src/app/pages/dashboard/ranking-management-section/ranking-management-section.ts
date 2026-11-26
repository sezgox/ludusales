import { DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { GamificationDetail, RankingEntry, RankingPublication } from '../../../models/gamification';
import { apiErrorMessage } from '../../../services/api-error';
import { GamificationApiService } from '../../../services/gamification-api.service';
import { ImageProcessingService } from '../../../services/image-processing.service';
import { RankingExcelImportService, type ImportedRanking } from '../../../services/ranking-excel-import.service';
import { decimalValidator } from '../dashboard-form.utils';

type CustomFieldControls = { name: FormControl<string>; value: FormControl<string> };
type CustomFieldGroup = FormGroup<CustomFieldControls>;

@Component({
  selector: 'app-ranking-management-section',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './ranking-management-section.html',
  styleUrl: './ranking-management-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingManagementSection {
  private readonly api = inject(GamificationApiService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly imageProcessing = inject(ImageProcessingService);
  private readonly excelImport = inject(RankingExcelImportService);
  private readonly document = inject(DOCUMENT);
  private createHeadersSignature = '';

  readonly gamification = input.required<GamificationDetail>();
  readonly isSuperuser = input.required<boolean>();
  readonly changed = output<void>();
  readonly isSaving = signal(false);
  readonly editingParticipantId = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly createPicture = signal<File | null>(null);
  readonly importFile = signal<File | null>(null);
  readonly preview = signal<{ gamificationId: string; ranking: ImportedRanking } | null>(null);
  readonly publications = signal<RankingPublication[]>([]);
  readonly showPublications = signal(false);
  readonly publicationsLoading = signal(false);
  readonly publicationsError = signal(false);
  readonly latestPublication = computed(() => this.publications().find(({ status }) => status === 'published'));
  readonly canRevert = computed(() => this.publications().filter(({ status }) => status === 'published').length > 1);
  readonly canEdit = computed(() => this.isSuperuser() && !this.gamification().challengeInfo?.rules.length);
  readonly isFull = computed(() => this.gamification().ranking.length >= 1000);
  readonly podiumEntries = computed(() => this.gamification().ranking.slice(0, 3));
  readonly remainingEntries = computed(() => this.gamification().ranking.slice(3));
  readonly rankingFieldHeaders = computed(() => this.gamification().rankingFieldHeaders ?? []);
  readonly participantCustomFields = this.formBuilder.array<CustomFieldGroup>([]);
  readonly editCustomFields = this.formBuilder.array<CustomFieldGroup>([]);
  readonly participantForm = this.formBuilder.group({
    participantCode: ['', [Validators.required, Validators.maxLength(128)]],
    fullName: ['', [Validators.required, Validators.maxLength(160)]],
    score: ['0', Validators.required],
    customFields: this.participantCustomFields,
  });
  readonly editForm = this.formBuilder.group({
    participantCode: ['', [Validators.required, Validators.maxLength(128)]],
    fullName: ['', [Validators.required, Validators.maxLength(160)]],
    score: ['0', Validators.required],
    customFields: this.editCustomFields,
  });

  constructor() {
    const gamificationId = computed(() => this.gamification().publicId);
    effect(() => {
      const id = gamificationId();
      if (this.showPublications()) void this.loadPublications(id);
    });
    effect(() => {
      const gamification = this.gamification();
      const headers = gamification.rankingFieldHeaders ?? [];
      const headersSignature = JSON.stringify(headers);
      this.participantForm.controls.score.setValidators([Validators.required, decimalValidator(gamification.valuePrecision)]);
      this.editForm.controls.score.setValidators([Validators.required, decimalValidator(gamification.valuePrecision)]);
      this.participantForm.controls.score.updateValueAndValidity({ emitEvent: false });
      this.editForm.controls.score.updateValueAndValidity({ emitEvent: false });
      if (this.createHeadersSignature !== headersSignature) {
        this.replaceCustomFields(this.participantForm.controls.customFields, headers, {});
        this.createHeadersSignature = headersSignature;
      }
    });
  }

  selectCreatePicture(event: Event): void {
    const inputElement = event.target;
    this.createPicture.set(inputElement instanceof HTMLInputElement ? (inputElement.files?.[0] ?? null) : null);
  }

  addCreateCustomField(): void { this.participantForm.controls.customFields.push(this.customFieldControl()); }
  addEditCustomField(): void { this.editForm.controls.customFields.push(this.customFieldControl()); }
  removeCreateCustomField(index: number): void { this.participantForm.controls.customFields.removeAt(index); }
  removeEditCustomField(index: number): void { this.editForm.controls.customFields.removeAt(index); }
  isExistingHeader(index: number): boolean { return index < this.rankingFieldHeaders().length; }

  async addParticipant(dialog?: HTMLDialogElement): Promise<void> {
    if (this.participantForm.invalid || this.isFull()) {
      this.participantForm.markAllAsTouched();
      this.feedback.set(this.isFull() ? 'El ranking admite un máximo de 1.000 personas.' : this.validationMessage());
      return;
    }
    const fields = this.customFieldPayload(this.participantForm.controls.customFields.getRawValue());
    if (!fields) return;
    const value = this.participantForm.getRawValue();
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      const participantCode = value.participantCode.trim();
      await firstValueFrom(this.api.upsertRankingEntry(this.gamification().publicId, participantCode, {
        fullName: value.fullName.trim(), score: value.score.trim(), ...fields,
      }));
      this.participantForm.reset({ participantCode: '', fullName: '', score: this.zeroScore() });
      this.replaceCustomFields(this.participantForm.controls.customFields, fields.fieldHeaders, {});
      const picture = this.createPicture();
      this.createPicture.set(null);
      this.changed.emit();
      if (dialog) dialog.close();
      if (picture) {
        try {
          const webp = await this.imageProcessing.toUploadableWebp(picture);
          await firstValueFrom(this.api.uploadRankingParticipantPicture(this.gamification().publicId, participantCode, webp));
          this.changed.emit();
        } catch (error) {
          this.feedback.set(`Participante añadido sin foto. ${apiErrorMessage(error, 'Reintenta la subida.')}`);
        }
      }
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo añadir la persona.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  editParticipant(entry: RankingEntry): void {
    this.editForm.reset({ participantCode: entry.participantCode, fullName: entry.fullName, score: entry.score });
    this.replaceCustomFields(this.editForm.controls.customFields, this.rankingFieldHeaders(), entry.customFields ?? {});
    this.feedback.set(null);
    this.editingParticipantId.set(entry.participantCode);
  }

  cancelEdit(): void { this.editingParticipantId.set(null); this.feedback.set(null); }

  async saveParticipant(entry: RankingEntry): Promise<void> {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.feedback.set(this.validationMessage());
      return;
    }
    const fields = this.customFieldPayload(this.editForm.controls.customFields.getRawValue());
    if (!fields) return;
    const value = this.editForm.getRawValue();
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      await firstValueFrom(this.api.upsertRankingEntry(this.gamification().publicId, value.participantCode.trim(), {
        fullName: value.fullName.trim(), score: value.score.trim(), previousParticipantCode: entry.participantCode, ...fields,
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
    if (!globalThis.confirm(`¿Quitar a “${entry.fullName}” del ranking?`)) return;
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      await firstValueFrom(this.api.deleteRankingEntry(this.gamification().publicId, entry.participantCode));
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo quitar la persona.'));
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
      await firstValueFrom(this.api.uploadRankingParticipantPicture(this.gamification().publicId, entry.participantCode, webp));
      this.changed.emit();
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo subir la foto.'));
    } finally {
      inputElement.value = '';
      this.isSaving.set(false);
    }
  }

  async deletePicture(entry: RankingEntry): Promise<void> {
    if (!globalThis.confirm(`¿Quitar la foto de “${entry.fullName}”?`)) return;
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      await firstValueFrom(this.api.deleteRankingParticipantPicture(this.gamification().publicId, entry.participantCode));
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

  selectImportFile(event: Event): void {
    const inputElement = event.target;
    this.importFile.set(inputElement instanceof HTMLInputElement ? (inputElement.files?.[0] ?? null) : null);
    this.preview.set(null);
    if (inputElement instanceof HTMLInputElement) inputElement.value = '';
  }

  async previewRanking(): Promise<void> {
    const file = this.importFile();
    if (!file || this.isSaving()) return;
    const { publicId, valuePrecision } = this.gamification();
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      const ranking = await this.excelImport.parse(file);
      const isInvalid = decimalValidator(valuePrecision);
      const invalidEntry = ranking.entries.find(({ score }) => isInvalid(new FormControl(score)));
      if (invalidEntry) throw new Error(`Puntuación no válida para ${invalidEntry.fullName}. ${this.validationMessage()}`);
      if (this.gamification().publicId === publicId) this.preview.set({ gamificationId: publicId, ranking });
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo leer el Excel.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async importRanking(): Promise<void> {
    const preview = this.preview();
    if (!preview || preview.gamificationId !== this.gamification().publicId || this.isSaving()) return;
    const { gamificationId, ranking: imported } = preview;
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      const entries = imported.entries.map(({ image: _image, ...entry }) => entry);
      await firstValueFrom(this.api.replaceRanking(gamificationId, entries, imported.fieldHeaders));
      let failedPictures = 0;
      for (const entry of imported.entries) {
        if (!entry.image) continue;
        try {
          const webp = await this.imageProcessing.toUploadableWebp(entry.image);
          await firstValueFrom(this.api.uploadRankingParticipantPicture(gamificationId, entry.participantCode, webp));
        } catch {
          failedPictures += 1;
        }
      }
      this.importFile.set(null);
      this.preview.set(null);
      this.changed.emit();
      if (this.showPublications()) void this.loadPublications(gamificationId);
      this.feedback.set(failedPictures
        ? `Ranking actualizado: ${entries.length} participantes. ${failedPictures} fotos no se pudieron importar.`
        : `Ranking actualizado: ${entries.length} participantes.`);
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo importar el ranking.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async loadPublications(gamificationId = this.gamification().publicId): Promise<void> {
    this.publications.set([]);
    this.publicationsError.set(false);
    this.publicationsLoading.set(true);
    try {
      const items = await firstValueFrom(this.api.rankingPublications(gamificationId));
      if (this.gamification().publicId === gamificationId) this.publications.set(items);
    } catch {
      if (this.gamification().publicId === gamificationId) this.publicationsError.set(true);
    } finally {
      if (this.gamification().publicId === gamificationId) this.publicationsLoading.set(false);
    }
  }

  async revertPublication(publication: RankingPublication, dialog: HTMLDialogElement): Promise<void> {
    const gamificationId = this.gamification().publicId;
    if (publication.publicId !== this.latestPublication()?.publicId || this.isSaving()) return;
    this.isSaving.set(true);
    this.feedback.set(null);
    try {
      await firstValueFrom(this.api.revertRankingPublication(gamificationId, publication.publicId));
      dialog.close();
      this.changed.emit();
      this.feedback.set('Se restauró la publicación anterior.');
      await this.loadPublications(gamificationId);
    } catch (error) {
      dialog.close();
      this.feedback.set(apiErrorMessage(error, 'No se pudo deshacer la publicación.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async downloadTemplate(): Promise<void> {
    const blob = await this.excelImport.template();
    this.saveBlob(blob, 'plantilla-ranking.xlsx');
  }

  async downloadWorkbook(publication: RankingPublication): Promise<void> {
    try {
      const blob = await firstValueFrom(this.api.publicationWorkbook(this.gamification().publicId, publication.publicId));
      this.saveBlob(blob, publication.sourceName ?? 'excel-maestro.xlsx');
    } catch {
      this.feedback.set('No se pudo descargar el Excel original.');
    }
  }

  private saveBlob(blob: Blob, name: string): void {
    const url = globalThis.URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    globalThis.URL.revokeObjectURL(url);
  }

  private customFieldControl(name = '', value = ''): CustomFieldGroup {
    return this.formBuilder.group<CustomFieldControls>({
      name: this.formBuilder.control(name, { validators: [Validators.maxLength(80)] }),
      value: this.formBuilder.control(value, { validators: [Validators.maxLength(500)] }),
    });
  }

  private replaceCustomFields(
    fields: FormArray<CustomFieldGroup>,
    headers: string[],
    values: Record<string, string>,
  ): void {
    fields.clear();
    for (const header of headers) fields.push(this.customFieldControl(header, values[header] ?? ''));
  }

  private customFieldPayload(values: Array<{ name: string; value: string }>): { fieldHeaders: string[]; customFields: Record<string, string> } | null {
    const headers = [...this.rankingFieldHeaders()];
    const seen = new Set(headers.map((header) => header.toLocaleLowerCase('en-US')));
    const customFields: Record<string, string> = {};
    for (const field of values) {
      const name = field.name.trim();
      const value = field.value.trim();
      if (!name && !value) continue;
      const normalized = name.toLocaleLowerCase('en-US');
      if (!name || seen.has(normalized) && !headers.some((header) => header === name)) {
        this.feedback.set('Cada campo adicional necesita un nombre único.');
        return null;
      }
      if (!headers.includes(name)) {
        if (headers.length >= 30) {
          this.feedback.set('El ranking admite un máximo de 30 campos adicionales.');
          return null;
        }
        headers.push(name);
        seen.add(normalized);
      }
      if (value) customFields[name] = value;
    }
    return { fieldHeaders: headers, customFields };
  }

  private validationMessage(): string { return `Usa un nombre y un score no negativo con máximo ${this.gamification().valuePrecision} decimales.`; }
  private zeroScore(): string { const precision = this.gamification().valuePrecision; return precision ? `0.${'0'.repeat(precision)}` : '0'; }
}

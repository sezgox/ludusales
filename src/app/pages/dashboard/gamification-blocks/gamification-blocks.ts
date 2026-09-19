import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { BlockImage, BlockOneCard, BlockOneCardPayload, BlockTwoCard, GamificationDetail } from '../../../models/gamification';
import { apiErrorMessage } from '../../../services/api-error';
import { GamificationApiService } from '../../../services/gamification-api.service';
import { ImageProcessingService } from '../../../services/image-processing.service';
import { RuleIconPicker } from '../../../components/rule-icon-picker/rule-icon-picker';

@Component({
  selector: 'app-gamification-blocks',
  imports: [LucideDynamicIcon, ReactiveFormsModule, RuleIconPicker],
  templateUrl: './gamification-blocks.html',
  styleUrl: './gamification-blocks.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamificationBlocks {
  private readonly api = inject(GamificationApiService);
  private readonly imageProcessing = inject(ImageProcessingService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly gamification = input.required<GamificationDetail>();
  readonly isSuperuser = input.required<boolean>();
  readonly changed = output<void>();
  readonly canEdit = computed(() => this.isSuperuser());
  readonly feedback = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly dragged = signal<{ type: 'one' | 'two'; id: string } | null>(null);
  readonly editingOne = signal<BlockOneCard | null>(null);
  readonly editingTwo = signal<BlockTwoCard | null>(null);
  readonly images = signal<BlockImage[]>([]);
  readonly isLoadingImages = signal(false);
  readonly oneForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    iconName: ['target', Validators.required],
    value: ['', [Validators.required, Validators.maxLength(160)]],
    subvalue: ['', Validators.maxLength(160)],
    hasProgress: [false],
    currentValue: [''],
    maxValue: [''],
  });
  readonly twoForm = this.formBuilder.group({
    imagePublicId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.maxLength(2_000)]],
  });

  openOne(dialog: HTMLDialogElement, card?: BlockOneCard): void {
    this.editingOne.set(card ?? null);
    this.feedback.set(null);
    this.oneForm.reset({
      title: card?.title ?? '', iconName: card?.iconName ?? 'target', value: card?.value ?? '', subvalue: card?.subvalue ?? '',
      hasProgress: card?.progressCurrent !== null && card?.progressMax !== null,
      currentValue: card?.progressCurrent ?? '', maxValue: card?.progressMax ?? '',
    });
    dialog.showModal();
  }

  async saveOne(dialog: HTMLDialogElement): Promise<void> {
    const value = this.oneForm.getRawValue();
    if (this.oneForm.invalid || (value.hasProgress && (!this.validNumber(value.currentValue) || !this.validNumber(value.maxValue) || Number(value.maxValue) <= 0))) {
      this.oneForm.markAllAsTouched();
      this.feedback.set('Revisa los datos de la tarjeta y del progreso.');
      return;
    }
    const payload: BlockOneCardPayload = {
      title: value.title.trim(), iconName: value.iconName, value: value.value.trim(), subvalue: value.subvalue.trim() || null,
      hasProgress: value.hasProgress,
      ...(value.hasProgress ? { currentValue: value.currentValue.trim(), maxValue: value.maxValue.trim() } : {}),
    };
    this.isSaving.set(true); this.feedback.set(null);
    try {
      const card = this.editingOne();
      if (card) await firstValueFrom(this.api.updateBlockOneCard(card.publicId, payload));
      else await firstValueFrom(this.api.createBlockOneCard(this.gamification().publicId, payload));
      dialog.close(); this.changed.emit();
    } catch (error) { this.feedback.set(apiErrorMessage(error, 'No se pudo guardar la tarjeta.')); }
    finally { this.isSaving.set(false); }
  }

  defaultProgressMaximum(): void {
    if (this.oneForm.controls.maxValue.value || !this.validNumber(this.oneForm.controls.value.value)) return;
    this.oneForm.controls.maxValue.setValue(this.oneForm.controls.value.value.trim());
  }

  setOneIcon(iconName: string): void {
    this.oneForm.controls.iconName.setValue(iconName);
  }

  async deleteOne(card: BlockOneCard): Promise<void> {
    if (!globalThis.confirm(`¿Eliminar “${card.title}”?`)) return;
    await this.run(() => firstValueFrom(this.api.deleteBlockOneCard(card.publicId)));
  }

  async openTwo(dialog: HTMLDialogElement, card?: BlockTwoCard): Promise<void> {
    this.editingTwo.set(card ?? null); this.feedback.set(null);
    this.twoForm.reset({ imagePublicId: card?.imagePublicId ?? '', title: card?.title ?? '', description: card?.description ?? '' });
    dialog.showModal();
    if (!this.images().length) await this.loadImages();
  }

  async loadImages(): Promise<void> {
    this.isLoadingImages.set(true);
    try { this.images.set((await firstValueFrom(this.api.listBlockImages())).images); }
    catch (error) { this.feedback.set(apiErrorMessage(error, 'No se pudo cargar la biblioteca de imágenes.')); }
    finally { this.isLoadingImages.set(false); }
  }

  async uploadImage(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
    this.isSaving.set(true); this.feedback.set(null);
    try {
      const image = (await firstValueFrom(this.api.uploadBlockImage(await this.imageProcessing.toUploadableWebp(input.files[0])))).image;
      this.images.update((items) => [image, ...items]);
      this.twoForm.controls.imagePublicId.setValue(image.publicId);
    } catch (error) { this.feedback.set(apiErrorMessage(error, 'No se pudo subir la imagen.')); }
    finally { input.value = ''; this.isSaving.set(false); }
  }

  async saveTwo(dialog: HTMLDialogElement): Promise<void> {
    if (this.twoForm.invalid) { this.twoForm.markAllAsTouched(); this.feedback.set('Selecciona una imagen y completa los textos.'); return; }
    const value = this.twoForm.getRawValue();
    this.isSaving.set(true); this.feedback.set(null);
    try {
      const payload = { imagePublicId: value.imagePublicId, title: value.title.trim(), description: value.description.trim() };
      const card = this.editingTwo();
      if (card) await firstValueFrom(this.api.updateBlockTwoCard(card.publicId, payload));
      else await firstValueFrom(this.api.createBlockTwoCard(this.gamification().publicId, payload));
      dialog.close(); this.changed.emit();
    } catch (error) { this.feedback.set(apiErrorMessage(error, 'No se pudo guardar la tarjeta.')); }
    finally { this.isSaving.set(false); }
  }

  async deleteTwo(card: BlockTwoCard): Promise<void> {
    if (!globalThis.confirm(`¿Eliminar “${card.title}”?`)) return;
    await this.run(() => firstValueFrom(this.api.deleteBlockTwoCard(card.publicId)));
  }

  progress(card: BlockOneCard): number | null {
    if (card.progressCurrent === null || card.progressMax === null) return null;
    const max = Number(card.progressMax); const current = Number(card.progressCurrent);
    return Number.isFinite(max) && max > 0 && Number.isFinite(current) ? Math.max(0, Math.min(100, current / max * 100)) : null;
  }

  percent(card: BlockOneCard): string { return `${Math.round(this.progress(card) ?? 0)}%`; }

  startDrag(type: 'one' | 'two', id: string): void { this.dragged.set({ type, id }); }

  async drop(type: 'one' | 'two', targetId: string): Promise<void> {
    const source = this.dragged(); this.dragged.set(null);
    if (!source || source.type !== type || source.id === targetId) return;
    const cards = type === 'one' ? this.gamification().blockOneCards : this.gamification().blockTwoCards;
    const ids = cards.map((card) => card.publicId); const from = ids.indexOf(source.id); const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await this.run(() => firstValueFrom(type === 'one' ? this.api.reorderBlockOneCards(this.gamification().publicId, ids) : this.api.reorderBlockTwoCards(this.gamification().publicId, ids)));
  }

  async move(type: 'one' | 'two', index: number, offset: number): Promise<void> {
    const cards = type === 'one' ? this.gamification().blockOneCards : this.gamification().blockTwoCards;
    const target = index + offset; if (target < 0 || target >= cards.length) return;
    const ids = cards.map((card) => card.publicId); ids.splice(target, 0, ids.splice(index, 1)[0]);
    await this.run(() => firstValueFrom(type === 'one' ? this.api.reorderBlockOneCards(this.gamification().publicId, ids) : this.api.reorderBlockTwoCards(this.gamification().publicId, ids)));
  }

  private validNumber(value: string): boolean { return /^\d+(?:\.\d+)?$/.test(value.trim()) && Number.isFinite(Number(value)); }
  private async run(operation: () => Promise<unknown>): Promise<void> {
    this.isSaving.set(true); this.feedback.set(null);
    try { await operation(); this.changed.emit(); } catch (error) { this.feedback.set(apiErrorMessage(error, 'No se pudo actualizar el orden.')); }
    finally { this.isSaving.set(false); }
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RichTextEditor } from '../../../components/rich-text-editor/rich-text-editor';
import { GamificationDetail, GamificationPayload, GamificationRule, GamificationStatus } from '../../../models/gamification';
import { RuleEditor, RuleEditorForm } from '../../../components/rule-editor/rule-editor';
import { apiErrorMessage } from '../../../services/api-error';
import { GamificationApiService } from '../../../services/gamification-api.service';
import { RankingManagementSection } from '../ranking-management-section/ranking-management-section';
import { GamificationBlocks } from '../gamification-blocks/gamification-blocks';
import {
  chronologicalDateRangeValidator,
  decimalValidator,
  richTextRequiredValidator,
  toIsoDate,
  toLocalDateTime,
} from '../dashboard-form.utils';

@Component({
  selector: 'app-gamification-section',
  imports: [ReactiveFormsModule, RichTextEditor, RankingManagementSection, RuleEditor, GamificationBlocks],
  templateUrl: './gamification-section.html',
  styleUrl: './gamification-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamificationSection {
  private readonly api = inject(GamificationApiService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly companyPublicId = input.required<string>();
  readonly gamification = input<GamificationDetail | null>(null);
  readonly isSuperuser = input.required<boolean>();
  readonly changed = output<string | null>();
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly isTransitioning = signal(false);
  readonly isActivatingWithEndDate = signal(false);
  readonly createAttempted = signal(false);
  readonly editAttempted = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly createFeedback = signal<string | null>(null);
  readonly createRulesVersion = signal(0);
  readonly editRulesVersion = signal(0);
  readonly canEdit = computed(() => this.isSuperuser());
  readonly createForm = this.formBuilder.group(
    {
      title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(160)]],
      description: ['<p></p>', [Validators.maxLength(20_000), richTextRequiredValidator]],
      startAt: ['', Validators.required],
      endAt: ['', Validators.required],
      goal: [''],
      valuePrecision: [0, [Validators.required, Validators.min(0), Validators.max(6)]],
      goalUnit: ['', Validators.maxLength(40)],
      rules: this.formBuilder.array<RuleEditorForm>([]),
    },
    { validators: chronologicalDateRangeValidator },
  );
  readonly editForm = this.formBuilder.group(
    {
      title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(160)]],
      startAt: ['', Validators.required],
      endAt: ['', Validators.required],
      goal: [''],
      valuePrecision: [0, [Validators.required, Validators.min(0), Validators.max(6)]],
      goalUnit: ['', Validators.maxLength(40)],
      maxLiveRanking: [5, [Validators.required, Validators.min(3), Validators.max(1000)]],
      rules: this.formBuilder.array<RuleEditorForm>([]),
    },
    { validators: chronologicalDateRangeValidator },
  );
  readonly activationForm = this.formBuilder.group({
    endAt: ['', Validators.required],
  });

  constructor() {
    this.createForm.controls.valuePrecision.valueChanges.pipe(takeUntilDestroyed()).subscribe((precision) => {
      this.setGoalValidator(this.createForm.controls.goal, precision);
    });
    this.editForm.controls.valuePrecision.valueChanges.pipe(takeUntilDestroyed()).subscribe((precision) => {
      this.setGoalValidator(this.editForm.controls.goal, precision);
    });
    this.setGoalValidator(this.createForm.controls.goal, 0);
    this.setGoalValidator(this.editForm.controls.goal, 0);

    effect(() => {
      const gamification = this.gamification();

      if (gamification && !this.isEditing()) {
        this.resetEditForm(gamification);
      }
    });
  }

  statusLabel(status: GamificationStatus): string {
    return { draft: 'Borrador', active: 'Activa', inactive: 'Inactiva', closed: 'Inactiva' }[status];
  }

  outcomeLabel(): string {
    const outcome = this.gamification()?.outcome;
    return outcome === 'achieved'
      ? 'Objetivo alcanzado'
      : outcome === 'missed'
        ? 'Objetivo no alcanzado'
        : outcome === 'not_applicable'
          ? 'No aplica'
          : 'Pendiente';
  }

  openCreateDialog(dialog: HTMLDialogElement): void {
    const start = new Date();
    start.setSeconds(0, 0);
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    this.createForm.reset({
      title: '',
      description: '<p></p>',
      startAt: toLocalDateTime(start.toISOString()),
      endAt: toLocalDateTime(end.toISOString()),
      goal: '',
      valuePrecision: 0,
      goalUnit: '',
    });
    this.resetRules(this.createForm.controls.rules, presetRules);
    this.createRulesVersion.update((version) => version + 1);
    this.createFeedback.set(null);
    this.createAttempted.set(false);
    dialog.showModal();
  }

  closeCreateDialog(dialog: HTMLDialogElement): void {
    if (!this.isSaving()) {
      this.createAttempted.set(false);
      this.createFeedback.set(null);
      dialog.close();
    }
  }

  async createGamification(dialog: HTMLDialogElement): Promise<void> {
    this.createAttempted.set(true);
    const payload = this.payloadFromCreateForm();

    if (!payload) {
      this.createForm.markAllAsTouched();
      this.createFeedback.set('Revisa los campos marcados antes de crear el borrador.');
      return;
    }

    this.isSaving.set(true);
    this.createFeedback.set(null);

    try {
      const response = await firstValueFrom(this.api.create(this.companyPublicId(), payload));
      this.createAttempted.set(false);
      dialog.close();
      this.changed.emit(response.gamification.publicId);
    } catch (error) {
      this.createFeedback.set(apiErrorMessage(error, 'No se pudo crear la gamificación.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  edit(): void {
    const gamification = this.gamification();

    if (gamification) {
      this.resetEditForm(gamification);
      this.feedback.set(null);
      this.editAttempted.set(false);
      this.isEditing.set(true);
    }
  }

  cancelEdit(): void {
    const gamification = this.gamification();

    if (gamification) {
      this.resetEditForm(gamification);
    }
    this.feedback.set(null);
    this.editAttempted.set(false);
    this.isEditing.set(false);
  }

  async save(): Promise<void> {
    this.editAttempted.set(true);
    const gamification = this.gamification();
    const payload = this.payloadFromEditForm();

    if (!gamification || !payload) {
      this.editForm.markAllAsTouched();
      this.feedback.set('Revisa los campos marcados antes de guardar.');
      return;
    }

    this.isSaving.set(true);
    this.feedback.set(null);

    try {
      await firstValueFrom(this.api.update(gamification.publicId, payload));
      this.editAttempted.set(false);
      this.isEditing.set(false);
      this.changed.emit(gamification.publicId);
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo guardar la gamificación.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  openActivation(dialog: HTMLDialogElement): void {
    const gamification = this.gamification();

    if (!gamification) return;
    if (Date.parse(gamification.endAt) > Date.now()) {
      void this.activate();
      return;
    }

    const newEnd = new Date();
    newEnd.setDate(newEnd.getDate() + 30);
    newEnd.setSeconds(0, 0);
    this.activationForm.reset({ endAt: toLocalDateTime(newEnd.toISOString()) });
    this.feedback.set(null);
    dialog.showModal();
  }

  async activate(dialog?: HTMLDialogElement): Promise<void> {
    const gamification = this.gamification();

    if (!gamification) return;
    const endAt = dialog ? toIsoDate(this.activationForm.controls.endAt.value) : null;
    if (dialog && (!endAt || endAt <= new Date().toISOString())) {
      this.activationForm.controls.endAt.markAsTouched();
      this.feedback.set('Indica una nueva fecha de fin posterior a este momento.');
      return;
    }

    this.isActivatingWithEndDate.set(Boolean(dialog));
    await this.runTransition(
      () => firstValueFrom(endAt ? this.api.activateWithEndDate(gamification.publicId, endAt) : this.api.activate(gamification.publicId)),
      'No se pudo activar la gamificación.',
    );
    if (!this.feedback() && dialog) dialog.close();
    this.isActivatingWithEndDate.set(false);
  }

  async deactivate(): Promise<void> {
    const gamification = this.gamification();

    if (!gamification || !globalThis.confirm('¿Desactivar la gamificación? Podrás editarla y activarla de nuevo cuando quieras.')) return;
    await this.runTransition(
      () => firstValueFrom(this.api.deactivate(gamification.publicId)),
      'No se pudo desactivar la gamificación.',
    );
  }

  async deleteGamification(): Promise<void> {
    const gamification = this.gamification();

    if (!gamification || !globalThis.confirm('¿Eliminar esta gamificación y todos sus premios y participantes?')) return;
    this.isTransitioning.set(true);
    this.feedback.set(null);

    try {
      await firstValueFrom(this.api.deleteGamification(gamification.publicId));
      this.changed.emit(null);
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, 'No se pudo eliminar la gamificación.'));
    } finally {
      this.isTransitioning.set(false);
    }
  }

  refreshRanking(): void {
    const gamification = this.gamification();
    if (gamification) this.changed.emit(gamification.publicId);
  }

  private async runTransition(operation: () => Promise<unknown>, fallback: string): Promise<void> {
    this.isTransitioning.set(true);
    this.feedback.set(null);

    try {
      await operation();
      this.changed.emit(this.gamification()?.publicId ?? null);
    } catch (error) {
      this.feedback.set(apiErrorMessage(error, fallback));
    } finally {
      this.isTransitioning.set(false);
    }
  }

  private payloadFromCreateForm(): GamificationPayload | null {
    if (this.createForm.invalid) return null;
    const value = this.createForm.getRawValue();
    return this.buildPayload(value.title, value.description, value.startAt, value.endAt, value.goal, value.valuePrecision, value.goalUnit, value.rules);
  }

  private payloadFromEditForm(): Partial<GamificationPayload> | null {
    if (this.editForm.invalid) return null;
    const value = this.editForm.getRawValue();
    const payload = this.buildPayload(value.title, '', value.startAt, value.endAt, value.goal, value.valuePrecision, value.goalUnit, value.rules);

    if (!payload) return null;
    const { description: _description, ...editablePayload } = payload;
    return { ...editablePayload, maxLiveRanking: value.maxLiveRanking };
  }

  private buildPayload(
    title: string,
    description: string,
    startAtValue: string,
    endAtValue: string,
    goal: string,
    valuePrecision: number,
    goalUnit: string,
    rules: GamificationRule[],
  ): GamificationPayload | null {
    const startAt = toIsoDate(startAtValue);
    const endAt = toIsoDate(endAtValue);

    if (!startAt || !endAt || endAt <= startAt) return null;
    const normalizedRules = this.normalizeRules(rules);
    if (!normalizedRules) return null;
    return {
      title: title.trim(),
      description,
      startAt,
      endAt,
      goal: goal.trim() || null,
      valuePrecision,
      goalUnit: goalUnit.trim() || null,
      rules: normalizedRules,
    };
  }

  private resetEditForm(gamification: GamificationDetail): void {
    this.editForm.reset({
      title: gamification.title,
      startAt: toLocalDateTime(gamification.startAt),
      endAt: toLocalDateTime(gamification.endAt),
      goal: gamification.goal ?? '',
      valuePrecision: gamification.valuePrecision,
      goalUnit: gamification.goalUnit ?? '',
      maxLiveRanking: gamification.maxLiveRanking,
    });
    this.resetRules(this.editForm.controls.rules, gamification.rules);
    this.editRulesVersion.update((version) => version + 1);
    this.editForm.controls.valuePrecision[gamification.ranking.length ? 'disable' : 'enable']({ emitEvent: false });
  }

  private setGoalValidator(control: typeof this.createForm.controls.goal, precision: number): void {
    control.setValidators([decimalValidator(precision)]);
    control.updateValueAndValidity({ emitEvent: false });
  }

  showCreateError(control: AbstractControl): boolean {
    return this.createAttempted() && control.invalid;
  }

  showEditError(control: AbstractControl): boolean {
    return this.editAttempted() && control.invalid;
  }

  showCreateDateRangeError(): boolean {
    return this.createAttempted() && this.createForm.hasError('dateRange');
  }

  showEditDateRangeError(): boolean {
    return this.editAttempted() && this.editForm.hasError('dateRange');
  }

  private resetRules(rules: FormArray<RuleEditorForm>, values: GamificationRule[]): void {
    rules.clear({ emitEvent: false });
    for (const rule of values) rules.push(this.createRuleForm(rule), { emitEvent: false });
  }

  private createRuleForm(rule: GamificationRule): RuleEditorForm {
    return this.formBuilder.group({
      position: [rule.position, [Validators.required, Validators.min(1)]],
      title: [rule.title, [Validators.required, Validators.pattern(/\S/), Validators.maxLength(160)]],
      description: [rule.description, [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2_000)]],
      iconName: [rule.iconName, [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    });
  }

  private normalizeRules(rules: GamificationRule[]): GamificationRule[] | null {
    const normalized = rules.map((rule, index) => ({
      position: index + 1,
      title: rule.title.trim(),
      description: rule.description.trim(),
      iconName: rule.iconName,
    }));
    for (const rule of normalized) if (!rule.title || !rule.description) return null;
    return normalized;
  }
}

const presetRules: GamificationRule[] = [
  { position: 1, title: 'Ventas cerradas', description: 'Suma puntos por cada venta realizada.', iconName: 'chart-column' },
  { position: 2, title: 'Productos estratégicos', description: 'Multiplica tus puntos al vender productos clave.', iconName: 'award' },
  { position: 3, title: 'Calidad y satisfacción', description: 'Las encuestas y la calidad también cuentan.', iconName: 'star' },
];

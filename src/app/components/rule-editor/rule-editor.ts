import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { RuleIconPicker } from '../rule-icon-picker/rule-icon-picker';

export type RuleEditorForm = FormGroup<{
  position: FormControl<number>;
  title: FormControl<string>;
  description: FormControl<string>;
  iconName: FormControl<string>;
}>;

@Component({
  selector: 'app-rule-editor',
  imports: [ReactiveFormsModule, LucideDynamicIcon, RuleIconPicker],
  templateUrl: './rule-editor.html',
  styleUrl: './rule-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleEditor {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly rules = input.required<FormArray<RuleEditorForm>>();
  readonly revision = input(0);
  readonly editingIndex = signal<number | null>(null);
  readonly draggedIndex = signal<number | null>(null);
  readonly editorForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2_000)]],
    iconName: ['star', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
  });

  openEdit(index: number, dialog: HTMLDialogElement): void {
    const rule = this.rules().at(index).getRawValue();
    this.editingIndex.set(index);
    this.editorForm.reset(rule);
    dialog.showModal();
  }

  closeEdit(dialog: HTMLDialogElement): void {
    this.editingIndex.set(null);
    dialog.close();
  }

  saveEdit(dialog: HTMLDialogElement): void {
    const index = this.editingIndex();

    if (index === null || this.editorForm.invalid) {
      this.editorForm.markAllAsTouched();
      return;
    }

    const value = this.editorForm.getRawValue();
    this.rules().at(index).patchValue({
      title: value.title.trim(),
      description: value.description.trim(),
      iconName: value.iconName,
    });
    this.closeEdit(dialog);
  }

  addRule(dialog: HTMLDialogElement): void {
    const rules = this.rules();
    rules.push(this.createRule(rules.length + 1));
    this.openEdit(rules.length - 1, dialog);
  }

  removeEditingRule(dialog: HTMLDialogElement): void {
    const index = this.editingIndex();

    if (index === null) return;
    this.rules().removeAt(index);
    this.updatePositions();
    this.closeEdit(dialog);
  }

  startDrag(index: number, event: DragEvent): void {
    this.draggedIndex.set(index);
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  drop(index: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.draggedIndex();
    this.draggedIndex.set(null);

    if (from === null || from === index) return;
    const rules = this.rules();
    const control = rules.at(from);
    rules.removeAt(from);
    rules.insert(index, control);
    this.updatePositions();
  }

  endDrag(): void {
    this.draggedIndex.set(null);
  }

  setIcon(iconName: string): void {
    this.editorForm.controls.iconName.setValue(iconName);
  }

  private createRule(position: number): RuleEditorForm {
    return this.formBuilder.group({
      position: [position, [Validators.required, Validators.min(1)]],
      title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(160)]],
      description: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2_000)]],
      iconName: ['star', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    });
  }

  private updatePositions(): void {
    this.rules().controls.forEach((control, index) => control.controls.position.setValue(index + 1));
  }
}

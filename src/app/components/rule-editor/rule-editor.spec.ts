import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { icons, isLucideIconComponent, provideLucideIcons } from '@lucide/angular';
import { RuleEditor, RuleEditorForm } from './rule-editor';

describe('RuleEditor', () => {
  let fixture: ComponentFixture<RuleEditor>;
  let component: RuleEditor;
  let rules: FormArray<RuleEditorForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleEditor],
      providers: [provideLucideIcons(...Object.values(icons).filter(isLucideIconComponent))],
    }).compileComponents();

    rules = new FormArray([rule(1, 'Primera'), rule(2, 'Segunda'), rule(3, 'Tercera')]);
    fixture = TestBed.createComponent(RuleEditor);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rules', rules);
    fixture.detectChanges();
  });

  it('shows pencil controls and a final add placeholder', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.rule-card__edit')).toHaveLength(3);
    expect(element.querySelector('.add-rule-placeholder')?.textContent).toContain('Añadir regla');
  });

  it('reorders rules by dragging and persists their sequential positions', () => {
    component.startDrag(0, {} as DragEvent);
    component.drop(2, { preventDefault: () => undefined } as DragEvent);

    expect(rules.getRawValue().map(({ title, position }) => ({ title, position }))).toEqual([
      { title: 'Segunda', position: 1 },
      { title: 'Tercera', position: 2 },
      { title: 'Primera', position: 3 },
    ]);
  });

  it('edits a rule in a modal without exposing its position', () => {
    component.openEdit(1, { showModal: () => undefined } as HTMLDialogElement);

    expect(component.editorForm.controls.title.value).toBe('Segunda');
    expect(component.editorForm.contains('position')).toBe(false);
  });
});

function rule(position: number, title: string): RuleEditorForm {
  return new FormGroup({
    position: new FormControl(position, { nonNullable: true }),
    title: new FormControl(title, { nonNullable: true }),
    description: new FormControl(`${title} descripción`, { nonNullable: true }),
    iconName: new FormControl('star', { nonNullable: true }),
  });
}
